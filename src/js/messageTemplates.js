// src/js/messageTemplates.js
export const PLANTILLAS_BASE = {
  "1": (nombre, caso) =>
    `Hola ${nombre}! Mi nombre es Matías.\nSolo quería saber cómo ibas con tu tratamiento o seguimiento.`,
  "2": (nombre, caso) =>
    `Buenas tardes ${nombre}! Mi nombre es Daysi.\nMe comunico por ${caso}, con la intención de brindarte asesoría legal, ya que figura en sistema que tenés una indemnización económica disponible por el siniestro denunciado en ART bajo la ley N°24.557.`,
  "3": (nombre, caso) =>
    `Hola ${nombre}! Espero que estés bien.\nNos comunicamos nuevamente respecto a ${caso}, para saber si necesitás asistencia adicional o ya pudiste resolver tu situación.`
};

export function cargarPlantillasGuardadas() {
  try {
    return JSON.parse(localStorage.getItem("plantillas") || "{}");
  } catch {
    return {};
  }
}

export function guardarPlantilla(nuevaClave, texto, mensajesPredeterminados) {
  mensajesPredeterminados[nuevaClave] = (nombre, caso) =>
    texto.replace("{nombre}", nombre).replace("{caso}", caso);

  localStorage.setItem("plantillas", JSON.stringify(mensajesPredeterminados));
}
