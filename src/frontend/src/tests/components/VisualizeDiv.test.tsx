import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VisualizeDiv } from '../../components/VisualizeDiv';

describe('VisualizeDiv Component', () => {
  const defaultProps = {
    activeSession: {
      sessionName: 'Corrida Lab',
      algorithm: 'FLOOD FILL',
      mode: 'CORRIDA',
      maze: { name: 'Lab_Oficial_UnB', width: 8, height: 8, cells: [] },
    },
    currentView: 'dashboard',
    connectionProps: { latency: '35' },
    isConnected: true,
    posX: 2,
    posY: 3,
  };

  it('deve renderizar as coordenadas filtradas em tempo real e o container do labirinto', () => {
    render(<VisualizeDiv {...defaultProps} />);

    expect(screen.getByTestId('maze-coords')).toHaveTextContent('COORDS: X-2, Y-3');
    expect(screen.getByTestId('maze-grid')).toBeInTheDocument();
    expect(screen.getByText(/ALGORITMO: FLOOD FILL/i)).toBeInTheDocument();
  });

  it('deve aplicar a função defensiva clampCoord para limitar posições extrapoladas ao teto da malha 8x8', () => {
    render(
      <VisualizeDiv
        {...defaultProps}
        posX={12}
        posY={5}
      />,
    );

    expect(screen.getByTestId('maze-coords')).toHaveTextContent('COORDS: X-7, Y-5');
  });

  it('deve transladar as coordenadas do badge quando o robô sai para valores negativos', () => {
    render(
      <VisualizeDiv
        {...defaultProps}
        posX={-2}
        posY={1}
      />,
    );

    expect(screen.getByTestId('maze-coords')).toHaveTextContent('COORDS: X-0, Y-1');
    expect(screen.getByTestId('maze-grid')).toHaveAttribute('data-offset-x', '2');
  });

  it('deve renderizar a topologia de rede correta se a view ativa for a network', () => {
    render(<VisualizeDiv {...defaultProps} currentView="network" />);

    expect(screen.getByText('OPERATOR_STATION')).toBeInTheDocument();
    expect(screen.getByText('UAV-MOUSE-01')).toBeInTheDocument();
    expect(screen.getByText('BANCO_DE_DADOS')).toBeInTheDocument();
    expect(screen.getByText('online')).toBeInTheDocument();
  });

  it('pinta paredes descobertas em tempo real a partir dos steps da telemetria', () => {
    render(
      <VisualizeDiv
        {...defaultProps}
        steps={[
          {
            id: 's1',
            stepOrder: 0,
            posX: 0,
            posY: 0,
            voltage: 12,
            current: 100,
            createdAt: '2026-01-01T00:00:00.000Z',
            walls: { north: true, south: false, east: true, west: false },
          },
          {
            id: 's2',
            stepOrder: 1,
            posX: 1,
            posY: 0,
            voltage: 12,
            current: 100,
            createdAt: '2026-01-01T00:00:01.000Z',
            walls: { north: false, south: true, east: false, west: true },
          },
        ]}
        posX={1}
        posY={0}
      />,
    );

    const origin = screen.getByTitle('Coords: (0, 0)');
    expect(origin).toHaveAttribute('data-wall-north', 'true');
    expect(origin).toHaveAttribute('data-wall-east', 'true');

    const next = screen.getByTitle('Robô em (1, 0)');
    expect(next).toHaveAttribute('data-wall-south', 'true');
    expect(next).toHaveAttribute('data-wall-west', 'true');
  });
});
