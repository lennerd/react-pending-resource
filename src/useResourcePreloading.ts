import { useRef } from 'react';
import Resource, { ResourceKey } from './Resource';
import useResourceCache from './useResourceCache';
import shallowEqual from './utils/shallowEqual';

export default function useResourcePreloading<T>(
  cacheKey: ResourceKey,
  callback: () => Promise<T> | T,
  deps?: any[]
): Resource<T> {
  const depsRef = useRef(deps);
  const resourceCache = useResourceCache();
  let resource = resourceCache.get(cacheKey);

  if (resource == null || !shallowEqual(depsRef.current, deps)) {
    resource = resourceCache.preload(cacheKey, callback);
    depsRef.current = deps;
  }

  return resource;
}
