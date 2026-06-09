import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RaceTimer from '../../features/telemetry/components/RaceTimer';

describe('RaceTimer Component', () => {
  it('deve formatar e exibir milissegundos estáticos perfeitamente', () => {
    // 65230 ms significa exatamente 01:05.23
    render(<RaceTimer timeMs={65230} isActive={false} />);

    // Procura o texto exato na tela
    expect(screen.getByText('01:05.23')).toBeInTheDocument();
  });

  it('deve exibir o tempo zerado no estado inicial', () => {
    render(<RaceTimer timeMs={0} isActive={false} />);
    expect(screen.getByText('00:00.00')).toBeInTheDocument();
  });

  it('deve mostrar a badge de ACTIVE se a corrida estiver ligada', () => {
    render(<RaceTimer timeMs={1200} isActive={true} />);
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });
});