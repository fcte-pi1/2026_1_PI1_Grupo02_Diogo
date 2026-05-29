import { prisma } from "../lib/prisma";
import { getSocket } from "../websocket/socket";

export const storeTelemetry = async (topic: string, rawPayload: Buffer): Promise<void> => {
  try {
    // converte o buffer binário do MQTT em Objeto JSON do TypeScript
    const payload = JSON.parse(rawPayload.toString());
    const robotId = payload.robotId || "UAV-MOUSE-01";

    // guarda o registro bruto na tabela TelemetryRaw (Histórico/Auditoria)
    await prisma.telemetryRaw.create({
      data: {
        topic: topic,
        robotId: robotId,
        payload: payload // json, prisma aceito o obj
      }
    });

    // busca se há alguma sessão ativa (corrida que ainda não foi concluída)
    let session = await prisma.session.findFirst({
      where: { 
        isCompleted: false 
      },
      orderBy: { createdAt: 'desc' } // Pega a mais recente se houver alguma anomalia
    });

    // Se a ESP32 mandou o step 0 e não existe nenhuma sessão aberta, cria uma na hora!
    if (!session && payload.step === 0) {
      // Busca um labirinto padrão existente para não quebrar a chave estrangeira (mazeId)
      let maze = await prisma.maze.findFirst();
      if (!maze) {
        // Se a tabela de mapas estiver vazia na primeira execução, cria um mapa padrão
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

    // Se uma sessão ativa existe (ou acabou de ser autocriada), grava o Passo Atual (Step)
    if (session) {
      // Busca o último stepOrder salvo para garantir a consistência de incrementos (opcional)
      const stepRecord = await prisma.sessionStep.create({
        data: {
          sessionId: session.id,
          stepOrder: payload.step,
          posX: payload.posicao?.x || 0,
          posY: payload.posicao?.y || 0,
          voltage: payload.energia?.tensaoV || 0,
          current: payload.energia?.correnteMa || 0
        }
      });

      try {
        const io = getSocket();
        io.emit("telemetry:step", stepRecord); 
      } catch (wsError) {
        // Evita que uma falha no WS derrube o salvamento do banco de dados
        console.error("[WS_STREAM_ERROR] Servidor WS não inicializado ou falhou ao emitir:", wsError);
      }

      // Se o robô bater a flag de conclusão, consolida e encerra a sessão
      if (payload.conclusao === true) {
        // Calcula a duração aproximada da corrida
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
    throw error; // Repassa para o client.on("message") capturar no bloco catch dele
  }
};