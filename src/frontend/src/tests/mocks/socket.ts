import { vi } from 'vitest'

export const socketEmitMock = vi.fn()
export const socketOnMock = vi.fn()
export const socketOffMock = vi.fn()
export const socketDisconnectMock = vi.fn()

export const createSocketMock = () => ({
  emit: socketEmitMock,
  on: socketOnMock,
  off: socketOffMock,
  disconnect: socketDisconnectMock,
})
