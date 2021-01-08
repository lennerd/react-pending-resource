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
      new Promise(resolve => {
        setTimeout(resolve, 500);
      })
    );
    const resourceB = createResource(
      new Promise(resolve => {
        setTimeout(resolve, 1000);
      })
    );
    const resourceC = createResource(
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
    await new Promise(resolve => process.nextTick(resolve));

    expect(resourceTracker.isPending()).toBe(true);
    expect(callback).toBeCalledTimes(3);

    jest.advanceTimersByTime(500);
    await new Promise(resolve => process.nextTick(resolve));

    expect(resourceTracker.isPending()).toBe(false);
    expect(callback).toBeCalledTimes(4);

    resourceTracker.unsubscribe(callback);
    resourceTracker.add(resourceC);

    expect(resourceTracker.isPending()).toBe(true);
    expect(callback).toBeCalledTimes(4);
  });

  it('only adds resource once', async () => {
    jest.useFakeTimers();

    const resource = createResource(Promise.resolve());

    resourceTracker.add(resource);
    resourceTracker.add(resource);
    expect(resourceTracker.isPending()).toBe(true);

    resourceTracker.remove(resource);
    expect(resourceTracker.isPending()).toBe(false);
  });
});
