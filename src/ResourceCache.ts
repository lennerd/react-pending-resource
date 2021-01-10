import Resource, {
  createResource,
  ResourceAllocation,
  ResourceKey,
} from './Resource';

export interface ResourceCacheInvalidationCallback<T = any> {
  (resource: Resource<T> | undefined): void;
}

interface ResourceCacheEntry<T = any> {
  resource?: Resource<T>;
  promiseOrValue?: Promise<T> | T;
}

export function createResourceCacheHash(key: ResourceKey): string {
  return JSON.stringify(key);
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

export default class ResourceCache {
  private subscribers = new Map<
    string,
    Set<ResourceCacheInvalidationCallback>
  >();
  private cache = new Map<string, ResourceCacheEntry>();

  public preload<T>(
    key: ResourceKey,
    promiseOrCallback: Promise<T> | (() => Promise<T> | T)
  ): Resource<T> {
    const cacheHash = createResourceCacheHash(key);

    this.garbageCollect();

    let entry = this.cache.get(cacheHash) as ResourceCacheEntry<T>;

    if (entry == null) {
      this.cache.set(cacheHash, (entry = {}));
    }

    let promise: Promise<T>;

    if (typeof promiseOrCallback === 'function') {
      promise = Promise.resolve((promiseOrCallback as () => Promise<T> | T)());
    } else {
      promise = promiseOrCallback;
    }

    // Promises are immutable. So lets early return if we already created a
    // resource and the promise is the still the same.
    if (entry.resource != null && entry.promiseOrValue === promise) {
      return entry.resource;
    }

    entry.resource = createResource(key, promise);
    entry.promiseOrValue = promise;

    this.notifySubscribers(cacheHash);

    return entry.resource;
  }

  public subscribe(
    cacheKey: ResourceKey,
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
    cacheKey: ResourceKey,
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

  public invalidate(cacheKey: ResourceKey): void {
    const cacheHash = createResourceCacheHash(cacheKey);

    this.garbageCollect();

    if (this.cache.delete(cacheHash)) {
      this.notifySubscribers(cacheHash);
    }
  }

  public get<T = any>(cacheKey: ResourceKey): Resource<T> | undefined {
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
