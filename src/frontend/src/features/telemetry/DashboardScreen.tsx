import React, { useState, useEffect } from "react";
import BatteryWidget from "./components/BatteryWidget";
import EngineTelemetryWidget from "./components/EngineTelemetryWidget";
import RaceTimer from "./components/RaceTimer";
import SensorGrid from "./components/SensorGrid";
import type { SessionStep } from "../../types/session";
import { VisualizeDiv } from "../../components/VisualizeDiv";
import { TelemetryData } from "../../hooks/useWebSocket";
import { PopUp } from "../../components/pop-up";

interface DashboardViewProps {
  activeSession: {
    sessionName: string;
    algorithm: string;
    mode: string;
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
  
  // Estados locais para controle do Pop-up (Issue #100) inseridos no local correto
  const [isChallengeFinished, setIsChallengeFinished] = useState(false);
  const [hasDbError] = useState(false);

  // Gatilho de teste para abrir o modal quando a corrida encerrar
  useEffect(() => {
    if (sessionSteps.length > 0 && isConnected === false) {
      setIsChallengeFinished(true);
    }
  }, [sessionSteps, isConnected]);

  const currentStep = robotData || {
    stepOrder: 0,
    posX: 0,
    posY: 0,
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

  // Cálculo de delta matemático baseado nos pacotes recebidos para o cronômetro
  const firstStepTime = sessionSteps.length > 0 ? new Date(sessionSteps[0].timestamp).getTime() : null;
  const currentTime = robotData ? new Date(robotData.timestamp).getTime() : null;
  const elapsedMs = firstStepTime && currentTime ? Math.max(0, currentTime - firstStepTime) : 0;

  // Formatação e agrupamento dos dados de telemetria exigidos para o relatório final
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const getPopUpStats = () => {
    if (sessionSteps.length === 0) return undefined;

    const mazeType = activeSession?.sessionName || "Labirinto Simplificado";

    // Mapeamento sequencial de coordenadas removendo duplicadas consecutivas
    const pathCoordinates = sessionSteps.map(step => `(${step.posX},${step.posY})`);
    const uniquePath = pathCoordinates.filter((val, idx, self) => self.indexOf(val) === idx);
    const pathString = uniquePath.slice(-5).join(" -> ") + (uniquePath.length > 5 ? "..." : "");

    // Cálculo do consumo de bateria entre o passo inicial e o atual
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
      className="w-full h-full px-6 pt-6 flex flex-col justify-between overflow-hidden box-border relative"
    >
      <div className="w-full h-full grid grid-cols-1 lg:grid-cols-4 gap-4 items-start overflow-hidden pb-4">
        
        {/* Coluna Esquerda: Status de Energia */}
        <div className="flex flex-col gap-4 lg:col-span-1 w-full min-h-0">
          <div className="w-full">
            <BatteryWidget
              voltage={currentStep.voltage}
              percentage={calculatePercentage(currentStep.voltage)}
              isCritical={currentStep.voltage > 0 && currentStep.voltage < 10.2}
            />
          </div>
          <div className="w-full">
            <EngineTelemetryWidget
              motorCurrent={currentStep.current}
              velocity={0}
            />
          </div>
        </div>

        {/* Coluna Central: Mapa Gráfico */}
        <div className="flex flex-col lg:col-span-2 min-h-[300px] h-full w-full relative overflow-hidden min-h-0">
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

        {/* Coluna Direita: Tempo e Percepção */}
        <div className="flex flex-col gap-4 lg:col-span-1 w-full min-h-0">
          <div className="shrink-0 w-full">
            <RaceTimer 
              elapsedMs={elapsedMs} 
              stepCount={currentStep.stepOrder} 
              isActive={isConnected && currentStep.stepOrder > 0} 
            />
          </div>
          <div className="w-full">
            <SensorGrid
              sensorData={{
                front: currentStep.sensors?.front ?? 0,
                left: currentStep.sensors?.left ?? 0,
                right: currentStep.sensors?.right ?? 0,
              }}
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