import { act } from '@testing-library/react-hooks';
import { createResource, ResourceAllocation } from '../Resource';
import ResourceCache from '../ResourceCache';
import useResource from '../useResource';
import { renderResourceHook } from './utils';

describe('useResource', () => {
  it('reads from resolved promise by resource', async () => {
    expect.assertions(2);

    const value = 'resolved data';
    const promise = Promise.resolve(value);
    const resource = createResource('resolved resource', promise);

    const { result, waitForNextUpdate } = renderResourceHook(() =>
      useResource(resource)
    );

    await waitForNextUpdate();
    expect(result.all).toHaveLength(1);
    expect(result.current).toBe(value);
  });

  it('reads from resolved promise by key', async () => {
    expect.assertions(2);

    const value = 'resolved data';
    const key = 'key';
    const promise = Promise.resolve(value);

    const cache = new ResourceCache();

    cache.preload(key, promise);

    const { result, waitForNextUpdate } = renderResourceHook(
      () => useResource(key),
      {
        cache,
      }
    );

    await waitForNextUpdate();
    expect(result.all).toHaveLength(1);
    expect(result.current).toBe(value);
  });

  it('throws when using unknown key', () => {
    const { result } = renderResourceHook(() => useResource('unknownKey'));

    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe(
      'Cannot find preloaded resource for key "unknownKey".'
    );
  });

  it('throws when promise got rejected', async () => {
    expect.assertions(4);

    const value = 'value';
    let resource = createResource('resolved value', Promise.resolve(value));

    const { result, waitForNextUpdate, rerender } = renderResourceHook(() =>
      useResource(resource)
    );

    await waitForNextUpdate();
    expect(result.all).toHaveLength(1);
    expect(result.current).toBe(value);

    resource = createResource('rejected value', Promise.reject(new Error()));
    rerender();

    await waitForNextUpdate();
    expect(result.all).toHaveLength(2);
    expect(result.error).toBeInstanceOf(Error);
  });

  it('gets notified when resource gets preloaded', async () => {
    expect.assertions(4);

    const key = 'key';
    const valueA = 'value A';
    const valueB = 'value B';
    const promiseA = Promise.resolve(valueA);
    const promiseB = Promise.resolve(valueB);

    const cache = new ResourceCache();

    cache.preload(key, promiseA);

    const { result, waitForNextUpdate } = renderResourceHook(
      () => useResource(key),
      {
        cache,
      }
    );

    await waitForNextUpdate();
    expect(result.all).toHaveLength(1);
    expect(result.current).toBe(valueA);

    await act(async () => {
      cache.preload(key, promiseB);
    });

    expect(result.all).toHaveLength(2);
    expect(result.current).toBe(valueB);
  });

  it('reads, attaches and detaches', async () => {
    expect.assertions(3);

    const promise = Promise.resolve();
    const resource = createResource('attach detach', promise);

    const { waitForNextUpdate, unmount } = renderResourceHook(() =>
      useResource(resource)
    );

    expect(resource.getAllocation()).toBe(ResourceAllocation.UNKNOWN);

    await waitForNextUpdate();
    expect(resource.getAllocation()).toBe(ResourceAllocation.ALLOCATED);

    unmount();
    expect(resource.getAllocation()).toBe(ResourceAllocation.FREED);
  });
});
