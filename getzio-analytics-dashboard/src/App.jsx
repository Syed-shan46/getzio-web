import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Activity, BarChart3, TrendingUp, RefreshCcw, Trash2, 
  Smartphone, ShieldAlert, Clock, Info, HelpCircle, 
  X, LayoutDashboard, Database, BookOpen, Menu, ChevronRight,
  Flame, Gauge
} from 'lucide-react';
import FocusTodo from './FocusTodo';
import ApiInsights from './ApiInsights';

const API_BASE_URL = 'https://getzio-backend-dev.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL
});

const ENDPOINT_DESCRIPTIONS = {
  // --- AUTH & PROFILE ---
  '/user/auth/send-otp': {
    title: '🔑 OTP Dispatch',
    purpose: 'Initiates the login flow by sending a 4-digit OTP to the user.s mobile number.',
    behavior: 'Burst traffic pattern. High usage during marketing campaigns.',
    optimization: 'Rate-limited at the backend to prevent SMS cost spikes and spamming.'
  },
  '/user/auth/verify-otp': {
    title: '🛡️ Login Verification',
    purpose: 'Exchanges a valid OTP for a JWT Session Token. The final step of the authentication handshake.',
    behavior: 'Critical path. Returns user profile and authentication credentials.',
    optimization: 'JWT tokens are used subsequently to reduce database hits for session validation.'
  },
  '/user/profile': {
    title: '👤 Profile Management',
    purpose: 'Handles fetching and deleting user profile data.',
    behavior: 'Called on "Profile" tab entry.',
    optimization: 'Cached locally in Hive on the device to avoid frequent API calls.'
  },

  // --- COMMERCE & DISCOVERY ---
  '/home/layout': {
    title: '🏠 Dynamic Home Feed',
    purpose: 'The "Engine" of the Getzio home screen. Fetches banners, categories, and curated product sections.',
    behavior: 'The most frequent GET request on app launch.',
    optimization: 'Uses Hive-based offline caching. Loads cached data first, then updates silently in the background.'
  },
  '/customer/products': {
    title: '🍿 Bulk Product Feed',
    purpose: 'Retrieves the global list of products available to the customer.',
    behavior: 'Pulls large datasets. Usually paginated or filtered.',
    optimization: 'Optimized via backend projections to only send necessary fields.'
  },
  '/customer/search': {
    title: '🔍 Global Search',
    purpose: 'Powers the search bar. Performs fuzzy matching on titles and tags.',
    behavior: 'Triggered as the user types (with debouncing).',
    optimization: 'Uses debouncing on the frontend to prevent spamming requests.'
  },

  // --- ORDERS ---
  '/order/create': {
    title: '💳 Checkout & Place Order',
    purpose: 'Converts a cart into a persistent order. Handles final calculation and payment method recording.',
    behavior: 'Critical transactional path. Notifies vendors via Socket/FCM on success.',
    optimization: 'Atomic database operations ensure that inventory and order creation are synced.'
  },
  '/order/customer/': {
    title: '🛍️ Customer Order Fetch',
    purpose: 'Retrieves active and past orders for the "My Orders" tab.',
    behavior: 'Now restricted to "On-Demand" loading (scoped to Orders screen).',
    optimization: '95%+ Traffic reduction achieved by removing periodic polling and using Sockets.'
  },

  // --- BUSINESS OPS ---
  '/basic-auth/vendor-status': {
    title: '🕵️ Business Verification',
    purpose: 'Checks if a user.s vendor account is approved, pending, or rejected.',
    behavior: 'Called upon login for potential vendor users.'
  },
  '/basic-vendor/status': {
    title: '🟢 Store Open/Close',
    purpose: 'Real-time toggle for store availability.',
    behavior: 'Immediate effect on customer-side "Store Closed" banners.',
    optimization: 'State is synchronized via sockets to ensure customers see accurate info instantly.'
  },

  // --- ANALYTICS ---
  '/admin/today-usage': {
    title: '📈 Analytics Dashboard API',
    purpose: 'Powers the very dashboard you are looking at right now.',
    behavior: 'Fetches usage counts and audit logs. Polled every 30 seconds.',
    optimization: 'Uses simplified in-memory counts on the backend for speed.'
  },

  // --- REVIEWS ---
  '/reviews/bulk-stats': {
    title: '📦 Bulk Review Stats',
    purpose: 'Fetches aggregate rating data (average & total count) for multiple products at once.',
    behavior: 'Critical for the home feed to show star ratings for all products without calling individual APIs for each.',
    optimization: 'Uses high-performance MongoDB aggregation to process stats for dozens of products in a single pass.'
  },

  // --- VENDOR SOCIAL ---
  '/basic-vendor/following': {
    title: '❤️ Followed Businesses',
    purpose: 'Retrieves the list of basic vendors that the current customer is following.',
    behavior: 'Populates the "Following" tab with business profiles, logos, and owner details.',
    optimization: 'Leverages indexed fields and lean database queries to ensure rapid load times for the customer feed.'
  }
};

const getEndpointInfo = (endpoint) => {
  if (!endpoint) return null;
  const cleanEndpoint = endpoint.split('?')[0];
  if (ENDPOINT_DESCRIPTIONS[cleanEndpoint]) return ENDPOINT_DESCRIPTIONS[cleanEndpoint];
  const keys = Object.keys(ENDPOINT_DESCRIPTIONS).sort((a,b) => b.length - a.length);
  for (const key of keys) {
    if (cleanEndpoint.startsWith(key)) return ENDPOINT_DESCRIPTIONS[key];
  }
  return null;
};

function App() {
  const [data, setData] = useState({ usage: [], totalCalls: 0, date: '' });
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usageRes, auditRes] = await Promise.all([
        api.get('/admin/today-usage'),
        api.get('/admin/today-usage/pending-audits')
      ]);
      setData(usageRes.data.data);
      setAudits(auditRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = async () => {
    if (!window.confirm('WARNING: This will permanently reset today\'s counts. Continue?')) return;
    setLoading(true);
    try {
      await api.delete('/admin/today-usage');
      fetchData();
    } catch (error) {
      console.error('Error resetting:', error);
    } finally {
      setLoading(false);
    }
  };

  const NavItem = ({ id, icon: Icon, label, accent }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
        activeTab === id 
          ? (accent ? `${accent} text-white shadow-xl` : 'bg-blue-600 text-white shadow-lg shadow-blue-100')
          : (activeTab === 'focus-todo' ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100')
      }`}
    >
      <div className="relative">
        <Icon className="w-5 h-5" />
        {accent && <div className={`absolute inset-0 blur-md ${accent.split(' ')[0]} opacity-50`} />}
      </div>
      {isSidebarOpen && <span>{label}</span>}
    </button>
  );

  return (
    <div className={`min-h-screen flex font-sans overflow-hidden transition-colors duration-700 ${
      activeTab === 'focus-todo' ? 'bg-[#050505] text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Sidebar */}
      <aside className={`border-r transition-all duration-300 flex flex-col ${
        activeTab === 'focus-todo' ? 'bg-[#0a0a0a] border-white/5' : 'bg-white border-slate-200'
      } ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 mb-4 flex items-center justify-between">
          {isSidebarOpen && (
            <h1 className="text-xl font-black tracking-tighter text-blue-600">GETZIO</h1>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem id="usage" icon={Database} label="Usage Analytics" />
          <NavItem id="api-insights" icon={Gauge} label="API Insights" />
          <NavItem id="catalog" icon={BookOpen} label="API Catalog" />
          <div className="py-2" />
          <NavItem 
            id="focus-todo" 
            icon={Flame} 
            label="Focus Todo" 
            accent="bg-gradient-to-r from-orange-600 to-pink-600"
          />
        </nav>

        <div className="p-4 mt-auto">
          {isSidebarOpen && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-slate-600">Secure & Online</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-screen relative scroll-smooth">
        <div className="p-8 md:p-12 max-w-6xl mx-auto">
          
          {/* Endpoint Modal */}
          {selectedEndpoint && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedEndpoint(null)}></div>
              <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 w-full max-w-lg relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
                      <HelpCircle className="text-blue-600 w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-xl text-slate-900">Endpoint Insight</h3>
                  </div>
                  <button onClick={() => setSelectedEndpoint(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-8 space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Endpoint Path</p>
                    <code className="text-sm font-bold text-blue-700 bg-blue-50 px-4 py-2 rounded-xl block w-fit">{selectedEndpoint}</code>
                  </div>
                  {getEndpointInfo(selectedEndpoint) ? (
                    <>
                      <div>
                        <h4 className="font-black text-slate-900 text-lg mb-1">{getEndpointInfo(selectedEndpoint).title}</h4>
                        <p className="text-slate-600 leading-relaxed font-medium">{getEndpointInfo(selectedEndpoint).purpose}</p>
                      </div>
                      <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100">
                        <div className="flex items-center gap-2 text-emerald-600 mb-2">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Efficiency</span>
                        </div>
                        <p className="text-emerald-700 text-sm font-bold leading-relaxed">{getEndpointInfo(selectedEndpoint).optimization || 'Standard performance.'}</p>
                      </div>
                    </>
                  ) : (
                    <div className="py-10 text-center text-slate-400 font-bold italic">Documentation coming soon.</div>
                  )}
                </div>
                <div className="px-8 pb-8">
                  <button onClick={() => setSelectedEndpoint(null)} className="w-full bg-slate-900 text-white rounded-2xl py-4 font-black text-sm hover:bg-slate-800 transition-all">Understood</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="flex items-center justify-between mb-12">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Summary</h1>
                  <p className="text-slate-500 font-medium">Monitoring {data.totalCalls.toLocaleString()} calls for {data.date || 'Today'}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleReset} className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200 hover:bg-red-50 hover:text-red-500 transition-all font-bold text-sm text-slate-600">
                    <Trash2 className="w-4 h-4" />
                    Reset
                  </button>
                  <button onClick={fetchData} className="flex items-center gap-2 bg-blue-600 px-5 py-3 rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all font-bold text-white text-sm">
                    <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Sync
                  </button>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <div className="lg:col-span-1 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Incoming Requests</h2>
                    <p className="text-6xl font-black text-slate-900 tabular-nums">{data.totalCalls.toLocaleString()}</p>
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                      <BarChart3 className="text-blue-600 w-6 h-6" />
                    </div>
                    <button onClick={() => setActiveTab('usage')} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-tighter hover:bg-blue-100 transition-all">Analyze →</button>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                    <h2 className="font-extrabold text-lg text-slate-800">High Traffic Routes</h2>
                    <button onClick={() => setActiveTab('usage')} className="text-[10px] font-black px-3 py-1 bg-blue-50 text-blue-600 rounded-full uppercase tracking-widest">Full List</button>
                  </div>
                  <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-left">
                      <tbody className="divide-y divide-slate-100">
                        {data.usage?.slice(0, 5).map((row, index) => (
                          <tr key={index} className="hover:bg-blue-50/20 transition-colors group">
                            <td className="px-8 py-4">
                              <div className="flex items-center gap-2">
                                <code className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/50">{row.endpoint}</code>
                                <button onClick={() => setSelectedEndpoint(row.endpoint)} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-300 hover:text-blue-500"><Info className="w-3.5 h-3.5" /></button>
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

              {/* Order Recovery traces */}
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                    <h2 className="font-extrabold text-lg text-slate-800">Order Recovery Traces</h2>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {audits.slice(0, 5).map((audit, index) => (
                        <tr key={index} className="hover:bg-slate-50/50">
                          <td className="px-8 py-4">
                            <span className="font-bold text-slate-700">{audit.vendorId?.businessName || 'Merchant'}</span>
                          </td>
                          <td className="px-8 py-4 text-right text-xs font-bold text-slate-400 tabular-nums">
                            {new Date(audit.timestamp).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="mb-12">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Live Request Hub</h1>
                <p className="text-slate-500 font-medium">Granular traffic analysis for all {data.usage?.length || 0} endpoints.</p>
              </header>

              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Route</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Invocations</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.usage?.map((row, index) => {
                      const pct = data.totalCalls > 0 ? ((row.count / data.totalCalls) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={index} className="hover:bg-blue-50/10 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <code className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl">{row.endpoint}</code>
                              <button onClick={() => setSelectedEndpoint(row.endpoint)} className="p-1.5 hover:bg-blue-100 rounded-full text-blue-300 hover:text-blue-600 transition-colors"><Info className="w-4 h-4" /></button>
                              <span className="text-[9px] font-black bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full">{row.app || 'API'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right font-black text-slate-800 tabular-nums">{row.count.toLocaleString()}</td>
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-end gap-3 text-xs font-black text-slate-500">
                              <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600" style={{ width: `${pct}%` }} />
                              </div>
                              {pct}%
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'catalog' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="mb-12">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">API Documentation</h1>
                <p className="text-slate-500 font-medium">Technical catalog of Getzio services and business logic.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                {Object.entries(ENDPOINT_DESCRIPTIONS).map(([path, info]) => (
                  <div key={path} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 hover:border-blue-200 transition-all group">
                    <div className="flex items-start justify-between mb-6">
                      <div className="p-3 bg-blue-50 rounded-2xl group-hover:scale-110 transition-transform">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <code className="text-[10px] font-black bg-slate-50 px-3 py-1 rounded-full text-slate-400 font-mono italic">{path}</code>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">{info.title}</h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">{info.purpose}</p>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Live Efficiency</p>
                      <p className="text-emerald-600 text-xs font-bold leading-relaxed">{info.optimization || 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'focus-todo' && <FocusTodo />}
          {activeTab === 'api-insights' && <ApiInsights api={api} />}
        </div>
      </main>
    </div>
  );
}

export default App;
