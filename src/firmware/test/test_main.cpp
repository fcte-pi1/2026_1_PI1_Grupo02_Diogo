#include <unity.h>

// Uma função simples que simula uma lógica do seu projeto
int calcular_bateria(int leitura_adc) {
    return leitura_adc / 40; 
}

void setUp(void) {
    // Roda antes de cada teste (ex: inicializar variáveis)
}

void tearDown(void) {
    // Roda depois de cada teste (ex: limpar memória)
}

// O teste em si
void test_calculo_bateria_esperado(void) {
    TEST_ASSERT_EQUAL_INT(100, calcular_bateria(4000));
}

int main(int argc, char **argv) {
    UNITY_BEGIN();
    RUN_TEST(test_calculo_bateria_esperado);
    UNITY_END();
    return 0;
}