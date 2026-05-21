import React, { useEffect, useRef } from 'react';
import { useSCADAStore } from '../store/useSCADAStore';
import { 
  Thermometer, 
  Droplets, 
  Cpu, 
  MapPin, 
  AlertTriangle, 
  Database,
  TrendingUp,
  Gauge
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';
// GSAP animations removed to prevent repeated visual reflows

export default function Dashboard() {
  const { kpis, zoneStats, sensorComparison, fetchInitialData, loading } = useSCADAStore();

  useEffect(() => {
    fetchInitialData();

    // Auto refresh telemetry every 10 seconds (SCADA simulation!)
    // Only poll when the page is visible to avoid perceived "refreshes" when tab is hidden
    let intervalId = null;

    const startPolling = () => {
      if (intervalId) return;
      intervalId = setInterval(() => {
        if (typeof document === 'undefined' || document.visibilityState === 'visible') {
          fetchInitialData();
        }
      }, 10000);
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') startPolling();
      else stopPolling();
    };

    if (typeof document !== 'undefined') {
      if (document.visibilityState === 'visible') startPolling();
      document.addEventListener('visibilitychange', handleVisibility);
    } else {
      // fallback if document not available
      startPolling();
    }

    return () => {
      stopPolling();
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Animaciones GSAP eliminadas — el render ahora es estático y sin efectos.

  const kpiData = [
    { name: 'Registros Totales', value: kpis.total_readings, icon: Database, color: 'text-cyber-secondary', bg: 'bg-cyber-secondary/10', border: 'border-cyber-secondary/20' },
    { name: 'Temperatura Promedio', value: `${kpis.average_temperature}°C`, icon: Thermometer, color: 'text-cyber-primary', bg: 'bg-cyber-primary/10', border: 'border-cyber-primary/20' },
    { name: 'Humedad Promedio', value: `${kpis.average_humidity}%`, icon: Droplets, color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20' },
    { name: 'Alertas y Anomalías', value: kpis.total_anomalies, icon: AlertTriangle, color: kpis.total_anomalies > 0 ? 'text-cyber-danger glow-text-secondary' : 'text-cyber-primary', bg: 'bg-cyber-danger/10', border: 'border-cyber-danger/20' }
  ];

  return (
    <div className="space-y-8">
      {/* Page Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-wider text-slate-100 uppercase">
            SCADA Operational Dashboard
          </h1>
          <p className="text-sm text-slate-400 font-sans mt-1">
            Visualización y análisis en tiempo real de variables ambientales DHT11 / DHT22.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-cyber-primary/10 border border-cyber-primary/30 text-cyber-primary text-xs font-mono rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-primary animate-ping-once"></span>
            Telemetry Stream: Active
          </span>
        </div>
      </div>

      {/* 1. KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpiData.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className={`dashboard-kpi glass-card glass-card-hover p-6 border ${kpi.border} flex items-center justify-between`}>
              <div className="space-y-1">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">{kpi.name}</span>
                <h3 className="text-3xl font-mono font-bold text-slate-100">{loading ? '...' : kpi.value}</h3>
              </div>
              <div className={`p-4 rounded-xl ${kpi.bg} ${kpi.color}`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Charts & Statistics Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Side: Averages by Zone (Bar Chart) */}
        <div className="dashboard-chart glass-card p-6 col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-cyber-800/50 pb-4">
            <h2 className="text-base font-mono font-bold text-slate-200 uppercase flex items-center gap-2">
              <TrendingUp size={18} className="text-cyber-primary" />
              Comparativa de Temperatura y Humedad por Zona
            </h2>
            <span className="text-xs font-mono text-slate-400 uppercase">Valores Promedio</span>
          </div>

          <div className="h-80 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center font-mono text-slate-400">Loading Telemetry Charts...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zoneStats} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="nombre_zona" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#070c17', borderColor: '#0e182c', borderRadius: '8px', fontFamily: 'monospace' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'monospace' }} />
                  <Bar dataKey="temperatura_promedio" name="Temperatura (°C)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="humedad_promedio" name="Humedad (%)" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Side: Sensor model precision statistics */}
        <div className="dashboard-chart glass-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-cyber-800/50 pb-4">
            <h2 className="text-base font-mono font-bold text-slate-200 uppercase flex items-center gap-2">
              <Gauge size={18} className="text-cyber-secondary" />
              Calibración de Dispositivos (DHT11 vs DHT22)
            </h2>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="font-mono text-slate-400 text-sm">Calibrating devices...</div>
            ) : (
              Object.values(sensorComparison).map((dev, idx) => (
                <div key={idx} className="bg-cyber-950/50 border border-cyber-800/60 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-cyber-850 pb-2">
                    <span className="font-mono text-sm font-bold text-slate-100">{dev.sensor}</span>
                    <span className="text-[10px] bg-cyber-primary/10 border border-cyber-primary/20 px-2 py-0.5 rounded text-cyber-primary font-mono font-bold">
                      {dev.sensor === 'DTH22' ? 'ALTA PRECISIÓN' : 'ESTÁNDAR'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono text-slate-400">
                    <div>
                      <span>TEMP. PROMEDIO</span>
                      <p className="text-base font-bold text-slate-200 mt-0.5">{dev.temperatura_promedio}°C</p>
                    </div>
                    <div>
                      <span>HUMEDAD PROMEDIO</span>
                      <p className="text-base font-bold text-slate-200 mt-0.5">{dev.humedad_promedio}%</p>
                    </div>
                    <div>
                      <span>TEMP. MÍNIMA</span>
                      <p className="text-sm font-semibold text-cyan-400 mt-0.5">{dev.temperatura_minima}°C</p>
                    </div>
                    <div>
                      <span>TEMP. MÁXIMA</span>
                      <p className="text-sm font-semibold text-cyber-danger mt-0.5">{dev.temperatura_maxima}°C</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 3. Zone Reference Matrix */}
      <div className="dashboard-chart glass-card p-6">
        <div className="flex items-center justify-between border-b border-cyber-800/50 pb-4 mb-4">
          <h2 className="text-base font-mono font-bold text-slate-200 uppercase flex items-center gap-2">
            <MapPin size={18} className="text-cyber-primary" />
            Matriz de Referencia Ambiental por Zonas
          </h2>
          <span className="text-xs font-mono text-slate-400 uppercase">Lectura Física vs Setpoint</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs text-slate-300">
            <thead className="bg-cyber-900 border-b border-cyber-800 text-slate-400 uppercase">
              <tr>
                <th className="p-3">Ubicación / Zona</th>
                <th className="p-3 text-center">Ref. Temp Setpoint</th>
                <th className="p-3 text-center">Ref. Humedad Setpoint</th>
                <th className="p-3 text-center">Lectura Temp Real</th>
                <th className="p-3 text-center">Lectura Hum Real</th>
                <th className="p-3 text-center">Total Muestras</th>
                <th className="p-3 text-center">Estado Térmico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-850">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-slate-400">Loading Matrix Rows...</td>
                </tr>
              ) : (
                zoneStats.map((stat, idx) => {
                  const isHigh = stat.temperatura_promedio > (stat.temp_referencia || 30.0);
                  return (
                    <tr key={idx} className="hover:bg-cyber-900/30 transition-colors">
                      <td className="p-3 font-semibold text-slate-100 flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${stat.total_mediciones > 0 ? 'bg-cyber-primary' : 'bg-slate-500'}`}></span>
                        {stat.nombre_zona}
                      </td>
                      <td className="p-3 text-center text-slate-400">{stat.temp_referencia ? `${stat.temp_referencia}°C` : 'N/A'}</td>
                      <td className="p-3 text-center text-slate-400">{stat.humedad_referencia ? `${stat.humedad_referencia}%` : 'N/A'}</td>
                      <td className="p-3 text-center font-bold text-slate-100">{stat.temperatura_promedio}°C</td>
                      <td className="p-3 text-center font-bold text-slate-100">{stat.humedad_promedio}%</td>
                      <td className="p-3 text-center text-cyan-400">{stat.total_mediciones}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isHigh ? 'bg-cyber-danger/10 text-cyber-danger' : 'bg-cyber-primary/10 text-cyber-primary'
                        }`}>
                          {isHigh ? 'CRÍTICO CALOR' : 'ESTABLE NOMINAL'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
