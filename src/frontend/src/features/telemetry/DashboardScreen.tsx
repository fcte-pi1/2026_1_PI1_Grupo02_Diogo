import BatteryWidget from "./components/BatteryWidget";
import EngineTelemetryWidget from "./components/EngineTelemetryWidget";
import RaceTimer from "./components/RaceTimer";
import SensorGrid from "./components/SensorGrid";
import { VisualizeDiv } from "../../components/VisualizeDiv";
import { TelemetryData } from "../../hooks/useWebSocket";

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
  
  // Objeto de fallback estruturado corretamente com inglês para evitar quebras
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

  // 🚀 O SEGREDO DO CRONÔMETRO: Cálculo de delta matemático baseado nos pacotes recebidos
  const firstStepTime = sessionSteps.length > 0 ? new Date(sessionSteps[0].timestamp).getTime() : null;
  const currentTime = robotData ? new Date(robotData.timestamp).getTime() : null;
  const elapsedMs = firstStepTime && currentTime ? Math.max(0, currentTime - firstStepTime) : 0;

  return (
    <main
      data-testid="dashboard"
      className="w-full h-full px-6 pt-6 flex flex-col justify-between overflow-hidden box-border"
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
        <div className="flex flex-col lg:col-span-2 min-h-\[300px] h-full w-full relative overflow-hidden min-h-0">
          <VisualizeDiv
            activeSession={activeSession}
            currentView={currentView}
            robotData={
              robotData
                ? ({
                    ...robotData,
                    createdAt: new Date(robotData.timestamp),
                  } as any)
                : null
            }
            steps={
              sessionSteps
                ? (sessionSteps.map((step) => ({
                    ...step,
                    createdAt: new Date(step.timestamp),
                  })) as any)
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
    </main>
  );
}