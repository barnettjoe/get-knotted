#include <stdio.h>
#include <stdlib.h>

static int length = 10000;

int* range()
{
    int* arr = malloc(length * sizeof(int));
    int i;
    for (i = 0; i < length; i++) {
        arr[i] = i;
    }
    return arr;
}

int matrix()
{
    int* arr = range();
    int i;
    for (i = 0; i < length; i++) {
        printf("%d\n", arr[i]);
    }
    free(arr);
    return 0;
}
