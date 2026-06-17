import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { ArrowLeft, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import api from '../services/api';
import { PublicHeader } from '../components/layout/PublicHeader';
import { Footer } from '../components/layout/Footer';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

export function PublicDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/complaints/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const categoryData = stats?.byCategory?.map(item => ({
    name: item._id,
    Issues: item.count
  })) || [];

  const statusData = stats?.byStatus?.map(item => ({
    name: item._id,
    value: item.count
  })) || [];

  // Generate some dummy trend data if backend doesn't provide it
  const trendData = [
    { name: 'Mon', issues: 12 },
    { name: 'Tue', issues: 19 },
    { name: 'Wed', issues: 15 },
    { name: 'Thu', issues: 22 },
    { name: 'Fri', issues: 18 },
    { name: 'Sat', issues: 25 },
    { name: 'Sun', issues: 20 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicHeader />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <h1 className="text-3xl font-black text-slate-900">City Issue Analytics</h1>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto font-medium">
            Real-time public data on community complaints, giving you full transparency into local infrastructure and city response metrics.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            <div className="h-32 bg-slate-200 rounded-2xl"></div>
            <div className="h-32 bg-slate-200 rounded-2xl"></div>
            <div className="h-32 bg-slate-200 rounded-2xl"></div>
            <div className="h-[400px] bg-slate-200 rounded-2xl md:col-span-2"></div>
            <div className="h-[400px] bg-slate-200 rounded-2xl"></div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                <div className="relative z-10">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total Registered</p>
                  <p className="text-4xl font-black text-slate-800 mt-2">{stats?.total || 0}</p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center shadow-md relative z-10">
                  <TrendingUp className="h-7 w-7" />
                </div>
              </motion.div>
              
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                <div className="relative z-10">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Currently Active</p>
                  <p className="text-4xl font-black text-slate-800 mt-2">
                    {stats?.byStatus?.find(s => s._id === 'Pending' || s._id === 'In Progress')?.count || 0}
                  </p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl flex items-center justify-center shadow-md relative z-10">
                  <AlertTriangle className="h-7 w-7" />
                </div>
              </motion.div>
              
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                <div className="relative z-10">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Resolved Issues</p>
                  <p className="text-4xl font-black text-slate-800 mt-2">
                    {stats?.byStatus?.find(s => s._id === 'Resolved')?.count || 0}
                  </p>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl flex items-center justify-center shadow-md relative z-10">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Bar Chart - Issues by Category */}
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                  Issues by Category
                </h3>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <defs>
                        <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} />
                      <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 600 }} />
                      <Bar dataKey="Issues" fill="url(#colorBar)" radius={[6, 6, 0, 0]} barSize={45}>
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Pie Chart - Resolution Status */}
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <div className="w-2 h-6 bg-amber-500 rounded-full"></div>
                  Resolution Status
                </h3>
                <div className="h-[300px] flex flex-col items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={statusData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={80} 
                        outerRadius={110} 
                        paddingAngle={5} 
                        dataKey="value"
                        stroke="none"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 600 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Inner text for donut chart */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-slate-800">{stats?.total || 0}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</span>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap justify-center gap-4">
                  {statusData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-full">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      {entry.name} <span className="text-slate-400 ml-1">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Optional Area Chart for trends */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                Weekly Trend (Example)
              </h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} />
                    <RechartsTooltip cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 600 }} />
                    <Area type="monotone" dataKey="issues" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIssues)" activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
