import { Link } from 'react-router-dom';
import {
  ArrowRight, ShoppingCart, FileText, CreditCard,
  Users, Route, Truck, Target, Factory, BarChart3, Clock, Map, Layers,
  CheckCircle, Shield, Settings, RefreshCw, HeadphonesIcon, Building2,
} from 'lucide-react';

const features = [
  { icon: FileText, title: 'GST Invoicing', desc: 'Automatic invoices, delivery challans, A4/A5/thermal printing. Tally & WhatsApp integrated.' },
  { icon: Map, title: 'Live Tracking', desc: 'Real-time field team location on Google Maps with route-wise distance tracking.' },
  { icon: Clock, title: 'Attendance', desc: 'Geo-tagged check-in/out, overtime tracking and attendance analytics.' },
  { icon: Truck, title: 'Van Sales', desc: 'Van inventory, load in/out, thermal printing and end-of-day summary.' },
  { icon: Users, title: 'Distribution', desc: 'Secondary sales visibility, master data control and rep performance.' },
  { icon: CreditCard, title: 'Payment Collection', desc: 'Partial/full payments on the go with outlet-wise outstanding summary.' },
  { icon: Target, title: 'Target Meter', desc: 'KPI breakdown, leaderboards and team incentive tracking.' },
  { icon: ShoppingCart, title: 'Sales Orders', desc: 'Digital catalog, customer-wise pricing, discounts and stock validation.' },
  { icon: Factory, title: 'Production', desc: 'Multilevel BOM, work orders and production cost tracking.' },
];

const stats = [
  { value: '500+', label: 'Businesses' },
  { value: '50K+', label: 'Orders / Month' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-surface-800">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-sm border-b border-surface-200">
        <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-900 rounded-md flex items-center justify-center">
              <Layers size={16} className="text-white" />
            </div>
            <span className="font-semibold text-surface-900">DistriFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-surface-600 hover:text-surface-900 font-medium px-3 py-2">
              Sign In
            </Link>
            <Link to="/login" className="btn-primary !py-2 !text-sm">
              Start Free Trial <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-50 border border-accent-200 rounded-full text-xs font-medium text-accent-700 mb-6">
                <CheckCircle size={13} />
                GST-ready · Tally integrated · Made for Indian SMEs
              </div>
              <h1 className="text-4xl md:text-5xl font-semibold text-surface-900 leading-tight tracking-tight">
                Sales & Distribution management, simplified
              </h1>
              <p className="text-lg text-surface-500 mt-4 leading-relaxed">
                Routewise orders, payment collection on the go, real-time field tracking,
                GST invoices, inventory and reports — all in one platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Link to="/login" className="btn-primary !px-6 !py-2.5">
                  Start 7-Day Free Trial <ArrowRight size={16} />
                </Link>
                <a href="#features" className="btn-secondary !px-6 !py-2.5">
                  View Features
                </a>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 pt-8 border-t border-surface-200">
                {stats.map((s) => (
                  <div key={s.label}>
                    <p className="text-xl font-semibold text-surface-900 font-mono">{s.value}</p>
                    <p className="text-xs text-surface-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dashboard preview mockup */}
            <div className="hidden lg:block">
              <div className="bg-surface-100 border border-surface-200 rounded-lg p-1 shadow-card-hover">
                <div className="bg-white rounded-md overflow-hidden border border-surface-200">
                  <div className="h-8 bg-brand-900 flex items-center px-3 gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400/70" />
                    <div className="w-2 h-2 rounded-full bg-amber-400/70" />
                    <div className="w-2 h-2 rounded-full bg-emerald-400/70" />
                    <span className="text-[10px] text-brand-300 ml-2">DistriFlow Dashboard</span>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {['Month Revenue', 'Orders', 'Outlets', 'Outstanding'].map((label) => (
                      <div key={label} className="p-3 bg-surface-50 border border-surface-200 rounded-md">
                        <p className="text-[10px] text-surface-400 uppercase">{label}</p>
                        <p className="text-sm font-semibold font-mono text-surface-800 mt-1">
                          {label.includes('Revenue') || label.includes('Outstanding') ? '₹4.2L' : '128'}
                        </p>
                      </div>
                    ))}
                    <div className="col-span-2 h-24 bg-surface-50 border border-surface-200 rounded-md flex items-end gap-1 p-3">
                      {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                        <div key={i} className="flex-1 bg-accent-500 rounded-sm opacity-80" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who is it for */}
      <section className="py-16 px-6 bg-surface-50 border-y border-surface-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-surface-900 text-center mb-2">Built for your business type</h2>
          <p className="text-surface-500 text-center text-sm mb-10">Whether you distribute, manufacture or sell direct</p>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Building2, title: 'Distributors', desc: 'Streamline secondary sales, track rep performance, manage outlet-wise outstanding and inventory.' },
              { icon: Factory, title: 'Manufacturers', desc: 'Production planning, BOM management, dispatch tracking and distributor network visibility.' },
              { icon: Users, title: 'Retail & Wholesale', desc: 'GST invoices, purchase management, bill-wise payments and business reports.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-5 bg-white border border-surface-200 rounded-lg hover:shadow-card-hover transition-shadow">
                <div className="w-9 h-9 bg-brand-50 rounded-md flex items-center justify-center mb-4">
                  <Icon size={18} className="text-brand-800" />
                </div>
                <h3 className="font-semibold text-surface-900 mb-2">{title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-surface-900 text-center mb-2">Complete S&D platform</h2>
          <p className="text-surface-500 text-center text-sm mb-10">Everything to digitize your sales and distribution operations</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-5 border border-surface-200 rounded-lg hover:border-brand-300 hover:bg-brand-50/30 transition-colors">
                <div className="w-8 h-8 bg-accent-50 rounded-md flex items-center justify-center mb-3">
                  <Icon size={16} className="text-accent-700" />
                </div>
                <h3 className="text-sm font-semibold text-surface-900 mb-1.5">{title}</h3>
                <p className="text-xs text-surface-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="py-12 px-6 bg-brand-950">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Shield, title: 'Role-based Access', desc: 'Control what each employee sees and does' },
            { icon: RefreshCw, title: 'Tally Integration', desc: 'One-click sync with your accounting' },
            { icon: BarChart3, title: 'Business Reports', desc: 'Accounting-ready reports for decisions' },
            { icon: Settings, title: 'Configurable', desc: 'GST, permissions and workflows as you need' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-3">
              <div className="w-9 h-9 bg-white/10 rounded-md flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-accent-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{title}</p>
                <p className="text-xs text-brand-300 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-xl mx-auto text-center">
          <HeadphonesIcon size={32} className="mx-auto text-accent-600 mb-4" />
          <h2 className="text-2xl font-semibold text-surface-900 mb-3">Start your free trial today</h2>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-surface-500 mb-8">
            {['7-day free trial', 'No credit card', '24/7 support', 'Cancel anytime'].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <CheckCircle size={13} className="text-accent-600" /> {t}
              </li>
            ))}
          </ul>
          <Link to="/login" className="btn-primary !px-8 !py-2.5 inline-flex">
            Get Started <ArrowRight size={16} />
          </Link>
          <p className="mt-5 text-xs text-surface-400">
            support@distriFlow.com · +91 8092856577
          </p>
        </div>
      </section>

      <footer className="py-6 px-6 border-t border-surface-200 text-center text-xs text-surface-400">
        © 2026 DistriFlow. All rights reserved.
      </footer>
    </div>
  );
}
