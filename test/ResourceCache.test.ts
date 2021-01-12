import ResourceCache from '../src/ResourceCache';

describe('ResourceCache', () => {
  it('preloads new resource for same key', () => {
    const resourceCache = new ResourceCache();
    const resourceA = resourceCache.preload('key', () => Promise.resolve());
    const resourceB = resourceCache.preload('key', () => Promise.resolve());

    expect(resourceA).not.toBe(resourceB);
  });

  it('preloads new resources for different key', () => {
    const resourceCache = new ResourceCache();
    const resourceA = resourceCache.preload('keyA', () => Promise.resolve());
    const resourceB = resourceCache.preload('keyB', () => Promise.resolve());

    expect(resourceA).not.toBe(resourceB);
  });

  it('preloads same resource for same key and promise', () => {
    const resourceCache = new ResourceCache();
    const promise = Promise.resolve();
    const resourceA = resourceCache.preload('key', promise);
    const resourceB = resourceCache.preload('key', promise);

    expect(resourceA).toBe(resourceB);
  });

  it('preloads same resource for same key and promise, but with different call signatures (promise, callback)', () => {
    const resourceCache = new ResourceCache();
    const promise = Promise.resolve();
    const resourceA = resourceCache.preload('key', promise);
    const resourceB = resourceCache.preload('key', () => promise);

    expect(resourceA).toBe(resourceB);
  });

  it('preloads different resources for same key and promise, but with different call signatures (callback, promise)', () => {
    const resourceCache = new ResourceCache();
    const resourceA = resourceCache.preload('key', () => Promise.resolve());
    const resourceB = resourceCache.preload('key', Promise.resolve());

    expect(resourceA).not.toBe(resourceB);
  });

  it('preloads same resource for same key and promise, but with different call signatures (callback, promise)', () => {
    const resourceCache = new ResourceCache();
    const promise = Promise.resolve();
    const resourceA = resourceCache.preload('key', () => promise);
    const resourceB = resourceCache.preload('key', promise);

    expect(resourceA).toBe(resourceB);
  });

  it('cleans detached resources', () => {
    jest.useFakeTimers();

    const resourceCache = new ResourceCache();
    const resourceA = resourceCache.preload('keyA', () => Promise.resolve());
    const resourceB = resourceCache.preload('keyB', () => Promise.resolve());
    const resourceC = resourceCache.preload('keyC', () => Promise.resolve());

    resourceA.allocate();
    resourceA.free();
    resourceB.allocate();

    jest.runAllTimers();

    expect(resourceCache.get('keyA')).not.toBe(resourceA);
    expect(resourceCache.get('keyB')).toBe(resourceB);
    expect(resourceCache.get('keyC')).toBe(resourceC);
  });

  it('notifies when preloading and invalidating', () => {
    const resourceCache = new ResourceCache();
    const callback = jest.fn();
    resourceCache.subscribe('keyA', callback);

    const resourceAFirst = resourceCache.preload('keyA', () =>
      Promise.resolve()
    );

    resourceCache.invalidate('keyA');

    const resourceASecond = resourceCache.preload('keyA', () =>
      Promise.resolve()
    );

    expect(resourceAFirst).not.toBe(resourceASecond);
    expect(callback.mock.calls).toHaveLength(3);
    expect(callback.mock.calls).toEqual([
      [resourceAFirst],
      [undefined],
      [resourceASecond],
    ]);

    callback.mockReset();
    resourceCache.invalidate('keyB');
    expect(callback).not.toBeCalled();

    resourceCache.unsubscribe('keyA', callback);
    resourceCache.invalidate('keyA');
    expect(callback).not.toBeCalled();
  });

  it('gets preloaded resource or undefined', () => {
    const resourceCache = new ResourceCache();
    const resourceA = resourceCache.preload('keyA', Promise.resolve());

    expect(resourceCache.get('keyA')).toBe(resourceA);
    expect(resourceCache.get('keyB')).toBe(undefined);
  });
});
