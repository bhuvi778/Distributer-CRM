import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDays, Camera, Edit2, Gauge, MapPin, X,
} from 'lucide-react';
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

const FIELD_ROLES = ['sales_executive', 'sales_rep'];

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  if (!file) {
    resolve('');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

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
  const isFieldUser = FIELD_ROLES.includes(user?.role);
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(toInputDate(new Date()));
  const [officeTime, setOfficeTime] = useState(() => localStorage.getItem('attendanceOfficeTime') || '09:00 - 17:00');
  const [loading, setLoading] = useState(true);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInForm, setCheckInForm] = useState({
    selfie: '',
    selfieName: '',
    odoIn: '',
    odoInImage: '',
    odoInImageName: '',
    location: null,
  });
  const selfieInputRef = useRef(null);
  const odoInputRef = useRef(null);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const [{ data: attendanceData }, employeeRes] = await Promise.all([
        api.get('/attendance'),
        api.get('/employees').catch(() => ({ data: [] })),
      ]);

      let filteredRecords = Array.isArray(attendanceData) ? attendanceData : [];
      let employeeData = Array.isArray(employeeRes.data) ? employeeRes.data : [];

      if (isFieldUser) {
        filteredRecords = filteredRecords.filter((record) => String(record.user?._id || record.user) === String(user?._id));
        employeeData = employeeData.filter((employee) => String(employee._id) === String(user?._id));
      } else if (isAdmin && !isSuperAdmin) {
        const teamIds = employeeData
          .filter((employee) => employee.createdBy === user?._id || employee._id === user?._id)
          .map((employee) => employee._id);

        filteredRecords = filteredRecords.filter((record) => {
          const userId = record.user?._id || record.user;
          return teamIds.includes(userId);
        });
      }

      setRecords(filteredRecords);
      setEmployees(employeeData.length ? employeeData : (isFieldUser && user ? [user] : []));
    } catch (error) {
      console.error(error);
      setRecords([]);
      setEmployees(isFieldUser && user ? [user] : []);
    } finally {
      setLoading(false);
    }
  };

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
        let employeeData = Array.isArray(employeeRes.data) ? employeeRes.data : [];

        if (isFieldUser) {
          filteredRecords = filteredRecords.filter((record) => String(record.user?._id || record.user) === String(user?._id));
          employeeData = employeeData.filter((employee) => String(employee._id) === String(user?._id));
        } else if (isAdmin && !isSuperAdmin) {
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
          setEmployees(employeeData.length ? employeeData : (isFieldUser && user ? [user] : []));
        }
      } catch (error) {
        console.error(error);
        if (mounted) {
          setRecords([]);
          setEmployees(isFieldUser && user ? [user] : []);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [user, user?._id, isAdmin, isSuperAdmin, isFieldUser]);

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

  const todayRecord = selectedRecords.find((record) => String(record.user?._id || record.user) === String(user?._id));

  const captureLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCheckInForm((prev) => ({
          ...prev,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: 'Current location',
          },
        }));
      },
      () => {
        setCheckInForm((prev) => ({ ...prev, location: { address: 'Location permission not available' } }));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const openCheckIn = () => {
    setCheckInForm({
      selfie: '',
      selfieName: '',
      odoIn: '',
      odoInImage: '',
      odoInImageName: '',
      location: null,
    });
    setCheckInOpen(true);
    captureLocation();
  };

  const pickImage = async (event, key, nameKey) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setCheckInForm((prev) => ({ ...prev, [key]: dataUrl, [nameKey]: file.name }));
    event.target.value = '';
  };

  const saveCheckIn = async () => {
    if (!checkInForm.selfie) {
      alert('Selfie upload required');
      return;
    }
    setCheckingIn(true);
    try {
      await api.post('/attendance/check-in', {
        location: checkInForm.location,
        selfie: checkInForm.selfie,
        odoIn: checkInForm.odoIn,
        odoInImage: checkInForm.odoInImage,
      });
      setCheckInOpen(false);
      await loadAttendance();
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to check in');
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <div className="so-module-page">
      <div className="so-titlebar">
        <div className="flex items-center gap-3">
          <h1 className="so-title">Attendance</h1>
          <span className="h-[26px] px-3 rounded-[2px] border border-[#ffb75d] bg-[#fff7ed] text-[#f97316] text-sm inline-flex items-center">
            Office Time : {officeTime}
          </span>
          {!isFieldUser && (
            <button type="button" onClick={editOfficeTime} className="h-8 w-8 inline-flex items-center justify-center text-[#0b7cff] hover:bg-[#eef4ff] rounded-[3px]">
              <Edit2 size={17} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isFieldUser && (
            <button
              type="button"
              onClick={openCheckIn}
              disabled={!!todayRecord?.checkIn || selectedDate !== toInputDate(new Date())}
              className="so-btn-primary text-sm disabled:opacity-50"
            >
              {todayRecord?.checkIn ? 'Checked In' : 'Check In'}
            </button>
          )}
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

      {checkInOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/45" onClick={() => setCheckInOpen(false)} />
          <div className="relative w-[min(620px,calc(100vw-28px))] rounded-[3px] border border-[#d7dce5] bg-white shadow-2xl">
            <div className="flex h-[68px] items-center justify-between border-b border-[#eceff4] px-6">
              <h2 className="text-xl font-semibold text-[#202733]">Check In</h2>
              <button type="button" onClick={() => setCheckInOpen(false)} className="text-[#777] hover:text-[#111]">
                <X size={22} />
              </button>
            </div>
            <div className="space-y-5 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[3px] border border-[#d7dce5] p-4">
                  <div className="mb-2 flex items-center gap-2 text-[15px] font-medium text-slate-900">
                    <CalendarDays size={16} /> Current time
                  </div>
                  <div className="text-[15px] text-slate-700">{new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                </div>
                <div className="rounded-[3px] border border-[#d7dce5] p-4">
                  <div className="mb-2 flex items-center gap-2 text-[15px] font-medium text-slate-900">
                    <MapPin size={16} /> Location
                  </div>
                  <div className="text-[13px] text-slate-600">
                    {checkInForm.location?.lat
                      ? `${checkInForm.location.lat.toFixed(5)}, ${checkInForm.location.lng.toFixed(5)}`
                      : checkInForm.location?.address || 'Capturing location...'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="so-label">Selfie*</label>
                  <input ref={selfieInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(event) => pickImage(event, 'selfie', 'selfieName')} />
                  <button type="button" onClick={() => selfieInputRef.current?.click()} className="so-upload-box h-[105px] w-full">
                    <Camera size={22} />
                    <span>{checkInForm.selfieName || 'Upload selfie'}</span>
                  </button>
                </div>
                <div>
                  <label className="so-label">Odometer / Meter</label>
                  <input
                    className="so-input w-full"
                    value={checkInForm.odoIn}
                    onChange={(event) => setCheckInForm((prev) => ({ ...prev, odoIn: event.target.value }))}
                    placeholder="Enter meter reading"
                  />
                  <input ref={odoInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => pickImage(event, 'odoInImage', 'odoInImageName')} />
                  <button type="button" onClick={() => odoInputRef.current?.click()} className="mt-3 flex h-10 items-center gap-2 border border-dashed border-[#cfd6df] px-3 text-sm text-[#174bb8]">
                    <Gauge size={16} />
                    {checkInForm.odoInImageName || 'Upload meter photo'}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex h-[62px] items-center justify-end gap-2 border-t border-[#d7dce5] bg-[#fafafa] px-5">
              <button type="button" onClick={() => setCheckInOpen(false)} className="h-[37px] min-w-[92px] rounded-[3px] border border-[#667085] bg-white text-[#667085] text-base">Cancel</button>
              <button type="button" onClick={saveCheckIn} disabled={checkingIn} className="h-[37px] min-w-[82px] rounded-[3px] bg-[#174bb8] text-white text-base font-semibold disabled:opacity-60">
                {checkingIn ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <span className="sr-only">Selected date {formatDisplayDate(selectedDate)}</span>
    </div>
  );
}
