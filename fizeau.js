/*
 * Fizeau interferometer module.
 *
 * This module is intentionally self-contained so it can be loaded by the
 * existing sandbox without changing the numerical models for the other
 * instruments. It adds a fifth instrument tab and reuses the existing canvas
 * and control cards.
 */
(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const TAU = 2 * Math.PI;
  const state = {
    active: false,
    wavelength: 632.8,
    reference: 50000,
    test: 50000.5,
    phaseOffset: 0,
    coherence: 100,
    aperture: 10,
  };

  function fizeauModel() {
    const opd = state.test - state.reference;
    const phase = TAU * opd / state.wavelength + state.phaseOffset * Math.PI / 180;
    const gamma = state.coherence / 100;
    const intensity = 0.5 * (1 + gamma * Math.cos(phase));
    return { opd, phase, gamma, intensity, iMin: 0.5 * (1 - gamma), iMax: 0.5 * (1 + gamma) };
  }

  function addTab() {
    const nav = document.querySelector(".instrument-tabs");
    if (!nav || document.getElementById("tab-fizeau")) return;
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "tab";
    tab.id = "tab-fizeau";
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", "false");
    tab.innerHTML = '<span class="tab-name">Fizeau</span><span class="tab-sub">Surface · Test/reference</span>';
    nav.appendChild(tab);
    tab.addEventListener("click", () => activate(true));
  }

  function setControl(id, value) {
    const el = $(id);
    if (el) el.value = value;
  }

  function activate(on) {
    state.active = on;
    const tab = $("tab-fizeau");
    if (tab) {
      tab.classList.toggle("active", on);
      tab.setAttribute("aria-selected", String(on));
    }
    if (!on) return;

    document.querySelectorAll(".instrument-tabs .tab:not(#tab-fizeau)").forEach(t => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });

    // Reuse the existing controls while giving them Fizeau terminology.
    const desc = $("instrumentDesc");
    if (desc) desc.innerHTML = "A Fizeau interferometer compares a reference surface with a test surface. The reflected wavefronts form straight or curved fringes whose spacing and curvature reveal surface-height differences.";
    const badge = $("instrumentBadge");
    if (badge) badge.textContent = "Fizeau";
    const mode = $("fringeModeBadge");
    if (mode) mode.textContent = "Surface fringes";
    if ($("armGroupTitle")) $("armGroupTitle").textContent = "Reference / Test Surfaces";
    if ($("armALabel")) $("armALabel").textContent = "Reference surface distance";
    if ($("armBLabel")) $("armBLabel").textContent = "Test surface distance";
    if ($("armAHint")) $("armAHint").textContent = "Optical distance to the reference flat. The reference and test surfaces should be nearly equal for visible fringes.";
    if ($("armBHint")) $("armBHint").textContent = "Optical distance to the test surface. A height difference of λ/2 produces one full reflected-fringe cycle.";
    if ($("plotTitle")) $("plotTitle").textContent = "Intensity vs Surface OPD";
    if ($("fringeTitle")) $("fringeTitle").textContent = "Fizeau Surface Fringes";
    if ($("opdHeading")) $("opdHeading").textContent = "Surface OPD:";
    if ($("opdDefinition")) $("opdDefinition").innerHTML = "Δ = L<sub>test</sub> − L<sub>reference</sub>";
    if ($("quarterWave")) $("quarterWave").textContent = "+λ/4 on test surface";
    if ($("halfWave")) $("halfWave").textContent = "+λ/2 on test surface";

    ["refractiveControl", "reflectivityControl", "rotationControl", "fiberTurnsControl", "tiltControl"].forEach(id => {
      if ($(id)) $(id).style.display = "none";
    });
    if ($("armBControl")) $("armBControl").style.display = "";
    if ($("fringeApertureControl")) $("fringeApertureControl").style.display = "";
    setControl("armA", state.reference);
    setControl("armAInput", state.reference);
    setControl("armB", state.test);
    setControl("armBInput", state.test);
    render();
  }

  function colour() {
    const nm = state.wavelength;
    if (nm < 490) return "rgb(61,150,245)";
    if (nm < 580) return "rgb(61,214,150)";
    if (nm < 645) return "rgb(245,197,66)";
    return "rgb(245,100,61)";
  }

  function drawDiagram() {
    const canvas = $("diagram");
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height, c = colour();
    ctx.fillStyle = "#060e1a"; ctx.fillRect(0, 0, w, h);
    const y = h * 0.52, bs = w * 0.25, ref = w * 0.68, test = w * 0.88;
    ctx.strokeStyle = c; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(w * 0.08, y); ctx.lineTo(bs - 12, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bs, y - 12); ctx.lineTo(bs, h * 0.20); ctx.lineTo(ref, h * 0.20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bs, y + 12); ctx.lineTo(bs, h * 0.82); ctx.lineTo(test, h * 0.82); ctx.stroke();
    ctx.fillStyle = "#f5c542";
    ctx.fillRect(ref - 3, h * 0.14, 6, 18); ctx.fillRect(test - 3, h * 0.76, 6, 18);
    ctx.strokeStyle = "#3dd6f5"; ctx.beginPath(); ctx.moveTo(bs - 12, y - 12); ctx.lineTo(bs + 12, y + 12); ctx.stroke();
    ctx.fillStyle = "#a8d8f0"; ctx.font = "bold 10px monospace";
    ctx.fillText("Laser", w * 0.07, y + 24); ctx.fillText("BS", bs + 16, y - 14);
    ctx.fillText("Reference flat", ref - 34, h * 0.11); ctx.fillText("Test surface", test - 30, h * 0.74);
    const m = fizeauModel();
    ctx.fillStyle = c; ctx.fillText(`Δ = ${m.opd.toFixed(2)} nm`, 8, h - 28);
    ctx.fillText(`φ = ${(m.phase / Math.PI).toFixed(3)}π`, 8, h - 12);
  }

  function drawFringes() {
    const canvas = $("fringeCanvas");
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    const W = Math.round(rect.width * dpr), H = Math.round(rect.height * dpr);
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d"), data = ctx.createImageData(W, H), c = colour();
    const match = c.match(/rgb\((\d+),(\d+),(\d+)\)/).slice(1).map(Number);
    const m = fizeauModel(), gamma = m.gamma;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const xn = x / W - 0.5, yn = y / H - 0.5;
      // A shallow wedge models the test/reference separation. Curvature adds
      // the characteristic Fizeau fringe bend for a spherical test surface.
      const surfaceOPD = m.opd + state.wavelength * (xn * 7 + (xn * xn + yn * yn) * 3);
      const I = 0.5 * (1 + gamma * Math.cos(TAU * surfaceOPD / state.wavelength + state.phaseOffset * Math.PI / 180));
      const i = (y * W + x) * 4;
      data.data[i] = Math.round(match[0] * I); data.data[i + 1] = Math.round(match[1] * I); data.data[i + 2] = Math.round(match[2] * I); data.data[i + 3] = 255;
    }
    ctx.putImageData(data, 0, 0);
  }

  function drawPlot() {
    const canvas = $("plot");
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext("2d"); ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height, m = fizeauModel();
    ctx.fillStyle = "#060e1a"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#1f3d5c"; ctx.beginPath(); ctx.moveTo(42, 12); ctx.lineTo(42, h - 26); ctx.lineTo(w - 10, h - 26); ctx.stroke();
    ctx.strokeStyle = colour(); ctx.beginPath();
    for (let i = 0; i <= 300; i++) { const opd = -4 * state.wavelength + i * 8 * state.wavelength / 300; const I = 0.5 * (1 + m.gamma * Math.cos(TAU * opd / state.wavelength + state.phaseOffset * Math.PI / 180)); const x = 42 + i / 300 * (w - 52), y = 12 + (h - 38) * (1 - I); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
    ctx.fillStyle = "#7da4c0"; ctx.font = "10px monospace"; ctx.fillText("surface OPD (nm)", w / 2 - 38, h - 6); ctx.fillText("I/I₀", 8, 18);
  }

  function render() {
    if (!state.active) return;
    state.wavelength = Number($("wavelength")?.value || state.wavelength);
    state.reference = Number($("armA")?.value || state.reference);
    state.test = Number($("armB")?.value || state.test);
    state.phaseOffset = Number($("phaseOffset")?.value || 0);
    state.coherence = Number($("coherence")?.value || 100);
    const m = fizeauModel();
    if ($("intensity")) $("intensity").textContent = m.intensity.toFixed(4);
    if ($("intensityMin")) $("intensityMin").textContent = m.iMin.toFixed(4);
    if ($("intensityMax")) $("intensityMax").textContent = m.iMax.toFixed(4);
    if ($("contrast")) $("contrast").textContent = `${(m.gamma * 100).toFixed(1)}%`;
    if ($("opdDisplay")) $("opdDisplay").textContent = `${m.opd.toFixed(3)} nm`;
    if ($("phaseDiff")) $("phaseDiff").textContent = `${(m.phase / Math.PI).toFixed(3)}π rad`;
    if ($("intensityFormula")) $("intensityFormula").textContent = `${m.intensity.toFixed(4)} = ½[1 + γ cos(φ)]`;
    if ($("modelDescription")) $("modelDescription").innerHTML = `<p>Two reflected wavefronts interfere after returning from a reference flat and a test surface.</p><p class="equation">I / I₀ = ½ [ 1 + γ cos(2π·Δ/λ + φ₀) ]</p><p class="fine-print">For near-normal incidence, a surface height change of λ/2 produces one complete reflected Fizeau fringe cycle. The displayed wedge and curvature illustrate how surface figure maps to fringe shape.</p>`;
    drawDiagram(); drawFringes(); drawPlot();
  }

  function wireInputs() {
    ["wavelength", "armA", "armB", "phaseOffset", "coherence"].forEach(id => $(id)?.addEventListener("input", render));
    window.addEventListener("resize", () => state.active && render());
  }

  addTab();
  wireInputs();
})();
