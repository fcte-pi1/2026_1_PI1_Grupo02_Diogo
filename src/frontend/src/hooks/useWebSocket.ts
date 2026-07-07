import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface TelemetryData {
  id: string;
  sessionId: string;
  timestamp: string;
  stepOrder: number;
  posX: number;
  posY: number;
  voltage: number;
  current: number;
  consumption?: number;
  sensors?: {
    front: number;
    left: number;
    right: number;
  };
  walls?: {
    north: boolean;
    south: boolean;
    east: boolean;
    west: boolean;
  };
  conclusao?: boolean;
  estado?: string;
  modo?: string;
}

export function useWebSocket() {
  const [robotData, setRobotData] = useState<TelemetryData | null>(null);
  const [sessionSteps, setSessionSteps] = useState<TelemetryData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Conectar ao Servidor
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const serverUrl = 'http://127.0.0.1:3000';
    
    // Configuração com suporte inicial a polling para contornar restrições rígidas do Firefox
    const socket = io(serverUrl, {
      transports: ['polling', 'websocket'],
      autoConnect: true,
      withCredentials: true
    });

    socket.on('connect', () => {
      setIsConnected(true);
      // Notifica o backend para registrar a subscrição e puxar buffers órfãos
      socket.emit("telemetry:subscribe", { limit: 50 });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setSessionSteps([]);
    });

    // Escuta ativa do pipeline vindo do serviço relacional
    socket.on('telemetry:step', (data: TelemetryData) => {
      setRobotData(data);
      setSessionSteps((prev) => {
        if (prev.some((step) => step.stepOrder === data.stepOrder)) return prev;
        return [...prev, data];
      });
    });

    // Captura o histórico acumulado recente para renderização instantânea ao dar F5
    socket.on('telemetry:history', (historyItems: TelemetryData[]) => {
      if (historyItems.length > 0) {
        setRobotData(historyItems[historyItems.length - 1]);
        setSessionSteps(historyItems);
      }
    });

    socketRef.current = socket;
  }, []);

  // Desconectar do Servidor
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.off('telemetry:step');
      socketRef.current.off('telemetry:history');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setSessionSteps([]);
    }
  }, []);

  // Inicialização automatizada no carregamento do Cockpit
  useEffect(() => {
    connect(); 
    return () => disconnect();
  }, [connect, disconnect]);

  const sendRaceAction = useCallback((action: 'START' | 'PAUSE' | 'STOP') => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('race_action', { action });
    }
  }, []);

  return { robotData, sessionSteps, isConnected, sendRaceAction, connect, disconnect };
}