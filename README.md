# Mercado VIVA — Módulo de PQR

MVP que permite a los clientes de **Mercado VIVA** registrar una **Petición, Queja o Reclamo (PQR)** y consultar su estado mediante un identificador único, mientras que el personal administrativo puede listar todas las PQR y actualizar su estado de gestión.

Proyecto desarrollado como taller de implementación de un MVP (frontend + backend + base de datos).

## Problema que resuelve

Mercado VIVA no contaba con un sistema unificado para registrar, consultar y hacer seguimiento a las PQR de sus clientes, lo que generaba pérdida de información, respuestas tardías y dificultad para saber quién debía atender cada solicitud.

**Usuarios del sistema:**
- **Cliente** — registra una PQR y consulta su estado con el identificador que recibe.
- **Administrador** — consulta el listado completo de PQR y actualiza su estado.

## Alcance del MVP

Incluye:
- Registro de una nueva PQR con validación de datos.
- Generación automática de un identificador único por PQR.
- Consulta del estado y detalle de una PQR por su identificador.
- Listado de todas las PQR (vista de administrador).
- Actualización del estado de una PQR (vista de administrador).
- Validación en frontend y backend, con mensajes de error claros.

No incluye (por ahora): notificaciones por correo, integración con sistemas internos de Mercado VIVA, ni analítica de PQR.

## Arquitectura

```
Frontend (HTML/CSS/JS)  →  API REST (FastAPI)  →  PostgreSQL (Supabase)
        ↑
        └── Autenticación de sesión (cliente/admin) vía Supabase Auth
```

- **Frontend/** — sitio estático (`index.html`, `app.js`, `hola.css`, `config.js`) que consume la API y usa Supabase Auth para diferenciar la vista de cliente y de administrador.
- **backend/** — API en **FastAPI** con **SQLAlchemy**, que expone los endpoints de PQR y persiste los datos en PostgreSQL (Supabase).

## Historias de usuario implementadas

| HU | Descripción | Endpoint / vista |
|----|-------------|-------------------|
| HU1 | Registrar una PQR | `POST /pqr` |
| HU2 | Consultar el estado de una PQR | `GET /pqr/{id}` |
| HU3 | Actualizar el estado de una PQR | `PUT /pqr/{id}/estado` |
| HU4 | Listar todas las PQR | `GET /pqr` |
| HU5 | Validar la información al registrar | Validaciones en frontend (`app.js`) + backend (`schemas.py`, Pydantic) |

## API — Endpoints

### `GET /`
Verifica que la API está corriendo.

### `POST /pqr`
Registra una nueva PQR. Body (JSON):
```json
{
  "nombre": "Juana Pérez",
  "contacto": "juana@correo.com",
  "tipo": "queja",
  "descripcion": "Descripción de al menos 10 caracteres"
}
```
- `tipo` acepta: `peticion`, `queja`, `reclamo`.
- Respuesta `201`: la PQR creada, con `id`, `estado: "Recibida"` y fechas.
- Respuesta `400`: datos inválidos o incompletos.

### `GET /pqr`
Devuelve el listado completo de PQR (lista vacía si no hay ninguna registrada), ordenado por fecha de creación descendente.

### `GET /pqr/{pqr_id}`
Consulta una PQR por su identificador.
- `200`: datos completos de la PQR.
- `404`: `{"detail": "PQR no encontrada"}`.

### `PUT /pqr/{pqr_id}/estado`
Actualiza el estado de una PQR. Body:
```json
{ "estado": "En proceso" }
```
- Estados permitidos: `Recibida`, `En proceso`, `Resuelta`, `Cerrada`.
- `404` si el identificador no existe (no se realiza ningún cambio).

## Modelo de datos (tabla `pqr`)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | Identificador único (generado automáticamente) |
| `nombre` | string | Nombre del cliente |
| `contacto` | string | Correo o teléfono |
| `tipo` | string | `peticion` / `queja` / `reclamo` |
| `descripcion` | string | Detalle de la solicitud |
| `estado` | string | `Recibida` (inicial) / `En proceso` / `Resuelta` / `Cerrada` |
| `fecha_creacion` | datetime | Fecha/hora de registro |
| `fecha_actualizacion` | datetime | Fecha/hora del último cambio de estado |

## Requisitos

- Python 3.10+
- Cuenta de [Supabase](https://supabase.com) (Postgres + Auth)
- Node no es necesario para el frontend (es HTML/CSS/JS estático)

## Configuración

### 1. Backend

Crea `backend/.env` con:
```env
DATABASE_URL=postgresql://usuario:password@host:puerto/db
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu-anon-key
```

Instala dependencias y corre el servidor:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
La tabla `pqr` se crea automáticamente al iniciar (`Base.metadata.create_all`).

### 2. Frontend

Edita `Frontend/config.js` con la URL y llave de tu proyecto de Supabase y la URL de tu API:
```js
const SUPABASE_URL = "https://tu-proyecto.supabase.co";
const SUPABASE_ANON_KEY = "tu-anon-key";
const API_BASE = "http://localhost:8000";
```

Sirve la carpeta como sitio estático:
```bash
cd Frontend
python -m http.server 5500
```
Abre `http://localhost:5500`.

### 3. Rol de administrador

Por defecto toda cuenta nueva se crea con rol `cliente`. Para dar acceso de administrador a una cuenta, actualiza su metadata en Supabase (SQL Editor):
```sql
update auth.users
set raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
where email = 'correo-admin@ejemplo.com';
```
La cuenta debe cerrar sesión y volver a iniciar sesión para que el cambio se refleje.

## Validaciones y manejo de errores

**Frontend:**
- Campos obligatorios vacíos → "Este campo es obligatorio".
- Correo con formato inválido → "Ingrese un correo válido".
- Descripción muy corta → "Describa su solicitud con más detalle".

**Backend (siempre revalida, aunque el frontend ya validó):**
- Datos faltantes o mal formateados → `400`.
- Tipo de PQR o estado fuera de los valores permitidos → `400`.
- Identificador inexistente al consultar o actualizar → `404` ("PQR no encontrada").
- Error inesperado de base de datos → `500` (sin exponer detalles internos).

## Casos de prueba sugeridos

- **Flujo exitoso:** registrar una PQR válida → consultarla por su identificador → actualizar su estado como administrador.
- **Caso excepcional:** consultar un identificador que no existe → debe responder `404` con "PQR no encontrada".

## Estructura del repositorio

```
├── backend/
│   ├── main.py         # Endpoints de la API
│   ├── models.py       # Modelo SQLAlchemy de la tabla pqr
│   ├── schemas.py       # Validaciones Pydantic (HU5)
│   ├── database.py      # Conexión a PostgreSQL/Supabase
│   └── requirements.txt
├── Frontend/
│   ├── index.html
│   ├── app.js           # Lógica de autenticación y consumo de la API
│   ├── config.js        # Credenciales de Supabase y URL de la API
│   └── hola.css
└── README.md
```
