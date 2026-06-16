import Link from 'next/link';

const FEATURES = [
  {
    icon: '📋',
    title: 'Submit Complaints',
    description: 'File civic grievances online with photos, location, and category tags.',
  },
  {
    icon: '📍',
    title: 'Real-Time Tracking',
    description: 'Track your complaint status with an order-tracking style timeline.',
  },
  {
    icon: '🛡️',
    title: 'Anti-Corruption Design',
    description: 'Photo proof with GPS verification. False closures are auto-detected and penalized.',
  },
  {
    icon: '📊',
    title: 'Officer Accountability',
    description: 'Officers are scored 0–100 on speed, citizen satisfaction, and integrity.',
  },
  {
    icon: '🗺️',
    title: 'CM Geo Dashboard',
    description: 'Chief Minister views all complaints within 2km in real time on a mobile map.',
  },
  {
    icon: '🔗',
    title: 'CPGRAMS Integrated',
    description: 'All complaints are synced to the Central Government CPGRAMS portal.',
  },
];

const CATEGORIES = [
  { label: 'Potholes', icon: '🕳️', color: 'bg-amber-50 text-amber-700' },
  { label: 'Waterlogging', icon: '💧', color: 'bg-blue-50 text-blue-700' },
  { label: 'Garbage', icon: '🗑️', color: 'bg-green-50 text-green-700' },
  { label: 'Streetlights', icon: '💡', color: 'bg-yellow-50 text-yellow-700' },
  { label: 'Sewer', icon: '🔧', color: 'bg-slate-50 text-slate-700' },
  { label: 'Encroachment', icon: '🚧', color: 'bg-orange-50 text-orange-700' },
  { label: 'Noise', icon: '🔊', color: 'bg-purple-50 text-purple-700' },
  { label: 'Critical', icon: '🚨', color: 'bg-red-50 text-red-700' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-blue-300 blur-3xl" />
        </div>

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
              🏛️
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">Delhi CMO</p>
              <p className="text-blue-200 text-xs">Grievance Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-blue-200 hover:text-white text-sm font-medium transition-colors">
              Sign In
            </Link>
            <Link href="/auth/register" className="px-4 py-2 bg-white text-blue-900 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors shadow-lg">
              File a Complaint
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-blue-100 text-xs font-medium mb-6 border border-white/20">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Official Portal of the Chief Minister of Delhi
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight leading-tight">
            Your Voice,<br />
            <span className="text-blue-300">Our Commitment</span>
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            File civic complaints, track resolutions in real time, and hold officers accountable.
            Every grievance matters. Every resolution is verified.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              id="cta-register"
              className="px-8 py-3.5 bg-white text-blue-900 rounded-xl font-semibold text-base hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
            >
              📋 File a Complaint
            </Link>
            <Link
              href="/auth/login"
              id="cta-login"
              className="px-8 py-3.5 bg-white/10 text-white rounded-xl font-semibold text-base border border-white/30 hover:bg-white/20 transition-all"
            >
              🔍 Track Status
            </Link>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mt-16 border-t border-white/10 pt-10">
            {[
              { value: '2.4L+', label: 'Complaints Filed' },
              { value: '91%', label: 'Resolution Rate' },
              { value: '4.2★', label: 'Citizen Rating' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-blue-200 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900">Complaint Categories</h2>
          <p className="text-slate-500 mt-2 text-sm">We handle all types of civic issues</p>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href="/auth/register"
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl ${cat.color} hover:scale-105 transition-transform cursor-pointer`}
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs font-medium text-center leading-tight">{cat.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-slate-900 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Built for Accountability</h2>
            <p className="text-slate-400 mt-3 max-w-xl mx-auto">
              Every feature is designed to prevent corruption and ensure genuine resolution.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl bg-slate-800 border border-slate-700 hover:border-blue-500/50 transition-colors group">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-white mb-2 text-base">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Role Portals */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">Access Portals</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              title: 'Citizen Portal',
              desc: 'Submit complaints, track status, dispute false closures.',
              icon: '👤',
              href: '/auth/register',
              color: 'from-blue-600 to-blue-700',
              id: 'portal-citizen',
            },
            {
              title: 'Secretariat / Admin',
              desc: 'Manage queue, assign officers, monitor department performance.',
              icon: '🏛️',
              href: '/secretariat/login',
              color: 'from-slate-700 to-slate-800',
              id: 'portal-admin',
            },
          ].map((p) => (
            <Link
              key={p.title}
              href={p.href}
              id={p.id}
              className={`p-8 rounded-2xl bg-gradient-to-br ${p.color} text-white hover:scale-[1.02] transition-transform shadow-lg`}
            >
              <div className="text-4xl mb-4">{p.icon}</div>
              <h3 className="text-xl font-bold mb-2">{p.title}</h3>
              <p className="text-white/70 text-sm">{p.desc}</p>
              <div className="mt-6 text-sm font-semibold text-white/90">Access Portal →</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <span>🏛️</span>
            <span>Office of the Chief Minister of Delhi — Grievance Management System</span>
          </div>
          <div className="flex gap-6 text-xs text-slate-400">
            <span>CPGRAMS Integrated</span>
            <span>·</span>
            <span>RTI Compliant</span>
            <span>·</span>
            <span>ISO 27001</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
