import React, { useEffect, useRef } from 'react';
import { useSCADAStore } from '../store/useSCADAStore';
import { 
  RefreshCw, 
  Terminal as TermIcon, 
  Database, 
  FileCode, 
  ArrowRight, 
  CheckCircle2, 
  Server,
  Hourglass,
  Gauge
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Migration() {
  const { 
    migrationLoading, 
    migrationLogs, 
    migrationSummary, 
    runMigration, 
    fetchMigrationLogs 
  } = useSCADAStore();

  const terminalEndRef = useRef(null);

  // Auto-scroll the terminal logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [migrationLogs]);

  // Load latest logs on mount
  useEffect(() => {
    fetchMigrationLogs();
  }, []);

  const handleRunETL = () => {
    runMigration();
  };

  // Pipeline phases status based on state
  const getPhaseStatus = (phase) => {
    if (migrationLoading) {
      if (phase === 'extract') return 'active';
      if (phase === 'transform') {
        return migrationLogs.length > 5 ? 'active' : 'pending';
      }
      if (phase === 'load') {
        return migrationLogs.length > 15 ? 'active' : 'pending';
      }
    }
    
    if (migrationSummary) {
      return 'success';
    }
    
    return 'idle';
  };

  const phases = [
    { 
      id: 'extract', 
      name: 'Extracción (Extract)', 
      desc: 'Lectura del dump SQL MySQL de origen (`sensores_normalizado_mysql.sql`) y división de tokens.',
      icon: FileCode 
    },
    { 
      id: 'transform', 
      name: 'Transformación (Transform)', 
      desc: 'Mapeo de tipos de datos, limpieza de comillas y formateo de cadenas de fecha/hora.',
      icon: RefreshCw 
    },
    { 
      id: 'load', 
      name: 'Carga Batch (Load)', 
      desc: 'Inserción transaccional atómica optimizada mediante SQLAlchemy Async a la base de datos de producción.',
      icon: Database 
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-wider text-slate-100 uppercase flex items-center gap-2">
            <RefreshCw className={`text-cyber-primary ${migrationLoading ? 'animate-spin' : ''}`} />
            Consola de Migración ETL
          </h1>
          <p className="text-sm text-slate-400 font-sans mt-1">
            Gestión y ejecución programática del flujo de datos (Extracción, Transformación y Carga) desde MySQL Legacy a PostgreSQL/SQLite.
          </p>
        </div>
        
        <button
          onClick={handleRunETL}
          disabled={migrationLoading}
          className={`flex items-center gap-2 px-6 py-3 font-mono text-xs font-bold tracking-wider rounded-lg border transition-all ${
            migrationLoading 
              ? 'bg-cyber-primary/5 border-cyber-primary/20 text-cyber-primary cursor-wait' 
              : 'bg-cyber-primary/10 border-cyber-primary/30 text-cyber-primary hover:bg-cyber-primary/20 cursor-pointer shadow-lg hover:shadow-cyber-primary/10'
          }`}
        >
          <RefreshCw size={16} className={migrationLoading ? 'animate-spin' : ''} />
          {migrationLoading ? 'EJECUTANDO ETL PIPELINE...' : 'INICIAR MIGRACIÓN ETL'}
        </button>
      </div>

      {/* 1. Interactive Pipeline Visualizer */}
      <div className="glass-card p-6 border-cyber-800/80 bg-cyber-900/10 space-y-6">
        <h2 className="text-base font-mono font-bold text-slate-200 uppercase flex items-center gap-2 border-b border-cyber-800/50 pb-3">
          <Server size={18} className="text-cyber-secondary" />
          Pipeline de Integración Industrial
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-center">
          {phases.map((phase, idx) => {
            const status = getPhaseStatus(phase.id);
            const Icon = phase.icon;
            
            return (
              <React.Fragment key={phase.id}>
                {/* Phase Card */}
                <div className={`col-span-1 lg:col-span-1 p-5 rounded-xl border font-mono transition-all relative ${
                  status === 'active' 
                    ? 'bg-cyber-primary/5 border-cyber-primary/50 shadow-md shadow-cyber-primary/5 ring-1 ring-cyber-primary/30' 
                    : status === 'success'
                    ? 'bg-emerald-500/5 border-emerald-500/35 text-slate-300'
                    : 'bg-cyber-950/40 border-cyber-800 text-slate-500'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">FASE 0{idx + 1}</span>
                    {status === 'active' && <span className="w-2 h-2 rounded-full bg-cyber-primary animate-ping-once"></span>}
                    {status === 'success' && <CheckCircle2 size={14} className="text-emerald-400" />}
                    {status === 'idle' && <Hourglass size={12} className="text-slate-500" />}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg border ${
                      status === 'active' 
                        ? 'bg-cyber-primary/10 border-cyber-primary/20 text-cyber-primary' 
                        : status === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-cyber-800/40 border-cyber-800'
                    }`}>
                      <Icon size={18} className={status === 'active' ? 'animate-pulse-once' : ''} />
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold ${status === 'active' ? 'text-cyber-primary' : status === 'success' ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {phase.id.toUpperCase()}
                      </h4>
                      <span className="text-[9px] text-slate-500">{phase.name}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans mt-3 leading-relaxed">{phase.desc}</p>
                </div>

                {/* Arrow Connector (Only between cards) */}
                {idx < 2 && (
                  <div className="col-span-1 lg:col-span-1 flex justify-center py-2 lg:py-0 text-slate-600">
                    <ArrowRight size={24} className={`hidden lg:block ${migrationLoading ? 'text-cyber-primary animate-pulse-once' : ''}`} />
                    <span className="lg:hidden text-xs font-mono font-bold tracking-widest">↓ ENLACE DE DATOS ↓</span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 2. Audit Metrics & Summary (displayed when available) */}
      {migrationSummary && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          {/* Summary Card */}
          <div className="glass-card p-6 border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between col-span-1">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Duración ETL</span>
              <h3 className="text-2xl font-mono font-bold text-emerald-400">{migrationSummary.duration} segs</h3>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Hourglass size={20} />
            </div>
          </div>

          {/* Records Loaded Card */}
          <div className="glass-card p-6 border-cyber-800/80 flex items-center justify-between col-span-1">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Medidas Cargadas</span>
              <h3 className="text-2xl font-mono font-bold text-slate-200">{migrationSummary.counts.medida || 0}</h3>
            </div>
            <div className="p-3.5 rounded-xl bg-cyber-primary/10 text-cyber-primary">
              <Database size={20} />
            </div>
          </div>

          {/* Encargados Loaded Card */}
          <div className="glass-card p-6 border-cyber-800/80 flex items-center justify-between col-span-1">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Encargados</span>
              <h3 className="text-2xl font-mono font-bold text-slate-200">{migrationSummary.counts.encargado || 0}</h3>
            </div>
            <div className="p-3.5 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Server size={20} />
            </div>
          </div>

          {/* Zones & Sensors Loaded Card */}
          <div className="glass-card p-6 border-cyber-800/80 flex items-center justify-between col-span-1">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Zonas & Sensores</span>
              <h3 className="text-2xl font-mono font-bold text-slate-200">
                {(migrationSummary.counts.zona || 0)} / {(migrationSummary.counts.sensor || 0)}
              </h3>
            </div>
            <div className="p-3.5 rounded-xl bg-purple-500/10 text-purple-400">
              <Gauge size={20} />
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. Live Scrolling Terminal Logs */}
      <div className="glass-card border border-cyber-800/60 overflow-hidden shadow-2xl flex flex-col">
        {/* Terminal Header */}
        <div className="bg-cyber-950 px-5 py-3 border-b border-cyber-800 flex justify-between items-center select-none">
          <div className="flex items-center gap-2">
            <TermIcon size={14} className="text-cyber-primary animate-pulse-once" />
            <span className="font-mono text-xs font-bold text-slate-300">ETL Pipeline Audit Console logs</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="bg-cyber-950/90 p-5 h-80 overflow-y-auto font-mono text-xs text-cyber-primary space-y-2 border-b border-cyber-900 scrollbar-thin">
          {migrationLogs.length > 0 ? (
            migrationLogs.map((log, lIdx) => {
              const isError = log.includes('❌') || log.includes('Error') || log.includes('error');
              const isSuccess = log.includes('✅') || log.includes('Successfully') || log.includes('seeded') || log.includes('complete');
              
              return (
                <div key={lIdx} className={`leading-relaxed ${isError ? 'text-cyber-danger' : isSuccess ? 'text-emerald-400' : 'text-cyan-400/90'}`}>
                  <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                  {log}
                </div>
              );
            })
          ) : (
            <div className="text-slate-600 italic select-none">
              Console idle. Presione el botón superior para desencadenar el pipeline de migración de datos.
            </div>
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>

    </div>
  );
}
