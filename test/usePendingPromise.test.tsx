import { renderHook } from '@testing-library/react-hooks';
import * as React from 'react';
import ResourceCache from '../src/ResourceCache';
import usePendingPromise from '../src/usePendingPromise';
import { ResourceCacheProvider } from '../src/useResourceCache';

describe('usePendingPromise', () => {
  let resourceCache: ResourceCache;

  beforeEach(() => {
    resourceCache = new ResourceCache();
  });

  it('resolves and reloads with new cache key', async () => {
    expect.assertions(4);

    let cacheKey = 'cacheKeyA';

    const valueA = 'valueA';
    const valueB = 'valueB';
    let value = valueA;

    const { result, waitForNextUpdate, rerender } = renderHook(
      () => usePendingPromise(cacheKey, () => Promise.resolve(value)),
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

    expect(result.current).toEqual([undefined, true]);

    await waitForNextUpdate();

    expect(result.current).toEqual([valueA, false]);

    cacheKey = 'cacheKeyB';
    value = valueB;

    rerender();

    expect(result.current).toEqual([valueA, true]);

    await waitForNextUpdate();

    expect(result.current).toEqual([valueB, false]);
  });

  it('rejects', async () => {
    expect.assertions(2);

    const { result, waitForNextUpdate } = renderHook(
      () => usePendingPromise('cacheKey', () => Promise.reject(new Error())),
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

    expect(result.current).toEqual([undefined, true]);

    await waitForNextUpdate();

    expect(result.error).toBeInstanceOf(Error);
  });

  it('reloads with deps as array', async () => {
    expect.assertions(4);

    const valueA = 'valueA';
    const valueB = 'valueB';
    const callback = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve(valueA))
      .mockImplementationOnce(() => Promise.resolve(valueB));
    let dependency = 'a';

    const { result, waitForNextUpdate, rerender } = renderHook(
      () => usePendingPromise('cacheKey', callback, [dependency]),
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

    expect(result.current).toEqual([undefined, true]);

    await waitForNextUpdate();

    expect(result.current).toEqual([valueA, false]);

    dependency = 'b';
    rerender();

    expect(result.current).toEqual([valueA, true]);

    await waitForNextUpdate();

    expect(result.current).toEqual([valueB, false]);
  });

  it('reloads with deps as options', async () => {
    expect.assertions(4);

    const valueA = 'valueA';
    const valueB = 'valueB';
    const callback = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve(valueA))
      .mockImplementationOnce(() => Promise.resolve(valueB));
    let dependency = 'a';

    const { result, waitForNextUpdate, rerender } = renderHook(
      () => usePendingPromise('cacheKey', callback, { deps: [dependency] }),
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

    expect(result.current).toEqual([undefined, true]);

    await waitForNextUpdate();

    expect(result.current).toEqual([valueA, false]);

    dependency = 'b';
    rerender();

    expect(result.current).toEqual([valueA, true]);

    await waitForNextUpdate();

    expect(result.current).toEqual([valueB, false]);
  });

  it('uses preloaded resources', async () => {
    expect.assertions(2);

    const cacheKey = 'cacheKey';
    const value = 'value';
    const dependency = 'a';
    const callback = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve(value))
      .mockImplementationOnce(() => Promise.resolve('never'));

    resourceCache.preload(cacheKey, callback);

    const { result, waitForNextUpdate } = renderHook(
      () => usePendingPromise(cacheKey, callback, [dependency]),
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

    expect(result.current).toEqual([undefined, true]);

    await waitForNextUpdate();

    expect(result.current).toEqual([value, false]);
  });

  it('only suspense on initial render if set to false', async () => {
    expect.assertions(3);

    const { result, rerender, waitForNextUpdate } = renderHook(
      ({ resourceKey, value }) =>
        usePendingPromise(resourceKey, () => Promise.resolve(value), {
          initialRender: false,
        }),
      {
        initialProps: { resourceKey: 'key A', value: 'value A' },
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

    expect(result.current).toEqual(['value A', false]);

    rerender({ resourceKey: 'key B', value: 'value B' });

    expect(result.current).toEqual(['value A', true]);

    await waitForNextUpdate();

    expect(result.current).toEqual(['value B', false]);
  });
});
