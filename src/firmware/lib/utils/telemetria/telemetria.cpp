#include "./telemetria.h"

static const char* _estadoParaDto(Estado estado){
    switch(estado)
    {
        case CONCLUIDO:
            return "FINALIZADO";
        case CORRIDA:
            // CORRIDA não existe no enum do DTO — mapeamos como EXPLORANDO
            // pois o robô ainda está em movimento ativo no labirinto
            return "EXPLORANDO";
        case EXPLORANDO:
            return "EXPLORANDO";
        case ERRO:
            return "ERRO";
        case PARADO:
        default:
            return "PARADO";
    }
}

void publishTelemetry(
    const Rato &rato,
    const Labirinto &lab,
    PubSubClient &mqttClient,
    const char *mqttTopic,
    const char *robotId,
    unsigned long &stepCounter,
    Estado estado,
    bool motorsRunning,
    const char *ultimoMovimento,
    bool concluded)
{
    if (WiFi.status() != WL_CONNECTED || !mqttClient.connected())
        return;

    // 1024 bytes: margem segura para o payload completo com todos os campos aninhados
    StaticJsonDocument<1024> doc;

    doc["robotId"] = robotId;
    doc["step"] = stepCounter; // incremento fica a cargo do passoDFS()
    doc["tempoMs"] = millis();
    doc["modo"] = "DFS";
    doc["estado"] = _estadoParaDto(estado);

    JsonObject posicao = doc.createNestedObject("posicao");
    posicao["x"] = rato.x;
    posicao["y"] = rato.y;

    const char *dirStr = rato.direcao == 'N' ? "norte" : rato.direcao == 'S' ? "sul"
                                                     : rato.direcao == 'L'   ? "leste"
                                                                             : "oeste";
    doc["direcao"] = dirStr;

    doc["ultimoMovimento"] = ultimoMovimento;

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
    energia["tensaoV"] = rato.tensao;
    energia["correnteMa"] = rato.corrente;

    doc["conclusao"] = concluded;

    // 768 bytes: suficiente para serializar o JSON sem truncamento silencioso
    char buffer[768];
    serializeJson(doc, buffer);
    mqttClient.publish(mqttTopic, buffer);
}
