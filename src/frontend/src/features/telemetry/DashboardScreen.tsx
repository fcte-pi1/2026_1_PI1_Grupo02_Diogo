import BatteryWidget from "./components/BatteryWidget";
import EngineTelemetryWidget from "./components/EngineTelemetryWidget";
import SensorGrid from "./components/SensorGrid";
import type { SessionStep } from "../../types/session";
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

  return (
    <main
      data-testid="dashboard"
      className="w-full h-full p-6 flex flex-col overflow-hidden box-border bg-background select-none"
    >
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-5 min-h-0 w-full overflow-hidden">
        
        <div className="xl:col-span-4 flex flex-col gap-4 h-full min-h-0 overflow-auto">
            <BatteryWidget
              voltage={currentStep.voltage}
              percentage={calculatePercentage(currentStep.voltage)}
              isCritical={currentStep.voltage > 0 && currentStep.voltage < 6.75}
            />

          {/* Malha de Sensores de Distância (Infravermelhos) */}
            <SensorGrid
              sensorData={{
                front: currentStep.sensors?.front ?? 0,
                left: currentStep.sensors?.left ?? 0,
                right: currentStep.sensors?.right ?? 0,
              }}
            />

          {/* Telemetria de Corrente e Consumo dos Motores */}
            <EngineTelemetryWidget
              motorCurrent={currentStep.current}
              velocity={0}
            />

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
              posX={robotData?.posX ?? 0}
              posY={robotData?.posY ?? 0}
              connectionProps={connectionProps}
            />
          </div>
        </div>

      </div>
    </main>
  );
}