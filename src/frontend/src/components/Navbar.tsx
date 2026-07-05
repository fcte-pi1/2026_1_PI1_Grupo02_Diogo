import { SquareTerminal, Wifi, WifiOff, Timer } from "lucide-react";
import { AppState } from "../App";

interface NavbarProps {
  sessionName?: string;
  runtime?: boolean;
  terminal: boolean;
  appState: AppState;
  setViewTerminal: React.Dispatch<React.SetStateAction<boolean>>;
  currentView: string;
  isSocketConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  elapsedMs: number;
  stepCount: number;
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
  elapsedMs,
  stepCount,
}: NavbarProps) {
  
  // Formatação matemática precisa em linha
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);

    const pad = (num: number) => String(num).padStart(2, "0");
    return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
  };

  const isTimerActive = isSocketConnected && stepCount > 0;

  return (
    <header className="w-full h-12 bg-surface-container-low/40 border-b border-outline-variant/30 backdrop-blur-md flex justify-between items-center px-6 font-space text-[11px] font-medium tracking-widest uppercase text-on-surface-variant/70 shrink-0 select-none z-20">
      
      {/* 📍 LADO ESQUERDO: Identificação Dinâmica de Conexão */}
      <div className="flex items-center gap-4 font-mono">
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
        <span className="text-primary-fixed-dim truncate max-w-\[120px]">{sessionName}</span>
      </div>

      {/* ⏱️ MIOLO CENTRAL: Cronômetro Inline de Alta Densidade */}
      {appState === AppState.RUNNING && (
        <div 
          data-testid="race-timer" 
          className="flex items-center gap-4 font-mono border border-outline-variant/20 bg-surface-container-lowest/50 px-4 h-8 text-[11px]"
        >
          <div className="flex items-center gap-1.5 border-r border-outline-variant/20 pr-3">
            <Timer className={`w-3.5 h-3.5 ${isTimerActive ? "text-primary animate-pulse" : "text-outline/40"}`} strokeWidth={2} />
            <span data-testid="race-timer-value" className="text-primary font-bold text-sm tracking-wider">
              {formatTime(elapsedMs)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span>
              PASSO: <span className="font-bold text-primary">#{stepCount}</span>
            </span>
            <span className="text-outline/20">|</span>
            <span 
              data-testid="race-timer-status" 
              className={`font-bold text-[9px] px-1.5 py-0.5 border ${
                isTimerActive 
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 animate-pulse" 
                  : "border-outline-variant/30 bg-surface-variant text-outline"
              }`}
            >
              {isTimerActive ? "ACTIVE" : "STANDBY"}
            </span>
          </div>
        </div>
      )}

      {/* ⚙️ LADO DIREITO: Ações */}
      <div className="font-mono text-right text-[10px] text-outline flex items-center gap-4">
        {appState === AppState.RUNNING ? (
          <div className="flex items-center gap-4">
            
            {currentView === "network" && (
              <div className="flex items-center gap-2">
                <button 
                  disabled={isSocketConnected}
                  onClick={onConnect}
                  className={`text-[10px] font-mono border border-emerald-500/30 px-2 py-1 transition-colors bg-emerald-500/10 text-emerald-400 cursor-pointer font-bold ${isSocketConnected ? 'opacity-40 cursor-not-allowed' : 'hover:bg-emerald-500/20'}`} 
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
                  Encerrar
                </button>
              </div>
            )}

            <span className="text-outline/20" style={{ display: currentView === "network" ? "block" : "none" }}>|</span>

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