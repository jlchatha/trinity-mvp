/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.TRINITY_TEST_MODE = 'true';

// Mock Electron in test environment
if (!process.env.ELECTRON_RUN_AS_NODE) {
  jest.mock('electron', () => ({
    app: {
      getPath: jest.fn(() => '/tmp/trinity-test'),
      on: jest.fn(),
      whenReady: jest.fn(() => Promise.resolve()),
      quit: jest.fn(),
    },
    BrowserWindow: jest.fn(() => ({
      loadFile: jest.fn(),
      on: jest.fn(),
      webContents: {
        send: jest.fn(),
        on: jest.fn(),
      },
    })),
    ipcMain: {
      on: jest.fn(),
      handle: jest.fn(),
    },
    ipcRenderer: {
      send: jest.fn(),
      on: jest.fn(),
      invoke: jest.fn(),
    },
  }));
}

// Global test utilities
global.testUtils = {
  // Create mock user input
  createMockInput: (content, type = 'simple') => ({
    content,
    type,
    timestamp: Date.now(),
  }),

  // Create mock response
  createMockResponse: (content, success = true) => ({
    success,
    content,
    timestamp: Date.now(),
    processingTime: 1000,
  }),

  // Wait for async operations
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Test timeouts
  TIMEOUT: {
    SHORT: 1000,
    MEDIUM: 5000,
    LONG: 10000,
  },
};

// Console suppression for cleaner test output
const originalConsole = { ...console };
global.suppressConsole = () => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
};

global.restoreConsole = () => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
};

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
  restoreConsole();
});