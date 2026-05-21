import React, { useState } from 'react';
import { DatabaseZap, Layers, HelpCircle, Eye, Network } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ERD() {
  const [modelType, setModelType] = useState('logical'); // 'logical' or 'physical'
  const [hoveredRelation, setHoveredRelation] = useState(null); // 'sensor', 'zona', 'encargado'

  const tables = {
    encargado: {
      title: 'encargado',
      x: 60,
      y: 60,
      width: 220,
      logical: [
        { name: 'id_encargado', key: 'PK', type: 'Entero' },
        { name: 'nombre', key: '', type: 'Texto' },
        { name: 'cc', key: 'UQ', type: 'Texto' },
        { name: 'edad', key: '', type: 'Entero Corto' }
      ],
      physical: [
        { name: 'id_encargado', key: 'SERIAL [PK]', type: 'INTEGER' },
        { name: 'nombre', key: 'NN', type: 'VARCHAR(100)' },
        { name: 'cc', key: 'UQ, NN', type: 'VARCHAR(20)' },
        { name: 'edad', key: 'NN', type: 'SMALLINT' }
      ]
    },
    zona: {
      title: 'zona',
      x: 60,
      y: 350,
      width: 220,
      logical: [
        { name: 'id_zona', key: 'PK', type: 'Entero Corto' },
        { name: 'nombre_zona', key: '', type: 'Texto' },
        { name: 'temp_ambiente', key: '', type: 'Decimal' },
        { name: 'humedad_ambiente', key: '', type: 'Decimal' }
      ],
      physical: [
        { name: 'id_zona', key: 'SERIAL [PK]', type: 'SMALLINT' },
        { name: 'nombre_zona', key: 'NN', type: 'VARCHAR(100)' },
        { name: 'temp_ambiente', key: 'NULL', type: 'NUMERIC(4,1)' },
        { name: 'humedad_ambiente', key: 'NULL', type: 'NUMERIC(4,1)' }
      ]
    },
    sensor: {
      title: 'sensor',
      x: 560,
      y: 60,
      width: 220,
      logical: [
        { name: 'codigo_sensor', key: 'PK', type: 'Texto Corto' },
        { name: 'nombre_sensor', key: '', type: 'Texto' },
        { name: 'modelo', key: '', type: 'Texto' }
      ],
      physical: [
        { name: 'codigo_sensor', key: 'PK', type: 'VARCHAR(10)' },
        { name: 'nombre_sensor', key: 'NN', type: 'VARCHAR(100)' },
        { name: 'modelo', key: 'NN', type: 'VARCHAR(20)' }
      ]
    },
    medida: {
      title: 'medida',
      x: 310,
      y: 190,
      width: 240,
      logical: [
        { name: 'id_medicion', key: 'PK', type: 'Entero' },
        { name: 'fecha', key: '', type: 'Fecha' },
        { name: 'hora', key: '', type: 'Hora' },
        { name: 'valor_temperatura', key: '', type: 'Decimal' },
        { name: 'valor_humedad', key: '', type: 'Decimal' },
        { name: 'codigo_sensor', key: 'FK', type: 'Texto Corto' },
        { name: 'id_zona', key: 'FK', type: 'Entero Corto' },
        { name: 'id_encargado', key: 'FK', type: 'Entero' }
      ],
      physical: [
        { name: 'id_medicion', key: 'SERIAL [PK]', type: 'INTEGER' },
        { name: 'fecha', key: 'NN', type: 'DATE' },
        { name: 'hora', key: 'NN', type: 'TIME' },
        { name: 'valor_temperatura', key: 'NN', type: 'NUMERIC(4,1)' },
        { name: 'valor_humedad', key: 'NN', type: 'NUMERIC(4,1)' },
        { name: 'codigo_sensor', key: 'FK', type: 'VARCHAR(10)' },
        { name: 'id_zona', key: 'FK', type: 'SMALLINT' },
        { name: 'id_encargado', key: 'FK', type: 'INTEGER' }
      ]
    }
  };

  const getRelations = () => {
    // Return SVG drawing paths connecting tables
    // We connect:
    // 1. encargado -> medida: from (encargado right) to (medida left-top)
    // 2. zona -> medida: from (zona right) to (medida left-bottom)
    // 3. sensor -> medida: from (sensor left) to (medida right-top)
    return [
      {
        id: 'encargado',
        label: '1 : N (Supervisa)',
        // encargado right center is around: x = 60+220 = 280, y = 60+70 = 130
        // medida left top is around: x = 310, y = 190+70 = 260
        path: 'M 280,120 C 310,120 290,260 310,260',
        color: hoveredRelation === 'encargado' ? '#10b981' : '#334155',
        strokeWidth: hoveredRelation === 'encargado' ? 3 : 1.5,
        badgeX: 290,
        badgeY: 175
      },
      {
        id: 'zona',
        label: '1 : N (Contiene)',
        // zona right center is around: x = 60+220 = 280, y = 350+70 = 420
        // medida left bottom is around: x = 310, y = 190+150 = 340
        path: 'M 280,410 C 310,410 290,320 310,320',
        color: hoveredRelation === 'zona' ? '#10b981' : '#334155',
        strokeWidth: hoveredRelation === 'zona' ? 3 : 1.5,
        badgeX: 290,
        badgeY: 375
      },
      {
        id: 'sensor',
        label: '1 : N (Registra)',
        // sensor left center is around: x = 560, y = 60+60 = 120
        // medida right center is around: x = 550, y = 190+80 = 270
        path: 'M 560,110 C 530,110 570,270 550,270',
        color: hoveredRelation === 'sensor' ? '#10b981' : '#334155',
        strokeWidth: hoveredRelation === 'sensor' ? 3 : 1.5,
        badgeX: 525,
        badgeY: 175
      }
    ];
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-wider text-slate-100 uppercase flex items-center gap-2">
            <DatabaseZap className="text-cyber-primary" />
            Modelado de Datos ER
          </h1>
          <p className="text-sm text-slate-400 font-sans mt-1">
            Diagrama de Entidad Relación interactivo del sistema. Visualiza la cardinalidad 1 a N del SCADA.
          </p>
        </div>

        {/* Model Type Selector Switch */}
        <div className="flex bg-cyber-900 p-1.5 rounded-xl border border-cyber-800 font-mono text-xs">
          <button
            onClick={() => setModelType('logical')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              modelType === 'logical' 
                ? 'bg-cyber-primary/10 border border-cyber-primary/30 text-cyber-primary' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            MODELO LÓGICO
          </button>
          <button
            onClick={() => setModelType('physical')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              modelType === 'physical' 
                ? 'bg-cyber-primary/10 border border-cyber-primary/30 text-cyber-primary' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            MODELO FÍSICO PG
          </button>
        </div>
      </div>

      {/* Main Panel split: Left Diagram, Right Relationship Card */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* Left Diagram Panel */}
        <div className="xl:col-span-3 glass-card border border-cyber-800/80 bg-cyber-900/10 p-6 overflow-auto relative select-none" style={{ minHeight: '580px' }}>
          
          {/* SVG Connector Lines Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ minWidth: '820px', minHeight: '560px' }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
              </marker>
            </defs>

            {getRelations().map((rel) => (
              <g key={rel.id}>
                {/* SVG connection shadow path */}
                <path
                  d={rel.path}
                  fill="none"
                  stroke={rel.color}
                  strokeWidth={rel.strokeWidth}
                  className="transition-all duration-300"
                />
                
                {/* Cardinality text label background */}
                <rect
                  x={rel.badgeX - 5}
                  y={rel.badgeY - 10}
                  width="100"
                  height="16"
                  fill="#070c17"
                  rx="3"
                  className="stroke border-cyber-800"
                  strokeWidth="0.5"
                  stroke="#1e293b"
                />
                {/* Cardinality text */}
                <text
                  x={rel.badgeX}
                  y={rel.badgeY + 2}
                  fill={hoveredRelation === rel.id ? '#10b981' : '#94a3b8'}
                  className="font-mono text-[9px] font-bold"
                >
                  {rel.label}
                </text>
              </g>
            ))}
          </svg>

          {/* Tables Layer */}
          <div className="relative z-10 w-full h-full" style={{ minWidth: '800px', minHeight: '520px' }}>
            
            {Object.values(tables).map((table) => {
              const isHovered = hoveredRelation === table.title;
              const columnsList = modelType === 'logical' ? table.logical : table.physical;
              
              return (
                <div
                  key={table.title}
                  style={{
                    position: 'absolute',
                    left: `${table.x}px`,
                    top: `${table.y}px`,
                    width: `${table.width}px`
                  }}
                  className={`bg-cyber-900 border rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${
                    isHovered 
                      ? 'border-cyber-primary shadow-cyber-primary/10 ring-1 ring-cyber-primary' 
                      : 'border-cyber-800'
                  }`}
                  onMouseEnter={() => {
                    if (table.title !== 'medida') setHoveredRelation(table.title);
                  }}
                  onMouseLeave={() => setHoveredRelation(null)}
                >
                  {/* Table Title Bar */}
                  <div className={`px-4 py-2 border-b border-cyber-800 flex items-center justify-between ${
                    table.title === 'medida' ? 'bg-cyber-primary/5' : 'bg-cyber-850'
                  }`}>
                    <span className="font-mono text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Layers size={12} className={table.title === 'medida' ? 'text-cyber-primary' : 'text-cyber-secondary'} />
                      {table.title}
                    </span>
                    <span className="text-[9px] bg-cyber-800 px-1.5 py-0.5 rounded text-slate-500 font-mono">
                      {table.title === 'medida' ? 'TRANS' : 'MAESTRA'}
                    </span>
                  </div>

                  {/* Table Attributes list */}
                  <div className="p-3 divide-y divide-cyber-850 font-mono text-[10px]">
                    {columnsList.map((col, idx) => {
                      const isPK = col.key.includes('PK');
                      const isFK = col.key.includes('FK');
                      const isUQ = col.key.includes('UQ');
                      
                      return (
                        <div key={idx} className="py-1.5 flex justify-between items-center hover:bg-cyber-800/10 transition-colors">
                          <span className={`tracking-wide font-semibold ${
                            isPK ? 'text-cyber-primary' : isFK ? 'text-cyber-secondary' : 'text-slate-300'
                          }`}>
                            {col.name}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] text-slate-500">{col.type}</span>
                            {isPK && <span className="text-[8px] bg-cyber-primary/10 border border-cyber-primary/20 px-1 rounded text-cyber-primary font-bold">PK</span>}
                            {isFK && <span className="text-[8px] bg-cyber-secondary/10 border border-cyber-secondary/20 px-1 rounded text-cyber-secondary font-bold">FK</span>}
                            {isUQ && <span className="text-[8px] bg-purple-500/10 border border-purple-500/20 px-1 rounded text-purple-400 font-bold">UQ</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

          </div>

        </div>

        {/* Right Info Panel */}
        <div className="space-y-6">
          
          {/* Card: Relation Inspector */}
          <div className="glass-card p-6 border-cyber-800/80 space-y-4">
            <h3 className="text-sm font-mono font-bold text-slate-200 uppercase flex items-center gap-2">
              <Eye size={16} className="text-cyber-secondary" />
              Inspector de Relaciones
            </h3>
            
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Pase el cursor sobre las entidades en el plano del diagrama para resaltar los vínculos y claves foráneas.
            </p>

            <div className="divide-y divide-cyber-800 text-xs font-mono">
              <div
                className={`py-3 transition-colors cursor-pointer ${hoveredRelation === 'encargado' ? 'text-cyber-primary' : 'text-slate-400'}`}
                onMouseEnter={() => setHoveredRelation('encargado')}
                onMouseLeave={() => setHoveredRelation(null)}
              >
                <div className="flex justify-between font-bold">
                  <span>encargado → medida</span>
                  <span className="text-[10px] bg-cyber-primary/10 text-cyber-primary px-1.5 rounded">1 : N</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-sans">
                  Un técnico supervisor (`id_encargado`) es responsable de supervisar múltiples lecturas de telemetría ambientales.
                </p>
              </div>

              <div
                className={`py-3 transition-colors cursor-pointer ${hoveredRelation === 'zona' ? 'text-cyber-primary' : 'text-slate-400'}`}
                onMouseEnter={() => setHoveredRelation('zona')}
                onMouseLeave={() => setHoveredRelation(null)}
              >
                <div className="flex justify-between font-bold">
                  <span>zona → medida</span>
                  <span className="text-[10px] bg-cyber-primary/10 text-cyber-primary px-1.5 rounded">1 : N</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-sans">
                  Una ubicación física (`id_zona`) contiene o aloja múltiples muestras ambientales en diferentes instantes de tiempo.
                </p>
              </div>

              <div
                className={`py-3 transition-colors cursor-pointer ${hoveredRelation === 'sensor' ? 'text-cyber-primary' : 'text-slate-400'}`}
                onMouseEnter={() => setHoveredRelation('sensor')}
                onMouseLeave={() => setHoveredRelation(null)}
              >
                <div className="flex justify-between font-bold">
                  <span>sensor → medida</span>
                  <span className="text-[10px] bg-cyber-primary/10 text-cyber-primary px-1.5 rounded">1 : N</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-sans">
                  Un sensor de hardware (`codigo_sensor`) emite y registra múltiples mediciones de humedad y temperatura a lo largo del tiempo.
                </p>
              </div>
            </div>
          </div>

          {/* Educational tips */}
          <div className="bg-cyber-primary/5 border border-cyber-primary/20 p-5 rounded-xl space-y-2">
            <h4 className="text-xs font-mono font-bold text-cyber-primary uppercase tracking-widest flex items-center gap-1.5">
              <Network size={14} />
              Integridad Referencial:
            </h4>
            <p className="text-[11px] font-sans text-slate-300 leading-relaxed">
              Las claves foráneas (FK) en la tabla `medida` aseguran que no se puedan registrar mediciones de zonas, encargados o sensores que no existan en el sistema. Esto previene la corrupción de datos y mantiene consistente el SCADA.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
