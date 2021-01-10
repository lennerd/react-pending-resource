import { useEffect, useState } from 'react';
import useResourceTracker from './useResourceTracker';

export default function useIsPending(): boolean {
  const resourceTracker = useResourceTracker();
  const [isPending, setIsPending] = useState(() => resourceTracker.isPending());

  useEffect(() => {
    const handleChange = (): void => {
      setIsPending(resourceTracker.isPending());
    };

    resourceTracker.subscribe(handleChange);

    return () => {
      resourceTracker.unsubscribe(handleChange);
    };
  }, [resourceTracker]);

  return isPending;
}
