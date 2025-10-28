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
  const $btnModo = document.getElementById("modoBtn");
  const $selectMensaje = document.getElementById("mensajePredeterminado");
  const $btnGuardar = document.getElementById("btnGuardarPlantilla");

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // === VALIDACIÓN DE NÚMEROS ===
  function validarNumero(numero) {
    const num = String(numero).trim();
    const soloNumeros = /^[0-9]+$/.test(num);
    if (!soloNumeros) return false;
    if (num.length < 11 || num.length > 15) return false;
    if (num.startsWith("0")) return false;
    return true;
  }

  // === SISTEMA DE MENSAJES PREDETERMINADOS ===
  const PLANTILLAS_BASE = {
    "1": (nombre, caso) =>
      `Hola ${nombre}! Mi nombre es Matías.\nSolo quería saber cómo ibas con tu tratamiento o seguimiento.`,
    "2": (nombre, caso) =>
      `Buenas tardes ${nombre}! Mi nombre es Daysi.\nMe comunico por ${caso}, con la intención de brindarte asesoría legal, ya que figura en sistema que tenés una indemnización económica disponible por el siniestro denunciado en ART bajo la ley N°24.557.`,
    "3": (nombre, caso) =>
      `Hola ${nombre}! Espero que estés bien.\nNos comunicamos nuevamente respecto a ${caso}, para saber si necesitás asistencia adicional o ya pudiste resolver tu situación.`
  };

  let plantillasGuardadas = {};
  try {
    plantillasGuardadas = JSON.parse(localStorage.getItem("plantillas") || "{}");
  } catch {
    plantillasGuardadas = {};
  }

  const mensajesPredeterminados = { ...PLANTILLAS_BASE, ...plantillasGuardadas };

  // === RELLENAR OPCIONES PERSONALIZADAS SI EXISTEN ===
  const clavesCustom = Object.keys(plantillasGuardadas);
  for (const key of clavesCustom) {
    if (!$selectMensaje.querySelector(`option[value="${key}"]`)) {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = `📝 Personalizada (${new Date(Number(key) || Date.now()).toLocaleDateString()})`;
      $selectMensaje.appendChild(opt);
    }
  }

  // === CAMBIO DE PLANTILLA ===
  $selectMensaje.addEventListener("change", () => {
    const opcion = $selectMensaje.value;
    const filas = document.querySelectorAll("#tabla-contactos tbody tr");
    if (!filas.length) {
      alert("⚠️ No hay contactos cargados para aplicar la plantilla.");
      return;
    }

    if (!mensajesPredeterminados[opcion]) {
      alert("⚠️ Plantilla no encontrada o inválida.");
      return;
    }

    filas.forEach((tr) => {
      const nombre = tr.children[0].innerText.trim();
      const caso = tr.children[3].innerText.trim();
      const tdMsg = tr.querySelector(".msg");

      if (tdMsg) {
        tdMsg.textContent = mensajesPredeterminados[opcion](nombre, caso);
      }
    });

    localStorage.setItem("plantillaSeleccionada", opcion);
    alert("✅ Mensajes actualizados según la plantilla seleccionada.");
  });

  // === GUARDAR PLANTILLA PERSONALIZADA ===
  $btnGuardar.addEventListener("click", () => {
    const texto = prompt("💾 Escribí tu plantilla personalizada.\nUsá {nombre} y {caso} para reemplazar automáticamente.");

    if (!texto) return alert("⚠️ No se guardó la plantilla.");

    const nuevaClave = Date.now().toString();
    mensajesPredeterminados[nuevaClave] = (nombre, caso) =>
      texto.replace("{nombre}", nombre).replace("{caso}", caso);

    localStorage.setItem("plantillas", JSON.stringify(mensajesPredeterminados));

    const option = document.createElement("option");
    option.value = nuevaClave;
    option.textContent = `📝 Personalizada (${new Date().toLocaleDateString()})`;
    $selectMensaje.appendChild(option);
    alert("✅ Plantilla guardada correctamente.");
  });

  // === GENERAR MENSAJE BASE ===
  const generarMensaje = (nombre, caso) =>
    `Hola ${nombre}! Mi nombre es Matías.\nTe contacto por tu accidente pasado por ART, para saber cómo te encontrabas y cómo ibas con la evolución tu tratamiento.`;

  const actualizarContador = () => {
    const total = contactos.length;
    const actual = Math.min(indiceActual + 1, total);
    $contador.textContent = `📊 Progreso: ${actual}/${total} • ✅ Enviados: ${enviados} • ⏭️ Omitidos: ${omitidos}`;
  };

  // === CARGAR EXCEL ===
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
        alert("❌ El Excel no tiene filas válidas.");
        return;
      }

      $tablaBody.innerHTML = "";
      contactos.forEach((fila) => {
        const nombre = String(fila.Nombre || "").trim();
        const apellido = String(fila.Apellido || "").trim();
        const numero = String(fila["Numero listo"] || fila.Numero || "").replace(/\D/g, "");
        const caso = String(fila.Caso || "").trim();
        const mensaje = generarMensaje(nombre, caso);
        const esValido = validarNumero(numero);

        const tr = document.createElement("tr");

        const tdNom = document.createElement("td"); tdNom.textContent = nombre;
        const tdApe = document.createElement("td"); tdApe.textContent = apellido;
        const tdNum = document.createElement("td"); tdNum.textContent = numero;
        const tdCaso = document.createElement("td"); tdCaso.textContent = caso;
        const tdMsg = document.createElement("td");
        tdMsg.className = "msg";
        tdMsg.contentEditable = "true";
        tdMsg.textContent = mensaje;

        const tdValidez = document.createElement("td");
        tdValidez.textContent = esValido ? "Válido ✅" : "Inválido ❌";
        tdValidez.classList.add("validez");
        tdValidez.style.color = esValido ? "#16a34a" : "#ef4444";
        tdValidez.style.fontWeight = "600";

        tr.append(tdNom, tdApe, tdNum, tdCaso, tdMsg, tdValidez);
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
    } catch (e) {
      console.error(e);
      alert("❌ Error leyendo el Excel. Verifica que sea .xlsx válido.");
    }
  });

  // === INICIAR ENVÍO ===
  $btnIniciar.addEventListener("click", () => {
    if (!contactos.length) {
      alert("⚠️ Primero cargá un archivo Excel válido.");
      return;
    }
    indiceActual = 0;
    enviados = 0;
    omitidos = 0;
    $btnIniciar.disabled = true;
    $btnSiguiente.disabled = false;
    abrirChat(indiceActual);
  });

  // === SIGUIENTE ===
  $btnSiguiente.addEventListener("click", async () => {
    indiceActual++;
    if (indiceActual < contactos.length) {
      abrirChat(indiceActual);
    } else {
      $btnSiguiente.disabled = true;
      $btnIniciar.disabled = false;
      actualizarContador();
      await sleep(300);
      alert(`✅ Finalizado.\nEnviados: ${enviados}\nOmitidos: ${omitidos}\nTotal: ${contactos.length}`);
    }
  });

  // === ABRIR CHAT Y RESALTAR FILA ===
  function abrirChat(i) {
    const filas = $tablaBody.querySelectorAll("tr");
    const tr = filas[i];
    if (!tr) return;

    const celdas = tr.querySelectorAll("td");
    const nombre = celdas[0].innerText.trim();
    const numero = celdas[2].innerText.replace(/\D/g, "");
    const mensajeEditado = celdas[4].innerText;

    filas.forEach((row, idx) => row.classList.toggle("activo", idx === i));

    if (!numero || !validarNumero(numero)) {
      omitidos++;
      actualizarContador();
      alert(`⏭️ ${nombre || "Contacto"} omitido: número vacío o inválido (${numero || "sin número"}).`);
      return;
    }

    const url = `https://wa.me/${encodeURIComponent(numero)}?text=${encodeURIComponent(mensajeEditado)}`;
    window.open(url, "_blank");

    enviados++;
    actualizarContador();
  }

  // === MODO OSCURO ===
  $btnModo.addEventListener("click", () => {
    document.body.classList.add("fade-transition");
    document.body.classList.toggle("dark");
    localStorage.setItem("modoOscuro", document.body.classList.contains("dark"));
    setTimeout(() => document.body.classList.remove("fade-transition"), 600);
  });

  if (
    localStorage.getItem("modoOscuro") === "true" ||
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    document.body.classList.add("dark");
  }
});
