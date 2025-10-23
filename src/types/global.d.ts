export interface FocusFlowSummary {
  report: string;
  stats: {
    completed: number;
    pending: number;
    skipped: number;
    earned: number;
    spent: number;
  } | null;
}

export interface FocusFlowAPI {
  getState: () => Promise<unknown>;
  saveState: (state: unknown) => Promise<void>;
  toggleWidget: () => Promise<boolean>;
  notify: (payload: { title: string; body: string }) => Promise<void>;
  generateSummary: () => Promise<FocusFlowSummary>;
  resetWeek: () => Promise<{ editsUsed: number; lastReset: string } | undefined>;
  on: (channel: string, listener: (...args: unknown[]) => void) => void;
  off: (channel: string, listener: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    focusFlowAPI: FocusFlowAPI;
  }
}
