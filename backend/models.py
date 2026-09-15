from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
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

    comentarios = relationship(
        "ComentarioPQR",
        back_populates="pqr",
        order_by="ComentarioPQR.fecha_creacion",
        cascade="all, delete-orphan",
    )


class ComentarioPQR(Base):
    __tablename__ = "comentarios_pqr"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pqr_id = Column(String, ForeignKey("pqr.id"), nullable=False, index=True)
    autor = Column(String, nullable=False, default="Administrador")
    mensaje = Column(String, nullable=False)
    fecha_creacion = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    pqr = relationship("PQR", back_populates="comentarios")