import React, { useState, useEffect } from 'react';
import { Network, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
// GSAP removed to eliminate repeated animations

export default function Normalization() {
  const [activeStep, setActiveStep] = useState(0);

  // Animaciones GSAP eliminadas; la transición de pasos es estática.

  const steps = [
    {
      title: 'Forma No Normal (0NF)',
      desc: 'El log de lecturas contiene redundancia masiva de datos en cada registro.',
      alert: 'Redundancia masiva de nombres de zonas, responsables y modelos de sensores.',
      tables: [
        {
          name: 'Registro Total Único (Log Raw)',
          cols: ['Medición ID', 'Fecha', 'Hora', 'Temp.', 'Hum.', 'Cod. Sensor', 'Nombre Sensor', 'Modelo', 'Zona ID', 'Nombre Zona', 'Ref Temp', 'Encargado CC', 'Nombre Encargado']
        }
      ],
      explanation: 'Cada vez que el sensor DTH11 toma una lectura de 22.6°C en el Laboratorio de Mecatrónica, se duplica el nombre del sensor, el modelo, las temperaturas de setpoint del laboratorio, y la cédula, edad y nombre del encargado responsable Yesid Ávila en el disco duro. Esto es inaceptable para almacenamiento a gran escala.'
    },
    {
      title: 'Primera Forma Normal (1NF)',
      desc: 'Eliminación de grupos repetitivos y establecimiento de columnas atómicas con Claves Primarias.',
      alert: 'Se definen claves primarias exactas para cada fila. No hay celdas con valores múltiples.',
      tables: [
        {
          name: 'Lectura Atómica (1NF)',
          cols: ['id_medicion [PK]', 'fecha', 'hora', 'valor_temperatura', 'valor_humedad', 'codigo_sensor', 'nombre_sensor', 'modelo', 'id_zona', 'nombre_zona', 'temp_ambiente', 'cc_encargado', 'nombre_encargado']
        }
      ],
      explanation: 'En esta etapa se garantiza que cada celda contenga un único valor indivisible (atómico), eliminando cualquier arreglo de datos o listas internas, y se establece un identificador único global para la medición (id_medicion).'
    },
    {
      title: 'Segunda Forma Normal (2NF)',
      desc: 'Eliminación de dependencias parciales sobre la clave primaria.',
      alert: 'Atributos no clave deben depender de la Clave Primaria en su totalidad.',
      tables: [
        {
          name: 'Tabla: SENSOR',
          cols: ['codigo_sensor [PK]', 'nombre_sensor', 'modelo']
        },
        {
          name: 'Tabla: ZONA',
          cols: ['id_zona [PK]', 'nombre_zona', 'temp_ambiente', 'humedad_ambiente']
        },
        {
          name: 'Tabla: LECTURA_TEMPORAL (2NF)',
          cols: ['id_medicion [PK]', 'fecha', 'hora', 'valor_temperatura', 'valor_humedad', 'codigo_sensor [FK]', 'id_zona [FK]', 'cc_encargado', 'nombre_encargado']
        }
      ],
      explanation: 'Los campos nombre_sensor y modelo dependen funcionalmente de codigo_sensor, no de la medición. Del mismo modo, nombre_zona depende de id_zona. Se crean las entidades independientes SENSOR y ZONA, dejando llaves foráneas [FK] en la tabla de mediciones.'
    },
    {
      title: 'Tercera Forma Normal (3NF) - Lógico Final',
      desc: 'Eliminación de dependencias transitivas. Estructura de producción óptima.',
      alert: 'Ningún atributo depende de forma transitiva de la clave primaria a través de otro atributo.',
      tables: [
        {
          name: 'Tabla: ENCARGADO',
          cols: ['id_encargado [PK]', 'cc [Unique]', 'nombre', 'edad']
        },
        {
          name: 'Tabla: ZONA',
          cols: ['id_zona [PK]', 'nombre_zona', 'temp_ambiente', 'humedad_ambiente']
        },
        {
          name: 'Tabla: SENSOR',
          cols: ['codigo_sensor [PK]', 'nombre_sensor', 'modelo']
        },
        {
          name: 'Tabla: MEDIDA',
          cols: ['id_medicion [PK]', 'fecha', 'hora', 'valor_temperatura', 'valor_humedad', 'codigo_sensor [FK]', 'id_zona [FK]', 'id_encargado [FK]']
        }
      ],
      explanation: 'El nombre y la edad del responsable dependen directamente de cc_encargado, no del id_medicion. Al crear la tabla ENCARGADO, eliminamos esta transitividad. Esta es la base final del SCADA, libre de anomalías de inserción, actualización o borrado.'
    }
  ];

  return (
    <div className="space-y-8">
      {/* View Header */}
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-wider text-slate-100 uppercase">
          Proceso de Normalización Relacional
        </h1>
        <p className="text-sm text-slate-400 font-sans mt-1">
          Flujo didáctico interactivo que ilustra la conversión del log raw plano de sensores (0NF) hacia el modelo relacional final 3NF.
        </p>
      </div>

      {/* 1. Step Navigation Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-cyber-900/60 p-2 rounded-xl border border-cyber-800/80 backdrop-blur-md">
        {steps.map((step, idx) => (
          <button
            key={idx}
            onClick={() => setActiveStep(idx)}
            className={`flex items-center justify-between px-4 py-3 rounded-lg font-mono text-xs font-semibold tracking-wider uppercase transition-all ${
              activeStep === idx 
                ? 'bg-cyber-primary/10 border border-cyber-primary/30 text-cyber-primary glow-text-primary' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-cyber-800/40 border border-transparent'
            }`}
          >
            <span>{step.title.split(' ')[0]} {step.title.split(' ')[1]}</span>
            <ArrowRight size={14} className={activeStep === idx ? 'text-cyber-primary translate-x-1 transition-transform' : 'text-slate-500'} />
          </button>
        ))}
      </div>

      {/* 2. Step Details Panel */}
      <div className="step-content-card glass-card p-8 border-cyber-800/80 space-y-6">
        
        {/* Step Header info */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4 border-b border-cyber-800/50 pb-6">
          <div className="space-y-1.5">
            <span className="text-xs font-mono text-cyber-secondary uppercase tracking-widest">
              ETAPA DE NORMALIZACIÓN {activeStep}
            </span>
            <h2 className="text-xl font-mono font-bold text-slate-100 uppercase">
              {steps[activeStep].title}
            </h2>
            <p className="text-sm font-sans text-slate-400 max-w-2xl">{steps[activeStep].desc}</p>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-cyber-danger/5 border border-cyber-danger/25 rounded-lg text-cyber-danger font-mono text-xs max-w-sm">
            <HelpCircle size={28} className="shrink-0 text-cyber-warning" />
            <span>{steps[activeStep].alert}</span>
          </div>
        </div>

        {/* 3. Interactive Schema Visualizer */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
            Esquema Lógico Resultante:
          </h3>
          
          <div className="flex flex-wrap gap-6 items-start">
            {steps[activeStep].tables.map((table, tIdx) => (
              <div key={tIdx} className="transform-element bg-cyber-900 border border-cyber-800 rounded-xl overflow-hidden min-w-[280px] shadow-lg max-w-md">
                {/* Table Title */}
                  <div className="bg-cyber-850 px-4 py-2 border-b border-cyber-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyber-secondary animate-pulse-once"></span>
                  <span className="font-mono text-xs font-bold text-slate-200">{table.name}</span>
                </div>
                
                {/* Table Columns List */}
                <div className="p-3 divide-y divide-cyber-850 font-mono text-[11px]">
                  {table.cols.map((col, cIdx) => {
                    const isPK = col.includes('[PK]');
                    const isFK = col.includes('[FK]');
                    return (
                      <div key={cIdx} className="py-1.5 flex justify-between gap-6 items-center">
                        <span className={`tracking-wide ${isPK ? 'text-cyber-primary font-bold' : isFK ? 'text-cyber-secondary' : 'text-slate-300'}`}>
                          {col.split(' ')[0]}
                        </span>
                        {isPK && <span className="text-[9px] bg-cyber-primary/10 border border-cyber-primary/20 px-1 rounded text-cyber-primary">PK</span>}
                        {isFK && <span className="text-[9px] bg-cyber-secondary/10 border border-cyber-secondary/20 px-1 rounded text-cyber-secondary">FK</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Educational Explanation block */}
        <div className="bg-cyber-950/60 border border-cyber-800/80 p-6 rounded-xl space-y-2">
          <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-cyber-primary" />
            Análisis Académico y Técnico:
          </h4>
          <p className="text-sm font-sans text-slate-300 leading-relaxed">
            {steps[activeStep].explanation}
          </p>
        </div>

      </div>
    </div>
  );
}
