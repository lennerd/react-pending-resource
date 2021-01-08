import { ResourceCacheKey } from './ResourceCache';
import usePendingResource, {
  UsePendingResourceOptions,
} from './usePendingResource';
import useResourceCache from './useResourceCache';

interface UsePendingPromiseOptions<T> extends UsePendingResourceOptions<T> {
  deps?: any[];
}

export default function usePendingPromise<T>(
  cacheKey: ResourceCacheKey,
  callback: () => T | Promise<T>,
  depsOrOptions?:
    | any[]
    | (({ initialRender: false } | { initialData: T }) &
        UsePendingPromiseOptions<T>)
): [T, boolean];

export default function usePendingPromise<T>(
  cacheKey: ResourceCacheKey,
  callback: () => T | Promise<T>,
  depsOrOptions?: any[] | UsePendingPromiseOptions<T>
): [T | undefined, boolean];

export default function usePendingPromise<T>(
  cacheKey: ResourceCacheKey,
  callback: () => T | Promise<T>,
  depsOrOptions?: any[] | UsePendingPromiseOptions<T>
): [T | undefined, boolean] {
  const options = Array.isArray(depsOrOptions)
    ? { deps: depsOrOptions }
    : depsOrOptions ?? {};

  const resourceCache = useResourceCache();
  resourceCache.preload(cacheKey, callback, options.deps, {
    skipInitialDeps: true,
  });

  return usePendingResource(cacheKey, options);
}
