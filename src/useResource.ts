import { useEffect, useRef } from 'react';
import isPromise from './utils/isPromise';
import useForceUpdate from './utils/useForceUpdate';
import Resource, { isValidResourceKey, ResourceKey } from './Resource';
import { createResourceCacheHash } from './ResourceCache';
import useResourceCache from './useResourceCache';
import useResourceTracker from './useResourceTracker';

export default function useResource<T = any>(
  resourceOrCacheKey: Resource<T> | ResourceKey
): T {
  const forceUpdate = useForceUpdate();
  const resourceCache = useResourceCache();
  let resource: Resource<T>;

  let data: T;
  let promise: Promise<any> | undefined;
  let error: any;

  if (isValidResourceKey(resourceOrCacheKey)) {
    const cachedResource = resourceCache.get<T>(resourceOrCacheKey);

    if (cachedResource == null) {
      throw new Error(
        `Cannot find preloaded resource for key "${createResourceCacheHash(
          resourceOrCacheKey
        )}"`
      );
    }

    resource = cachedResource;
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
  useResourceInvalidation(resource, forceUpdate);

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
  resource: Resource<any>,
  callback: () => void
): void {
  const resourceCache = useResourceCache();
  const prevResourceRef = useRef<Resource<any>>();

  if (prevResourceRef.current == null) {
    prevResourceRef.current = resourceCache.get(resource.key);
  }

  useEffect(() => {
    const handleResource = (resource: Resource<any> | undefined): void => {
      // Only invalidate when current resource has changed or is undefined
      // (invalidated)
      if (resource !== prevResourceRef.current) {
        prevResourceRef.current = resource;
        callback();
      }
    };

    resourceCache.subscribe(resource.key, handleResource);

    return () => {
      resourceCache.unsubscribe(resource.key, handleResource);
    };
  }, [resourceCache, resource, callback]);
}
