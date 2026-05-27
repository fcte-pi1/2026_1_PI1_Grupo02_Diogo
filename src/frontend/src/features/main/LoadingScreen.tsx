import { Rat, Cpu } from 'lucide-react';

interface LoadingScreenProps {
  sessionName: string;
  isSocketConnected: boolean; // 🚀 Prop real adicionada
}

export default function LoadingScreen({ sessionName, isSocketConnected }: LoadingScreenProps) {
  return (
    <div className="h-screen w-full bg-background bg-grid flex flex-col items-center justify-center text-on-background relative select-none overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,#111317_85%)] pointer-events-none z-0" />

      <div className="bg-background text-on-background relative z-10 flex flex-col items-center gap-6 w-full max-w-md">
        
        {/* Bloco de Texto Técnico */}
        <div className="text-center flex flex-col gap-1">
          <h2 className="text-xs font-mono font-bold text-primary tracking-[0.2em] uppercase animate-pulse">
            Inicializando Hard-Reset
          </h2>
          <span className="font-mono text-[9px] text-outline uppercase">
            Sessão: {sessionName}
          </span>
        </div>

        <div className="w-48 h-12 border-b-2 border-dashed border-outline-variant/40 relative flex items-end pb-1 overflow-hidden">
          <div className="animate-rat-running text-primary absolute left-0 bottom-1">
            <Rat className="w-6 h-6 transform scale-x-[-1]" strokeWidth={1.5} />
          </div>
        </div>

        {/* 💻 Console de Logs Dinâmico com base na conexão Docker real */}
        <div className="w-full bg-surface-container-lowest border border-outline-variant/20 p-4 font-mono text-[10px] text-on-surface-variant/70 flex flex-col gap-1">
          <div className="flex justify-between">
            <span>[SYS] ALLOCATING_DEVICES...</span>
            <span className="text-emerald-400 font-bold">OK</span>
          </div>
          
          <div className="flex justify-between">
            <span>[MQTT] SYNCHRONIZING_BROKER...</span>
            {isSocketConnected ? (
              <span className="text-emerald-400 font-bold">OK</span>
            ) : (
              <span className="text-red-400 font-bold animate-pulse">FAIL</span>
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              <Cpu className={`w-3 h-3 ${isSocketConnected ? 'text-primary' : 'text-outline'}`} />
              [ESP32] ESTABLISHING_HANDSHAKE...
            </span>
            {isSocketConnected ? (
              <span className="text-emerald-400 font-bold animate-pulse">CONNECTED</span>
            ) : (
              <span className="text-amber-500 animate-pulse">WAIT</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}