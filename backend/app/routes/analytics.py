from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database.connection import get_db
from backend.app.models.sensor_models import Medida, Zona, Sensor

router = APIRouter(prefix="/analytics", tags=["Analytics & SCADA"])

@router.get("/summary")
async def get_summary_kpis(db: AsyncSession = Depends(get_db)):
    """Computes critical system-wide KPIs for the SCADA dashboard."""
    # Counts
    total_readings_res = await db.execute(select(func.count(Medida.id_medicion)))
    total_readings = total_readings_res.scalar() or 0

    total_sensors_res = await db.execute(select(func.count(Sensor.codigo_sensor)))
    total_sensors = total_sensors_res.scalar() or 0

    total_zones_res = await db.execute(select(func.count(Zona.id_zona)))
    total_zones = total_zones_res.scalar() or 0

    # Aggregates
    stats_res = await db.execute(
        select(
            func.avg(Medida.valor_temperatura),
            func.avg(Medida.valor_humedad),
            func.min(Medida.valor_temperatura),
            func.max(Medida.valor_temperatura),
            func.min(Medida.valor_humedad),
            func.max(Medida.valor_humedad)
        )
    )
    avg_temp, avg_hum, min_temp, max_temp, min_hum, max_hum = stats_res.fetchone() or (0, 0, 0, 0, 0, 0)

    # Anomaly Count (temp > 33 or hum < 45 or hum > 85)
    anomalies_res = await db.execute(
        select(func.count(Medida.id_medicion)).where(
            (Medida.valor_temperatura > 33.0) | 
            (Medida.valor_humedad < 45.0) | 
            (Medida.valor_humedad > 80.0)
        )
    )
    total_anomalies = anomalies_res.scalar() or 0

    return {
        "total_readings": total_readings,
        "total_sensors": total_sensors,
        "total_zones": total_zones,
        "average_temperature": round(float(avg_temp or 0), 2),
        "average_humidity": round(float(avg_hum or 0), 2),
        "min_temperature": float(min_temp or 0),
        "max_temperature": float(max_temp or 0),
        "min_humidity": float(min_hum or 0),
        "max_humidity": float(max_hum or 0),
        "total_anomalies": total_anomalies
    }

@router.get("/zones-statistics")
async def get_zones_statistics(db: AsyncSession = Depends(get_db)):
    """Computes comparison between actual readings and zone ambient references."""
    query = (
        select(
            Zona.nombre_zona,
            Zona.temp_ambiente,
            Zona.humedad_ambiente,
            func.avg(Medida.valor_temperatura).label("avg_temp"),
            func.avg(Medida.valor_humedad).label("avg_hum"),
            func.count(Medida.id_medicion).label("readings_count")
        )
        .join(Medida, Zona.id_zona == Medida.id_zona)
        .group_by(Zona.id_zona, Zona.nombre_zona, Zona.temp_ambiente, Zona.humedad_ambiente)
    )
    
    result = await db.execute(query)
    rows = result.fetchall()
    
    stats = []
    for r in rows:
        stats.append({
            "nombre_zona": r.nombre_zona,
            "temp_referencia": float(r.temp_ambiente) if r.temp_ambiente else None,
            "humedad_referencia": float(r.humedad_ambiente) if r.humedad_ambiente else None,
            "temperatura_promedio": round(float(r.avg_temp or 0), 2),
            "humedad_promedio": round(float(r.avg_hum or 0), 2),
            "total_mediciones": r.readings_count
        })
    return stats

@router.get("/sensors-comparison")
async def get_sensors_comparison(db: AsyncSession = Depends(get_db)):
    """Compares metrics between DHT11 and DHT22 high-precision sensors."""
    query = (
        select(
            Medida.codigo_sensor,
            func.avg(Medida.valor_temperatura).label("avg_temp"),
            func.avg(Medida.valor_humedad).label("avg_hum"),
            func.min(Medida.valor_temperatura).label("min_temp"),
            func.max(Medida.valor_temperatura).label("max_temp")
        )
        .group_by(Medida.codigo_sensor)
    )
    
    result = await db.execute(query)
    rows = result.fetchall()
    
    comparison = {}
    for r in rows:
        comparison[r.codigo_sensor] = {
            "sensor": r.codigo_sensor,
            "temperatura_promedio": round(float(r.avg_temp or 0), 2),
            "humedad_promedio": round(float(r.avg_hum or 0), 2),
            "temperatura_minima": float(r.min_temp or 0),
            "temperatura_maxima": float(r.max_temp or 0)
        }
    return comparison
