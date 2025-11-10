// src/js/messageTemplates.js
export const PLANTILLAS_BASE = {
  "1": (nombre, caso) =>
    `Hola ${nombre}! Mi nombre es Matías.\nTe contacto por tu accidente pasado por ART, para saber cómo te encontrabas y cómo ibas con la evolución tu tratamiento.`,
  "2": (nombre, caso) =>
    `Buenas tardes ${nombre}! Mi nombre es Daysi.\nMe comunico por ${caso}, con la intención de brindarte asesoría legal, ya que figura en sistema que tenés una indemnización económica disponible por el siniestro denunciado en ART bajo la ley N°24.557.`,
  "3": (nombre, caso) =>
    `Hola ${nombre}! Espero que estés bien.\nNos comunicamos nuevamente respecto a ${caso}, para saber si necesitás asistencia adicional o ya pudiste resolver tu situación.`
};

// 🔁 Cargar plantillas guardadas
export function cargarPlantillasGuardadas() {
  try {
    const data = JSON.parse(localStorage.getItem("plantillas") || "{}");
    const result = {};
    for (const key in data) {
      const texto = data[key];
      // reconstruimos la función
      result[key] = (nombre, caso) =>
        texto.replace("{nombre}", nombre).replace("{caso}", caso);
    }
    return result;
  } catch {
    return {};
  }
}

// 💾 Guardar nueva plantilla
export function guardarPlantilla(nuevaClave, texto) {
  const plantillasActuales = JSON.parse(localStorage.getItem("plantillas") || "{}");
  plantillasActuales[nuevaClave] = texto; // 🔹 guardamos solo el texto
  localStorage.setItem("plantillas", JSON.stringify(plantillasActuales));
}
