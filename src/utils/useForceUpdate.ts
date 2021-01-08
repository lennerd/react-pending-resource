import { useCallback, useState } from 'react';

export default function useForceUpdate(): () => void {
  const [, setUpdate] = useState(() => Object.create(null));

  return useCallback(() => {
    setUpdate(Object.create(null));
  }, []);
}
