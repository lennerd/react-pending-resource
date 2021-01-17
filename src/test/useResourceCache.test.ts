import { renderHook } from '@testing-library/react-hooks';
import ResourceCache from '../ResourceCache';
import useResourceCache from '../useResourceCache';
import { renderResourceHook } from './utils';

describe('useResourceCache', () => {
  it('uses global resource cache', () => {
    const { result } = renderHook(() => useResourceCache());

    expect(result.current).toBeInstanceOf(ResourceCache);
  });

  it('uses provided cache', () => {
    const cache = new ResourceCache();

    const { result } = renderResourceHook(() => useResourceCache(), {
      cache,
    });

    expect(result.current).toBe(cache);
  });
});
