import { scheduleAfterFirstPaint } from './init';

describe('scheduleAfterFirstPaint', () => {
  const originalIdle = window.requestIdleCallback;

  afterEach(() => {
    window.requestIdleCallback = originalIdle;
  });

  it('runs the callback via requestIdleCallback when it exists', () => {
    const run = jest.fn();
    let queued: IdleRequestCallback | undefined;
    window.requestIdleCallback = ((cb: IdleRequestCallback) => {
      queued = cb;
      return 1;
    }) as typeof window.requestIdleCallback;

    scheduleAfterFirstPaint(run);

    expect(run).not.toHaveBeenCalled();
    queued?.({ didTimeout: false, timeRemaining: () => 10 });
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('falls back to the window load event when requestIdleCallback is missing', () => {
    const run = jest.fn();
    // @ts-expect-error -- simulate older browsers
    delete window.requestIdleCallback;
    Object.defineProperty(document, 'readyState', { configurable: true, value: 'interactive' });

    scheduleAfterFirstPaint(run);
    expect(run).not.toHaveBeenCalled();

    window.dispatchEvent(new Event('load'));
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('runs immediately when requestIdleCallback is missing and the document is already complete', () => {
    const run = jest.fn();
    // @ts-expect-error -- simulate older browsers
    delete window.requestIdleCallback;
    Object.defineProperty(document, 'readyState', { configurable: true, value: 'complete' });

    scheduleAfterFirstPaint(run);
    expect(run).toHaveBeenCalledTimes(1);
  });
});
