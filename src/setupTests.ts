// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

const createMatchMedia = (query: string): MediaQueryList => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: createMatchMedia,
});
Object.defineProperty(global, 'matchMedia', {
  writable: true,
  value: createMatchMedia,
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserverMock;
global.ResizeObserver = ResizeObserverMock;
global.getComputedStyle = window.getComputedStyle;

class MessageChannelMock {
  port1 = {
    onmessage: null as ((event: MessageEvent) => void) | null,
    postMessage: jest.fn(),
    close: jest.fn(),
    start: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };

  port2 = {
    onmessage: null as ((event: MessageEvent) => void) | null,
    postMessage: (data: unknown) => {
      window.setTimeout(() => {
        this.port1.onmessage?.({ data } as MessageEvent);
      }, 0);
    },
    close: jest.fn(),
    start: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };
}

global.MessageChannel = MessageChannelMock as unknown as typeof MessageChannel;
