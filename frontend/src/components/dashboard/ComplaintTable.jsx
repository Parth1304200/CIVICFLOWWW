import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

export function ComplaintTable({ complaints }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const displayId = (complaint) => {
    // If admin or CM, show full ID
    if (user?.role === 'admin' || user?.role === 'cm') {
      return complaint.id;
    }
    // If citizen and registered by this user, show full ID
    if (user?._id && String(complaint.userId) === String(user._id)) {
      return complaint.id;
    }
    // Otherwise, mask it
    return '••••••';
  };

  const getStatusVariant = (status) => {
    switch (status.toLowerCase()) {
      case 'in progress':
        return 'primary';
      case 'resolved':
        return 'success';
      case 'escalated':
        return 'danger';
      case 'pending':
      default:
        return 'default';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
    >
      <div className="border-b border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900">Recent Complaints</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th scope="col" className="px-6 py-4 font-semibold">ID</th>
              <th scope="col" className="px-6 py-4 font-semibold">Title</th>
              <th scope="col" className="px-6 py-4 font-semibold">Category</th>
              <th scope="col" className="px-6 py-4 font-semibold">Status</th>
              <th scope="col" className="px-6 py-4 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {complaints && complaints.length > 0 ? (
              complaints.map((complaint, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.3 + (idx * 0.05) }}
                  key={complaint.id} 
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-900 font-mono">{displayId(complaint)}</td>
                  <td className="px-6 py-4">{complaint.title}</td>
                  <td className="px-6 py-4 text-slate-500">{complaint.category}</td>
                  <td className="px-6 py-4">
                    <Badge variant={getStatusVariant(complaint.status)}>
                      {complaint.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{complaint.date}</td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                  No complaints found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-200 p-6">
        <Button onClick={() => navigate('/submit')}>
          Submit New Complaint
        </Button>
      </div>
    </motion.div>
  );
}
