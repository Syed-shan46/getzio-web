import React, { useState, useEffect } from 'react';
import { 
  BarChart, Activity, Zap, HardDrive, Package, 
  Settings, Search, Store, Info, AlertTriangle,
  ArrowUpRight, Clock, ShieldCheck, Gauge
} from 'lucide-react';

const ENDPOINT_METADATA = {
  // --- CORE & HOME ---
  '/api/home/layout': {
    purpose: 'Aggregates the entire mobile landing page into one high-perf operation.',
    features: 'Featured Vendors, Menus, Chips, and Banners.',
    optimization: 'NodeCache (5-min TTL). Saves ~4.5M DB reads/month.'
  },

  // --- ORDER & LOGISTICS ---
  '/api/order/create': {
    purpose: 'Transactional gateway for processing new user checkouts.',
    features: 'Payments integration, automated tax calculations.',
    optimization: 'Atomic MongoDB writes. Ensures no orphaned orders on failure.'
  },
  '/api/order/vendor/pending': {
    purpose: 'Live recovery loop for active merchant orders.',
    features: 'Dashboard alerts, real-time ticket management.',
    optimization: 'Strict Cooldown (120s). Prevents backend thrashing during app restarts.'
  },
  '/api/order/vendor': {
    purpose: 'Merchant sales history and analytics source.',
    features: 'Daily/Weekly revenue logs, customer history.',
    optimization: 'Status-Compound Indexing. Sub-50ms lookup across millons of orders.'
  },
  '/api/order/:id/status': {
    purpose: 'Core state-machine for order lifecycle management.',
    features: 'Accept/Decline, Mark Ready, Mark Picked.',
    optimization: 'Async Notification Triggers. DB updates first; Push signals follow in background.'
  },
  '/api/delivery/assign': {
    purpose: 'Logistics coordinator for driver dispatch.',
    features: 'Assigning delivery boys to active orders.',
    optimization: 'Lean Dispatch Logic. Minimizes DB locks during multi-party assignment.'
  },

  // --- CUSTOMER & SOCIAL ---
  '/api/user/status': {
    purpose: 'Social story feed for merchant engagement.',
    features: 'Ephemeral stories, promotional highlights.',
    optimization: 'Profile Joining (Aggregation). Fetches story + merchant logo in 1 hit.'
  },
  '/api/user/auth/firebase': {
    purpose: 'Stateless social identity and session gateway.',
    features: 'Google/Apple login, multi-device cross-sync.',
    optimization: 'Zero-DB Validation. Only touches DB on registration, not per-request.'
  },
  '/api/user/auth/send-otp': {
    purpose: 'Identity protection and SMS verification.',
    features: 'Phone auth, account recovery.',
    optimization: 'IP-based Throttling. Protects against SMS cost fraud.'
  },
  '/api/user/profile/address': {
    purpose: 'Logistics fulfillment metadata management.',
    features: 'Multiple address saves, geo-tagging.',
    optimization: 'User Sub-document optimization. Zero overhead on main profile loads.'
  },
  '/api/user/profile/fcm-token': {
    purpose: 'Real-time cross-platform signaling registration.',
    features: 'Instant order alerts, marketing pushes.',
    optimization: 'Change-detection logic. Only writes to DB if the token is new.'
  },

  // --- PAYMENTS & WALLET ---
  '/api/payment/initiate': {
    purpose: 'PhonePe SDK gateway for financial transactions.',
    features: 'Secure checkout, dynamic payment links.',
    optimization: 'Transaction Locking. Prevents double-payment race conditions.'
  },
  '/api/payment/status/:id': {
    purpose: 'Verifies transaction integrity with the bank.',
    features: 'Payment success verification, refund triggers.',
    optimization: 'Bank-Side Polling. Verified via secure header hashes.'
  },
  '/api/wallet/:id': {
    purpose: 'Virtual currency and merchant balance management.',
    features: 'Earnings tracking, payout status.',
    optimization: 'Pre-computed balances. Avoids heavy summation of millions of txs.'
  },

  // --- MERCHANT & INVENTORY ---
  '/api/vendor/status': {
    purpose: 'Store-level availability and schedule management.',
    features: 'Auto-Open/Close, manual overrides.',
    optimization: 'Partial Projection. Ignores heavy profile images during status checks.'
  },
  '/api/offline-menu/items': {
    purpose: 'Inventory synchronization for non-digital stock.',
    features: 'Stock status, menu pricing.',
    optimization: 'Bulk Sync (Upsert). Updates 100+ items in a single DB operation.'
  },
  '/api/basic-vendor/following': {
    purpose: 'Customer interest and loyalty tracking.',
    features: 'Personalized "Followed Stores" feed.',
    optimization: 'Covering Index. Returns data directly from index without touching docs.'
  },
  '/api/reviews/bulk-stats': {
    purpose: 'Social proof aggregation for discovery screens.',
    features: 'Star ratings on search/list views.',
    optimization: 'Aggregated Bucketing. Replaces 50+ queries with 1 batch lookup.'
  },

  // --- ADMIN & INFRA ---
  '/api/admin/vendors': {
    purpose: 'Platform-level tenant management.',
    features: 'Approval queues, merchant onboarding.',
    optimization: 'Compound Paginated Index. Fast sorting by onboard-date.'
  },
  '/api/admin/api-insights/data': {
    purpose: 'Powers this Intelligence Dashboard.',
    features: 'Cost-analysis, performance telemetry.',
    optimization: 'High-speed metrics aggregation. Compute-heavy but infrequent.'
  },
  '/api/todos': {
    purpose: 'Internal task and priority management.',
    features: 'Admin productivity tracking.',
    optimization: 'Schema-less flexibility. Minimal schema overhead.'
  },
  '/api/infra/check': {
    purpose: 'Global health-check and status monitoring.',
    features: 'Uptime monitoring, server heartbeat.',
    optimization: 'Route zero-latency. No DB, no auth; pure response test.'
  },
  // --- VERTICAL SPECIFIC ---
  '/api/grocery/products/:vendorId': {
    purpose: 'Bulk retrieval of essential items for grocery stalls.',
    features: 'Inventory browsing, price comparisons.',
    optimization: 'Paginated streaming. Prevents memory spikes when loading large local inventories.'
  },
  '/api/restaurant/menu/:vendorId': {
    purpose: 'Full menu delivery for food establishments.',
    features: 'Dish descriptions, add-on management, veg/non-veg tags.',
    optimization: 'Menu Object Flattening. Efficiently delivers complex hierarchical menus in one hit.'
  },
  '/api/restaurant/menu/:menuId/status': {
    purpose: 'Instant dish-availability toggle for kitchens.',
    features: 'Real-time menu updates (Sold Out logic).',
    optimization: 'Targeted single-field write. Updates availability without re-validating the full menu schema.'
  }
};

const ApiInsights = ({ api }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchInsights = async () => {
    try {
      const res = await api.get('/admin/api-insights/data');
      setData(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error("[Telemetry Error Detail]:", err);
      if (err.response?.status === 403) {
        setError("ADMIN_REQUIRED: Your account does not have permission to view telemetry.");
      } else {
        setError("OFFLINE: Connecting to Render... Ensure deployment is complete.");
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    const interval = setInterval(fetchInsights, 45000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
      <Gauge className="w-12 h-12 text-blue-500 mb-4 animate-spin" />
      <p className="font-black text-slate-500 uppercase tracking-widest text-xs">Analyzing Network Traffic...</p>
    </div>
  );

  if (error) return (
    <div className="p-8 bg-red-50 border border-red-100 rounded-[2rem] text-center">
      <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
      <h3 className="font-black text-red-900 mb-2">TELEMETRY_OFFLINE</h3>
      <p className="text-red-700 font-medium text-sm">{error}</p>
    </div>
  );

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const kb = bytes / 1024;
    return kb > 1 ? `${kb.toFixed(1)} KB` : `${bytes} B`;
  };

  const getCostLevel = (size, calls) => {
    const score = (size / 1024) * calls;
    if (score > 1000) return { label: 'High Cost', color: 'text-red-500', bg: 'bg-red-500' };
    if (score > 200) return { label: 'Medium', color: 'text-amber-500', bg: 'bg-amber-500' };
    return { label: 'Optimized', color: 'text-emerald-500', bg: 'bg-emerald-500' };
  };

  const overview = data?.overview || {};
  const home = data?.homeBreakdown || {};

  const handleReset = async () => {
    if (!window.confirm("CRITICAL: This will permanently delete all raw telemetry logs. Continue?")) return;
    setLoading(true);
    try {
      await api.delete('/admin/api-insights/reset');
      fetchInsights();
    } catch (err) {
      console.error("Reset failed:", err);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* 0. Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Endpoint Intelligence</h2>
          <p className="text-slate-500 font-medium italic text-sm">Mapping app features to cloud performance & DB cost reduction.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-red-100 text-red-500 rounded-2xl font-bold text-xs hover:bg-red-50 transition-all shadow-sm"
          >
            <AlertTriangle className="w-4 h-4" />
            Reset
          </button>
          <button 
            onClick={fetchInsights}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            <Zap className="w-4 h-4" />
            Live Sync
          </button>
        </div>
      </div>

      {/* 1. Metric Overview Cards (Small) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InsightCard 
          icon={Zap} 
          label="Network Latency" 
          value={`${Math.round(overview.avgResponseTime || 0)}ms`} 
          subtext="Target: <200ms"
          color="blue"
        />
        <InsightCard 
          icon={HardDrive} 
          label="Payload Efficiency" 
          value={formatSize(overview.avgSize)} 
          subtext="Avg Document Size"
          color="indigo"
        />
        <InsightCard 
          icon={Package} 
          label="Cumulative Egress" 
          value={formatSize(overview.totalPayload)} 
          subtext="Historical Aggregate"
          color="emerald"
        />
        <InsightCard 
          icon={ShieldCheck} 
          label="Structural Health" 
          value={`${Math.round((overview.successCount / (overview.totalCalls || 1)) * 100)}%`} 
          subtext="Cumulative Integrity"
          color="amber"
          isSuccess
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. Home Layout Deep-Dive (Compact) */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-50 rounded-xl">
                <Settings className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-none mb-1">Infrastructure History</h3>
                <p className="text-[10px] font-medium text-slate-400">Section weighting for /api/home/layout</p>
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
              home.cacheHitRate > 70 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            }`}>
              {Math.round(home.cacheHitRate || 0)}% Efficiency
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <BreakdownMetric label="Vendors" count={Math.round(home.avgVendors || 0)} max={15} />
            <BreakdownMetric label="Products" count={Math.round(home.avgProducts || 0)} max={60} />
            <BreakdownMetric label="Avg Size" count={Math.round((home.avgSize || 0)/1024)} suffix="KB" max={100} />
            <BreakdownMetric label="DB Opt" count={1} max={5} />
          </div>

          <div className="mt-10 p-6 bg-blue-50/30 rounded-[2rem] border border-blue-100 flex items-center gap-6">
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase text-blue-500 mb-2">Long-term DB Savings</p>
              <p className="text-slate-700 font-bold leading-relaxed italic">
                By maintaining these optimizations over time, each month of uptime saves equivalent to ~150GB of raw database bandwidth.
              </p>
            </div>
            <ArrowUpRight className="w-10 h-10 text-blue-200" />
          </div>
        </div>

        {/* 3. Real-time Volume */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-xl text-white relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-blue-400 mb-6 font-black uppercase tracking-widest text-xs">
              <Activity className="w-4 h-4" />
              Traffic Velocity
            </div>
            <div className="space-y-6">
              {data.hourlyTraffic?.slice(-6).map((h, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span>{h._id}:00</span>
                    <span className="text-blue-400">{h.calls} Calls</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-1000" 
                      style={{ width: `${Math.min(100, (h.calls / (overview.totalCalls || 1)) * 500)}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10 relative z-10">
             <p className="text-[10px] font-black text-blue-300 uppercase mb-1">Archival Note</p>
             <p className="text-xs text-slate-300">Data reflects historical totals. High-volume periods guide scaling decisions.</p>
          </div>
          <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full" />
        </div>
      </div>

      {/* 4. Endpoint Performance Table (Compact) */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
           <h3 className="text-lg font-black text-slate-900">Historical Health Archive</h3>
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
             <Info className="w-4 h-4" />
             Timeline: Cumulative
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">App Feature / Route</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Volume</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Speed</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Payload</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.endpoints?.map((ep, idx) => {
                const cost = getCostLevel(ep.avgSize, ep.calls);
                const metadata = ENDPOINT_METADATA[ep._id.split('?')[0]] || null;
                const isExpanded = expandedRow === idx;

                return (
                  <React.Fragment key={idx}>
                    <tr 
                      onClick={() => setExpandedRow(isExpanded ? null : idx)}
                      className={`cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                           <div className={`w-2 h-2 rounded-full ${ep.errorRate > 10 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                           <div>
                             <p className="font-black text-slate-700 text-sm">{ep._id.split('?')[0]}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                               {metadata ? metadata.purpose.slice(0, 40) + '...' : 'System Endpoint'}
                             </p>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-slate-900 tabular-nums">{ep.calls.toLocaleString()}</td>
                      <td className="px-8 py-6 text-right font-bold text-slate-600 tabular-nums">{Math.round(ep.avgTime)}ms</td>
                      <td className="px-8 py-6 text-right font-bold text-slate-600 tabular-nums">{formatSize(ep.avgSize)}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center">
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${cost.bg} text-white`}>
                            {cost.label}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && metadata && (
                      <tr className="bg-blue-50/20">
                        <td colSpan={5} className="px-8 py-8 border-b border-blue-100">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2">
                              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Operational Purpose</p>
                              <p className="text-sm font-bold text-slate-700 leading-relaxed">{metadata.purpose}</p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Impacted Features</p>
                              <p className="text-sm font-bold text-slate-700 leading-relaxed">{metadata.features}</p>
                            </div>
                            <div className="bg-white/60 p-4 rounded-2xl border border-blue-100 space-y-2">
                              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">💰 DB Cost Reduction Logic</p>
                              <p className="text-sm font-black text-blue-700 italic">{metadata.optimization}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

const InsightCard = ({ icon: Icon, label, value, subtext, color, isSuccess }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
    <div className={`w-10 h-10 bg-${color}-50 rounded-xl flex items-center justify-center mb-4`}>
       <Icon className={`w-5 h-5 text-${color}-600`} />
    </div>
    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p>
    <p className="text-2xl font-black text-slate-900">{value}</p>
    <p className={`text-[10px] font-bold ${isSuccess ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400'} px-2 py-0.5 rounded-full w-fit mt-1`}>
      {subtext}
    </p>
  </div>
);

const BreakdownMetric = ({ label, count, suffix = "", max }) => {
  const pct = Math.min(100, (count / max) * 100);
  return (
    <div className="space-y-3">
       <div>
         <p className="text-[10px] font-black uppercase text-slate-400">{label}</p>
         <p className="text-xl font-black text-slate-800">{count}{suffix}</p>
       </div>
       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
         <div className={`h-full rounded-full ${pct > 90 ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${pct}%` }} />
       </div>
    </div>
  );
};

export default ApiInsights;
