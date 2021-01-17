import { act } from '@testing-library/react-hooks';
import { createResource } from '../Resource';
import ResourceCache from '../ResourceCache';
import usePendingResource from '../usePendingResource';
import { rejectAfter, renderResourceHook, resolveAfter } from './utils';

describe('usePendingResource', () => {
  it('waits for promise', async () => {
    expect.assertions(3);

    const value = 'test data';
    const resource = createResource('test resource', Promise.resolve(value));
    const { result, waitForNextUpdate } = renderResourceHook(() =>
      usePendingResource(resource)
    );

    expect(result.all).toHaveLength(0);

    await waitForNextUpdate();

    expect(result.all).toHaveLength(1);
    expect(result.current).toEqual([value, false]);
  });

  it('renders initial data', async () => {
    expect.assertions(4);

    jest.useFakeTimers();

    const resource = createResource(
      'test resource',
      resolveAfter('resolved value', 1000)
    );
    const { result } = renderResourceHook(() =>
      usePendingResource(resource, { initialData: 'initial data' })
    );

    expect(result.all).toHaveLength(1);
    expect(result.current).toEqual(['initial data', true]);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(result.all).toHaveLength(2);
    expect(result.current).toEqual(['resolved value', false]);
  });

  it('suspends if initial render is enabled', async () => {
    expect.assertions(4);

    jest.useFakeTimers();

    const value = 'some data';
    const resource = createResource('some resource', resolveAfter(value, 1000));

    const { result, waitForNextUpdate } = renderResourceHook(() =>
      usePendingResource(resource, { initialRender: true })
    );

    expect(result.all).toHaveLength(1);
    expect(result.current).toEqual([undefined, true]);

    act(() => {
      jest.runAllTimers();
    });

    await waitForNextUpdate();

    expect(result.all).toHaveLength(2);
    expect(result.current).toEqual([value, false]);
  });

  it('rerender if resource was preloaded again', async () => {
    expect.assertions(7);

    jest.useFakeTimers();

    const key = 'key';

    const cache = new ResourceCache();

    cache.preload(key, resolveAfter('value A', 1000));
    const { result, waitForNextUpdate } = renderResourceHook(
      () => usePendingResource(key),
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
    expect(result.current).toEqual(['value A', false]);

    await act(async () => {
      cache.preload(key, resolveAfter('value B', 1000));
    });

    act(() => {
      jest.runAllTimers();
    });

    expect(result.all).toHaveLength(2);
    expect(result.current).toEqual(['value A', true]);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(result.all).toHaveLength(3);
    expect(result.current).toEqual(['value B', false]);
  });

  it('throws error', async () => {
    expect.assertions(5);

    jest.useFakeTimers();

    const resource = createResource(
      'rejected resource',
      rejectAfter(new Error('promise was rejected'), 1000)
    );

    const { result, waitForNextUpdate } = renderResourceHook(() =>
      usePendingResource(resource)
    );

    expect(result.all).toHaveLength(0);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(result.all).toHaveLength(0);

    await waitForNextUpdate();

    expect(result.all).toHaveLength(1);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error!.message).toBe('promise was rejected');
  });

  it('suspends after timeToSuspense', async () => {
    expect.assertions(8);

    jest.useFakeTimers();

    const { result, rerender, waitForNextUpdate } = renderResourceHook(
      ({ resource }) =>
        usePendingResource(resource, {
          timeToSuspense: 500,
        }),
      {
        initialProps: {
          resource: createResource(
            'A test resource',
            resolveAfter('A test value', 400)
          ),
        },
      }
    );

    expect(result.all).toHaveLength(0);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(result.all).toHaveLength(0);

    await waitForNextUpdate();

    expect(result.all).toHaveLength(1);
    expect(result.current).toEqual(['A test value', false]);

    rerender({
      resource: createResource(
        'B test resource',
        resolveAfter('B test value', 1000)
      ),
    });

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(result.all).toHaveLength(2);
    expect(result.current).toEqual(['A test value', true]);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(result.all).toHaveLength(4);
    expect(result.current).toEqual(['B test value', false]);
  });

  it('uses resource configuration', async () => {
    expect.assertions(9);

    jest.useFakeTimers();

    const { result, waitForNextUpdate, rerender } = renderResourceHook(
      ({ resource }) => usePendingResource(resource),
      {
        config: { timeToSuspense: 750 },
        initialProps: {
          resource: createResource(
            'test resource A',
            resolveAfter('test value A', 500)
          ),
        },
      }
    );

    expect(result.all).toHaveLength(0);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(result.all).toHaveLength(0);

    await waitForNextUpdate();

    expect(result.all).toHaveLength(1);
    expect(result.current).toEqual(['test value A', false]);

    rerender({
      resource: createResource(
        'test resource B',
        resolveAfter('test value B', 1000)
      ),
    });

    expect(result.all).toHaveLength(2);
    expect(result.current).toEqual(['test value A', true]);

    await act(async () => {
      jest.advanceTimersByTime(800);
    });

    expect(result.all).toHaveLength(2);

    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    expect(result.all).toHaveLength(4);
    expect(result.current).toEqual(['test value B', false]);
  }, 100000);
});
