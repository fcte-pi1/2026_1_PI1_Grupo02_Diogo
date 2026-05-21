import { ShieldAlert } from 'lucide-react';

interface SensorGridProps {
  sensorData: {
    front: number;
    left: number;
    right: number;
  };
}

export default function SensorGrid({ sensorData }: SensorGridProps) {
  // Limites de segurança em centímetros para mudar a cor do cockpit
  const CRITICAL_DIST = 12; // Menos de 12cm: Perigo extremo (Vermelho)
  const WARNING_DIST = 25;  // Menos de 25cm: Atenção (Laranja)

  const getStatusColor = (dist: number) => {
    if (dist <= CRITICAL_DIST) return 'bg-error border-error text-on-error';
    if (dist <= WARNING_DIST) return 'bg-tertiary-fixed-dim/30 border-tertiary text-tertiary-container';
    return 'bg-secondary-container/10 border-outline-variant/50 text-secondary-fixed';
  };

  return (
    <div className="bg-surface-container-low/60 border border-outline-variant/30 backdrop-blur-md p-stack-md flex flex-col rounded-none w-full h-full">
      
      {/* Cabeçalho */}
      <div className="border-b border-outline-variant/20">
        <h2 className="text-label-caps text-xs font-bold text-on-surface-variant tracking-widest uppercase flex items-center gap-stack-sm">
          <ShieldAlert className="w-3.5 h-3.5 text-tertiary-container" strokeWidth={2} />
          Sensores de proximidade
        </h2>
      </div>

      {/* Grid Geométrico do Robô (Abstração Visual) */}
      <div className="flex-1 flex flex-col items-center justify-center py-4 font-mono">
        <div className="w-48 flex flex-col gap-2">
          
          {/* 1. Sensor Frontal */}
          <div className={`w-full border p-2 text-center text-[11px] transition-colors duration-300 ${getStatusColor(sensorData.front)}`}>
            FRONT: <span className="font-telemetry font-bold">{sensorData.front}cm</span>
          </div>

          {/* 2. Meio do Robô (Esquerda vs Direita) */}
          <div className="grid grid-cols-2 gap-2 h-16">
            {/* Sensor Esquerdo */}
            <div className={`border p-2 flex flex-col justify-center items-center text-[11px] transition-colors duration-300 ${getStatusColor(sensorData.left)}`}>
              <span>LEFT</span>
              <span className="font-telemetry font-bold">{sensorData.left}cm</span>
            </div>

            {/* Sensor Direito */}
            <div className={`border p-2 flex flex-col justify-center items-center text-[11px] transition-colors duration-300 ${getStatusColor(sensorData.right)}`}>
              <span>RIGHT</span>
              <span className="font-telemetry font-bold">{sensorData.right}cm</span>
            </div>
          </div>

          {/* 3. Base do Chassi (Representação Visual do Core do Rato) */}
          <div className="w-full bg-surface-container-lowest border border-outline-variant/20 p-2 text-center text-[10px] text-outline tracking-wider">
            MCU: ESP32_WROOM_32
          </div>

        </div>
      </div>

    </div>
  );
}