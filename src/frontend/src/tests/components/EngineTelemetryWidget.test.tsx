import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EngineTelemetryWidget from '../../features/telemetry/components/EngineTelemetryWidget';

describe('EngineTelemetryWidget Component', () => {
  it('deve renderizar o RPM dos motores esquerdo e direito corretamente', () => {
    render(<EngineTelemetryWidget motorCurrent={1200} velocity={1150} />);

    // Verifica se as labels e os valores estão na tela
    expect(screen.getByText(/1200/)).toBeInTheDocument();
    expect(screen.getByText(/1150/)).toBeInTheDocument();
    expect(screen.getAllByText(/RPM/i).length).toBeGreaterThan(0);
  });

  it('deve renderizar corretamente quando o robô estiver estático (RPM zero)', () => {
    render(<EngineTelemetryWidget motorCurrent={0} velocity={0} />);
    
    const zeroElements = screen.getAllByText(/0/);
    expect(zeroElements.length).toBeGreaterThan(0);
  });
});