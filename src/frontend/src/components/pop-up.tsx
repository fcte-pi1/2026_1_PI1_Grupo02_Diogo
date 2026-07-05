// aqui ficar o modelo geral dos pop-ups, recomendo fazer uma tela só, fazer com que os dados sejam tipados em title, description, options... fica melhor de estruturar, no caso ele receberia uma state informando qual seria o tipo de popup e com isso ele exibiria na tela... 

// tem q adicionar dentro do app.tsx o efeito blur e o popup para ser exibido no meio da tela...

import React from 'react';

// Tipagem dos dados conforme sugerido nos comentários do grupo
interface PopUpProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  isError?: boolean;
  stats?: {
    mazeType: string;      // Tipo do labirinto
    path: string;          // Trajeto no labirinto
    batteryUsage: string;  // Consumo de bateria
    averageSpeed: string;  // Velocidade média
    completionTime: string;// Tempo de conclusão
    success: boolean;      // Desafio cumprido (S/N)
  };
}

export const PopUp: React.FC<PopUpProps> = ({
  isOpen,
  onClose,
  title,
  description,
  isError = false,
  stats,
}) => {
  if (!isOpen) return null;

  return (
    // Efeito de desfoque/blur de fundo sugerido no comentário do arquivo
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 transition-all">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-full ${isError ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
            {isError ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>

        {/* Descrição Principal (Mensagens da Issue) */}
        <p className="text-gray-600 mb-4 text-sm leading-relaxed">
          {description}
        </p>

        {/* Bloco de Estatísticas de Telemetria (Se houver) */}
        {stats && (
          <div className="bg-gray-50 rounded-lg p-4 mb-5 text-xs text-gray-700 border border-gray-200/60 space-y-2">
            <h4 className="font-bold text-gray-900 border-b pb-1.5 mb-2 flex justify-between text-xs uppercase tracking-wider">
              <span>📊 Dados de Telemetria</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${stats.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {stats.success ? 'Cumprido' : 'Falhou'}
              </span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <p><strong>Labirinto:</strong> {stats.mazeType}</p>
              <p><strong>Tempo:</strong> {stats.completionTime}</p>
              <p><strong>Velocidade Média:</strong> {stats.averageSpeed}</p>
              <p><strong>Bateria:</strong> {stats.batteryUsage}</p>
            </div>
            <p className="pt-1 border-t border-gray-200 truncate">
              <strong>Trajeto:</strong> <span className="font-mono text-gray-600">{stats.path}</span>
            </p>
          </div>
        )}

        {/* Botão de Fechar */}
        <button
          onClick={onClose}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
        >
          Fechar Janela
        </button>
      </div>
    </div>
  );
};