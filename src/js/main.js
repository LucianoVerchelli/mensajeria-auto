// src/js/main.js
import { procesarExcel } from "./excelHandler.js";
import { PLANTILLAS_BASE, cargarPlantillasGuardadas, guardarPlantilla } from "./messageTemplates.js";
import { abrirChat } from "./whatsappSender.js";
import { crearPaginacion } from "./pagination.js";
import { inicializarModoOscuro } from "./themeToggle.js";

document.addEventListener("DOMContentLoaded", () => {
  let contactos = [];
  let indiceActual = 0;
  let enviados = 0;
  let omitidos = 0;
  let paginacionControl = null;

  const $tablaBody = document.querySelector("#tabla-contactos tbody");
  const $wrapTabla = document.getElementById("contenedor-tabla");
  const $botones = document.getElementById("botonesEnvio");
  const $btnCargar = document.getElementById("btnCargar");
  const $btnIniciar = document.getElementById("btnIniciar");
  const $btnSiguiente = document.getElementById("btnSiguiente");
  const $contador = document.getElementById("contador");
  const $btnModo = document.getElementById("modoBtn");
  const $selectMensaje = document.getElementById("mensajePredeterminado");
  const $btnGuardar = document.getElementById("btnGuardarPlantilla");

  inicializarModoOscuro($btnModo);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function generarMensaje(nombre, caso) {
    return `Hola ${nombre}! Mi nombre es Matías.\nTe contacto por tu accidente pasado por ART, para saber cómo te encontrabas y cómo ibas con la evolución tu tratamiento.`;
  }

  function actualizarContador() {
    const total = contactos.length;
    const actual = Math.min(indiceActual + 1, total);
    $contador.textContent = `📊 Progreso: ${actual}/${total} • ✅ Enviados: ${enviados} • ⏭️ Omitidos: ${omitidos}`;
  }

  // === CARGAR EXCEL ===
  $btnCargar.addEventListener("click", async () => {
    const input = document.getElementById("excelFile");
    if (!input.files.length) {
      return Swal.fire({ icon: "warning", title: "Archivo requerido", text: "Selecciona un archivo Excel primero." });
    }

    contactos = await procesarExcel(input, $tablaBody, generarMensaje);
    paginacionControl = crearPaginacion($tablaBody, $wrapTabla);

    enviados = omitidos = 0;
    $wrapTabla.style.display = "block";
    $botones.style.display = "block";
    $btnIniciar.disabled = false;
    $btnSiguiente.disabled = true;
    actualizarContador();

    Swal.fire({
      icon: "success",
      title: "Contactos cargados",
      text: `Se cargaron ${contactos.length} contactos correctamente.`,
      confirmButtonColor: "#22c55e",
    });
  });

  // === CAMBIO DE PLANTILLA ===
  $selectMensaje.addEventListener("change", () => {
    const opcion = $selectMensaje.value;
    const filas = document.querySelectorAll("#tabla-contactos tbody tr");
    if (!filas.length) {
      return Swal.fire({ icon: "warning", title: "Sin contactos", text: "No hay contactos cargados." });
    }

    // Recargar plantillas
    const plantillasGuardadas = cargarPlantillasGuardadas();
    const plantillas = { ...PLANTILLAS_BASE, ...plantillasGuardadas };
    const clave = String(opcion).trim();

    if (!plantillas[clave]) {
      return Swal.fire({
        icon: "error",
        title: "Plantilla no encontrada",
        text: "Seleccioná una plantilla válida o crea una nueva.",
      });
    }

    filas.forEach((tr) => {
      const nombre = tr.children[0].innerText.trim();
      const caso = tr.children[3].innerText.trim();
      const tdMsg = tr.querySelector(".msg");
      if (tdMsg) tdMsg.textContent = plantillas[clave](nombre, caso);
    });

    Swal.fire({
      icon: "success",
      title: "Plantilla aplicada",
      text: "Mensajes actualizados correctamente.",
      confirmButtonColor: "#22c55e",
    });
  });

  // === GUARDAR PLANTILLA PERSONALIZADA ===
  $btnGuardar.addEventListener("click", async () => {
    const { value: texto } = await Swal.fire({
      title: "Nueva plantilla",
      input: "text",
      inputLabel: "Escribí tu plantilla personalizada",
      inputPlaceholder: "Usá {nombre} y {caso} para reemplazar automáticamente",
      confirmButtonText: "Guardar",
      confirmButtonColor: "#22c55e",
      showCancelButton: true,
      cancelButtonText: "Cancelar",
    });

    if (!texto) {
      return Swal.fire({
        icon: "info",
        title: "Cancelado",
        text: "No se guardó ninguna plantilla.",
        confirmButtonColor: "#3b82f6",
      });
    }

    const nuevaClave = Date.now().toString();
    guardarPlantilla(nuevaClave, texto); // ✅ Ahora usa la nueva función que guarda correctamente como texto

    const option = document.createElement("option");
    option.value = nuevaClave;
    option.textContent = `📝 Personalizada (${new Date().toLocaleDateString()})`;
    $selectMensaje.appendChild(option);

    Swal.fire({
      icon: "success",
      title: "Plantilla guardada",
      text: "Tu plantilla personalizada fue almacenada correctamente.",
      confirmButtonColor: "#22c55e",
    });
  });

  // === INICIAR ENVÍO ===
  $btnIniciar.addEventListener("click", () => {
    if (!contactos.length)
      return Swal.fire({ icon: "warning", title: "Sin contactos", text: "Cargá un Excel válido." });

    indiceActual = enviados = omitidos = 0;
    $btnIniciar.disabled = true;
    $btnSiguiente.disabled = false;

    abrirChat($tablaBody.querySelectorAll("tr"), indiceActual, enviados, omitidos, actualizarContador);
  });

  // === SIGUIENTE ===
  $btnSiguiente.addEventListener("click", async () => {
    indiceActual++;
    if (indiceActual < contactos.length) {
      abrirChat($tablaBody.querySelectorAll("tr"), indiceActual, enviados, omitidos, actualizarContador);

      if ((indiceActual + 1) % 10 === 0 && paginacionControl && paginacionControl.avanzarPagina) {
        paginacionControl.avanzarPagina();
      }
    } else {
      $btnSiguiente.disabled = true;
      $btnIniciar.disabled = false;
      actualizarContador();
      await sleep(300);
      Swal.fire({
        icon: "success",
        title: "Envío finalizado",
        text: `Proceso completado.\nEnviados: ${enviados}\nOmitidos: ${omitidos}\nTotal: ${contactos.length}`,
        confirmButtonColor: "#22c55e",
      });
    }
  });
});
