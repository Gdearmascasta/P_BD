import React, { useState, useEffect } from 'react';
import { Network, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
// GSAP removed to eliminate repeated animations

export default function Normalization() {
  const [activeStep, setActiveStep] = useState(0);

  // Animaciones GSAP eliminadas; la transición de pasos es estática.

  const steps = [
    {
      title: 'Primera Forma (1FN)',
      desc: 'Identificación de tablas y campos: listar todas las tablas y sus atributos.',
      alert: 'Se listan todas las tablas y campos de cada tabla.',
      tables: [
        { name: 'ENCARGADO', cols: ['id_encargado', 'nombre', 'CC', 'edad'] },
        { name: 'ZONA', cols: ['id_zona', 'codigo_zona', 'nombre_zona', 'temp_ambiente', 'humedad_ambiente'] },
        { name: 'SENSOR', cols: ['id_sensor', 'codigo_sensor', 'nombre_sensor', 'modelo', 'id_zona'] },
        { name: 'MEDIDA', cols: ['id_medicion', 'fecha', 'hora', 'valor_temperatura', 'valor_humedad', 'id_sensor', 'id_zona', 'id_encargado'] }
      ],
      explanation: 'Listado completo de tablas y campos según la primera forma solicitada.'
    },
    {
      title: 'Segunda Forma (2FN)',
      desc: 'Repetición de las mismas tablas de 1FN pero indicando las llaves primarias (PK).',
      alert: 'Se muestran las mismas tablas que en 1FN y se señalan las PK.',
      tables: [
        { name: 'ENCARGADO', cols: ['id_encargado [PK]', 'nombre', 'CC', 'edad'] },
        { name: 'ZONA', cols: ['id_zona [PK]', 'codigo_zona', 'nombre_zona', 'temp_ambiente', 'humedad_ambiente'] },
        { name: 'SENSOR', cols: ['id_sensor [PK]', 'codigo_sensor', 'nombre_sensor', 'modelo', 'id_zona'] },
        { name: 'MEDIDA', cols: ['id_medicion [PK]', 'fecha', 'hora', 'valor_temperatura', 'valor_humedad', 'id_sensor', 'id_zona', 'id_encargado'] }
      ],
      explanation: 'Mismas tablas de la 1FN con las PK claramente identificadas. Observación: no se detectan dependencias transitivas que requieran nuevas tablas.'
    },
    {
      title: 'Tercera Forma (3FN)',
      desc: 'Tablas completas con sus llaves primarias y foráneas (PK y FK).',
      alert: 'Se muestran las tablas finales con PK y FK; no se crean tablas adicionales por transitividad.',
      tables: [
        { name: 'ENCARGADO', cols: ['id_encargado [PK]', 'CC', 'nombre', 'edad'] },
        { name: 'ZONA', cols: ['id_zona [PK]', 'codigo_zona', 'nombre_zona', 'temp_ambiente', 'humedad_ambiente'] },
        { name: 'SENSOR', cols: ['id_sensor [PK]', 'codigo_sensor', 'nombre_sensor', 'modelo', 'id_zona [FK] -> ZONA(id_zona)'] },
        { name: 'MEDIDA', cols: ['id_medicion [PK]', 'fecha', 'hora', 'valor_temperatura', 'valor_humedad', 'id_sensor [FK] -> SENSOR(id_sensor)', 'id_zona [FK] -> ZONA(id_zona)', 'id_encargado [FK] -> ENCARGADO(id_encargado)'] }
      ],
      explanation: 'Modelo en 3FN: tablas completas con PKs y FKs. Relaciones 1:N: SENSOR→MEDIDA, ZONA→MEDIDA, ENCARGADO→MEDIDA. No aplica 4FN (no hay M:N).'
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
