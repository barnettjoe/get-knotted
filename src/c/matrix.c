#include <stdio.h>
#include <stdlib.h>

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

void transpose(int row_count, int col_count, float matrix[row_count][col_count], float result[col_count][row_count])
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
void multiply(int a_rows, int a_cols, int b_rows, int b_cols, float a[a_rows][a_cols], float b[b_rows][b_cols], float result[a_rows][b_cols])
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

void* allocate_matrix(int rows, int cols)
{
    return malloc(rows * sizeof(float[cols]));
}

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
    return 0;
}
