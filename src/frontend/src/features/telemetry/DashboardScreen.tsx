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
  // Recebe os dados em tempo real vindos do hook do pai
  robotData: TelemetryData | null; 
}

export default function DashboardView({
  activeSession,
  currentView,
  connectionProps,
  robotData,
}: DashboardViewProps) {
  
  // Cria um estado de fallback caso o robô ainda não tenha enviado dados
  const data = robotData || {
    voltage: 0,
    percentage: 0,
    temperature: 0,
    motorCurrent: 0,
    velocity: 0,
    sensors: { front: 0, left: 0, right: 0 },
    coordinates: { x: 0, y: 0 }
  };

  return (
    <main className="w-full h-full p-container-padding flex flex-col gap-gutter overflow-hidden">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-gutter">
        
        <div className="flex flex-col gap-gutter lg:col-span-1">
          <BatteryWidget
            voltage={data.voltage}
            percentage={data.percentage}
            isCritical={data.voltage < 3.4}
          />
          <EngineTelemetryWidget
            motorCurrent={data.motorCurrent}
            velocity={data.velocity}
          />
        </div>

        {/* Passa o activeSession e os dados para mapear o labirinto */}
        <VisualizeDiv
          activeSession={activeSession}
          currentView={currentView}
          connectionProps={connectionProps}
          isConnected={robotData !== null} // 🚀 Ativo se o robotData estiver injetando pacotes na tela!
        />

        <div className="flex flex-col gap-gutter lg:col-span-1">
          {/* RaceTimer pode ser ativado se a velocidade for maior que zero ou por um status */}
          <RaceTimer startTime={null} isActive={data.velocity > 0} />
          <SensorGrid sensorData={data.sensors} />
        </div>
      </div>
    </main>
  );
}