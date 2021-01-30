#include <stdio.h>
#include <stdlib.h>

// modern C compilers let you pass a matrix with variable lengths, provided you also pass the lengths https://stackoverflow.com/a/10874681/9011089
// NB the length args must be passed before the matrix arg
float get_value(int row_count, int col_count, int row_idx, int col_idx, float matrix[row_count][col_count])
{
    return matrix[row_idx][col_idx];
}

void print_matrix(int row_count, int col_count, float matrix[row_count][col_count])
{
    for (int i = 0; i < row_count; i++) {
        for (int j = 0; j < col_count; j++) {
            printf("%f ", matrix[i][j]);
        }
        printf("\n");
    }
}

// float* allocate_matrix(int row_count, int col_count)
// {
//     return malloc(row_count * col_count * sizeof(float));
// }

void transpose(int row_count, int col_count, float matrix[row_count][col_count], float result[col_count][row_count])
{
    for (int row_idx = 0; row_idx < row_count; row_idx++) {
        for (int col_idx = 0; col_idx < col_count; col_idx++) {
            result[col_idx][row_idx] = matrix[row_idx][col_idx];
        }
    }
}

// // We could define multiplication in terms of dot products of rows of A
// // with cols of B, or in terms of dot products of rows of A with rows of the transpose of B...
// // but that would require some copying of data. This should be a bit faster (although I haven't actually
// // tested that...)
// // float* multiply(float* a, int a_rows, int a_cols, float* b, int b_rows, int b_cols)
// // {
// //     if (a_cols != b_rows) {
// //         puts("row count of matrix A does not match column count of matrix B");
// //         exit(1);
// //     }
// //     float* result = allocate_matrix(a_rows, b_cols);
// //     for (int a_row_idx = 0; a_row_idx < a_rows; a_row_idx++) {
// //         for (int b_col_idx = 0; b_col_idx < b_cols; b_col_idx++) {
// //             float val = 0;
// //             for (int a_col_idx = 0; a_col_idx < a_cols; a_col_idx++) {
// //                 val += get_value(a, a_cols, a_row_idx, a_col_idx) * get_value(b, b_cols, a_col_idx, b_col_idx);
// //             }
// //             set_value(result, b_cols, a_row_idx, b_col_idx, val);
// //         }
// //     }
// //     return result;
// // }

int matrix()
{
    int start_matrix_rows = 2;
    int start_matrix_cols = 3;
    float start_matrix[][3] = { { 1, 2, 3 }, { 4, 5, 6 } };
    print_matrix(start_matrix_rows, start_matrix_cols, start_matrix);

    // test transposition
    float(*result_matrix)[] = malloc(start_matrix_rows * sizeof(float[start_matrix_cols]));
    transpose(start_matrix_rows, start_matrix_cols, start_matrix, result_matrix);
    print_matrix(start_matrix_cols, start_matrix_rows, result_matrix);
    free(result_matrix);

    // test multiplication

    // float[3][2] transposed_matrix = transpose(2, 3, m);
    // print_matrix(transposed_matrix, 3, 2);
    // printf("%f\n", get_value(transposed_matrix, 2, 1, 1));
    // free(transposed_matrix);
    // test multiplication
    // float a[2][2] = {
    //     { 1, 7 },
    //     { 2, 4 }
    // };
    // float b[2][2] = {
    //     { 3, 3 },
    //     { 5, 2 }
    // };
    // float* mult_result = multiply(a, 2, 2, b, 2, 2);
    // print_matrix(mult_result);
    // free(mult_result);
    return 0;
}
