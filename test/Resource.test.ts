import {
  createResource,
  isValidResourceKey,
  ResourceAllocation,
} from '../src/Resource';

describe('Resource', () => {
  it('has a key', () => {
    const resource = createResource('resource key', Promise.resolve());

    expect(resource.key).toBe('resource key');
  });

  it('has valid state', () => {
    const resource = createResource('resource test', Promise.resolve());
    expect(resource.getAllocation()).toBe(ResourceAllocation.UNKNOWN);

    resource.allocate();
    resource.allocate();
    expect(resource.getAllocation()).toBe(ResourceAllocation.ALLOCATED);

    resource.free();
    expect(resource.getAllocation()).toBe(ResourceAllocation.ALLOCATED);

    resource.free();
    expect(resource.getAllocation()).toBe(ResourceAllocation.FREED);
  });

  it('reads value when promise resolved', async () => {
    expect.assertions(3);

    const data = 'value';
    const promise = Promise.resolve(data);
    const resource = createResource('test resource', promise);

    expect(() => resource.read()).toThrow();
    const resolvedData = await promise;

    expect(resource.read()).toBe(data);
    expect(resolvedData).toBe(data);
  });

  it('throws error when promise rejected', async () => {
    expect.assertions(2);

    const error = new Error();
    const promise = Promise.reject(error);
    const resource = createResource('test key', promise);

    expect(() => resource.read()).toThrow();

    try {
      await promise;
    } catch (error) {}

    expect(() => resource.read()).toThrowError(error);
  });
});

describe('isValidResourceKey', () => {
  it('validates resource key', () => {
    expect(isValidResourceKey('string key')).toBe(true);
    expect(isValidResourceKey(2)).toBe(true);
    expect(isValidResourceKey(['first', 'second'])).toBe(true);
    expect(isValidResourceKey([1, 'second'])).toBe(true);
    expect(isValidResourceKey(['first', 2])).toBe(true);
    expect(isValidResourceKey([1, 2])).toBe(true);
    expect(isValidResourceKey([1, 2, ['third', 4, 'fifth']])).toBe(true);
  });
});
