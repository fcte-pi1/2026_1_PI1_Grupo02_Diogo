import { SquareTerminal } from 'lucide-react';
import { AppState } from "../App";

interface NavbarProps {
  sessionName?: string;
  runtime?: boolean;
  terminal: boolean;
  appState: AppState;
  setViewTerminal: React.Dispatch<React.SetStateAction<boolean>>;
}

function Navbar({ 
  sessionName = "Sessão Ativa", 
  terminal, 
  setViewTerminal,
  appState
}: NavbarProps) {
  
  return (
    <header className="w-full h-12 bg-surface-container-low/40 border-b border-outline-variant/30 backdrop-blur-md flex justify-between items-center px-container-padding font-space text-[11px] font-medium tracking-widest uppercase text-on-surface-variant/70 shrink-0 select-none z-20">
      
      {/* Lado Esquerdo: Identificação ou Status */}
      <div className="flex items-center gap-stack-md">
        <span>SYSTEM: <span className="text-secondary-fixed font-bold animate-pulse">ONLINE</span></span>
        <span className="text-outline/40">|</span>
        <span className="text-primary-fixed-dim font-mono">{sessionName}</span>
      </div>
      
      {/* Lado Direito: Renderização Condicional baseada no Estado do App */}
      <div className="font-mono text-right text-[10px] text-outline flex items-center gap-stack-md">
        {appState === AppState.RUNNING ? (
          <div className="flex items-center gap-stack-md">
            <button className='btn-green'>
              iniciar corrida
            </button>
            
            <button 
              className="btn-secondary w-fit flex text-[10px]" 
              onClick={() => setViewTerminal(!terminal)}
              >
              <SquareTerminal className='size-4 mr-2'/>
              {terminal ? 'Ocultar Terminal' : 'Ver Terminal'}
            </button>
            </div>
        ): (
        
        <span>
          OP_V6R_PRE-RACE // SYS_LOAD: 12.4%
        </span>
        )}

      </div>

    </header>
  );
}

export default Navbar;