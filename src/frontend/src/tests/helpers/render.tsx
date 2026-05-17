import { render, screen, within } from '@testing-library/react'
import type { ReactElement } from 'react'

export const renderUi = (ui: ReactElement) => render(ui)
export { screen, within }
