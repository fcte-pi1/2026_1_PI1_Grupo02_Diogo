export enum MissionState {
  WELCOME = 'WELCOME',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED'
}

export interface MissionSetup {
  testName: string;
  algorithm: 'flood-fill' | 'a-star';
  mode: 'mapping' | 'fast-run';
}