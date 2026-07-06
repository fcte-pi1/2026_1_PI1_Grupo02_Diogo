#include <cassert>
#include <iostream>
#include "../lib/output/motor/correcao_parede.h"

int main()
{
    int pwmEsq = 140;
    int pwmDir = 140;

    aplicarCorrecaoParede(2.0f, 8.0f, pwmEsq, pwmDir, false);
    assert(pwmEsq == 128);
    assert(pwmDir == 152);
    std::cout << "Caso parede a esquerda: OK" << std::endl;

    pwmEsq = 140;
    pwmDir = 140;
    aplicarCorrecaoParede(8.0f, 2.0f, pwmEsq, pwmDir, false);
    assert(pwmEsq == 152);
    assert(pwmDir == 128);
    std::cout << "Caso parede a direita: OK" << std::endl;

    pwmEsq = 140;
    pwmDir = 140;
    aplicarCorrecaoParede(6.0f, 6.0f, pwmEsq, pwmDir, false);
    assert(pwmEsq == 140);
    assert(pwmDir == 140);
    std::cout << "Caso sem parede: OK" << std::endl;

    std::cout << "Todos os testes passaram." << std::endl;
    return 0;
}
