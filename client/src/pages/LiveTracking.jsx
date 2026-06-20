import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, FileText, Map, MapPin, Navigation, Plus, RefreshCw, Satellite, ShoppingCart, Users } from 'lucide-react';
import api from '../api/axios';
import { formatDateTime } from '../utils/helpers';

const statusMeta = {
  live: { label: 'Live', dot: 'bg-green-500', text: 'text-green-700', bg: '#43a047' },
  active: { label: 'Active', dot: 'bg-blue-500', text: 'text-blue-700', bg: '#1e88e5' },
  offline: { label: 'Offline', dot: 'bg-gray-400', text: 'text-gray-600', bg: '#757575' },
};

function Stat({ label, value, color }) {
  return (
    <div className="bg-white border border-[#e0e0e0] rounded-lg p-4">
      <p className="text-xs text-[#757575]">{label}</p>
      <p className="text-2xl font-bold text-[#333] mt-1">{value}</p>
      <div className="h-1 rounded mt-3" style={{ background: color }} />
    </div>
  );
}

export default function LiveTracking() {
  const [reps, setReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapView, setMapView] = useState('map');

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tracking/live');
      setReps(Array.isArray(data) ? data : []);
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

  const stats = useMemo(() => ({
    live: reps.filter((r) => r.trackingStatus === 'live').length,
    active: reps.filter((r) => r.trackingStatus === 'active').length,
    offline: reps.filter((r) => r.trackingStatus === 'offline').length,
  }), [reps]);

  const firstLocation = reps.find((r) => r.lastLocation)?.lastLocation;
  const lat = firstLocation?.lat || 28.6139;
  const lng = firstLocation?.lng || 77.2090;
  const mapSrc = mapView === 'satellite'
    ? `https://maps.google.com/maps?q=${lat},${lng}&z=11&t=k&output=embed`
    : `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.15},${lat - 0.1},${lng + 0.15},${lat + 0.1}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-base font-semibold text-[#333]">Live Location Tracking</h1>
          <p className="text-xs text-[#757575] mt-0.5">Real-time field team location, status and quick actions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-white border border-[#e0e0e0] rounded overflow-hidden">
            <button onClick={() => setMapView('map')} className={`px-3 py-2 text-xs flex items-center gap-1 ${mapView === 'map' ? 'bg-[#e3f2fd] text-[#1e88e5]' : 'text-[#757575]'}`}>
              <Map size={13} /> Map
            </button>
            <button onClick={() => setMapView('satellite')} className={`px-3 py-2 text-xs flex items-center gap-1 border-l border-[#e0e0e0] ${mapView === 'satellite' ? 'bg-[#e3f2fd] text-[#1e88e5]' : 'text-[#757575]'}`}>
              <Satellite size={13} /> Satellite
            </button>
          </div>
          <button onClick={fetchLocations} className="so-btn-secondary flex items-center gap-1.5 text-xs">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Stat label="People Live" value={stats.live} color="#43a047" />
        <Stat label="People Active" value={stats.active} color="#1e88e5" />
        <Stat label="People Offline" value={stats.offline} color="#757575" />
      </div>

      <div className="bg-white border border-[#e0e0e0] rounded-lg p-3 mb-4">
        <p className="text-xs font-semibold text-[#555] mb-2">Quick Create</p>
        <div className="flex flex-wrap gap-2">
          <Link to="/app/sales/orders" className="so-btn-primary flex items-center gap-1.5 text-xs"><ShoppingCart size={13} /> Sales Order</Link>
          <Link to="/app/sales/invoices" className="so-btn-secondary flex items-center gap-1.5 text-xs"><FileText size={13} /> Invoice</Link>
          <Link to="/app/parties/customers" className="so-btn-secondary flex items-center gap-1.5 text-xs"><Plus size={13} /> Customer</Link>
          <Link to="/app/reports" className="so-btn-secondary flex items-center gap-1.5 text-xs"><BarChart3 size={13} /> Report</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-[#e0e0e0] rounded-lg overflow-hidden">
          <div className="relative h-[520px] bg-[#f5f7fa]">
            <iframe
              title="Live Map"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              src={mapSrc}
            />
            {reps.map((rep, i) => rep.lastLocation && (
              <a
                key={rep._id}
                href={`https://www.google.com/maps/dir/?api=1&destination=${rep.lastLocation.lat},${rep.lastLocation.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute"
                style={{ top: `${18 + (i % 5) * 13}%`, left: `${24 + (i % 4) * 17}%` }}
              >
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-lg border border-[#1e88e5] text-xs font-medium hover:scale-105 transition-transform">
                  <MapPin size={14} className={statusMeta[rep.trackingStatus]?.text || 'text-[#1e88e5]'} />
                  {rep.name}
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#e0e0e0] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-[#1e88e5]" />
            <h3 className="font-semibold text-sm">Team Location ({reps.length})</h3>
          </div>
          <div className="space-y-3 max-h-[480px] overflow-y-auto">
            {reps.length === 0 ? (
              <p className="text-sm text-[#9e9e9e] text-center py-8">No reps found</p>
            ) : reps.map((rep) => {
              const meta = statusMeta[rep.trackingStatus] || statusMeta.offline;
              return (
                <div key={rep._id} className="p-3 bg-[#f8f9fa] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm text-[#333]">{rep.name}</p>
                    <span className={`text-xs font-medium ${meta.text} flex items-center gap-1`}>
                      <span className={`w-2 h-2 rounded-full ${meta.dot} ${rep.trackingStatus === 'live' ? 'animate-pulse' : ''}`} />
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#757575]">{rep.territory || rep.email}</p>
                  {rep.lastLocation ? (
                    <>
                      <p className="text-xs text-[#9e9e9e] mt-1 font-mono">
                        {rep.lastLocation.lat?.toFixed(4)}, {rep.lastLocation.lng?.toFixed(4)}
                      </p>
                      <p className="text-xs text-[#9e9e9e]">Updated: {formatDateTime(rep.lastLocation.updatedAt)}</p>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${rep.lastLocation.lat},${rep.lastLocation.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-[#1e88e5] hover:underline"
                      >
                        <Navigation size={12} /> Navigate
                      </a>
                    </>
                  ) : (
                    <p className="text-xs text-[#9e9e9e] mt-1">No location shared yet</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
