import { createResource, ResourceAllocation } from '../src/Resource';

describe('Resource', () => {
  it('has valid state', () => {
    const resource = createResource(Promise.resolve());
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
    const resource = createResource(promise);

    expect(() => resource.read()).toThrow();
    const resolvedData = await promise;

    expect(resource.read()).toBe(data);
    expect(resolvedData).toBe(data);
  });

  it('throws error when promise rejected', async () => {
    expect.assertions(2);

    const error = new Error();
    const promise = Promise.reject(error);
    const resource = createResource(promise);

    expect(() => resource.read()).toThrow();

    try {
      await promise;
    } catch (error) {}

    expect(() => resource.read()).toThrowError(error);
  });
});
