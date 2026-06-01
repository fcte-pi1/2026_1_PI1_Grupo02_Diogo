import { useState } from "react";
import { Maximize2, Minimize2, Trash2 } from "lucide-react";

interface TerminalProps {
  activeSession: { sessionName: string; algorithm: string; mode: string } | null;
  status: boolean; // true = conectado/live | false = desconectado/offline
  logs?: string[];  // recebe o array de strings dinâmicas do console
  onClearLogs?: () => void; // esvaziar o array de logs
}

export default function TerminalWidget({ 
  activeSession, 
  status, 
  logs = [], 
  onClearLogs 
}: TerminalProps) {

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`bg-surface-container-low/60 border border-outline-variant/30 flex flex-col rounded-none shrink-0 transition-all duration-300 ease-in-out ${
      isExpanded ? "h-96" : "h-48"
    }`}>
      
      {/* Cabeçalho do Terminal */}
      <div className="text-label-caps bg-surface-container-lowest/80 p-[8px] px-4 flex flex-row justify-between items-center text-on-surface-variant border-b border-outline-variant/20 h-10 select-none">
        
        <div className="flex items-center gap-4">
          <h1 className="font-bold tracking-wider text-primary text-[11px] font-space uppercase">
            Terminal // Real-time Stream
          </h1>

          {/* Chaveamento do Status Badge */}
          {!status ? (
            <span className="text-[9px] bg-error/10 border border-error/30 px-2 py-0.5 text-error font-bold font-mono">
              OFFLINE
            </span>
          ) : (
            <span className="text-[9px] bg-secondary-container/10 border border-secondary/30 px-2 py-0.5 text-secondary-fixed font-bold font-mono animate-pulse">
              LIVE
            </span>
          )}
        </div>

        {/* 🚀 BARRA DE AÇÕES: Seus novos botões integrados ao design */}
        <div className="flex items-center gap-2">
          
          {/* Botão de Limpar Console (Visível apenas se estiver conectado e houver logs) */}
          {status && logs.length > 0 && (
            <button
              onClick={onClearLogs}
              title="Limpar console"
              className="p-1 text-outline/60 hover:text-error hover:bg-error/10 transition-colors border border-transparent hover:border-error/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <span className="text-outline/40">|</span>

          {/* Botão de Redimensionamento (Aumentar / Diminuir Altura) */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Recolher terminal" : "Expandir terminal"}
            className="p-1 text-outline/60 hover:text-primary hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20 flex items-center gap-1 font-mono text-[10px]"
          >
            {isExpanded ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>REDUZIR</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>EXPANDIR</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Corpo de Mensagens Condicional */}
      <div className={`flex-1 overflow-y-auto p-3 font-mono text-[11px] flex flex-col gap-1 transition-all duration-300 ${
        isExpanded ? "max-h-\[340px\]" : "max-h-\[150px\]"
      } scroll-auto`}>
        {!status ? (
          // Terminal Desligado
          <div className="text-outline/40 flex flex-col gap-1 select-none">
            <div>[SYS] console_stream_initialized...</div>
            <div className="text-tertiary-fixed-dim/60 animate-pulse">
              [WARN] uplink_disconnected. aguardando handshake com o esp32 para iniciar callbacks...
            </div>
          </div>
        ) : (
          // Estado Ativo
          <div className="text-secondary-fixed flex flex-col gap-1">
            <div className="text-emerald-400">[WS] Conexão estabelecida com sucesso na porta 3000.</div>
            <div className="text-blue-400">[WS] Escutando pacotes de telemetria no modo: {activeSession?.mode || 'PADRÃO'}</div>
            
            <div className="border-b border-outline-variant/10 my-1"></div>

            {/* logs dinâmicos */}
            {logs.length === 0 ? (
              <div className="text-outline/40">// Console limpo. Aguardando próximas iterações...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-neutral-300 animate-fadeIn whitespace-pre-mono">
                  {log}
                </div>
              ))
            )}
          </div>
        )}
      </div>

    </div>   
  );
}