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

  it("posiciona o robô no centro da malha 16x16 quando a ESP parte de (7,7)", () => {
    render(
      <VisualizeDiv
        {...defaultProps}
        activeSession={{
          ...defaultProps.activeSession,
          maze: { name: "Lab_Oficial_UnB", width: 8, height: 8, cells: [] },
        }}
        posX={7}
        posY={7}
      />,
    );

    expect(screen.getByTestId("maze-coords")).toHaveTextContent("COORDS: X-7, Y-7");
    expect(screen.getByTestId("maze-robot-cell")).toHaveAttribute(
      "title",
      "Robô em (7, 7)",
    );
    expect(screen.getByTestId("maze-grid")).toHaveStyle({
      gridTemplateColumns: "repeat(16, minmax(0, 1fr))",
    });
  });

  it('deve aplicar a função defensiva clampCoord para limitar posições extrapoladas ao teto da malha', () => {
    render(
      <VisualizeDiv
        {...defaultProps}
        posX={20}
        posY={5}
      />,
    );

    expect(screen.getByTestId('maze-coords')).toHaveTextContent('COORDS: X-15, Y-5');
  });

  it('limita coordenadas negativas a zero no badge', () => {
    render(
      <VisualizeDiv
        {...defaultProps}
        posX={-2}
        posY={1}
      />,
    );

    expect(screen.getByTestId('maze-coords')).toHaveTextContent('COORDS: X-0, Y-1');
  });

  it('renderiza o container quando a view ativa for network', () => {
    const { container } = render(<VisualizeDiv {...defaultProps} currentView="network" />);

    expect(container.firstChild).toBeInTheDocument();
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

  it('gira o ícone do robô conforme a direção da ESP ou o deslocamento', () => {
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
          },
          {
            id: 's2',
            stepOrder: 1,
            posX: 1,
            posY: 0,
            voltage: 12,
            current: 100,
            createdAt: '2026-01-01T00:00:01.000Z',
          },
        ]}
        robotData={{
          id: 's2',
          stepOrder: 1,
          posX: 1,
          posY: 0,
          voltage: 12,
          current: 100,
          createdAt: '2026-01-01T00:00:01.000Z',
          direcao: 'leste',
        } as never}
        posX={1}
        posY={0}
      />,
    );

    expect(
      screen.getByTestId('maze-robot-cell').querySelector('[data-robot-rotation="90"]'),
    ).toBeInTheDocument();
  });
});
