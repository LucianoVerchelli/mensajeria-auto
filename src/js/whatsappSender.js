// src/js/whatsappSender.js
import { validarNumero } from "./validation.js";

export function abrirChat(filas, i, enviados, omitidos, actualizarContador) {
  const tr = filas[i];
  if (!tr) return { enviados, omitidos };

  if (i > 0) {
    const filaAnterior = filas[i - 1];
    if (filaAnterior) {
      filaAnterior.classList.remove("activo");
      filaAnterior.classList.add("enviada");
      const celdaMsg = filaAnterior.querySelector(".msg");
      if (celdaMsg) celdaMsg.style.opacity = "0.7";
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
    return { enviados, omitidos };
  }

  const url = `https://wa.me/${encodeURIComponent(numero)}?text=${encodeURIComponent(mensajeEditado)}`;
  window.open(url, "_blank");

  enviados++;
  actualizarContador();
  return { enviados, omitidos };
}
