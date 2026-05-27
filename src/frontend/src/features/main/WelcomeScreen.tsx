import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import { AppState } from '../../App';

interface SetupProps {
  appState: AppState;
  onStart: (sessionData: { sessionName: string; algorithm: string; mode: string }) => void;
  isSocketConnected: boolean; // 🚀 Prop real adicionada
}

export default function WelcomeScreen({ onStart, appState, isSocketConnected }: SetupProps) {
  const [sessionName, setSessionName] = useState('');
  const [algorithm, setAlgorithm] = useState('Flood Fill');
  const [mode, setMode] = useState('Mapping');

  return (
    <div className="h-screen w-full bg-background bg-grid flex flex-col overflow-hidden text-on-background relative select-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,#111317_85%)] pointer-events-none z-0" />

      {/* 1. Navbar configurada com mocks seguros já que a sessão não iniciou de fato */}
      <Navbar 
        sessionName="Modo de Configuração Inicial" 
        terminal={false} 
        setViewTerminal={() => {}} 
        appState={appState}
        currentView=''
        isSocketConnected={isSocketConnected}
        onConnect={() => {}}
        onDisconnect={() => {}}
        onRaceAction={() => {}}
      />

      <div className="flex-1 w-full flex items-center justify-center p-container-padding relative z-10">
        <div className="w-full max-w-2xl bg-surface-container-low/60 border border-outline-variant/30 rounded-none p-6 backdrop-blur-md flex flex-col gap-6 border-t-on-primary-container">
          
          <div className="text-center flex flex-col gap-unit">
            <h1 className="text-headline-md font-space tracking-wider text-primary font-bold uppercase">
              Configurar Ambiente
            </h1>
            <p className="text-mono-data text-on-surface-variant/70 text-xs">
              Inicialize seu sistema para começar o ensaio automatizado do rato robótico
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            
            {/* 🟢 COLUNA DA ESQUERDA: Status de Conexão REAIS de Infraestrutura */}
            <div className="md:col-span-2 bg-surface-container-lowest/80 border border-outline-variant/20 rounded-none p-4 font-mono text-[11px] flex flex-col gap-4">
              <h2 className="text-on-surface-variant border-b border-outline-variant/20 pb-1.5 uppercase font-bold tracking-wider text-[10px]">
                Network Protocols
              </h2>
              
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                <div>
                  <p className="text-on-surface font-medium">Backend API</p>
                  <p className="text-[9px] text-outline uppercase">{isSocketConnected ? 'Online // WebSocket' : 'Offline // Server Down'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Broker espelha a conexão do back no ecossistema docker */}
                <span className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                <div>
                  <p className="text-on-surface font-medium">MQTT Broker</p>
                  <p className="text-[9px] text-outline uppercase">{isSocketConnected ? 'Online // Mosquitto' : 'Offline'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-amber-400 animate-pulse' : 'bg-outline-variant/40'}`} />
                <div>
                  <p className="text-on-surface font-medium">Micromouse Uplink</p>
                  <p className="text-[9px] text-outline uppercase">{isSocketConnected ? 'Pending Handshake' : 'Await Network'}</p>
                </div>
              </div>
            </div>

            {/* Coluna da Direita: Formulário (Permanece igual) */}
            <div className="md:col-span-3 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-on-surface-variant uppercase font-bold tracking-wider">Nome da Corrida / Labirinto</label>
                <input 
                  type="text"
                  placeholder="EX: LABIRINTO 1 TESTE"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="bg-surface-container-highest/40 border border-outline-variant/30 rounded-none px-3 py-2 text-xs font-mono text-primary focus:outline-none focus:border-primary/60 transition-colors uppercase placeholder:text-outline/30"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-on-surface-variant uppercase font-bold tracking-wider">Algoritmo de Seleção</label>
                <select 
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value)}
                  className="bg-surface-container-highest/40 border border-outline-variant/30 rounded-none px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-primary/60 transition-colors cursor-pointer"
                >
                  <option value="Flood Fill">Flood Fill (Exploração Padrão)</option>
                  <option value="A* (A-Star)">A* (Caminho Otimizado)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-on-surface-variant uppercase font-bold tracking-wider">Modo de Operação</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => setMode('Mapping')}
                    className={`py-2 text-xs font-mono font-bold uppercase border transition-all rounded-none cursor-pointer ${
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
                    className={`py-2 text-xs font-mono font-bold uppercase border transition-all rounded-none cursor-pointer ${
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

          <button
            type="button"
            onClick={() => onStart({ sessionName: sessionName || 'ENSAIO_PADRAO', algorithm, mode })}
            className="btn-primary w-full mt-2 py-3 tracking-widest text-xs"
          >
            Iniciar Sistema de Dashboard
          </button>

        </div>
      </div>
      
      <footer className="absolute bottom-3 w-full text-center text-[9px] font-mono text-outline/40 tracking-wider">
        UNIVERSIDADE DE BRASÍLIA — PROJETO INTEGRADOR 1 — GRUPO 2 — PROFESSOR DIOGO
      </footer>
    </div>
  );
}