import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, BarChart3, TrendingUp, RefreshCcw, Trash2, Smartphone, ShieldAlert, Clock } from 'lucide-react';

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'https://getzio-backend-dev.onrender.com/api/admin/today-usage' 
  : 'https://getzio-backend-dev.onrender.com/api/admin/today-usage';

const api = axios.create({
  baseURL: API_BASE_URL
});

function App() {
  const [data, setData] = useState({ usage: [], totalCalls: 0, date: '' });
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('dashboard');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usageRes, auditRes] = await Promise.all([
        api.get('/'),
        api.get('/pending-audits')
      ]);
      setData(usageRes.data.data);
      setAudits(auditRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('WARNING: This will permanently reset today\'s counts to 0. Continue?')) return;
    
    setLoading(true);
    try {
      await api.delete('/');
      fetchData();
    } catch (error) {
      console.error('Error resetting data:', error);
      alert('Failed to reset usage data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto">
        {view === 'endpoints' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex items-center justify-between mb-10">
              <div>
                <button 
                  onClick={() => setView('dashboard')}
                  className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl mb-4 hover:bg-blue-100 transition-all flex items-center gap-2"
                >
                  ← Back to Dashboard
                </button>
                <h1 className="text-3xl font-black tracking-tight text-slate-900">
                  Full Endpoint Usage
                </h1>
                <p className="text-slate-500 mt-1 font-medium">Detailed tracking for all {data.usage?.length || 0} active endpoints</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Total Calls</p>
                <p className="text-4xl font-black text-blue-600">{data.totalCalls.toLocaleString()}</p>
              </div>
            </header>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden mb-20">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Rank</th>
                    <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Endpoint Path</th>
                    <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Invocation Count</th>
                    <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Traffic Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.usage?.map((row, index) => {
                    const percentage = data.totalCalls > 0 
                      ? ((row.count / data.totalCalls) * 100).toFixed(1)
                      : '0.0';
                    return (
                      <tr key={index} className="hover:bg-blue-50/20 transition-colors group">
                        <td className="px-8 py-6">
                          <span className="text-sm font-bold text-slate-400">#{index + 1}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1.5">
                            <code className="text-sm font-bold text-blue-700 bg-blue-50/50 px-3 py-1.5 rounded-xl self-start">
                              {row.endpoint}
                            </code>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter w-fit ${
                              row.app === 'Zepcart' ? 'bg-indigo-50 text-indigo-500' :
                              row.app === 'Admin App' ? 'bg-purple-50 text-purple-500' :
                              row.app === 'Vendor App' ? 'bg-orange-50 text-orange-500' :
                              'bg-slate-100 text-slate-400'
                            }`}>
                              {row.app || 'UNKNOWN SOURCE'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className="text-xl font-black text-slate-800 tabular-nums">{row.count.toLocaleString()}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-600 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs font-black text-slate-500 w-10">{percentage}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Getzio Analytics
            </h1>
            <p className="text-slate-500 mt-1 font-medium">Real-time API tracking for {data.date || 'Today'}</p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleReset}
              disabled={loading}
              className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-red-50 hover:bg-red-50 transition-all font-bold text-red-500 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Reset Counts
            </button>
            
            <button 
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 px-4 py-2.5 rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all font-bold text-white text-sm"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Sync Now
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            {/* Summary Metric */}
            <div className="lg:col-span-1 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col justify-between">
                <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Total API Calls Today</h2>
                    <p className="text-6xl font-black text-slate-900 tabular-nums">
                        {data.totalCalls.toLocaleString()}
                    </p>
                </div>
                <div className="mt-6 flex items-center justify-between">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                        <BarChart3 className="text-blue-600 w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-tighter">Live Monitor</span>
                </div>
            </div>

            {/* Usage Table */}
            <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                    <h2 className="font-extrabold text-lg text-slate-800">Endpoint Usage</h2>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setView('endpoints')}
                            className="text-[10px] font-black px-3 py-1 bg-white border border-slate-200 text-slate-500 rounded-full uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                        >
                            View All
                        </button>
                        <span className="text-[10px] font-black px-3 py-1 bg-blue-50 text-blue-600 rounded-full uppercase tracking-widest">
                            {data.usage?.length || 0} Endpoints
                        </span>
                    </div>
                </div>
                <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 sticky top-0 bg-white">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Endpoint</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Calls</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.usage?.map((row, index) => (
                                <tr key={index} className="hover:bg-blue-50/20 transition-colors group">
                                    <td className="px-8 py-4">
                                        <div className="flex flex-col gap-1">
                                            <code className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/50 self-start">
                                                {row.endpoint}
                                            </code>
                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter w-fit ${
                                              row.app === 'Zepcart' ? 'bg-indigo-50 text-indigo-500' :
                                              row.app === 'Admin App' ? 'bg-purple-50 text-purple-500' :
                                              row.app === 'Vendor App' ? 'bg-orange-50 text-orange-500' :
                                              'bg-slate-100 text-slate-400'
                                            }`}>
                                              {row.app || 'UNKNOWN'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <span className="text-lg font-black text-slate-800 tabular-nums">{row.count.toLocaleString()}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Detailed Recovery Audit Log */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden mb-12">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 rounded-xl">
                        <ShieldAlert className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <h2 className="font-extrabold text-lg text-slate-800">Order Recovery Traces</h2>
                        <p className="text-xs text-slate-400 font-medium">Real-time audit of /vendor/pending calls</p>
                    </div>
                </div>
                <span className="text-[10px] font-black px-3 py-1 bg-amber-50 text-amber-600 rounded-full uppercase tracking-widest animate-pulse">
                    Live Feed
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor / Store</th>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Version</th>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</th>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">IP Address</th>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {audits.map((audit, index) => (
                            <tr key={audit._id || index} className="hover:bg-amber-50/20 transition-colors">
                                <td className="px-8 py-5">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-800">{audit.vendorId?.businessName || audit.vendorId?.storeName || 'Unknown Vendor'}</span>
                                        <span className="text-[10px] font-mono text-slate-400">{audit.vendorId?._id || 'N/A'}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                                        <span className={`text-xs font-bold ${audit.appVersion === 'unknown' ? 'text-red-400' : 'text-slate-600'}`}>
                                            {audit.appVersion}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tight ${
                                        audit.reason === 'RECONNECTED' ? 'bg-blue-50 text-blue-600' : 
                                        audit.reason === 'INITIAL_LOAD' ? 'bg-indigo-50 text-indigo-600' : 
                                        'bg-slate-100 text-slate-500'
                                    }`}>
                                        {audit.reason}
                                    </span>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{audit.ip}</span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2 text-slate-400">
                                        <Clock className="w-3 h-3" />
                                        <span className="text-xs font-bold">{new Date(audit.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {audits.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-8 py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-sm">
                                    No recovery traces found yet
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}

export default App;
