import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConnectView from '../../features/network/ConnectView';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock do hook customizado para injetar dados posicionais controlados nos testes
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

  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' }),
    });
  });

  it('deve renderizar o estado de colapso de rede e passar coordenadas default [0,0] para o mapa', () => {
    mockUseWebSocket.mockReturnValue({
      robotData: null,
      isConnected: false,
    });

    render(<ConnectView {...defaultProps} isConnected={false} />);

    // Valida se o mapa de visualização recebeu os fallbacks defensivos [0,0]
    expect(screen.getByTestId('mock-visualize-div')).toHaveTextContent('X: 0, Y: 0');

    // Valida o estado Offline com base nos novos textos do card RSSI Uplink
    expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument();
    expect(screen.getByText('OFFLINE')).toBeInTheDocument();
    expect(screen.getByText('-99 dBm')).toBeInTheDocument();
  });

  it('deve renderizar a telemetria ativa e encaminhar a posição real obtida do websocket para o mapa', () => {
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

    // Garante que o elo posicional foi repassado de forma íntegra para o componente filho
    expect(screen.getByTestId('mock-visualize-div')).toHaveTextContent('X: 4, Y: 8');

    // Valida o estado Online no novo painel RSSI Uplink
    expect(screen.getByTestId('wifi-on-icon')).toBeInTheDocument();
    expect(screen.getByText('STRONG_LINK')).toBeInTheDocument();
  });

  it('deve alternar a exibição das rotas no Inspetor de Tráfego', () => {
    mockUseWebSocket.mockReturnValue({
      robotData: null,
      isConnected: true,
    });

    render(<ConnectView {...defaultProps} isConnected={true} />);

    // Valida os botões de controle de rota existentes no DOM
    const btnHealth = screen.getByRole('button', { name: /get \/health/i });
    const btnTelemetry = screen.getByRole('button', { name: /ws \/telemetry/i });

    expect(btnHealth).toBeInTheDocument();
    expect(btnTelemetry).toBeInTheDocument();

    // Dispara a ação de clique no inspetor
    fireEvent.click(btnHealth);
    expect(screen.getByText(/Buscando dados da rota \/api\/health/i)).toBeInTheDocument();
  });

  it('deve marcar a stack como erro quando o health check falha', async () => {
    mockFetch.mockRejectedValue(new Error('health unavailable'));
    mockUseWebSocket.mockReturnValue({
      robotData: null,
      isConnected: false,
    });

    render(<ConnectView {...defaultProps} isConnected={false} />);

    await waitFor(() => {
      expect(screen.getAllByText('ERROR').length).toBeGreaterThan(0);
    });
  });

  it('deve inspecionar telemetria recebida via websocket', async () => {
    mockUseWebSocket.mockReturnValue({
      robotData: {
        stepOrder: 7,
        posX: 2,
        posY: 3,
        voltage: 11.2,
        current: 210,
      },
      isConnected: true,
    });

    render(<ConnectView {...defaultProps} isConnected={true} />);

    fireEvent.click(screen.getByRole('button', { name: /ws \/telemetry/i }));

    expect(screen.getByText(/"stepOrder": 7/)).toBeInTheDocument();
  });
});