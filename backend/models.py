from sqlalchemy import Column, String, DateTime
from datetime import datetime, timezone
from database import Base

class PQR(Base):
    __tablename__ = "pqr"

    id = Column(String, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    contacto = Column(String, nullable=False)
    tipo = Column(String, nullable=False)
    descripcion = Column(String, nullable=False)
    estado = Column(String, nullable=False, default="Recibida")
    fecha_creacion = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    fecha_actualizacion = Column(DateTime, default=lambda: datetime.now(timezone.utc))