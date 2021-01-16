import { act, renderHook } from '@testing-library/react-hooks';
import * as React from 'react';
import { createResource } from '../src/Resource';
import ResourceCache from '../src/ResourceCache';
import usePendingResource from '../src/usePendingResource';
import { ResourceCacheProvider } from '../src/useResourceCache';
import { ResourceConfigProvider } from '../src/useResourceConfig';

function resolveAfter<T>(value: T, delay: number) {
  return new Promise<T>(resolve => setTimeout(() => resolve(value), delay));
}

function rejectAfter(error: any, delay: number) {
  return new Promise<never>((_, reject) =>
    setTimeout(() => reject(error), delay)
  );
}

describe('usePendingResource', () => {
  let resourceCache: ResourceCache;

  const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <ResourceCacheProvider cache={resourceCache}>
        {children}
      </ResourceCacheProvider>
    );
  };

  beforeEach(() => {
    resourceCache = new ResourceCache();
  });

  it('waits for promise', async () => {
    expect.assertions(1);

    const value = 'test data';
    const resource = createResource('test resource', Promise.resolve(value));
    const { result, waitForNextUpdate } = renderHook(
      () => usePendingResource(resource),
      {
        wrapper: TestWrapper,
      }
    );

    await waitForNextUpdate();

    expect(result.current).toEqual([value, false]);
  });

  it('renders initial data', () => {
    jest.useFakeTimers();

    const initialData = 'initial data';
    const resource = createResource(
      'test resource',
      resolveAfter('value', 1000)
    );
    const { result } = renderHook(
      () => usePendingResource(resource, { initialData }),
      {
        wrapper: TestWrapper,
      }
    );

    expect(result.current).toEqual([initialData, true]);
  });

  it('suspends if initial render is enabled', async () => {
    expect.assertions(2);

    jest.useFakeTimers();

    const value = 'some data';
    const resource = createResource('some resource', resolveAfter(value, 1000));

    const { result } = renderHook(
      () => usePendingResource(resource, { initialRender: true }),
      {
        wrapper: TestWrapper,
      }
    );

    expect(result.current).toEqual([undefined, true]);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(result.current).toEqual([value, false]);
  });

  it('rerender if resource was preloaded again', async () => {
    expect.assertions(2);

    jest.useFakeTimers();

    const key = 'key';
    const valueA = 'value A';
    const valueB = 'value B';

    resourceCache.preload(key, resolveAfter(valueA, 1000));

    const { result, waitForNextUpdate } = renderHook(
      () => usePendingResource(key),
      {
        wrapper: TestWrapper,
      }
    );

    await act(async () => {
      jest.runAllTimers();
    });

    await waitForNextUpdate();

    expect(result.current).toEqual([valueA, false]);

    act(() => {
      resourceCache.preload(key, resolveAfter(valueB, 1000));
    });

    await act(async () => {
      jest.runAllTimers();
    });

    expect(result.current).toEqual([valueB, false]);
  });

  it('throws error', async () => {
    jest.useFakeTimers();

    const resource = createResource(
      'rejected resource',
      rejectAfter(new Error('promise was rejected'), 1000)
    );

    const { result, waitForNextUpdate } = renderHook(
      () => usePendingResource(resource),
      {
        wrapper: TestWrapper,
      }
    );

    await act(async () => {
      jest.runAllTimers();
    });

    await waitForNextUpdate();

    expect(result.error).toBeInstanceOf(Error);
    expect(result.error!.message).toBe('promise was rejected');
  });

  it('suspends after timeToSuspense', async () => {
    expect.assertions(3);

    jest.useFakeTimers();

    const value = 'test value';
    const resource = createResource('test resource', resolveAfter(value, 1000));
    const { result, waitForNextUpdate } = renderHook(
      () =>
        usePendingResource(resource, {
          initialRender: true,
          timeToSuspense: 500,
        }),
      {
        wrapper: TestWrapper,
      }
    );

    expect(result.current).toEqual([undefined, true]);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toEqual([undefined, true]);

    jest.advanceTimersByTime(500);
    await waitForNextUpdate();

    expect(result.current).toEqual([value, false]);
  });

  it('uses resource configuration', async () => {
    expect.assertions(3);

    jest.useFakeTimers();

    const value = 'test value';

    const resource = createResource('test resource', resolveAfter(value, 1000));
    const { result, waitForNextUpdate } = renderHook(
      () => usePendingResource(resource, { initialRender: true }),
      {
        wrapper({ children }) {
          return (
            <ResourceConfigProvider config={{ timeToSuspense: 750 }}>
              <TestWrapper>{children}</TestWrapper>
            </ResourceConfigProvider>
          );
        },
      }
    );

    expect(result.current).toEqual([undefined, true]);

    await act(async () => {
      jest.advanceTimersByTime(750);
    });

    expect(result.current).toEqual([undefined, true]);

    jest.advanceTimersByTime(250);
    await waitForNextUpdate();

    expect(result.current).toEqual([value, false]);
  });
});
