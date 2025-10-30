// src/js/excelHandler.js
import { validarNumero } from "./validation.js";

export async function procesarExcel(input, tablaBody, generarMensaje) {
  const data = await input.files[0].arrayBuffer();
  const wb = XLSX.read(new Uint8Array(data), { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const contactos = XLSX.utils.sheet_to_json(sheet);

  tablaBody.innerHTML = "";
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
    tablaBody.appendChild(tr);
  });

  return contactos;
}
