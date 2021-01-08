import isPromise from './utils/isPromise';
import Resource from './Resource';

export default class ResourceTracker {
  private pendingResources = new Set<Resource<any>>();
  private subscribers = new Set<() => void>();

  public add(resource: Resource<any>): void {
    if (this.pendingResources.has(resource)) {
      return;
    }

    try {
      resource.read();
    } catch (promise) {
      if (isPromise(promise)) {
        this.pendingResources.add(resource);
        this.notifySubscribers();

        promise.finally(() => {
          this.remove(resource);
        });
      }
    }
  }

  public remove(resource: Resource<any>): void {
    if (this.pendingResources.delete(resource)) {
      this.notifySubscribers();
    }
  }

  public subscribe(callback: () => void): void {
    this.subscribers.add(callback);
  }

  public unsubscribe(callback: () => void): void {
    this.subscribers.delete(callback);
  }

  public isPending(): boolean {
    return this.pendingResources.size > 0;
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      callback();
    });
  }
}
