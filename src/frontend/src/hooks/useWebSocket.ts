// src/hooks/useWebSocket.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface TelemetryData {
  tempoMs: number;
  modo: string;
  voltage: number;
  percentage: number;
  temperature: number;
  motorCurrent: number;
  velocity: number;
  sensors: { front: number; left: number; right: number };
  coordinates: { x: number; y: number };
}

export function useWebSocket() {
  const [robotData, setRobotData] = useState<TelemetryData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // conectar manualmente
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const serverUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
    
    const socket = io(serverUrl, {
      transports: ['websocket'],
      autoConnect: true
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('robot_telemetry', (data: TelemetryData) => setRobotData(data));

    socketRef.current = socket;
  }, []);

  // desconectar manualmente
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.off('robot_telemetry');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // sistema agora inicia desligado por padrão!
  useEffect(() => {
    // Mantemos a desconexão explícita no nascimento do hook
    disconnect(); 
    
    // Configuração futura - ler um localStorage para ligar automático:
    // const autoConnect = localStorage.getItem('auto_connect') === 'true';
    // if (autoConnect) connect();

    return () => disconnect();
  }, [disconnect]);

  const sendRaceAction = useCallback((action: 'START' | 'PAUSE' | 'STOP') => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('race_action', { action });
    }
  }, []);

  return { robotData, isConnected, sendRaceAction, connect, disconnect };
}