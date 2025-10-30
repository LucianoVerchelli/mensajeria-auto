// src/js/pagination.js
export function crearPaginacion(tablaBody, wrapTabla, onPaginaCambiada = null) {
  const filasPorPagina = 10;
  let paginaActual = 1;

  function mostrarPagina(pagina) {
    const filas = Array.from(tablaBody.querySelectorAll("tr"));
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

    // 🔁 Notificar si se cambió la página
    if (typeof onPaginaCambiada === "function") {
      onPaginaCambiada(paginaActual, totalPaginas);
    }
  }

  function actualizarPaginacion(totalPaginas) {
    let paginacion = document.getElementById("paginacion");
    if (!paginacion) {
      paginacion = document.createElement("div");
    paginacion.id = "paginacion";
      paginacion.style.marginTop = "10px";
      paginacion.style.textAlign = "center";
      wrapTabla.appendChild(paginacion);
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

  // 🔁 Avanzar automáticamente de página
  function avanzarPagina() {
    const filas = Array.from(tablaBody.querySelectorAll("tr"));
    const totalPaginas = Math.ceil(filas.length / filasPorPagina);
    if (paginaActual < totalPaginas) {
      mostrarPagina(paginaActual + 1);
    }
  }

  // Mostrar la primera página
  mostrarPagina(1);

  // Retornar controladores
  return { mostrarPagina, avanzarPagina };
}
