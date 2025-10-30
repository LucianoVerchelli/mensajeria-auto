// src/js/themeToggle.js
export function inicializarModoOscuro(btnModo) {
  btnModo.addEventListener("click", () => {
    document.body.classList.add("fade-transition");
    document.body.classList.toggle("dark");
    localStorage.setItem("modoOscuro", document.body.classList.contains("dark"));
    setTimeout(() => document.body.classList.remove("fade-transition"), 600);
  });

  if (localStorage.getItem("modoOscuro") === "true" ||
      window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.body.classList.add("dark");
    Swal.update({ background: "#1f2937", color: "#f3f4f6" });
  }
}
