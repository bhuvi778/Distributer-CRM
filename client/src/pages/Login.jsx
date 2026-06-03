import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Layers, ArrowRight, ArrowLeft, ChevronRight } from 'lucide-react';
import { getDefaultPath } from '../config/roles';
import { PORTALS, getPortalById } from '../config/portals';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [step, setStep] = useState('portals'); // 'portals' | 'login'
  const [selectedPortalId, setSelectedPortalId] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });
  const { login, user, loading: authLoading, defaultPath } = useAuth();
  const navigate = useNavigate();

  const portal = getPortalById(selectedPortalId);
  const PortalIcon = portal?.icon;

  useEffect(() => {
    if (!authLoading && user) navigate(defaultPath, { replace: true });
  }, [authLoading, user, defaultPath, navigate]);

  const selectPortal = (portalId) => {
    const p = getPortalById(portalId);
    setSelectedPortalId(portalId);
    setForm({ email: '', password: '' });
    setError('');
    setStep('login');
  };

  const useDemoLogin = () => {
    if (!portal?.demo) return;
    setForm({ email: portal.demo.email, password: portal.demo.password });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userData = await login(form.email, form.password);
      if (portal && userData.role !== portal.role && userData.role !== 'admin' && userData.role !== 'super_admin') {
        setError(`Yeh account ${portal.label} ke liye nahi hai. Sahi portal select karein.`);
        setLoading(false);
        return;
      }
      navigate(getDefaultPath(userData));
    } catch (err) {
      const msg = err.response?.data?.message;
      if (!err.response) {
        setError('Server se connect nahi ho pa raha. Backend check karein (port 5010).');
      } else {
        setError(msg || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 1: Portal picker (SalesOn style) ── */
  if (step === 'portals') {
    return (
      <div className="min-h-screen bg-surface-100 flex flex-col">
        <header className="bg-white border-b border-surface-200 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1e88e5] rounded flex items-center justify-center">
              <Layers size={16} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-[#1e88e5] text-lg leading-none">DistriFlow</p>
              <p className="text-[11px] text-surface-500 mt-0.5">Sales & Distribution Management</p>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-3xl">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-surface-900">Select Your Portal</h1>
              <p className="text-sm text-surface-500 mt-2">Apna role choose karein — har portal alag dashboard aur modules dikhata hai</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PORTALS.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPortal(p.id)}
                    className="text-left p-4 bg-white border border-surface-200 rounded-lg hover:border-brand-600 hover:shadow-card-hover transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className={`w-10 h-10 ${p.accent} rounded-md flex items-center justify-center flex-shrink-0`}>
                        <Icon size={18} className="text-white" />
                      </div>
                      <ChevronRight size={16} className="text-surface-300 group-hover:text-brand-600 mt-1 transition-colors" />
                    </div>
                    <p className="font-semibold text-surface-900 mt-3 text-sm">{p.label}</p>
                    <p className="text-xs text-surface-500 mt-0.5">{p.tagline}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </main>

        <footer className="text-center py-4 text-xs text-surface-400 border-t border-surface-200 bg-white">
          © 2026 DistriFlow · GST-ready · Tally integration
        </footer>
      </div>
    );
  }

  /* ── Step 2: Portal-specific login ── */
  return (
    <div className="min-h-screen flex bg-surface-100">
      <div className={`hidden lg:flex lg:w-[440px] xl:w-[480px] ${portal?.accent || 'bg-brand-950'} flex-col justify-between p-10 flex-shrink-0`}>
        <div>
          <button
            type="button"
            onClick={() => { setStep('portals'); setError(''); }}
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-8 transition-colors"
          >
            <ArrowLeft size={16} /> Change portal
          </button>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-white/15 rounded-md flex items-center justify-center">
              {PortalIcon && <PortalIcon size={20} className="text-white" />}
            </div>
            <div>
              <p className="font-semibold text-white text-lg leading-none">{portal?.label}</p>
              <p className="text-[11px] text-white/60 mt-0.5 uppercase tracking-widest">{portal?.tagline}</p>
            </div>
          </div>

          <p className="text-white/80 text-sm leading-relaxed">{portal?.description}</p>

          <ul className="mt-8 space-y-3">
            {portal?.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-400 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/40">Demo: {portal?.demo.email}</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[380px]">
          <button
            type="button"
            onClick={() => { setStep('portals'); setError(''); }}
            className="lg:hidden flex items-center gap-1.5 text-surface-500 hover:text-surface-800 text-sm mb-6"
          >
            <ArrowLeft size={16} /> Change portal
          </button>

          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className={`w-8 h-8 ${portal?.accent} rounded-md flex items-center justify-center`}>
              {PortalIcon && <PortalIcon size={14} className="text-white" />}
            </div>
            <div>
              <p className="font-semibold text-surface-900 text-sm">{portal?.label}</p>
              <p className="text-xs text-surface-500">{portal?.tagline}</p>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-surface-900">Sign in</h2>
          <p className="text-sm text-surface-500 mt-1 mb-5">{portal?.label} credentials enter karein</p>

          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>
          )}

          <button
            type="button"
            onClick={useDemoLogin}
            className="mb-4 w-full py-2 text-sm font-medium text-brand-800 bg-brand-50 border border-brand-200 rounded-md hover:bg-brand-100 transition-colors"
          >
            Use Demo Login ({portal?.demo.name})
          </button>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field !pl-9"
                  placeholder={portal?.demo.email}
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field !pl-9 !pr-10"
                  required
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full !py-2.5">
              {loading ? 'Signing in...' : (
                <span className="flex items-center justify-center gap-2">Sign In to {portal?.label?.replace(' Portal', '')} <ArrowRight size={16} /></span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
