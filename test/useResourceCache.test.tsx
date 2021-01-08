import { renderHook } from '@testing-library/react-hooks';
import * as React from 'react';
import ResourceCache from '../src/ResourceCache';
import useResourceCache, {
  ResourceCacheProvider,
} from '../src/useResourceCache';

describe('useResourceCache', () => {
  it('uses global resource cache', () => {
    const { result } = renderHook(() => useResourceCache());

    expect(result.current).toBeInstanceOf(ResourceCache);
  });

  it('uses provided cache', () => {
    const resourceCache = new ResourceCache();

    const { result } = renderHook(() => useResourceCache(), {
      wrapper({ children }) {
        return (
          <ResourceCacheProvider cache={resourceCache}>
            {children}
          </ResourceCacheProvider>
        );
      },
    });

    expect(result.current).toBe(resourceCache);
  });
});
