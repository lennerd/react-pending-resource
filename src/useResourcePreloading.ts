import { useRef } from 'react';
import Resource, { ResourceKey } from './Resource';
import useResourceCache from './useResourceCache';
import shallowEqual from './utils/shallowEqual';

export default function useResourcePreloading<T>(
  key: ResourceKey,
  callback: () => Promise<T> | T,
  deps?: any[]
): Resource<T> {
  const depsRef = useRef(deps);
  const resourceCache = useResourceCache();
  let resource = resourceCache.get(key);

  if (resource == null || !shallowEqual(depsRef.current, deps)) {
    resource = resourceCache.preload(key, callback);
    depsRef.current = deps;
  }

  return resource;
}
