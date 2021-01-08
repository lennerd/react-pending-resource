import { act, renderHook } from '@testing-library/react-hooks';
import * as React from 'react';
import ResourceCache from '../src/ResourceCache';
import usePromise from '../src/usePromise';
import { ResourceCacheProvider } from '../src/useResourceCache';

describe('usePromise', () => {
  it('returns correct result based on dependency array and invalidation', async () => {
    expect.assertions(5);

    const resourceCache = new ResourceCache();
    const callback = jest
      .fn()
      .mockReturnValueOnce(Promise.resolve('first'))
      .mockReturnValueOnce(Promise.resolve('second'))
      .mockReturnValueOnce(Promise.resolve('third'))
      .mockReturnValueOnce(Promise.resolve('fourth'));

    let cacheKey = 'cacheKeyA';
    let dependency = 'a';

    const { result, waitForNextUpdate, rerender } = renderHook(
      () => usePromise(cacheKey, callback, [dependency]),
      {
        wrapper({ children }) {
          return (
            <ResourceCacheProvider cache={resourceCache}>
              {children}
            </ResourceCacheProvider>
          );
        },
      }
    );

    await waitForNextUpdate();
    expect(result.current).toBe('first');

    rerender();
    expect(result.current).toBe('first');

    dependency = 'b';
    rerender();
    await waitForNextUpdate();
    expect(result.current).toBe('second');

    act(() => {
      resourceCache.invalidate(cacheKey);
    });
    await waitForNextUpdate();
    expect(result.current).toBe('third');

    cacheKey = 'cacheKeyB';
    rerender();
    await waitForNextUpdate();
    expect(result.current).toBe('fourth');
  });
});
