import { SquareTerminal, Play, Square, Wifi, WifiOff } from "lucide-react";
import { AppState } from "../App";

interface NavbarProps {
  sessionName?: string;
  runtime?: boolean;
  terminal: boolean;
  appState: AppState;
  setViewTerminal: React.Dispatch<React.SetStateAction<boolean>>;
  currentView: string;
  onRaceAction: (action: "START" | "PAUSE" | "STOP") => void;
  // ⚡ Novas propriedades conectadas ao hook central
  isSocketConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

function Navbar({
  sessionName = "Sessão Ativa",
  terminal,
  setViewTerminal,
  appState,
  currentView,
  isSocketConnected,
  onConnect,
  onDisconnect,
  onRaceAction,
}: NavbarProps) {
  return (
    <header className="w-full h-12 bg-surface-container-low/40 border-b border-outline-variant/30 backdrop-blur-md flex justify-between items-center px-container-padding font-space text-[11px] font-medium tracking-widest uppercase text-on-surface-variant/70 shrink-0 select-none z-20">
      
      {/* Lado Esquerdo: Identificação Dinâmica de Conexão */}
      <div className="flex items-center gap-stack-md font-mono">
        <span className="flex items-center gap-1.5">
          SOCKET:{" "}
          {isSocketConnected ? (
            <span className="text-emerald-400 font-bold animate-pulse flex items-center gap-1">
              <Wifi className="w-3 h-3" /> ONLINE
            </span>
          ) : (
            <span className="text-red-400 font-bold flex items-center gap-1">
              <WifiOff className="w-3 h-3" /> OFFLINE
            </span>
          )}
        </span>
        <span className="text-outline/40">|</span>
        <span className="text-primary-fixed-dim">{sessionName}</span>
      </div>

      {/* Lado Direito: Ações */}
      <div className="font-mono text-right text-[10px] text-outline flex items-center gap-stack-md">
        {appState === AppState.RUNNING ? (
          <div className="flex items-center gap-4">
            
            {/* Controles específicos da aba de Conexão (Network) */}
            {currentView === "network" && (
              <div className="flex items-center gap-2">
                <button 
                  disabled={isSocketConnected}
                  onClick={onConnect}
                  className={`text-[10px] font-mono border border-emerald-500/30 px-2 py-1 transition-colors bg-emerald-500/10 text-emerald-400 cursor-pointer hover:bg-emerald-500/20 flex items-center gap-1  font-bold ${isSocketConnected ? 'opacity-40 cursor-not-allowed' : 'hover:border-emerald-500 hover:text-emerald-400'}`} 
                >
                  Conectar
                </button>
                <span className="text-outline/20">|</span>
                <button 
                  disabled={!isSocketConnected}
                  onClick={() => {
                    if (confirm('Deseja encerrar a sessão de WebSocket com o Backend?')) {
                      onDisconnect();
                    }
                  }} 
                  className={`text-[10px] font-mono border border-red-500/30 px-2 py-1 bg-red-500/5 text-red-400 transition-colors cursor-pointer ${!isSocketConnected ? 'opacity-40 cursor-not-allowed' : 'hover:bg-red-500/10'}`}
                >
                  Encerrar conexão
                </button>
              </div>
            )}

            {/* Controles do Cockpit (Dashboard) */}
            {currentView === "dashboard" && (
              <div className="flex items-center gap-2">
                <button 
                  disabled={!isSocketConnected}
                  onClick={() => onRaceAction("START")}
                  className="text-[10px] font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors px-2 py-1 flex items-center gap-1 cursor-pointer font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Play className="w-2.5 h-2.5 fill-current" /> Iniciar Corrida
                </button>
                
                <button 
                  disabled={!isSocketConnected}
                  onClick={() => onRaceAction("STOP")}
                  className="text-[10px] font-mono border border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-colors px-2 py-1 flex items-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Square className="w-2.5 h-2.5 fill-current" /> Abortar
                </button>
              </div>
            )}

            <span className="text-outline/20">|</span>

            <button
              className="text-[10px] font-mono border border-outline-variant/30 px-2 py-1 flex items-center text-on-surface hover:border-primary transition-colors cursor-pointer"
              onClick={() => setViewTerminal(!terminal)}
            >
              <SquareTerminal className="size-3.5 mr-1.5 text-primary" strokeWidth={2} />
              {terminal ? "Ocultar Terminal" : "Ver Terminal"}
            </button>
          </div>
        ) : (
          <span>OP_V6R_PRE-RACE // SYS_LOAD: 12.4%</span>
        )}
      </div>
    </header>
  );
}

export default Navbar;