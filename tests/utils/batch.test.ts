import batch from '../../src/utils/batch';

describe('batch', () => {
  it('batches function calls', async () => {
    expect.assertions(6);

    const callback = jest.fn();
    const batchedCallback = batch(callback);

    batchedCallback('first');
    batchedCallback('second');
    batchedCallback('third');

    expect(callback).toBeCalledTimes(0);

    await Promise.resolve();

    expect(callback).toBeCalledTimes(1);
    expect(callback.mock.calls).toEqual([['third']]);

    batchedCallback('fourth');

    expect(callback).toBeCalledTimes(1);

    await Promise.resolve();

    expect(callback).toBeCalledTimes(2);
    expect(callback.mock.calls).toEqual([['third'], ['fourth']]);
  });
});
