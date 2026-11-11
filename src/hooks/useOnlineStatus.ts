import { useEffect, useState } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    const handleToggleSimulated = (e: any) => {
      setIsSimulatedOffline(e.detail?.simulate ?? !isSimulatedOffline);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('sm_toggle_offline_mode', handleToggleSimulated);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sm_toggle_offline_mode', handleToggleSimulated);
    };
  }, [isSimulatedOffline]);

  return isSimulatedOffline ? false : isOnline;
}
