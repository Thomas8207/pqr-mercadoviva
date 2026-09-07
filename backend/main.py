import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import PQR
import schemas

# Crea la tabla "pqr" en Supabase si aún no existe
Base.metadata.create_all(bind=engine)

app = FastAPI(title="API de PQR - Mercado VIVA")

# Permite que el frontend (HTML/JS) se conecte a esta API sin bloqueos de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"mensaje": "API de PQR - Mercado VIVA funcionando correctamente"}


# ----------------------------------------------------------------
# HU1 — Registrar una PQR
# ----------------------------------------------------------------
@app.post("/pqr", response_model=schemas.PQRResponse, status_code=201)
def crear_pqr(datos: schemas.PQRCreate, db: Session = Depends(get_db)):
    """
    Registra una nueva PQR.
    Pydantic ya validó (HU5): campos obligatorios, formato de correo,
    longitud mínima de la descripción y tipo permitido.
    Genera un identificador único y guarda estado inicial "Recibida".
    """
    nueva_pqr = PQR(
        id=str(uuid.uuid4())[:8],  # identificador único y corto
        nombre=datos.nombre,
        contacto=datos.contacto,
        tipo=datos.tipo.value,
        descripcion=datos.descripcion,
        estado="Recibida",
        fecha_creacion=datetime.now(timezone.utc),
        fecha_actualizacion=datetime.now(timezone.utc),
    )

    db.add(nueva_pqr)
    db.commit()
    db.refresh(nueva_pqr)

    return nueva_pqr


# ----------------------------------------------------------------
# HU4 — Listar todas las PQR registradas (para el administrador)
# ----------------------------------------------------------------
@app.get("/pqr", response_model=List[schemas.PQRResponse])
def listar_pqr(db: Session = Depends(get_db)):
    """
    Lista todas las PQR registradas.
    Si no hay ninguna, devuelve una lista vacía (no un error).
    """
    return db.query(PQR).order_by(PQR.fecha_creacion.desc()).all()


# ----------------------------------------------------------------
# HU2 — Consultar el estado de una PQR por su identificador
# ----------------------------------------------------------------
@app.get("/pqr/{pqr_id}", response_model=schemas.PQRResponse)
def consultar_pqr(pqr_id: str, db: Session = Depends(get_db)):
    """
    Consulta una PQR por su identificador.
    Si no existe, responde 404 con un mensaje claro.
    """
    pqr = db.query(PQR).filter(PQR.id == pqr_id).first()

    if not pqr:
        raise HTTPException(status_code=404, detail="PQR no encontrada")

    return pqr


# ----------------------------------------------------------------
# HU3 — Actualizar el estado de una PQR (administrador)
# ----------------------------------------------------------------
@app.put("/pqr/{pqr_id}/estado", response_model=schemas.PQRResponse)
def actualizar_estado(
        pqr_id: str, datos: schemas.PQRUpdateEstado, db: Session = Depends(get_db)
):
    """
    Actualiza el estado de una PQR existente.
    Pydantic ya valida que el estado sea uno de los permitidos
    (Recibida, En proceso, Resuelta, Cerrada).
    Si la PQR no existe, responde 404 y no realiza ningún cambio.
    """
    pqr = db.query(PQR).filter(PQR.id == pqr_id).first()

    if not pqr:
        raise HTTPException(status_code=404, detail="PQR no encontrada")

    pqr.estado = datos.estado.value
    pqr.fecha_actualizacion = datetime.now(timezone.utc)

    db.commit()
    db.refresh(pqr)

    return pqr