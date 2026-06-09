interface ConnectProps {
  title: string;
  subtitle: string;
  status: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
  txRate?: string;
  rxRate?: string;
  logs?: string[];
}

export function ConnectWidget({ title, subtitle, status, txRate = "0.0KB/s", rxRate = "0.0KB/s", logs = [] }: ConnectProps) {
  // Configuração dinâmica de cores com base no status da rede
  const statusStyles = {
    CONNECTED: "bg-emerald-500/10 border-emerald-500 text-emerald-400 animate-pulse",
    CONNECTING: "bg-amber-500/10 border-amber-500 text-amber-400",
    DISCONNECTED: "bg-red-500/10 border-red-500 text-red-400"
  };

  return (
    <div className="bg-surface-container-low/60 border border-outline-variant/30 backdrop-blur-md p-4 flex flex-col gap-3 rounded-none w-full">
      
      {/* Cabeçalho do Card */}
      <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2">
        <div className="flex flex-col">
          <h2 className="text-[11px] font-bold text-on-surface-variant tracking-widest uppercase font-mono">
            {title}
          </h2>
          <span className="text-[9px] text-outline font-mono uppercase">{subtitle}</span>
        </div>
        <span className={`text-[9px] px-2 py-0.5 border font-mono tracking-wider ${statusStyles[status]}`}>
          {status}
        </span>
      </div>

      {/* Logs Internos do Nó (Similares aos boxes azuis da imagem) */}
      <div className="flex flex-col gap-1.5 font-mono text-[10px]">
        {logs.length > 0 ? (
          logs.map((log, idx) => (
            <div key={idx} className="flex justify-between items-center bg-surface-container-low border border-outline-variant/25 px-2 py-1 text-primary">
              <span className="tracking-wide">{log}</span>
              <span className="text-[9px] text-emerald-500 font-bold font-telemetry">WRITTEN_OK</span>
            </div>
          ))
        ) : (
          <div className="text-center text-outline/40 py-2 italic border border-dashed border-outline-variant/20">
            Sem tráfego de dados ativo
          </div>
        )}
      </div>

      {/* Taxas de Transmissão Rodapé */}
      <div className="flex gap-4 font-mono text-[10px] text-outline pt-1 border-t border-outline-variant/10">
        <span className="flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          TX: <span className="text-on-surface font-bold">{txRate}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-chart-2"></span>
          RX: <span className="text-on-surface font-bold">{rxRate}</span>
        </span>
      </div>
    </div>
  );
}