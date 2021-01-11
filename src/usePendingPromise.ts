import { ResourceKey } from './Resource';
import usePendingResource, {
  UsePendingResourceOptions,
} from './usePendingResource';
import useResourcePreloading from './useResourcePreloading';

export interface UsePendingPromiseOptions<T>
  extends UsePendingResourceOptions<T> {
  deps?: any[];
}

export default function usePendingPromise<T>(
  cacheKey: ResourceKey,
  callback: () => T | Promise<T>,
  depsOrOptions: ({ initialRender: false } | { initialData: T }) &
    UsePendingPromiseOptions<T>
): [T, boolean];

export default function usePendingPromise<T>(
  cacheKey: ResourceKey,
  callback: () => T | Promise<T>,
  depsOrOptions?: any[] | UsePendingPromiseOptions<T>
): [T | undefined, boolean];

export default function usePendingPromise<T>(
  cacheKey: ResourceKey,
  callback: () => T | Promise<T>,
  depsOrOptions?: any[] | UsePendingPromiseOptions<T>
): [T | undefined, boolean] {
  const options = Array.isArray(depsOrOptions)
    ? { deps: depsOrOptions }
    : depsOrOptions ?? {};
  const resource = useResourcePreloading(cacheKey, callback, options.deps);

  return usePendingResource(resource, options);
}
