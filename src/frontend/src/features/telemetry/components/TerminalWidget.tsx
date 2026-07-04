import { useState, useEffect, useRef } from "react";
import { Maximize2, Minimize2, Trash2, X } from "lucide-react";

interface TerminalProps {
  activeSession: { sessionName: string; algorithm: string; mode: string } | null;
  status: boolean; 
  logs?: string[];  
  onClearLogs?: () => void; 
  onClose?: () => void; // 🚀 Nova propriedade para fechar o terminal
}

export default function TerminalWidget({ 
  activeSession, 
  status, 
  logs = [], 
  onClearLogs,
  onClose
}: TerminalProps) {
  const [height, setHeight] = useState(180); // Altura padrão inicial estilo VSCode
  const terminalRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Manipulador de arraste (Resize vertical estilo VSCode)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !terminalRef.current) return;
    // Calcula a nova altura baseada na posição do mouse em relação à janela
    const newHeight = window.innerHeight - e.clientY - 32; // Desconto do footer
    // Restringe o tamanho entre 100px (mínimo) e 500px (máximo)
    if (newHeight >= 100 && newHeight <= 500) {
      setHeight(newHeight);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Limpeza de ouvintes de eventos
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div 
      ref={terminalRef}
      style={{ height: `${height}px` }}
      className="bg-surface-container-low/60 border border-outline-variant/30 flex flex-col rounded-none shrink-0 relative w-full"
    >
      {/* 🚀 BARRA DE ARRASTE: Uma área sutil no topo que muda o cursor para redimensionamento */}
      <div 
        onMouseDown={handleMouseDown}
        className="absolute top-0 left-0 w-full h-[4px] cursor-ns-resize hover:bg-primary/50 transition-colors z-30"
        title="Arraste para redimensionar"
      />
      
      {/* Cabeçalho do Terminal */}
      <div className="text-label-caps bg-surface-container-lowest/80 p-[8px] px-4 flex flex-row justify-between items-center text-on-surface-variant border-b border-outline-variant/20 h-10 select-none shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-bold tracking-wider text-primary text-[11px] font-space uppercase">
            Terminal // Real-time Stream
          </h1>

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

        <div className="flex items-center gap-2">
          {status && logs.length > 0 && (
            <button
              onClick={onClearLogs}
              title="Limpar console"
              className="p-1 text-outline/60 hover:text-error hover:bg-error/10 transition-colors border border-transparent hover:border-error/20 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <span className="text-outline/40">|</span>

          {/* Botões Rápidos de Altura predefinida */}
          <button
            onClick={() => setHeight(120)}
            className="p-1 text-[9px] font-mono text-outline/60 hover:text-primary transition-colors cursor-pointer"
            title="Minimizar altura"
          >
            <Minimize2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => setHeight(380)}
            className="p-1 text-[9px] font-mono text-outline/60 hover:text-primary transition-colors cursor-pointer"
            title="Maximizar altura"
          >
            <Maximize2 className="w-3 h-3" />
          </button>

          <span className="text-outline/40">|</span>

          {/* 🚀 BOTÃO FECHAR TERMINAL */}
          <button
            onClick={onClose}
            title="Fechar terminal"
            className="p-1 text-outline/60 hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Corpo de Mensagens */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] flex flex-col gap-1 scroll-auto bg-black/10">
        {!status ? (
          <div className="text-outline/40 flex flex-col gap-1 select-none">
            <div>[SYS] console_stream_initialized...</div>
            <div className="text-tertiary-fixed-dim/60 animate-pulse">
              [WARN] uplink_disconnected. aguardando handshake com o esp32 para iniciar callbacks...
            </div>
          </div>
        ) : (
          <div className="text-secondary-fixed flex flex-col gap-1">
            <div className="text-emerald-400">[WS] Conexão estabelecida com sucesso na porta 3000.</div>
            <div className="text-blue-400">[WS] Escutando pacotes de telemetria no modo: {activeSession?.mode || 'PADRÃO'}</div>
            
            <div className="border-b border-outline-variant/10 my-1"></div>

            {logs.length === 0 ? (
              <div className="text-outline/40">// Console limpo. Aguardando próximas iterações...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-neutral-300 whitespace-pre-wrap breakdown-words">
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