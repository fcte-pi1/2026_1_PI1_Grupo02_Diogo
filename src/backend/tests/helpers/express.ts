import type { Request, Response, NextFunction } from "express";

export type MockResponse = Response & {
  status: jest.Mock;
  json: jest.Mock;
};

export const createMockResponse = (): MockResponse => {
  const res = {} as MockResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

export const createMockRequest = (
  overrides: Partial<Request> = {}
): Request => ({
  ...overrides
} as unknown as Request);

export const createMockNext = (): NextFunction => jest.fn();
