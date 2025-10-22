document.addEventListener("DOMContentLoaded", () => {
  let contactos = [];
  let indiceActual = 0;
  let enviados = 0;
  let omitidos = 0;

  const $tablaBody     = document.querySelector("#tabla-contactos tbody");
  const $wrapTabla     = document.getElementById("contenedor-tabla");
  const $botones       = document.getElementById("botonesEnvio");
  const $btnCargar     = document.getElementById("btnCargar");
  const $btnIniciar    = document.getElementById("btnIniciar");
  const $btnSiguiente  = document.getElementById("btnSiguiente");
  const $contador      = document.getElementById("contador");

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // Mensaje por defecto (se puede editar en la tabla)
  const generarMensaje = (nombre, caso) =>
`Buenas tardes ${nombre}! ¿Cómo le va?
Mi nombre es Daysi, me comunico por ${caso} con la intención de brindarle asesoría legal, ya que nos figura en sistema que por el siniestro denunciado en ART, tiene una indemnización económica a su disposición, que cubre su aseguradora bajo la ley N°24.557 de Riesgos del Trabajo.

Si quiere cobrar de 3 a 5 meses, responda este mensaje y me estaré comunicando a la brevedad ya sea por este medio o mediante llamado. Gracias.`;

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

    try {
      const data = await input.files[0].arrayBuffer();
      const wb = XLSX.read(new Uint8Array(data), { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      contactos = XLSX.utils.sheet_to_json(sheet);

      if (!contactos.length) {
        alert("❌ El Excel no tiene filas o los encabezados no coinciden (Nombre | Apellido | Numero | Caso).");
        return;
      }

      // Render tabla (mensaje editable)
      $tablaBody.innerHTML = "";
      contactos.forEach((fila) => {
        const nombre  = String(fila.Nombre || "").trim();
        const apellido= String(fila.Apellido || "").trim();
        const numero  = String(fila.Numero || "").replace(/\D/g, ""); // solo dígitos
        const caso    = String(fila.Caso || "").trim();
        const msjBase = generarMensaje(nombre, caso);

        const tr = document.createElement("tr");

        const tdNom = document.createElement("td"); tdNom.textContent = nombre;
        const tdApe = document.createElement("td"); tdApe.textContent = apellido;
        const tdNum = document.createElement("td"); tdNum.textContent = numero;
        const tdCaso= document.createElement("td"); tdCaso.textContent = caso;

        const tdMsg = document.createElement("td");
        tdMsg.className = "msg";          // CSS para respetar saltos de línea
        tdMsg.contentEditable = "true";   // <-- editable por el usuario
        tdMsg.textContent = msjBase;      // usamos textContent (seguro)

        tr.append(tdNom, tdApe, tdNum, tdCaso, tdMsg);
        $tablaBody.appendChild(tr);
      });

      indiceActual = 0; enviados = 0; omitidos = 0;
      $wrapTabla.style.display = "block";
      $botones.style.display = "block";
      $btnIniciar.disabled = false;
      $btnSiguiente.disabled = true;
      actualizarContador();
      alert(`✅ Se cargaron ${contactos.length} contactos.`);
    } catch (e) {
      console.error(e);
      alert("❌ Error leyendo el Excel. Verifica que sea .xlsx válido.");
    }
  });

  // Iniciar envío
  $btnIniciar.addEventListener("click", () => {
    if (!contactos.length) {
      alert("⚠️ Primero cargá un archivo Excel válido.");
      return;
    }
    indiceActual = 0; enviados = 0; omitidos = 0;
    $btnIniciar.disabled = true;
    $btnSiguiente.disabled = false;
    abrirChat(indiceActual);
  });

  // Siguiente
  $btnSiguiente.addEventListener("click", async () => {
    indiceActual++;
    if (indiceActual < contactos.length) {
      abrirChat(indiceActual);
    } else {
      $btnSiguiente.disabled = true;
      $btnIniciar.disabled = false;
      actualizarContador();
      await sleep(200);
      alert(`✅ Finalizado.\nEnviados: ${enviados}\nOmitidos: ${omitidos}\nTotal: ${contactos.length}`);
    }
  });

  // Abre WhatsApp usando el MENSAJE EDITADO de la tabla
  function abrirChat(i) {
    const tr = $tablaBody.querySelectorAll("tr")[i];
    if (!tr) return;

    const celdas = tr.querySelectorAll("td");
    const nombre = celdas[0].innerText.trim();
    const numero = celdas[2].innerText.replace(/\D/g, ""); // solo dígitos
    const mensajeEditado = celdas[4].innerText;            // <-- lo que el usuario editó

    // Resalta la fila activa
    [...$tablaBody.querySelectorAll("tr")].forEach((row, idx) => {
      row.style.background = idx === i ? "#fff9e6" : "";
    });

    if (!numero) {
      omitidos++;
      actualizarContador();
      alert(`⏭️ ${nombre || "Contacto"} omitido: número vacío o inválido.`);
      return;
    }

    const url = `https://wa.me/${encodeURIComponent(numero)}?text=${encodeURIComponent(mensajeEditado)}`;
    window.open(url, "_blank");

    enviados++;
    actualizarContador();
  }
});
