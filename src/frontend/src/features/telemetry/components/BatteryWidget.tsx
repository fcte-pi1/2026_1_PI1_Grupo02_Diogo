interface BatteryProps {
  voltage: number;
  percentage: number;
  isCritical: boolean;
}

export default function BatteryWidget({ voltage, percentage, isCritical }: BatteryProps) {
  return (
    <div className="bg-surface-container-low/60 border border-outline-variant/30 backdrop-blur-md p-stack-md flex flex-col gap-stack-md rounded-none w-full">
      
      {/* Cabeçalho do Card (Label Caps) */}
      <div className="border-b border-outline-variant/20 pb-2">
        <h2 className="text-label-caps font-bold text-xs text-on-surface-variant tracking-widest uppercase">
          Células de bateria
        </h2>
      </div>

      {/* Seção do Gráfico/Barra de Carga Rápida */}
      <div className="flex flex-col gap-unit">
        <div className="flex justify-between text-[11px] font-mono text-outline">
          <span>CHARGE_LEVEL</span>
          <span className={isCritical ? 'text-error font-bold animate-pulse' : 'text-secondary-fixed'}>
            {percentage}%
          </span>
        </div>
        {/* Barra de progresso industrial (cantos retos) */}
        <div className="w-full h-2 bg-surface-container-lowest border border-outline-variant/20">
          <div 
            className={`h-full transition-all duration-500 ${isCritical ? 'bg-error animate-pulse' : 'bg-primary-container'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Lista de Telemetria com Fontes Tabulares */}
      <ul className="flex flex-col gap-unit font-mono text-[12px] text-on-surface-variant">
        <li className="flex justify-between border-b border-outline-variant/10 py-1">
          <span>VOLTAGEM:</span>
          <span className="font-telemetry text-on-surface font-bold">{voltage}V</span>
        </li>
        <li className="flex justify-between py-1">
          <span>TENSÃO:</span>
          <span className="font-telemetry text-primary-fixed">0.00A</span>
        </li>
      </ul>
    </div>
  );
}