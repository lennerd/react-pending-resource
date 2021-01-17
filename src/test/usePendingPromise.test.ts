import { act } from '@testing-library/react-hooks';
import { ResourceCache } from '../index';
import usePendingPromise from '../usePendingPromise';
import { rejectAfter, renderResourceHook, resolveAfter } from './utils';

describe('usePendingPromise', () => {
  it('resolves and reloads with new key', async () => {
    expect.assertions(7);

    const { result, waitForNextUpdate, rerender } = renderResourceHook(
      ({ resourceKey, value }) =>
        usePendingPromise(resourceKey, () => Promise.resolve(value)),
      {
        initialProps: {
          resourceKey: 'key A',
          value: 'value A',
        },
      }
    );

    expect(result.all).toHaveLength(0);

    await waitForNextUpdate();

    expect(result.all).toHaveLength(1);
    expect(result.current).toEqual(['value A', false]);

    rerender({ resourceKey: 'key B', value: 'value B' });

    expect(result.all).toHaveLength(2);
    expect(result.current).toEqual(['value A', true]);

    await waitForNextUpdate();

    expect(result.all).toHaveLength(3);
    expect(result.current).toEqual(['value B', false]);
  });

  it('rejects', async () => {
    jest.useFakeTimers();

    expect.assertions(3);

    const { result } = renderResourceHook(() =>
      usePendingPromise('key', () => rejectAfter(new Error(), 1000))
    );

    expect(result.all).toHaveLength(0);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(result.all).toHaveLength(1);
    expect(result.error).toBeInstanceOf(Error);
  }, 500);

  it('reloads with deps as array', async () => {
    jest.useFakeTimers();

    expect.assertions(7);

    const callback = jest
      .fn()
      .mockImplementationOnce(() => resolveAfter('value from callback A', 1000))
      .mockImplementationOnce(() =>
        resolveAfter('value from callback B', 1000)
      );

    const { result, waitForNextUpdate, rerender } = renderResourceHook(
      ({ dependency }) => usePendingPromise('key', callback, [dependency]),
      {
        initialProps: {
          dependency: 'a',
        },
      }
    );

    expect(result.all).toHaveLength(0);

    await act(async () => {
      jest.runAllTimers();
    });

    await waitForNextUpdate();

    expect(result.all).toHaveLength(1);
    expect(result.current).toEqual(['value from callback A', false]);

    rerender({ dependency: 'b' });

    // The hook is called 3 times because the invalidation caused by the changed
    // dependency is also causing a second render.
    expect(result.all).toHaveLength(3);
    expect(result.current).toEqual(['value from callback A', true]);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(result.all).toHaveLength(4);
    expect(result.current).toEqual(['value from callback B', false]);
  });

  it('reloads with deps as options', async () => {
    jest.useFakeTimers();

    expect.assertions(7);

    const callback = jest
      .fn()
      .mockImplementationOnce(() => resolveAfter('value with deps A', 1000))
      .mockImplementationOnce(() => resolveAfter('value with deps B', 1000));

    const { result, waitForNextUpdate, rerender } = renderResourceHook(
      ({ dependency }) =>
        usePendingPromise('key', callback, { deps: [dependency] }),
      {
        initialProps: {
          dependency: 'a',
        },
      }
    );

    expect(result.all).toHaveLength(0);

    await act(async () => {
      jest.runAllTimers();
    });

    await waitForNextUpdate();

    expect(result.all).toHaveLength(1);
    expect(result.current).toEqual(['value with deps A', false]);

    rerender({ dependency: 'b' });

    // The hook is called 3 times because the invalidation caused by the changed
    // dependency is also causing a second render.
    expect(result.all).toHaveLength(3);
    expect(result.current).toEqual(['value with deps A', true]);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(result.all).toHaveLength(4);
    expect(result.current).toEqual(['value with deps B', false]);
  });

  it('uses preloaded resources', async () => {
    jest.useFakeTimers();

    expect.assertions(3);

    const cache = new ResourceCache();

    cache.preload('key', () => resolveAfter('value', 500));

    const { result, waitForNextUpdate } = renderResourceHook(
      () => usePendingPromise('key', () => Promise.resolve('never'), ['a']),
      {
        cache,
      }
    );

    expect(result.all).toHaveLength(0);

    await act(async () => {
      jest.runAllTimers();
    });

    await waitForNextUpdate();

    expect(result.all).toHaveLength(1);
    expect(result.current).toEqual(['value', false]);
  });

  it('does initial rendering when initial render is enabled', async () => {
    jest.useFakeTimers();

    expect.assertions(8);

    const { result, rerender } = renderResourceHook(
      ({ resourceKey, value }) =>
        usePendingPromise(resourceKey, () => resolveAfter(value, 1000), {
          initialRender: true,
        }),
      {
        initialProps: { resourceKey: 'key A', value: 'value A' },
      }
    );

    expect(result.all).toHaveLength(1);
    expect(result.current).toEqual([undefined, true]);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(result.all).toHaveLength(2);
    expect(result.current).toEqual(['value A', false]);

    rerender({ resourceKey: 'key B', value: 'value B' });

    expect(result.all).toHaveLength(3);
    expect(result.current).toEqual(['value A', true]);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(result.all).toHaveLength(4);
    expect(result.current).toEqual(['value B', false]);
  }, 500);
});
