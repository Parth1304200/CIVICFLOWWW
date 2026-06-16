import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowLeft, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import api from '../services/api';

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

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="flex items-center justify-between p-6 max-w-7xl w-full mx-auto border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
          <img 
            src="/logo-clean.png" 
            alt="Civic Flow Logo" 
            className="h-8 object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="hidden h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">C</div>
          CivicFlow Public Insights
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="hidden sm:flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Button>
          <Button onClick={() => navigate('/login')} size="sm">Sign In / Report</Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900">City Issue Analytics</h1>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            Real-time public data on community complaints, giving you full transparency into local infrastructure and city response metrics.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            <div className="h-32 bg-slate-200 rounded-xl"></div>
            <div className="h-32 bg-slate-200 rounded-xl"></div>
            <div className="h-32 bg-slate-200 rounded-xl"></div>
            <div className="h-96 bg-slate-200 rounded-xl md:col-span-2"></div>
            <div className="h-96 bg-slate-200 rounded-xl"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Registered</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.total || 0}</p>
                </div>
                <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Currently Active</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {stats?.byStatus?.find(s => s._id === 'Pending' || s._id === 'In Progress')?.count || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Resolved Issues</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {stats?.byStatus?.find(s => s._id === 'Resolved')?.count || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Issues by Category</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="Issues" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Resolution Status</h3>
                <div className="h-80 flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 flex flex-wrap justify-center gap-4">
                    {statusData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-2 text-sm text-slate-600">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        {entry.name} ({entry.value})
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
