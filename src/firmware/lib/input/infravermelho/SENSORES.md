# Sensores de Distância ToF — Documentação de Hardware e Código

> **Módulo:** `lib/input/infravermelho/`
> **Sensores:** 1× VL6180X (frente) + 2× VL53L0X (esquerda e direita) + 1× INA219 (energia)
> **Barramento:** Wire1 (I2C1) para os ToF · Wire (I2C0) para o INA219

---

## 1. Por que dois barramentos I2C separados?

O ESP32 expõe **dois controladores I2C de hardware** independentes (`Wire` e `Wire1`).
A decisão de separá-los evita que uma leitura lenta do INA219 (que usa polling no loop principal a 1 Hz) bloqueie o barramento dos sensores ToF, que são lidos a cada passo do DFS.

| Bus | Pinos | Dispositivos | Clock |
|---|---|---|---|
| `Wire` (I2C0) | SDA=**18** · SCL=**17** | INA219 @0x40 | 100 kHz |
| `Wire1` (I2C1) | SDA=**21** · SCL=**22** | VL6180X @0x29 · VL53L0X-E @0x30 · VL53L0X-D @0x31 | 400 kHz |

> **Nota:** O SCL do Wire1 foi movido do GPIO 19 (pinout antigo) para o **GPIO 22**, que estava livre e é o pino padrão do ESP32 para I2C1 SCL, reduzindo chance de conflito com outros periféricos.

---

## 2. O Problema dos Endereços I2C Duplicados

Todos os três sensores ToF saem de fábrica com o **mesmo endereço I2C: `0x29`**. Colocá-los no mesmo barramento sem distinção causa colisão e leituras corrompidas.

### Solução: pinos XSHUT + reendereçamento em runtime

Tanto o VL53L0X quanto o VL6180X possuem um pino de **shutdown** (`XSHUT` / `CE`):
- `LOW` → sensor desativado (não responde no barramento)
- `HIGH` → sensor ativo

A sequência de inicialização aproveita isso para atribuir endereços únicos **sem nenhum componente extra** (sem multiplexador TCA9548A):

```
1. XSHUT_ESQ = LOW, XSHUT_DIR = LOW   ← ambos os VL53L0X desligados
2. Wire1.begin(21, 22)
3. Init VL6180X @0x29                  ← único no bus, sem colisão
4. XSHUT_ESQ = HIGH + delay(10ms)
5. VL53L0X_esq.init() → setAddress(0x30)
6. XSHUT_DIR = HIGH + delay(10ms)
7. VL53L0X_dir.init() → setAddress(0x31)  ← esq já está em 0x30, sem colisão
```

Após o `setup()`, o barramento Wire1 terá 3 dispositivos com endereços únicos:

| Sensor | Posição | Endereço final |
|---|---|---|
| VL6180X | Frente | `0x29` (padrão, não alterável via software) |
| VL53L0X | Esquerda | `0x30` (atribuído em runtime) |
| VL53L0X | Direita | `0x31` (atribuído em runtime) |
| INA219 | — | `0x40` (outro bus, sem conflito) |

---

## 3. Esquemático de Ligação

```
                   ┌──────────────────────────────────────────┐
                   │              ESP32                       │
                   │                                          │
3.3V ─────────────┤3.3V                                      │
GND  ─────────────┤GND                                       │
                   │                                          │
                   │  GPIO 4 ──────────────────► XSHUT (VL53L0X ESQ)
                   │  GPIO 5 ──────────────────► XSHUT (VL53L0X DIR)
                   │                                          │
                   │      Wire1 (I2C1) — Sensores ToF        │
                   │  GPIO 21 (SDA1) ──┬──────► SDA (VL6180X  FRENTE)
                   │                   ├──────► SDA (VL53L0X  ESQ)
                   │                   └──────► SDA (VL53L0X  DIR)
                   │  GPIO 22 (SCL1) ──┬──────► SCL (VL6180X  FRENTE)
                   │                   ├──────► SCL (VL53L0X  ESQ)
                   │                   └──────► SCL (VL53L0X  DIR)
                   │                                          │
                   │      Wire  (I2C0) — Energia             │
                   │  GPIO 18 (SDA0) ──────────► SDA (INA219)│
                   │  GPIO 17 (SCL0) ──────────► SCL (INA219)│
                   └──────────────────────────────────────────┘

Resistores de pull-up:
  Wire1 (ToF):  4.7 kΩ de SDA1 → 3.3V  |  4.7 kΩ de SCL1 → 3.3V
  Wire0 (INA):  4.7 kΩ de SDA0 → 3.3V  |  4.7 kΩ de SCL0 → 3.3V
  (muitos módulos breakout já incluem pull-ups internos de 10 kΩ)
```

### Tabela de conexões físicas

| Fio | De (ESP32) | Para (Sensor) | Cor sugerida |
|---|---|---|---|
| SDA1 | GPIO 21 | SDA de VL6180X, VL53L0X×2 | Azul |
| SCL1 | GPIO 22 | SCL de VL6180X, VL53L0X×2 | Amarelo |
| XSHUT-E | GPIO 4 | XSHUT do VL53L0X Esquerda | Verde |
| XSHUT-D | GPIO 5 | XSHUT do VL53L0X Direita | Laranja |
| SDA0 | GPIO 18 | SDA do INA219 | Azul escuro |
| SCL0 | GPIO 17 | SCL do INA219 | Cinza |
| 3.3V | 3V3 | VCC de todos os sensores | Vermelho |
| GND | GND | GND de todos os sensores | Preto |

> **GPIO 17** (antigo `ECHO_LEFT` do ultrassom removido) foi escolhido por estar livre, sem função de strapping e sem conflito com periféricos ativos. O GPIO 2 original foi descartado por ser strapping pin (deve estar LOW no boot) e compartilhado com o LED embutido.

---

## 4. Sensores: Características e Diferenças

### VL6180X — Sensor Frontal

| Parâmetro | Valor |
|---|---|
| Princípio | ToF (Time-of-Flight) laser |
| Alcance típico | 5 mm – 100 mm (confiável até ~10 cm) |
| Saída | `uint8_t` em **mm** (0–255) |
| Endereço I2C | `0x29` (fixo, não muda via software) |
| Modo de leitura | **Single-shot** (`readRangeSingle()`) |
| Pino CE/XSHUT | Disponível, mas não usado no projeto |

O VL6180X foi escolhido para a frente por ter **alcance curto mas muito preciso**, ideal para detectar a parede frontal da célula (que fica a ~5–8 cm do sensor quando o robô está centralizado).

### VL53L0X — Sensores Laterais

| Parâmetro | Valor |
|---|---|
| Princípio | ToF laser (940 nm) |
| Alcance típico | 30 mm – 2000 mm |
| Saída | `uint16_t` em **mm** |
| Endereço I2C | `0x29` padrão → reendereçável |
| Modo de leitura | **Contínuo** (`startContinuous` + `readRangeContinuousMillimeters()`) |
| Pino XSHUT | Obrigatório para reendereçamento |

Os VL53L0X são usados nos laterais porque têm **maior alcance** (suficiente para detectar paredes a ~9 cm de distância) e suportam modo contínuo, que reduz a latência de leitura ao evitar o tempo de disparo de cada medição.

---

## 5. Explicação do Código

### `inicializaSensores()` — Sequência de boot

```cpp
// 1. Desliga ambos os VL53L0X via XSHUT
digitalWrite(XSHUT_ESQ_PIN, LOW);
digitalWrite(XSHUT_DIR_PIN, LOW);
delay(10);

// 2. Sobe Wire1 em Fast-mode (400 kHz)
Wire1.begin(21, 22);
Wire1.setClock(400000);

// 3. VL6180X é o único no bus — init sem colisão
_vlFrente.setBus(&Wire1);
_vlFrente.init();
_vlFrente.configureDefault();

// 4. Liga esquerda → muda endereço para 0x30
digitalWrite(XSHUT_ESQ_PIN, HIGH); delay(10);
_vlEsquerda.init();
_vlEsquerda.setAddress(0x30);
_vlEsquerda.startContinuous(50); // leitura a cada 50 ms

// 5. Liga direita → muda endereço para 0x31
// (esquerda já está em 0x30, sem colisão com o padrão 0x29)
digitalWrite(XSHUT_DIR_PIN, HIGH); delay(10);
_vlDireita.init();
_vlDireita.setAddress(0x31);
_vlDireita.startContinuous(50);
```

### `atualizaSensores()` — Leitura dos valores

- **VL6180X (frente):** usa `readRangeSingle()` — bloqueia ~10 ms por leitura. Resultado em mm como `uint8_t`; valor `255` = overflow/erro.
- **VL53L0X (laterais):** usa `readRangeContinuousMillimeters()` — retorna o último valor pronto do modo contínuo, sem bloquear significativamente. Resultado em mm como `uint16_t`; valores > 8000 mm = fora do alcance.

Ambos os resultados são convertidos para **cm** e armazenados em `_distF`, `_distE`, `_distD`.

### `mapearParedes()` — Sem rotação física ✅

Com 3 sensores, a detecção das 3 paredes é **simultânea e instantânea**:

```
                    ↑ sensor FRENTE (direção atual do robô)
                    │
sensor ESQ ─────── [ROBÔ] ─────── sensor DIR
```

A função resolve as direções absolutas (N/S/L/O) a partir da orientação atual do `rato->direcao` e registra as paredes no mapa:

```cpp
char dirFrente   = rato->direcao;           // ex: 'N'
char dirDireita  = dirs[(idx + 1) % 4];     // ex: 'L'
char dirEsquerda = dirs[(idx + 3) % 4];     // ex: 'O'
```

> **Impacto no DFS:** com a versão anterior (1 sensor), cada célula exigia 3 rotações físicas (~2,4s bloqueantes). Agora, `mapearParedes` executa em **~10–30 ms** (tempo de 1 leitura VL6180X single-shot).

### `lerDistancias()` — Seção crítica

```cpp
noInterrupts();
rato->distancia_frente   = _distF;
rato->distancia_esquerda = _esq_ok ? _distE : 0.0f;
rato->distancia_direita  = _dir_ok ? _distD : 0.0f;
interrupts();
```

`noInterrupts()` protege a cópia dos floats (4 bytes cada) contra corrupção por ISRs de encoder que podem executar entre bytes da escrita em memória.

Se um sensor lateral não for detectado na inicialização, `_esq_ok`/`_dir_ok` ficam `false` e a distância correspondente é reportada como `0.0f` (indica ausência, não parede).

---

## 6. Degradação com Sensor Ausente

O código possui flags de saúde individuais (`_frente_ok`, `_esq_ok`, `_dir_ok`). Se um sensor falhar na inicialização:

| Sensor ausente | Comportamento |
|---|---|
| **Frente** | `_distF = DISTANCIA_LIVRE_CM` (400) — nenhuma parede frontal será detectada. **Crítico: o robô pode colidir.** |
| **Lateral esq.** | `_distE = 0.0f` reportado; DFS assume ausência de parede esquerda. Mapa ficará incompleto nessa direção. |
| **Lateral dir.** | Idem para direita. |

Esta é a situação do **fallback de 1 sensor** descrito no plano — o código compila e funciona com qualquer combinação de sensores presentes.

---

## 7. Dependências (platformio.ini)

As seguintes bibliotecas devem estar declaradas em `platformio.ini`:

```ini
lib_deps =
    pololu/VL6180X          ; VL6180X frontal
    pololu/VL53L0X          ; VL53L0X laterais
    adafruit/Adafruit INA219 @ ^1.2.0
    adafruit/Adafruit BusIO  @ ^1.14.0  ; dependência do INA219
    knolleary/PubSubClient   @ ^2.8
    bblanchon/ArduinoJson    @ ^7.0.0
```

---

## 8. Checklist de Calibração

Após a montagem física:

- [ ] Verificar no Serial Monitor que os 3 sensores reportam `OK` no boot
- [ ] Medir a distância real sensor-parede quando o robô está centralizado (esperado ~8–9 cm lateral, ~5–7 cm frontal)
- [ ] Ajustar `DISTANCIA_PAREDE_CM` (padrão: `12.0f`) conforme a medição real
- [ ] Confirmar que `temParedeFrente()` retorna `true` com parede presente e `false` sem parede
- [ ] Testar `mapearParedes()` em célula com paredes conhecidas e verificar o mapa no Serial
