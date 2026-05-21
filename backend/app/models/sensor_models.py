from sqlalchemy import Column, Integer, SmallInteger, String, Numeric, Date, Time, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.app.database.connection import Base

class Encargado(Base):
    __tablename__ = "encargado"

    id_encargado = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    cc = Column(String(20), nullable=False, unique=True)
    edad = Column(SmallInteger, nullable=False)

    medidas = relationship("Medida", back_populates="encargado")

class Zona(Base):
    __tablename__ = "zona"

    id_zona = Column(SmallInteger, primary_key=True, autoincrement=True)
    nombre_zona = Column(String(100), nullable=False)
    temp_ambiente = Column(Numeric(4, 1), nullable=True)
    humedad_ambiente = Column(Numeric(4, 1), nullable=True)

    medidas = relationship("Medida", back_populates="zona")

class Sensor(Base):
    __tablename__ = "sensor"

    codigo_sensor = Column(String(10), primary_key=True)
    nombre_sensor = Column(String(100), nullable=False)
    modelo = Column(String(20), nullable=False)

    medidas = relationship("Medida", back_populates="sensor")

class Medida(Base):
    __tablename__ = "medida"

    id_medicion = Column(Integer, primary_key=True, autoincrement=True)
    fecha = Column(Date, nullable=False)
    hora = Column(Time, nullable=False)
    valor_temperatura = Column(Numeric(4, 1), nullable=False)
    valor_humedad = Column(Numeric(4, 1), nullable=False)
    
    codigo_sensor = Column(String(10), ForeignKey("sensor.codigo_sensor"), nullable=False)
    id_zona = Column(SmallInteger, ForeignKey("zona.id_zona"), nullable=False)
    id_encargado = Column(Integer, ForeignKey("encargado.id_encargado"), nullable=False)

    # Relationships
    encargado = relationship("Encargado", back_populates="medidas")
    zona = relationship("Zona", back_populates="medidas")
    sensor = relationship("Sensor", back_populates="medidas")
