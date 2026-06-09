import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConnectView from '../../features/network/ConnectView';

// 🚀 Mock do hook customizado para injetar dados posicionais controlados nos testes
const mockUseWebSocket = vi.fn();
vi.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: () => mockUseWebSocket(),
}));

// Mock do componente VisualizeDiv para isolar a infraestrutura de rede
vi.mock('../../components/VisualizeDiv', () => ({
  VisualizeDiv: (props: { posX: number; posY: number }) => (
    <div data-testid="mock-visualize-div">
      Visualize Component (X: {props.posX}, Y: {props.posY})
    </div>
  ),
}));

describe('ConnectView Component', () => {
  const defaultProps = {
    currentView: 'network',
    connectionProps: null,
  };

  it('deve renderizar o estado de colapso de rede e passar coordenadas default [0,0] para o mapa', () => {
    // Configura o mock do hook para retornar dados nulos/offline neste caso
    mockUseWebSocket.mockReturnValue({
      robotData: null,
      isConnected: false,
    });

    render(<ConnectView {...defaultProps} isConnected={false} />);

    // Valida se o mapa de visualização recebeu os fallbacks defensivos [0,0]
    expect(screen.getByTestId('mock-visualize-div')).toHaveTextContent('X: 0, Y: 0');

    // Valida o estado Offline geral
    expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument();
    expect(screen.getByText('NO SIGNAL')).toBeInTheDocument();
    expect(screen.getByText('-99 DBM')).toBeInTheDocument();
  });

  it('deve renderizar a telemetria ativa e encaminhar a posição real obtida do websocket para o mapa', () => {
    // Configura o mock do hook para simular o robô andando no índice cartesiano [4, 8]
    mockUseWebSocket.mockReturnValue({
      robotData: {
        stepOrder: 101,
        posX: 4,
        posY: 8,
        voltage: 11.1,
        current: 230,
      },
      isConnected: true,
    });

    render(<ConnectView {...defaultProps} isConnected={true} />);

    // 🚀 Sucesso! Garante que o elo posicional foi repassado de forma íntegra para o componente filho
    expect(screen.getByTestId('mock-visualize-div')).toHaveTextContent('X: 4, Y: 8');

    // Valida o estado Online geral
    const connectedBadges = screen.getAllByText('CONNECTED');
    expect(connectedBadges).toHaveLength(3);
    expect(screen.getByTestId('wifi-on-icon')).toBeInTheDocument();
    expect(screen.getByText('STRONG')).toBeInTheDocument();
  });

  it('deve recalcular a latência ao acionar o botão de reestabelecimento', () => {
    mockUseWebSocket.mockReturnValue({
      robotData: null,
      isConnected: true,
    });

    render(<ConnectView {...defaultProps} isConnected={true} />);

    const button = screen.getByRole('button', { name: /reestabelecer redes/i });
    expect(screen.getByText(/-42 DBM/i)).toBeInTheDocument();

    fireEvent.click(button);

    const dbmElement = screen.getByText(/-[3-6][0-9] DBM/i);
    expect(dbmElement).toBeInTheDocument();
  });
});