import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function usePageView() {
  const location = useLocation();

  useEffect(() => {
    fetch('/api/public/analytics/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: location.pathname }),
    }).catch(() => {});
  }, [location.pathname]);
}
