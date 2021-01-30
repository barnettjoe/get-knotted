#include <math.h>
#include <stdbool.h>
#include <stdio.h>

#define ANSI_COLOR_RED "\x1b[31m"
#define ANSI_COLOR_GREEN "\x1b[32m"
#define ANSI_COLOR_RESET "\x1b[0m"

static float errorThreshold = 0.0005;

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

void expectToBeCloseTo(float actualVal, float expectedVal)
{
    float diff = fabsf(actualVal - expectedVal);
    if (diff > errorThreshold) {
        report_test_failure("value was outside floating point error threshold");
    }
}

bool isCloseTo(float a, float b)
{
    float diff = fabsf(a - b);
    return (diff > errorThreshold);
}
