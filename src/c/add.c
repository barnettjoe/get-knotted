#include <stdio.h>
#include <stdlib.h>

int *add(short inputArray[])
{
  // log out the the values from inputArray
  for (int i = 0; i < 5; i++) {
    printf("%d\n", inputArray[i]);
  }
  // send another array back to JS-land
  int *array = malloc(5 * sizeof(int));
  for (int i = 0; i < 5; i++) {
    array[i] = i;
  }
  return array;
}
