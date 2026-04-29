import React, { useState, useEffect } from 'react';
import BorderGlow from '../components/BorderGlow';
import { Download, Calendar, Filter } from 'lucide-react';

export default function History() {
  const [records, setRecords] = useState([]);
  
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '';
      const res = await fetch(`${apiUrl}/api/history`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Date,Name,Status,Match Confidence,Time In\n";
    records.forEach(r => {
      csvContent += `${r.date},${r.name},${r.status},${r.conf},${r.time}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "attendance_history.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="w-full max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 mt-6 gap-6 md:gap-0">
        <div>
          <h2 className="text-4xl font-extrabold mb-3 text-white">Attendance Logs</h2>
          <p className="text-gray-400 text-lg">View historical data and export to CSV.</p>
        </div>
        
        <div className="flex gap-4">
          <button className="flex items-center gap-2 bg-[#1a1025] hover:bg-white/10 border border-white/10 text-white px-5 py-3 rounded-full font-semibold transition-all">
            <Filter size={18} /> Filter
          </button>
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 bg-gradient-to-r from-[#c084fc] to-[#38bdf8] hover:from-[#c084fc] hover:to-[#5eead4] text-white px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(192,132,252,0.4)] hover:shadow-[0_0_30px_rgba(192,132,252,0.6)] transition-all transform hover:-translate-y-1">
            <Download size={20} /> Export CSV
          </button>
        </div>
      </div>

      <BorderGlow glowColor="250 100 70" colors={['#c084fc', '#38bdf8', '#f472b6']} borderRadius={28}>
        <div className="p-2 min-h-[500px] flex flex-col bg-[#060010] rounded-[28px] overflow-hidden">
          <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/10 text-gray-300 text-sm uppercase tracking-wider">
                  <th className="p-6 font-semibold rounded-tl-[24px]">Date</th>
                  <th className="p-6 font-semibold">Name</th>
                  <th className="p-6 font-semibold">Status</th>
                  <th className="p-6 font-semibold">Match Confidence</th>
                  <th className="p-6 font-semibold rounded-tr-[24px]">Time In</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer group">
                    <td className="p-6 text-gray-400 flex items-center gap-3">
                      <Calendar size={18} className="text-[#38bdf8] group-hover:scale-110 transition-transform"/> 
                      {rec.date}
                    </td>
                    <td className="p-6 font-bold text-white text-lg">{rec.name}</td>
                    <td className="p-6">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide
                        ${rec.status === 'Present' 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(74,222,128,0.2)]' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="p-6 font-mono text-[#f472b6] font-semibold">{rec.conf}</td>
                    <td className="p-6 text-gray-400">{rec.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </BorderGlow>
    </div>
  );
}
