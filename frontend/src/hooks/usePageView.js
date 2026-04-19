import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function getSessionId() {
  const KEY = 'analytics_session_id';
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2));
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

export default function usePageView() {
  const location = useLocation();

  useEffect(() => {
    fetch('/api/public/analytics/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: location.pathname,
        sessionId: getSessionId(),
      }),
    }).catch(() => {});
  }, [location.pathname]);
}
