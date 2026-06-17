import React from 'react';
import { PublicHeader } from '../components/layout/PublicHeader';
import { Footer } from '../components/layout/Footer';
import { FaTrash, FaTint, FaLightbulb, FaRoad, FaWater, FaTree } from 'react-icons/fa';

export function Services() {
  const services = [
    { title: 'Waste Management', icon: <FaTrash />, desc: 'Report uncollected garbage, illegal dumping, and request bin cleaning.' },
    { title: 'Water & Sewage', icon: <FaTint />, desc: 'Report water supply disruptions, pipeline leaks, and contaminated water.' },
    { title: 'Street Lighting', icon: <FaLightbulb />, desc: 'Fix dark streets by reporting broken, flickering, or missing streetlights.' },
    { title: 'Road Infrastructure', icon: <FaRoad />, desc: 'Report potholes, broken pavements, and damaged road signs.' },
    { title: 'Drainage Issues', icon: <FaWater />, desc: 'Report clogged drains, manhole cover issues, and waterlogging.' },
    { title: 'Parks & Trees', icon: <FaTree />, desc: 'Report fallen trees, unmaintained public parks, and pruning requests.' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicHeader />
      <main className="flex-1 w-full pb-20">
        <div className="bg-slate-900 text-white py-16 px-6">
          <div className="max-w-[1200px] mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-4">Our Services</h1>
            <p className="text-slate-300 max-w-2xl mx-auto text-lg">We cover a wide range of civic issues. Explore the categories you can report to help us maintain the city.</p>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-6 mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-2xl mb-4">
                {svc.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{svc.title}</h3>
              <p className="text-slate-500 leading-relaxed">{svc.desc}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
