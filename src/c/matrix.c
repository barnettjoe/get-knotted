#include <math.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

void* allocate_matrix(int rows, int cols)
{
    return malloc(rows * sizeof(float[cols]));
}

void transpose(
    int row_count,
    int col_count,
    float matrix[row_count][col_count],
    float result[col_count][row_count])
{
    for (int row_idx = 0; row_idx < row_count; row_idx++) {
        for (int col_idx = 0; col_idx < col_count; col_idx++) {
            result[col_idx][row_idx] = matrix[row_idx][col_idx];
        }
    }
}

// We could define multiplication in terms of dot products of rows of A
// with cols of B, or in terms of dot products of rows of A with rows of the transpose of B...
// but that would require some copying of data. This should be a bit faster (although I haven't actually
// tested that...)
// This is the basic On3 algorithm. It would be worth trying Strassen instead to see if the improvement is significant.
// There are also multi-threaded algos in CLRS which we could explore if needs be.
// There are also the galactic algos e.g. coppersmith-winograd which we can safely ignore...
// NB. numeric.js takes its matrix multiplication method from the google closure library, which is just the simple On3 algo.
void multiply(
    int a_rows,
    int a_cols,
    int b_rows,
    int b_cols,
    float a[a_rows][a_cols],
    float b[b_rows][b_cols],
    float result[a_rows][b_cols])
{
    if (a_cols != b_rows) {
        puts("row count of matrix A does not match column count of matrix B");
        exit(1);
    }
    for (int a_row_idx = 0; a_row_idx < a_rows; a_row_idx++) {
        for (int b_col_idx = 0; b_col_idx < b_cols; b_col_idx++) {
            float val = 0;
            for (int a_col_idx = 0; a_col_idx < a_cols; a_col_idx++) {
                val += a[a_row_idx][a_col_idx] * b[a_col_idx][b_col_idx];
            }
            result[a_row_idx][b_col_idx] = val;
        }
    }
}

/*
  Given a upper-triangular matrix U (not necessarily unit-upper) and
  a vector y such that Ux = y,  solve for the vector x by backward-substitution.
*/
void backward_substitution(
    int x_rows,
    float U[x_rows][x_rows],
    float y[x_rows],
    float result[x_rows])
{
    for (int i = x_rows - 1; i >= 0; i--) {
        float sum = 0;
        for (int j = i + 1; j < x_rows; j++) {
            sum += U[i][j] * result[j];
        }
        result[i] = (y[i] - sum) / U[i][i];
    }
}

/*
  Given a unit-lower-triangular matrix L, a permutation matrix P (represented
  by a 1d array called pi), and a vector b, such that Ly = Pb, solve for the vector y
  by forward substitution.
*/
void forward_substitution(
    int b_rows,
    float L[b_rows][b_rows],
    int pi[b_rows],
    float b[b_rows],
    float result[b_rows])
{
    for (int i = 0; i < b_rows; i++) {
        float sum = 0;
        for (int j = 0; j < i; j++) {
            sum += L[i][j] * result[j];
        }
        result[i] = b[pi[i]] - sum;
    }
}

/*
  Given a matrix A, find a unit-lower-triangular matrix L, an upper-triangular matrix U,
  and a permutation matrix P (in its column representation), such that:
  PA = LU
*/
void LUP_decomposition(
    int a_rows,
    float A[a_rows][a_rows],
    float L_result[a_rows][a_rows],
    float U_result[a_rows][a_rows],
    int P_result[a_rows])
{
    for (int i = 0; i < a_rows; i++) {
        // initialize the permutation array
        // TODO - I think in our case we don't particularly care about the permutation matrix -
        // it doesn't make a difference to the solution of our set of simultaneous eqns. That's
        // not to say we don't need to permute - we need to pivot to avoid dividing by zero. But
        // we don't really need to keep track of where we have pivoted. Tracking the permutation matrix
        // probably has a negligible performance impact though, so we'll just do it anyway for now.
        P_result[i] = i;
        // initialize the unit-lower-triangular and upper-triangular result matrices
        for (int j = 0; j < a_rows; j++) {
            L_result[i][j] = i == j ? 1 : 0;
            U_result[i][j] = 0;
        }
    }
    // This outer for-loop implements the tail-recursion.
    for (int outer_row_idx = 0; outer_row_idx < a_rows; outer_row_idx++) {
        // Find the greatest absolute value in the leftmost column and use that
        // as the pivot point.
        float max_abs_value = 0;
        int pivot_row = 0;
        for (int row_idx = outer_row_idx; row_idx < a_rows; row_idx++) {
            float abs_value = fabsf(A[row_idx][outer_row_idx]);
            if (abs_value > max_abs_value) {
                max_abs_value = abs_value;
                pivot_row = row_idx;
            }
        }
        if (max_abs_value == 0) {
            puts("can't get LUP decomposition of a singular matrix");
            exit(1);
        }
        // record pivot points in the permutation array
        int swap = P_result[outer_row_idx];
        P_result[outer_row_idx] = P_result[pivot_row];
        P_result[pivot_row] = swap;
        // pivot the matrix (i.e. swap rows around)
        for (int j = 0; j < a_rows; j++) {
            float swap = A[outer_row_idx][j];
            A[outer_row_idx][j] = A[pivot_row][j];
            A[pivot_row][j] = swap;
        }
        float pivot_value = A[outer_row_idx][outer_row_idx];
        for (int i = outer_row_idx + 1; i < a_rows; i++) {
            // compute the column vector v
            float column_vector_value = A[i][outer_row_idx] / pivot_value;
            A[i][outer_row_idx] = column_vector_value;
            // compute a row of the Schur complement
            for (int j = outer_row_idx + 1; j < a_rows; j++) {
                float row_vector_value = A[outer_row_idx][j];
                // To compute each element of the Schur complement,
                // subtract the value of the outer product of the v and w
                // at that position. N.B. column_vector has already been
                // divided by the pivot value, so we don't need to divide
                // again here.
                A[i][j] -= column_vector_value * row_vector_value;
            }
        }
    }
    // so far we have done our work in-place, now split results from mutated A into L and U
    for (int i = 0; i < a_rows; i++) {
        for (int j = 0; j < a_rows; j++) {
            (i > j ? L_result : U_result)[i][j] = A[i][j];
        }
    }
}

/*
  Given a matrix A and a vector b, such that Ax = b, solve for x
*/
void solve(
    int a_rows,
    float A[a_rows][a_rows],
    float b[a_rows],
    float x_result[a_rows])
{
}