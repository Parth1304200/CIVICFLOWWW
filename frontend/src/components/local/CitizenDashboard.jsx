import React, { useState } from 'react';
import { useLocalComplaints } from '../../context/LocalComplaintsContext';
import { useAuth } from '../../context/AuthContext';
import { ComplaintForm } from './ComplaintForm';
import { ComplaintCard } from './ComplaintCard';
import { Button } from '../ui/Button';
import { PlusCircle, List } from 'lucide-react';

export function CitizenDashboard() {
  const { user } = useAuth();
  const { getComplaintsByEmail } = useLocalComplaints();
  
  const [view, setView] = useState('list'); // 'list' | 'new'
  
  const myComplaints = getComplaintsByEmail(user?.email || 'anonymous');

  return (
    <div className="mt-8 pt-8 border-t-2 border-dashed border-amber-200">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-sm uppercase tracking-wide">Offline</span>
            Local Storage Panel
          </h2>
          <p className="text-sm text-slate-500">Completely independent dual-role simulation.</p>
        </div>
        
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-full sm:w-auto justify-between">
          <Button 
            variant={view === 'list' ? 'primary' : 'ghost'} 
            size="sm" 
            onClick={() => setView('list')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs sm:text-sm"
          >
            <List className="h-4 w-4" /> My Offline Complaints
          </Button>
          <Button 
            variant={view === 'new' ? 'primary' : 'ghost'} 
            size="sm" 
            onClick={() => setView('new')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs sm:text-sm"
          >
            <PlusCircle className="h-4 w-4" /> New Simulation
          </Button>
        </div>
      </div>

      {view === 'new' ? (
        <ComplaintForm onSuccess={() => setView('list')} />
      ) : (
        <div className="space-y-4">
          {myComplaints.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-500 font-medium">No offline complaints found.</p>
              <p className="text-xs text-slate-400 mt-1">Submit a new simulation to see it mapped here.</p>
            </div>
          ) : (
            myComplaints.map(complaint => (
              <ComplaintCard key={complaint.id} complaint={complaint} isAdmin={false} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
