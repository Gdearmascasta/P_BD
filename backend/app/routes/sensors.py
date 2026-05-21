from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database.connection import get_db
from backend.app.models.sensor_models import Sensor, Zona, Encargado

router = APIRouter(prefix="/sensors", tags=["Sensors & Zones"])

@router.get("/")
async def get_sensors(db: AsyncSession = Depends(get_db)):
    """Fetches all physical devices configured."""
    result = await db.execute(select(Sensor))
    return result.scalars().all()

@router.get("/zones")
async def get_zones(db: AsyncSession = Depends(get_db)):
    """Fetches all physical zones / locations."""
    result = await db.execute(select(Zona))
    return result.scalars().all()

@router.get("/encargados")
async def get_encargados(db: AsyncSession = Depends(get_db)):
    """Fetches all operational personnel responsible for supervision."""
    result = await db.execute(select(Encargado))
    return result.scalars().all()
