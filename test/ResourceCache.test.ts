import ResourceCache from '../src/ResourceCache';

describe('ResourceCache', () => {
  it('preloads different resources for different cache key', () => {
    const resourceCache = new ResourceCache();
    const resourceA = resourceCache.preload(
      'cacheKeyA',
      () => Promise.resolve(),
      []
    );
    const resourceB = resourceCache.preload(
      'cacheKeyB',
      () => Promise.resolve(),
      []
    );

    expect(resourceA).not.toBe(resourceB);
  });

  it('preloads same resource for same cache key and without dependency array', () => {
    const resourceCache = new ResourceCache();
    const resourceA = resourceCache.preload('cacheKey', () =>
      Promise.resolve()
    );
    const resourceB = resourceCache.preload('cacheKey', () =>
      Promise.resolve()
    );

    expect(resourceA).toBe(resourceB);
  });

  it('preloads different resources for different cache key and without dependency array', () => {
    const resourceCache = new ResourceCache();
    const resourceA = resourceCache.preload('cacheKeyA', () =>
      Promise.resolve()
    );
    const resourceB = resourceCache.preload('cacheKeyB', () =>
      Promise.resolve()
    );

    expect(resourceA).not.toBe(resourceB);
  });

  it('preloads same resource for same cache key and without dependency', () => {
    const resourceCache = new ResourceCache();
    const resourceA = resourceCache.preload(
      'cacheKey',
      () => Promise.resolve(),
      []
    );
    const resourceB = resourceCache.preload(
      'cacheKey',
      () => Promise.resolve(),
      []
    );

    expect(resourceA).toBe(resourceB);
  });

  it('preloads different resources for same cache key, but different dependency array', () => {
    const resourceCache = new ResourceCache();
    const resourceA = resourceCache.preload(
      'cacheKey',
      () => Promise.resolve(),
      ['a']
    );
    const resourceB = resourceCache.preload(
      'cacheKey',
      () => Promise.resolve(),
      ['b', 'c']
    );

    expect(resourceA).not.toBe(resourceB);
  });

  it('preloads same resource for same cache key and promise, but different dependency array', () => {
    const resourceCache = new ResourceCache();
    const promise = Promise.resolve();
    const resourceA = resourceCache.preload('cacheKey', () => promise, ['a']);
    const resourceB = resourceCache.preload('cacheKey', () => promise, ['b']);

    expect(resourceA).toBe(resourceB);
  });

  it('preloads different resources for same cache key, but without dependency array', () => {
    const resourceCache = new ResourceCache();
    const resourceA = resourceCache.preload('cacheKey', Promise.resolve());
    const resourceB = resourceCache.preload('cacheKey', Promise.resolve());

    expect(resourceA).not.toBe(resourceB);
  });

  it('preloads same resource for same cache key and promise, but without dependency array', () => {
    const resourceCache = new ResourceCache();
    const promise = Promise.resolve();
    const resourceA = resourceCache.preload('cacheKey', promise);
    const resourceB = resourceCache.preload('cacheKey', promise);

    expect(resourceA).toBe(resourceB);
  });

  it('preloads different resources for same cache key, but with different promises and call signatures (promise, callback)', () => {
    const resourceCache = new ResourceCache();
    const resourceA = resourceCache.preload('cacheKey', Promise.resolve());
    const resourceB = resourceCache.preload(
      'cacheKey',
      () => Promise.resolve(),
      ['a']
    );

    expect(resourceA).not.toBe(resourceB);
  });

  it('preloads same resources for same cache key, but with different promises and call signatures (promise, callback) if dependency array is skipped', () => {
    const resourceCache = new ResourceCache();
    const resourceA = resourceCache.preload('cacheKey', Promise.resolve());
    const resourceB = resourceCache.preload(
      'cacheKey',
      () => Promise.resolve(),
      ['a'],
      {
        skipInitialDeps: true,
      }
    );

    expect(resourceA).toBe(resourceB);
  });

  it('preloads same resource for same cache key and promise, but with different call signatures (promise, callback)', () => {
    const resourceCache = new ResourceCache();
    const promise = Promise.resolve();
    const resourceA = resourceCache.preload('cacheKey', promise);
    const resourceB = resourceCache.preload('cacheKey', () => promise, []);

    expect(resourceA).toBe(resourceB);
  });

  it('preloads different resources for same cache key and promise, but with different call signatures (callback, promise)', () => {
    const resourceCache = new ResourceCache();
    const resourceA = resourceCache.preload(
      'cacheKey',
      () => Promise.resolve(),
      []
    );
    const resourceB = resourceCache.preload('cacheKey', Promise.resolve());

    expect(resourceA).not.toBe(resourceB);
  });

  it('preloads same resource for same cache key and promise, but with different call signatures (callback, promise)', () => {
    const resourceCache = new ResourceCache();
    const promise = Promise.resolve();
    const resourceA = resourceCache.preload('cacheKey', () => promise, []);
    const resourceB = resourceCache.preload('cacheKey', promise);

    expect(resourceA).toBe(resourceB);
  });

  it('cleans detached resources', () => {
    jest.useFakeTimers();

    const resourceCache = new ResourceCache();
    const resourceAFirst = resourceCache.preload(
      'cacheKeyA',
      () => Promise.resolve(),
      ['a']
    );
    const resourceBFirst = resourceCache.preload(
      'cacheKeyB',
      () => Promise.resolve(),
      ['b']
    );
    const resourceCFirst = resourceCache.preload(
      'cacheKeyC',
      () => Promise.resolve(),
      ['c']
    );

    resourceAFirst.allocate();
    resourceAFirst.free();
    resourceBFirst.allocate();

    jest.runAllTimers();

    const resourceASecond = resourceCache.preload(
      'cacheKeyA',
      () => Promise.resolve(),
      ['a']
    );
    const resourceBSecond = resourceCache.preload(
      'cacheKeyB',
      () => Promise.resolve(),
      ['b']
    );
    const resourceCSecond = resourceCache.preload(
      'cacheKeyC',
      () => Promise.resolve(),
      ['c']
    );
    expect(resourceAFirst).not.toBe(resourceASecond);
    expect(resourceBFirst).toBe(resourceBSecond);
    expect(resourceCFirst).toBe(resourceCSecond);
  });

  it('notifies when preloading and invalidating', () => {
    const resourceCache = new ResourceCache();
    const callback = jest.fn();
    resourceCache.subscribe('cacheKeyA', callback);

    const resourceAFirst = resourceCache.preload(
      'cacheKeyA',
      () => Promise.resolve(),
      []
    );

    resourceCache.invalidate('cacheKeyA');

    const resourceASecond = resourceCache.preload(
      'cacheKeyA',
      () => Promise.resolve(),
      []
    );

    expect(resourceAFirst).not.toBe(resourceASecond);
    expect(callback.mock.calls).toHaveLength(3);
    expect(callback.mock.calls).toEqual([
      [resourceAFirst],
      [undefined],
      [resourceASecond],
    ]);

    callback.mockReset();
    resourceCache.invalidate('cacheKeyB');
    expect(callback).not.toBeCalled();

    resourceCache.unsubscribe('cacheKeyA', callback);
    resourceCache.invalidate('cacheKeyA');
    expect(callback).not.toBeCalled();
  });

  it('gets preloaded resource or throws', () => {
    const resourceCache = new ResourceCache();
    const resourceA = resourceCache.preload('cacheKeyA', Promise.resolve());

    expect(resourceCache.get('cacheKeyA')).toBe(resourceA);
    expect(resourceCache.get('cacheKeyB')).toBe(undefined);
  });

  it('handles nested cache keys', () => {});
});
