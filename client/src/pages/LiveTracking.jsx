import { useState, useEffect } from 'react';
import { MapPin, Navigation, RefreshCw, Users } from 'lucide-react';
import api from '../api/axios';
import { formatDateTime } from '../utils/helpers';

export default function LiveTracking() {
  const [reps, setReps] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tracking/live');
      setReps(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Live Location Tracking</h1>
          <p className="text-surface-800/60 mt-1">Real-time field team location on Google Maps</p>
        </div>
        <button onClick={fetchLocations} className="btn-secondary">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="relative h-[500px] bg-gradient-to-br from-brand-50 to-accent-50">
            <iframe
              title="Live Map"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${(reps[0]?.lastLocation?.lng || 77.1) - 0.15},${(reps[0]?.lastLocation?.lat || 28.5) - 0.1},${(reps[0]?.lastLocation?.lng || 77.3) + 0.15},${(reps[0]?.lastLocation?.lat || 28.7) + 0.1}&layer=mapnik&marker=${reps[0]?.lastLocation?.lat || 28.6139}%2C${reps[0]?.lastLocation?.lng || 77.2090}`}
            />
            {reps.map((rep, i) => rep.lastLocation && (
              <a
                key={rep._id}
                href={`https://www.google.com/maps/dir/?api=1&destination=${rep.lastLocation.lat},${rep.lastLocation.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute"
                style={{
                  top: `${20 + i * 15}%`,
                  left: `${30 + i * 20}%`,
                }}
              >
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-lg border-2 border-brand-500 text-xs font-medium hover:scale-105 transition-transform">
                  <MapPin size={14} className="text-brand-600" />
                  {rep.name}
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} className="text-brand-500" />
              <h3 className="font-semibold">Active Sales Reps ({reps.length})</h3>
            </div>
            <div className="space-y-3 max-h-[440px] overflow-y-auto">
              {reps.length === 0 ? (
                <p className="text-sm text-surface-800/40 text-center py-8">No active reps with location</p>
              ) : reps.map((rep) => (
                <div key={rep._id} className="p-3 bg-surface-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">{rep.name}</p>
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  </div>
                  <p className="text-xs text-surface-800/50">{rep.territory || rep.email}</p>
                  {rep.lastLocation && (
                    <>
                      <p className="text-xs text-surface-800/40 mt-1 font-mono">
                        {rep.lastLocation.lat?.toFixed(4)}, {rep.lastLocation.lng?.toFixed(4)}
                      </p>
                      <p className="text-xs text-surface-800/40">
                        Updated: {formatDateTime(rep.lastLocation.updatedAt)}
                      </p>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${rep.lastLocation.lat},${rep.lastLocation.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-brand-600 hover:underline"
                      >
                        <Navigation size={12} /> Navigate
                      </a>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
