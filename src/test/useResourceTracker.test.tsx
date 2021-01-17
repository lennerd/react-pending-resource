import { renderHook } from '@testing-library/react-hooks';
import * as React from 'react';
import ResourceTracker from '../ResourceTracker';
import useResourceTracker, {
  ResourceTrackerProvider,
} from '../useResourceTracker';

describe('useResourceTracker', () => {
  it('uses global resource tracker', () => {
    const { result } = renderHook(() => useResourceTracker());

    expect(result.current).toBeInstanceOf(ResourceTracker);
  });

  it('uses provided tracker', () => {
    const resourceTracker = new ResourceTracker();

    const { result } = renderHook(() => useResourceTracker(), {
      wrapper({ children }) {
        return (
          <ResourceTrackerProvider tracker={resourceTracker}>
            {children}
          </ResourceTrackerProvider>
        );
      },
    });

    expect(result.current).toBe(resourceTracker);
  });
});
