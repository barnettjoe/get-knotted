#include <stdio.h>

void print_matrix(float** m, int rows, int cols)
{
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            printf("%f ", m[i][j]);
        }
        printf("\n");
    }
}

int matrix()
{
    float first_row[] = { 1, 2, 3 };
    float second_row[] = { 4, 5, 6 };
    float* matrix[2];
    matrix[0] = first_row;
    matrix[1] = second_row;
    print_matrix(matrix, 2, 3);
    return 0;
}
