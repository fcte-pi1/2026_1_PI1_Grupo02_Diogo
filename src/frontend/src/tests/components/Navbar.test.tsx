import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Navbar from '../../components/Navbar'; // Ajuste o caminho relativo se necessário
import { AppState } from '../../App';

describe('Navbar Component', () => {
  const defaultProps = {
    sessionName: 'Sessão Ativa UnB',
    terminal: true,
    setViewTerminal: vi.fn(),
    appState: AppState.RUNNING,
    currentView: 'dashboard',
    onRaceAction: vi.fn(),
    isSocketConnected: true,
    onConnect: vi.fn(),
    onDisconnect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock global do confirm do navegador para não travar o teste
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  it('deve renderizar os indicadores de conexão e o nome da sessão corretamente', () => {
    render(<Navbar {...defaultProps} isSocketConnected={true} />);

    expect(screen.getByText(/SOCKET:/i)).toBeInTheDocument();
    expect(screen.getByText(/ONLINE/i)).toBeInTheDocument();
    expect(screen.getByText('Sessão Ativa UnB')).toBeInTheDocument();
  });

  it('deve exibir o indicador OFFLINE caso o socket esteja desconectado', () => {
    render(<Navbar {...defaultProps} isSocketConnected={false} />);
    
    expect(screen.getByText(/OFFLINE/i)).toBeInTheDocument();
  });

  it('deve alternar a visibilidade do terminal ao clicar no botão correspondente', () => {
    render(<Navbar {...defaultProps} terminal={true} />);

    const terminalBtn = screen.getByRole('button', { name: /ocultar terminal/i });
    expect(terminalBtn).toBeInTheDocument();

    fireEvent.click(terminalBtn);
    expect(defaultProps.setViewTerminal).toHaveBeenCalledWith(false);
  });

  it('deve renderizar os botões de gerência de rede apenas quando a view atual for network', () => {
    const { rerender } = render(<Navbar {...defaultProps} currentView="dashboard" />);
    
    // Na aba dashboard, os botões Conectar/Encerrar não devem existir no DOM
    expect(screen.queryByRole('button', { name: /conectar/i })).not.toBeInTheDocument();

    // Rerenderiza mudando para a aba de redes
    rerender(<Navbar {...defaultProps} currentView="network" />);
    expect(screen.getByRole('button', { name: /encerrar conexão/i })).toBeInTheDocument();
  });

  it('deve habilitar e disparar a ação onConnect quando o socket estiver offline na view de network', () => {
    render(<Navbar {...defaultProps} currentView="network" isSocketConnected={false} />);

    const connectBtn = screen.getByRole('button', { name: /conectar/i });
    expect(connectBtn).not.toBeDisabled();
    expect(connectBtn.className).not.toContain('opacity-40');

    fireEvent.click(connectBtn);
    expect(defaultProps.onConnect).toHaveBeenCalledTimes(1);
  });

  it('deve alternar entre os botões de conectar e desconectar dependendo do status do socket na view de network', () => {
    // 1. Quando o socket está desconectado (false)
    const { rerender } = render(<Navbar {...defaultProps} currentView="network" isSocketConnected={false} />);
    
    const connectBtn = screen.getByRole('button', { name: /conectar/i });
    const disconnectBtn = screen.getByRole('button', { name: /encerrar conexão/i });

    expect(connectBtn).not.toBeDisabled();
    expect(disconnectBtn).toBeDisabled(); // Fica opaco e travado

    // 2. Quando o socket conecta (true)
    rerender(<Navbar {...defaultProps} currentView="network" isSocketConnected={true} />);
    
    // 🚀 CORREÇÃO CRÍTICA: Em vez de sumir do DOM, ele deve ficar desativado (disabled)
    expect(connectBtn).toBeDisabled();
    expect(connectBtn.className).toContain('opacity-40');
    expect(disconnectBtn).not.toBeDisabled();
  });

  it('deve gerenciar a desconexão chamando onDisconnect mediante confirmação do usuário', () => {
    render(<Navbar {...defaultProps} currentView="network" isSocketConnected={true} />);

    const disconnectBtn = screen.getByRole('button', { name: /encerrar conexão/i });
    expect(disconnectBtn).not.toBeDisabled();

    fireEvent.click(disconnectBtn);
    
    expect(window.confirm).toHaveBeenCalledWith('Deseja encerrar a sessão de WebSocket com o Backend?');
    expect(defaultProps.onDisconnect).toHaveBeenCalledTimes(1);
  });
});