import { Database, ComponentIcon, ComputerIcon, Unlink } from "lucide-react";

interface VisualizeDivProps {
  activeSession: {
    sessionName: string;
    algorithm: string;
    mode: string;
  } | null;
  currentView: string; // Controlado unicamente pelo pai (MainLayout)
  connectionProps: {
    latency: string;
  };
  isConnected: boolean; // Flag real do WebSocket
  posX: number;         // posição X real do robô
  posY: number;         // posição Y real do robô
}

export function VisualizeDiv({
  activeSession,
  currentView,
  isConnected,
  posX,
  posY,
  connectionProps
}: VisualizeDivProps) {
  
  const renderContentView = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <div className="bg-surface-container-low/60 border border-outline-variant/30 p-6 flex flex-col h-full min-h-\[350px\] w-full relative">
            
            <div className="text-[10px] justify-between font-mono text-outline uppercase tracking-widest flex items-center gap-2 w-full mb-6">
              <span className="flex items-center gap-1">Mapeamento do labirinto</span>
              <span data-testid="maze-coords" className="text-[9px] px-2 py-0.5 border border-outline-variant/30 font-mono tracking-wider text-on-surface bg-surface-container-lowest">
                COORDS: X-{posX}, Y-{posY}
              </span>
            </div>
            
            {/* Miolo do Labirinto */}
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="font-mono text-xs text-center text-primary uppercase tracking-wider">
                [ LABIRINTO CENTRAL - ALGORITMO: {activeSession?.algorithm || "NENHUM"} ]
              </div>
            </div>
          </div>
        );

      case "network":
      default:
        return (
          <div className="bg-surface-container-low/60 border border-outline-variant/30 p-6 flex flex-col h-full min-h-\[350px\] w-full min-w-\[280px\] relative justify-between">
            {/* Header de Rede Reativo */}
            <div className="text-[10px] justify-between font-mono text-outline uppercase tracking-widest flex items-center gap-2 w-full mb-6">
              <span className="flex items-center gap-1">Topologia rede ativa</span>
              {isConnected ? (
                <span className="text-[9px] px-2 py-0.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono tracking-wider uppercase">
                  online
                </span>
              ) : (
                <span className="text-[9px] px-2 py-0.5 border border-red-500/30 bg-red-500/10 text-red-400 font-mono tracking-wider uppercase flex items-center gap-1">
                  <Unlink className="w-2.5 h-2.5" /> offline
                </span>
              )}
            </div>

            {/* Mapeamento de Nós Gráficos Dinâmicos */}
            <div className={`flex items-center gap-4 md:gap-8 w-full justify-center flex-1 transition-opacity duration-300 ${isConnected ? 'opacity-100' : 'opacity-40'}`}>
              
              {/* Estação Terrestre */}
              <div className="flex flex-col items-center text-center font-mono">
                <div className={`p-4 border mb-2 transition-colors ${isConnected ? 'border-cyan-500/30 bg-cyan-950/10 text-cyan-400' : 'border-outline-variant/20 bg-surface-container-low text-outline/50'}`}>
                  <span className="text-xl">
                    <ComputerIcon />
                  </span>
                </div>
                <span className={`text-[11px] font-bold tracking-wider ${isConnected ? 'text-primary' : 'text-outline'}`}>
                  OPERATOR_STATION
                </span>
                <span className="text-[9px] text-outline">{isConnected ? '192.168.1.1' : '---.---.-.-'}</span>
              </div>

              {/* Linha Conectora 1 */}
              <div className="h-\[1px\] bg-outline-variant/40 flex-1 max-w-\[60px\]"></div>

              {/* Robô MicroMouse (ESP32) */}
              <div className="flex flex-col items-center text-center font-mono relative">
                {isConnected && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                )}
                <div className={`p-4 border mb-2 transition-all ${isConnected ? 'border-emerald-500 bg-emerald-950/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-outline-variant/20 bg-surface-container-low text-outline/50'}`}>
                  <span className="text-xl">
                    <ComponentIcon />
                  </span>
                </div>
                <span className={`text-[11px] font-bold tracking-wider ${isConnected ? 'text-emerald-400' : 'text-outline'}`}>
                  UAV-MOUSE-01
                </span>
                <span className="text-[9px] text-outline">
                  RSSI: {isConnected ? `-${connectionProps.latency}dBm` : '---'}
                </span>
              </div>

              {/* Linha Conectora 2 */}
              <div className="h-\[1px\] bg-outline-variant/40 flex-1 max-w-\[60px\]"></div>

              {/* Banco de Dados Postgres */}
              <div className="flex flex-col items-center text-center font-mono">
                <div className={`p-4 border mb-2 transition-colors ${isConnected ? 'border-outline-variant/40 bg-surface-container-low text-on-surface' : 'border-outline-variant/20 bg-surface-container-low text-outline/50'}`}>
                  <span className="text-xl">
                    <Database />
                  </span>
                </div>
                <span className="text-[11px] font-bold text-on-surface-variant tracking-wider">
                  BANCO_DE_DADOS
                </span>
                <span className="text-[9px] text-outline">
                  {isConnected ? 'SINCRONIA ATIVA' : 'DESCONECTADO'}
                </span>
              </div>

            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full lg:col-span-2">
      {renderContentView()}
    </div>
  );
}