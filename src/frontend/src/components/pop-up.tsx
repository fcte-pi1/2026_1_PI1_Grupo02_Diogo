import React from 'react';
import { AlertTriangle, CheckSquare, Clock, Zap, BatteryCharging, Route, Target, History, X } from 'lucide-react';

// Tipagem dos dados alinhada com as necessidades do projeto
interface PopUpProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToHistory?: () => void; // 🚀 Adicionado para redirecionar o usuário
  title: string;
  description: string;
  isError?: boolean;
  stats?: {
    mazeType: string;      
    path: string;          
    batteryUsage: string;  
    averageSpeed: string;  
    completionTime: string;
    stepCount?: number;    // 🚀 Quantidade de passos
    success: boolean;      
  };
}

export const PopUp: React.FC<PopUpProps> = ({
  isOpen,
  onClose,
  onGoToHistory,
  title,
  description,
  isError = false,
  stats,
}) => {
  if (!isOpen) return null;

  return (
    // Fundo com blur e máscara escura, z-index bem alto para sobrepor tudo
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] transition-all font-mono">
      
      {/* Container principal estilizado como o Cockpit */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 shadow-[0_0_30px_rgba(0,0,0,0.8)] max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabeçalho */}
        <div className="flex items-start justify-between mb-4 border-b border-outline-variant/20 pb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 border ${isError ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
              {isError ? <AlertTriangle className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
            </div>
            <h3 className={`text-sm font-bold uppercase tracking-widest ${isError ? 'text-red-400' : 'text-primary'}`}>
              {title}
            </h3>
          </div>
          <button onClick={onClose} className="text-outline hover:text-primary transition-colors p-1" title="Fechar">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Descrição Principal */}
        <p className="text-on-surface-variant text-xs leading-relaxed mb-6">
          {description}
        </p>

        {/* Bloco de Estatísticas de Telemetria */}
        {stats && (
          <div className="bg-surface-container-low/50 border border-outline-variant/20 p-4 mb-6 space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-primary" /> Consolidação de Telemetria
              </span>
              <span className={`px-2 py-0.5 border text-[9px] uppercase tracking-wider ${stats.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                {stats.success ? 'Sessão Válida' : 'Falha Crítica'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-outline flex items-center gap-1"><Route className="w-3 h-3" /> LABIRINTO</span>
                <span className="text-on-surface font-bold truncate" title={stats.mazeType}>{stats.mazeType}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-outline flex items-center gap-1"><Clock className="w-3 h-3" /> TEMPO DECORRIDO</span>
                <span className="text-primary font-bold">{stats.completionTime}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-outline flex items-center gap-1"><Zap className="w-3 h-3" /> VEL. MÉDIA</span>
                <span className="text-on-surface font-bold">{stats.averageSpeed}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-outline flex items-center gap-1"><BatteryCharging className="w-3 h-3" /> CONSUMO</span>
                <span className="text-on-surface font-bold">{stats.batteryUsage}</span>
              </div>

              {/* Linha separada para total de passos */}
              {stats.stepCount !== undefined && (
                <div className="flex flex-col gap-1 col-span-2 border-t border-outline-variant/10 pt-2 mt-1">
                  <span className="text-[9px] text-outline flex items-center gap-1"><Target className="w-3 h-3" /> TOTAL DE PASSOS (STEPS)</span>
                  <span className="text-primary font-bold">{stats.stepCount} iterações processadas</span>
                </div>
              )}
            </div>

            <div className="border-t border-outline-variant/10 pt-2 mt-2">
              <span className="text-[9px] text-outline block mb-1">TRAJETO (ÚLTIMOS NÓS):</span>
              <span className="font-mono text-emerald-400/80 text-[10px] break-all">{stats.path}</span>
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex gap-3">
          {onGoToHistory && (
            <button
              onClick={() => {
                onClose();
                onGoToHistory();
              }}
              className="flex-1 bg-primary/10 border border-primary text-primary hover:bg-primary/20 font-bold py-2.5 px-4 flex items-center justify-center gap-2 transition-colors uppercase text-[10px] tracking-widest cursor-pointer"
            >
              <History className="w-3.5 h-3.5" /> Ir para Histórico
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 bg-surface-container-low border border-outline-variant/30 text-outline hover:text-on-surface font-bold py-2.5 px-4 flex items-center justify-center transition-colors uppercase text-[10px] tracking-widest cursor-pointer"
          >
            Fechar 
          </button>
        </div>
      </div>
    </div>
  );
};