import { prisma } from "../lib/prisma";
import { getSocket } from "../websocket/socket";

export const storeTelemetry = async (topic: string, rawPayload: Buffer): Promise<void> => {
  try {
    // Converte o buffer binário do MQTT em Objeto JSON do TypeScript
    const payload = JSON.parse(rawPayload.toString());
    const robotId = payload.robotId || "UAV-MOUSE-01";

    console.log(`📥 [MQTT] Processando pacote. Passo recebido: #${payload.step}`);

    // Guarda o registro bruto na tabela TelemetryRaw (Histórico/Auditoria)
    await prisma.telemetryRaw.create({
      data: {
        topic: topic,
        robotId: robotId,
        payload: payload 
      }
    });

    // Busca se há alguma sessão ativa (corrida que ainda não foi concluída)
    let session = await prisma.session.findFirst({
      where: { 
        isCompleted: false 
      },
      orderBy: { createdAt: 'desc' }
    });

    // Se não houver sessão ativa, cria uma na hora INDEPENDENTE do Step!
    // Isso garante que se a ESP ligar no passo 110, ela não seja ignorada.
    if (!session) {
      let maze = await prisma.maze.findFirst();
      if (!maze) {
        maze = await prisma.maze.create({
          data: { name: "Labirinto Padrão UnB", width: 16, height: 16 }
        });
      }

      session = await prisma.session.create({
        data: {
          sessionName: `Corrida Automática - ${new Date().toLocaleTimeString()}`,
          algorithm: payload.modo || "DFS",
          mode: payload.estado || "Exploração",
          mazeId: maze.id,
          startPosX: payload.posicao?.x || 0,
          startPosY: payload.posicao?.y || 0,
          initialVoltage: payload.energia?.tensaoV || 0
        }
      });
      console.log(`[AUTO-START] 🏁 Nova sessão criada de forma automatizada: ID [${session.id}]`);
    }

    // Se uma sessão ativa existe (ou acabou de ser autocriada), grava o Passo Atual
    if (session) {
      const stepRecord = await prisma.sessionStep.create({
        data: {
          sessionId: session.id,
          stepOrder: Number(payload.step ?? 0),
          posX: Number(payload.posicao?.x || 0),
          posY: Number(payload.posicao?.y || 0),
          voltage: Number(payload.energia?.tensaoV || 0),
          current: Number(payload.energia?.correnteMa || 0)
        }
      });

      console.log(`[BANCO] 💾 Passo #${stepRecord.stepOrder} salvo para a sessão [${session.id}]`);

      // Emite nos dois canais para alinhar com o que o Frontend assinou nos logs
      try {
        const io = getSocket();
        io.emit("telemetry:step", stepRecord); 
        io.emit("telemetry:subscribe", stepRecord); // Alinha com o canal ativo do front
        console.log(`[WS] 📡 Transmitido nos canais 'telemetry:step' e 'telemetry:subscribe'`);
      } catch (wsError) {
        console.error("[WS_STREAM_ERROR] Servidor WS não inicializado ou falhou ao emitir:", wsError);
      }

      // Se o robô bater a flag de conclusão, consolida e encerra a sessão
      if (payload.conclusao === true) {
        const durationMs = Date.now() - session.createdAt.getTime();

        await prisma.session.update({
          where: { id: session.id },
          data: { 
            isCompleted: true,
            durationMs: durationMs,
            finalVoltage: payload.energia?.tensaoV || 0
          }
        });
        console.log(`[AUTO-STOP] 🏁 Robô concluiu o labirinto. Sessão [${session.id}] fechada com sucesso.`);
      }
    }

  } catch (error) {
    console.error("Erro crítico dentro do storeTelemetry service:", error);
    throw error;
  }
};