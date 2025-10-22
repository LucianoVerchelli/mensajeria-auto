document.addEventListener("DOMContentLoaded", () => {
  let contactos = [];
  let indiceActual = 0;
  let enviados = 0;
  let omitidos = 0;

  const $tablaBody = document.querySelector("#tabla-contactos tbody");
  const $wrapTabla = document.getElementById("contenedor-tabla");
  const $botones = document.getElementById("botonesEnvio");
  const $btnCargar = document.getElementById("btnCargar");
  const $btnIniciar = document.getElementById("btnIniciar");
  const $btnSiguiente = document.getElementById("btnSiguiente");
  const $contador = document.getElementById("contador");

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Generar mensaje personalizado
  const generarMensaje = (nombre, caso) =>
    `Buenas tardes ${nombre}! ¿Cómo le va?
Mi nombre es Daysi, me comunico por ${caso} con la intención de brindarle asesoría legal, ya que nos figura en sistema que por el siniestro denunciado en ART, tiene una indemnización económica a su disposición, que cubre su aseguradora bajo la ley N°24.557 de Riesgos del Trabajo.

Si quiere cobrar de 3 a 5 meses, responda este mensaje y me estaré comunicando a la brevedad ya sea por este medio o mediante llamado. Gracias.`;

  // Actualizar contador visual
  const actualizarContador = () => {
    const total = contactos.length;
    const actual = Math.min(indiceActual + 1, total);
    $contador.textContent = `📊 Progreso: ${actual}/${total} • ✅ Enviados: ${enviados} • ⏭️ Omitidos: ${omitidos}`;
  };

  // Cargar Excel
  $btnCargar.addEventListener("click", async () => {
    const input = document.getElementById("excelFile");
    if (!input.files.length) {
      alert("⚠️ Selecciona un archivo Excel (.xlsx) primero.");
      return;
    }

    const file = input.files[0];
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(data), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      contactos = XLSX.utils.sheet_to_json(sheet);

      if (!contactos.length) {
        alert("❌ El Excel no tiene filas o los encabezados no coinciden.");
        return;
      }

      $tablaBody.innerHTML = "";
      contactos.forEach((fila) => {
        const { Nombre = "", Apellido = "", Numero = "", Caso = "" } = fila;
        const mensaje = generarMensaje(Nombre, Caso).replace(/\n/g, "<br>");
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${Nombre}</td>
          <td>${Apellido}</td>
          <td>${Numero}</td>
          <td>${Caso}</td>
          <td>${mensaje}</td>
        `;
        $tablaBody.appendChild(tr);
      });

      indiceActual = 0;
      enviados = 0;
      omitidos = 0;

      $wrapTabla.style.display = "block";
      $botones.style.display = "block";
      $btnIniciar.disabled = false;
      $btnSiguiente.disabled = true;

      actualizarContador();
      alert(`✅ Se cargaron ${contactos.length} contactos.`);
    } catch (error) {
      console.error(error);
      alert("❌ Error al leer el archivo Excel. Verifica formato y columnas.");
    }
  });

  // Iniciar envío
  $btnIniciar.addEventListener("click", () => {
    if (!contactos.length) {
      alert("⚠️ Primero carga un archivo Excel válido.");
      return;
    }

    indiceActual = 0;
    enviados = 0;
    omitidos = 0;
    $btnIniciar.disabled = true;
    $btnSiguiente.disabled = false;
    abrirChat(indiceActual);
  });

  // Siguiente contacto
  $btnSiguiente.addEventListener("click", async () => {
    indiceActual++;
    if (indiceActual < contactos.length) {
      abrirChat(indiceActual);
    } else {
      $btnSiguiente.disabled = true;
      $btnIniciar.disabled = false;
      actualizarContador();
      await sleep(300);
      alert(`✅ Envío completado.\nEnviados: ${enviados}\nOmitidos: ${omitidos}\nTotal: ${contactos.length}`);
    }
  });

  // Abrir chat de WhatsApp
  function abrirChat(i) {
    const fila = contactos[i];
const nombre = String(fila.Nombre || "").trim();
const numero = String(fila.Numero || "").trim();
const caso = String(fila.Caso || "").trim();

    // Resaltar fila activa
    [...$tablaBody.querySelectorAll("tr")].forEach((tr, idx) => {
      tr.style.background = idx === i ? "#fff9e6" : "";
    });

    if (!numero) {
      omitidos++;
      actualizarContador();
      alert(`⏭️ ${nombre || "Contacto sin nombre"} omitido: número no válido.`);
      return;
    }

    const mensaje = generarMensaje(nombre, caso);
    const url = `https://wa.me/${encodeURIComponent(numero)}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");

    enviados++;
    actualizarContador();
  }
});
