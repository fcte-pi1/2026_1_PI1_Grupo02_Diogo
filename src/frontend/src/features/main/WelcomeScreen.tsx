import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import { AppState } from '../../App';

interface SetupProps {
  appState: AppState;
  onStart: (sessionData: { sessionName: string; algorithm: string; mode: string }) => void;
}

export default function WelcomeScreen({ onStart, appState }: SetupProps) {
  const [sessionName, setSessionName] = useState('');
  const [algorithm, setAlgorithm] = useState('Flood Fill');
  const [mode, setMode] = useState('Mapping');

  // Simulação de status baseados nas cores fixas do seu design system
  const status = {
    backend: true,
    mqtt: true,
    esp32: false, 
  };

  return (
    <div className="h-screen w-full bg-background bg-grid flex flex-col overflow-hidden text-on-background relative select-none">
      
      {/* Camada do Gradiente Radial para dar profundidade de cockpit */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,#111317_85%)] pointer-events-none z-0" />

      {/* 1. Navbar fixa no topo herdando o contexto de Setup do percurso */}
      <Navbar sessionName="Modo de Configuração Inicial" terminal={false} setViewTerminal={(v) => {}} appState={appState}/>

      {/* 2. Área útil centralizada para o Card (Ocupa o resto do espaço disponível) */}
      <div className="flex-1 w-full flex items-center justify-center p-container-padding relative z-10">
        
        {/* 3. Card Central de Configuração (Glassmorphism Nível 2 / Cantos Retos) */}
        <div className="w-full max-w-2xl bg-surface-container-low/60 border border-outline-variant/30 rounded-none p-stack-lg backdrop-blur-md flex flex-col gap-stack-lg border-t-on-primary-container">
          
          {/* Cabeçalho do Card */}
          <div className="text-center flex flex-col gap-unit">
            <h1 className="text-headline-md font-space tracking-wider text-primary font-bold uppercase">
              Configurar Ambiente
            </h1>
            <p className="text-mono-data text-on-surface-variant/70">
              Inicialize seu sistema para começar o ensaio automatizado do rato robótico
            </p>
          </div>

          {/* Corpo principal em duas colunas (Status na esquerda e Form na direita) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-gutter">
            
            {/* Coluna da Esquerda: Status de Conexão (Ocupa 2/5 do espaço) */}
            <div className="md:col-span-2 bg-surface-container-lowest/80 border border-outline-variant/20 rounded-none p-stack-md font-space text-[12px] flex flex-col gap-stack-md">
              <h2 className="text-on-surface-variant border-b border-outline-variant/20 pb-1.5 uppercase font-bold tracking-wider text-[11px]">
                Network Protocols
              </h2>
              
              <div className="flex items-center gap-stack-sm">
                <span className={`w-2 h-2 rounded-full ${status.backend ? 'bg-secondary-fixed-dim animate-pulse' : 'bg-error'}`} />
                <div>
                  <p className="text-on-surface font-medium">Backend API</p>
                  <p className="text-[10px] text-outline uppercase">Online // WebSocket</p>
                </div>
              </div>

              <div className="flex items-center gap-stack-sm">
                <span className={`w-2 h-2 rounded-full ${status.mqtt ? 'bg-secondary-fixed-dim animate-pulse' : 'bg-error'}`} />
                <div>
                  <p className="text-on-surface font-medium">MQTT Broker</p>
                  <p className="text-[10px] text-outline uppercase">Online // Mosquitto</p>
                </div>
              </div>

              <div className="flex items-center gap-stack-sm">
                <span className={`w-2 h-2 rounded-full ${status.esp32 ? 'bg-secondary-fixed-dim' : 'bg-tertiary-fixed-dim animate-pulse'}`} />
                <div>
                  <p className="text-on-surface font-medium">Micromouse Uplink</p>
                  <p className="text-[10px] text-outline uppercase">Pending Handshake</p>
                </div>
              </div>
            </div>

            {/* Coluna da Direita: Formulário de Inputs (Ocupa 3/5 do espaço) */}
            <div className="md:col-span-3 flex flex-col gap-stack-md">
              
              {/* Input: Nome da Corrida/Sessão */}
              <div className="flex flex-col gap-unit">
                <label className="text-[11px] font-space text-on-surface-variant uppercase font-bold tracking-wider">Nome da Corrida / Labirinto</label>
                <input 
                  type="text"
                  placeholder="EX: LABIRINTO 1 TESTE"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="bg-surface-container-highest/40 border border-outline-variant/30 rounded-none px-3 py-2 text-sm font-space text-primary focus:outline-none focus:border-primary/60 transition-colors uppercase placeholder:text-outline/30"
                />
              </div>

              {/* Select: Algoritmo */}
              <div className="flex flex-col gap-unit">
                <label className="text-[11px] font-space text-on-surface-variant uppercase font-bold tracking-wider">Algoritmo de Seleção</label>
                <select 
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value)}
                  className="bg-surface-container-highest/40 border border-outline-variant/30 rounded-none px-3 py-2 text-sm font-space text-on-surface focus:outline-none focus:border-primary/60 transition-colors cursor-pointer"
                >
                  <option value="Flood Fill">Flood Fill (Exploração Padrão)</option>
                  <option value="A* (A-Star)">A* (Caminho Otimizado)</option>
                </select>
              </div>

              {/* Select: Modo de Operação */}
              <div className="flex flex-col gap-unit">
                <label className="text-[11px] font-space text-on-surface-variant uppercase font-bold tracking-wider">Modo de Operação</label>
                <div className="grid grid-cols-2 gap-stack-sm">
                  <button 
                    type="button"
                    onClick={() => setMode('Mapping')}
                    className={`py-2 text-xs font-space font-bold uppercase border transition-all rounded-none cursor-pointer ${
                      mode === 'Mapping' 
                        ? 'bg-primary/10 border-primary text-primary' 
                        : 'bg-surface-container-highest/20 border-outline-variant/30 text-on-surface-variant/60 hover:text-on-surface'
                    }`}
                  >
                    Mapeamento
                  </button>
                  <button 
                    type="button"
                    onClick={() => setMode('Fast Run')}
                    className={`py-2 text-xs font-space font-bold uppercase border transition-all rounded-none cursor-pointer ${
                      mode === 'Fast Run' 
                        ? 'bg-primary/10 border-primary text-primary' 
                        : 'bg-surface-container-highest/20 border-outline-variant/30 text-on-surface-variant/60 hover:text-on-surface'
                    }`}
                  >
                    Fast Run
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* 4. Botão de Lançamento aplicando sua classe utilitária global do index.css */}
          <button
            type="button"
            onClick={() => onStart({ sessionName: sessionName || 'ENSAIO_PADRAO', algorithm, mode })}
            className="btn-primary w-full mt-2 py-3.5 tracking-widest text-[13px]"
          >
            Iniciar Sistema de Dashboard
          </button>

        </div>
      </div>
      
      {/* Rodapé técnico sutil */}
      <footer className="absolute bottom-3 w-full text-center text-[10px] font-space text-outline/40 tracking-wider">
        UNIVERSIDADE DE BRASÍLIA — PROJETO INTEGRADOR 1 — GRUPO 2 — PROFESSOR DIOGO
      </footer>
    </div>
  );
}