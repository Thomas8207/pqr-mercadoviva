// ============================================================
// Mercado VIVA — lógica de la página (auth + PQR)
// Envuelto en guardián anti-doble-ejecución (evita 'already declared'
// si el navegador/IDE/preview reinyecta o re-ejecuta este script).
// ============================================================
if (!window.__mvAppInicializada) {
window.__mvAppInicializada = true;
(function () {
 
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
 
// ---------- Referencias del DOM ----------
const vistaInvitado = document.getElementById("vista-invitado");
const vistaCliente = document.getElementById("vista-cliente");
const vistaAdmin = document.getElementById("vista-admin");
 
const liRegistro = document.getElementById("li-registro");
const liLogin = document.getElementById("li-login");
const liUsuario = document.getElementById("li-usuario");
const liLogout = document.getElementById("li-logout");
const navUsuario = document.getElementById("nav-usuario");
 
const modalLogin = document.getElementById("modal-login");
const modalRegistro = document.getElementById("modal-registro");
 
// ---------- Utilidades ----------
function mostrar(el) { el.classList.remove("oculto"); }
function ocultar(el) { el.classList.add("oculto"); }
 
function abrirModal(modal) { mostrar(modal); }
function cerrarModal(modal) { ocultar(modal); }
 
function limpiarErrores(formId) {
    document.querySelectorAll(`#${formId} .error`).forEach(span => span.textContent = "");
}
 
const PATRON_CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
 
// ---------- Navegación / apertura de modales ----------
document.getElementById("nav-login").addEventListener("click", (e) => {
    e.preventDefault();
    abrirModal(modalLogin);
});
 
document.getElementById("nav-registro").addEventListener("click", (e) => {
    e.preventDefault();
    abrirModal(modalRegistro);
});
 
document.querySelectorAll(".cerrar-modal").forEach(span => {
    span.addEventListener("click", () => {
        cerrarModal(document.getElementById(span.dataset.modal));
    });
});
 
document.getElementById("nav-logout").addEventListener("click", async (e) => {
    e.preventDefault();
    await supabase.auth.signOut();
});
 
// ---------- Registro (siempre crea un cliente) ----------
document.getElementById("form-registro").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("registro-email").value.trim();
    const password = document.getElementById("registro-password").value;
    const msg = document.getElementById("mensaje-registro");
    msg.textContent = "";
    msg.className = "mensaje";
 
    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role: "cliente" } }
    });
 
    if (error) {
        msg.textContent = error.message;
        msg.classList.add("mensaje-error");
        return;
    }
 
    msg.textContent = "Cuenta creada. Revisa tu correo si se requiere confirmación, o inicia sesión.";
    msg.classList.add("mensaje-exito");
});
 
// ---------- Login ----------
document.getElementById("form-login").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const msg = document.getElementById("mensaje-login");
    msg.textContent = "";
    msg.className = "mensaje";
 
    const { error } = await supabase.auth.signInWithPassword({ email, password });
 
    if (error) {
        msg.textContent = error.message;
        msg.classList.add("mensaje-error");
        return;
    }
 
    cerrarModal(modalLogin);
});
 
// ---------- Reacciona a cambios de sesión (login, logout, carga inicial) ----------
supabase.auth.onAuthStateChange((_event, session) => {
    actualizarVistaSegunSesion(session);
});
 
async function actualizarVistaSegunSesion(session) {
    ocultar(vistaInvitado);
    ocultar(vistaCliente);
    ocultar(vistaAdmin);
    ocultar(liUsuario);
    ocultar(liLogout);
    mostrar(liRegistro);
    mostrar(liLogin);
 
    if (!session) {
        mostrar(vistaInvitado);
        return;
    }
 
    const rol = session.user.user_metadata?.role || "cliente";
 
    ocultar(liRegistro);
    ocultar(liLogin);
    mostrar(liUsuario);
    mostrar(liLogout);
    navUsuario.textContent = session.user.email;
 
    if (rol === "admin") {
        mostrar(vistaAdmin);
        cargarListadoPQR();
    } else {
        mostrar(vistaCliente);
    }
}
 
// ============================================================
// CLIENTE — HU1: registrar una PQR
// ============================================================
document.getElementById("form-pqr").addEventListener("submit", async (e) => {
    e.preventDefault();
    limpiarErrores("form-pqr");
 
    const nombre = document.getElementById("pqr-nombre").value.trim();
    const contacto = document.getElementById("pqr-contacto").value.trim();
    const tipo = document.getElementById("pqr-tipo").value;
    const descripcion = document.getElementById("pqr-descripcion").value.trim();
    const mensajeDiv = document.getElementById("mensaje-pqr");
    mensajeDiv.textContent = "";
    mensajeDiv.className = "mensaje";
 
    // Validaciones básicas en el frontend (HU5) — el backend vuelve a validar siempre
    let valido = true;
 
    if (!nombre) {
        document.getElementById("error-nombre").textContent = "Este campo es obligatorio.";
        valido = false;
    }
 
    if (!contacto) {
        document.getElementById("error-contacto").textContent = "Este campo es obligatorio.";
        valido = false;
    } else if (contacto.includes("@") && !PATRON_CORREO.test(contacto)) {
        document.getElementById("error-contacto").textContent = "Ingrese un correo válido.";
        valido = false;
    }
 
    if (!descripcion) {
        document.getElementById("error-descripcion").textContent = "Este campo es obligatorio.";
        valido = false;
    } else if (descripcion.length < 10) {
        document.getElementById("error-descripcion").textContent = "Describa su solicitud con más detalle.";
        valido = false;
    }
 
    if (!valido) return;
 
    try {
        const respuesta = await fetch(`${API_BASE}/pqr`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, contacto, tipo, descripcion })
        });
 
        const datos = await respuesta.json();
 
        if (!respuesta.ok) {
            mensajeDiv.textContent = datos.detail || "No se pudo registrar la PQR.";
            mensajeDiv.classList.add("mensaje-error");
            return;
        }
 
        mensajeDiv.textContent = `PQR registrada con éxito. Tu identificador de seguimiento es: ${datos.id}`;
        mensajeDiv.classList.add("mensaje-exito");
        document.getElementById("form-pqr").reset();
 
    } catch (err) {
        mensajeDiv.textContent = "No se pudo conectar con el servidor. Intenta más tarde.";
        mensajeDiv.classList.add("mensaje-error");
    }
});
 
// ============================================================
// CLIENTE — HU2: consultar el estado de una PQR
// ============================================================
document.getElementById("form-consulta").addEventListener("submit", async (e) => {
    e.preventDefault();
    limpiarErrores("form-consulta");
 
    const id = document.getElementById("consulta-id").value.trim();
    const resultadoDiv = document.getElementById("resultado-consulta");
    resultadoDiv.textContent = "";
    resultadoDiv.className = "mensaje";
 
    if (!id) {
        document.getElementById("error-consulta").textContent = "Este campo es obligatorio.";
        return;
    }
 
    try {
        const respuesta = await fetch(`${API_BASE}/pqr/${encodeURIComponent(id)}`);
        const datos = await respuesta.json();
 
        if (respuesta.status === 404) {
            resultadoDiv.textContent = "PQR no encontrada.";
            resultadoDiv.classList.add("mensaje-error");
            return;
        }
 
        if (!respuesta.ok) {
            resultadoDiv.textContent = datos.detail || "Ocurrió un error al consultar la PQR.";
            resultadoDiv.classList.add("mensaje-error");
            return;
        }
 
        resultadoDiv.classList.add("mensaje-exito");
        resultadoDiv.innerHTML = `
            <strong>Tipo:</strong> ${datos.tipo}<br>
            <strong>Descripción:</strong> ${datos.descripcion}<br>
            <strong>Estado:</strong> ${datos.estado}<br>
            <strong>Fecha de registro:</strong> ${new Date(datos.fecha_creacion).toLocaleString()}
        `;
 
    } catch (err) {
        resultadoDiv.textContent = "No se pudo conectar con el servidor. Intenta más tarde.";
        resultadoDiv.classList.add("mensaje-error");
    }
});
 
// ============================================================
// ADMIN — HU4: listar todas las PQR
// ============================================================
const ESTADOS_PERMITIDOS = ["Recibida", "En proceso", "Resuelta", "Cerrada"];
 
async function cargarListadoPQR() {
    const cuerpo = document.getElementById("tabla-pqr-body");
    const mensajeDiv = document.getElementById("admin-mensaje");
    mensajeDiv.textContent = "";
    mensajeDiv.className = "mensaje";
    cuerpo.innerHTML = "";
 
    try {
        const respuesta = await fetch(`${API_BASE}/pqr`);
        const datos = await respuesta.json();
 
        if (!respuesta.ok) {
            mensajeDiv.textContent = "No se pudo cargar el listado de PQR.";
            mensajeDiv.classList.add("mensaje-error");
            return;
        }
 
        if (datos.length === 0) {
            mensajeDiv.textContent = "No hay PQR registradas todavía.";
            return;
        }
 
        datos.forEach(pqr => cuerpo.appendChild(filaPQR(pqr)));
 
    } catch (err) {
        mensajeDiv.textContent = "No se pudo conectar con el servidor. Intenta más tarde.";
        mensajeDiv.classList.add("mensaje-error");
    }
}
 
function filaPQR(pqr) {
    const fila = document.createElement("tr");
 
    const selectEstado = document.createElement("select");
    ESTADOS_PERMITIDOS.forEach(estado => {
        const opcion = document.createElement("option");
        opcion.value = estado;
        opcion.textContent = estado;
        if (estado === pqr.estado) opcion.selected = true;
        selectEstado.appendChild(opcion);
    });
 
    const botonActualizar = document.createElement("button");
    botonActualizar.textContent = "Actualizar";
    botonActualizar.addEventListener("click", () => actualizarEstadoPQR(pqr.id, selectEstado.value, fila));
 
    fila.innerHTML = `
        <td>${pqr.id}</td>
        <td>${pqr.nombre}</td>
        <td>${pqr.contacto}</td>
        <td>${pqr.tipo}</td>
        <td>${pqr.descripcion}</td>
        <td>${pqr.estado}</td>
        <td>${new Date(pqr.fecha_creacion).toLocaleString()}</td>
    `;
 
    const celdaAccion = document.createElement("td");
    celdaAccion.appendChild(selectEstado);
    celdaAccion.appendChild(botonActualizar);
    fila.appendChild(celdaAccion);
 
    return fila;
}
 
// ============================================================
// ADMIN — HU3: actualizar el estado de una PQR (responder al cliente)
// ============================================================
async function actualizarEstadoPQR(id, nuevoEstado, fila) {
    const mensajeDiv = document.getElementById("admin-mensaje");
    mensajeDiv.textContent = "";
    mensajeDiv.className = "mensaje";
 
    try {
        const respuesta = await fetch(`${API_BASE}/pqr/${encodeURIComponent(id)}/estado`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado: nuevoEstado })
        });
 
        const datos = await respuesta.json();
 
        if (respuesta.status === 404) {
            mensajeDiv.textContent = `La PQR ${id} ya no existe.`;
            mensajeDiv.classList.add("mensaje-error");
            return;
        }
 
        if (!respuesta.ok) {
            mensajeDiv.textContent = datos.detail || "No se pudo actualizar el estado.";
            mensajeDiv.classList.add("mensaje-error");
            return;
        }
 
        mensajeDiv.textContent = `Estado de la PQR ${id} actualizado a "${nuevoEstado}".`;
        mensajeDiv.classList.add("mensaje-exito");
        fila.children[5].textContent = nuevoEstado;
 
    } catch (err) {
        mensajeDiv.textContent = "No se pudo conectar con el servidor. Intenta más tarde.";
        mensajeDiv.classList.add("mensaje-error");
    }
}
 
document.getElementById("btn-refrescar").addEventListener("click", cargarListadoPQR);
 
// ---------- Estado inicial al cargar la página ----------
supabase.auth.getSession().then(({ data: { session } }) => {
    actualizarVistaSegunSesion(session);
});
 
// ============================================================
// SLIDER de productos (sección "Productos")
// ============================================================
const slider = document.getElementById("slider-productos");
const btnPrev = document.getElementById("slider-prev");
const btnNext = document.getElementById("slider-next");
 
function anchoTarjeta() {
    const tarjeta = slider.querySelector(".producto-card");
    if (!tarjeta) return 0;
    const estilo = window.getComputedStyle(tarjeta);
    return tarjeta.offsetWidth + parseInt(estilo.marginRight || 0) + 16; // 16px = gap
}
 
btnPrev.addEventListener("click", () => {
    slider.scrollBy({ left: -anchoTarjeta(), behavior: "smooth" });
});
 
btnNext.addEventListener("click", () => {
    slider.scrollBy({ left: anchoTarjeta(), behavior: "smooth" });
});
 
})();
} else {
  console.warn('app.js ya se había ejecutado; se omitió la segunda ejecución.');
}
 