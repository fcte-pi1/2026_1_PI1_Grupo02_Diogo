import { Rat, Cpu } from 'lucide-react'; 

interface LoadingScreenProps {
  sessionName: string;
  isSocketConnected: boolean; 
}

export default function LoadingScreen({ sessionName, isSocketConnected }: LoadingScreenProps) {
  return (
    <div className="h-screen w-full bg-background bg-grid flex flex-col items-center justify-center text-on-background relative select-none overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#111317_100%)] pointer-events-none z-0" />

      <div className="bg-background/40 backdrop-blur-sm text-on-background relative z-10 flex flex-col items-center gap-8 w-full max-w-sm p-6 border border-outline-variant/10">
        
        {/* Bloco de Texto Técnico */}
        <div className="text-center flex flex-col gap-1.5">
          <h2 className="text-[11px] font-space font-bold text-primary tracking-[0.25em] uppercase animate-pulse">
            Inicializando Handshake
          </h2>
          <span className="font-mono text-[9px] text-outline/60 uppercase tracking-wider">
            TARGET // {sessionName}
          </span>
        </div>

        <div className="w-64 h-14 border-b border-dashed border-outline-variant/30 relative flex items-end pb-1 overflow-hidden bg-surface-container-lowest/20 px-2">
          <div className="animate-rat-running text-primary absolute bottom-1 h-6 w-6" style={{ animationDuration: '2s' }}>
            <Rat className="w-6 h-6 transform scale-x-100" strokeWidth={1.5} />
          </div>

          <div className="animate-rat-running text-amber-500 absolute bottom-1 h-6 w-6 flex items-center justify-center" style={{   animationDuration: '2s', marginLeft: '32px'}} >
            <span className="text-sm font-mono filter drop-shadow-[0_0_4px_rgba(245,158,11,0.4)] animate-bounce">🧀</span>
          </div>
        </div>

        <div className="w-full bg-surface-container-lowest/80 border border-outline-variant/20 p-4 font-mono text-[10px] text-on-surface-variant/70 flex flex-col gap-1.5">
          <div className="flex justify-between border-b border-outline-variant/5 pb-1">
            <span className="text-outline/60">[SYS] ALLOCATING_DEVICES...</span>
            <span className="text-emerald-400 font-bold tracking-wider">OK</span>
          </div>
          
          <div className="flex justify-between border-b border-outline-variant/5 pb-1">
            <span className="text-outline/60">[MQTT] SYNCHRONIZING_BROKER...</span>
            {isSocketConnected ? (
              <span className="text-emerald-400 font-bold tracking-wider">OK</span>
            ) : (
              <span className="text-red-400 font-bold tracking-wider animate-pulse">FAIL</span>
            )}
          </div>
          
          <div className="flex justify-between items-center pt-0.5">
            <span className="flex items-center gap-1.5 text-outline/80">
              <Cpu className={`w-3 h-3 ${isSocketConnected ? 'text-primary animate-spin' : 'text-outline/40'}`} style={{ animationDuration: '3s' }} />
              [ESP32] HANDSHAKE_CALLBACK...
            </span>
            {isSocketConnected ? (
              <span className="text-emerald-400 font-bold tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-1 text-[9px]">
                CONNECTED
              </span>
            ) : (
              <span className="text-amber-500 font-bold tracking-wider bg-amber-500/10 border border-amber-500/20 px-1 text-[9px] animate-pulse">
                HOLD_WAIT
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}