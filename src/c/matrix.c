#include <stdio.h>
#include <stdlib.h>

void print_matrix(float* matrix, int row_count, int col_count)
{
    int row_size = col_count;
    for (int i = 0; i < row_count; i++) {
        for (int j = 0; j < col_count; j++) {
            printf("%f ", matrix[i * row_size + j]);
        }
        printf("\n");
    }
}

float* allocate_matrix(int row_count, int col_count)
{
    return malloc(row_count * col_count * sizeof(float));
}

float* transpose(float* matrix, int row_count, int col_count)
{
    float* result = allocate_matrix(col_count, row_count);
    for (int row_idx = 0; row_idx < row_count; row_idx++) {
        for (int col_idx = 0; col_idx < col_count; col_idx++) {
            result[col_idx * row_count + row_idx] = matrix[row_idx * col_count + col_idx];
        }
    }
    return result;
}

int matrix()
{
    float m[2][3] = {
        { 1, 2, 3 },
        { 4, 5, 6 }
    };
    print_matrix(m, 2, 3);
    puts("\n");
    float* transposed_matrix = transpose(m, 2, 3);
    print_matrix(transposed_matrix, 3, 2);
    free(transposed_matrix);
    return 0;
}
