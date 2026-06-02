#include "./telemetria.h"

void publishTelemetry(
    const Rato &rato,
    const Labirinto &lab,
    PubSubClient &mqttClient,
    const char *mqttTopic,
    const char *robotId,
    unsigned long &stepCounter,
    bool motorsRunning,
    bool concluded)
{
    if (WiFi.status() != WL_CONNECTED || !mqttClient.connected())
        return;

    StaticJsonDocument<768> doc;

    doc["robotId"] = robotId;
    doc["step"] = stepCounter++;
    doc["tempoMs"] = millis();
    doc["modo"] = "DFS";
    doc["estado"] = motorsRunning ? "EXPLORANDO" : "PARADO";

    JsonObject posicao = doc.createNestedObject("posicao");
    posicao["x"] = rato.x;
    posicao["y"] = rato.y;

    const char *dirStr = rato.direcao == 'N' ? "norte" : rato.direcao == 'S' ? "sul"
                                                     : rato.direcao == 'L'   ? "leste"
                                                                             : "oeste";
    doc["direcao"] = dirStr;

    doc["ultimomovimento"] = motorsRunning ? "frente" : "parado";

    JsonObject paredes = doc.createNestedObject("paredes");
    paredes["norte"] = lab.celula[rato.x][rato.y].norte;
    paredes["sul"] = lab.celula[rato.x][rato.y].sul;
    paredes["leste"] = lab.celula[rato.x][rato.y].leste;
    paredes["oeste"] = lab.celula[rato.x][rato.y].oeste;

    JsonObject motores = doc.createNestedObject("motores");
    motores["pwmEsquerdo"] = rato.pwm_motor_esquerdo;
    motores["pwmDireito"] = rato.pwm_motor_direito;

    JsonObject sensores = doc.createNestedObject("sensores");
    sensores["esquerdaCm"] = rato.distancia_esquerda;
    sensores["frenteCm"] = rato.distancia_frente;
    sensores["direitaCm"] = rato.distancia_direita;

    JsonObject energia = doc.createNestedObject("energia");
    energia["tensaoV"] = 0.0;
    energia["correnteMa"] = 0.0;

    doc["conclusao"] = concluded;

    char buffer[512];
    serializeJson(doc, buffer);
    mqttClient.publish(mqttTopic, buffer);
}
