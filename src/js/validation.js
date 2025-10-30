// src/js/validation.js
export function validarNumero(numero) {
  const num = String(numero).trim();
  const soloNumeros = /^[0-9]+$/.test(num);
  if (!soloNumeros) return false;
  if (num.length < 11 || num.length > 15) return false;
  if (num.startsWith("0")) return false;
  return true;
}
