import { create } from 'zustand';

const API_BASE = '/api';

export const useSCADAStore = create((set, get) => ({
  // Data State
  sensors: [],
  zones: [],
  kpis: {
    total_readings: 0,
    total_sensors: 0,
    total_zones: 0,
    average_temperature: 0,
    average_humidity: 0,
    min_temperature: 0,
    max_temperature: 0,
    min_humidity: 0,
    max_humidity: 0,
    total_anomalies: 0
  },
  zoneStats: [],
  sensorComparison: {},
  readings: [],
  
  // Loading & UI States
  loading: false,
  migrationLoading: false,
  migrationLogs: [],
  migrationSummary: null,

  // SQL Playground State
  sqlQuery: 'SELECT * FROM medida LIMIT 20;',
  queryResult: null,
  queryLoading: false,
  queryHistory: [],
  savedQueries: [
    { id: 1, name: 'Temperatura Promedio por Zona', sql: 'SELECT z.nombre_zona, ROUND(AVG(m.valor_temperatura), 2) as temp_promedio\nFROM medida m\nJOIN zona z ON m.id_zona = z.id_zona\nGROUP BY z.nombre_zona\nORDER BY temp_promedio DESC;' },
    { id: 2, name: 'Lecturas Fuera de Rango (Anomalías)', sql: 'SELECT m.id_medicion, m.fecha, m.hora, m.valor_temperatura, z.nombre_zona\nFROM medida m\nJOIN zona z ON m.id_zona = z.id_zona\nWHERE m.valor_temperatura > 33.0 OR m.valor_humedad < 45.0\nORDER BY m.valor_temperatura DESC;' },
    { id: 3, name: 'Análisis Estadístico por Sensor', sql: 'SELECT codigo_sensor, ROUND(AVG(valor_temperatura), 2) as avg_temp, ROUND(AVG(valor_humedad), 2) as avg_hum, COUNT(*) as lecturas\nFROM medida\nGROUP BY codigo_sensor;' }
  ],

  // Actions
  fetchInitialData: async () => {
    set({ loading: true });
    try {
      const [sensorsRes, zonesRes, kpisRes, statsRes, compRes] = await Promise.all([
        fetch(`${API_BASE}/sensors/`),
        fetch(`${API_BASE}/sensors/zones`),
        fetch(`${API_BASE}/analytics/summary`),
        fetch(`${API_BASE}/analytics/zones-statistics`),
        fetch(`${API_BASE}/analytics/sensors-comparison`)
      ]);

      const [sensors, zones, kpis, zoneStats, sensorComparison] = await Promise.all([
        sensorsRes.json(),
        zonesRes.json(),
        kpisRes.json(),
        statsRes.json(),
        compRes.json()
      ]);

      set({ 
        sensors, 
        zones, 
        kpis, 
        zoneStats, 
        sensorComparison,
        loading: false 
      });
    } catch (error) {
      console.error('Error fetching initial SCADA data:', error);
      set({ loading: false });
    }
  },

  fetchReadings: async (sensor = '', zona = '', limit = 100) => {
    try {
      let url = `${API_BASE}/readings/?limit=${limit}`;
      if (sensor) url += `&sensor=${sensor}`;
      if (zona) url += `&zona=${zona}`;
      
      const res = await fetch(url);
      const readings = await res.json();
      set({ readings });
    } catch (error) {
      console.error('Error fetching readings:', error);
    }
  },

  runMigration: async () => {
    set({ migrationLoading: true, migrationLogs: ['Initializing ETL container connection...'] });
    try {
      const res = await fetch(`${API_BASE}/migration/run`, { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        set({ 
          migrationLogs: data.logs, 
          migrationSummary: {
            duration: data.duration_seconds,
            counts: data.counts
          },
          migrationLoading: false 
        });
        // Refresh store metrics
        await get().fetchInitialData();
      } else {
        set({ 
          migrationLogs: data.logs || ['Error during database migration loading.'], 
          migrationLoading: false 
        });
      }
    } catch (error) {
      set({ 
        migrationLogs: [`Error executing ETL pipeline: ${error.message}`], 
        migrationLoading: false 
      });
    }
  },

  fetchMigrationLogs: async () => {
    try {
      const res = await fetch(`${API_BASE}/migration/logs`);
      const data = await res.json();
      set({ migrationLogs: data.logs || [] });
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  },

  setSqlQuery: (sqlQuery) => set({ sqlQuery }),

  runSqlQuery: async () => {
    const { sqlQuery, queryHistory } = get();
    set({ queryLoading: true, queryResult: null });
    try {
      const res = await fetch(`${API_BASE}/queries/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlQuery })
      });
      const result = await res.json();
      
      // Track history
      const historyItem = {
        timestamp: new Date().toLocaleTimeString(),
        sql: sqlQuery,
        success: result.success,
        count: result.count || 0
      };

      set({ 
        queryResult: result, 
        queryLoading: false,
        queryHistory: [historyItem, ...queryHistory].slice(0, 30) // cap at 30 items
      });
    } catch (error) {
      set({ 
        queryResult: { success: false, error: error.message, headers: [], rows: [] }, 
        queryLoading: false 
      });
    }
  }
}));
