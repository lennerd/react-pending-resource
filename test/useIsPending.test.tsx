import { act, renderHook } from '@testing-library/react-hooks';
import * as React from 'react';
import { createResource } from '../src/Resource';
import ResourceTracker from '../src/ResourceTracker';
import useIsPending from '../src/useIsPending';
import { ResourceTrackerProvider } from '../src/useResourceTracker';

describe('useIsPending', () => {
  it('switches pending state when promises were added and resolved', async () => {
    expect.assertions(3);

    jest.useFakeTimers();

    const resourceTracker = new ResourceTracker();
    const { result } = renderHook(() => useIsPending(), {
      wrapper({ children }) {
        return (
          <ResourceTrackerProvider tracker={resourceTracker}>
            {children}
          </ResourceTrackerProvider>
        );
      },
    });

    expect(result.current).toBe(false);

    const promise = new Promise(resolve => {
      setTimeout(resolve, 1000);
    });

    act(() => {
      resourceTracker.add(createResource('test', promise));
    });

    expect(result.current).toBe(true);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(result.current).toBe(false);
  });

  it('switches pending state when resource was removed', async () => {
    expect.assertions(2);

    jest.useFakeTimers();

    const resourceTracker = new ResourceTracker();
    const { result } = renderHook(() => useIsPending(), {
      wrapper({ children }) {
        return (
          <ResourceTrackerProvider tracker={resourceTracker}>
            {children}
          </ResourceTrackerProvider>
        );
      },
    });

    const resource = createResource(
      'test',
      new Promise(resolve => {
        setTimeout(resolve, 1000);
      })
    );

    act(() => {
      resourceTracker.add(resource);
    });

    expect(result.current).toBe(true);

    act(() => {
      resourceTracker.remove(resource);
    });

    expect(result.current).toBe(false);
  });
});
