import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Edit2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const pad = (value) => String(value).padStart(2, '0');

const toInputDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const formatDisplayDate = (dateValue) => {
  if (!dateValue) return '';
  const [year, month, day] = dateValue.split('-');
  return `${day}/${month}/${year}`;
};

const recordDateKey = (dateValue) => toInputDate(dateValue);

const formatTime = (dateValue) => {
  if (!dateValue) return '';
  return new Date(dateValue).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

function StatCard({ value, label, active }) {
  return (
    <div className={`h-[146px] rounded-[8px] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.14)] flex flex-col items-center justify-center relative overflow-hidden ${active ? 'after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[8px] after:bg-[#174bb8]' : ''}`}>
      <div className="text-[40px] leading-none font-semibold text-[#3e4147]">{value}</div>
      <div className={`mt-4 text-base ${active ? 'font-semibold text-[#0f43c6]' : 'text-[#687083]'}`}>{label}</div>
    </div>
  );
}

export default function Attendance() {
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(toInputDate(new Date()));
  const [officeTime, setOfficeTime] = useState(() => localStorage.getItem('attendanceOfficeTime') || '09:00 - 17:00');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [{ data: attendanceData }, employeeRes] = await Promise.all([
          api.get('/attendance'),
          api.get('/employees').catch(() => ({ data: [] })),
        ]);

        let filteredRecords = Array.isArray(attendanceData) ? attendanceData : [];
        const employeeData = Array.isArray(employeeRes.data) ? employeeRes.data : [];

        if (isAdmin && !isSuperAdmin) {
          const teamIds = employeeData
            .filter((employee) => employee.createdBy === user?._id || employee._id === user?._id)
            .map((employee) => employee._id);

          filteredRecords = filteredRecords.filter((record) => {
            const userId = record.user?._id || record.user;
            return teamIds.includes(userId);
          });
        }

        if (mounted) {
          setRecords(filteredRecords);
          setEmployees(employeeData);
        }
      } catch (error) {
        console.error(error);
        if (mounted) {
          setRecords([]);
          setEmployees([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [user?._id, isAdmin, isSuperAdmin]);

  const selectedRecords = useMemo(
    () => records.filter((record) => record.date && recordDateKey(record.date) === selectedDate),
    [records, selectedDate],
  );

  const rows = useMemo(() => (
    selectedRecords.map((record) => ({
      id: record._id,
      name: record.user?.name || record.user?.fullName || '-',
      in: formatTime(record.checkIn),
      out: formatTime(record.checkOut),
      workingHours: record.workingHours ? `${record.workingHours} hrs` : '',
      odoIn: record.odoIn || '',
      odoOut: record.odoOut || '',
      odoDistance: record.odoDistance || '',
      images: record.images?.length ? `${record.images.length}` : '',
      comment: record.notes || record.comment || '',
      status: record.status,
      checkIn: record.checkIn,
    }))
  ), [selectedRecords]);

  const stats = useMemo(() => {
    const activeUsers = employees.length || new Set(records.map((record) => record.user?._id || record.user).filter(Boolean)).size || 0;
    const present = selectedRecords.filter((record) => record.checkIn || record.status === 'present').length;
    const explicitAbsent = selectedRecords.filter((record) => record.status === 'absent').length;
    const absent = activeUsers ? Math.max(activeUsers - present, explicitAbsent) : explicitAbsent;
    const late = selectedRecords.filter((record) => record.status === 'late').length;
    const partial = selectedRecords.filter((record) => record.status === 'half_day' || (record.workingHours > 0 && record.workingHours < 8)).length;

    return { present, absent, late, partial, active: activeUsers };
  }, [employees.length, records, selectedRecords]);

  const editOfficeTime = () => {
    const next = window.prompt('Office Time', officeTime);
    if (next === null) return;
    const cleaned = next.trim();
    if (!cleaned) return;
    localStorage.setItem('attendanceOfficeTime', cleaned);
    setOfficeTime(cleaned);
  };

  return (
    <div className="so-module-page">
      <div className="so-titlebar">
        <div className="flex items-center gap-3">
          <h1 className="so-title">Attendance</h1>
          <span className="h-[26px] px-3 rounded-[2px] border border-[#ffb75d] bg-[#fff7ed] text-[#f97316] text-sm inline-flex items-center">
            Office Time : {officeTime}
          </span>
          <button type="button" onClick={editOfficeTime} className="h-8 w-8 inline-flex items-center justify-center text-[#0b7cff] hover:bg-[#eef4ff] rounded-[3px]">
            <Edit2 size={17} />
          </button>
        </div>

        <label className="relative h-[38px] w-[200px]">
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="so-input h-full w-full pr-10 text-base"
            aria-label="Select attendance date"
          />
          <CalendarDays size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#b6bcc6]" />
        </label>
      </div>

      <div className="px-4 md:px-9 py-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 2xl:gap-[76px] mb-5">
          <StatCard value={stats.present} label="Present" active />
          <StatCard value={stats.absent} label="Absent" />
          <StatCard value={stats.late} label="Late Check In" />
          <StatCard value={stats.partial} label="Partial Working hr" />
          <StatCard value={stats.active} label="Active" />
        </div>
      </div>

      <div className="so-table-panel !mt-0 min-h-[540px]">
        <table className="so-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>In</th>
              <th>Out</th>
              <th>Working hrs</th>
              <th>Odo In</th>
              <th>Odo Out</th>
              <th>Odo Distance</th>
              <th>Images</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9}>
                  <div className="so-empty so-empty-small min-h-[205px]">Loading...</div>
                </td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={9}>
                  <div className="so-empty so-empty-small min-h-[205px]">
                    <svg className="so-box-empty-icon" viewBox="0 0 64 48" fill="none" aria-hidden="true">
                      <path d="M15 17L24 7H40L49 17V38H15V17Z" stroke="currentColor" strokeWidth="1.7" />
                      <path d="M15 17H27L30 22H35L38 17H49" stroke="currentColor" strokeWidth="1.7" />
                      <ellipse cx="32" cy="41" rx="23" ry="4" fill="currentColor" opacity="0.18" />
                    </svg>
                    <span>No Data</span>
                  </div>
                </td>
              </tr>
            )}

            {!loading && rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.in}</td>
                <td>{row.out}</td>
                <td>{row.workingHours}</td>
                <td>{row.odoIn}</td>
                <td>{row.odoOut}</td>
                <td>{row.odoDistance}</td>
                <td>{row.images}</td>
                <td>{row.comment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <span className="sr-only">Selected date {formatDisplayDate(selectedDate)}</span>
    </div>
  );
}
