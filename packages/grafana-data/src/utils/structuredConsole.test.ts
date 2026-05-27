import { structuredLog, toLogContextPart } from './structuredConsole';

describe('structuredLog', () => {
  it('emits a JSON line to the appropriate console channel', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation();

    structuredLog('warn', 'hello', { foo: 1 });

    expect(spy).toHaveBeenCalledTimes(1);
    const line = spy.mock.calls[0][0] as string;
    const parsed = JSON.parse(line);
    expect(parsed.level).toBe('warn');
    expect(parsed.message).toBe('hello');
    expect(parsed.context).toEqual({ foo: 1 });

    spy.mockRestore();
  });
});

describe('toLogContextPart', () => {
  it('serializes Errors', () => {
    const err = new Error('boom');
    expect(toLogContextPart(err)).toMatchObject({
      name: 'Error',
      message: 'boom',
    });
  });

  it('returns primitives as-is', () => {
    expect(toLogContextPart(42)).toBe(42);
    expect(toLogContextPart('x')).toBe('x');
  });
});
