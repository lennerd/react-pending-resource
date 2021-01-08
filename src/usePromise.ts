import { ResourceCacheKey } from './ResourceCache';
import useResource from './useResource';
import useResourceCache from './useResourceCache';

export default function usePromise<T>(
  cacheKey: ResourceCacheKey,
  callback: () => Promise<T>,
  deps?: any[]
): T {
  const resourceCache = useResourceCache();
  resourceCache.preload(cacheKey, callback, deps, { skipInitialDeps: true });

  // Use cache key to take advantage of resource invalidation.
  return useResource(cacheKey);
}
