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

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // === VALIDACIÓN DE NÚMEROS ===
  function validarNumero(numero) {
    const num = String(numero).trim();
    const soloNumeros = /^[0-9]+$/.test(num);
    if (!soloNumeros) return false;
    if (num.length < 11 || num.length > 15) return false;
    if (num.startsWith("0")) return false;
    return true;
  }

  const generarMensaje = (nombre) =>
`Hola ${nombre}! Mi nombre es Matías.
Te contacto por tu accidente pasado por ART,  para saber cómo te encontrabas y cómo ibas con la evolución tu tratamiento.`;

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
        const numero = String(fila.Numero || "").replace(/\D/g, "");
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

        // ✅ Nueva columna visual: Validez
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

    // Resalta fila actual
    filas.forEach((row, idx) => {
      row.classList.toggle("activo", idx === i);
    });

    // ✅ Validar antes de abrir chat
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

  // carga preferencia
  if (localStorage.getItem("modoOscuro") === "true" ||
      window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.body.classList.add("dark");
  }
});


