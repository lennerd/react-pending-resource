import { useEffect, useRef } from 'react';
import isPromise from './utils/isPromise';
import useForceUpdate from './utils/useForceUpdate';
import Resource from './Resource';
import {
  createResourceCacheHash,
  isResourceCacheKey,
  ResourceCacheKey,
} from './ResourceCache';
import useResourceCache from './useResourceCache';
import useResourceTracker from './useResourceTracker';

export default function useResource<T = any>(
  resourceOrCacheKey: Resource<T> | ResourceCacheKey
): T {
  const forceUpdate = useForceUpdate();
  const resourceCache = useResourceCache();
  let resource: Resource<T> | undefined;
  let cacheKey: ResourceCacheKey | undefined;

  let data: T;
  let promise: Promise<any> | undefined;
  let error: any;

  if (isResourceCacheKey(resourceOrCacheKey)) {
    cacheKey = resourceOrCacheKey;
    resource = resourceCache.get<T>(resourceOrCacheKey);

    if (resource == null) {
      throw new Error(
        `Cannot find preloaded resource for key "${createResourceCacheHash(
          cacheKey
        )}"`
      );
    }
  } else {
    resource = resourceOrCacheKey;
  }

  try {
    data = resource.read();
  } catch (errorOrPromise) {
    // Catch promise to make sure the following effects are called in every case.
    if (isPromise(errorOrPromise)) {
      promise = errorOrPromise;
    } else {
      error = errorOrPromise;
    }
  }

  // Allocate resource if promise is resolved.
  useResourceAllocation(promise == null ? resource : undefined);

  // Track resource to notify components using useIsPending hook.
  // When using suspense directly, this hook will never add the resource as pending, as the hook will throw when pending and preventing
  // the resource from being added inside an effect. This hook is only used when useResource is used inside a pending hook like
  // usePendingResource or usePendingPromise.
  useResourceTracking(resource);

  // Rerender if resource was invalidated.
  useResourceInvalidation(cacheKey, forceUpdate);

  if (error != null || promise != null) {
    throw error ?? promise;
  }

  // Promise is undefined, so data must be T
  return data!;
}

function useResourceAllocation(resource: Resource<any> | undefined): void {
  useEffect(() => {
    if (resource == null) {
      return;
    }

    resource.allocate();

    return () => {
      resource.free();
    };
  }, [resource]);
}

function useResourceTracking(resource: Resource<any>): void {
  const resourceTracker = useResourceTracker();

  useEffect(() => {
    resourceTracker.add(resource);

    return () => {
      resourceTracker.remove(resource);
    };
  }, [resourceTracker, resource]);
}

function useResourceInvalidation(
  cacheKey: ResourceCacheKey | undefined,
  callback: () => void
): void {
  const resourceCache = useResourceCache();
  const prevResourceRef = useRef<Resource<any>>();

  if (cacheKey != null && prevResourceRef.current == null) {
    prevResourceRef.current = resourceCache.get(cacheKey);
  }

  useEffect(() => {
    if (cacheKey == null) {
      return;
    }

    const handleResource = (resource: Resource<any> | undefined): void => {
      // Only invalidate when current resource has changed or was invalidated (undefined)
      if (resource !== prevResourceRef.current) {
        prevResourceRef.current = resource;
        callback();
      }
    };

    resourceCache.subscribe(cacheKey, handleResource);

    return () => {
      resourceCache.unsubscribe(cacheKey, handleResource);
    };
  }, [resourceCache, cacheKey, callback]);
}
