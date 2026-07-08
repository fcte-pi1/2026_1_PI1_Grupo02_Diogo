import React, { useState, useEffect, useMemo } from "react";
import BatteryWidget from "./components/BatteryWidget";
import EngineTelemetryWidget from "./components/EngineTelemetryWidget";
import SensorGrid from "./components/SensorGrid";
import type { SessionStep } from "../../types/session";
import { VisualizeDiv } from "../../components/VisualizeDiv";
import { TelemetryData } from "../../hooks/useWebSocket";
import { PopUp } from "../../components/pop-up";

interface DashboardViewProps {
  activeSession: any; // Mantendo a tipagem do seu projeto
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

  // Fallback seguro. Note a ausência de cálculos malucos locais.
  const currentStep = robotData || {
    stepOrder: 0,
    posX: 7,
    posY: 7,
    voltage: 0,
    current: 0,
    sensors: { front: 0, left: 0, right: 0 },
    walls: { north: false, south: false, east: false, west: false },
  };

  const calculatePercentage = (v: number) => {
    if (v === 0) return 0;
    const maxV = 12.6;
    const minV = 9.9;
    const pct = ((v - minV) / (maxV - minV)) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  };

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
    const pathCoordinates = sessionSteps.map((step) => `(${step.posX},${step.posY})`);
    const uniquePath = pathCoordinates.filter((val, idx, self) => self.indexOf(val) === idx);
    const pathString = uniquePath.slice(-5).join(" -> ") + (uniquePath.length > 5 ? "..." : "");
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
        <div className="xl:col-span-4 flex flex-col gap-4 h-full min-h-0 overflow-hidden">
          <BatteryWidget
            voltage={currentStep.voltage}
            percentage={calculatePercentage(currentStep.voltage)}
            isCritical={currentStep.voltage > 0 && currentStep.voltage < 6.75}
          />

          {/* 🚀 LENDO DIRETAMENTE O QUE A ESP32 (OU BASH) ENVIA! */}
          <SensorGrid
            sensorData={{
              front: currentStep.sensors?.front ?? 0,
              left: currentStep.sensors?.left ?? 0,
              right: currentStep.sensors?.right ?? 0,
            }}
            scanTick={currentStep.stepOrder ?? 0}
            interactive
          />

          <EngineTelemetryWidget velocity={0} />
        </div>

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
              posX={currentStep.posX} // <-- Usando a coordenada não mascarada
              posY={currentStep.posY} // <-- Usando a coordenada não mascarada
              connectionProps={connectionProps}
            />
          </div>
        </div>
      </div>

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