/* Collapsible option sections for Pergola Studio. Reads the tool's own controls; never changes them. */
(function () {
  const aside = document.querySelector(".controls");
  if (!aside) return;
  const $ = s => aside.querySelector(s);
  const opt = sel => { const e = $(sel); return e && e.selectedOptions && e.selectedOptions[0] ? e.selectedOptions[0].textContent.trim() : ""; };
  const out = id => { const e = $(id); return e ? e.textContent.trim() : ""; };
  const set = (key, text) => { const el = aside.querySelector('[data-sum="' + key + '"]'); if (el && el.textContent !== text) el.textContent = text; };

  function refresh() {
    set("structure", [opt("#line"), opt("#style"), opt("#mount")].filter(Boolean).join(" \u00b7 "));
    const lf = $("#louver-field");
    const size = [out("#width-value"), out("#depth-value")].filter(Boolean).join(" \u00d7 ");
    const lou = lf && lf.offsetParent !== null && out("#louvers-value") ? " \u00b7 louvers " + out("#louvers-value") : "";
    set("size", size + lou);
    const fin = $("#finishes [aria-pressed=true]");
    set("finish", fin ? fin.textContent.trim() : "");
    const on = [...aside.querySelectorAll("#options input[type=checkbox]:checked")].map(i => (i.labels && i.labels[0] ? i.labels[0].textContent.trim() : ""));
    set("extras", on.length ? on.length + " added: " + on.join(", ") : "None added");
    set("price", out("#price"));
  }
  let q = false;
  const queue = () => { if (!q) { q = true; requestAnimationFrame(() => { q = false; refresh(); }); } };
  ["input", "change", "click"].forEach(t => aside.addEventListener(t, queue));
  new MutationObserver(queue).observe(aside, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["aria-pressed", "value", "hidden", "style"] });

  // one section open at a time (also covers browsers without the name attribute)
  const all = [...aside.querySelectorAll("details.acc")];
  all.forEach(d => d.addEventListener("toggle", () => {
    if (d.open) {
      all.forEach(o => { if (o !== d) o.open = false; });
      if (matchMedia("(max-width: 720px)").matches) d.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }));
  refresh();
  addEventListener("load", () => { refresh(); setTimeout(refresh, 600); });
})();
