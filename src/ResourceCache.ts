import Resource, {
  createResource,
  ResourceAllocation,
  ResourceKey,
} from './Resource';
import batch from './utils/batch';
import schedule from './utils/schedule';

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

    this.scheduleNotification(cacheHash);
    this.scheduleGarbageCollection();

    return entry.resource;
  }

  public subscribe(
    key: ResourceKey,
    callback: ResourceCacheInvalidationCallback
  ): void {
    const cacheHash = createResourceCacheHash(key);
    let subscribers = this.subscribers.get(cacheHash);

    if (subscribers == null) {
      this.subscribers.set(cacheHash, (subscribers = new Set()));
    }

    subscribers.add(callback);
  }

  public unsubscribe(
    key: ResourceKey,
    callback: ResourceCacheInvalidationCallback
  ): void {
    const cacheHash = createResourceCacheHash(key);
    const subscribers = this.subscribers.get(cacheHash);

    if (subscribers != null) {
      subscribers.delete(callback);

      if (subscribers.size === 0) {
        this.subscribers.delete(cacheHash);
      }
    }
  }

  public invalidate(key: ResourceKey): void {
    const cacheHash = createResourceCacheHash(key);

    this.scheduleGarbageCollection();

    if (this.cache.delete(cacheHash)) {
      this.scheduleNotification(cacheHash);
    }
  }

  public get<T = any>(key: ResourceKey): Resource<T> | undefined {
    const cacheHash = createResourceCacheHash(key);

    this.scheduleGarbageCollection();

    return this.cache.get(cacheHash)?.resource;
  }

  private scheduleNotification(cacheHash: string): void {
    const resource = this.cache.get(cacheHash)?.resource;

    schedule(() => {
      const subscribers = this.subscribers.get(cacheHash);

      subscribers?.forEach(callback => {
        callback(resource);
      });
    });
  }

  private scheduleGarbageCollection = batch((): void => {
    this.cache.forEach((entry, key) => {
      if (entry.resource?.getAllocation() === ResourceAllocation.FREED) {
        this.cache.delete(key);
      }
    });
  });
}
