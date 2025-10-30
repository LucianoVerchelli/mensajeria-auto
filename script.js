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

  // === RELLENAR OPCIONES PERSONALIZADAS ===
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
  $selectMensaje.addEventListener("change", async () => {
    const opcion = $selectMensaje.value;
    const filas = document.querySelectorAll("#tabla-contactos tbody tr");
    if (!filas.length) {
      return Swal.fire({
        icon: "warning",
        title: "Sin contactos",
        text: "No hay contactos cargados para aplicar la plantilla.",
        confirmButtonColor: "#facc15",
      });
    }

    if (!mensajesPredeterminados[opcion]) {
      return Swal.fire({
        icon: "error",
        title: "Plantilla inválida",
        text: "Plantilla no encontrada o incorrecta.",
        confirmButtonColor: "#ef4444",
      });
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
    Swal.fire({
      icon: "success",
      title: "Plantilla aplicada",
      text: "Los mensajes fueron actualizados correctamente.",
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
    mensajesPredeterminados[nuevaClave] = (nombre, caso) =>
      texto.replace("{nombre}", nombre).replace("{caso}", caso);

    localStorage.setItem("plantillas", JSON.stringify(mensajesPredeterminados));

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
      return Swal.fire({
        icon: "warning",
        title: "Archivo requerido",
        text: "Selecciona un archivo Excel (.xlsx) primero.",
        confirmButtonColor: "#facc15",
      });
    }

    try {
      const data = await input.files[0].arrayBuffer();
      const wb = XLSX.read(new Uint8Array(data), { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      contactos = XLSX.utils.sheet_to_json(sheet);

      if (!contactos.length) {
        return Swal.fire({
          icon: "error",
          title: "Archivo vacío",
          text: "El Excel no contiene filas válidas.",
          confirmButtonColor: "#ef4444",
        });
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
        tdValidez.textContent = esValido ? "Válido" : "Inválido";
        tdValidez.classList.add("validez");
        tdValidez.style.color = esValido ? "#16a34a" : "#ef4444";
        tdValidez.style.fontWeight = "600";

        tr.append(tdNom, tdApe, tdNum, tdCaso, tdMsg, tdValidez);
        $tablaBody.appendChild(tr);
      });

// === PAGINACIÓN DE CONTACTOS ===
const filasPorPagina = 10;
let paginaActual = 1;

function mostrarPagina(pagina) {
  const filas = Array.from($tablaBody.querySelectorAll("tr"));
  const totalPaginas = Math.ceil(filas.length / filasPorPagina);
  if (pagina < 1) pagina = 1;
  if (pagina > totalPaginas) pagina = totalPaginas;
  paginaActual = pagina;

  filas.forEach((fila, i) => {
    fila.style.display =
      i >= (pagina - 1) * filasPorPagina && i < pagina * filasPorPagina
        ? ""
        : "none";
  });

  actualizarPaginacion(totalPaginas);
}

function actualizarPaginacion(totalPaginas) {
  let paginacion = document.getElementById("paginacion");
  if (!paginacion) {
    paginacion = document.createElement("div");
    paginacion.id = "paginacion";
    paginacion.style.marginTop = "10px";
    paginacion.style.textAlign = "center";
    $wrapTabla.appendChild(paginacion);
  }

  paginacion.innerHTML = "";

  // Botón Anterior
  const btnPrev = document.createElement("button");
  btnPrev.textContent = "⬅️";
  btnPrev.className = "btn-pagina";
  btnPrev.disabled = paginaActual === 1;
  btnPrev.addEventListener("click", () => mostrarPagina(paginaActual - 1));
  paginacion.appendChild(btnPrev);

  // Números de páginas
  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = "btn-pagina";
    if (i === paginaActual) btn.classList.add("activo");
    btn.addEventListener("click", () => mostrarPagina(i));
    paginacion.appendChild(btn);
  }

  // Botón Siguiente
  const btnNext = document.createElement("button");
  btnNext.textContent = "➡️";
  btnNext.className = "btn-pagina";
  btnNext.disabled = paginaActual === totalPaginas;
  btnNext.addEventListener("click", () => mostrarPagina(paginaActual + 1));
  paginacion.appendChild(btnNext);
}

// Mostrar la primera página al cargar
mostrarPagina(1);



      indiceActual = 0;
      enviados = 0;
      omitidos = 0;
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

    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Error de lectura",
        text: "No se pudo leer el archivo Excel. Verifica que sea válido.",
        confirmButtonColor: "#ef4444",
      });
    }
  });

  // === INICIAR ENVÍO ===
  $btnIniciar.addEventListener("click", () => {
    if (!contactos.length) {
      return Swal.fire({
        icon: "warning",
        title: "Sin contactos",
        text: "Primero cargá un archivo Excel válido.",
        confirmButtonColor: "#facc15",
      });
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
      Swal.fire({
        icon: "success",
        title: "Envío finalizado",
        text: `Proceso completado.\nEnviados: ${enviados}\nOmitidos: ${omitidos}\nTotal: ${contactos.length}`,
        confirmButtonColor: "#22c55e",
      });
    }
  });

  // === ABRIR CHAT ===
  function abrirChat(i) {
    const filas = $tablaBody.querySelectorAll("tr");
    const tr = filas[i];
    if (!tr) return;
    if (i > 0) {
  const filaAnterior = filas[i - 1];
  if (filaAnterior) {
    filaAnterior.classList.remove("activo");
    filaAnterior.classList.add("enviada");
    const celdaMsg = filaAnterior.querySelector(".msg");
    if (celdaMsg) celdaMsg.style.opacity = "0.7"; // levemente desvanecido
  }
}

    const celdas = tr.querySelectorAll("td");
    const nombre = celdas[0].innerText.trim();
    const numero = celdas[2].innerText.replace(/\D/g, "");
    const mensajeEditado = celdas[4].innerText;

    filas.forEach((row, idx) => row.classList.toggle("activo", idx === i));

    if (!numero || !validarNumero(numero)) {
      omitidos++;
      actualizarContador();
      Swal.fire({
        icon: "warning",
        title: "Número omitido",
        text: `${nombre || "Contacto"} tiene un número vacío o inválido (${numero || "sin número"}).`,
        confirmButtonColor: "#facc15",
      });
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
    Swal.update({ background: "#1f2937", color: "#f3f4f6" });
  }
});
