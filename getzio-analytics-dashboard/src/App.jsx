import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, BarChart3, TrendingUp, RefreshCcw } from 'lucide-react';

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5001/api/admin/today-usage' 
  : 'https://api.getzio.in/api/admin/today-usage';

function App() {
  const [data, setData] = useState({ usage: [], totalCalls: 0, date: '' });
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_BASE_URL);
      setData(res.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch today\'s usage. Backend might be down.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 text-slate-900">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Getzio API Usage
            </h1>
            <p className="text-slate-500 mt-1">Real-time tracking for {data.date || 'Today'}</p>
          </div>

          <button 
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all font-medium text-slate-600"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
            Sync Now
          </button>
        </header>

        {/* Summary Metric */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-1">Total API Calls Today</h2>
            <p className="text-5xl font-black text-slate-900">{data.totalCalls.toLocaleString()}</p>
          </div>
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
             <BarChart3 className="text-blue-600 w-8 h-8" />
          </div>
        </div>

        {/* Usage Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
            <h2 className="font-bold text-slate-800">Endpoint Usage</h2>
            <span className="text-xs font-bold px-2.5 py-1 bg-blue-100 text-blue-600 rounded-full uppercase">
              {data.usage.length} Active Routes
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Endpoint</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Calls Today</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.usage.map((row, index) => (
                  <tr key={index} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-400 group-hover:scale-125 transition-transform" />
                        <code className="text-sm font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {row.endpoint}
                        </code>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className="text-lg font-bold text-slate-800">{row.count.toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
                {data.usage.length === 0 && !loading && (
                  <tr>
                    <td colSpan="2" className="px-8 py-20 text-center text-slate-400 font-medium">
                      No API traffic recorded yet for today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
