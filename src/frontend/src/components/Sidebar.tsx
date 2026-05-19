import { useState } from 'react';
import { LayoutDashboard, Settings, ScrollText, WifiSync, LogOut, ArrowLeftToLine, CircleFadingPlus } from 'lucide-react';
import { AppState } from '../App';

interface SidebarProps {
  currentView?: string;
  activeSession?: string;
  setCurrentState: React.Dispatch<React.SetStateAction<AppState>>; 
  onNavigate?: (view: string) => void;
}

export default function Sidebar({ currentView = 'dashboard', onNavigate, setCurrentState }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'network', label: 'Conexão', icon: WifiSync },
    { id: 'logs', label: 'Logs do Sistema', icon: ScrollText },
    { id: 'config', label: 'Configurações', icon: Settings },
  ];

  // Fica true quando a barra está colapsada (apenas ícones)
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <aside
      className={`h-full bg-surface-container-low/60 border-r border-outline-variant/30 backdrop-blur-md flex flex-col justify-between transition-all duration-300 ease-in-out select-none shrink-0 z-30 ${
        isNavOpen ? 'w-16 p-stack-md' : 'w-64 p-container-padding'
      }`}
    >
      {/* Bloco Superior: Logo + Navegação */}
      <div className="flex flex-col gap-stack-lg">
        
        {/* Cabeçalho / Identificação do Sistema */}
        <div className="flex flex-col gap-unit border-b border-outline-variant/10 pb-stack-sm">
          <div className={`flex items-center justify-between ${isNavOpen ? 'flex-col gap-stack-sm' : 'flex-row'}`}>
            
            {/* Esconde o título principal se estiver colapsado */}
            {!isNavOpen && (
              <h2 className="text-label-caps font-bold text-primary tracking-widest uppercase truncate">
                PROJETO DE PI1
              </h2>
            )}

            {/* Botão de Toggle com rotação dinâmica no ícone */}
            <button 
              onClick={() => setIsNavOpen((s) => !s)} 
              aria-label="Toggle sidebar"
              className="text-on-surface-variant hover:text-primary transition-all cursor-pointer p-1 bg-surface-container-lowest/40 border border-outline-variant/10"
            >
              <ArrowLeftToLine className={`w-4 h-4 transition-transform duration-300 ${isNavOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Esconde o subtexto da UnB/Grupo se colapsado */}
          {!isNavOpen && (
            <span className="text-[10px] font-mono text-on-surface-variant/60 tracking-wider transition-all">
              GRUPO_02 // RAT_V6R
            </span>
          )}
        </div>

        {/* Links de Navegação */}
        <nav className="flex flex-col gap-stack-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate?.(item.id)}
                title={isNavOpen ? item.label : undefined} // Mostra tooltip se estiver fechada
                className={`w-full flex items-center transition-all rounded-none border-l-2 cursor-pointer ${
                  isNavOpen ? 'justify-center py-3 px-0' : 'gap-stack-sm px-stack-md py-3'
                } ${
                  isActive
                    ? 'bg-primary/5 border-primary text-primary'
                    : 'bg-transparent border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`} strokeWidth={1.5} />
                
                {/* Texto do menu some se colapsado */}
                {!isNavOpen && (
                  <span className="font-space text-[14px] font-medium tracking-wide uppercase truncate">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bloco Inferior: Status Crítico + Ação de Sair */}
      <div className="flex flex-col gap-stack-md border-t border-outline-variant/20 pt-stack-md">
        
        <button className='btn-primary text-xs gap-stack-md'>< CircleFadingPlus className="w-3.5 h-3.5 shrink-0"/>Criar labirinto</button>

        {/* Botão de Desconexão / Encerrar Sessão */}
        <button 
          onClick={() => { if (confirm("Deseja encerrar a sessão?")) setCurrentState(AppState.WELCOME); }}
          title={isNavOpen ? "Encerrar Ensaio" : undefined}
          className={`w-full flex items-center text-error hover:text-on-error hover:bg-error-container/40 font-space uppercase tracking-wider rounded-none border border-transparent hover:border-error-container transition-all cursor-pointer ${
            isNavOpen ? 'justify-center py-2.5 px-0' : 'gap-stack-sm px-stack-md py-2.5 text-[12px] font-bold'
          }`}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
          
          {/* Texto do botão de deslogar some se colapsado */}
          {!isNavOpen && <span className="truncate">Encerrar Ensaio</span>}
        </button>
      </div>

    </aside>
  );
}