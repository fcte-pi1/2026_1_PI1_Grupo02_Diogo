// src/features/telemetry/DashboardView.tsx
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
  isConnected
}: DashboardViewProps) {
  // Se o robô não mandou dados ainda, zeramos usando a estrutura nova plana
  const currentStep = robotData || {
    stepOrder: 0,
    posX: 0,
    posY: 0,
    voltage: 0,
    current: 0,
  };

  // Faz uma matemática simples para o BatteryWidget não ficar zerado na porcentagem
  const calculatePercentage = (v: number) => {
    if (v === 0) return 0;
    const maxV = 12.6;
    const minV = 9.9;
    const pct = ((v - minV) / (maxV - minV)) * 100;
    return Math.max(0, Math.min(100, Math.round(pct))); // Trava entre 0% e 100%
  };

  return (
    <main
      data-testid="dashboard"
      className="w-full min-h-full p-6 flex flex-col gap-4"
    >
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Coluna Esquerda: Status de Energia (Ocupa 1/4 da tela no Desktop) */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          <BatteryWidget
            voltage={currentStep.voltage}
            percentage={calculatePercentage(currentStep.voltage)}
            isCritical={currentStep.voltage > 0 && currentStep.voltage < 10.2} 
          />
          <EngineTelemetryWidget
            motorCurrent={currentStep.current} 
            velocity={0} 
          />
        </div>

        <div className="flex flex-col lg:col-span-2 min-h-/[350px] w-full relative">
          <VisualizeDiv
            activeSession={activeSession}
            currentView={currentView}
            robotData={robotData}
            steps={sessionSteps}
            isSocketConnected={isConnected}
            posX={robotData?.posX ?? 0}
            posY={robotData?.posY ?? 0}
            connectionProps={connectionProps}
          />
        </div>

        {/* Coluna Direita: Tempo e Percepção (Ocupa 1/4 da tela no Desktop) */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          <RaceTimer startTime={null} isActive={currentStep.stepOrder > 0} />
          <SensorGrid sensorData={{ front: 0, left: 0, right: 0 }} />
        </div>
        
      </div>
    </main>
  );
}