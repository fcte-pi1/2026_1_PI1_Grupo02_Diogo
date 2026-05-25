import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

interface RaceTimerProps {
  timeMs?: number;    // O tempo bruto em ms vindo do WebSocket (Opcional para permitir mock)
  isActive: boolean;  // Controla se o tempo está rodando ou parado
  startTime: string | null;
}

export default function RaceTimer({ timeMs, isActive, startTime }: RaceTimerProps) {
  const [mockTime, setMockTime] = useState(0);

  // 🔄 Efeito de Simulação (Mock): Só roda se o WebSocket NÃO estiver enviando dados reais
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (isActive && timeMs === undefined) {
      intervalId = setInterval(() => {
        setMockTime((prev) => prev + 10); // Simula o avanço de 10ms localmente
      }, 10);
    }

    if (!isActive) {
      setMockTime(0); // Reseta a simulação se for para Standby
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isActive, timeMs]);

  // Define qual tempo renderizar: O real do socket (se existir) ou o simulado local
  const actualTime = timeMs !== undefined ? timeMs : mockTime;

  // Função pura para formatar os milissegundos em MM:SS.CC
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);

    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
  };

  return (
    <div className="bg-surface-container-low/60 border border-outline-variant/30 backdrop-blur-md p-stack-md flex flex-col gap-stack-sm rounded-none w-full">
      
      <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2">
        <h2 className="text-label-caps text-xs font-bold text-on-surface-variant tracking-widest uppercase flex items-center gap-stack-sm">
          <Timer className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
          Cronômetro {timeMs === undefined && isActive && <span className="text-[9px] text-amber-500">(MOCK)</span>}
        </h2>
        <span className={`text-[10px] px-2 py-0.5 border border-solid font-mono ${isActive ? 'bg-secondary-container/10 border-emerald-500 text-emerald-400 animate-pulse' : 'bg-surface-variant text-outline border-outline/20'}`}>
          {isActive ? 'ACTIVE' : 'STANDBY'}
        </span>
      </div>

      {/* Relógio em formato display digital de telemetria */}
      <div className="text-center py-2">
        <span className="font-mono text-2xl font-bold text-primary tracking-wider block drop-shadow-[0_0_10px_rgba(157,226,255,0.1)]">
          {formatTime(actualTime)}
        </span>
      </div>

      <div>
        <ul className="flex flex-col gap-unit font-mono text-[12px] text-on-surface-variant">
          <li className="flex justify-between py-1">
            <span>Quantidade de passos:</span>
            <span className="font-bold text-primary">0</span>
          </li>
          <li className="flex justify-between py-1">
            <span>MELHOR VOLTA:</span>
            <span className="font-bold text-primary">{startTime}</span>
          </li>
        </ul>
      </div>
      
    </div>
  );
}