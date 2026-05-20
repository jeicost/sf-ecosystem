/**
 * Hook that loads GuideConfig from:
 * 1. URL param  ?guide=<uuid>  → fetches from API
 * 2. window.GUIDE_CONFIG       → injected by web export
 * 3. Falls back to sampleConfig
 */
import { useState, useEffect } from 'react';
import { sampleConfig } from '../data/guide-config.sample';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

export function useGuideConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    async function load() {
      // 1. Check for injected config (web export mode)
      if (window.GUIDE_CONFIG) {
        setConfig(window.GUIDE_CONFIG);
        setLoading(false);
        return;
      }

      // 2. Check URL param ?guide=<uuid>
      const params = new URLSearchParams(window.location.search);
      const guideId = params.get('guide');
      if (guideId) {
        try {
          const res = await fetch(`${API_BASE}/v2/guides/${guideId}/export/config`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          setConfig(data);
          setLoading(false);
          return;
        } catch (e) {
          setError(`Could not load guide ${guideId}: ${e.message}`);
        }
      }

      // 3. Fallback to sample
      setConfig(sampleConfig);
      setLoading(false);
    }
    load();
  }, []);

  return { config, loading, error };
}
