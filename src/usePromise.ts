import { ResourceKey } from './Resource';
import useResource from './useResource';
import useResourcePreloading from './useResourcePreloading';

export default function usePromise<T>(
  key: ResourceKey,
  callback: () => Promise<T> | T,
  deps?: any[]
): T {
  const resource = useResourcePreloading(key, callback, deps);

  return useResource(resource);
}
