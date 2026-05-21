import React, { useState } from 'react';
import { BookOpen, Search, Download, Table, FileSpreadsheet, ShieldAlert } from 'lucide-react';

export default function DataDictionary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTable, setSelectedTable] = useState('ALL');

  const dictionaryData = [
    {
      tableName: 'encargado',
      description: 'Entidad que almacena la información del personal técnico responsable del mantenimiento y supervisión de las zonas industriales y sensores.',
      columns: [
        { name: 'id_encargado', type: 'INTEGER', constraint: 'PK (Autoincrement)', nullable: 'NO', description: 'Identificador único del encargado o supervisor.' },
        { name: 'nombre', type: 'VARCHAR(100)', constraint: 'Ninguno', nullable: 'NO', description: 'Nombre completo del operador técnico.' },
        { name: 'cc', type: 'VARCHAR(20)', constraint: 'UNIQUE', nullable: 'NO', description: 'Cédula de ciudadanía / Documento de identidad del encargado.' },
        { name: 'edad', type: 'SMALLINT', constraint: 'Ninguno', nullable: 'NO', description: 'Edad del operador.' }
      ]
    },
    {
      tableName: 'zona',
      description: 'Entidad geográfica/física que subdivide la planta o laboratorio de monitoreo ambiental y establece las condiciones nominales.',
      columns: [
        { name: 'id_zona', type: 'SMALLINT', constraint: 'PK (Autoincrement)', nullable: 'NO', description: 'Identificador único de la zona o laboratorio.' },
        { name: 'nombre_zona', type: 'VARCHAR(100)', constraint: 'Ninguno', nullable: 'NO', description: 'Nombre descriptivo (ej: Laboratorio de Mecatrónica).' },
        { name: 'temp_ambiente', type: 'NUMERIC(4, 1)', constraint: 'Ninguno', nullable: 'YES', description: 'Temperatura de setpoint o referencia nominal de la zona en °C.' },
        { name: 'humedad_ambiente', type: 'NUMERIC(4, 1)', constraint: 'Ninguno', nullable: 'YES', description: 'Humedad de setpoint o referencia nominal de la zona en %.' }
      ]
    },
    {
      tableName: 'sensor',
      description: 'Entidad de catálogo de hardware que registra los transductores físicos desplegados en las zonas operacionales.',
      columns: [
        { name: 'codigo_sensor', type: 'VARCHAR(10)', constraint: 'PK', nullable: 'NO', description: 'Código único alfanumérico del dispositivo físico (ej: S01, S02).' },
        { name: 'nombre_sensor', type: 'VARCHAR(100)', constraint: 'Ninguno', nullable: 'NO', description: 'Nombre comercial del transductor.' },
        { name: 'modelo', type: 'VARCHAR(20)', constraint: 'Ninguno', nullable: 'NO', description: 'Modelo del hardware (ej: DHT11 o DHT22).' }
      ]
    },
    {
      tableName: 'medida',
      description: 'Entidad transaccional de series temporales que almacena las lecturas de telemetría capturadas por los sensores.',
      columns: [
        { name: 'id_medicion', type: 'INTEGER', constraint: 'PK (Autoincrement)', nullable: 'NO', description: 'Identificador único autoincrementable de la muestra.' },
        { name: 'fecha', type: 'DATE', constraint: 'Ninguno', nullable: 'NO', description: 'Fecha del calendario del registro (YYYY-MM-DD).' },
        { name: 'hora', type: 'TIME', constraint: 'Ninguno', nullable: 'NO', description: 'Tiempo exacto en que se tomó el registro (HH:MM:SS).' },
        { name: 'valor_temperatura', type: 'NUMERIC(4, 1)', constraint: 'Ninguno', nullable: 'NO', description: 'Valor físico medido en Grados Celsius.' },
        { name: 'valor_humedad', type: 'NUMERIC(4, 1)', constraint: 'Ninguno', nullable: 'NO', description: 'Valor físico medido de Humedad Relativa.' },
        { name: 'codigo_sensor', type: 'VARCHAR(10)', constraint: 'FK (sensor.codigo_sensor)', nullable: 'NO', description: 'Llave foránea que asocia la medición a un hardware.' },
        { name: 'id_zona', type: 'SMALLINT', constraint: 'FK (zona.id_zona)', nullable: 'NO', description: 'Llave foránea que define en qué zona física ocurrió la medida.' },
        { name: 'id_encargado', type: 'INTEGER', constraint: 'FK (encargado.id_encargado)', nullable: 'NO', description: 'Llave foránea que registra el supervisor en turno.' }
      ]
    }
  ];

  // Filters logic
  const filteredTables = dictionaryData
    .map(table => {
      if (selectedTable !== 'ALL' && table.tableName !== selectedTable) {
        return null;
      }
      const matchedColumns = table.columns.filter(col => 
        col.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        col.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (matchedColumns.length === 0 && !table.tableName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return null;
      }
      return {
        ...table,
        columns: matchedColumns.length > 0 ? matchedColumns : table.columns
      };
    })
    .filter(Boolean);

  // Dynamic Export to JSON
  const exportToJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dictionaryData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "diccionario_datos_scada.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Dynamic Export to CSV
  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Tabla,Columna,Tipo de Dato,Restriccion,Permite Nulo,Descripcion\n";
    
    dictionaryData.forEach(table => {
      table.columns.forEach(col => {
        const row = [
          table.tableName,
          col.name,
          col.type,
          col.constraint,
          col.nullable,
          `"${col.description.replace(/"/g, '""')}"`
        ].join(",");
        csvContent += row + "\n";
      });
    });

    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", "diccionario_datos_scada.csv");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-wider text-slate-100 uppercase flex items-center gap-2">
            <BookOpen className="text-cyber-primary" />
            Diccionario de Datos Técnico
          </h1>
          <p className="text-sm text-slate-400 font-sans mt-1">
            Metadatos y documentación técnica estructurada del esquema de base de datos relacional de producción.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-cyber-primary/10 border border-cyber-primary/30 text-cyber-primary hover:bg-cyber-primary/20 transition-all font-mono text-xs font-semibold rounded-lg"
          >
            <FileSpreadsheet size={16} />
            EXPORTAR CSV
          </button>
          <button
            onClick={exportToJSON}
            className="flex items-center gap-2 px-4 py-2 bg-cyber-secondary/10 border border-cyber-secondary/30 text-cyber-secondary hover:bg-cyber-secondary/20 transition-all font-mono text-xs font-semibold rounded-lg"
          >
            <Download size={16} />
            EXPORTAR JSON
          </button>
        </div>
      </div>

      {/* Filters Pane */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-cyber-900/60 p-4 rounded-xl border border-cyber-800/80 backdrop-blur-md">
        
        {/* Search */}
        <div className="relative col-span-2">
          <Search className="absolute left-3 top-3 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Buscar columna, tipo o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-cyber-950/80 border border-cyber-800 focus:border-cyber-primary rounded-lg pl-10 pr-4 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
          />
        </div>

        {/* Table Selector */}
        <div>
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="w-full bg-cyber-950/80 border border-cyber-800 focus:border-cyber-primary rounded-lg px-4 py-2.5 text-xs font-mono text-slate-300 focus:outline-none transition-all cursor-pointer"
          >
            <option value="ALL">TODAS LAS TABLAS</option>
            <option value="encargado">tabla: encargado</option>
            <option value="zona">tabla: zona</option>
            <option value="sensor">tabla: sensor</option>
            <option value="medida">tabla: medida</option>
          </select>
        </div>

      </div>

      {/* Dictionary Contents */}
      <div className="space-y-8">
        {filteredTables.length > 0 ? (
          filteredTables.map((table, idx) => (
            <div key={idx} className="glass-card border border-cyber-800/60 overflow-hidden shadow-2xl">
              
              {/* Table Header Info */}
              <div className="bg-cyber-900/80 p-5 border-b border-cyber-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="space-y-1">
                  <h3 className="text-lg font-mono font-bold text-slate-100 flex items-center gap-2">
                    <Table size={18} className="text-cyber-secondary" />
                    TABLA: <span className="text-cyber-primary font-bold">{table.tableName}</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-sans">{table.description}</p>
                </div>
                <span className="px-3 py-1 bg-cyber-secondary/5 border border-cyber-secondary/20 rounded font-mono text-[10px] text-cyber-secondary">
                  {table.columns.length} Atributos
                </span>
              </div>

              {/* Table Schema Grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs text-slate-300">
                  <thead className="bg-cyber-950 border-b border-cyber-800 text-slate-400 uppercase">
                    <tr>
                      <th className="p-4 w-1/5">Columna</th>
                      <th className="p-4 w-1/6">Tipo de Dato</th>
                      <th className="p-4 w-1/6">Restricción</th>
                      <th className="p-4 w-1/12 text-center">Permite Nulo</th>
                      <th className="p-4 w-2/5">Descripción y Semántica</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-850 bg-cyber-900/10">
                    {table.columns.map((col, cIdx) => {
                      const isPK = col.constraint.includes('PK');
                      const isFK = col.constraint.includes('FK');
                      const isUnique = col.constraint.includes('UNIQUE');
                      
                      return (
                        <tr key={cIdx} className="hover:bg-cyber-900/40 transition-colors">
                          <td className="p-4 font-bold text-slate-100">{col.name}</td>
                          <td className="p-4 text-cyan-400 font-semibold">{col.type}</td>
                          <td className="p-4">
                            {isPK && <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyber-primary/10 border border-cyber-primary/30 text-cyber-primary">PRIMARY KEY</span>}
                            {isFK && <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyber-secondary/10 border border-cyber-secondary/30 text-cyber-secondary">FOREIGN KEY</span>}
                            {isUnique && <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 border border-purple-500/30 text-purple-400">UNIQUE</span>}
                            {!isPK && !isFK && !isUnique && <span className="text-slate-500">-</span>}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${col.nullable === 'YES' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800 text-slate-400'}`}>
                              {col.nullable}
                            </span>
                          </td>
                          <td className="p-4 text-slate-300 font-sans leading-relaxed">{col.description}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-cyber-900/40 border border-cyber-800 rounded-xl space-y-4">
            <ShieldAlert className="text-cyber-danger" size={48} />
            <div className="text-center font-mono space-y-1">
              <h3 className="text-slate-200 text-sm font-bold uppercase">Sin Coincidencias</h3>
              <p className="text-slate-500 text-xs">No se encontraron atributos que coincidan con la búsqueda "{searchTerm}"</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
