# Mercado VIVA — Módulo de PQR

MVP que permite a los clientes de **Mercado VIVA** registrar una **Petición, Queja o Reclamo (PQR)** y consultar su estado mediante un identificador único, mientras que el personal administrativo puede listar todas las PQR, actualizar su estado de gestión y **responder con comentarios** que el cliente puede ver al consultar su PQR.

Proyecto desarrollado como taller de implementación de un MVP (frontend + backend + base de datos).

## 🚀 Proyecto desplegado

| Componente           | Servicio           | URL                                             |
| --------------------- | ------------------ | ----------------------------------------------- |
| Frontend              | GitHub Pages       | <https://thomas8207.github.io/pqr-mercadoviva/> |
| Backend / API         | Render (plan Free) | <https://pqr-mercadoviva.onrender.com>          |
| Base de datos + Auth  | Supabase           | (privado)                                       |

> ⚠️ El backend está en el plan gratuito de Render: si nadie lo usa por 15 minutos, se "duerme". La primera petición después de eso puede tardar 30-60 segundos en responder mientras despierta — es normal, no es un error.

No necesitas instalar nada para probar el proyecto: solo entra a la URL del frontend de arriba. Las secciones de instalación de abajo son solo para correrlo en local durante desarrollo.

## Problema que resuelve

Mercado VIVA no contaba con un sistema unificado para registrar, consultar y hacer seguimiento a las PQR de sus clientes, lo que generaba pérdida de información, respuestas tardías y dificultad para saber quién debía atender cada solicitud.

**Usuarios del sistema:**

- **Cliente** — registra una PQR, consulta su estado con el identificador que recibe y puede leer los comentarios/respuestas que el administrador le deja.
- **Administrador** — consulta el listado completo de PQR, actualiza su estado y responde a cada PQR con uno o varios comentarios.

## Alcance del MVP

Incluye:

- Registro de una nueva PQR con validación de datos.
- Generación automática de un identificador único por PQR.
- Consulta del estado y detalle de una PQR por su identificador (incluye los comentarios del administrador, si existen).
- Listado de todas las PQR (vista de administrador).
- Actualización del estado de una PQR (vista de administrador).
- Registro de comentarios/respuestas del administrador sobre una PQR (vista de administrador).
- Validación en frontend y backend, con mensajes de error claros.

No incluye (por ahora): notificaciones por correo, integración con sistemas internos de Mercado VIVA, ni analítica de PQR.

## Arquitectura

```
Frontend (HTML/CSS/JS)  →  API REST (FastAPI)  →  PostgreSQL (Supabase)
        ↑
        └── Autenticación de sesión (cliente/admin) vía Supabase Auth
```

- **docs/** — sitio estático (`index.html`, `app.js`, `hola.css`, `config.js`) que consume la API y usa Supabase Auth para diferenciar la vista de cliente y de administrador. Se llama `docs/` (y no `frontend/`) porque así lo exige GitHub Pages para publicarlo directo desde la rama `main`.
- **backend/** — API en **FastAPI** con **SQLAlchemy**, que expone los endpoints de PQR y comentarios, y persiste los datos en PostgreSQL (Supabase). Desplegada en Render.

## Historias de usuario implementadas

| HU  | Descripción                                | Endpoint / vista                                                       |
| --- | ------------------------------------------- | ------------------------------------------------------------------------ |
| HU1 | Registrar una PQR                          | `POST /pqr`                                                              |
| HU2 | Consultar el estado de una PQR             | `GET /pqr/{id}`                                                          |
| HU3 | Actualizar el estado de una PQR            | `PUT /pqr/{id}/estado`                                                   |
| HU4 | Listar todas las PQR                       | `GET /pqr`                                                               |
| HU5 | Validar la información al registrar        | Validaciones en frontend (`app.js`) + backend (`schemas.py`, Pydantic)  |
| HU6 | El administrador comenta/responde una PQR  | `POST /pqr/{id}/comentarios`                                             |

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

Devuelve el listado completo de PQR (lista vacía si no hay ninguna registrada), ordenado por fecha de creación descendente. Cada PQR incluye su lista de `comentarios`.

### `GET /pqr/{pqr_id}`

Consulta una PQR por su identificador.

- `200`: datos completos de la PQR, incluyendo la lista de `comentarios` (vacía si aún no tiene ninguno).
- `404`: `{"detail": "PQR no encontrada"}`.

### `PUT /pqr/{pqr_id}/estado`

Actualiza el estado de una PQR. Body:

```json
{ "estado": "En proceso" }
```

- Estados permitidos: `Recibida`, `En proceso`, `Resuelta`, `Cerrada`.
- `404` si el identificador no existe (no se realiza ningún cambio).

### `POST /pqr/{pqr_id}/comentarios`

Agrega un comentario/respuesta del administrador a una PQR existente. Body:

```json
{
  "mensaje": "Ya revisamos tu caso, en 24 horas tendrás una respuesta definitiva.",
  "autor": "admin@mercadoviva.com"
}
```

- `mensaje`: obligatorio, entre 2 y 1000 caracteres.
- `autor`: opcional, por defecto `"Administrador"` (el frontend envía el correo de la sesión admin activa).
- Respuesta `201`: la **PQR completa actualizada**, incluyendo el nuevo comentario dentro de `comentarios`.
- `404` si la PQR no existe.

El cliente puede ver estos comentarios al consultar su PQR con `GET /pqr/{id}`.

## Modelo de datos

### Tabla `pqr`

| Campo                  | Tipo     | Descripción                                                   |
| ----------------------- | -------- | --------------------------------------------------------------- |
| `id`                    | string   | Identificador único (generado automáticamente)                  |
| `nombre`                | string   | Nombre del cliente                                               |
| `contacto`              | string   | Correo o teléfono                                                 |
| `tipo`                  | string   | `peticion` / `queja` / `reclamo`                                  |
| `descripcion`           | string   | Detalle de la solicitud                                          |
| `estado`                | string   | `Recibida` (inicial) / `En proceso` / `Resuelta` / `Cerrada`     |
| `fecha_creacion`        | datetime | Fecha/hora de registro                                            |
| `fecha_actualizacion`   | datetime | Fecha/hora del último cambio de estado                            |
| `comentarios`           | lista    | Comentarios del administrador asociados (tabla `comentarios_pqr`) |

### Tabla `comentarios_pqr`

| Campo             | Tipo     | Descripción                                          |
| ------------------ | -------- | ------------------------------------------------------ |
| `id`                | integer  | Identificador único (autoincremental)                  |
| `pqr_id`            | string   | Referencia a la PQR comentada (FK a `pqr.id`)           |
| `autor`             | string   | Quién dejó el comentario (por defecto `"Administrador"`)|
| `mensaje`           | string   | Contenido del comentario/respuesta                       |
| `fecha_creacion`    | datetime | Fecha/hora en que se registró el comentario               |

Cada PQR puede tener varios comentarios (relación uno a muchos), ordenados por fecha de creación. Al eliminar una PQR se eliminan también sus comentarios (`cascade`).

## Despliegue en producción

### Backend en Render

- Servicio tipo **Web Service**, plan **Free**.
- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Variable de entorno `DATABASE_URL` con la cadena de conexión a Postgres (Supabase).

### Frontend en GitHub Pages

- Settings → Pages → Source: **Deploy from a branch** → Branch: `main` → carpeta: **/docs**.
- El archivo `docs/.nojekyll` está presente a propósito: le dice a GitHub que sirva los archivos tal cual, sin pasarlos por Jekyll (el generador de sitios que usa por defecto, pensado para blogs, no para HTML/CSS/JS plano).
- En `docs/config.js`, `API_BASE` debe apuntar a la URL de Render de arriba.

### Supabase — URL Configuration

Para que los enlaces de confirmación de correo funcionen (en vez de redirigir a `localhost`), en Authentication → URL Configuration:

- **Site URL:** `https://thomas8207.github.io/pqr-mercadoviva/`
- **Redirect URLs:** `https://thomas8207.github.io/pqr-mercadoviva/**`

## Requisitos (solo para correr en local)

- Python 3.10+
- Cuenta de [Supabase](https://supabase.com) (Postgres + Auth)
- Node no es necesario para el frontend (es HTML/CSS/JS estático)

## Configuración local

### 1. Backend

Crea `backend/.env` (este archivo NO se sube a git — está en `.gitignore`) con:

```
DATABASE_URL=postgresql://usuario:password@host:puerto/db
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu-anon-key
```

Instala dependencias y corre el servidor:

```
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Las tablas `pqr` y `comentarios_pqr` se crean automáticamente al iniciar (`Base.metadata.create_all`).

### 2. Frontend

Edita `docs/config.js` con la URL y llave de tu proyecto de Supabase y la URL de tu API local:

```
const SUPABASE_URL = "https://tu-proyecto.supabase.co";
const SUPABASE_ANON_KEY = "tu-anon-key";
const API_BASE = "http://localhost:8000";
```

⚠️ Recuerda volver a poner la URL de Render antes de subir el commit — si dejas `localhost`, el sitio publicado en producción deja de funcionar.

Sirve la carpeta como sitio estático:

```
cd docs
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
- Comentario vacío → "Escribe un comentario antes de enviarlo".

**Backend (siempre revalida, aunque el frontend ya validó):**

- Datos faltantes o mal formateados → `400`.
- Tipo de PQR o estado fuera de los valores permitidos → `400`.
- Comentario con menos de 2 caracteres → `400`.
- Identificador inexistente al consultar, actualizar o comentar → `404` ("PQR no encontrada").
- Error inesperado de base de datos → `500` (sin exponer detalles internos).

## Casos de prueba sugeridos

- **Flujo exitoso:** registrar una PQR válida → consultarla por su identificador → actualizar su estado como administrador → dejar un comentario como administrador → volver a consultarla como cliente y verificar que el comentario aparece.
- **Caso excepcional:** consultar un identificador que no existe → debe responder `404` con "PQR no encontrada".
- **Caso excepcional:** intentar comentar una PQR con un identificador que no existe → debe responder `404` con "PQR no encontrada".

## Estructura del repositorio

```
├── backend/
│   ├── main.py          # Endpoints de la API (PQR y comentarios)
│   ├── models.py        # Modelos SQLAlchemy: PQR y ComentarioPQR
│   ├── schemas.py        # Validaciones Pydantic (HU5) para PQR y comentarios
│   ├── database.py       # Conexión a PostgreSQL/Supabase
│   └── requirements.txt
├── docs/                  # frontend — nombre exigido por GitHub Pages
│   ├── index.html
│   ├── app.js             # Lógica de autenticación, PQR y comentarios
│   ├── config.js          # Credenciales de Supabase y URL de la API
│   ├── hola.css
│   ├── img/
│   └── .nojekyll          # desactiva el procesamiento Jekyll en GitHub Pages
└── README.md
```

## COLABORADORES

- Chocolatico14 (Andres Felipe Zora)
- Thomas8207
- CODEX1235 (Nicolas Peña)
- danyalexism (Dany Alexis Moreno)
