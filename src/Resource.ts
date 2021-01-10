export enum ResourceAllocation {
  UNKNOWN = 'unknown',
  ALLOCATED = 'allocated',
  FREED = 'freed',
}

enum ResourceSuspensionStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export type ResourceKey = string | number | ResourceKey[];

export function isValidResourceKey(value: any): value is ResourceKey {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    (Array.isArray(value) && value.every(isValidResourceKey))
  );
}

export default interface Resource<T> {
  readonly key: ResourceKey;
  getAllocation(): ResourceAllocation;
  allocate(): void;
  free(): void;
  read(): T;
}

export function createResource<T>(
  key: ResourceKey,
  promise: Promise<T>
): Resource<T> {
  let numberOfAllocations = 0;
  let allocation = ResourceAllocation.UNKNOWN;

  let status = ResourceSuspensionStatus.PENDING;
  let suspendedResult: T;
  let suspendedError: any;
  let suspended = promise.then(
    result => {
      status = ResourceSuspensionStatus.RESOLVED;
      suspendedResult = result;

      return result;
    },
    error => {
      status = ResourceSuspensionStatus.REJECTED;
      suspendedError = error;
    }
  );

  return {
    key,

    read(): T {
      if (status === ResourceSuspensionStatus.PENDING) {
        throw suspended;
      }

      if (status === ResourceSuspensionStatus.REJECTED) {
        throw suspendedError;
      }

      return suspendedResult;
    },

    getAllocation(): ResourceAllocation {
      return allocation;
    },

    allocate() {
      numberOfAllocations++;
      allocation = ResourceAllocation.ALLOCATED;
    },

    free() {
      numberOfAllocations = Math.max(0, numberOfAllocations - 1);

      if (numberOfAllocations === 0) {
        allocation = ResourceAllocation.FREED;
      }
    },
  };
}
