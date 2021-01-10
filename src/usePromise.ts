import { ResourceKey } from './Resource';
import useResource from './useResource';
import useResourcePreloading from './useResourcePreloading';

export default function usePromise<T>(
  cacheKey: ResourceKey,
  callback: () => Promise<T> | T,
  deps?: any[]
): T {
  const resource = useResourcePreloading(cacheKey, callback, deps);

  return useResource(resource);
}
