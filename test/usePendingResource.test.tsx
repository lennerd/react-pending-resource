import { act, renderHook } from '@testing-library/react-hooks';
import * as React from 'react';
import { createResource } from '../src/Resource';
import ResourceCache from '../src/ResourceCache';
import usePendingResource from '../src/usePendingResource';
import { ResourceCacheProvider } from '../src/useResourceCache';
import { ResourceConfigProvider } from '../src/useResourceConfig';

describe('usePendingResource', () => {
  it('waits for promise', async () => {
    expect.assertions(2);

    jest.useFakeTimers();

    const value = 'test data';
    const resource = createResource(
      'test resource',
      new Promise<string>(resolve => setTimeout(() => resolve(value), 1000))
    );
    const { result } = renderHook(() => usePendingResource(resource));

    expect(result.current).toEqual([undefined, true]);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(result.current).toEqual([value, false]);
  });

  it('renders initial data', () => {
    jest.useFakeTimers();

    const initialData = 'initial data';
    const resource = createResource(
      'test resource',
      new Promise<string>(resolve => setTimeout(() => resolve('value'), 1000))
    );
    const { result } = renderHook(() =>
      usePendingResource(resource, { initialData })
    );

    expect(result.current).toEqual([initialData, true]);
  });

  it('suspends if initial render is disabled', async () => {
    expect.assertions(1);

    jest.useFakeTimers();

    const value = 'some data';
    const resource = createResource(
      'some resource',
      new Promise<string>(resolve => setTimeout(() => resolve(value), 1000))
    );

    const { result, waitForNextUpdate } = renderHook(() =>
      usePendingResource(resource, { initialRender: false })
    );

    await act(async () => {
      jest.runAllTimers();
    });

    await waitForNextUpdate();

    expect(result.current).toEqual([value, false]);
  });

  it('rerender if resource was preloaded again', async () => {
    expect.assertions(3);

    const resourceCache = new ResourceCache();

    const key = 'key';
    const valueA = 'value A';
    const valueB = 'value B';

    resourceCache.preload(key, Promise.resolve(valueA));

    const { result, waitForNextUpdate } = renderHook(
      () => usePendingResource(key),
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

    act(() => {
      resourceCache.preload(key, Promise.resolve(valueB));
    });

    await waitForNextUpdate();

    expect(result.current).toEqual([valueB, false]);
  });

  it('throws error', async () => {
    const resource = createResource(
      'rejected resource',
      Promise.reject(new Error())
    );
    const { result, waitForNextUpdate } = renderHook(() =>
      usePendingResource(resource)
    );

    await waitForNextUpdate();

    expect(result.error).toBeInstanceOf(Error);
  });

  it('suspends after timeout', async () => {
    expect.assertions(3);

    jest.useFakeTimers();

    const value = 'test value';
    const resource = createResource(
      'test resource',
      new Promise(resolve => setTimeout(() => resolve(value), 1000))
    );
    const { result, waitForNextUpdate } = renderHook(() =>
      usePendingResource(resource, { timeout: 500 })
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

    const resource = createResource(
      'test resource',
      new Promise(resolve => setTimeout(() => resolve(value), 1000))
    );
    const { result, waitForNextUpdate } = renderHook(
      () => usePendingResource(resource),
      {
        wrapper({ children }) {
          return (
            <ResourceConfigProvider config={{ timeout: 750 }}>
              {children}
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
