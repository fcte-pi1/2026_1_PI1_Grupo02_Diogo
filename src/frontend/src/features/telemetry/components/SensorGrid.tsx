import { ShieldAlert } from 'lucide-react';

interface SensorGridProps {
  sensorData: {
    left: number;
    front: number;
    right: number;
  };
}

export default function SensorGrid({ sensorData }: SensorGridProps) {
  const CRITICAL_DIST = 12; 
  const WARNING_DIST = 25;  

  const getStatusColor = (dist: number) => {
    if (dist <= CRITICAL_DIST) return 'bg-error border-error text-on-error';
    if (dist <= WARNING_DIST) return 'bg-tertiary-fixed-dim/30 border-tertiary text-tertiary-container';
    return 'bg-secondary-container/10 border-outline-variant/50 text-secondary-fixed';
  };

  return (
    <div className="bg-surface-container-low/60 border border-outline-variant/30 backdrop-blur-md p-stack-md flex flex-col rounded-none w-full h-full">
      
      <div className="border-b border-outline-variant/20 shrink-0">
        <h2 className="text-label-caps text-xs mb-3 font-bold text-on-surface-variant tracking-widest uppercase flex items-center gap-stack-sm">
          <ShieldAlert className="w-3.5 h-3.5 text-tertiary-container" strokeWidth={2} />
          Sensores de proximidade
        </h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start pt-5 pb-2 font-mono overflow-y-auto">
        <div className="w-48 flex flex-col gap-2 shrink-0">
          
          <div className={`w-full border p-2 text-center text-[11px] transition-colors duration-300 ${getStatusColor(sensorData.front)}`}>
            FRONT: <span className="font-telemetry font-bold">{sensorData.front}cm</span>
          </div>

          <div className="grid grid-cols-2 gap-2 h-16">
            <div className={`border p-2 flex flex-col justify-center items-center text-[11px] transition-colors duration-300 ${getStatusColor(sensorData.left)}`}>
              <span>LEFT</span>
              <span className="font-telemetry font-bold">{sensorData.left}cm</span>
            </div>

            <div className={`border p-2 flex flex-col justify-center items-center text-[11px] transition-colors duration-300 ${getStatusColor(sensorData.right)}`}>
              <span>RIGHT</span>
              <span className="font-telemetry font-bold">{sensorData.right}cm</span>
            </div>
          </div>

          <div className="w-full bg-surface-container-lowest border border-outline-variant/20 p-2 text-center text-[10px] text-outline tracking-wider">
            MCU: ESP32_WROOM_32
          </div>

        </div>
      </div>
    </div>
  );
}