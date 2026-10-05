// Menu mobile + anno footer + nav attiva
document.getElementById("burger")?.addEventListener("click", () => {
  document.getElementById("nav").classList.toggle("open");
});
const y = new Date().getFullYear();
document.querySelectorAll("#anno").forEach((el) => { el.textContent = y; });
