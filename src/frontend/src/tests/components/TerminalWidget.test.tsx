import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import TerminalWidget from '../../features/telemetry/components/TerminalWidget'; // Certifique-se de apontar para o caminho correto

describe('TerminalWidget Component', () => {
  const defaultProps = {
    activeSession: { sessionName: 'Corrida Teste', algorithm: 'DFS', mode: 'EXPLORANDO' },
    status: false,
    logs: [],
    onClearLogs: vi.fn(),
    onClose: vi.fn(),
  };

  it('exibe o estado OFFLINE com logs de contingência iniciais', () => {
    render(<TerminalWidget {...defaultProps} status={false} />);
    
    expect(screen.getByText('OFFLINE')).toBeInTheDocument();
    expect(screen.getByText('[SYS] console_stream_initialized...')).toBeInTheDocument();
  });

  it('exibe badge LIVE e permite limpar o console quando houver logs ativos', async () => {
    const user = userEvent.setup();
    const handleClearLogs = vi.fn();
    
    render(
      <TerminalWidget 
        {...defaultProps} 
        status={true} 
        logs={['[STEP #1] MOUSE_FORWARD']} 
        onClearLogs={handleClearLogs} 
      />
    );

    expect(screen.getByText('LIVE')).toBeInTheDocument();
    expect(screen.getByText('[STEP #1] MOUSE_FORWARD')).toBeInTheDocument();

    // O botão de lixeira agora aparece de forma reativa sob estas condições
    const clearBtn = screen.getByTitle('Limpar console');
    await user.click(clearBtn);
    expect(handleClearLogs).toHaveBeenCalled();
  });

  it('permite o fechamento do terminal através do manipulador de fechar', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(<TerminalWidget {...defaultProps} onClose={handleClose} />);

    const closeBtn = screen.getByTitle('Fechar terminal');
    await user.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it('recalcula a altura interna pré-definida ao acionar os botões de manipulação rápida', async () => {
    const user = userEvent.setup();
    render(<TerminalWidget {...defaultProps} />);

    const maxBtn = screen.getByTitle('Maximizar altura');
    const minBtn = screen.getByTitle('Minimizar altura');

    expect(maxBtn).toBeInTheDocument();
    expect(minBtn).toBeInTheDocument();

    await user.click(maxBtn);
    await user.click(minBtn);
  });

  it('permite redimensionar o terminal via arraste do mouse', () => {
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 800,
    });

    render(<TerminalWidget {...defaultProps} status={true} />);

    const resizeHandle = screen.getByTitle('Arraste para redimensionar');
    fireEvent.mouseDown(resizeHandle, { clientY: 700 });
    fireEvent.mouseMove(document, { clientY: 500 });
    fireEvent.mouseUp(document);

    expect(resizeHandle).toBeInTheDocument();
  });

  it('exibe mensagem de console limpo quando conectado sem logs', () => {
    render(<TerminalWidget {...defaultProps} status={true} logs={[]} />);

    expect(
      screen.getByText('// Console limpo. Aguardando próximas iterações...')
    ).toBeInTheDocument();
  });
});