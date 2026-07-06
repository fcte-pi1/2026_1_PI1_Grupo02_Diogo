#include <unity.h>
#include "../lib/output/motor/correcao_parede.h"

void test_parede_so_na_esquerda_correge_para_direita(void)
{
    int pwmEsq = 140;
    int pwmDir = 140;

    aplicarCorrecaoParede(2.0f, 8.0f, pwmEsq, pwmDir, false);

    TEST_ASSERT_EQUAL(128, pwmEsq);
    TEST_ASSERT_EQUAL(152, pwmDir);
}

void test_parede_so_na_direita_correge_para_esquerda(void)
{
    int pwmEsq = 140;
    int pwmDir = 140;

    aplicarCorrecaoParede(8.0f, 2.0f, pwmEsq, pwmDir, false);

    TEST_ASSERT_EQUAL(152, pwmEsq);
    TEST_ASSERT_EQUAL(128, pwmDir);
}

void test_sem_parede_nao_correge(void)
{
    int pwmEsq = 140;
    int pwmDir = 140;

    aplicarCorrecaoParede(6.0f, 6.0f, pwmEsq, pwmDir, false);

    TEST_ASSERT_EQUAL(140, pwmEsq);
    TEST_ASSERT_EQUAL(140, pwmDir);
}

void setUp(void) {}
void tearDown(void) {}

int main(int argc, char **argv)
{
    UNITY_BEGIN();
    RUN_TEST(test_parede_so_na_esquerda_correge_para_direita);
    RUN_TEST(test_parede_so_na_direita_correge_para_esquerda);
    RUN_TEST(test_sem_parede_nao_correge);
    UNITY_END();
    return 0;
}
