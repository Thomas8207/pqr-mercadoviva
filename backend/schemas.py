import re
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from enum import Enum


class TipoPQR(str, Enum):
    peticion = "peticion"
    queja = "queja"
    reclamo = "reclamo"

class EstadoPQR(str, Enum):
    recibida = "Recibida"
    en_proceso = "En proceso"
    resuelta = "Resuelta"
    cerrada = "Cerrada"

PATRON_CORREO = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

class PQRCreate(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    contacto: str = Field(..., min_length=3, max_length=100)
    tipo: TipoPQR
    descripcion: str = Field(..., min_length=10, max_length=1000)

    @field_validator("nombre")
    @classmethod
    def nombre_no_vacio(cls, v):
        if not v.strip():
            raise ValueError("El nombre no puede estar vacío")
        return v.strip()

    @field_validator("descripcion")
    @classmethod
    def descripcion_no_vacia(cls, v):
        if not v.strip():
            raise ValueError("La descripción no puede estar vacía")
        return v.strip()

    @field_validator("contacto")
    @classmethod
    def validar_contacto(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("El contacto no puede estar vacío")
        if "@" in v and not PATRON_CORREO.match(v):
            raise ValueError("Ingrese un correo válido")
        return v

class PQRUpdateEstado(BaseModel):
    estado: EstadoPQR

class PQRResponse(BaseModel):
    id: str
    nombre: str
    contacto: str
    tipo: str
    descripcion: str
    estado: str
    fecha_creacion: datetime
    fecha_actualizacion: datetime

    class Config:
        from_attributes = True
