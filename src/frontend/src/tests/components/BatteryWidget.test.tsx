import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import BatteryWidget from '../../features/telemetry/components/BatteryWidget';

describe('BatteryWidget Component', () => {
  it('deve renderizar os dados de tensão e porcentagem corretamente', () => {
    // 1. Renderiza o componente passando propriedades simuladas
    render(<BatteryWidget voltage={4.12} percentage={95} isCritical={false} />);

    // 2. Verifica se as informações textuais estão presentes na tela
    expect(screen.getByText(/4.12\s*V/i)).toBeInTheDocument();
    expect(screen.getByText(/95\s*%/)).toBeInTheDocument();
  });

  it('deve aplicar classes de alerta quando a bateria estiver em estado crítico', () => {
    const { container } = render(
      <BatteryWidget voltage={3.3} percentage={12} isCritical={true} />
    );

    // Procura por alguma classe de cor de alerta (ex: vermelho/red do Tailwind) que você usou
    const criticalElement = container.querySelector('.text-error, .bg-error');
    
    // Se você usou outra classe para o estado crítico, adapte a busca acima
    expect(criticalElement).toBeTruthy();
  });
});