import { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, MapPin, Users } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/common/Badge';
import { formatDateTime } from '../utils/helpers';

export default function Attendance() {
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const [records, setRecords] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/attendance');

      let filteredRecords = data;

      if (isAdmin && !isSuperAdmin) {
        const teamRes = await api.get('/employees');
        const teamIds = teamRes.data
          .filter((e) => e.createdBy === user._id || e._id === user._id)
          .map((e) => e._id);

        filteredRecords = data.filter((r) => {
          const userId = r.user?._id || r.user;
          return teamIds.includes(userId);
        });
      }

      setRecords(filteredRecords);
      const today = new Date().toISOString().split('T')[0];
      setTodayRecord(filteredRecords.find((r) => new Date(r.date).toISOString().split('T')[0] === today));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleCheckIn = async () => {
    await api.post('/attendance/check-in', {
      location: { lat: 28.6139, lng: 77.2090, address: 'Current Location' },
    });
    fetchData();
  };

  const handleCheckOut = async () => {
    await api.post('/attendance/check-out', {
      location: { lat: 28.6139, lng: 77.2090, address: 'Current Location' },
    });
    fetchData();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-surface-800/60 mt-1">Geo-tagged check-in/out with working hours tracking</p>
        </div>
        <div className="flex gap-3">
          {!todayRecord?.checkIn ? (
            <button onClick={handleCheckIn} className="btn-accent"><LogIn size={18} /> Check In</button>
          ) : !todayRecord?.checkOut ? (
            <button onClick={handleCheckOut} className="btn-primary"><LogOut size={18} /> Check Out</button>
          ) : (
            <span className="px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-medium">Day Complete ✓</span>
          )}
        </div>
      </div>

      {todayRecord && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="stat-card">
            <p className="text-sm text-surface-800/60">Check In</p>
            <p className="text-lg font-bold font-mono mt-1">{todayRecord.checkIn ? formatDateTime(todayRecord.checkIn) : '-'}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-surface-800/60">Check Out</p>
            <p className="text-lg font-bold font-mono mt-1">{todayRecord.checkOut ? formatDateTime(todayRecord.checkOut) : '-'}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-surface-800/60">Working Hours</p>
            <p className="text-lg font-bold font-mono mt-1">{todayRecord.workingHours || 0}h</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-surface-800/60">Overtime</p>
            <p className="text-lg font-bold font-mono mt-1 text-accent-600">{todayRecord.overtime || 0}h</p>
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-50/80">
            <tr>
              <th className="table-header w-12">#</th>
              <th className="table-header">Employee</th>
              <th className="table-header">Date</th>
              <th className="table-header">Check In</th>
              <th className="table-header">Check Out</th>
              <th className="table-header">Hours</th>
              <th className="table-header">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {records.map((r, idx) => (
              <tr key={r._id} className="hover:bg-surface-50/50">
                <td className="table-cell text-center text-surface-800/50">{idx + 1}</td>
                <td className="table-cell font-medium">{r.user?.name}</td>
                <td className="table-cell">{new Date(r.date).toLocaleDateString('en-IN')}</td>
                <td className="table-cell">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                <td className="table-cell">{r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                <td className="table-cell font-mono">{r.workingHours || 0}h</td>
                <td className="table-cell"><Badge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
