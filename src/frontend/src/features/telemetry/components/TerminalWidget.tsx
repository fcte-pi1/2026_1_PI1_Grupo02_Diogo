interface TerminalProps {
  activeSession: { sessionName: string; algorithm: string; mode: string } | null;
  status: boolean; // true = conectado/live | false = desconectado/offline
}

export default function TerminalWidget({ activeSession, status }: TerminalProps) {
  return (
    <div className="h-50 bg-surface-container-low/60 border border-outline-variant/30 flex flex-col rounded-none shrink-0 transition-all duration-300">
      
      {/* Cabeçalho do Terminal */}
      <div className="text-label-caps bg-surface-container-lowest/80 p-stack-md flex flex-row justify-between items-center text-on-surface-variant border-b border-outline-variant/20 h-10 select-none">
        <h1 className="font-bold tracking-wider text-primary text-[11px] font-space uppercase">
          Terminal // Real-time Stream
        </h1>

        {/* Chaveamento do Status Badge usando os tokens do .md */}
        {!status ? (
          <span className="text-[10px] bg-error/10 border border-error/30 px-2 py-0.5 text-error font-bold font-mono">
            OFFLINE
          </span>
        ) : (
          <span className="text-[10px] bg-secondary-container/10 border border-secondary/30 px-2 py-0.5 text-secondary-fixed font-bold font-mono animate-pulse">
            LIVE
          </span>
        )}
      </div>

      {/* Corpo de Mensagens Condicional */}
      <div className="flex-1 overflow-y-auto p-stack-md font-mono text-[11px] flex flex-col gap-unit">
        {!status ? (
          // Terminal Desligado/Aguardando Conexão
          <div className="text-outline/40 flex flex-col gap-unit select-none">
            <div>[SYS] console_stream_initialized...</div>
            <div className="text-tertiary-fixed-dim/60 animate-pulse">
              [WARN] uplink_disconnected. aguardando handshake com o esp32 para iniciar callbacks...
            </div>
          </div>
        ) : (
          // Estado Ativo: Conectado e recebendo dados reais do WebSocket
          <div className="text-secondary-fixed flex flex-col gap-unit">
            <div>[WS] Conexão estabelecida com sucesso na porta 3000.</div>
            <div>[WS] Escutando pacotes de telemetria no modo: {activeSession?.mode || 'PADRÃO'}</div>
            <div className="text-outline/60">// Eventos em tempo real serão anexados abaixo...</div>
          </div>
        )}
      </div>

    </div>   
  );
}