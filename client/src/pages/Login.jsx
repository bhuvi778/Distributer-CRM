import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { getDefaultPath } from '../config/roles';
import { useAuth } from '../context/AuthContext';
import { DEMO_CREDENTIALS } from '../config/demoCredentials';

export default function Login() {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });
  const { login, user, loading: authLoading, defaultPath } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) navigate(defaultPath, { replace: true });
  }, [authLoading, user, defaultPath, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userData = await login(form.email, form.password);
      navigate(getDefaultPath(userData), { replace: true });
    } catch (err) {
      setError(!err.response ? 'Server se connect nahi ho pa raha. Backend check karein.' : err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const applyDemo = (demo) => {
    setForm({ email: demo.email, password: demo.password });
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#eef1f5] flex items-center justify-center px-5 py-8">
      <div className="grid w-full max-w-[980px] grid-cols-[1fr_360px] overflow-hidden rounded-[4px] bg-white shadow-[0_20px_55px_rgba(15,23,42,0.16)]">
        <section className="px-10 py-11">
          <div className="mb-10 flex items-center gap-3">
            <span className="so-logo-mark" aria-hidden="true" />
            <span className="text-[30px] font-semibold leading-none text-[#174bb8]">SalesOn</span>
          </div>

          <h1 className="text-[30px] font-semibold text-[#111827]">Sign in</h1>
          <p className="mt-2 text-[15px] text-[#667085]">Apni ID aur password daalein. Role credentials se automatically detect hoga.</p>

          {error && (
            <div className="mt-6 rounded-[3px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 max-w-[430px] space-y-5">
            <div>
              <label className="so-label">Email / User ID</label>
              <div className="relative">
                <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="so-input w-full !pl-10"
                  placeholder="Enter email"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <label className="so-label">Password</label>
              <div className="relative">
                <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  className="so-input w-full !pl-10 !pr-10"
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98a2b3]">
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="so-btn-primary h-11 w-full justify-center text-base">
              {loading ? 'Signing in...' : <span className="flex items-center justify-center gap-2">Login <ArrowRight size={17} /></span>}
            </button>
          </form>
        </section>

        <aside className="border-l border-[#e3e8ef] bg-[#f8fafc] px-5 py-7">
          <h2 className="text-[18px] font-semibold text-[#111827]">Demo Credentials</h2>
          <div className="mt-5 space-y-3">
            {DEMO_CREDENTIALS.map((demo) => (
              <button
                key={demo.role}
                type="button"
                onClick={() => applyDemo(demo)}
                className="w-full rounded-[3px] border border-[#d7dce5] bg-white px-3 py-3 text-left hover:border-[#174bb8] hover:bg-[#f2f6ff]"
              >
                <div className="text-[14px] font-semibold text-[#174bb8]">{demo.role}</div>
                <div className="mt-1 text-[12px] text-[#475467]">{demo.email}</div>
                <div className="text-[12px] text-[#98a2b3]">{demo.password}</div>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
