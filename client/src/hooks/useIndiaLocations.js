import { useEffect, useState } from 'react';
import api from '../api/axios';

const FALLBACK_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli', 'Daman and Diu', 'Delhi',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand',
  'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal',
];

let statesCache = null;
const citiesCache = new Map();

export default function useIndiaLocations(state) {
  const [states, setStates] = useState(statesCache || []);
  const [cities, setCities] = useState(state ? citiesCache.get(state) || [] : []);
  const [loadingStates, setLoadingStates] = useState(!statesCache);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    let alive = true;
    const loadStates = async () => {
      if (statesCache) {
        setStates(statesCache);
        setLoadingStates(false);
        return;
      }
      setLoadingStates(true);
      try {
        const { data } = await api.get('/locations/states');
        statesCache = data;
        if (alive) setStates(data);
      } catch {
        statesCache = FALLBACK_STATES;
        if (alive) setStates(FALLBACK_STATES);
      } finally {
        if (alive) setLoadingStates(false);
      }
    };
    loadStates();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    const loadCities = async () => {
      if (!state) {
        setCities([]);
        return;
      }
      if (citiesCache.has(state)) {
        setCities(citiesCache.get(state));
        return;
      }
      setLoadingCities(true);
      try {
        const { data } = await api.get('/locations/cities', { params: { state } });
        citiesCache.set(state, data);
        if (alive) setCities(data);
      } catch {
        if (alive) setCities([]);
      } finally {
        if (alive) setLoadingCities(false);
      }
    };
    loadCities();
    return () => { alive = false; };
  }, [state]);

  return { states, cities, loadingStates, loadingCities };
}
