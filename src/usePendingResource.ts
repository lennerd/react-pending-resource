import { useEffect, useState } from 'react';
import isPromise from './utils/isPromise';
import Resource from './Resource';
import { ResourceCacheKey } from './ResourceCache';
import useResource from './useResource';
import useResourceConfig, { ResourceConfig } from './useResourceConfig';

const NO_DATA = Symbol('NO_DATA');

export interface UsePendingResourceOptions<T> extends ResourceConfig {
  initialData?: T;
}

export default function usePendingResource<T = any>(
  resourceOrCacheKey: Resource<T> | ResourceCacheKey,
  options?: ({ initialRender: false } | { initialData: T }) &
    UsePendingResourceOptions<T>
): [T, boolean];

export default function usePendingResource<T = any>(
  resourceOrCacheKey: Resource<T> | ResourceCacheKey,
  options?: UsePendingResourceOptions<T>
): [T | undefined, boolean];

export default function usePendingResource<T = any>(
  resourceOrCacheKey: Resource<T> | ResourceCacheKey,
  options: UsePendingResourceOptions<T> = {}
): [T | undefined, boolean] {
  const { timeout, initialRender = true, initialData = NO_DATA } = {
    ...useResourceConfig(),
    ...options,
  };
  const [prevData, setPrevData] = useState(initialData);
  const [timedOut, setTimedOut] = useState(false);
  let data: T | undefined;
  let promise: Promise<any> | undefined;
  let error: any;
  let isPending = false;

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    data = useResource(resourceOrCacheKey);
  } catch (errorOrPromise) {
    if (isPromise(errorOrPromise)) {
      promise = errorOrPromise;
      data = prevData !== NO_DATA ? prevData : undefined;
      isPending = true;
    } else {
      error = errorOrPromise;
    }
  }

  // Set new data when promise was resolved. Also triggers rerendering and rereading the resource (if data is new).
  // The data is stored as previous data in case a new resource is created and pending again.
  usePromise(promise, setPrevData);

  // If a valid timeout was set, wait for given seconds to rerender component and let react suspense handle the promise.
  useTimeout(promise && timeout, setTimedOut);

  // Throw error or promise, if timed out or no initial data was provided and initial render is disabled
  if (
    error != null ||
    (promise != null && (timedOut || (prevData === NO_DATA && !initialRender)))
  ) {
    throw error ?? promise;
  }

  return [data, isPending];
}

function usePromise<T>(
  promise: Promise<T> | undefined,
  callback: (data: T) => void
): void {
  useEffect(() => {
    if (promise == null) {
      return;
    }

    let cancel = false;

    promise.then(data => {
      if (!cancel) {
        callback(data);
      }
    });

    return () => {
      cancel = true;
    };
  }, [promise, callback]);
}

function useTimeout(
  timeout: number | undefined,
  callback: (timedOut: boolean) => void
): void {
  useEffect(() => {
    if (timeout == null || timeout < 0) {
      callback(false);

      return;
    }

    const timeoutRef = setTimeout(() => {
      callback(true);
    }, timeout);

    return () => {
      clearTimeout(timeoutRef);
    };
  }, [timeout, callback]);
}
