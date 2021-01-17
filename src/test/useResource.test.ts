import { act } from '@testing-library/react-hooks';
import { createResource, ResourceAllocation } from '../Resource';
import ResourceCache from '../ResourceCache';
import useResource from '../useResource';
import { rejectAfter, renderResourceHook, resolveAfter } from './utils';

describe('useResource', () => {
  it('reads from resolved promise by resource', async () => {
    jest.useFakeTimers();

    expect.assertions(2);

    const resource = createResource(
      'resolved resource',
      resolveAfter('resolved data', 1000)
    );

    const { result, waitForNextUpdate } = renderResourceHook(() =>
      useResource(resource)
    );

    await act(async () => {
      jest.runAllTimers();
    });

    await waitForNextUpdate();
    expect(result.all).toHaveLength(1);
    expect(result.current).toBe('resolved data');
  });

  it('reads from resolved promise by key', async () => {
    expect.assertions(2);

    const cache = new ResourceCache();

    cache.preload('preloaded key', resolveAfter('preloaded value', 500));

    const { result, waitForNextUpdate } = renderResourceHook(
      () => useResource('preloaded key'),
      {
        cache,
      }
    );

    await act(async () => {
      jest.runAllTimers();
    });

    await waitForNextUpdate();
    expect(result.all).toHaveLength(1);
    expect(result.current).toBe('preloaded value');
  });

  it('throws when using unknown key', () => {
    const { result } = renderResourceHook(() => useResource('unknownKey'));

    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe(
      'Cannot find preloaded resource for key "unknownKey".'
    );
  });

  it('throws when promise got rejected', async () => {
    jest.useFakeTimers();

    expect.assertions(5);

    let resource = createResource(
      'resolved key',
      resolveAfter('resolved value', 500)
    );

    const { result, waitForNextUpdate, rerender } = renderResourceHook(() =>
      useResource(resource)
    );

    await act(async () => {
      jest.runAllTimers();
    });

    await waitForNextUpdate();

    expect(result.all).toHaveLength(1);
    expect(result.current).toBe('resolved value');

    resource = createResource(
      'rejected value',
      rejectAfter(new Error('rejected reason'), 750)
    );
    rerender();

    await act(async () => {
      jest.runAllTimers();
    });

    await waitForNextUpdate();

    expect(result.all).toHaveLength(2);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('rejected reason');
  });

  it('gets notified when resource gets preloaded', async () => {
    jest.useFakeTimers();

    expect.assertions(4);

    const cache = new ResourceCache();

    cache.preload('key', resolveAfter('value A', 1000));

    const { result, waitForNextUpdate } = renderResourceHook(
      () => useResource('key'),
      {
        cache,
      }
    );

    await act(async () => {
      jest.runAllTimers();
    });

    await waitForNextUpdate();
    expect(result.all).toHaveLength(1);
    expect(result.current).toBe('value A');

    await act(async () => {
      cache.preload('key', resolveAfter('value B', 500));
    });

    await act(async () => {
      jest.runAllTimers();
    });

    await waitForNextUpdate();

    expect(result.all).toHaveLength(2);
    expect(result.current).toBe('value B');
  });

  it('reads, attaches and detaches', async () => {
    jest.useFakeTimers();

    expect.assertions(5);

    const resource = createResource(
      'attach detach',
      resolveAfter('resource value', 1000)
    );

    const { result, waitForNextUpdate, unmount } = renderResourceHook(() =>
      useResource(resource)
    );

    expect(result.all).toHaveLength(0);
    expect(resource.getAllocation()).toBe(ResourceAllocation.UNKNOWN);

    await act(async () => {
      jest.runAllTimers();
    });

    await waitForNextUpdate();
    expect(result.all).toHaveLength(1);
    expect(resource.getAllocation()).toBe(ResourceAllocation.ALLOCATED);

    unmount();

    expect(resource.getAllocation()).toBe(ResourceAllocation.FREED);
  });
});
