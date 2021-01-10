import { act, renderHook } from '@testing-library/react-hooks';
import * as React from 'react';
import { createResource, ResourceAllocation } from '../src/Resource';
import ResourceCache from '../src/ResourceCache';
import useResource from '../src/useResource';
import { ResourceCacheProvider } from '../src/useResourceCache';

describe('useResource', () => {
  let resourceCache: ResourceCache;

  beforeEach(() => {
    resourceCache = new ResourceCache();
  });

  it('reads from resolved promise by resource', async () => {
    expect.assertions(1);

    const value = 'resolved data';
    const promise = Promise.resolve(value);
    const resource = createResource('resolved resource', promise);

    const { result, waitForNextUpdate } = renderHook(() =>
      useResource(resource)
    );

    await waitForNextUpdate();
    expect(result.current).toBe(value);
  });

  it('reads from resolved promise by cache key', async () => {
    expect.assertions(1);

    const value = 'resolved data';
    const cacheKey = 'cacheKey';
    const promise = Promise.resolve(value);

    resourceCache.preload(cacheKey, promise);

    const { result, waitForNextUpdate } = renderHook(
      () => useResource(cacheKey),
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
    expect(result.current).toBe(value);
  });

  it('throws when using unknown cache key', () => {
    const { result } = renderHook(() => useResource('unknownCacheKey'));

    expect(result.error).toBeInstanceOf(Error);
  });

  it('throws when promise got rejected', async () => {
    expect.assertions(2);

    const value = 'value';
    let resource = createResource('resolved value', Promise.resolve(value));

    const { result, waitForNextUpdate, rerender } = renderHook(() =>
      useResource(resource)
    );

    await waitForNextUpdate();
    expect(result.current).toBe(value);

    resource = createResource('rejected value', Promise.reject(new Error()));
    rerender();

    await waitForNextUpdate();
    expect(result.error).toBeInstanceOf(Error);
  });

  it('gets notified when resource gets preloaded', async () => {
    expect.assertions(2);

    const cacheKey = 'cacheKey';
    const valueA = 'value A';
    const valueB = 'value B';
    const promiseA = Promise.resolve(valueA);
    const promiseB = Promise.resolve(valueB);

    resourceCache.preload(cacheKey, promiseA);

    const { result, waitForNextUpdate } = renderHook(
      () => useResource(cacheKey),
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
    expect(result.current).toBe(valueA);

    act(() => {
      resourceCache.preload(cacheKey, promiseB);
    });

    await waitForNextUpdate();
    expect(result.current).toBe(valueB);
  });

  it('reads, attaches and detaches', async () => {
    expect.assertions(3);

    const promise = Promise.resolve();
    const resource = createResource('attach detach', promise);

    const { waitForNextUpdate, unmount } = renderHook(() =>
      useResource(resource)
    );

    expect(resource.getAllocation()).toBe(ResourceAllocation.UNKNOWN);

    await waitForNextUpdate();
    expect(resource.getAllocation()).toBe(ResourceAllocation.ALLOCATED);

    unmount();
    expect(resource.getAllocation()).toBe(ResourceAllocation.FREED);
  });
});
