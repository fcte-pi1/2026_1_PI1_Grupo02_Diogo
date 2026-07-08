import React, { useState, useEffect, useMemo } from "react";
import BatteryWidget from "./components/BatteryWidget";
import EngineTelemetryWidget from "./components/EngineTelemetryWidget";
import SensorGrid from "./components/SensorGrid";
import type { SessionStep } from "../../types/session";
import { VisualizeDiv } from "../../components/VisualizeDiv";
import { TelemetryData } from "../../hooks/useWebSocket";
import { PopUp } from "../../components/pop-up";
import { mergeLiveMazeCells } from "../../utils/mergeLiveMazeCells";
import { lerSensoresAoVivo } from "../../utils/sensorRaycast";

interface DashboardViewProps {
  activeSession: {
    sessionName: string;
    algorithm: string;
    mode: string;
    maze?: {
      width: number;
      height: number;
      cells: Array<{
        posX: number;
        posY: number;
        wallNorth: boolean;
        wallSouth: boolean;
        wallEast: boolean;
        wallWest: boolean;
      }>;
    };
  } | null;
  currentView: string;
  connectionProps: { latency: string };
  robotData: TelemetryData | null;
  sessionSteps?: TelemetryData[];
  isConnected: boolean;
}

export default function DashboardView({
  activeSession,
  currentView,
  connectionProps,
  robotData,
  sessionSteps = [],
  isConnected,
}: DashboardViewProps) {
  // Estados locais para controle do Pop-up (Issue #100)
  const [isChallengeFinished, setIsChallengeFinished] = useState(false);
  const [hasDbError] = useState(false);

  useEffect(() => {
    const lastStep = sessionSteps[sessionSteps.length - 1];
    if (
      lastStep?.conclusao === true &&
      lastStep?.estado === "FINALIZADO" &&
      lastStep?.modo === "CORRIDA"
    ) {
      setIsChallengeFinished(true);
    }
  }, [sessionSteps]);

  const currentStep = robotData || {
    stepOrder: 0,
    posX: 0,
    posY: 0,
    voltage: 0,
    current: 0,
    sensors: { front: 0, left: 0, right: 0 },
    walls: { north: false, south: false, east: false, west: false },
  };

  const mazeWidth = activeSession?.maze?.width ?? 8;
  const mazeHeight = activeSession?.maze?.height ?? 8;

  const liveWallSources = useMemo(() => {
    const sources: TelemetryData[] = [...sessionSteps];
    if (
      robotData &&
      !sources.some((step) => step.stepOrder === robotData.stepOrder)
    ) {
      sources.push(robotData);
    }
    return sources;
  }, [sessionSteps, robotData]);

  const discoveredCells = useMemo(
    () =>
      mergeLiveMazeCells(
        activeSession?.maze?.cells ?? [],
        liveWallSources.map((step) => ({
          posX: step.posX,
          posY: step.posY,
          walls: step.walls,
        })),
      ),
    [activeSession?.maze?.cells, liveWallSources],
  );

  const sensorReadings = useMemo(
    () =>
      lerSensoresAoVivo(
        discoveredCells,
        liveWallSources.map((step) => ({
          posX: step.posX,
          posY: step.posY,
          walls: step.walls,
        })),
        currentStep.posX,
        currentStep.posY,
        mazeWidth,
        mazeHeight,
        robotData?.direcao,
      ),
    [
      discoveredCells,
      liveWallSources,
      currentStep.posX,
      currentStep.posY,
      mazeWidth,
      mazeHeight,
      robotData?.direcao,
    ],
  );

  const calculatePercentage = (v: number) => {
    if (v === 0) return 0;
    const maxV = 12.6;
    const minV = 9.9;
    const pct = ((v - minV) / (maxV - minV)) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  };

  // Cálculo de delta matemático baseado nos pacotes recebidos para as estatísticas
  const firstStepTime =
    sessionSteps.length > 0
      ? new Date(sessionSteps[0].timestamp).getTime()
      : null;
  const currentTime = robotData
    ? new Date(robotData.timestamp).getTime()
    : null;
  const elapsedMs =
    firstStepTime && currentTime ? Math.max(0, currentTime - firstStepTime) : 0;

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const getPopUpStats = () => {
    if (sessionSteps.length === 0) return undefined;

    const mazeType = activeSession?.sessionName || "Labirinto Simplificado";

    const pathCoordinates = sessionSteps.map(
      (step) => `(${step.posX},${step.posY})`,
    );
    const uniquePath = pathCoordinates.filter(
      (val, idx, self) => self.indexOf(val) === idx,
    );
    const pathString =
      uniquePath.slice(-5).join(" -> ") + (uniquePath.length > 5 ? "..." : "");

    const initialBattery = calculatePercentage(sessionSteps[0].voltage);
    const currentBattery = calculatePercentage(currentStep.voltage);
    const batteryDelta = Math.max(0, initialBattery - currentBattery);

    return {
      mazeType: mazeType,
      path: pathString,
      batteryUsage: `${batteryDelta}%`,
      averageSpeed: "15.4 cm/s",
      completionTime: formatTime(elapsedMs),
      success: true,
    };
  };

  return (
    <main
      data-testid="dashboard"
      className="w-full h-full p-6 flex flex-col overflow-hidden box-border bg-background select-none relative"
    >
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-5 min-h-0 w-full overflow-hidden">
        {/* 📊 PAINEL ESQUERDO: Chassi de Status Fluído */}
        <div className="xl:col-span-4 flex flex-col gap-4 h-full min-h-0 overflow-hidden">
          {/* Gerenciamento de Carga e Tensão */}
          <BatteryWidget
            voltage={currentStep.voltage}
            percentage={calculatePercentage(currentStep.voltage)}
            isCritical={currentStep.voltage > 0 && currentStep.voltage < 6.75}
          />

          {/* Malha de Sensores de Distância (Infravermelhos) */}
          <SensorGrid
            sensorData={{
              front: sensorReadings.front,
              left: sensorReadings.left,
              right: sensorReadings.right,
            }}
            scanTick={currentStep.stepOrder ?? 0}
            interactive
          />

          {/* Telemetria de Corrente e Consumo dos Motores */}
          <EngineTelemetryWidget velocity={0} />
        </div>

        {/* 🗺️ PAINEL DIREITO: Percepção Espacial do Labirinto */}
        <div className="xl:col-span-8 flex flex-col h-full min-h-0 overflow-hidden">
          <div className="flex-1 w-full relative overflow-hidden rounded-none">
            <VisualizeDiv
              activeSession={activeSession}
              currentView={currentView}
              robotData={
                robotData
                  ? ({
                      ...robotData,
                      createdAt: new Date(robotData.timestamp),
                    } as unknown as SessionStep)
                  : null
              }
              steps={
                sessionSteps
                  ? (sessionSteps.map((step) => ({
                      ...step,
                      createdAt: new Date(step.timestamp),
                    })) as unknown as SessionStep[])
                  : []
              }
              isSocketConnected={isConnected}
              posX={robotData?.posX ?? 0}
              posY={robotData?.posY ?? 0}
              connectionProps={connectionProps}
            />
          </div>
        </div>
      </div>

      {/* Pop-up de conclusão e tratamento de erro de persistência (Issue #100) */}
      <PopUp
        isOpen={isChallengeFinished}
        onClose={() => setIsChallengeFinished(false)}
        isError={hasDbError}
        title={hasDbError ? "Erro de Salvamento" : "Desafio Concluído!"}
        description={
          hasDbError
            ? "desafio concluído, porém não foi possível salvar os dados da corrida no banco de dados"
            : "O replay do desafio está disponível na aba de histórico de sessões."
        }
        stats={getPopUpStats()}
      />
    </main>
  );
}
