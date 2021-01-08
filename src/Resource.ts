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

export default interface Resource<T> {
  getAllocation(): ResourceAllocation;
  allocate(): void;
  free(): void;
  read(): T;
}

export function createResource<T>(promise: Promise<T> | T): Resource<T> {
  let numberOfAllocations = 0;
  let allocation = ResourceAllocation.UNKNOWN;

  let status = ResourceSuspensionStatus.PENDING;
  let suspendedResult: T;
  let suspendedError: any;
  let suspended = Promise.resolve(promise).then(
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
