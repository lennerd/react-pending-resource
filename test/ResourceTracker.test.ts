import { createResource } from '../src/Resource';
import ResourceTracker from '../src/ResourceTracker';

describe('ResourceTracker', () => {
  let resourceTracker: ResourceTracker;

  beforeEach(() => {
    resourceTracker = new ResourceTracker();
  });

  it('notifies subscribers', async () => {
    expect.assertions(8);

    jest.useFakeTimers();

    const resourceA = createResource(
      'test A',
      new Promise(resolve => {
        setTimeout(resolve, 500);
      })
    );
    const resourceB = createResource(
      'test B',
      new Promise(resolve => {
        setTimeout(resolve, 1000);
      })
    );
    const resourceC = createResource(
      'test C',
      new Promise(resolve => {
        setTimeout(resolve, 1500);
      })
    );
    const callback = jest.fn();

    resourceTracker.subscribe(callback);

    resourceTracker.add(resourceA);
    resourceTracker.add(resourceB);

    expect(resourceTracker.isPending()).toBe(true);
    expect(callback).toBeCalledTimes(2);

    jest.advanceTimersByTime(500);
    await nextTick();

    expect(resourceTracker.isPending()).toBe(true);
    expect(callback).toBeCalledTimes(3);

    jest.advanceTimersByTime(500);
    await nextTick();

    expect(resourceTracker.isPending()).toBe(false);
    expect(callback).toBeCalledTimes(4);

    resourceTracker.unsubscribe(callback);
    resourceTracker.add(resourceC);

    expect(resourceTracker.isPending()).toBe(true);
    expect(callback).toBeCalledTimes(4);
  });

  it('only adds resource once', () => {
    jest.useFakeTimers();

    const resource = createResource('only once', Promise.resolve());

    resourceTracker.add(resource);
    resourceTracker.add(resource);
    expect(resourceTracker.isPending()).toBe(true);

    resourceTracker.remove(resource);
    expect(resourceTracker.isPending()).toBe(false);
  });

  it('does not add rejected resource', async () => {
    expect.assertions(1);

    const resource = createResource('rejected', Promise.resolve());

    await nextTick();

    resourceTracker.add(resource);
    expect(resourceTracker.isPending()).toBe(false);
  });

  it('stops pending if promise throws', async () => {
    expect.assertions(2);

    const resource = createResource(
      'rejected',
      Promise.resolve().then(() => {
        throw new Error();
      })
    );

    resourceTracker.add(resource);

    expect(resourceTracker.isPending()).toBe(true);

    await nextTick();

    expect(resourceTracker.isPending()).toBe(false);
  });
});

function nextTick(): Promise<void> {
  return new Promise(resolve => process.nextTick(resolve));
}
