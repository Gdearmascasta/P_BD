import React, { useState, useEffect } from 'react';
import { useSCADAStore } from '../store/useSCADAStore';
import MonacoEditor from '@monaco-editor/react';
import { 
  Play, 
  Terminal, 
  History, 
  BookOpen, 
  Table as TableIcon, 
  TrendingUp, 
  AlertOctagon, 
  CheckCircle2, 
  Database,
  Download
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import gsap from 'gsap';

export default function SQLPlayground() {
  const { 
    sqlQuery, 
    queryResult, 
    queryLoading, 
    queryHistory, 
    setSqlQuery, 
    runSqlQuery 
  } = useSCADAStore();

  const [activeTab, setActiveTab] = useState('results'); // 'results', 'chart', 'history'
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Preloaded classified queries (20 total)
  const preloadedQueries = [
    // --- BÁSICAS ---
    {
      id: 1,
      category: 'BASICAS',
      name: 'Catálogo Completo de Zonas',
      desc: 'Obtiene todos los registros y setpoints de temperatura/humedad de las zonas operativas.',
      sql: 'SELECT * FROM zona;'
    },
    {
      id: 2,
      category: 'BASICAS',
      name: 'Listado de Sensores Activos',
      desc: 'Consulta los sensores registrados con su respectivo código, nombre y modelo de transductor.',
      sql: 'SELECT * FROM sensor;'
    },
    {
      id: 3,
      category: 'BASICAS',
      name: 'Muestra de Historial de Medidas',
      desc: 'Obtiene las primeras 20 mediciones de telemetría ordenadas cronológicamente.',
      sql: 'SELECT * FROM medida ORDER BY fecha, hora LIMIT 20;'
    },
    {
      id: 4,
      category: 'BASICAS',
      name: 'Personal Técnico de Turno',
      desc: 'Obtiene la lista de encargados responsables con su documento de identidad y edad.',
      sql: 'SELECT id_encargado, nombre, cc, edad FROM encargado;'
    },
    // --- AGRUPACIONES Y SCADA ---
    {
      id: 5,
      category: 'AGRUPACIONES',
      name: 'Total Muestras por Zona',
      desc: 'Agrupa las mediciones y cuenta la cantidad de registros por zona física.',
      sql: 'SELECT z.nombre_zona, COUNT(m.id_medicion) as total_medidas\nFROM medida m\nJOIN zona z ON m.id_zona = z.id_zona\nGROUP BY z.nombre_zona\nORDER BY total_medidas DESC;'
    },
    {
      id: 6,
      category: 'AGRUPACIONES',
      name: 'Temperatura Promedio por Zona',
      desc: 'Calcula el promedio de temperatura en Celsius para cada zona de la planta industrial.',
      sql: 'SELECT z.nombre_zona, ROUND(AVG(m.valor_temperatura), 2) as temp_promedio\nFROM medida m\nJOIN zona z ON m.id_zona = z.id_zona\nGROUP BY z.nombre_zona\nORDER BY temp_promedio DESC;'
    },
    {
      id: 7,
      category: 'AGRUPACIONES',
      name: 'Humedad Promedio por Zona',
      desc: 'Calcula el promedio de humedad relativa en porcentaje para cada zona de supervisión.',
      sql: 'SELECT z.nombre_zona, ROUND(AVG(m.valor_humedad), 2) as hum_promedio\nFROM medida m\nJOIN zona z ON m.id_zona = z.id_zona\nGROUP BY z.nombre_zona\nORDER BY hum_promedio DESC;'
    },
    {
      id: 8,
      category: 'AGRUPACIONES',
      name: 'Lecturas Supervisadas por Encargado',
      desc: 'Muestra el número total de lecturas que cada encargado técnico ha supervisado.',
      sql: 'SELECT e.nombre, COUNT(m.id_medicion) as total_lecturas\nFROM medida m\nJOIN encargado e ON m.id_encargado = e.id_encargado\nGROUP BY e.nombre\nORDER BY total_lecturas DESC;'
    },
    {
      id: 9,
      category: 'AGRUPACIONES',
      name: 'Comportamiento Promedio por Modelo',
      desc: 'Compara la temperatura y humedad promedio capturada por los modelos de hardware (DHT11 vs DHT22).',
      sql: 'SELECT s.modelo, ROUND(AVG(m.valor_temperatura), 2) as temp_avg, ROUND(AVG(m.valor_humedad), 2) as hum_avg, COUNT(*) as lecturas\nFROM medida m\nJOIN sensor s ON m.codigo_sensor = s.codigo_sensor\nGROUP BY s.modelo;'
    },
    {
      id: 10,
      category: 'AGRUPACIONES',
      name: 'Promedios Diarios de Telemetría',
      desc: 'Agrupa las variables ambientales por fecha para ver la evolución del clima del laboratorio.',
      sql: 'SELECT fecha, ROUND(AVG(valor_temperatura), 2) as temp_diaria, ROUND(AVG(valor_humedad), 2) as hum_diaria\nFROM medida\nGROUP BY fecha\nORDER BY fecha ASC;'
    },
    // --- ANOMALÍAS E INDUSTRIAL ---
    {
      id: 11,
      category: 'ANOMALIAS',
      name: 'Alertas por Exceso de Calor (>33°C)',
      desc: 'Consulta las mediciones críticas donde la temperatura sobrepasó los 33°C.',
      sql: 'SELECT m.id_medicion, m.fecha, m.hora, m.valor_temperatura, z.nombre_zona\nFROM medida m\nJOIN zona z ON m.id_zona = z.id_zona\nWHERE m.valor_temperatura > 33.0\nORDER BY m.valor_temperatura DESC;'
    },
    {
      id: 12,
      category: 'ANOMALIAS',
      name: 'Alertas por Humedad Crítica (<45%)',
      desc: 'Filtra las lecturas donde la humedad del ambiente bajó del umbral seguro del 45%.',
      sql: 'SELECT m.id_medicion, m.fecha, m.hora, m.valor_humedad, z.nombre_zona\nFROM medida m\nJOIN zona z ON m.id_zona = z.id_zona\nWHERE m.valor_humedad < 45.0\nORDER BY m.valor_humedad ASC;'
    },
    {
      id: 13,
      category: 'ANOMALIAS',
      name: 'Desviaciones Respecto a Setpoint de Zona',
      desc: 'Calcula la diferencia (desviación) entre la temperatura real medida y la temperatura de referencia nominal.',
      sql: 'SELECT m.id_medicion, z.nombre_zona, m.valor_temperatura, z.temp_ambiente as temp_setpoint, ROUND(m.valor_temperatura - z.temp_ambiente, 2) as desviacion\nFROM medida m\nJOIN zona z ON m.id_zona = z.id_zona\nWHERE z.temp_ambiente IS NOT NULL\nORDER BY ABS(m.valor_temperatura - z.temp_ambiente) DESC\nLIMIT 20;'
    },
    {
      id: 14,
      category: 'ANOMALIAS',
      name: 'Desviaciones Críticas de Humedad Nominal',
      desc: 'Detecta diferencias superiores a ±5% respecto al setpoint de humedad de la zona.',
      sql: 'SELECT m.id_medicion, z.nombre_zona, m.valor_humedad, z.humedad_ambiente as hum_setpoint, ROUND(m.valor_humedad - z.humedad_ambiente, 2) as desviacion\nFROM medida m\nJOIN zona z ON m.id_zona = z.id_zona\nWHERE ABS(m.valor_humedad - z.humedad_ambiente) > 5.0\nORDER BY ABS(desviacion) DESC;'
    },
    {
      id: 15,
      category: 'ANOMALIAS',
      name: 'Alertas Totales Consolidadas por Zona',
      desc: 'Muestra la cantidad de anomalías (temp > 33 o hum < 45) agrupadas por ubicación.',
      sql: 'SELECT z.nombre_zona, COUNT(*) as cantidad_anomalias\nFROM medida m\nJOIN zona z ON m.id_zona = z.id_zona\nWHERE m.valor_temperatura > 33.0 OR m.valor_humedad < 45.0\nGROUP BY z.nombre_zona\nORDER BY cantidad_anomalias DESC;'
    },
    // --- AVANZADAS Y AUDITORÍA ---
    {
      id: 16,
      category: 'AVANZADAS',
      name: 'Máximos y Mínimos por Sensor',
      desc: 'Consulta métricas extremas consolidadas para cada transductor físico.',
      sql: 'SELECT codigo_sensor, MIN(valor_temperatura) as temp_min, MAX(valor_temperatura) as temp_max, MIN(valor_humedad) as hum_min, MAX(valor_humedad) as hum_max\nFROM medida\nGROUP BY codigo_sensor;'
    },
    {
      id: 17,
      category: 'AVANZADAS',
      name: 'Estadísticas del Operador Yesid Ávila',
      desc: 'Filtra todas las mediciones capturadas bajo la responsabilidad del supervisor Yesid Ávila.',
      sql: 'SELECT m.id_medicion, m.fecha, m.hora, m.valor_temperatura, m.valor_humedad, z.nombre_zona\nFROM medida m\nJOIN encargado e ON m.id_encargado = e.id_encargado\nJOIN zona z ON m.id_zona = z.id_zona\nWHERE e.nombre LIKE \'%Yesid%\'\nORDER BY m.fecha DESC, m.hora DESC\nLIMIT 20;'
    },
    {
      id: 18,
      category: 'AVANZADAS',
      name: 'Sensores sin Actividad Registrada',
      desc: 'Utiliza LEFT JOIN para auditar si existen sensores catalogados que no posean lecturas.',
      sql: 'SELECT s.codigo_sensor, s.nombre_sensor, COUNT(m.id_medicion) as lecturas\nFROM sensor s\nLEFT JOIN medida m ON s.codigo_sensor = m.codigo_sensor\nGROUP BY s.codigo_sensor, s.nombre_sensor\nHAVING lecturas = 0;'
    },
    {
      id: 19,
      category: 'AVANZADAS',
      name: 'Zonas con Clima Nominal no Configurado',
      desc: 'Consulta las zonas físicas de la planta que no tienen definidos setpoints o metas ambientales.',
      sql: 'SELECT id_zona, nombre_zona\nFROM zona\nWHERE temp_ambiente IS NULL OR humedad_ambiente IS NULL;'
    },
    {
      id: 20,
      category: 'AVANZADAS',
      name: 'Subconsulta: Medidas por Encima del Promedio General',
      desc: 'Obtiene las mediciones cuya temperatura sea mayor al promedio histórico general de toda la base de datos.',
      sql: 'SELECT id_medicion, fecha, hora, valor_temperatura\nFROM medida\nWHERE valor_temperatura > (SELECT AVG(valor_temperatura) FROM medida)\nORDER BY valor_temperatura DESC\nLIMIT 20;'
    }
  ];

  // GSAP animation on results load
  useEffect(() => {
    if (queryResult && activeTab === 'results') {
      gsap.fromTo(".result-row", 
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.03, ease: "power2.out" }
      );
    }
  }, [queryResult, activeTab]);

  const handleQuerySelect = (querySql) => {
    setSqlQuery(querySql);
    // Switch to results tab automatically
    setActiveTab('results');
  };

  const handleExecute = () => {
    runSqlQuery();
  };

  // Helper: check if result is chartable
  // We need a numeric column and a string/date label column
  const getChartData = () => {
    if (!queryResult || !queryResult.success || !queryResult.rows || queryResult.rows.length === 0) {
      return null;
    }

    const headers = queryResult.headers;
    const rows = queryResult.rows;

    // Find first numeric header
    let numericHeader = null;
    let labelHeader = null;

    headers.forEach(h => {
      const val = rows[0][h];
      if (typeof val === 'number') {
        if (!numericHeader) numericHeader = h;
      } else if (typeof val === 'string') {
        if (!labelHeader) labelHeader = h;
      }
    });

    if (!numericHeader) {
      // Look if any column has parsable numbers
      headers.forEach(h => {
        const val = parseFloat(rows[0][h]);
        if (!isNaN(val) && !numericHeader) {
          numericHeader = h;
        }
      });
    }

    // Default label if not found
    if (!labelHeader) labelHeader = headers[0];

    if (numericHeader && labelHeader) {
      const formattedData = rows.map(r => ({
        label: r[labelHeader],
        value: parseFloat(r[numericHeader])
      }));
      return {
        data: formattedData,
        xKey: 'label',
        yKey: 'value',
        yLabel: numericHeader,
        xLabel: labelHeader
      };
    }

    return null;
  };

  const chartInfo = getChartData();

  // Export results to CSV
  const handleExportCSV = () => {
    if (!queryResult || !queryResult.rows || queryResult.rows.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += queryResult.headers.join(",") + "\n";
    
    queryResult.rows.forEach(row => {
      const rowValues = queryResult.headers.map(h => {
        const val = row[h];
        if (typeof val === 'string') {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csvContent += rowValues.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", "sql_playground_results.csv");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredPreloads = preloadedQueries.filter(q => 
    selectedCategory === 'ALL' || q.category === selectedCategory
  );

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-wider text-slate-100 uppercase flex items-center gap-2">
            <Terminal className="text-cyber-primary" />
            SQL Playground Studio
          </h1>
          <p className="text-sm text-slate-400 font-sans mt-1">
            Consola interactiva de consultas SQL. Escriba consultas personalizadas o seleccione del catálogo de auditorías.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
        
        {/* Left Side: Preloaded Queries Catalogue */}
        <div className="xl:col-span-1 glass-card border border-cyber-800/80 bg-cyber-900/10 p-5 space-y-4 max-h-[700px] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-cyber-850 pb-3">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
              <BookOpen size={14} className="text-cyber-secondary" />
              Catálogo de Consultas
            </h3>
            <span className="text-[9px] bg-cyber-primary/10 border border-cyber-primary/20 px-1.5 py-0.5 rounded text-cyber-primary font-mono font-bold">
              20 QUERIES
            </span>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-cyber-950/80 border border-cyber-800 focus:border-cyber-primary rounded-lg px-3 py-2 text-[10px] font-mono text-slate-300 focus:outline-none transition-all cursor-pointer"
          >
            <option value="ALL">TODAS LAS CATEGORÍAS</option>
            <option value="BASICAS">BÁSICAS</option>
            <option value="AGRUPACIONES">AGRUPACIONES & SCADA</option>
            <option value="ANOMALIAS">ANOMALÍAS AMBIENTALES</option>
            <option value="AVANZADAS">AVANZADAS & AUDITORÍA</option>
          </select>

          {/* Catalogue List */}
          <div className="space-y-3 font-mono text-[10px]">
            {filteredPreloads.map((query) => (
              <div 
                key={query.id} 
                onClick={() => handleQuerySelect(query.sql)}
                className="bg-cyber-950/50 border border-cyber-850/80 p-3 rounded-lg hover:border-cyber-primary/40 cursor-pointer transition-all hover:bg-cyber-900/30 group"
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold text-slate-200 group-hover:text-cyber-primary transition-colors truncate max-w-[150px]">
                    {query.name}
                  </span>
                  <span className={`text-[8px] px-1 rounded font-bold ${
                    query.category === 'BASICAS' ? 'bg-blue-500/10 text-blue-400' :
                    query.category === 'AGRUPACIONES' ? 'bg-cyan-500/10 text-cyan-400' :
                    query.category === 'ANOMALIAS' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-purple-500/10 text-purple-400'
                  }`}>
                    {query.category}
                  </span>
                </div>
                <p className="text-[9px] text-slate-500 font-sans leading-relaxed group-hover:text-slate-400 transition-colors">
                  {query.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Editor + Output Result */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* Monaco Editor Card */}
          <div className="glass-card border border-cyber-800/80 overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-cyber-950 px-5 py-3 border-b border-cyber-800 flex justify-between items-center select-none">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-cyber-primary" />
                <span className="font-mono text-xs font-bold text-slate-300">Monaco SQL Sandbox Workspace</span>
              </div>

              <button
                onClick={handleExecute}
                disabled={queryLoading}
                className="flex items-center gap-1.5 px-3 py-1 bg-cyber-primary/10 border border-cyber-primary/30 text-cyber-primary hover:bg-cyber-primary/20 transition-all font-mono text-[10px] font-bold rounded-lg cursor-pointer shadow shadow-cyber-primary/5"
              >
                <Play size={10} className={queryLoading ? 'animate-pulse' : ''} />
                {queryLoading ? 'EJECUTANDO...' : 'RUN QUERY'}
              </button>
            </div>

            <div className="h-64 border-b border-cyber-900 bg-[#070c17]">
              <MonacoEditor
                height="100%"
                language="sql"
                theme="vs-dark"
                value={sqlQuery}
                onChange={(val) => setSqlQuery(val || '')}
                options={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 12,
                  lineNumbers: 'on',
                  roundedSelection: true,
                  scrollBeyondLastLine: false,
                  readOnly: false,
                  minimap: { enabled: false },
                  automaticLayout: true
                }}
              />
            </div>
          </div>

          {/* Results Tab Menu */}
          <div className="flex justify-between items-center bg-cyber-900/60 p-1.5 rounded-xl border border-cyber-800/80 backdrop-blur-md">
            <div className="flex font-mono text-xs gap-2">
              <button
                onClick={() => setActiveTab('results')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === 'results' 
                    ? 'bg-cyber-primary/10 border border-cyber-primary/30 text-cyber-primary' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TableIcon size={14} />
                TABLA DE RESULTADOS
              </button>
              
              <button
                onClick={() => setActiveTab('chart')}
                disabled={!chartInfo}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold transition-all ${
                  !chartInfo 
                    ? 'text-slate-600 cursor-not-allowed opacity-50' 
                    : activeTab === 'chart'
                    ? 'bg-cyber-primary/10 border border-cyber-primary/30 text-cyber-primary'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp size={14} />
                GRÁFICA AUTOMÁTICA
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === 'history' 
                    ? 'bg-cyber-primary/10 border border-cyber-primary/30 text-cyber-primary' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <History size={14} />
                HISTORIAL
              </button>
            </div>

            {queryResult && queryResult.success && queryResult.rows && queryResult.rows.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyber-secondary/10 border border-cyber-secondary/30 text-cyber-secondary hover:bg-cyber-secondary/20 transition-all font-mono text-[10px] font-bold rounded-lg cursor-pointer"
              >
                <Download size={12} />
                EXPORTAR CSV
              </button>
            )}
          </div>

          {/* Tab Content Display */}
          <div className="glass-card border border-cyber-800/80 bg-cyber-900/10 p-6 min-h-[250px] flex flex-col justify-center">
            
            {/* 1. Results Table View */}
            {activeTab === 'results' && (
              <div className="space-y-4">
                {queryLoading ? (
                  <div className="text-center font-mono text-xs text-slate-400 space-y-2 py-8">
                    <Database size={32} className="mx-auto text-cyber-primary animate-bounce" />
                    <p>Consultando base de datos del SCADA...</p>
                  </div>
                ) : queryResult ? (
                  queryResult.success ? (
                    queryResult.rows.length > 0 ? (
                      <div className="overflow-x-auto max-h-[350px]">
                        <table className="w-full text-left font-mono text-[11px] text-slate-300">
                          <thead className="bg-cyber-950 border-b border-cyber-800 text-slate-400 uppercase sticky top-0">
                            <tr>
                              {queryResult.headers.map((h, idx) => (
                                <th key={idx} className="p-3">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-cyber-850">
                            {queryResult.rows.map((row, rIdx) => (
                              <tr key={rIdx} className="result-row hover:bg-cyber-900/30 transition-colors">
                                {queryResult.headers.map((h, cIdx) => {
                                  const val = row[h];
                                  return (
                                    <td key={cIdx} className="p-3">
                                      {typeof val === 'number' ? val : val === null ? <span className="text-slate-600">NULL</span> : String(val)}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center font-mono text-xs text-slate-500 py-8 flex flex-col items-center gap-2">
                        <CheckCircle2 size={32} className="text-emerald-400" />
                        <span>Query ejecutada correctamente. Retornó 0 filas.</span>
                      </div>
                    )
                  ) : (
                    <div className="border border-cyber-danger/30 bg-cyber-danger/5 rounded-xl p-5 font-mono text-xs text-cyber-danger space-y-2">
                      <div className="flex items-center gap-2 font-bold">
                        <AlertOctagon size={16} />
                        <span>ERROR DE EJECUCIÓN SQL:</span>
                      </div>
                      <p className="leading-relaxed bg-cyber-950 p-4 border border-cyber-900 rounded-lg text-red-400 overflow-x-auto">
                        {queryResult.error}
                      </p>
                    </div>
                  )
                ) : (
                  <div className="text-center font-mono text-xs text-slate-500 py-8 select-none">
                    Sandbox vacío. Escriba o seleccione una consulta SQL y ejecútela.
                  </div>
                )}
              </div>
            )}

            {/* 2. Graphical View */}
            {activeTab === 'chart' && (
              <div className="h-72 w-full flex items-center justify-center">
                {chartInfo ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartInfo.data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey={chartInfo.xKey} stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#070c17', borderColor: '#0e182c', borderRadius: '8px', fontFamily: 'monospace' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'monospace' }} />
                      <Area 
                        type="monotone" 
                        dataKey={chartInfo.yKey} 
                        name={chartInfo.yLabel.toUpperCase()} 
                        stroke="#10b981" 
                        fillOpacity={1} 
                        fill="url(#chartGlow)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center font-mono text-xs text-slate-500 select-none">
                    No se detectaron columnas con variables métricas continuas para trazar gráficas.
                  </div>
                )}
              </div>
            )}

            {/* 3. History View */}
            {activeTab === 'history' && (
              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-cyber-800 pb-2 mb-2">
                  Registro de Ejecución Local Reciente
                </h3>
                {queryHistory.length > 0 ? (
                  queryHistory.map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setSqlQuery(item.sql)}
                      className="bg-cyber-950/40 border border-cyber-850 p-3 rounded-lg hover:border-cyber-primary/30 transition-all cursor-pointer flex justify-between items-center text-xs font-mono"
                    >
                      <div className="space-y-1 truncate max-w-[80%]">
                        <p className="text-slate-300 font-bold truncate">{item.sql}</p>
                        <span className="text-[9px] text-slate-500">Timestamp: {item.timestamp}</span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          item.success ? 'bg-cyber-primary/10 text-cyber-primary' : 'bg-cyber-danger/10 text-cyber-danger'
                        }`}>
                          {item.success ? `ÉXITO (${item.count} FILAS)` : 'FALLIDO'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center font-mono text-xs text-slate-600 py-8 select-none">
                    No se han registrado consultas ejecutadas en esta sesión.
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
