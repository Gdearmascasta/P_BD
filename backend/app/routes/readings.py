from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database.connection import get_db
from backend.app.models.sensor_models import Medida
from typing import Optional

router = APIRouter(prefix="/readings", tags=["Readings Data"])

@router.get("/")
async def get_readings(
    sensor: Optional[str] = Query(None, description="Filter by sensor code (e.g., DTH11)"),
    zona: Optional[int] = Query(None, description="Filter by zone ID"),
    limit: int = Query(100, ge=1, le=1000, description="Limit rows returned"),
    db: AsyncSession = Depends(get_db)
):
    """Fetches raw sensor measurements with optional filtering."""
    query = select(Medida)
    filters = []
    
    if sensor:
        filters.append(Medida.codigo_sensor == sensor)
    if zona:
        filters.append(Medida.id_zona == zona)
        
    if filters:
        query = query.where(and_(*filters))
        
    # Order by date and time to keep time series chronological
    query = query.order_by(Medida.fecha.asc(), Medida.hora.asc()).limit(limit)
    
    result = await db.execute(query)
    raw_medidas = result.scalars().all()
    
    # Format dates/times cleanly for json
    formatted = []
    for m in raw_medidas:
        formatted.append({
            "id_medicion": m.id_medicion,
            "fecha": m.fecha.isoformat(),
            "hora": m.hora.isoformat(),
            "valor_temperatura": float(m.valor_temperatura),
            "valor_humedad": float(m.valor_humedad),
            "codigo_sensor": m.codigo_sensor,
            "id_zona": m.id_zona,
            "id_encargado": m.id_encargado
        })
    return formatted
