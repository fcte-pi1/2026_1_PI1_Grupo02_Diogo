import { Timer } from 'lucide-react';

interface RaceTimerProps {
  elapsedMs: number;  // Recebe o tempo exato calculado via timestamps
  stepCount: number;  // Recebe o passo atual do robô
  isActive: boolean;
}

export default function RaceTimer({ elapsedMs, stepCount, isActive }: RaceTimerProps) {
  // Formatação matemática precisa baseada nos pacotes de rede
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);

    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
  };

  return (
    <div data-testid="race-timer" className="bg-surface-container-low/60 border border-outline-variant/30 backdrop-blur-md p-stack-md flex flex-col gap-stack-sm rounded-none w-full">
      
      <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2">
        <h2 className="text-label-caps text-xs font-bold text-on-surface-variant tracking-widest uppercase flex items-center gap-stack-sm">
          <Timer className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
          Cronômetro
        </h2>
        <span data-testid="race-timer-status" className={`text-[10px] px-2 py-0.5 border border-solid font-mono ${isActive ? 'bg-secondary-container/10 border-emerald-500 text-emerald-400 animate-pulse' : 'bg-surface-variant text-outline border-outline/20'}`}>
          {isActive ? 'ACTIVE' : 'STANDBY'}
        </span>
      </div>

      <div className="text-center py-2">
        <span data-testid="race-timer-value" className="font-mono text-2xl font-bold text-primary tracking-wider block drop-shadow-[0_0_10px_rgba(157,226,255,0.1)]">
          {formatTime(elapsedMs)}
        </span>
      </div>

      <div>
        <ul className="flex flex-col gap-unit font-mono text-[12px] text-on-surface-variant">
          <li className="flex justify-between py-1">
            <span>PASSO ATUAL:</span>
            <span className="font-bold text-primary">#{stepCount}</span>
          </li>
          <li className="flex justify-between py-1 border-t border-outline-variant/10">
            <span>MELHOR VOLTA:</span>
            <span className="font-bold text-outline">--:--.--</span>
          </li>
        </ul>
      </div>
    </div>
  );
}