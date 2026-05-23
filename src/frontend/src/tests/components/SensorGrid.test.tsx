import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SensorGrid from '../../features/telemetry/components/SensorGrid';

describe('SensorGrid Component', () => {
  it('deve renderizar as leituras de distância dos três sensores', () => {
    render(<SensorGrid sensorData={{ front: 30, left: 50, right: 12 }} />);

    // Verifica se os valores numéricos estão impressos no cockpit
    expect(screen.getByText(/30\s*cm/i)).toBeInTheDocument();
    expect(screen.getByText(/50\s*cm/i)).toBeInTheDocument();
    expect(screen.getByText(/12\s*cm/i)).toBeInTheDocument();
  });

  it('deve ativar o estado de alerta (perigo de colisão) se a distância for muito curta', () => {
    // Simulando que o sensor da frente está a 5cm da parede (crítico)
    const { container } = render(<SensorGrid sensorData={{ left: 40, front: 5, right: 40 }} />);

    // Verifica se a classe de alerta (vermelha ou pulsação) foi injetada no container do sensor afetado
    const alertElement = container.querySelector('.text-error, .bg-error\\/20, .border-error');
    expect(alertElement).toBeTruthy();
  });
});