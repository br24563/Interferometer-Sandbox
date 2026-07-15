"use strict";
// ============================================================
//  Interferometer Lab — app.js
//  Covers: Michelson, Mach–Zehnder, Fabry–Pérot, Sagnac
//  All internal lengths in nanometres. Physics in SI where noted.
// ============================================================

const $ = id => document.getElementById(id);
const TAU = 2 * Math.PI;

// ==================== Instrument Configuration ====================

const INSTRUMENTS = {
  michelson: {
    name: "Michelson",
    badge: "Michelson",
    desc: "A beamsplitter divides the beam into two arms. Light travels to each mirror and returns, creating a round-trip OPD = 2(L_B − L_A). The detector is collinear with the source.",
    opdDef: "Δ = 2·n·(L<sub>B</sub> − L<sub>A</sub>)",
    opdHeading: "OPD (round-trip):",
    armALabel: "Arm A — Mirror A length",
    armBLabel: "Arm B — Mirror B length",
    armAHint: "Geometric path from beamsplitter to mirror A (one-way). In Michelson the light travels this path twice (round-trip).",
    armBHint: "Geometric path from beamsplitter to mirror B (one-way). Scanning mirror B by λ/2 completes one full fringe cycle.",
    armGroup: "Interferometer Arms",
    fringeMode: "Circular",
    showRefractive: true,
    refractiveNote: "Refractive index n of any medium inserted in an arm (default 1.0 = air). Optical path = n × geometric path.",
    showArmB: true,
    showRotation: false,
    showReflectivity: false,
    quarterWaveText: "+λ/4 on Arm B",
    model: (inp) => {
      const lambda = inp.wavelength; // nm
      const opd = 2 * inp.n * (inp.armB - inp.armA);
      const offset = inp.phaseOffset * Math.PI / 180;
      const phase = TAU * (opd / lambda) + offset;
      const gamma = inp.coherence / 100;
      const intensity = 0.5 * (1 + gamma * Math.cos(phase));
      return { lambda, opd, phase, gamma, intensity, fringeOrder: opd / lambda, visibility: gamma };
    },
    modelHTML: (inp) => `
      <p>Equal-intensity beams with coherence γ:</p>
      <p class="equation">I / I₀ = ½ [ 1 + γ cos(φ) ]</p>
      <p>Where:</p>
      <ul>
        <li><strong>φ = 2π·OPD/λ + φ₀</strong> — total phase difference</li>
        <li><strong>OPD = 2n(L<sub>B</sub> − L<sub>A</sub>)</strong> — round-trip path difference</li>
        <li><strong>γ ∈ [0,1]</strong> — temporal coherence (fringe visibility)</li>
        <li><strong>λ = ${inp.wavelength.toFixed(1)} nm</strong> — vacuum wavelength</li>
      </ul>
      <p class="fine-print">A λ/2 mirror displacement causes a full 2π fringe cycle. Coherence length ℓ_c ≈ λ²/Δλ sets the maximum detectable OPD.</p>
    `,
  },

  machZehnder: {
    name: "Mach–Zehnder",
    badge: "Mach–Zehnder",
    desc: "Two beamsplitters route the beam through two separated single-pass arms. The second BS recombines them. OPD = n·L_B − L_A. Widely used for phase-sensitive measurement in flows, plasmas and integrated optics.",
    opdDef: "Δ = n·L<sub>B</sub> − L<sub>A</sub>",
    opdHeading: "OPD (single-pass):",
    armALabel: "Path A length (reference)",
    armBLabel: "Path B length (sample arm)",
    armAHint: "Single-pass length of the reference arm. Light travels this distance once from BS1 to BS2 via mirror M1.",
    armBHint: "Single-pass length of the sample arm. Insert a glass cell or flow channel here to add an optical path shift (n−1)×thickness.",
    armGroup: "Beam Paths",
    fringeMode: "Localized",
    showRefractive: true,
    refractiveNote: "Refractive index n of a sample inserted in Path B only. Setting n > 1 models inserting glass (n≈1.5) or another transparent medium.",
    showArmB: true,
    showRotation: false,
    showReflectivity: false,
    quarterWaveText: "+λ/4 on Path B",
    model: (inp) => {
      const lambda = inp.wavelength;
      const opd = inp.n * inp.armB - inp.armA;
      const offset = inp.phaseOffset * Math.PI / 180;
      const phase = TAU * (opd / lambda) + offset;
      const gamma = inp.coherence / 100;
      const intensity = 0.5 * (1 + gamma * Math.cos(phase));
      return { lambda, opd, phase, gamma, intensity, fringeOrder: opd / lambda, visibility: gamma };
    },
    modelHTML: (inp) => `
      <p>Single-pass transmission interferometer:</p>
      <p class="equation">I / I₀ = ½ [ 1 + γ cos(φ) ]</p>
      <p>Where:</p>
      <ul>
        <li><strong>φ = 2π·OPD/λ + φ₀</strong></li>
        <li><strong>OPD = n·L<sub>B</sub> − L<sub>A</sub></strong> — single-pass path difference; n is the sample refractive index</li>
        <li><strong>n = ${inp.n.toFixed(4)}</strong> — medium / sample refractive index in arm B</li>
        <li><strong>γ = ${(inp.coherence/100).toFixed(3)}</strong> — coherence degree</li>
      </ul>
      <p class="fine-print">Inserting a glass plate of thickness t and index n_s shifts OPD by (n_s − 1)t. A λ scan of OPD equals one fringe period.</p>
    `,
  },

  fabryPerot: {
    name: "Fabry–Pérot",
    badge: "Fabry–Pérot",
    desc: "Two partially-reflective mirrors form a resonant cavity. Multiple reflections create narrow Airy-function transmission peaks. Finesse ℱ = π√R / (1−R) determines the sharpness of resonances.",
    opdDef: "Δ = 2nL (round-trip cavity)",
    opdHeading: "Round-trip OPD:",
    armALabel: "Cavity / etalon spacing (L)",
    armBLabel: "— (not used)",
    armAHint: "Distance between the two partially-reflective mirror surfaces. Resonance occurs when 2nL = mλ. Scanning L by λ/(2n) advances one fringe order.",
    armBHint: "",
    armGroup: "Etalon / Cavity",
    fringeMode: "Ring (Haidinger)",
    showRefractive: true,
    refractiveNote: "Refractive index n of the material filling the cavity gap (air = 1.000, glass etalon ≈ 1.5). Affects both the resonance condition and FSR.",
    showArmB: false,
    showRotation: false,
    showReflectivity: true,
    quarterWaveText: "+λ/4 spacing",
    model: (inp) => {
      const lambda = inp.wavelength;
      const R = inp.reflectivity / 100;
      const L = inp.armA;
      const opd = 2 * inp.n * L;
      const offset = inp.phaseOffset * Math.PI / 180;
      const phase = TAU * (opd / lambda) + offset;
      const finesse = (Math.PI * Math.sqrt(R)) / (1 - R);
      // Airy transmission function: T = 1 / (1 + F sin²(φ/2)), F = 4R/(1-R)²
      const F = (4 * R) / Math.pow(1 - R, 2);
      const intensity = 1 / (1 + F * Math.pow(Math.sin(phase / 2), 2));
      // FSR in nm (wavelength units): FSR_λ = λ² / (2nL) when expressed in wavelength
      const fsr = lambda * lambda / (opd === 0 ? 1e-9 : opd);
      const gamma = inp.coherence / 100;
      const visibility = (2 * Math.sqrt(R)) / (1 + R);
      return {
        lambda, opd, phase, gamma, intensity: intensity * gamma + 0.5 * (1 - gamma),
        rawIntensity: intensity, fringeOrder: opd / lambda, visibility, finesse, fsr, F, R
      };
    },
    modelHTML: (inp) => {
      const R = inp.reflectivity / 100;
      const F = (4 * R) / Math.pow(1 - R, 2);
      const finesse = (Math.PI * Math.sqrt(R)) / (1 - R);
      return `
      <p>Multiple-beam interference — Airy transmission function:</p>
      <p class="equation">T = 1 / [ 1 + F·sin²(φ/2) ]</p>
      <p>Where:</p>
      <ul>
        <li><strong>F = 4R/(1−R)²</strong> = ${F.toFixed(2)} — coefficient of finesse</li>
        <li><strong>φ = 2π·2nL/λ + φ₀</strong> — round-trip phase</li>
        <li><strong>ℱ = π√R/(1−R)</strong> = ${finesse.toFixed(1)} — finesse (peak sharpness)</li>
        <li><strong>R = ${(R*100).toFixed(1)}%</strong> — mirror power reflectivity</li>
        <li><strong>FSR = λ²/(2nL)</strong> — free spectral range</li>
      </ul>
      <p class="fine-print">Peak transmission occurs when φ = 2mπ. The FWHM of each peak = FSR / ℱ. Resolving power = m·ℱ.</p>
      `; },
  },

  sagnac: {
    name: "Sagnac",
    badge: "Sagnac",
    desc: "A ring interferometer where counter-propagating beams travel identical geometric paths. Rotation of the platform at angular velocity Ω shifts the OPD: Δ = 4AΩ/c (Sagnac effect). Used in laser gyroscopes and fiber-optic gyros.",
    opdDef: "Δ = 4AΩ / c",
    opdHeading: "Sagnac OPD:",
    armALabel: "Ring radius (r)",
    armBLabel: "— (not used)",
    armAHint: "Radius of the circular ring path. The enclosed area A = πr². A larger ring area gives a greater Sagnac OPD per unit of rotation rate, improving sensitivity.",
    armBHint: "",
    armGroup: "Ring Geometry",
    fringeMode: "Circular",
    showRefractive: false,
    refractiveNote: "",
    showArmB: false,
    showRotation: true,
    showReflectivity: false,
    quarterWaveText: "+λ/4 (no mirror scan)",
    model: (inp) => {
      const lambda = inp.wavelength; // nm
      const c = 3e17; // nm/s (speed of light)
      // Ring area A = π r² where r = armA in nm
      const r_nm = inp.armA;
      const A_nm2 = Math.PI * r_nm * r_nm;
      const omega_rad_s = inp.rotationRate * (Math.PI / 180); // convert deg/s → rad/s
      // Sagnac OPD (nm): 4AΩ/c
      const opd = (4 * A_nm2 * omega_rad_s) / c;
      const offset = inp.phaseOffset * Math.PI / 180;
      const phase = TAU * (opd / lambda) + offset;
      const gamma = inp.coherence / 100;
      const intensity = 0.5 * (1 + gamma * Math.cos(phase));
      return {
        lambda, opd, phase, gamma, intensity, fringeOrder: opd / lambda,
        visibility: gamma, sagnacPhase: phase - offset, omega_rad_s, A_nm2
      };
    },
    modelHTML: (inp) => {
      const c = 3e17;
      const r_nm = inp.armA;
      const A_m2 = Math.PI * (r_nm * 1e-9) * (r_nm * 1e-9);
      const omega = inp.rotationRate * (Math.PI / 180);
      return `
      <p>Sagnac ring interferometer — non-reciprocal phase shift:</p>
      <p class="equation">Δ = 4AΩ/c &nbsp;→&nbsp; φ = 2πΔ/λ</p>
      <p>Where:</p>
      <ul>
        <li><strong>A = πr²</strong> = ${A_m2.toExponential(3)} m² — enclosed ring area</li>
        <li><strong>Ω = ${inp.rotationRate.toFixed(1)}°/s</strong> = ${omega.toExponential(3)} rad/s — rotation rate</li>
        <li><strong>c</strong> — speed of light in vacuum</li>
        <li><strong>λ = ${inp.wavelength.toFixed(1)} nm</strong> — wavelength</li>
      </ul>
      <p class="fine-print">The effect is first-order in v/c (non-relativistic regime). Fibre gyroscopes wind many turns to increase effective area N·πr².</p>
      `; },
  }
};

// ==================== State ====================

let currentInstrument = "michelson";

const SOURCE_PRESETS = {
  hene:     { wavelength: 632.8, label: "He-Ne 632.8 nm" },
  ndyag:    { wavelength: 532.0, label: "Nd:YAG 532.0 nm" },
  sodium:   { wavelength: 589.3, label: "Na-D 589.3 nm" },
  ar488:    { wavelength: 488.0, label: "Ar⁺ 488.0 nm" },
  ar514:    { wavelength: 514.5, label: "Ar⁺ 514.5 nm" },
  diode780: { wavelength: 780.0, label: "Diode 780.0 nm" },
  custom:   { wavelength: null,  label: "Custom" }
};

const DEFAULTS = {
  wavelength: 632.8,
  armA: 50000,
  armB: 50000.5,
  phaseOffset: 0,
  coherence: 100,
  refractiveIndex: 1.0,
  reflectivity: 90,
  rotationRate: 0,
  tiltAngle: 0
};

const unitScale = { nm: 1, um: 1000, mm: 1e6 };
const MAX_ARM_NM = 1e6; // 1 mm max
let activeLengthUnit = "nm";

// ==================== DOM References ====================

const controls = {
  wavelength:       $("wavelength"),
  wavelengthInput:  $("wavelengthInput"),
  armA:             $("armA"),
  armAInput:        $("armAInput"),
  armB:             $("armB"),
  armBInput:        $("armBInput"),
  phaseOffset:      $("phaseOffset"),
  phaseOffsetInput: $("phaseOffsetInput"),
  coherence:        $("coherence"),
  coherenceInput:   $("coherenceInput"),
  refractiveIndex:        $("refractiveIndex"),
  refractiveIndexInput:   $("refractiveIndexInput"),
  reflectivity:           $("reflectivity"),
  reflectivityInput:      $("reflectivityInput"),
  rotationRate:           $("rotationRate"),
  rotationRateInput:      $("rotationRateInput"),
  tiltAngle:              $("tiltAngle"),
  tiltAngleInput:         $("tiltAngleInput"),
};

const lengthUnit = $("lengthUnit");
const sourcePreset = $("sourcePreset");
const unitSymbol = () => lengthUnit.value === "um" ? "µm" : lengthUnit.value;
const displayLength = (nm, digits = 3) => `${(nm / unitScale[lengthUnit.value]).toFixed(digits)} ${unitSymbol()}`;

// ==================== Units ====================

function setArmUnit(nextUnit) {
  const oldScale = unitScale[activeLengthUnit];
  const scale = unitScale[nextUnit];
  [
    [controls.armA, controls.armAInput, "armAUnit"],
    [controls.armB, controls.armBInput, "armBUnit"],
  ].forEach(([slider, input, unitId]) => {
    const physicalNm = Number(slider.value) * oldScale;
    const maxInUnit = MAX_ARM_NM / scale;
    slider.max = maxInUnit; slider.step = 0.001;
    input.max = maxInUnit; input.step = 0.001;
    slider.value = physicalNm / scale;
    input.value = slider.value;
    $(unitId).textContent = nextUnit === "um" ? "µm" : nextUnit;
  });
  activeLengthUnit = nextUnit;
  render();
}

lengthUnit.addEventListener("change", () => setArmUnit(lengthUnit.value));

// ==================== Instrument Tabs ====================

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    currentInstrument = tab.dataset.instrument;
    updateInstrumentUI();
    render();
  });
});

function updateInstrumentUI() {
  const cfg = INSTRUMENTS[currentInstrument];
  $("instrumentDesc").innerHTML = cfg.desc;
  $("instrumentBadge").textContent = cfg.badge;
  $("fringeModeBadge").textContent = cfg.fringeMode;
  $("armGroupTitle").textContent = cfg.armGroup;
  $("armALabel").textContent = cfg.armALabel;
  $("armBLabel").textContent = cfg.armBLabel;

  // Update per-instrument arm hint text
  if ($("armAHint")) $("armAHint").textContent = cfg.armAHint || "";
  if ($("armBHint")) $("armBHint").textContent = cfg.armBHint || "";

  $("armBControl").style.display = cfg.showArmB ? "" : "none";
  $("refractiveControl").style.display = cfg.showRefractive ? "" : "none";
  if ($("refractiveNote")) $("refractiveNote").textContent = cfg.refractiveNote;
  $("reflectivityControl").style.display = cfg.showReflectivity ? "" : "none";
  $("rotationControl").style.display = cfg.showRotation ? "" : "none";
  // Tilt always visible except Fabry-Pérot (Haidinger rings are angle-swept, not tilt-swept)
  $("tiltControl").style.display = currentInstrument === "fabryPerot" ? "none" : "";

  $("fpRow").style.display = currentInstrument === "fabryPerot" ? "" : "none";
  $("fsrRow").style.display = currentInstrument === "fabryPerot" ? "" : "none";
  $("airyLegend").style.display = currentInstrument === "fabryPerot" ? "" : "none";
  $("sagnacRow").style.display = currentInstrument === "sagnac" ? "" : "none";

  $("quarterWave").textContent = cfg.quarterWaveText;
}

// ==================== Slider ↔ Input Sync ====================

function syncFromSlider(sliderId, inputId) {
  $(inputId).value = $(sliderId).value;
}

function syncFromInput(inputId, sliderId) {
  let v = Number($(inputId).value);
  const s = $(sliderId);
  v = Math.max(Number(s.min), Math.min(Number(s.max), v));
  s.value = v;
  $(inputId).value = v;
}

const SYNC_PAIRS = [
  ["wavelength",       "wavelengthInput"],
  ["armA",             "armAInput"],
  ["armB",             "armBInput"],
  ["phaseOffset",      "phaseOffsetInput"],
  ["coherence",        "coherenceInput"],
  ["refractiveIndex",  "refractiveIndexInput"],
  ["reflectivity",     "reflectivityInput"],
  ["rotationRate",     "rotationRateInput"],
  ["tiltAngle",        "tiltAngleInput"],
];

SYNC_PAIRS.forEach(([slider, input]) => {
  $(slider).addEventListener("input", () => { syncFromSlider(slider, input); render(); });
  $(input).addEventListener("input",  () => { syncFromInput(input, slider);  render(); });
  $(input).addEventListener("change", () => { syncFromInput(input, slider);  render(); });
  $(input).addEventListener("blur",   () =>   syncFromInput(input, slider));
});

// Source preset — also marks the wavelength input as "preset-locked" so
// moving the slider switches it back to "custom" automatically.
sourcePreset.addEventListener("change", () => {
  const p = SOURCE_PRESETS[sourcePreset.value];
  if (p && p.wavelength !== null) {
    controls.wavelength.value      = p.wavelength;
    controls.wavelengthInput.value = p.wavelength;
    $("sourcePresetBadge").textContent = p.label;
    render();
  } else if (sourcePreset.value === "custom") {
    $("sourcePresetBadge").textContent = `Custom ${Number(controls.wavelength.value).toFixed(1)} nm`;
  }
});

// When the user manually moves the wavelength slider/input, switch preset to "custom"
function markPresetCustom() {
  if (sourcePreset.value !== "custom") {
    sourcePreset.value = "custom";
    $("sourcePresetBadge").textContent = `Custom ${Number(controls.wavelength.value).toFixed(1)} nm`;
  }
}
controls.wavelength.addEventListener("input",      markPresetCustom);
controls.wavelengthInput.addEventListener("input",  markPresetCustom);
controls.wavelengthInput.addEventListener("change", markPresetCustom);

// ==================== Read Inputs ====================

function readInputs() {
  const scale = unitScale[activeLengthUnit];
  return {
    wavelength:    Number(controls.wavelength.value),
    armA:          Number(controls.armA.value) * scale,
    armB:          Number(controls.armB.value) * scale,
    phaseOffset:   Number(controls.phaseOffset.value),
    coherence:     Number(controls.coherence.value),
    n:             Number(controls.refractiveIndex.value),
    reflectivity:  Number(controls.reflectivity.value),
    rotationRate:  Number(controls.rotationRate.value),
    tiltAngle:     Number(controls.tiltAngle.value), // mrad
  };
}

// ==================== Colour Mapping ====================

function spectrumColour(nm) {
  let r = 0, g = 0, b = 0;
  if      (nm < 380) { r = 0.5; b = 0.5; }
  else if (nm < 440) { r = (440-nm)/60; b = 1; }
  else if (nm < 490) { g = (nm-440)/50; b = 1; }
  else if (nm < 510) { g = 1; b = (510-nm)/20; }
  else if (nm < 580) { r = (nm-510)/70; g = 1; }
  else if (nm < 645) { r = 1; g = (645-nm)/65; }
  else if (nm < 780) { r = 1; }
  else               { r = 0.8; b = 0.2; }
  const gam = 0.8;
  const s = v => Math.round(255 * Math.pow(Math.max(0, Math.min(1, v)), 1/gam));
  return `rgb(${s(r)},${s(g)},${s(b)})`;
}

const SPECTRUM_NAMES = [
  [380, 450, "Violet"],  [450, 495, "Blue"],   [495, 530, "Green"],
  [530, 590, "Yellow"],  [590, 625, "Orange"], [625, 780, "Red"]
];

function spectrumName(nm) {
  for (const [lo, hi, name] of SPECTRUM_NAMES) if (nm >= lo && nm < hi) return name;
  return nm < 380 ? "UV" : "NIR";
}

// ==================== Canvas Helpers ====================

function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = devicePixelRatio || 1;
  canvas.width  = rect.width  * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  return [ctx, rect.width, rect.height];
}

function formatPhase(rad) {
  const deg = (rad * 180 / Math.PI);
  const norm = ((deg % 360) + 360) % 360;
  return `${norm.toFixed(1)}° (${(rad / Math.PI).toFixed(3)}π rad)`;
}

function fmtSci(v) {
  if (Math.abs(v) < 1e-3 || Math.abs(v) >= 1e6) return v.toExponential(4);
  return v.toPrecision(5);
}

// ==================== Diagram Drawing ====================
// Each diagram is drawn to fill its canvas with a properly annotated schematic.

function drawDiagram(inp, model, colour) {
  switch (currentInstrument) {
    case "michelson":   drawMichelson(inp, model, colour);   break;
    case "machZehnder": drawMachZehnder(inp, model, colour); break;
    case "fabryPerot":  drawFabryPerot(inp, model, colour);  break;
    case "sagnac":      drawSagnac(inp, model, colour);      break;
  }
}

// Shared drawing primitives
function drawBeamSplitter(ctx, x, y, size = 14, label = "BS") {
  ctx.save();
  ctx.strokeStyle = "#3dd6f5";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - size, y + size);
  ctx.lineTo(x + size, y - size);
  ctx.stroke();
  ctx.fillStyle = "#7da4c0";
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText(label, x + size + 3, y - size + 4);
  ctx.restore();
}

function drawMirror(ctx, x, y, horiz = false, label = "M") {
  ctx.save();
  ctx.fillStyle = "#f5c542";
  if (horiz) ctx.fillRect(x - 16, y - 2, 32, 4);
  else       ctx.fillRect(x - 2, y - 16, 4, 32);
  ctx.fillStyle = "#7da4c0";
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, x, horiz ? y - 8 : y - 20);
  ctx.restore();
}

function drawBeam(ctx, x1, y1, x2, y2, colour, width = 1.5) {
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawDetector(ctx, x, y, colour) {
  ctx.save();
  ctx.fillStyle = colour;
  ctx.globalAlpha = 0.25;
  ctx.fillRect(x - 14, y - 14, 28, 28);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 14, y - 14, 28, 28);
  ctx.fillStyle = "#7da4c0";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Det", x, y + 26);
  ctx.restore();
}

function drawSource(ctx, x, y, colour, label = "Laser") {
  ctx.save();
  ctx.fillStyle = colour;
  ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#7da4c0";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, x, y + 21);
  ctx.restore();
}

function drawOPDAnnotation(ctx, model, inp) {
  ctx.save();
  ctx.fillStyle = "#3dd6f5";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`OPD: ${displayLength(model.opd)}`, 10, 20);
  ctx.fillText(`φ: ${formatPhase(model.phase)}`, 10, 34);
  ctx.fillText(`λ: ${inp.wavelength.toFixed(1)} nm`, 10, 48);
  ctx.restore();
}

// --- Michelson ---
function drawMichelson(inp, model, colour) {
  const [ctx, w, h] = setupCanvas($("diagram"));
  ctx.fillStyle = "#060e1a"; ctx.fillRect(0,0,w,h);

  const cx = w * 0.45;
  const cy = h * 0.58;
  const travel = Math.min(w * 0.32, h * 0.35);
  const scaleNm = travel / Math.max(inp.armA, inp.armB, 1);

  const lenA = inp.armA * scaleNm;
  const lenB = inp.armB * scaleNm;

  // Source beam
  drawSource(ctx, w * 0.10, cy, colour);
  drawBeam(ctx, w * 0.14, cy, cx - 12, cy, colour);

  // Beam splitter
  drawBeamSplitter(ctx, cx, cy, 14, "BS");

  // Arm A (vertical, up)
  drawBeam(ctx, cx, cy, cx, cy - lenA, colour);
  drawMirror(ctx, cx, cy - lenA, true, `M_A  ${displayLength(inp.armA)}`);
  // Return beam A
  drawBeam(ctx, cx, cy - lenA, cx, cy, colour);

  // Arm B (horizontal, right)
  drawBeam(ctx, cx, cy, cx + lenB, cy, colour);
  drawMirror(ctx, cx + lenB, cy, false, `M_B  ${displayLength(inp.armB)}`);
  // Return beam B
  drawBeam(ctx, cx + lenB, cy, cx, cy, colour);

  // Recombined beam to detector (downward)
  drawBeam(ctx, cx, cy, cx, cy + h * 0.22, colour);
  drawDetector(ctx, cx, cy + h * 0.22, colour);

  drawOPDAnnotation(ctx, model, inp);
}

// --- Mach–Zehnder ---
function drawMachZehnder(inp, model, colour) {
  const [ctx, w, h] = setupCanvas($("diagram"));
  ctx.fillStyle = "#060e1a"; ctx.fillRect(0,0,w,h);

  const x1 = w * 0.25, x2 = w * 0.72;
  const yLower = h * 0.72, yUpper = h * 0.25;

  // Source
  drawSource(ctx, w * 0.08, yLower, colour);
  drawBeam(ctx, w * 0.12, yLower, x1, yLower, colour);

  // BS1
  drawBeamSplitter(ctx, x1, yLower, 13, "BS1");

  // Lower arm (path A)
  drawBeam(ctx, x1, yLower, x2, yLower, colour);

  // Mirror M1 (turns lower path upward to BS2)
  drawMirror(ctx, x2, yLower, false, "M2");
  drawBeam(ctx, x2, yLower, x2, yUpper, colour);

  // Upper arm (path B) — M1 deflects to BS2
  drawBeam(ctx, x1, yLower, x1, yUpper, colour);  // from BS1 up
  drawMirror(ctx, x1, yUpper, true, "M1");
  drawBeam(ctx, x1, yUpper, x2, yUpper, colour);

  // BS2
  drawBeamSplitter(ctx, x2, yUpper, 13, "BS2");
  // Output
  drawBeam(ctx, x2, yUpper, x2, yUpper + h * 0.2, colour);
  drawDetector(ctx, x2, yUpper + h * 0.2, colour);

  // Path labels
  ctx.save();
  ctx.fillStyle = "#7da4c0"; ctx.font = "10px monospace"; ctx.textAlign = "center";
  ctx.fillText(`A: ${displayLength(inp.armA)}`, (x1 + x2) / 2, yLower + 18);
  ctx.fillText(`B: ${displayLength(inp.armB)}`, (x1 + x2) / 2, yUpper - 10);
  ctx.restore();

  drawOPDAnnotation(ctx, model, inp);
}

// --- Fabry–Pérot ---
function drawFabryPerot(inp, model, colour) {
  const [ctx, w, h] = setupCanvas($("diagram"));
  ctx.fillStyle = "#060e1a"; ctx.fillRect(0,0,w,h);

  const yMid = h * 0.52;
  const m1x = w * 0.28;
  const m2x = w * 0.68;
  const R = inp.reflectivity / 100;

  // Source
  drawSource(ctx, w * 0.08, yMid, colour);
  drawBeam(ctx, w * 0.12, yMid, m1x - 2, yMid, colour);

  // Mirror 1 (partial reflector)
  ctx.save();
  ctx.fillStyle = "#f5c542";
  ctx.fillRect(m1x - 3, yMid - 28, 6, 56);
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = "#3dd6f5";
  ctx.fillRect(m1x - 3, yMid - 28, 6, 56);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#7da4c0"; ctx.font = "10px monospace"; ctx.textAlign = "center";
  ctx.fillText("M1", m1x, yMid - 34);
  ctx.fillText(`R=${R.toFixed(2)}`, m1x, yMid + 42);
  ctx.restore();

  // Transmitted beam into cavity + multi-bounce (3 round-trips)
  const numBounce = 3;
  for (let i = 0; i < numBounce; i++) {
    const alpha = Math.pow(R, i) * 0.8;
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(m1x + 3, yMid - 10 + i * 7);
    ctx.lineTo(m2x - 3, yMid - 10 + i * 7);
    ctx.stroke();
    // Return
    ctx.beginPath();
    ctx.moveTo(m2x - 3, yMid + 10 - i * 7);
    ctx.lineTo(m1x + 3, yMid + 10 - i * 7);
    ctx.stroke();
    ctx.restore();
  }

  // Mirror 2 (partial reflector)
  ctx.save();
  ctx.fillStyle = "#f5c542";
  ctx.fillRect(m2x - 3, yMid - 28, 6, 56);
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = "#3dd6f5";
  ctx.fillRect(m2x - 3, yMid - 28, 6, 56);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#7da4c0"; ctx.font = "10px monospace"; ctx.textAlign = "center";
  ctx.fillText("M2", m2x, yMid - 34);
  ctx.fillText(`R=${R.toFixed(2)}`, m2x, yMid + 42);
  ctx.restore();

  // Transmitted output
  drawBeam(ctx, m2x + 3, yMid, w * 0.88, yMid, colour);
  drawDetector(ctx, w * 0.88, yMid, colour);

  // Spacing annotation
  ctx.save();
  ctx.strokeStyle = "#7da4c0"; ctx.lineWidth = 0.8; ctx.setLineDash([3,3]);
  ctx.beginPath(); ctx.moveTo(m1x, yMid + 52); ctx.lineTo(m2x, yMid + 52); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#7da4c0"; ctx.font = "10px monospace"; ctx.textAlign = "center";
  ctx.fillText(`L = ${displayLength(inp.armA)}`, (m1x + m2x) / 2, yMid + 64);
  ctx.restore();

  drawOPDAnnotation(ctx, model, inp);
}

// --- Sagnac ---
function drawSagnac(inp, model, colour) {
  const [ctx, w, h] = setupCanvas($("diagram"));
  ctx.fillStyle = "#060e1a"; ctx.fillRect(0,0,w,h);

  const cx = w * 0.50, cy = h * 0.50;
  const rx = w * 0.28, ry = h * 0.30;

  // Ring beam path (ellipse to represent ring)
  const CCW_ALPHA = 0.75;
  const CW_ALPHA  = 0.4;
  const omega = inp.rotationRate;

  // CW beam
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.globalAlpha = CW_ALPHA;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // CCW beam
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.globalAlpha = CCW_ALPHA;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU, true);
  ctx.stroke();
  ctx.restore();

  // Beam splitter at left of ring
  const bsX = cx - rx, bsY = cy;
  drawBeamSplitter(ctx, bsX, bsY, 11, "BS");

  // Source from left
  drawSource(ctx, bsX - w * 0.12, bsY, colour);
  drawBeam(ctx, bsX - w * 0.08, bsY, bsX - 12, bsY, colour);

  // Detector below BS
  drawBeam(ctx, bsX, bsY, bsX, bsY + h * 0.20, colour);
  drawDetector(ctx, bsX, bsY + h * 0.20, colour);

  // Rotation arrow indicator
  if (Math.abs(omega) > 0.05) {
    ctx.save();
    ctx.strokeStyle = "#f5834a";
    ctx.lineWidth = 2;
    const dir = omega > 0 ? 1 : -1;
    ctx.beginPath();
    ctx.arc(cx, cy, rx * 0.42, -Math.PI * 0.5, -Math.PI * 0.5 + dir * TAU * 0.6);
    ctx.stroke();
    // Arrowhead
    const aAngle = -Math.PI * 0.5 + dir * TAU * 0.6;
    const ax = cx + rx * 0.42 * Math.cos(aAngle);
    const ay = cy + rx * 0.42 * Math.sin(aAngle);
    ctx.fillStyle = "#f5834a";
    ctx.beginPath();
    ctx.arc(ax, ay, 4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#f5834a";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`Ω = ${omega.toFixed(1)}°/s`, cx, cy + ry + 20);
    ctx.restore();
  } else {
    ctx.save();
    ctx.fillStyle = "#4a6e89"; ctx.font = "11px monospace"; ctx.textAlign = "center";
    ctx.fillText("Ω = 0  (no Sagnac shift)", cx, cy + ry + 20);
    ctx.restore();
  }

  // Ring radius label
  ctx.save();
  ctx.strokeStyle = "#4a6e89"; ctx.lineWidth = 0.8; ctx.setLineDash([2,4]);
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + rx, cy); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#7da4c0"; ctx.font = "10px monospace"; ctx.textAlign = "center";
  ctx.fillText(`r = ${displayLength(inp.armA)}`, cx + rx / 2, cy - 6);
  ctx.restore();

  drawOPDAnnotation(ctx, model, inp);
}

// ==================== Fringe Pattern ====================
// All pixel loops operate in CSS-pixel space (w × h) which matches the
// logical canvas dimensions returned by setupCanvas. imgData is created
// at the physical (devicePixelRatio-scaled) canvas resolution but we
// index using logical coords scaled by dpr for correct centring.

function drawFringePattern(inp, model, colour) {
  const canvas = $("fringeCanvas");
  // We need both the physical canvas size (for ImageData) and the logical
  // CSS-pixel size (for geometry maths). setupCanvas already scaled the ctx.
  const dpr  = devicePixelRatio || 1;
  const rect  = canvas.getBoundingClientRect();
  const W = rect.width,  H = rect.height;   // logical CSS pixels
  const PW = Math.round(W * dpr), PH = Math.round(H * dpr); // physical pixels

  // Re-apply dimensions (setupCanvas may not have been called yet for this frame)
  canvas.width  = PW;
  canvas.height = PH;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const gamma = model.gamma;
  const tilt  = inp.tiltAngle; // mrad

  if (currentInstrument === "fabryPerot") {
    drawHaidingerFringes(ctx, W, H, PW, PH, dpr, model, colour, gamma);
  } else if (tilt > 0.01) {
    drawStraightFringes(ctx, W, H, PW, PH, dpr, model, colour, gamma, tilt, inp.wavelength);
  } else {
    drawCircularFringes(ctx, W, H, PW, PH, dpr, model, colour, gamma);
  }
}

// ---- Shared ImageData helper ----
// Returns an ImageData allocated at the physical pixel size, plus a setter
// function that accepts logical (x,y) and intensity [0,1].
function makeImgData(ctx, PW, PH, dpr, sr, sg, sb, bg = 0) {
  const imgData = ctx.createImageData(PW, PH);
  const data    = imgData.data;
  // Fill background (dark)
  for (let i = 0; i < PW * PH * 4; i += 4) {
    data[i] = bg; data[i+1] = bg; data[i+2] = bg; data[i+3] = 255;
  }
  const set = (lx, ly, I) => {
    const px = Math.round(lx * dpr), py = Math.round(ly * dpr);
    if (px < 0 || py < 0 || px >= PW || py >= PH) return;
    const idx = (py * PW + px) * 4;
    data[idx]   = sr * I;
    data[idx+1] = sg * I;
    data[idx+2] = sb * I;
    data[idx+3] = 255;
  };
  return { imgData, data, set };
}

// ---- Circular / bull's-eye fringes (Michelson / MZI / Sagnac at tilt=0) ----
// Physical model: equal-inclination fringes formed by a slightly diverging beam.
// The fringe order at radius r is m(r) = m₀ + r²·k where k controls ring density.
// We map the current fringe order m₀ = OPD/λ to set the central bright/dark state.
function drawCircularFringes(ctx, W, H, PW, PH, dpr, model, colour, gamma) {
  const cx = W / 2, cy = H / 2;
  const maxR = Math.min(W, H) * 0.46;
  const [sr, sg, sb] = parseColour(colour);
  const { imgData, data } = makeImgData(ctx, PW, PH, dpr, sr, sg, sb);

  // Number of visible rings = how many complete fringe orders span the aperture.
  // We fix ~5 rings across the aperture for a clean display regardless of OPD.
  const ringsAcross = 5;
  // At pixel r the extra OPD (in units of λ) relative to centre is r²·k
  // We want ringsAcross complete cycles when r = maxR:
  // ringsAcross = maxR² · k  →  k = ringsAcross / maxR²
  const k = ringsAcross / (maxR * maxR);

  // Central fringe order from physics (fractional part drives centre colour)
  const m0 = model.fringeOrder; // = OPD / lambda (can be large)

  for (let py = 0; py < PH; py++) {
    const ly = py / dpr;
    const dy = ly - cy;
    for (let px = 0; px < PW; px++) {
      const lx = px / dpr;
      const r2 = (lx - cx) * (lx - cx) + dy * dy;
      const r  = Math.sqrt(r2);
      if (r > maxR) continue;

      // Phase: central phase from model plus radial term (r² gives circular rings)
      const phase = model.phase + TAU * k * r2;
      const I = 0.5 * (1 + gamma * Math.cos(phase));
      const idx = (py * PW + px) * 4;
      data[idx]   = sr * I;
      data[idx+1] = sg * I;
      data[idx+2] = sb * I;
      data[idx+3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Circular aperture border
  ctx.beginPath();
  ctx.arc(cx, cy, maxR, 0, TAU);
  ctx.strokeStyle = "#2a4a6a";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Label: show fringe order at centre
  const mFrac = ((m0 % 1) + 1) % 1;
  const centreBright = mFrac < 0.1 || mFrac > 0.9;
  fringeLegend(ctx, W, H,
    `Equal-inclination fringes · centre ${centreBright ? "bright" : "dark"} · m₀ = ${m0.toFixed(2)}`);
}

// ---- Straight fringes from mirror tilt / wedge ----
// Λ = λ / (2θ) where θ is the tilt in radians.
// We always show exactly ~7 fringe periods across the canvas width regardless
// of the physical Λ, but annotate the true physical spacing.
function drawStraightFringes(ctx, W, H, PW, PH, dpr, model, colour, gamma, tiltMrad, lambda) {
  const [sr, sg, sb] = parseColour(colour);
  const { imgData, data } = makeImgData(ctx, PW, PH, dpr, sr, sg, sb);

  // Physical fringe spacing (nm) from tilt
  const thetaRad = tiltMrad * 1e-3;
  const Lambda_nm = lambda / (2 * thetaRad);   // true physical spacing in nm

  // Display: force 7 fringes visible across width W so the pattern is always readable
  const Lx_px = W / 7;   // logical pixels per fringe period

  for (let py = 0; py < PH; py++) {
    for (let px = 0; px < PW; px++) {
      const lx = px / dpr;
      // Phase: model.phase at lx=0 then advances linearly across canvas
      const phase = model.phase + TAU * (lx / Lx_px);
      const I = 0.5 * (1 + gamma * Math.cos(phase));
      const idx = (py * PW + px) * 4;
      data[idx]   = sr * I;
      data[idx+1] = sg * I;
      data[idx+2] = sb * I;
      data[idx+3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Annotate physical spacing
  const Λ_disp = Lambda_nm < 1e7
    ? `Λ = ${Lambda_nm >= 1000 ? (Lambda_nm/1000).toFixed(2)+"µm" : Lambda_nm.toFixed(0)+"nm"}`
    : "Λ = ∞";
  fringeLegend(ctx, W, H, `Straight fringes (tilt θ=${tiltMrad.toFixed(2)}mrad) · ${Λ_disp}`);
}

// ---- Haidinger rings (Fabry–Pérot equal-inclination) ----
// T(r) = Airy function at angle θ(r).  At r=0 the beam is normal (θ=0),
// so the on-axis phase is exactly model.phase (= 2π·2nL/λ + φ₀).
// Moving to larger r increases the effective cavity round-trip: φ(r) = φ₀·cos θ(r).
// We model cos θ(r) ≈ 1 − (r/maxR)²·(1 − cos_edge) where cos_edge ≈ cos(15°)≈0.97.
function drawHaidingerFringes(ctx, W, H, PW, PH, dpr, model, colour, gamma) {
  const cx = W / 2, cy = H / 2;
  const maxR = Math.min(W, H) * 0.46;
  const [sr, sg, sb] = parseColour(colour);
  const { imgData, data } = makeImgData(ctx, PW, PH, dpr, sr, sg, sb);
  const F = model.F !== undefined ? model.F : 1;

  // Edge incidence angle maps to cosTheta_edge (we use 20° ≈ 0.940)
  const cosEdge = 0.940;

  for (let py = 0; py < PH; py++) {
    const ly = py / dpr;
    for (let px = 0; px < PW; px++) {
      const lx = px / dpr;
      const r2 = (lx - cx) * (lx - cx) + (ly - cy) * (ly - cy);
      const r  = Math.sqrt(r2);
      if (r > maxR) continue;

      // Smooth cosTheta from 1 at centre to cosEdge at aperture edge
      const cosTheta = 1 - (r / maxR) * (r / maxR) * (1 - cosEdge);
      // Round-trip phase at this angle
      const phase = model.phase * cosTheta;
      const T = (1 / (1 + F * Math.sin(phase / 2) ** 2));
      const I = T * gamma + 0.5 * (1 - gamma);  // coherence envelope

      const idx = (py * PW + px) * 4;
      data[idx]   = sr * I;
      data[idx+1] = sg * I;
      data[idx+2] = sb * I;
      data[idx+3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  ctx.beginPath();
  ctx.arc(cx, cy, maxR, 0, TAU);
  ctx.strokeStyle = "#2a4a6a";
  ctx.lineWidth = 1;
  ctx.stroke();

  const finStr = model.finesse ? model.finesse.toFixed(1) : "—";
  const Rstr   = (model.R * 100).toFixed(1);
  fringeLegend(ctx, W, H, `Haidinger rings · ℱ = ${finStr} · R = ${Rstr}%`);
}

function fringeLegend(ctx, W, H, text) {
  ctx.fillStyle = "rgba(6,14,26,0.82)";
  ctx.fillRect(0, H - 20, W, 20);
  ctx.fillStyle = "#7da4c0";
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, W / 2, H - 6);
}

function parseColour(css) {
  const m = css.match(/rgb\((\d+),(\d+),(\d+)\)/);
  return m ? [+m[1], +m[2], +m[3]] : [0, 200, 255];
}

// ==================== Intensity vs OPD Plot ====================

function drawPlot(inp, model, colour) {
  const [ctx, w, h] = setupCanvas($("plot"));
  const box = { l: 46, r: 12, t: 12, b: 30 };
  const pw = w - box.l - box.r;
  const ph = h - box.t - box.b;

  ctx.fillStyle = "#060e1a"; ctx.fillRect(0,0,w,h);

  // Axes
  ctx.strokeStyle = "#1f3d5c"; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(box.l, box.t); ctx.lineTo(box.l, box.t + ph);
  ctx.lineTo(box.l + pw, box.t + ph); ctx.stroke();

  // Grid
  ctx.strokeStyle = "#0e2236"; ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const y = box.t + (i / 4) * ph;
    ctx.beginPath(); ctx.moveTo(box.l, y); ctx.lineTo(box.l + pw, y); ctx.stroke();
  }
  for (let i = 0; i <= 8; i++) {
    const x = box.l + (i / 8) * pw;
    ctx.beginPath(); ctx.moveTo(x, box.t); ctx.lineTo(x, box.t + ph); ctx.stroke();
  }

  // Lambda tick marks
  ctx.strokeStyle = "#f5c54240"; ctx.lineWidth = 0.8;
  for (let i = -4; i <= 4; i++) {
    const t = 0.5 + (i / 8);
    const x = box.l + t * pw;
    ctx.beginPath(); ctx.moveTo(x, box.t + ph); ctx.lineTo(x, box.t + ph + 5); ctx.stroke();
  }

  const N = 320;
  const gamma = inp.coherence / 100;
  const phaseOffset = inp.phaseOffset * Math.PI / 180;

  if (currentInstrument === "fabryPerot") {
    const R = inp.reflectivity / 100;
    const F = (4 * R) / (1 - R) ** 2;

    // Plot Airy function in orange
    ctx.strokeStyle = "#f5834a"; ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const opdVal = model.opd + (-4 * model.lambda + t * 8 * model.lambda);
      const phase = TAU * (opdVal / model.lambda) + phaseOffset;
      const raw = 1 / (1 + F * Math.sin(phase / 2) ** 2);
      const I = raw * gamma + 0.5 * (1 - gamma);
      const x = box.l + t * pw;
      const y = box.t + ph * (1 - I);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  } else {
    // Standard cosine fringe curve
    ctx.strokeStyle = colour; ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const opdVal = model.opd + (-4 * model.lambda + t * 8 * model.lambda);
      const phase = TAU * (opdVal / model.lambda) + phaseOffset;
      const I = 0.5 * (1 + gamma * Math.cos(phase));
      const x = box.l + t * pw;
      const y = box.t + ph * (1 - I);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Current-position marker (always at center)
  const cx = box.l + 0.5 * pw;
  const cy = box.t + ph * (1 - model.intensity);
  ctx.fillStyle = "#3dd6f5";
  ctx.beginPath(); ctx.arc(cx, cy, 4.5, 0, TAU); ctx.fill();
  ctx.strokeStyle = "#3dd6f5"; ctx.lineWidth = 0.7; ctx.setLineDash([2,3]);
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, box.t + ph); ctx.stroke();
  ctx.setLineDash([]);

  // Axis labels
  ctx.fillStyle = "#7da4c0"; ctx.font = "10px monospace"; ctx.textAlign = "center";
  ctx.fillText(`OPD (${unitSymbol()})`, w / 2, h - 4);
  ctx.save();
  ctx.translate(12, h / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText("I / I₀", 0, 0);
  ctx.restore();
  ctx.textAlign = "left";
  ctx.fillText("−4λ", box.l + 2, box.t + ph + 18);
  ctx.textAlign = "center";
  ctx.fillText("0", box.l + pw / 2, box.t + ph + 18);
  ctx.textAlign = "right";
  ctx.fillText("+4λ", box.l + pw, box.t + ph + 18);

  // Y-axis ticks 0, 0.5, 1
  ctx.textAlign = "right";
  [[0,"0"],[0.5,"0.5"],[1,"1"]].forEach(([v, label]) => {
    const y = box.t + ph * (1 - v);
    ctx.fillText(label, box.l - 3, y + 3);
    ctx.strokeStyle = "#1f3d5c"; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(box.l - 3, y); ctx.lineTo(box.l, y); ctx.stroke();
  });
}

// ==================== Render ====================

function render() {
  const inp = readInputs();
  const cfg = INSTRUMENTS[currentInstrument];
  const model = cfg.model(inp);
  const colour = spectrumColour(inp.wavelength);

  // Wavelength output
  $("wavelengthOut").textContent = `${inp.wavelength.toFixed(1)} nm`;
  $("coherenceOut").textContent = `${inp.coherence.toFixed(1)}%`;
  $("armAOut").textContent = displayLength(inp.armA);
  $("armBOut").textContent = displayLength(inp.armB);
  $("phaseOffsetOut").textContent = `${inp.phaseOffset.toFixed(1)}°`;
  $("refractiveIndexOut").textContent = `n = ${inp.n.toFixed(4)}`;
  $("reflectivityOut").textContent = `${inp.reflectivity.toFixed(1)}%`;
  $("rotationRateOut").textContent = `${inp.rotationRate.toFixed(1)}°/s`;
  $("tiltAngleOut").textContent = `${inp.tiltAngle.toFixed(2)} mrad`;

  // OPD display
  $("opdHeading").textContent = cfg.opdHeading;
  $("opdDisplay").textContent = displayLength(model.opd);
  $("opdDefinition").innerHTML = cfg.opdDef;

  // Coherence bar
  const fill = $("coherenceFill");
  fill.style.width = inp.coherence + "%";

  // Header badge
  $("sourcePresetBadge").textContent = SOURCE_PRESETS[sourcePreset.value]?.label || `${inp.wavelength.toFixed(1)} nm`;

  // Intensity
  $("intensity").textContent = model.intensity.toFixed(4);
  $("intensityMin").textContent = (0.5 * (1 - model.gamma)).toFixed(4);
  $("intensityMax").textContent = (0.5 * (1 + model.gamma)).toFixed(4);
  $("contrast").textContent = `${(model.visibility * 100).toFixed(1)}%`;

  // Interference state
  const phi = ((model.phase % TAU) + TAU) % TAU;
  let state;
  if (phi < 0.25 || phi > TAU - 0.25)         state = "◉ Constructive — bright fringe";
  else if (Math.abs(phi - Math.PI) < 0.25)     state = "◎ Destructive — dark fringe";
  else if (phi < Math.PI)                      state = "◑ Partial — rising";
  else                                         state = "◐ Partial — falling";
  $("interferenceState").textContent = state;

  // Derived quantities
  $("phaseDiff").textContent = formatPhase(model.phase);
  $("intensityFormula").innerHTML = `${model.intensity.toFixed(4)} = ½[1 + ${model.gamma.toFixed(3)}·cos(${(model.phase/Math.PI).toFixed(3)}π)]`;
  $("fringeOrder").textContent = `m = ${model.fringeOrder.toFixed(3)}  (fractional: ${(model.fringeOrder % 1).toFixed(4)})`;
  $("visibility").textContent = `V = ${(model.visibility * 100).toFixed(2)}%`;

  // Coherence length: ℓ_c ≈ λ² / Δλ; model as ℓ_c = λ / (1 - γ + 1e-9) for UI feedback
  const gamma = inp.coherence / 100;
  const lc_nm = gamma > 0.999 ? Infinity : inp.wavelength * gamma / (1 - gamma);
  $("coherenceLength").textContent = lc_nm === Infinity ? "∞ (ideal laser)" : `${fmtSci(lc_nm)} nm`;

  // Spectrum colour
  $("spectrumColor").style.backgroundColor = colour;
  $("spectrumLabel").textContent = `${spectrumName(inp.wavelength)} (${inp.wavelength.toFixed(1)} nm)`;

  // FP-specific
  if (currentInstrument === "fabryPerot" && model.finesse !== undefined) {
    $("finesses").textContent = `ℱ = ${model.finesse.toFixed(2)}`;
    $("fsr").textContent = `${model.fsr.toFixed(4)} nm  (${(model.fsr * 1e-3 / inp.wavelength * 3e8).toExponential(3)} Hz approx)`;
  }
  // Sagnac-specific
  if (currentInstrument === "sagnac" && model.sagnacPhase !== undefined) {
    $("sagnacPhase").textContent = `${formatPhase(model.sagnacPhase)}`;
  }

  // Physical model HTML
  $("modelDescription").innerHTML = cfg.modelHTML(inp);

  // Drawings
  drawDiagram(inp, model, colour);
  drawFringePattern(inp, model, colour);
  drawPlot(inp, model, colour);
}

// ==================== Buttons ====================

$("reset").addEventListener("click", () => {
  controls.wavelength.value      = DEFAULTS.wavelength;
  controls.wavelengthInput.value = DEFAULTS.wavelength;
  const scaleInv = 1 / unitScale[activeLengthUnit];
  controls.armA.value       = DEFAULTS.armA * scaleInv;
  controls.armAInput.value  = DEFAULTS.armA * scaleInv;
  controls.armB.value       = DEFAULTS.armB * scaleInv;
  controls.armBInput.value  = DEFAULTS.armB * scaleInv;
  controls.phaseOffset.value      = DEFAULTS.phaseOffset;
  controls.phaseOffsetInput.value = DEFAULTS.phaseOffset;
  controls.coherence.value      = DEFAULTS.coherence;
  controls.coherenceInput.value = DEFAULTS.coherence;
  controls.refractiveIndex.value      = DEFAULTS.refractiveIndex;
  controls.refractiveIndexInput.value = DEFAULTS.refractiveIndex;
  controls.reflectivity.value      = DEFAULTS.reflectivity;
  controls.reflectivityInput.value = DEFAULTS.reflectivity;
  controls.rotationRate.value      = DEFAULTS.rotationRate;
  controls.rotationRateInput.value = DEFAULTS.rotationRate;
  controls.tiltAngle.value      = DEFAULTS.tiltAngle;
  controls.tiltAngleInput.value = DEFAULTS.tiltAngle;
  sourcePreset.value = "hene";
  $("sourcePresetBadge").textContent = SOURCE_PRESETS.hene.label;
  render();
});

function shiftArmB(multiplier) {
  const wavelengthNm = Number(controls.wavelength.value);
  const deltaDisplay = (wavelengthNm * multiplier) / unitScale[activeLengthUnit];
  const current = Number(controls.armB.value);
  const next = current + deltaDisplay;
  const max = Number(controls.armB.max);
  if (next <= max && next >= 0) {
    controls.armB.value      = next;
    controls.armBInput.value = next.toFixed(6);
    render();
  }
}

$("quarterWave").addEventListener("click", () => shiftArmB(0.25));
$("halfWave").addEventListener("click",    () => shiftArmB(0.5));

// ==================== Startup ====================

updateInstrumentUI();
render();
