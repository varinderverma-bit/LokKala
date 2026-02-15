const isTest = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test';

export const MOCK_API_CONFIG = {
  minLatencyMs: isTest ? 0 : 300,
  maxLatencyMs: isTest ? 50 : 900,
  errorRate: isTest ? 0 : 0.05,
};

function randomLatency(): number {
  const { minLatencyMs, maxLatencyMs } = MOCK_API_CONFIG;
  return Math.floor(Math.random() * (maxLatencyMs - minLatencyMs + 1)) + minLatencyMs;
}

function shouldSimulateError(): boolean {
  return Math.random() < MOCK_API_CONFIG.errorRate;
}

export async function simulateApiCall<T>(fn: () => T): Promise<T> {
  await new Promise((r) => setTimeout(r, randomLatency()));
  if (shouldSimulateError()) throw new Error('Mock API error');
  return fn();
}
