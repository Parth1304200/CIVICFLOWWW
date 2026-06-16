import React from 'react';
import { HelpCircle, Mail, PhoneCall } from 'lucide-react';

export function HelpSupport() {
  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Help & Support</h1>
        <p className="text-slate-500 mt-2">Find answers to common questions or reach out to our team.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 flex items-start gap-4">
          <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
            <PhoneCall className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Helpline Number</h3>
            <p className="text-sm text-slate-500 mt-1">Available Mon-Sat, 9 AM to 6 PM</p>
            <p className="font-semibold text-blue-600 mt-2">1800-11-2233</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 flex items-start gap-4">
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Email Support</h3>
            <p className="text-sm text-slate-500 mt-1">We aim to reply within 24 hours</p>
            <p className="font-semibold text-emerald-600 mt-2">support@civicflow.gov.in</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-slate-400" />
            Frequently Asked Questions
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          <div className="p-6">
            <h4 className="font-semibold text-slate-800 mb-2">How do I track my complaint?</h4>
            <p className="text-sm text-slate-600">You can track your complaint by navigating to the "My Complaints" section in your dashboard. Each complaint has a status badge indicating its current state (Pending, In Progress, Resolved).</p>
          </div>
          <div className="p-6">
            <h4 className="font-semibold text-slate-800 mb-2">Can I edit a complaint after submission?</h4>
            <p className="text-sm text-slate-600">No, once a complaint is officially lodged, it cannot be edited. If you need to add more details, please lodge a new complaint or contact support with your complaint ID.</p>
          </div>
          <div className="p-6">
            <h4 className="font-semibold text-slate-800 mb-2">What happens when my complaint is resolved?</h4>
            <p className="text-sm text-slate-600">You will see the status change to "Resolved" in your dashboard, along with an official remark or photo from the municipal officer who handled it.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
