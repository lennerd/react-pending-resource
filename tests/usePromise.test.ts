import { act } from '@testing-library/react-hooks';
import usePromise from '../src/usePromise';
import { renderResourceHook } from './utils';

describe('usePromise', () => {
  it('returns correct result based on dependency array and invalidation', async () => {
    expect.assertions(11);

    const callback = jest
      .fn()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second')
      .mockResolvedValueOnce('third')
      .mockResolvedValueOnce('fourth');

    const { result, waitForNextUpdate, rerender, cache } = renderResourceHook(
      ({ resourceKey, dependency }) =>
        usePromise(resourceKey, callback, [dependency]),
      {
        initialProps: {
          resourceKey: 'keyA',
          dependency: 'a',
        },
      }
    );

    expect(result.all).toHaveLength(0);

    await waitForNextUpdate();

    expect(result.all).toHaveLength(1);
    expect(result.current).toBe('first');

    rerender();

    expect(result.all).toHaveLength(2);
    expect(result.current).toBe('first');

    rerender({ resourceKey: 'keyA', dependency: 'b' });
    await waitForNextUpdate();

    expect(result.all).toHaveLength(3);
    expect(result.current).toBe('second');

    act(() => {
      cache.invalidate('keyA');
    });
    await waitForNextUpdate();

    expect(result.all).toHaveLength(4);
    expect(result.current).toBe('third');

    rerender({ resourceKey: 'keyB', dependency: 'b' });
    await waitForNextUpdate();

    expect(result.all).toHaveLength(5);
    expect(result.current).toBe('fourth');
  });
});
