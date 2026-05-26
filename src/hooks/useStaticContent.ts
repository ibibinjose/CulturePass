import { useState, useEffect } from 'react';

const CONTENT_MAP: Record<string, any> = {
  'terms': require('@/data/static/terms.json'),
  'privacy': require('@/data/static/privacy.json'),
  'cookies': require('@/data/static/cookies.json'),
  'about': require('@/data/static/about.json'),
  'company-info': require('@/data/static/company-info.json'),
  'help': require('@/data/static/help.json'),
};

export function useStaticContent<T>(pageKey: string) {
  const [data, setData] = useState<T | null>(CONTENT_MAP[pageKey] || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // In a real app, this would fetch from a CMS or API
  /*
  useEffect(() => {
    setLoading(true);
    fetch(`/api/static/${pageKey}`)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [pageKey]);
  */

  return { data, loading, error };
}
