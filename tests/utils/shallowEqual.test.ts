import shallowEqual from '../../src/utils/shallowEqual';

describe('shallowEqual', () => {
  it('checks for equality of arrays', () => {
    expect(shallowEqual(undefined, ['test'])).toBe(false);
    expect(shallowEqual(['test'], undefined)).toBe(false);
    expect(shallowEqual(['test', 'foo'], ['test'])).toBe(false);
    expect(shallowEqual(undefined, undefined)).toBe(true);
    expect(shallowEqual(['test'], ['test'])).toBe(true);
    expect(shallowEqual(['test', 2], ['test', 2])).toBe(true);
  });
});
