import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VisualizeDiv } from '../../components/VisualizeDiv';

describe('VisualizeDiv Component', () => {
  const defaultProps = {
    activeSession: {
      sessionName: 'Corrida Lab',
      algorithm: 'FLOOD FILL',
      mode: 'CORRIDA',
      maze: { name: 'Lab_Oficial_UnB', width: 8, height: 8, cells: [] }
    },
    currentView: 'dashboard',
    connectionProps: { latency: '35' },
    isConnected: true,
    posX: 2,
    posY: 3,
  };

  it('deve renderizar as coordenadas filtradas em tempo real e o container do labirinto', () => {
    render(<VisualizeDiv {...defaultProps} />);

    // Valida as coordenadas no painel superior
    expect(screen.getByTestId('maze-coords')).toHaveTextContent('COORDS: X-2, Y-3');
    
    // Valida se o container da malha real foi montado com sucesso
    expect(screen.getByTestId('maze-grid')).toBeInTheDocument();
    
    // Valida as tags de texto dinâmicas de rodapé
    expect(screen.getByText(/ALGORITMO: FLOOD FILL/i)).toBeInTheDocument();
  });

  it('deve aplicar a função defensiva clampCoord para limitar posições extrapoladas ao teto da malha 8x8', () => {
    render(
      <VisualizeDiv 
        {...defaultProps} 
        posX={12} // Força a extrapolação do grid
        posY={5} 
      />
    );

    // O limitador matemático deve travar o índice cartesiano em 7
    expect(screen.getByTestId('maze-coords')).toHaveTextContent('COORDS: X-7, Y-5');
  });

  it('deve transladar as coordenadas do badge quando o robô sai para valores negativos', () => {
    render(
      <VisualizeDiv
        {...defaultProps}
        posX={-2} // Robô partiu de outro canto: offset +2 desloca a matriz
        posY={1}
      />
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
});