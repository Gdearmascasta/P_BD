# Plataforma de Monitoreo SCADA IoT & SQL Analytics Studio

Esta es una plataforma industrial full-stack diseñada para la supervisión de telemetría de variables ambientales (temperatura y humedad) capturadas por sensores DHT11 y DHT22. Además de servir como un panel operativo en tiempo real, la plataforma funciona como un entorno educativo interactivo que documenta y ejecuta todo el ciclo de vida de la ingeniería de datos: desde logs raw redundantes hasta normalización relacional de tercera forma normal (3NF), modelo ER (lógico y físico), un pipeline de migración ETL programático y una consola interactiva de consultas SQL impulsada por Monaco Editor.

---

## 🚀 Arquitectura y Componentes Clave

La plataforma está construida utilizando un esquema unificado de despliegue en un solo contenedor, simplificando la orquestación en la nube (ej: Fl0):

1. **Frontend (React + Vite + Tailwind CSS + Recharts + Monaco Editor)**:
   - **Dashboard Cockpit**: Muestra de telemetría en tiempo real, alarmas operativas y matriz de calibración DHT11/DHT22.
   - **Normalizador Interactivo**: Guía didáctica que enseña la descomposición de relaciones desde 0NF hasta 3NF con explicaciones teóricas y diagramas estructurados.
   - **Modelo ER Activo**: Visualizador interactivo SVG del esquema de base de datos con alternador lógico/físico (PostgreSQL).
   - **SQL Playground Studio**: Consola de base de datos impulsada por Monaco Editor con 20 consultas pre-cargadas clasificadas y autotrazado de gráficas estadísticas (Recharts) basado en los datos resultantes.
   - **Consola de Migración ETL**: Centro de control para iniciar el pipeline de migración, mostrando un visualizador de fases y logs de terminal con scrolling automático.

2. **Backend (FastAPI + SQLAlchemy Async + SQLite Fallback / PostgreSQL)**:
   - **Motor de Datos Dual**: Si se configura `DATABASE_URL` con un servidor PostgreSQL, utiliza un pool de conexiones optimizado via `asyncpg`. Si no está configurada, utiliza de manera transparente una base de datos local SQLite (`sensors_local.db`) a través de `aiosqlite` sin configuraciones previas.
   - **Servicio de Migración ETL**: Regex parser programático que lee el archivo legacy `sensores_normalizado_mysql.sql`, extrae los registros, los limpia de incompatibilidades de sintaxis, realiza el casteo de tipos de datos a objetos nativos de Python, ejecuta inserciones en lotes (batch inserts) y registra auditoría detallada.
   - **Playground Sandboxed Service**: Ejecutor seguro que valida que las consultas ingresadas en el playground sean únicamente de lectura (`SELECT` / `WITH`) para evitar alteraciones no deseadas a los esquemas de producción.
   - **Servidor SPA Integrado**: FastAPI intercepta las rutas 404 que no pertenecen a la API ni a la documentación interactiva Swagger (`/docs`) y las redirige al entrypoint compiled React Router (`index.html`), permitiendo servir la aplicación completa en un único puerto web.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**:
  - React 19 (Hooks)
  - Vite 8 (Vind/Rolldown compiler)
  - Tailwind CSS v4 (Motor CSS moderno y ultra-rápido)
  - Recharts (Gráficas interactivas y responsivas)
  - Monaco Editor (`@monaco-editor/react`)
  - Zustand (Gestor de estado reactivo global)
  - Framer Motion (Transiciones y micro-animaciones)
  - GSAP (Animaciones robustas de entrada)
  - Lucide React (Íconos vectoriales)

- **Backend**:
  - FastAPI (Python 3.11)
  - SQLAlchemy 2.0 (ORM asíncrono)
  - asyncpg (Driver PostgreSQL asíncrono nativo de alto rendimiento)
  - aiosqlite (Motor SQLite asíncrono para desarrollo local)
  - Uvicorn (Servidor ASGI de producción)

---

## 📊 Diccionario de Datos del Esquema Relacional (3NF)

La base de datos del SCADA está dividida en 4 tablas altamente optimizadas en cumplimiento con la 3NF para evitar redundancias de inserción, actualización o borrado:

1. **`encargado`**:
   - `id_encargado` (SERIAL, PK): Identificador único del técnico supervisor.
   - `nombre` (VARCHAR(100), NN): Nombre completo del operador.
   - `cc` (VARCHAR(20), NN, UQ): Cédula de ciudadanía o identificación única.
   - `edad` (SMALLINT, NN): Edad del técnico.

2. **`zona`**:
   - `id_zona` (SERIAL, PK): Código de identificación física de la zona o laboratorio.
   - `nombre_zona` (VARCHAR(100), NN): Nombre descriptivo (ej: "Laboratorio de Mecatrónica").
   - `temp_ambiente` (NUMERIC(4,1), NULL): Temperatura ambiente de referencia en °C.
   - `humedad_ambiente` (NUMERIC(4,1), NULL): Humedad relativa de referencia en %.

3. **`sensor`**:
   - `codigo_sensor` (VARCHAR(10), PK): Código alfanumérico único del hardware (ej: "S01").
   - `nombre_sensor` (VARCHAR(100), NN): Nombre comercial del transductor.
   - `modelo` (VARCHAR(20), NN): Modelo específico del componente (ej: "DHT11", "DHT22").

4. **`medida`**:
   - `id_medicion` (SERIAL, PK): Identificador secuencial de la muestra temporal.
   - `fecha` (DATE, NN): Fecha calendario del registro.
   - `hora` (TIME, NN): Hora del día del registro.
   - `valor_temperatura` (NUMERIC(4,1), NN): Variable física de temperatura medida.
   - `valor_humedad` (NUMERIC(4,1), NN): Variable física de humedad medida.
   - `codigo_sensor` (VARCHAR(10), FK -> sensor): Relación al dispositivo físico.
   - `id_zona` (SMALLINT, FK -> zona): Relación al espacio físico monitoreado.
   - `id_encargado` (INTEGER, FK -> encargado): Técnico de turno responsable.

---

## ⚙️ Configuración e Instalación Local

### Requisitos Previos

Asegúrese de tener instalado:
- **Python 3.10+**
- **Node.js 18+** y **npm**
- **Docker** & **Docker Compose** *(opcional para pruebas en contenedores)*

---

### Método 1: Ejecución Manual en Desarrollo Local (Zero-Config)

Este método levantará la aplicación utilizando una base de datos SQLite local autogenerada y autosembrada de manera transparente.

#### 1. Clonar el repositorio y acceder a la carpeta
```bash
cd P_BD
```

#### 2. Compilar el Frontend React
Acceda al directorio frontend, instale las dependencias y construya los archivos de distribución para producción:
```bash
cd frontend
npm install
npm run build
cd ..
```

#### 3. Instalar dependencias del Backend Python
Instale los paquetes especificados en `requirements.txt`:
```bash
pip install -r backend/requirements.txt
```

#### 4. Levantar el Servidor FastAPI
Ejecute Uvicorn desde la raíz del proyecto:
```bash
python -m uvicorn backend.app.main:app --port 8000 --reload
```

La plataforma estará disponible en:
- **Aplicación Web**: [http://localhost:8000](http://localhost:8000)
- **Documentación API (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

*Nota: Al iniciar el servidor por primera vez, el backend detectará que la base de datos local SQLite está vacía e iniciará automáticamente el pipeline de migración ETL desde `sensores_normalizado_mysql.sql`, importando y transformando las 594 muestras en pocos milisegundos.*

---

### Método 2: Despliegue con Docker Compose (PostgreSQL completo)

Este método levantará la infraestructura de base de datos relacional PostgreSQL de producción junto con la aplicación web integrada en una red aislada de Docker.

#### 1. Iniciar los contenedores
Desde la raíz del proyecto (`/P_BD`), ejecute:
```bash
docker-compose up --build
```

Docker se encargará de:
1. Crear una base de datos relacional PostgreSQL con salud monitoreada (`scada_postgres_db` en el puerto `5432`).
2. Levantar la aplicación web integrada, compilar el frontend React, conectarse a PostgreSQL mediante `asyncpg` asíncrono, inicializar las tablas automáticamente y sembrar las 594 variables ambientales.

Visite la plataforma en: [http://localhost:8000](http://localhost:8000)

---

## 🔒 Playground Studio SQL: Catálogo de Consultas

La plataforma incluye 20 consultas estructuradas en el sidebar clasificadas por complejidad para auditoría y analítica relacional, totalmente compatibles tanto con SQLite como con PostgreSQL. Entre ellas se destacan:

- **Básicas**: Consultas analíticas de catálogos y muestreos cronológicos simplificados.
- **SCADA & Agrupaciones**: Cálculo de promedios de temperatura y humedad agrupados por zonas operativas o modelos de transductores (calibración), ordenados descendentemente.
- **Anomalías e Industrial**: Identificación de valores críticos (Temperatura > 33°C o Humedad < 45%) y cálculo de la desviación real respecto al setpoint de referencia configurado por zona.
- **Avanzadas y Auditorías**: Detección de dispositivos sin telemetría mediante uniones externas (`LEFT JOIN`), subconsultas anidadas y filtros complejos de coincidencia de cadenas (`LIKE`).
