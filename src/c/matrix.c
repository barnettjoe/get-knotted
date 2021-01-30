#include <math.h>
#include <stdio.h>
#include <stdlib.h>

#define ANSI_COLOR_RED "\x1b[31m"
#define ANSI_COLOR_GREEN "\x1b[32m"
#define ANSI_COLOR_RESET "\x1b[0m"

void report_test_failure(char* text)

{
    printf(ANSI_COLOR_RED);
    printf("test failed: ");
    puts(text);
    printf(ANSI_COLOR_RESET);
}

void report_test_success(char* text)
{
    printf(ANSI_COLOR_GREEN);
    printf("test passed: ");
    puts(text);
    printf(ANSI_COLOR_RESET);
}

void* allocate_matrix(int rows, int cols)
{
    return malloc(rows * sizeof(float[cols]));
}

void print_matrix(int row_count, int col_count, float matrix[row_count][col_count])
{
    for (int i = 0; i < row_count; i++) {
        for (int j = 0; j < col_count; j++) {
            printf("%f ", matrix[i][j]);
        }
        printf("\n");
    }
    printf("\n");
}

void print_array(int count, float array[count])
{
    for (int i = 0; i < count; i++) {
        printf("%f ", array[i]);
    }
    printf("\n");
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
  Given a unit-lower-triangular matrix L, a unit-upper-triangular matrix U,
  a permutation matrix P (represented by a 1d array called pi), and a vector b,
  such that LUx = Pb, solve for the vector x.
  See CLRS 2nd Edition, chapter 28.
*/
void solve_lup(
    int b_rows,
    float L[b_rows][b_rows],
    float U[b_rows][b_rows],
    int pi[b_rows],
    float b[b_rows],
    float result[b_rows])
{
    // We have LUx = Pb
    // Let y = Ux, so that Ly = Pb
    float y[b_rows];
    // Obtain y by forward substitution
    // then obtain x by backward substitution
}

void expectToBeCloseTo(float actualVal, float expectedVal)
{
    float errorThreshold = 0.0005;
    float diff = fabsf(actualVal - expectedVal);
    if (diff > errorThreshold) {
        report_test_failure("value was outside floating point error threshold");
    }
}

void expectMatrixCloseTo() { }

int matrix()
{
    int start_matrix_rows = 2;
    int start_matrix_cols = 3;
    float start_matrix[][3] = { { 1, 2, 3 }, { 4, 5, 6 } };
    print_matrix(start_matrix_rows, start_matrix_cols, start_matrix);

    // test transposition
    float(*transposed_matrix)[] = allocate_matrix(start_matrix_cols, start_matrix_rows);
    transpose(start_matrix_rows, start_matrix_cols, start_matrix, transposed_matrix);
    print_matrix(start_matrix_cols, start_matrix_rows, transposed_matrix);
    free(transposed_matrix);

    // test multiplication;
    int matrix_a_rows = 2;
    int matrix_a_cols = 3;
    int matrix_b_rows = 3;
    int matrix_b_cols = 2;
    float matrix_a[][3] = { { 0, 3, 5 }, { 5, 5, 2 } };
    float matrix_b[][2] = { { 3, 4 }, { 3, -2 }, { 4, -2 } };
    float(*mult_result)[] = allocate_matrix(matrix_a_rows, matrix_b_cols);
    multiply(matrix_a_rows, matrix_a_cols, matrix_b_rows, matrix_b_cols, matrix_a, matrix_b, mult_result);
    print_matrix(matrix_a_rows, matrix_b_cols, mult_result);
    free(mult_result);

    // test forward substitution
    int b_rows = 3;
    float L[][3] = { { 1, 0, 0 }, { 0.2, 1, 0 }, { 0.6, 0.5, 1 } };
    int pi[] = { 2, 0, 1 };
    float b[] = { 3, 7, 8 };
    float* y = malloc(b_rows * sizeof(float));
    forward_substitution(b_rows, L, pi, b, y);
    print_array(b_rows, y);
    free(y);
    return 0;
}
