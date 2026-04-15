import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, BarChart3, TrendingUp, RefreshCcw, Calendar } from 'lucide-react';

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5001/api/admin/metrics' 
  : 'https://api.getzio.in/api/admin/metrics';

const api = axios.create({
  baseURL: API_BASE_URL
});

function App() {
  const [summary, setSummary] = useState(null);
  const [apiUsage, setApiUsage] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dates, setDates] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, usageRes] = await Promise.all([
        api.get('/summary', { params: dates }),
        api.get('/api-usage', { params: dates })
      ]);
      setSummary(summaryRes.data.data);
      setApiUsage(usageRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch metrics. Backend might be down.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 text-slate-900">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Getzio Analytics
            </h1>
            <p className="text-slate-500 mt-1">Real-time usage and API performance stats.</p>
          </div>

          <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 px-3 border-r border-slate-100">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input 
                type="date" 
                className="text-sm font-medium border-none focus:ring-0 p-0" 
                value={dates.startDate}
                onChange={(e) => setDates({ ...dates, startDate: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 px-3 border-r border-slate-100">
              <span className="text-slate-300 text-sm">to</span>
              <input 
                type="date" 
                className="text-sm font-medium border-none focus:ring-0 p-0" 
                value={dates.endDate}
                onChange={(e) => setDates({ ...dates, endDate: e.target.value })}
              />
            </div>
            <button 
              onClick={fetchData}
              disabled={loading}
              className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-600"
            >
              <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
            </button>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <MetricCard 
            title="App Opens Today" 
            value={summary?.totalSessionsToday ?? 0} 
            icon={<Activity className="w-6 h-6 text-blue-600" />}
            subtitle="Total session starts"
          />
          <MetricCard 
            title="API Calls Today" 
            value={summary?.totalApiCallsToday ?? 0} 
            icon={<BarChart3 className="w-6 h-6 text-indigo-600" />}
            subtitle="Request volume"
          />
          <MetricCard 
            title="Top API Endpoint" 
            value={summary?.topApiEndpoint || 'N/A'} 
            icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
            subtitle={`${summary?.topApiCount || 0} calls`}
            isText
          />
        </div>

        {/* API Usage Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">API Usage (Ranked)</h2>
            <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded text-slate-500">
              {apiUsage?.length || 0} Endpoints
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Endpoint Path</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Call Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apiUsage?.map((row, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <code className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {row.endpoint}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">
                      {row.count.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {(!apiUsage || apiUsage.length === 0) && !loading && (
                  <tr>
                    <td colSpan="2" className="px-6 py-10 text-center text-slate-400">
                      No data recorded for the selected range.
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

function MetricCard({ title, value, icon, subtitle, isText }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-slate-50 rounded-xl">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-slate-500 mb-1">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className={`font-bold text-slate-900 ${isText ? 'text-lg truncate max-w-[200px]' : 'text-3xl'}`}>
            {value}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-2">{subtitle}</p>
      </div>
    </div>
  );
}

export default App;
