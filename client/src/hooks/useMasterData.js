import { useState, useEffect } from 'react';
import api from '../api/axios';

let cache = null;
let cacheTime = 0;

export default function useMasterData() {
  const [data, setData] = useState(cache || { outlets: [], products: [], users: [], routes: [], invoices: [] });
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    const load = async () => {
      if (cache && Date.now() - cacheTime < 60000) {
        setData(cache);
        setLoading(false);
        return;
      }
      try {
        const { data: res } = await api.get('/master-data');
        cache = res;
        cacheTime = Date.now();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const refresh = async () => {
    cache = null;
    setLoading(true);
    const { data: res } = await api.get('/master-data');
    cache = res;
    cacheTime = Date.now();
    setData(res);
    setLoading(false);
    return res;
  };

  return { ...data, loading, refresh };
}

export function invalidateMasterData() {
  cache = null;
}
