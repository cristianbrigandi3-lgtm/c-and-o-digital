// Menu mobile + anno footer + reveal discreto (rispetta reduced-motion)
const burger = document.getElementById("burger");
burger?.addEventListener("click", () => {
  const nav = document.getElementById("nav");
  const open = nav.classList.toggle("open");
  burger.setAttribute("aria-expanded", String(open));
});
const y = new Date().getFullYear();
document.querySelectorAll("#anno").forEach((el) => { el.textContent = y; });

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("visibile"); io.unobserve(e.target); }
    }),
    { threshold: 0.12 }
  );
  document.querySelectorAll(".blocco").forEach((s) => { s.classList.add("reveal"); io.observe(s); });
}
