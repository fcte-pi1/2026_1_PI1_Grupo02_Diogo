interface EngineTelemetryProps {
  motorCurrent: number; // Corrente do motor
  velocity: number;     // Para o gráfico de velocidade que você citou
}

export default function EngineTelemetryWidget({ motorCurrent, velocity }: EngineTelemetryProps) {
  return (
    <div className="bg-surface-container-low/60 border border-outline-variant/30 backdrop-blur-md p-stack-md flex flex-col gap-stack-md rounded-none h-full">
      
      {/* Cabeçalho do Card */}
      <div className="border-b border-outline-variant/20 pb-2">
        <h2 className="text-label-caps text-xs font-bold text-on-surface-variant tracking-widest uppercase">
          PROPULSÃO / MOTORES
        </h2>
      </div>

      {/* Placeholder para o gráfico do Recharts que vocês vão colocar */}
      <div className="h-24 w-full bg-surface-container-lowest/50 border border-outline-variant/20 flex items-center justify-center font-mono text-[11px] text-outline">
        [ Gráfico de Velocidade: {velocity.toFixed(2)} m/s ]
      </div>

      {/* Lista de Dados Técnicos dos Motores */}
      <ul className="flex flex-col gap-unit font-mono text-[12px] text-on-surface-variant">
        <li className="flex justify-between border-b border-outline-variant/10 py-1">
          <span>CORRENTE DO MOTOR:</span>
          <span className="font-telemetry text-on-surface">{motorCurrent.toFixed(2)}A</span>
        </li>
        <li className="flex justify-between py-1">
          <span>FORÇA / RPM NOMINAL:</span>
          <span className="font-telemetry text-secondary-fixed">0 / 0</span>
        </li>
      </ul>
    </div>
  );
}