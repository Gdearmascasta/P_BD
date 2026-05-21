from fastapi import APIRouter, Body
from backend.app.services.migration_service import ETLMigrationService
from backend.app.services.playground_service import SQLPlaygroundService
import os

router = APIRouter(tags=["Playground & ETL Migration"])

# Keep static reference to the latest migration details
_latest_migration_status = {
    "success": False,
    "duration_seconds": 0,
    "counts": {},
    "logs": ["No migrations run yet. Trigger one to start the ETL process."]
}

@router.post("/migration/run")
async def run_migration():
    """Triggers the programmatic ETL process (Extract -> Transform -> Load) from the MySQL seed file."""
    global _latest_migration_status
    result = await ETLMigrationService.execute_etl()
    _latest_migration_status = result
    return result

@router.get("/migration/logs")
async def get_migration_logs():
    """Retrieves audit logs of the latest ETL migration process."""
    return _latest_migration_status

@router.post("/queries/run")
async def run_playground_query(payload: dict = Body(..., example={"sql": "SELECT * FROM sensor;"})):
    """Executes a sandboxed read-only custom SQL query from the Monaco editor."""
    sql = payload.get("sql", "").strip()
    if not sql:
        return {
            "success": False,
            "error": "❌ Query is empty.",
            "headers": [],
            "rows": []
        }
    
    result = await SQLPlaygroundService.run_query(sql)
    return result

@router.get("/schema")
async def get_postgresql_schema():
    """Returns the technical physical DDL schema of PostgreSQL structures."""
    # Let's read the schema SQL file or return a structured clean schema
    schema_sql = """
-- ==========================================
-- PHYSICAL SCHEMA DEFINITIONS (POSTGRESQL)
-- ==========================================

CREATE TABLE encargado (
    id_encargado  SERIAL PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL,
    cc            VARCHAR(20)  NOT NULL UNIQUE,
    edad          SMALLINT     NOT NULL
);

CREATE TABLE zona (
    id_zona          SERIAL PRIMARY KEY,
    nombre_zona      VARCHAR(100) NOT NULL,
    temp_ambiente    NUMERIC(4,1),
    humedad_ambiente NUMERIC(4,1)
);

CREATE TABLE sensor (
    codigo_sensor  VARCHAR(10)  PRIMARY KEY,
    nombre_sensor  VARCHAR(100) NOT NULL,
    modelo         VARCHAR(20)  NOT NULL
);

CREATE TABLE medida (
    id_medicion       SERIAL PRIMARY KEY,
    fecha             DATE         NOT NULL,
    hora             TIME         NOT NULL,
    valor_temperatura NUMERIC(4,1) NOT NULL,
    valor_humedad     NUMERIC(4,1) NOT NULL,
    codigo_sensor     VARCHAR(10)  NOT NULL,
    id_zona           SMALLINT     NOT NULL,
    id_encargado      INTEGER      NOT NULL,
    CONSTRAINT fk_med_sensor    FOREIGN KEY (codigo_sensor) REFERENCES sensor(codigo_sensor),
    CONSTRAINT fk_med_zona      FOREIGN KEY (id_zona)       REFERENCES zona(id_zona),
    CONSTRAINT fk_med_encargado FOREIGN KEY (id_encargado)  REFERENCES encargado(id_encargado)
);

CREATE INDEX idx_med_zona      ON medida(id_zona);
CREATE INDEX idx_med_sensor    ON medida(codigo_sensor);
CREATE INDEX idx_med_fecha     ON medida(fecha);
CREATE INDEX idx_med_encargado ON medida(id_encargado);
"""
    return {"schema": schema_sql}
