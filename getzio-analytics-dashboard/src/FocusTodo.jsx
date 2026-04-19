import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Trash2, CheckCircle2, Circle, 
  Flame, Zap, Sprout, Target, 
  Loader2, Sparkles, RefreshCw,
  ChevronUp, ChevronDown
} from 'lucide-react';

const BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5005/api' 
  : 'https://getzio-backend-dev.onrender.com/api';

const TODO_API = `${BASE_URL}/todos`;

// Motivational quotes rotation
const MOTIVATIONS = [
  "Small wins → Big success 🚀",
  "Discipline beats motivation ⚡",
  "Do it now. Not later. 🔥",
  "Execution is everything. 🎯",
  "Build the future today. 🌱",
  "No tasks. No excuses. Start now. 🧱",
  "Stay hungry. Stay foolish. 🍎"
];

const PRIORITY_CONFIG = {
  high: { 
    icon: <Flame className="w-5 h-5" />, 
    color: 'text-orange-400', 
    bg: 'bg-orange-500/10',
    card: 'bg-slate-900/60 border-orange-500/30 hover:border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.1)]',
    check: 'text-orange-400'
  },
  medium: { 
    icon: <Zap className="w-5 h-5" />, 
    color: 'text-indigo-400', 
    bg: 'bg-indigo-500/10',
    card: 'bg-slate-900/60 border-indigo-500/30 hover:border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.1)]',
    check: 'text-indigo-400'
  },
  low: { 
    icon: <Sprout className="w-5 h-5" />, 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/10',
    card: 'bg-slate-900/60 border-emerald-500/30 hover:border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]',
    check: 'text-emerald-400'
  }
};

const FocusTodo = () => {
  const [todos, setTodos] = useState([]);
  const [visionPlans, setVisionPlans] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [vTitle, setVTitle] = useState('');
  const [vSub, setVSub] = useState('');
  const [priority, setPriority] = useState('medium');
  const [motivation, setMotivation] = useState(MOTIVATIONS[0]);
  const [loading, setLoading] = useState(true);
  const [showWinEffect, setShowWinEffect] = useState(false);

  const getRank = (progress, total) => {
    if (total === 0) return { title: "DORMANT", color: "text-slate-500", glow: "shadow-none" };
    if (progress === 0) return { title: "INITIATE", color: "text-blue-400", glow: "shadow-blue-500/20" };
    if (progress < 40) return { title: "SPECIALIST", color: "text-indigo-400", glow: "shadow-indigo-500/30" };
    if (progress < 70) return { title: "ELITE EXEC", color: "text-purple-400", glow: "shadow-purple-500/40" };
    if (progress < 100) return { title: "VETERAN", color: "text-pink-400", glow: "shadow-pink-500/50" };
    return { title: "MASTER ARCHITECT", color: "text-orange-400", glow: "shadow-orange-500/70" };
  };

  useEffect(() => {
    fetchData();
    setMotivation(MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)]);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [todoRes, visionRes] = await Promise.all([
        axios.get(TODO_API),
        axios.get(`${BASE_URL}/future-plans`)
      ]);
      setTodos(todoRes.data.data);
      setVisionPlans(visionRes.data.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    try {
      const res = await axios.post(TODO_API, { title: newTodo, description: newDesc, priority });
      if (res.data.data) {
        setTodos([res.data.data, ...todos]);
        setNewTodo(''); setNewDesc(''); setPriority('medium');
      }
    } catch (err) { console.error(err); }
  };

  const handleAddVision = async (e) => {
    e.preventDefault();
    if (!vTitle.trim()) return;
    try {
      const res = await axios.post(`${BASE_URL}/future-plans`, { title: vTitle, subtitle: vSub });
      if (res.data.data) {
        setVisionPlans([res.data.data, ...visionPlans]);
        setVTitle(''); setVSub('');
      }
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    const oldTodos = [...todos];
    setTodos(todos.filter(t => t._id !== id));
    try {
      await axios.delete(`${TODO_API}/${id}`);
    } catch (err) {
      setTodos(oldTodos);
    }
  };

  const deleteVision = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/future-plans/${id}`);
      setVisionPlans(visionPlans.filter(p => p._id !== id));
    } catch (err) { console.error(err); }
  };

  const handleToggle = async (id) => {
    const todo = todos.find(t => t._id === id);
    const becomingCompleted = !todo.isCompleted;
    setTodos(todos.map(t => t._id === id ? { ...t, isCompleted: !t.isCompleted } : t));
    if (becomingCompleted) { setShowWinEffect(true); setTimeout(() => setShowWinEffect(false), 1000); }
    try { await axios.patch(`${TODO_API}/${id}/toggle`, {}); } catch (err) { fetchData(); }
  };

  const handleMove = async (id, direction) => {
    const idx = todos.findIndex(t => t._id === id);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === todos.length - 1) return;

    const newTodos = [...todos];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newTodos[idx], newTodos[swapIdx]] = [newTodos[swapIdx], newTodos[idx]];
    
    // Optimistically update local state
    setTodos(newTodos);

    // Sync new order to backend
    const orderings = newTodos.map((t, index) => ({ id: t._id, order: index }));
    try {
      await axios.post(`${TODO_API}/reorder`, { orderings });
    } catch (err) {
      console.error('Reorder failed:', err);
      fetchData(); // Rollback
    }
  };

  const completedCount = todos.filter(t => t.isCompleted).length;
  const progress = todos.length > 0 ? (completedCount / todos.length) * 100 : 0;
  const rank = getRank(progress, todos.length);

  return (
    <div className={`max-w-6xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 relative ${showWinEffect ? 'scale-[1.01]' : 'scale-100'} transition-transform duration-300`}>
      
      {/* 1. Compact Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 relative">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className={`bg-white/5 border border-white/10 ${rank.color} px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 backdrop-blur-md shadow-2xl ${rank.glow}`}>
              <Target className="w-3 h-3" /> {rank.title}
            </span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter leading-none mb-2">
            CONQUER <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600">THE DAY.</span>
          </h1>
          <p className="text-slate-500 font-bold text-xs italic tracking-tight max-w-sm">
            "{motivation}"
          </p>
        </div>

        <div className="relative group md:w-64">
          <div className="relative bg-black/40 backdrop-blur-3xl p-4 rounded-[2rem] border border-white/10 shadow-2xl space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Execution Index</p>
                <h4 className="text-2xl font-black text-white leading-none">{Math.round(progress)}%</h4>
              </div>
              <p className="text-sm font-black text-indigo-400 tabular-nums">{completedCount} / {todos.length}</p>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
               <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-1000" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: Execution Deck (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleAddTodo} className="group relative bg-white/[0.03] backdrop-blur-2xl p-2 rounded-[2rem] border border-white/10 focus-within:border-indigo-500/50 transition-all">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex flex-col p-3 gap-1">
                <input
                  type="text"
                  placeholder="Next Primary Objective..."
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  className="bg-transparent text-white font-black text-lg outline-none placeholder:text-slate-800 w-full tracking-tight"
                />
                <input
                  type="text"
                  placeholder="Operational details (optional)"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="bg-transparent text-slate-600 font-bold text-[10px] outline-none placeholder:text-slate-900 w-full"
                />
              </div>
              
              <div className="flex items-center gap-3 p-2 bg-black/40 rounded-[1.5rem] border border-white/5">
                <div className="flex flex-col px-3 text-left">
                  <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Protocol</span>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="bg-transparent text-indigo-400 font-black text-[10px] uppercase tracking-widest outline-none appearance-none cursor-pointer">
                    <option value="high">🔥 OMEGA</option>
                    <option value="medium">⚡ ALPHA</option>
                    <option value="low">🌱 BETA</option>
                  </select>
                </div>
                <button type="submit" disabled={!newTodo.trim()} className="bg-white text-black hover:bg-white/90 py-3 px-6 rounded-xl transition-all active:scale-95 flex items-center gap-2">
                  <Plus className="w-4 h-4" /><span className="font-black text-[10px] uppercase">Deploy</span>
                </button>
              </div>
            </div>
          </form>

          <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-40"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>
            ) : todos.map((todo) => {
              const config = PRIORITY_CONFIG[todo.priority] || PRIORITY_CONFIG.medium;
              return (
                <div key={todo._id} className={`group flex items-center gap-4 p-4 rounded-[2rem] border transition-all duration-500 ${todo.isCompleted ? 'bg-black/40 border-white/5 opacity-30 grayscale' : `${config.card}`}`}>
                  <div className="flex flex-col gap-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleMove(todo._id, 'up')} className="p-1 hover:text-indigo-400 text-slate-700 transition-colors"><ChevronUp className="w-3 h-3" /></button>
                    <button onClick={() => handleMove(todo._id, 'down')} className="p-1 hover:text-indigo-400 text-slate-700 transition-colors"><ChevronDown className="w-3 h-3" /></button>
                  </div>
                  <button onClick={() => handleToggle(todo._id)} className={todo.isCompleted ? 'text-slate-800' : config.check}>
                    {todo.isCompleted ? <CheckCircle2 className="w-8 h-8" /> : <Circle className="w-8 h-8 opacity-40" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-base font-black truncate ${todo.isCompleted ? 'text-slate-600 line-through' : 'text-white'}`}>{todo.title}</p>
                    {todo.description && <p className="text-[10px] font-bold text-slate-500 truncate">{todo.description}</p>}
                  </div>
                  <button onClick={() => handleDelete(todo._id)} className="p-2 text-slate-800 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Vision Deck (1 Col) */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Target className="w-20 h-20 text-white" /></div>
            <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> MISSION VISION
            </h3>
            
            <form onSubmit={handleAddVision} className="space-y-3 mb-6">
              <input 
                type="text" placeholder="Future Plan Title..." value={vTitle} onChange={(e)=>setVTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-black text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700"
              />
              <input 
                type="text" placeholder="Optional vision notes..." value={vSub} onChange={(e)=>setVSub(e.target.value)}
                className="w-full bg-transparent px-4 text-[10px] font-bold text-slate-500 outline-none placeholder:text-slate-800"
              />
              <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-900/20">
                Seal the Vision
              </button>
            </form>

            <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
              {visionPlans.length === 0 ? (
                <div className="text-center py-10 opacity-20"><p className="text-[10px] font-black uppercase tracking-widest text-white">No Vision Logged</p></div>
              ) : visionPlans.map(plan => (
                <div key={plan._id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl group/plan relative">
                  <button onClick={()=>deleteVision(plan._id)} className="absolute top-2 right-2 opacity-0 group-hover/plan:opacity-100 p-1 text-slate-700 hover:text-red-500 transition-all">
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <p className="text-sm font-black text-white mb-1 leading-tight">{plan.title}</p>
                  {plan.subtitle && <p className="text-[9px] font-bold text-slate-500 italic">"{plan.subtitle}"</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/5 text-center italic relative overflow-hidden group">
             <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full translate-y-10 group-hover:translate-y-0 transition-transform duration-1000" />
             <p className="text-xs font-bold text-slate-400 relative z-10 leading-relaxed">
               "The best way to predict the future is to create it."
             </p>
             <div className="mt-3 text-[8px] font-black uppercase tracking-widest text-indigo-500 relative z-10">— ARCHITECT PROTOCOL</div>
          </div>
        </div>
      </div>

      {/* 4. Persistence Status */}
      {!loading && todos.length > 0 && (
        <div className="flex flex-col items-center gap-4 pt-10">
          <div className="flex items-center gap-2 text-slate-800 text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap">
            <RefreshCw className="w-3 h-3 animate-spin-slow" /> Neural Sync Active
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-fast {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        .animate-pulse-fast {
          animation: pulse-fast 0.5s ease-in-out infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.01);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.2);
        }
      `}} />
    </div>
  );
};

export default FocusTodo;
