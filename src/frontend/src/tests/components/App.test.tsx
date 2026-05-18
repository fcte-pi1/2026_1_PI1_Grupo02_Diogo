import { render, screen } from '@testing-library/react';
import { describe, it } from 'vitest';
import App from '../../App';

describe('App Component', () => {
  it('Apenas renderiza o componente inicial para auditoria do CI', () => {
    render(<App />);
    
    // Cospe o HTML atual para os logs do GitHub Actions e passa direto
    screen.debug();
  });
});