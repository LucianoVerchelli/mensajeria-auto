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

    // ⚡ Crear paginación con control
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

      // 🔁 Avanzar automáticamente de página cuando se termine un bloque de 10
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
