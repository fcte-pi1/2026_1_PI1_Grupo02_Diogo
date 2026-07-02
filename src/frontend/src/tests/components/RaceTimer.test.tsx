import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RaceTimer from '../../features/telemetry/components/RaceTimer';

describe('RaceTimer Component', () => {
  it('deve formatar e exibir milissegundos estáticos perfeitamente', () => {
    // 65230ms equivale a 01 minuto, 05 segundos e 23 centésimos
    render(<RaceTimer elapsedMs={65230} stepCount={10} isActive={true} />);

    expect(screen.getByText('01:05.23')).toBeInTheDocument();
    expect(screen.getByText('#10')).toBeInTheDocument();
  });

  it('deve exibir o tempo zerado no estado inicial', () => {
    render(<RaceTimer elapsedMs={0} stepCount={0} isActive={false} />);
    expect(screen.getByText('00:00.00')).toBeInTheDocument();
  });

  it('deve mostrar a badge de ACTIVE se a corrida estiver ligada', () => {
    render(<RaceTimer elapsedMs={1000} stepCount={1} isActive={true} />);
    expect(screen.getByTestId('race-timer-status')).toHaveTextContent('ACTIVE');
  });
});