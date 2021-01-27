#include <stdio.h>
#include <stdlib.h>

void print_matrix(float** matrix, int row_count, int col_count)
{
    for (int i = 0; i < row_count; i++) {
        for (int j = 0; j < col_count; j++) {
            printf("%f ", matrix[i][j]);
        }
        printf("\n");
    }
}

float** allocate_matrix(int row_count, int col_count)
{
    return malloc(row_count * sizeof(float*));
}

void free_matrix(float** matrix, int row_count)
{
    for (int i = 0; i < row_count; i++) {
        free(matrix[i]);
    }
    free(matrix);
}

float** transpose(float** matrix, int row_count, int col_count)
{
    int result_row_count = col_count;
    int result_col_count = row_count;
    float** result = allocate_matrix(result_row_count, result_col_count);
    // create the new empty rows
    for (int col_idx = 0; col_idx < col_count; col_idx++) {
        float* row = malloc(result_col_count * sizeof(float*));
        result[col_idx] = row;
    }
    // fill the new rows
    for (int row_idx = 0; row_idx < row_count; row_idx++) {
        for (int col_idx = 0; col_idx < col_count; col_idx++) {
            result[col_idx][row_idx] = matrix[row_idx][col_idx];
        }
    }
    return result;
}

int matrix()
{
    float first_row[] = { 1, 2, 3 };
    float second_row[] = { 4, 5, 6 };
    float* matrix[2];
    matrix[0] = first_row;
    matrix[1] = second_row;
    print_matrix(matrix, 2, 3);
    puts("\n");
    float** transposed_matrix = transpose(matrix, 2, 3);
    print_matrix(transposed_matrix, 3, 2);
    free_matrix(transposed_matrix, 3);
    return 0;
}
