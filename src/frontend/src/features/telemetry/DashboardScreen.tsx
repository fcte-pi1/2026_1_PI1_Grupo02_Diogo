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
}

export default function DashboardView({
  activeSession,
  currentView,
  connectionProps,
  robotData,
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
    <main data-testid="dashboard" className="w-full h-full p-container-padding flex flex-col gap-gutter overflow-hidden">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-gutter">
        
        <div className="flex flex-col gap-gutter lg:col-span-1">
          <BatteryWidget
            voltage={currentStep.voltage}
            percentage={calculatePercentage(currentStep.voltage)}
            isCritical={currentStep.voltage > 0 && currentStep.voltage < 10.2} // Alerta para LiPo 3S descarregando
          />
          <EngineTelemetryWidget
            motorCurrent={currentStep.current} // mpeado para o current (mA) do INA219
            velocity={0} // TO-DO: @matheus-06 precisa expor a velocidade calculada no payload futuramente
          />
        </div>

        {/* Mapeamento gráfico do Labirinto (Usa as coordenadas planas do Prisma) */}
        <VisualizeDiv
          activeSession={activeSession}
          currentView={currentView}
          connectionProps={connectionProps}
          isConnected={robotData !== null}
          // Se o VisualizeDiv precisar plotar o rastro do robô, você passa os eixos planos:
          posX={currentStep.posX}
          posY={currentStep.posY}
        />

        <div className="flex flex-col gap-gutter lg:col-span-1">
          {/* O timer ativa se a corrida começou (passos avançando) */}
          <RaceTimer startTime={null} isActive={currentStep.stepOrder > 0} />
          
          {/* O SensorGrid precisará ser alimentado pelo histórico bruto ou expandido na tabela se virar crítico */}
          <SensorGrid sensorData={{ front: 0, left: 0, right: 0 }} />
        </div>
      </div>
    </main>
  );
}