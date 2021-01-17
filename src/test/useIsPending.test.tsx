import { act, renderHook } from '@testing-library/react-hooks';
import * as React from 'react';
import { createResource } from '../Resource';
import ResourceTracker from '../ResourceTracker';
import useIsPending from '../useIsPending';
import { ResourceTrackerProvider } from '../useResourceTracker';
import { resolveAfter } from './utils';

function renderIsPendingHook() {
  const tracker = new ResourceTracker();

  return {
    ...renderHook(() => useIsPending(), {
      wrapper: ({ children }: { children?: React.ReactNode }) => {
        return (
          <ResourceTrackerProvider tracker={tracker}>
            {children}
          </ResourceTrackerProvider>
        );
      },
    }),
    tracker,
  };
}

describe('useIsPending', () => {
  it('switches pending state when promises were added and resolved', async () => {
    expect.assertions(6);

    jest.useFakeTimers();

    const { result, tracker } = renderIsPendingHook();

    expect(result.all).toHaveLength(1);
    expect(result.current).toBe(false);

    const resource = createResource('test', resolveAfter('value', 1000));

    act(() => {
      tracker.add(resource);
    });

    expect(result.all).toHaveLength(2);
    expect(result.current).toBe(true);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(result.all).toHaveLength(3);
    expect(result.current).toBe(false);
  });

  it('switches pending state when resource was removed', async () => {
    expect.assertions(6);

    jest.useFakeTimers();

    const { result, tracker } = renderIsPendingHook();

    expect(result.all).toHaveLength(1);
    expect(result.current).toBe(false);

    const resource = createResource(
      'test',
      new Promise(resolve => {
        setTimeout(resolve, 1000);
      })
    );

    act(() => {
      tracker.add(resource);
    });

    expect(result.all).toHaveLength(2);
    expect(result.current).toBe(true);

    act(() => {
      tracker.remove(resource);
    });

    expect(result.all).toHaveLength(3);
    expect(result.current).toBe(false);
  });
});
