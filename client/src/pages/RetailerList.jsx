import { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, MapPin, Phone, Filter, Calendar } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/common/Badge';
import { formatDate } from '../utils/helpers';

export default function RetailerList() {
  const { user } = useAuth();
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [visitLog, setVisitLog] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/outlets');
      setOutlets(data);
      const logRes = await api.get(`/attendance/visit-log?userId=${user._id}`);
      setVisitLog(logRes.data || {});
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const today = new Date().toISOString().split('T')[0];

  const myOutlets = outlets.filter((o) => {
    const assignedTo = o.assignedTo?._id || o.assignedTo;
    return assignedTo === user._id || !assignedTo;
  });

  const filteredOutlets = myOutlets.filter((o) => {
    const matchesSearch = o.name?.toLowerCase().includes(search.toLowerCase()) ||
                          o.code?.toLowerCase().includes(search.toLowerCase()) ||
                          o.phone?.includes(search);
    const isVisitedToday = visitLog[today]?.includes(o._id);
    if (filterStatus === 'visited') return matchesSearch && isVisitedToday;
    if (filterStatus === 'pending') return matchesSearch && !isVisitedToday;
    return matchesSearch;
  });

  const visitedToday = filteredOutlets.filter((o) => visitLog[today]?.includes(o._id)).length;
  const pendingToday = filteredOutlets.length - visitedToday;

  const markVisited = async (outletId) => {
    try {
      await api.post('/attendance/mark-visit', {
        outletId,
        date: today,
      });
      setVisitLog((prev) => ({
        ...prev,
        [today]: [...(prev[today] || []), outletId],
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Error marking visit');
    }
  };

  const unmarkVisited = async (outletId) => {
    try {
      await api.delete(`/attendance/mark-visit/${outletId}`, {
        data: { date: today },
      });
      setVisitLog((prev) => ({
        ...prev,
        [today]: (prev[today] || []).filter((id) => id !== outletId),
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Error unmarking visit');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Retailer List</h1>
          <p className="text-surface-800/60 mt-1">Mark attendance for your assigned retailers</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
            <CheckCircle size={18} className="text-green-500" />
            <div>
              <p className="text-xs text-green-600 font-medium">Visited Today</p>
              <p className="text-lg font-bold text-green-700">{visitedToday}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-xl">
            <XCircle size={18} className="text-yellow-500" />
            <div>
              <p className="text-xs text-yellow-600 font-medium">Pending</p>
              <p className="text-lg font-bold text-yellow-700">{pendingToday}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-surface-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-800/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, code, or phone..."
              className="input-field !pl-9 !py-2"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filterStatus === 'all'
                  ? 'bg-brand-100 text-brand-700 font-medium'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              All ({myOutlets.length})
            </button>
            <button
              onClick={() => setFilterStatus('visited')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
                filterStatus === 'visited'
                  ? 'bg-green-100 text-green-700 font-medium'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              <CheckCircle size={14} /> Visited ({visitedToday})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
                filterStatus === 'pending'
                  ? 'bg-yellow-100 text-yellow-700 font-medium'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              <XCircle size={14} /> Pending ({pendingToday})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50/80">
              <tr>
                <th className="table-header">Retailer</th>
                <th className="table-header">Code</th>
                <th className="table-header">City</th>
                <th className="table-header">Phone</th>
                <th className="table-header">Outstanding</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="table-cell text-center py-8 text-surface-800/40">Loading...</td>
                </tr>
              ) : filteredOutlets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-cell text-center py-8 text-surface-800/40">
                    {filterStatus === 'visited' ? 'No retailers visited today' :
                     filterStatus === 'pending' ? 'All retailers visited! 🎉' :
                     'No retailers assigned to you'}
                  </td>
                </tr>
              ) : (
                filteredOutlets.map((outlet) => {
                  const isVisited = visitLog[today]?.includes(outlet._id);
                  return (
                    <tr key={outlet._id} className={`hover:bg-surface-50/50 ${isVisited ? 'bg-green-50/30' : ''}`}>
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${isVisited ? 'bg-green-500' : 'bg-yellow-400'}`} />
                          <div>
                            <p className="font-medium">{outlet.name}</p>
                            {outlet.address?.city && (
                              <p className="text-xs text-surface-800/50 flex items-center gap-1 mt-0.5">
                                <MapPin size={10} /> {outlet.address.city}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell text-surface-800/60 font-mono text-sm">{outlet.code || '-'}</td>
                      <td className="table-cell text-surface-800/60">{outlet.address?.city || '-'}</td>
                      <td className="table-cell">
                        {outlet.phone && (
                          <a href={`tel:${outlet.phone}`} className="text-brand-600 hover:underline flex items-center gap-1">
                            <Phone size={12} /> {outlet.phone}
                          </a>
                        )}
                      </td>
                      <td className="table-cell">
                        {(outlet.outstandingBalance || 0) > 0 ? (
                          <span className="text-red-600 font-medium">{outlet.outstandingBalance?.toLocaleString('en-IN')}</span>
                        ) : (
                          <span className="text-green-600">-</span>
                        )}
                      </td>
                      <td className="table-cell">
                        {isVisited ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <CheckCircle size={12} /> Visited
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            <XCircle size={12} /> Pending
                          </span>
                        )}
                      </td>
                      <td className="table-cell">
                        {isVisited ? (
                          <button
                            onClick={() => unmarkVisited(outlet._id)}
                            className="btn-secondary !py-1.5 !px-3 text-xs"
                          >
                            <XCircle size={14} /> Undo
                          </button>
                        ) : (
                          <button
                            onClick={() => markVisited(outlet._id)}
                            className="btn-accent !py-1.5 !px-3 text-xs"
                          >
                            <CheckCircle size={14} /> Mark Visited
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}