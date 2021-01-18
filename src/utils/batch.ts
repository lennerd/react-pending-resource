import schedule from './schedule';

export default function batch<T, A extends any[]>(
  callback: (this: T, ...args: A) => void
): (this: T, ...args: A) => void {
  let cancel: () => void;

  return function(this: T, ...args: A) {
    if (cancel != null) {
      cancel();
    }

    let canceled = false;

    cancel = () => {
      canceled = true;
    };

    schedule(() => {
      if (!canceled) {
        callback.call(this, ...args);
      }
    });
  };
}
