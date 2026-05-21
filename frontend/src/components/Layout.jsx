import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database, 
  Network, 
  BookOpen, 
  RefreshCw, 
  Terminal, 
  Clock, 
  Activity, 
  DatabaseZap, 
  Cpu
} from 'lucide-react';
import { useSCADAStore } from '../store/useSCADAStore';

export default function Layout({ children }) {
  const location = useLocation();
  const { kpis, loading } = useSCADAStore();
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  // High-tech active clock
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const menuItems = [
    { name: 'Dashboard Principal', path: '/', icon: LayoutDashboard },
    { name: 'Normalización Educativa', path: '/normalization', icon: Network },
    { name: 'Modelo ER (Lógico/Físico)', path: '/erd', icon: DatabaseZap },
    { name: 'Diccionario de Datos', path: '/dictionary', icon: BookOpen },
    { name: 'Consola de Migración ETL', path: '/migration', icon: RefreshCw },
    { name: 'Playground Studio SQL', path: '/playground', icon: Terminal }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-cyber-950 font-sans text-slate-100">
      {/* 1. Sidebar Container */}
      <aside className="w-72 bg-cyber-900/90 border-r border-cyber-800/80 flex flex-col justify-between backdrop-blur-lg">
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-cyber-800/80 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyber-primary/10 border border-cyber-primary/20 text-cyber-primary animate-pulse-fast-once">
              <Cpu size={24} />
            </div>
            <div>
              <h1 className="font-mono font-bold text-lg leading-none tracking-wider text-slate-100 uppercase">
                SCADA <span className="text-cyber-primary glow-text-primary">IOT</span>
              </h1>
              <span className="text-[10px] font-mono text-cyan-400/70 tracking-widest uppercase">
                Data Platform v2.0
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group ${
                    isActive 
                      ? 'bg-cyber-primary/10 border border-cyber-primary/30 text-cyber-primary shadow-sm shadow-cyber-primary/10' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-cyber-800/40 border border-transparent'
                  }`}
                >
                  <Icon size={18} className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-cyber-primary' : 'text-slate-400 group-hover:text-cyan-400'}`} />
                  <span className="font-sans tracking-wide">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Database Status Widget Footer */}
        <div className="p-4 border-t border-cyber-800/80 bg-cyber-950/40">
          <div className="glass-card p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyber-primary animate-ping-once"></span>
                ONLINE
              </span>
              <span className="text-[10px] bg-cyber-800 px-1.5 py-0.5 rounded text-cyan-400">
                SQLITE/PG
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              <div className="flex justify-between">
                <span>MEDICIONES:</span>
                <span className="text-slate-300 font-bold">{loading ? '...' : kpis.total_readings}</span>
              </div>
              <div className="flex justify-between">
                <span>ANOMALÍAS:</span>
                <span className="text-cyber-danger font-bold">{loading ? '...' : kpis.total_anomalies}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <header className="h-16 bg-cyber-900/40 border-b border-cyber-800/50 flex items-center justify-between px-8 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <Activity size={16} className="text-cyber-primary animate-pulse-once" />
            <h2 className="text-sm font-mono tracking-wider text-slate-400 uppercase">
              Control & Supervision Room
            </h2>
          </div>

          <div className="flex items-center gap-6">
            {/* Clock Widget */}
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-cyber-900/80 px-3 py-1.5 border border-cyber-800 rounded-lg">
              <Clock size={14} className="text-cyber-secondary" />
              <span>{time}</span>
            </div>
            
            {/* Operator Tag */}
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-cyber-900/80 px-3 py-1.5 border border-cyber-800 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-primary"></span>
              <span>Operador: Yesid Avila</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
