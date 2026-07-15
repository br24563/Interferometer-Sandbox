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
    desc: "A ring interferometer where two counter-propagating beams travel the same geometric path. When the platform rotates at Ω, they accumulate a non-reciprocal phase difference φ_S = 8πAΩ/(λc) — the Sagnac effect. Used in ring laser gyroscopes and fibre-optic gyros (FOGs).",
    opdDef: "Δ = 4·N·A·Ω / c",
    opdHeading: "Sagnac OPD:",
    armALabel: "Ring radius (r)",
    armBLabel: "— (not used)",
    armAHint: "Physical radius of each fiber loop or mirror polygon. Area A = πr². A larger area amplifies the Sagnac shift per unit of rotation.",
    armBHint: "",
    armGroup: "Ring / Fibre Geometry",
    fringeMode: "Phase vs Ω",
    showRefractive: false,
    refractiveNote: "",
    showArmB: false,
    showRotation: true,
    showReflectivity: false,
    quarterWaveText: "Ω → +λ/4 phase",
    model: (inp) => {
      const lambda = inp.wavelength; // nm
      const c = 3e17;               // nm/s
      // r in nm from arm slider; convert to nm then compute area in nm²
      const r_nm  = inp.armA;         // nm
      const N     = inp.fiberTurns;   // number of loops (integer-ish)
      const A_nm2 = Math.PI * r_nm * r_nm;
      const omega_rad_s = inp.rotationRate * (Math.PI / 180);
      // Sagnac OPD (nm): 4·N·A·Ω / c
      const opd = (4 * N * A_nm2 * omega_rad_s) / c;
      const offset = inp.phaseOffset * Math.PI / 180;
      const phase = TAU * (opd / lambda) + offset;
      const gamma = inp.coherence / 100;
      const intensity = 0.5 * (1 + gamma * Math.cos(phase));
      // Sensitivity: dφ/dΩ  (rad per deg/s)  — useful gyro figure of merit
      const dPhidOmega_per_degs = (TAU / lambda) * (4 * N * A_nm2 / c) * (Math.PI / 180);
      // Scale factor: OPD per °/s in nm
      const scaleFactor_nm_per_degs = (4 * N * A_nm2 / c) * (Math.PI / 180);
      // Area in m² for display
      const A_m2 = A_nm2 * 1e-18;
      return {
        lambda, opd, phase, gamma, intensity, fringeOrder: opd / lambda,
        visibility: gamma,
        sagnacPhase:   phase - offset,
        omega_rad_s,   A_nm2, A_m2, N,
        dPhidOmega:    dPhidOmega_per_degs,
        scaleFactor:   scaleFactor_nm_per_degs,
      };
    },
    modelHTML: (inp) => {
      const r_nm  = inp.armA;
      const N     = inp.fiberTurns;
      const A_m2  = Math.PI * (r_nm * 1e-9) * (r_nm * 1e-9);
      const c     = 3e8; // m/s for display
      const omega = inp.rotationRate * (Math.PI / 180);
      const sf    = (4 * N * A_m2 * (Math.PI/180)) / (inp.wavelength * 1e-9 * c);
      return `
      <p>Fibre-optic Sagnac gyroscope — non-reciprocal phase:</p>
      <p class="equation">φ_S = 8π·N·A·Ω / (λ·c)</p>
      <p>Where:</p>
      <ul>
        <li><strong>N = ${N.toFixed(0)} turns</strong> — fibre coil winding count</li>
        <li><strong>A = πr²</strong> = ${A_m2.toExponential(3)} m² — single-loop area</li>
        <li><strong>Ω = ${inp.rotationRate.toFixed(2)}°/s</strong> = ${omega.toExponential(3)} rad/s</li>
        <li><strong>λ = ${inp.wavelength.toFixed(1)} nm</strong> — source wavelength</li>
        <li><strong>Scale factor</strong> = ${sf.toFixed(4)} rad/(°/s)</li>
      </ul>
      <p class="fine-print">Earth rotation rate ≈ 15°/hr = 0.00417°/s. FOGs can resolve < 0.001°/hr. Sensitivity scales linearly with N and A.</p>
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
  armA: 50000,       // 50 µm default for most instruments
  armB: 50000.5,
  phaseOffset: 0,
  coherence: 100,
  refractiveIndex: 1.0,
  reflectivity: 90,
  rotationRate: 0,
  tiltAngle: 0,
  fiberTurns: 100,   // Sagnac: fibre coil winding count
};

// Per-instrument arm defaults (in nm) — applied on tab switch
const ARM_DEFAULTS = {
  michelson:   { armA: 50000,    armB: 50000.5 },
  machZehnder: { armA: 50000,    armB: 50000.5 },
  fabryPerot:  { armA: 50000,    armB: 50000   },
  sagnac:      { armA: 5e7,      armB: 5e7     }, // 5 cm radius
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
  fiberTurns:             $("fiberTurns"),
  fiberTurnsInput:        $("fiberTurnsInput"),
  fringeAperture:         $("fringeAperture"),
  fringeApertureInput:    $("fringeApertureInput"),
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
    // Apply per-instrument arm defaults when switching tabs
    applyArmDefaults(currentInstrument);
    updateInstrumentUI();
    render();
  });
});

function applyArmDefaults(instr) {
  const d = ARM_DEFAULTS[instr];
  if (!d) return;
  const scale = unitScale[activeLengthUnit];
  controls.armA.value      = d.armA / scale;
  controls.armAInput.value = (d.armA / scale).toFixed(3);
  controls.armB.value      = d.armB / scale;
  controls.armBInput.value = (d.armB / scale).toFixed(3);
}

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
  // Tilt hidden for Fabry-Pérot (angular FOV used instead) and Sagnac (not applicable)
  const hideTilt = currentInstrument === "fabryPerot" || currentInstrument === "sagnac";
  $("tiltControl").style.display = hideTilt ? "none" : "";
  // Fringe aperture: hide for Sagnac (sweep uses Ω axis, not spatial FOV)
  $("fringeApertureControl").style.display = currentInstrument === "sagnac" ? "none" : "";
  // Update aperture label/unit for FP (angular) vs spatial (others)
  if (currentInstrument === "fabryPerot") {
    $("fringeApertureLabel").textContent = "Angular half-angle view";
    $("fringeApertureUnit").textContent = "mrad";
    $("fringeApertureHint").textContent = "Half-angle of the angular field shown in the Haidinger ring pattern. Larger value = more rings across the aperture.";
  } else {
    $("fringeApertureLabel").textContent = "Fringe view aperture";
    $("fringeApertureUnit").textContent = "mm";
    $("fringeApertureHint").textContent = "Physical diameter of the observed detector field (mm). Larger = wider spatial view, may resolve fewer/more fringes depending on OPD.";
  }

  $("fpRow").style.display        = currentInstrument === "fabryPerot" ? "" : "none";
  $("fsrRow").style.display       = currentInstrument === "fabryPerot" ? "" : "none";
  $("airyLegend").style.display   = currentInstrument === "fabryPerot" ? "" : "none";
  $("sagnacRow").style.display    = currentInstrument === "sagnac" ? "" : "none";
  $("sagnacSFRow").style.display  = currentInstrument === "sagnac" ? "" : "none";
  $("fringeOrderRow").style.display = currentInstrument === "sagnac" ? "none" : "";
  $("fiberTurnsControl").style.display = currentInstrument === "sagnac" ? "" : "none";

  // Update plot/fringe card titles
  $("plotTitle").textContent = currentInstrument === "sagnac"
    ? "Phase Shift vs Rotation Rate"
    : "Intensity vs OPD";
  $("fringeTitle").textContent = currentInstrument === "sagnac"
    ? "Rotation Sweep"
    : "Fringe Pattern";

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
  ["fiberTurns",       "fiberTurnsInput"],
  ["fringeAperture",   "fringeApertureInput"],
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
    fiberTurns:    Math.max(1, Number(controls.fiberTurns.value)),
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
//
// PHYSICAL SCALE MODEL
// --------------------
// The fringe canvas represents a physical aperture defined by FRINGE_FOV_MM
// (the detector / beam diameter in mm). This establishes a fixed pixel-per-nm
// ratio so all fringe spacings are rendered at their true physical sizes.
//
//   px_per_nm = (canvas width in px) / (FOV in nm)
//   FOV in nm = FRINGE_FOV_MM * 1e6
//
// Every fringe type derives its pixel pitch directly from the physics:
//
//  Circular (equal-inclination):
//    Ring j has half-angle θ_j where cos θ_j = 1 − j·λ/(2nL)  →  θ_j ≈ √(j·λ/OPD)
//    Radial position of ring j (for small angles):  r_j = f·θ_j
//    where f = effective focal length of the observing lens.
//    We set f so that θ_max (half-angle at aperture edge) equals
//    half the FOV divided by f  →  f = (FOV/2) / θ_max.
//    θ_max chosen as √(RING_ORDERS_SHOWN · λ / |OPD|) to display ~RING_ORDERS_SHOWN rings.
//
//  Straight (tilt wedge):
//    Fringe spacing Λ = λ / (2θ_tilt)  [nm physical].
//    Rendered at true scale: fringe_px = Λ * px_per_nm.
//    If fringe_px < 2 (sub-pixel) or > W (zero fringes visible), a notice is shown.
//
//  Haidinger (Fabry–Pérot):
//    Ring j half-angle θ_j ≈ √(j · FSR_λ / λ · 2) (for small angles near normal).
//    Exact: cos θ_j = 1 − j·λ/(2nL) (same as equal-inclination).
//    Pixel scale identical to circular case.

// Number of ring orders to display in circular/Haidinger mode.
// Larger = more rings, smaller spacing. Calibrated for 50 µm OPD at 633 nm ≈ 79 orders.
const RING_ORDERS_SHOWN = 8;

function drawFringePattern(inp, model, colour) {
  const canvas = $("fringeCanvas");
  const dpr   = devicePixelRatio || 1;
  const rect   = canvas.getBoundingClientRect();
  const W = rect.width,  H = rect.height;
  const PW = Math.round(W * dpr), PH = Math.round(H * dpr);

  canvas.width  = PW;
  canvas.height = PH;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  // Sagnac: show rotation-sweep fringe (I vs Ω image)
  if (currentInstrument === "sagnac") {
    drawSagnacSweep(ctx, W, H, PW, PH, dpr, model, colour, inp);
    return;
  }

  // ------ Physical field-of-view ------
  // Read FOV from the HTML control (mm). Default 10 mm.
  const fov_mm  = Math.max(0.01, Number($("fringeAperture")?.value ?? 10));
  const fov_nm  = fov_mm * 1e6;          // nm
  const px_per_nm = W / fov_nm;          // logical px per nm

  const gamma = model.gamma;
  const tilt  = inp.tiltAngle;           // mrad

  if (currentInstrument === "fabryPerot") {
    drawHaidingerFringes(ctx, W, H, PW, PH, dpr, model, colour, gamma,
                         inp, px_per_nm, fov_mm);
  } else if (tilt > 0.01) {
    drawStraightFringes(ctx, W, H, PW, PH, dpr, model, colour, gamma,
                        tilt, inp.wavelength, px_per_nm, fov_mm);
  } else {
    drawCircularFringes(ctx, W, H, PW, PH, dpr, model, colour, gamma,
                        inp, px_per_nm, fov_mm);
  }
}

// ==================== Sagnac rotation-sweep fringe ====================
// Renders I(Ω) = ½[1 + γ cos(SF·Ω + φ₀)] as a horizontal stripe image,
// with the current Ω position marked by a vertical line and the Earth
// rate (Ω⊕ = 15°/hr) annotated. The x-axis spans ±2π/SF in Ω.
function drawSagnacSweep(ctx, W, H, PW, PH, dpr, model, colour, inp) {
  const RULER_H = 28;
  const imageH  = H - RULER_H;

  const [sr, sg, sb] = parseColour(colour);
  const { imgData, data } = makeImgData(ctx, PW, PH);

  const gamma  = model.gamma;
  const SF     = model.dPhidOmega;       // rad / (°/s)
  const phOff  = inp.phaseOffset * Math.PI / 180;

  // Span the x-axis over ±2 full fringe periods in Ω
  const omegaHalf = SF !== 0 ? 2 * Math.PI / Math.abs(SF) : 1000;
  const omega_min = -omegaHalf;
  const omega_max =  omegaHalf;
  const omegaSpan = omega_max - omega_min;

  const PH_img = Math.round(imageH * dpr);

  // Vertical gradient: intensity varies only along x (Ω axis)
  for (let px2 = 0; px2 < PW; px2++) {
    const omega = omega_min + (px2 / PW) * omegaSpan;
    const phi   = SF * omega + phOff;
    const I     = 0.5 * (1 + gamma * Math.cos(phi));
    const r = Math.round(sr * I);
    const g = Math.round(sg * I);
    const b = Math.round(sb * I);
    for (let py = 0; py < PH_img; py++) {
      const idx = (py * PW + px2) * 4;
      data[idx] = r; data[idx+1] = g; data[idx+2] = b;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Current Ω vertical marker
  const currentOmega = inp.rotationRate;
  if (currentOmega >= omega_min && currentOmega <= omega_max) {
    const xCur = ((currentOmega - omega_min) / omegaSpan) * W;
    ctx.save();
    ctx.strokeStyle = "#3dd6f5"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(xCur, 0); ctx.lineTo(xCur, imageH); ctx.stroke();
    // Small triangle marker at top
    ctx.fillStyle = "#3dd6f5";
    ctx.beginPath();
    ctx.moveTo(xCur, 4);
    ctx.lineTo(xCur - 5, 14);
    ctx.lineTo(xCur + 5, 14);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // Earth rate marker: 15°/hr = 4.167e-3 °/s
  const earthOmega = 15 / 3600;
  if (earthOmega >= omega_min && earthOmega <= omega_max) {
    const xEarth = ((earthOmega - omega_min) / omegaSpan) * W;
    ctx.save();
    ctx.strokeStyle = "#f5c542"; ctx.lineWidth = 0.8;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(xEarth, 0); ctx.lineTo(xEarth, imageH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#f5c542"; ctx.font = "bold 8px monospace"; ctx.textAlign = "left";
    ctx.fillText("Ω⊕", xEarth + 2, 14);
    ctx.restore();
  }

  // Ruler (Ω axis)
  {
    const rulerY = imageH;
    ctx.fillStyle = "rgba(6,14,26,0.9)";
    ctx.fillRect(0, rulerY, W, RULER_H);

    // Nice tick step
    const TICKS = 6;
    const rawStep = omegaSpan / TICKS;
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    let step = mag;
    for (const m of [1, 2, 5, 10]) {
      if (omegaSpan / (m * mag) <= TICKS + 1) { step = m * mag; break; }
    }

    ctx.strokeStyle = "#3dd6f5"; ctx.lineWidth = 0.8;
    ctx.fillStyle   = "#7da4c0"; ctx.font = "9px monospace";

    const firstTick = Math.ceil(omega_min / step) * step;
    for (let omega = firstTick; omega <= omega_max + step * 0.01; omega += step) {
      const xp = ((omega - omega_min) / omegaSpan) * W;
      ctx.beginPath(); ctx.moveTo(xp, rulerY); ctx.lineTo(xp, rulerY + 5); ctx.stroke();
      const lbl = Math.abs(omega) < 0.001 ? omega.toExponential(1)
                : Math.abs(omega) < 1     ? omega.toFixed(4)
                : omega.toFixed(2);
      ctx.textAlign = "center"; ctx.fillText(lbl, xp, H - 5);
    }
    ctx.fillStyle = "#3dd6f5"; ctx.font = "bold 9px monospace";
    ctx.textAlign = "left"; ctx.fillText("Ω (°/s)", 3, H - 5);
  }

  // Legend text
  const sfStr = Math.abs(SF) < 1e-3 ? SF.toExponential(3) : SF.toFixed(4);
  fringeLegend(ctx, W, H, `SF = ${sfStr} rad/(°/s) · N=${inp.fiberTurns.toFixed(0)}`, RULER_H);
}

// ==================== Shared helpers ====================

// Allocate a physical-pixel ImageData, pre-fill with dark background.
function makeImgData(ctx, PW, PH) {
  const imgData = ctx.createImageData(PW, PH);
  const data    = imgData.data;
  for (let i = 0; i < data.length; i += 4) { data[i+3] = 255; }
  return { imgData, data };
}

// Draw a horizontal ruler along the bottom of the fringe view.
// span_nm = total physical width of the canvas in nm.
// unit: auto-selects µm or mm.
function drawRuler(ctx, W, H, span_nm, rulerH = 22) {
  const RULER_Y = H - rulerH;

  // Semi-transparent ruler background
  ctx.fillStyle = "rgba(6,14,26,0.85)";
  ctx.fillRect(0, RULER_Y, W, rulerH);

  // Choose a "nice" tick interval
  const TICKS = 6;
  const rawStep_nm = span_nm / TICKS;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep_nm)));
  const niceMuls = [1, 2, 5, 10];
  let step_nm = mag;
  for (const m of niceMuls) {
    const s = m * mag;
    if (span_nm / s <= TICKS + 1) { step_nm = s; break; }
  }

  // Unit labelling
  let unitDiv, unitLabel;
  if (span_nm < 5000) {           // < 5 µm  → nm
    unitDiv = 1;        unitLabel = "nm";
  } else if (span_nm < 5e6) {    // < 5 mm  → µm
    unitDiv = 1e3;      unitLabel = "µm";
  } else {                        //          → mm
    unitDiv = 1e6;      unitLabel = "mm";
  }

  ctx.fillStyle = "#3dd6f5";
  ctx.font = "9px monospace";
  ctx.textAlign = "left";
  ctx.fillText(unitLabel, 3, H - 5);

  // Ticks
  ctx.strokeStyle = "#3dd6f5";
  ctx.fillStyle   = "#7da4c0";
  ctx.font = "9px monospace";

  const firstTick = Math.ceil(0 / step_nm) * step_nm;
  for (let x_nm = firstTick; x_nm <= span_nm; x_nm += step_nm) {
    const px = (x_nm / span_nm) * W;
    ctx.beginPath();
    ctx.lineWidth = 0.8;
    ctx.moveTo(px, RULER_Y);
    ctx.lineTo(px, RULER_Y + 5);
    ctx.stroke();
    const label = (x_nm / unitDiv).toPrecision(3).replace(/\.?0+$/, "");
    ctx.textAlign = "center";
    ctx.fillText(label, px, H - 5);
  }

  // Scale bar: one step_nm wide, labelled, in bottom-right corner
  const barW = (step_nm / span_nm) * W;
  const barX = W - barW - 8;
  const barY = RULER_Y + 10;
  ctx.strokeStyle = "#3dd6f5"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(barX, barY); ctx.lineTo(barX + barW, barY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(barX, barY - 3); ctx.lineTo(barX, barY + 3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(barX + barW, barY - 3); ctx.lineTo(barX + barW, barY + 3); ctx.stroke();
  const barLabel = `${(step_nm / unitDiv).toPrecision(3).replace(/\.?0+$/, "")} ${unitLabel}`;
  ctx.fillStyle = "#3dd6f5"; ctx.font = "bold 9px monospace"; ctx.textAlign = "center";
  ctx.fillText(barLabel, barX + barW / 2, barY - 5);
}

// Draw a colour-intensity legend (vertical gradient bar, right side) — optional.
function fringeLegend(ctx, W, H, text, rulerH = 22) {
  // Text overlaid on the ruler area (left side)
  ctx.fillStyle = "#e8f4ff";
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "left";
  ctx.fillText(text, 28, H - rulerH + 13);
}

function parseColour(css) {
  const m = css.match(/rgb\((\d+),(\d+),(\d+)\)/);
  return m ? [+m[1], +m[2], +m[3]] : [0, 200, 255];
}

// ==================== Circular fringes (equal-inclination) ====================
// Physical model: for a beam of divergence half-angle θ, the OPD at angle θ is
//   OPD(θ) = 2n·L·cos(θ)  →  OPD(0) − OPD(θ) ≈ n·L·θ²  (small angle)
// The j-th dark ring occurs at r_j = f·θ_j where θ_j = √(j·λ / OPD₀).
// We choose focal length f so that RING_ORDERS_SHOWN rings fit in the aperture.
function drawCircularFringes(ctx, W, H, PW, PH, dpr, model, colour, gamma,
                             inp, px_per_nm, fov_mm) {
  const RULER_H = 22;
  const imageH  = H - RULER_H;
  const cx = W / 2, cy = imageH / 2;
  const aperR_nm = fov_mm * 1e6 / 2;              // aperture radius in nm
  const aperR_px = aperR_nm * px_per_nm * 0.92;   // leave a thin border
  const maxR_px  = Math.min(aperR_px, Math.min(W, imageH) * 0.46);

  const [sr, sg, sb] = parseColour(colour);
  const { imgData, data } = makeImgData(ctx, PW, PH);

  // OPD₀: the on-axis optical path difference (nm). If zero → solid fill.
  const OPD0 = Math.abs(model.opd);

  if (OPD0 < 1e-6) {
    // Zero OPD: uniform intensity from phase offset alone
    const I = 0.5 * (1 + gamma * Math.cos(model.phase));
    const ib = Math.round(I * 255);
    for (let py = 0; py < Math.round(imageH * dpr); py++) {
      const ly = py / dpr - cy;
      for (let px2 = 0; px2 < PW; px2++) {
        const lx = px2 / dpr - cx;
        if (Math.sqrt(lx*lx + ly*ly) > maxR_px) continue;
        const idx = (py * PW + px2) * 4;
        data[idx] = sr * I; data[idx+1] = sg * I; data[idx+2] = sb * I;
      }
    }
  } else {
    // Focal length f so that ring RING_ORDERS_SHOWN lands at maxR_px:
    //   maxR_px = f_px · θ_max,   θ_max = sqrt(RING_ORDERS_SHOWN · λ / OPD0)
    const lambda = model.lambda;
    const theta_max = Math.sqrt(RING_ORDERS_SHOWN * lambda / OPD0);
    const f_px = maxR_px / theta_max;              // px per radian

    const PH_img = Math.round(imageH * dpr);
    for (let py = 0; py < PH_img; py++) {
      const ly = py / dpr - cy;
      for (let px2 = 0; px2 < PW; px2++) {
        const lx = px2 / dpr - cx;
        const r_px = Math.sqrt(lx * lx + ly * ly);
        if (r_px > maxR_px) continue;

        // Physical angle θ in radians
        const theta = r_px / f_px;
        // OPD(θ) = OPD0 · cos(θ) ≈ OPD0 · (1 − θ²/2) for small θ
        const opd_theta = OPD0 * (1 - theta * theta / 2);
        // Use sign of original OPD for correct phase direction
        const signed_opd = Math.sign(model.opd) * opd_theta;
        const phaseOffset = inp.phaseOffset * Math.PI / 180;
        const phase = TAU * (signed_opd / lambda) + phaseOffset;
        const I = 0.5 * (1 + gamma * Math.cos(phase));

        const idx = (py * PW + px2) * 4;
        data[idx] = sr * I; data[idx+1] = sg * I; data[idx+2] = sb * I;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Aperture circle border
  ctx.beginPath();
  ctx.arc(cx, cy, maxR_px, 0, TAU);
  ctx.strokeStyle = "#2a4a6a"; ctx.lineWidth = 1; ctx.stroke();

  // Centre crosshair
  ctx.strokeStyle = "rgba(61,214,245,0.25)"; ctx.lineWidth = 0.6;
  ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(cx - 12, cy); ctx.lineTo(cx + 12, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy + 12); ctx.stroke();
  ctx.setLineDash([]);

  // Physical ring spacing annotation
  const ringSpacing_nm = OPD0 < 1 ? null
    : model.lambda * model.lambda / (OPD0 * 2 * Math.PI);  // not exact but indicative
  // Exact: first ring radius = f_px · sqrt(λ/OPD0) in px → in nm: * (1/px_per_nm)
  const f_px2 = OPD0 < 1 ? null : maxR_px / Math.sqrt(RING_ORDERS_SHOWN * model.lambda / OPD0);
  const r1_px  = f_px2 ? f_px2 * Math.sqrt(model.lambda / OPD0) : null;
  const r1_nm  = r1_px ? r1_px / px_per_nm : null;
  const r1_str = r1_nm == null ? "—"
    : r1_nm < 1000 ? r1_nm.toFixed(1) + " nm"
    : r1_nm < 1e6  ? (r1_nm/1000).toFixed(3) + " µm"
    :                (r1_nm/1e6).toFixed(4)   + " mm";

  const mFrac = ((model.fringeOrder % 1) + 1) % 1;
  const centre = mFrac < 0.1 || mFrac > 0.9 ? "bright" : mFrac > 0.4 && mFrac < 0.6 ? "dark" : "partial";
  fringeLegend(ctx, W, H,
    `Equal-incl. · r₁ = ${r1_str} · centre ${centre}`, RULER_H);
  drawRuler(ctx, W, H, fov_mm * 1e6, RULER_H);
}

// ==================== Straight (wedge/tilt) fringes ====================
// Fringe spacing Λ = λ / (2·θ_tilt)  [nm physical].
// Rendered at true scale via px_per_nm; if too fine or too coarse a notice is shown.
function drawStraightFringes(ctx, W, H, PW, PH, dpr, model, colour, gamma,
                             tiltMrad, lambda, px_per_nm, fov_mm) {
  const RULER_H = 22;
  const imageH  = H - RULER_H;

  const [sr, sg, sb] = parseColour(colour);
  const { imgData, data } = makeImgData(ctx, PW, PH);

  // Physical fringe spacing
  const thetaRad  = tiltMrad * 1e-3;
  const Lambda_nm = lambda / (2 * thetaRad);  // nm
  const Lambda_px = Lambda_nm * px_per_nm;    // logical px per fringe

  const PH_img = Math.round(imageH * dpr);

  if (Lambda_px < 1.5) {
    // Fringes unresolvable at this FOV/tilt — show notice
    ctx.fillStyle = "#060e1a"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#7da4c0"; ctx.font = "11px monospace"; ctx.textAlign = "center";
    ctx.fillText("Fringes too fine to resolve", W/2, imageH/2 - 8);
    ctx.fillText("Reduce tilt or reduce FOV", W/2, imageH/2 + 8);
  } else {
    for (let py = 0; py < PH_img; py++) {
      for (let px2 = 0; px2 < PW; px2++) {
        // x_nm = physical position from left edge of canvas
        const x_nm = (px2 / dpr) * (fov_mm * 1e6 / W);
        // Phase advances by 2π per fringe period Λ_nm
        const phaseOffset = model.phase;
        const phase = phaseOffset + TAU * (x_nm / Lambda_nm);
        const I = 0.5 * (1 + gamma * Math.cos(phase));
        const idx = (py * PW + px2) * 4;
        data[idx] = sr * I; data[idx+1] = sg * I; data[idx+2] = sb * I;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Overlay fringe-spacing annotation: draw one fringe-width bracket
    if (Lambda_px >= 8 && Lambda_px <= W * 3) {
      const bracketY = imageH * 0.12;
      const x0 = W / 2 - Lambda_px / 2;
      const x1 = W / 2 + Lambda_px / 2;
      ctx.strokeStyle = "rgba(245,197,66,0.8)"; ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(x0, bracketY); ctx.lineTo(x1, bracketY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x0, bracketY-4); ctx.lineTo(x0, bracketY+4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1, bracketY-4); ctx.lineTo(x1, bracketY+4); ctx.stroke();
      const Λ_str = Lambda_nm < 1000 ? Lambda_nm.toFixed(1)+"nm"
                  : Lambda_nm < 1e6  ? (Lambda_nm/1000).toFixed(2)+"µm"
                  :                    (Lambda_nm/1e6).toFixed(3)+"mm";
      ctx.fillStyle = "#f5c542"; ctx.font = "bold 9px monospace"; ctx.textAlign = "center";
      ctx.fillText(`Λ = ${Λ_str}`, (x0+x1)/2, bracketY - 8);
    }
  }

  fringeLegend(ctx, W, H,
    `Tilt θ = ${tiltMrad.toFixed(2)} mrad · straight fringes`, RULER_H);
  drawRuler(ctx, W, H, fov_mm * 1e6, RULER_H);
}

// ==================== Haidinger rings (Fabry–Pérot) ====================
// The Fabry–Pérot equal-inclination pattern: transmission peaks at cos(θ) = mλ/(2nL).
// For a fixed order m₀ near normal incidence, the j-th ring from centre is at
//   cos(θ_j) = (m₀ − j)·λ/(2nL)  →  θ_j ≈ √(2j·λ/(2nL)) = √(j·FSR/λ·2) [small angle]
// The angular FOV shown is ±THETA_MAX_MRAD milliradians.
// Pixel scale: f_px = (maxR_px) / (THETA_MAX in rad).
function drawHaidingerFringes(ctx, W, H, PW, PH, dpr, model, colour, gamma,
                              inp, px_per_nm, fov_mm) {
  const RULER_H = 22;
  const imageH  = H - RULER_H;
  const cx = W / 2, cy = imageH / 2;

  const [sr, sg, sb] = parseColour(colour);
  const { imgData, data } = makeImgData(ctx, PW, PH);
  const F = model.F !== undefined ? model.F : 1;

  // For FP we use an angular FOV, not a spatial one.
  // The aperture control now repurposes as "half-angle view (mrad)".
  const halfAngle_mrad = Math.max(0.1, Number($("fringeAperture")?.value ?? 10));
  const halfAngle_rad  = halfAngle_mrad * 1e-3;
  const maxR_px = Math.min(W, imageH) * 0.46;
  const f_px = maxR_px / halfAngle_rad;   // px per radian

  const lambda  = model.lambda;           // nm
  const OPD0    = Math.abs(model.opd);    // nm = 2nL
  const phaseOffset = inp.phaseOffset * Math.PI / 180;

  const PH_img = Math.round(imageH * dpr);
  for (let py = 0; py < PH_img; py++) {
    const ly = py / dpr - cy;
    for (let px2 = 0; px2 < PW; px2++) {
      const lx = px2 / dpr - cx;
      const r_px = Math.sqrt(lx * lx + ly * ly);
      if (r_px > maxR_px) continue;

      const theta = r_px / f_px;                         // radians from optical axis
      const cosTheta = Math.cos(theta);
      const phase = TAU * (OPD0 * cosTheta / lambda) + phaseOffset;
      const T = 1 / (1 + F * Math.sin(phase / 2) ** 2);
      const I = T * gamma + 0.5 * (1 - gamma);

      const idx = (py * PW + px2) * 4;
      data[idx] = sr * I; data[idx+1] = sg * I; data[idx+2] = sb * I;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Aperture border
  ctx.beginPath();
  ctx.arc(cx, cy, maxR_px, 0, TAU);
  ctx.strokeStyle = "#2a4a6a"; ctx.lineWidth = 1; ctx.stroke();

  // Centre crosshair
  ctx.strokeStyle = "rgba(61,214,245,0.25)"; ctx.lineWidth = 0.6;
  ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(cx-12, cy); ctx.lineTo(cx+12, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy-12); ctx.lineTo(cx, cy+12); ctx.stroke();
  ctx.setLineDash([]);

  // Angular ruler along bottom (in mrad)
  const span_mrad = halfAngle_mrad * 2;
  {
    const rulerY = H - RULER_H;
    ctx.fillStyle = "rgba(6,14,26,0.85)";
    ctx.fillRect(0, rulerY, W, RULER_H);

    const TICKS = 5;
    const step_mrad = +(span_mrad / TICKS).toFixed(2);
    ctx.fillStyle = "#7da4c0"; ctx.font = "9px monospace";
    ctx.strokeStyle = "#3dd6f5"; ctx.lineWidth = 0.8;
    for (let ang = -halfAngle_mrad; ang <= halfAngle_mrad + 0.001; ang += step_mrad) {
      const px_pos = ((ang + halfAngle_mrad) / span_mrad) * W;
      ctx.beginPath(); ctx.moveTo(px_pos, rulerY); ctx.lineTo(px_pos, rulerY + 5); ctx.stroke();
      ctx.textAlign = "center";
      ctx.fillText(ang.toFixed(1), px_pos, H - 5);
    }
    ctx.fillStyle = "#3dd6f5"; ctx.font = "bold 9px monospace";
    ctx.textAlign = "left"; ctx.fillText("mrad", 3, H - 5);
  }

  const finStr = model.finesse ? model.finesse.toFixed(1) : "—";
  fringeLegend(ctx, W, H,
    `ℱ = ${finStr} · ±${halfAngle_mrad.toFixed(1)} mrad half-angle`, RULER_H);
}

// ==================== Intensity vs OPD Plot  /  Sagnac: φ vs Ω ====================

function drawPlot(inp, model, colour) {
  const [ctx, w, h] = setupCanvas($("plot"));
  const box = { l: 46, r: 12, t: 14, b: 30 };
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

  const N = 320;
  const gamma = inp.coherence / 100;
  const phaseOffset = inp.phaseOffset * Math.PI / 180;

  // ---- Sagnac: plot φ_S (rad) vs Ω (°/s) ----
  if (currentInstrument === "sagnac") {
    // Sweep Ω over ±OmegaMax °/s, scaled so ~4π phase fits the plot
    // Scale factor: dφ/dΩ  (rad per °/s)
    const SF = model.dPhidOmega;          // rad / (°/s)
    // Choose x-axis span so ±4π rad are visible
    const omegaSpan_degs = SF !== 0 ? 4 * Math.PI / Math.abs(SF) : 1000;
    const omega_min = -omegaSpan_degs / 2;
    const omega_max =  omegaSpan_degs / 2;

    // Cosine fringe curve  I(Ω) = ½[1 + γ cos(SF·Ω + φ₀)]
    ctx.strokeStyle = colour; ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const omega = omega_min + t * (omega_max - omega_min);
      const phi = SF * omega + phaseOffset;
      const I = 0.5 * (1 + gamma * Math.cos(phi));
      const x = box.l + t * pw;
      const y = box.t + ph * (1 - I);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Earth rotation rate marker: 15 °/hr = 0.004167 °/s
    const earthOmega_degs = 15 / 3600; // °/s
    if (earthOmega_degs >= omega_min && earthOmega_degs <= omega_max) {
      const xEarth = box.l + ((earthOmega_degs - omega_min) / (omega_max - omega_min)) * pw;
      ctx.save();
      ctx.strokeStyle = "#f5c542"; ctx.lineWidth = 0.8; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(xEarth, box.t); ctx.lineTo(xEarth, box.t + ph); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#f5c542"; ctx.font = "8px monospace"; ctx.textAlign = "left";
      ctx.fillText("Ω⊕", xEarth + 2, box.t + 10);
      ctx.restore();
    }

    // Current Ω marker
    const currentOmega = inp.rotationRate;
    const tx = (currentOmega - omega_min) / (omega_max - omega_min);
    if (tx >= 0 && tx <= 1) {
      const cx = box.l + tx * pw;
      const phi_now = SF * currentOmega + phaseOffset;
      const I_now = 0.5 * (1 + gamma * Math.cos(phi_now));
      const cy = box.t + ph * (1 - I_now);
      ctx.fillStyle = "#3dd6f5";
      ctx.beginPath(); ctx.arc(cx, cy, 4.5, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#3dd6f5"; ctx.lineWidth = 0.7; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, box.t + ph); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Axis labels
    ctx.fillStyle = "#7da4c0"; ctx.font = "10px monospace"; ctx.textAlign = "center";
    ctx.fillText("Rotation rate Ω (°/s)", w / 2, h - 4);
    ctx.save();
    ctx.translate(12, h / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText("I / I₀", 0, 0);
    ctx.restore();
    // X-axis endpoint labels
    const fmtOmega = v => Math.abs(v) < 0.001 ? v.toExponential(2)
                        : Math.abs(v) < 1      ? v.toFixed(4)
                        : v.toFixed(2);
    ctx.textAlign = "left";  ctx.fillText(fmtOmega(omega_min), box.l + 2, box.t + ph + 18);
    ctx.textAlign = "center"; ctx.fillText("0", box.l + pw/2, box.t + ph + 18);
    ctx.textAlign = "right";  ctx.fillText(fmtOmega(omega_max), box.l + pw, box.t + ph + 18);

    // Y-axis ticks
    ctx.textAlign = "right";
    [[0,"0"],[0.5,"0.5"],[1,"1"]].forEach(([v, label]) => {
      const y = box.t + ph * (1 - v);
      ctx.fillText(label, box.l - 3, y + 3);
      ctx.strokeStyle = "#1f3d5c"; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(box.l - 3, y); ctx.lineTo(box.l, y); ctx.stroke();
    });
    return;
  }

  // ---- Lambda tick marks (non-Sagnac) ----
  ctx.strokeStyle = "#f5c54240"; ctx.lineWidth = 0.8;
  for (let i = -4; i <= 4; i++) {
    const t = 0.5 + (i / 8);
    const x = box.l + t * pw;
    ctx.beginPath(); ctx.moveTo(x, box.t + ph); ctx.lineTo(x, box.t + ph + 5); ctx.stroke();
  }

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
  $("fiberTurnsOut").textContent = `${inp.fiberTurns.toFixed(0)} turns`;
  const fovUnit = currentInstrument === "fabryPerot" ? "mrad" : "mm";
  $("fringeApertureOut").textContent = `${Number($("fringeAperture").value).toFixed(1)} ${fovUnit}`;

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
  if (currentInstrument !== "sagnac") {
    $("fringeOrder").textContent = `m = ${model.fringeOrder.toFixed(3)}  (fractional: ${(model.fringeOrder % 1).toFixed(4)})`;
  }
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
    const fsrHz = (model.fsr / (inp.wavelength * 1e-9)) * 3e8 / (inp.wavelength * 1e-9) * (model.fsr * 1e-9);
    $("fsr").textContent = `${model.fsr.toFixed(4)} nm`;
  }
  // Sagnac-specific
  if (currentInstrument === "sagnac" && model.sagnacPhase !== undefined) {
    $("sagnacPhase").textContent = `${formatPhase(model.sagnacPhase)}`;
    if ($("sagnacSF")) {
      const sf_mrad_per_degs = model.dPhidOmega * 1000;
      $("sagnacSF").textContent = `${model.dPhidOmega.toFixed(4)} rad/(°/s)  =  ${sf_mrad_per_degs.toFixed(2)} mrad/(°/s)`;
    }
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
  controls.fiberTurns.value      = DEFAULTS.fiberTurns;
  controls.fiberTurnsInput.value = DEFAULTS.fiberTurns;
  // Re-apply per-instrument arm defaults (e.g. Sagnac 5 cm radius)
  applyArmDefaults(currentInstrument);
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
