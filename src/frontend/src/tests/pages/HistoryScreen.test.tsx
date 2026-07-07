import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import HistoryScreen from '../../features/history/HistoryScreen';
import { listSessions, getSessionById, deleteSession } from '../../api/sessions';
import { ApiError } from '../../api/client';
import type { SessionDetail, SessionMetadata } from '../../types/session';

vi.mock('../../api/sessions', () => ({
  listSessions: vi.fn(),
  getSessionById: vi.fn(),
  deleteSession: vi.fn(),
}));

vi.mock('../../features/history/SessionReplayGrid', () => ({
  SessionReplayGrid: (props: { activeIndex: number }) => (
    <div data-testid="mock-replay-grid">
      Grid Ativo (Passo Atual Index: {props.activeIndex})
    </div>
  ),
}));

describe('HistoryScreen Component', () => {
  const mockSessionsMetadata: SessionMetadata[] = [
    {
      id: 'sessao-1',
      name: 'Corrida Estável DFS',
      algorithm: 'DFS',
      createdAt: '2026-06-08T20:00:00.000Z',
      durationMs: 45000,
      isCompleted: true,
      completed: true,
      isConnected: false,
      initialVoltage: 12.0,
      finalVoltage: 11.2,
    } as unknown as SessionMetadata,
    {
      id: 'sessao-2',
      name: 'Exploração Incompleta',
      algorithm: 'Floodfill',
      createdAt: '2026-06-08T21:00:00.000Z',
      durationMs: 12000,
      isCompleted: false,
      completed: false,
      isConnected: false,
      initialVoltage: 12.2,
      finalVoltage: 12.1,
    } as unknown as SessionMetadata
  ];

  const mockSessionDetail = {
    id: 'sessao-1',
    name: 'Corrida Estável DFS',
    algorithm: 'DFS',
    durationMs: 45000,
    initialVoltage: 12.0,
    finalVoltage: 11.2,
    createdAt: '2026-06-08T20:00:00.000Z',
    isCompleted: true,
    completed: true,
    isConnected: false,
    steps: [
      { id: 'step-1', sessionId: 'sessao-1', stepOrder: 0, posX: 0, posY: 0, voltage: 12.0, current: 150, timestamp: '2026-06-08T20:00:00.000Z', createdAt: '2026-06-08T20:00:00.000Z' },
      { id: 'step-2', sessionId: 'sessao-1', stepOrder: 1, posX: 0, posY: 1, voltage: 11.8, current: 180, timestamp: '2026-06-08T20:00:05.000Z', createdAt: '2026-06-08T20:00:05.000Z' },
      { id: 'step-3', sessionId: 'sessao-1', stepOrder: 2, posX: 1, posY: 1, voltage: 11.2, current: 210, timestamp: '2026-06-08T20:00:10.000Z', createdAt: '2026-06-08T20:00:10.000Z' },
    ],
  } as unknown as SessionDetail;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers(); 
  });

  it('deve renderizar a tabela com as sessões retornadas pela API', async () => {
    vi.mocked(listSessions).mockResolvedValue({ items: mockSessionsMetadata, count: mockSessionsMetadata.length });

    render(<HistoryScreen />);

    expect(screen.getByText(/Banco de Sessões/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Corrida Estável DFS')).toBeInTheDocument();
    });

    expect(screen.getByText('Exploração Incompleta')).toBeInTheDocument();
  });

  it('deve exibir feedback visual apropriado se não existirem sessões no banco', async () => {
    vi.mocked(listSessions).mockResolvedValue({ items: [], count: 0 });

    render(<HistoryScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Nenhuma sessão consolidada encontrada/i)).toBeInTheDocument();
    });
  });

  it('deve exibir mensagem de erro caso a requisição da listagem falhe', async () => {
    const apiErrorMock = Object.create(ApiError.prototype);
    apiErrorMock.message = 'Erro de conexão com o PostgreSQL';
    apiErrorMock.status = 500;
    
    vi.mocked(listSessions).mockRejectedValue(apiErrorMock);

    render(<HistoryScreen />);

    await waitFor(() => {
      expect(screen.getByText('Erro de conexão com o PostgreSQL')).toBeInTheDocument();
    });
  });

  it('deve abrir a visão de detalhes da sessão e permitir controlar a reprodução do replay', async () => {
    vi.mocked(listSessions).mockResolvedValue({ items: mockSessionsMetadata, count: mockSessionsMetadata.length });
    vi.mocked(getSessionById).mockResolvedValue(mockSessionDetail);

    render(<HistoryScreen />);

    await waitFor(() => {
      const row = screen.getByText('Corrida Estável DFS');
      fireEvent.click(row);
    });

    await waitFor(() => {
      // 🚀 CORREÇÃO: Ajustado para mapear a string nova "Variação de Tensão"
      expect(screen.getByText(/Variação de Tensão/i)).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('mock-replay-grid')).toHaveTextContent('Grid Ativo (Passo Atual Index: 0)');

    vi.useFakeTimers();

    const playButton = screen.getByRole('button', { name: /reproduzir/i });
    fireEvent.click(playButton);

    await act(async () => {
      vi.advanceTimersByTime(700);
    });
    expect(screen.getByTestId('mock-replay-grid')).toHaveTextContent('Grid Ativo (Passo Atual Index: 1)');

    await act(async () => {
      vi.advanceTimersByTime(700);
    });
    expect(screen.getByTestId('mock-replay-grid')).toHaveTextContent('Grid Ativo (Passo Atual Index: 2)');
  });

  it('deve permitir a exclusão de uma sessão através do botão da lixeira', async () => {
    vi.mocked(listSessions).mockResolvedValue({ items: mockSessionsMetadata, count: mockSessionsMetadata.length });
    vi.mocked(deleteSession).mockResolvedValue(undefined);

    render(<HistoryScreen />);

    await waitFor(() => {
      expect(screen.getByText('Corrida Estável DFS')).toBeInTheDocument();
    });

    const deleteButton = screen.getAllByRole('button').find(btn => btn.getAttribute('title') === 'Excluir') || screen.getAllByRole('button')[0];
    fireEvent.click(deleteButton);

    expect(deleteSession).toHaveBeenCalledWith('sessao-1');

    await waitFor(() => {
      expect(screen.queryByText('Exploração Incompleta')).toBeInTheDocument();
    });
  });
});