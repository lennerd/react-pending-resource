import Resource, { createResource, ResourceAllocation } from './Resource';
import shallowEqual from './utils/shallowEqual';

export type ResourceCacheKey = string | number | ResourceCacheKey[];

export function isResourceCacheKey(value: any): value is ResourceCacheKey {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    (Array.isArray(value) && isResourceCacheKey(value))
  );
}

export interface ResourceCacheInvalidationCallback<T = any> {
  (resource: Resource<T> | undefined): void;
}

interface ResourceCacheEntry<T = any> {
  resource?: Resource<T>;
  deps?: any[];
  promise?: Promise<T> | T;
}

export function createResourceCacheHash(cacheKey: ResourceCacheKey): string {
  return JSON.stringify(cacheKey);
}

function batch<T, A extends any[]>(
  callback: (this: T, ...args: A) => void
): (this: T, ...args: A) => void {
  let timeoutRef: number;

  return function(this: T, ...args: A) {
    clearTimeout(timeoutRef);
    timeoutRef = setTimeout(() => callback.call(this, ...args));
  };
}

interface PreloadOptions {
  skipInitialDeps?: boolean;
}

export default class ResourceCache {
  private subscribers = new Map<
    string,
    Set<ResourceCacheInvalidationCallback>
  >();
  private cache = new Map<string, ResourceCacheEntry>();

  public preload<T>(
    cacheKey: ResourceCacheKey,
    callback: () => Promise<T> | T,
    deps?: any[],
    options?: PreloadOptions
  ): Resource<T>;
  public preload<T>(
    cacheKey: ResourceCacheKey,
    promise: Promise<T>
  ): Resource<T>;
  public preload<T>(cacheKey: ResourceCacheKey, value: T): Resource<T>;
  public preload<T>(
    cacheKey: ResourceCacheKey,
    callbackOrPromise: Promise<T> | (() => Promise<T> | T) | T,
    deps?: any[],
    { skipInitialDeps }: PreloadOptions = {}
  ): Resource<T> {
    const cacheHash = createResourceCacheHash(cacheKey);

    this.garbageCollect();
    let entry = this.cache.get(cacheHash) as ResourceCacheEntry<T>;

    if (entry == null) {
      this.cache.set(cacheHash, (entry = {}));
    }

    if (typeof callbackOrPromise === 'function') {
      let promise = entry.promise;

      if (
        promise == null ||
        ((entry.deps != null || !skipInitialDeps) &&
          !shallowEqual(entry.deps, deps))
      ) {
        promise = (callbackOrPromise as () => Promise<T> | T)();
        entry.deps = deps;
      }

      if (entry.resource != null && entry.promise === promise) {
        return entry.resource;
      }

      entry.resource = createResource(promise);
      entry.promise = promise;

      this.notifySubscribers(cacheHash);

      return entry.resource;
    }

    const promise = callbackOrPromise;

    if (entry.resource != null && entry.promise === promise) {
      return entry.resource;
    }

    entry.resource = createResource(promise);
    entry.promise = promise;
    entry.deps = undefined;

    this.notifySubscribers(cacheHash);

    return entry.resource;
  }

  public subscribe(
    cacheKey: ResourceCacheKey,
    callback: ResourceCacheInvalidationCallback
  ): void {
    const cacheHash = createResourceCacheHash(cacheKey);
    let subscribers = this.subscribers.get(cacheHash);

    if (subscribers == null) {
      this.subscribers.set(cacheHash, (subscribers = new Set()));
    }

    subscribers.add(callback);
  }

  public unsubscribe(
    cacheKey: ResourceCacheKey,
    callback: ResourceCacheInvalidationCallback
  ): void {
    const cacheHash = createResourceCacheHash(cacheKey);
    const subscribers = this.subscribers.get(cacheHash);

    if (subscribers != null) {
      subscribers.delete(callback);

      if (subscribers.size === 0) {
        this.subscribers.delete(cacheHash);
      }
    }
  }

  public invalidate(cacheKey: ResourceCacheKey): void {
    const cacheHash = createResourceCacheHash(cacheKey);

    this.garbageCollect();

    if (this.cache.delete(cacheHash)) {
      this.notifySubscribers(cacheHash);
    }
  }

  public get<T = any>(cacheKey: ResourceCacheKey): Resource<T> | undefined {
    const cacheHash = createResourceCacheHash(cacheKey);

    this.garbageCollect();

    return this.cache.get(cacheHash)?.resource;
  }

  private notifySubscribers(cacheHash: string): void {
    const subscribers = this.subscribers.get(cacheHash);
    const resource = this.cache.get(cacheHash)?.resource;

    subscribers?.forEach(callback => {
      callback(resource);
    });
  }

  private garbageCollect = batch((): void => {
    this.cache.forEach((entry, key) => {
      if (entry.resource?.getAllocation() === ResourceAllocation.FREED) {
        this.cache.delete(key);
      }
    });
  });
}
