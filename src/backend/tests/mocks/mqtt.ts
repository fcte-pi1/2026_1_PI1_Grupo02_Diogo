type MqttHandler = (...args: unknown[]) => void;

const handlers: Record<string, MqttHandler[]> = {};

export const mqttClientMock = {
  on: jest.fn((event: string, handler: MqttHandler) => {
    handlers[event] = handlers[event] ?? [];
    handlers[event].push(handler);
  }),
  subscribe: jest.fn(),
  end: jest.fn(),
};

export const triggerMqttEvent = (event: string, ...args: unknown[]): void => {
  for (const handler of handlers[event] ?? []) {
    handler(...args);
  }
};

export const resetMqttHandlers = (): void => {
  for (const key of Object.keys(handlers)) {
    delete handlers[key];
  }
};

export const mqttConnectMock = jest.fn(() => mqttClientMock);
