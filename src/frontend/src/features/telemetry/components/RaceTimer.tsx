import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

interface RaceTimerProps {
  startTime: string | null; // ISO Timestamp enviado pelo backend quando a corrida inicia
  isActive: boolean;        // Controla se o tempo deve rodar ou ficar congelado
}

export default function RaceTimer({ startTime, isActive }: RaceTimerProps) {
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isActive && startTime) {
      const startMs = new Date(startTime).getTime();
      
      intervalId = setInterval(() => {
        const nowMs = new Date().getTime();
        setTimeElapsed(Math.max(0, nowMs - startMs));
      }, 10); // Atualiza a cada 10ms para capturar os centésimos de segundo
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isActive, startTime]);

  // Função para formatar os milissegundos em MM:SS.CC (Minutos, Segundos, Centésimos)
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
          Cronômetro
        </h2>
        <span className={`text-[10px] px-2 py-0.5 border font-mono ${isActive ? 'bg-secondary-container/10 border-secondary text-secondary-fixed animate-pulse' : 'bg-surface-variant text-outline'}`}>
          {isActive ? 'ACTIVE' : 'STANDBY'}
        </span>
      </div>

      {/* Relógio em formato display digital de telemetria */}
      <div className="text-center py-2">
        <span className="font-telemetry text-display-telem font-bold text-primary tracking-wider block drop-shadow-[0_0_10px_rgba(157,226,255,0.1)]">
          {formatTime(timeElapsed)}
        </span>
      </div>

      <div>
           <ul className="flex flex-col gap-unit font-mono text-[12px] text-on-surface-variant">
            <li className="flex justify-between py-1">
            <span>Quantidade de passsos:</span>
            <span className="font-telemetry text-primary-fixed">0</span>
            </li>

            <li className="flex justify-between py-1">
            <span>MELHOR VOLTA:</span>
            <span className="font-telemetry text-primary-fixed">0:00.00</span>
            </li>
          </ul>
      </div>
      
    </div>
  );
}