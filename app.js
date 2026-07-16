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
    quarterWaveText: "+λ/4 phase offset",
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
    fringeAperture: Math.max(0.1, Number(controls.fringeAperture.value)),
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

// ==================== Shared drawing primitives ====================

// Beam-splitter: 45° line with label above-right.
function drawBeamSplitter(ctx, x, y, size = 14, label = "BS") {
  ctx.save();
  ctx.strokeStyle = "#3dd6f5";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - size, y + size);
  ctx.lineTo(x + size, y - size);
  ctx.stroke();
  // thin backing to improve visibility
  ctx.strokeStyle = "rgba(61,214,245,0.18)";
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.strokeStyle = "#3dd6f5"; ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = "#a8d8f0";
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "left";
  ctx.fillText(label, x + size + 4, y - size + 4);
  ctx.restore();
}

// Mirror: gold rectangle with hatched backing, label above (horiz) or to the right (vert).
// horiz = true  → horizontal mirror face (beam hits it from above/below)
// horiz = false → vertical mirror face (beam hits it from the side)
function drawMirror(ctx, x, y, horiz = false, label = "M") {
  const W = horiz ? 28 : 5, H = horiz ? 5 : 28;
  const BACK = 5; // backing thickness
  ctx.save();
  // Backing — placed on the *back* side of the face so it doesn't cover the face
  ctx.fillStyle = "#2a1a00";
  if (horiz) {
    // Face is horizontal; backing goes ABOVE the face (lower y)
    ctx.fillRect(x - W/2, y - H/2 - BACK, W, BACK);
  } else {
    // Face is vertical; backing goes to the RIGHT of the face (higher x)
    ctx.fillRect(x + W/2, y - H/2, BACK, H);
  }
  // Mirror face
  ctx.fillStyle = "#f5c542";
  ctx.fillRect(x - W/2, y - H/2, W, H);
  // Label
  ctx.fillStyle = "#c0a030";
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "center";
  if (horiz) ctx.fillText(label, x, y - H/2 - BACK - 4);
  else       ctx.fillText(label, x + W/2 + BACK + 8, y + 4);
  ctx.restore();
}

// Beam with optional arrowhead at the end.
function drawBeam(ctx, x1, y1, x2, y2, colour, width = 1.8, arrow = false) {
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  if (arrow) {
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const aLen = 8, aW = 4;
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - aLen * Math.cos(ang - 0.4), y2 - aLen * Math.sin(ang - 0.4));
    ctx.lineTo(x2 - aLen * Math.cos(ang + 0.4), y2 - aLen * Math.sin(ang + 0.4));
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

// Detector box — photodetector symbol.
function drawDetector(ctx, x, y, colour) {
  const S = 16;
  ctx.save();
  ctx.fillStyle = colour;
  ctx.globalAlpha = 0.20;
  ctx.fillRect(x - S, y - S, S * 2, S * 2);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2;
  ctx.strokeRect(x - S, y - S, S * 2, S * 2);
  // triangle inside (photodiode symbol)
  ctx.fillStyle = colour; ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.moveTo(x - 6, y - 7); ctx.lineTo(x + 7, y); ctx.lineTo(x - 6, y + 7);
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#a8d8f0";
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("D", x, y + S + 12);
  ctx.restore();
}

// Source: filled circle with label.
function drawSource(ctx, x, y, colour, label = "Laser") {
  ctx.save();
  // Glow
  const grad = ctx.createRadialGradient(x, y, 2, x, y, 16);
  grad.addColorStop(0, colour);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad; ctx.globalAlpha = 0.35;
  ctx.beginPath(); ctx.arc(x, y, 16, 0, TAU); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = colour;
  ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU); ctx.fill();
  ctx.fillStyle = "#a8d8f0";
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, x, y + 22);
  ctx.restore();
}

// Compact annotation block — rendered in bottom-left with a subtle
// semi-transparent backing so it never bleeds over optical components.
function drawOPDAnnotation(ctx, model, inp) {
  const lines = [
    `OPD: ${displayLength(model.opd)}`,
    `φ:   ${formatPhase(model.phase)}`,
    `λ:   ${inp.wavelength.toFixed(1)} nm`,
  ];
  const lh = 14, pad = 5, x = 8;
  const boxH = lines.length * lh + pad * 2;
  const boxY = ctx.canvas.height / (window.devicePixelRatio || 1) - boxH - 6;
  ctx.save();
  ctx.fillStyle = "rgba(4,10,22,0.78)";
  ctx.fillRect(x - pad, boxY - 2, 190, boxH + 2);
  ctx.fillStyle = "#3dd6f5";
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "left";
  lines.forEach((l, i) => ctx.fillText(l, x, boxY + pad + i * lh));
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: format nm value for diagram labels — avoids "50000.000 nm"
function fmtLen(nm) {
  if (Math.abs(nm) < 1e3)       return `${nm.toFixed(0)} nm`;
  if (Math.abs(nm) < 1e6)       return `${(nm/1e3).toFixed(2)} µm`;
  if (Math.abs(nm) < 1e9)       return `${(nm/1e6).toFixed(3)} mm`;
  return `${(nm/1e9).toFixed(4)} m`;
}

// Helper: draw a dimension arrow between two points with a centred label.
function drawDimLine(ctx, x1, y1, x2, y2, label, offset = 0) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx*dx + dy*dy);
  const nx = -dy/len * offset, ny = dx/len * offset;
  ctx.save();
  ctx.strokeStyle = "#4a6e89"; ctx.lineWidth = 0.9; ctx.setLineDash([3,3]);
  ctx.beginPath();
  ctx.moveTo(x1 + nx, y1 + ny);
  ctx.lineTo(x2 + nx, y2 + ny);
  ctx.stroke();
  ctx.setLineDash([]);
  // Tick marks
  const tx = -dy/len*4, ty = dx/len*4;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1+nx-tx, y1+ny-ty); ctx.lineTo(x1+nx+tx, y1+ny+ty); ctx.stroke();
  ctx.moveTo(x2+nx-tx, y2+ny-ty); ctx.lineTo(x2+nx+tx, y2+ny+ty); ctx.stroke();
  ctx.fillStyle = "#8ab4cc"; ctx.font = "9px monospace"; ctx.textAlign = "center";
  ctx.fillText(label, (x1+x2)/2+nx, (y1+y2)/2+ny - 4);
  ctx.restore();
}

// Helper: draw a beam-direction arrowhead at (x,y) pointing in direction (dx,dy).
function beamArrow(ctx, x, y, dx, dy, colour) {
  const len = Math.sqrt(dx*dx+dy*dy) || 1;
  const ux = dx/len, uy = dy/len;
  const s = 7;
  ctx.save();
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - s*ux + s*0.4*(-uy), y - s*uy + s*0.4*ux);
  ctx.lineTo(x - s*ux - s*0.4*(-uy), y - s*uy - s*0.4*ux);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// MICHELSON INTERFEROMETER
// Classic layout: laser enters from left, 50/50 BS at centre splits beam into
// vertical arm (M_A, up) and horizontal arm (M_B, right). Both beams return
// and recombine at BS; output exits downward to detector. A compensator plate
// (CP) in arm B equalises glass thickness.
// ─────────────────────────────────────────────────────────────────────────────
function drawMichelson(inp, model, colour) {
  const [ctx, w, h] = setupCanvas($("diagram"));
  ctx.fillStyle = "#060e1a"; ctx.fillRect(0,0,w,h);

  // Key positions — independent of arm length values
  const bsX  = w * 0.44,  bsY  = h * 0.56;
  const armV = h * 0.34;   // vertical arm display length
  const armH = w * 0.30;   // horizontal arm display length
  const srcX = w * 0.10,   srcY = bsY;
  const maY  = bsY - armV; // mirror A y
  const mbX  = bsX + armH; // mirror B x
  const detY = Math.min(bsY + h * 0.22, h - 24);

  // ── Source ──
  drawSource(ctx, srcX, srcY, colour);
  drawBeam(ctx, srcX + 10, srcY, bsX - 14, srcY, colour, 1.8, true);

  // ── Beamsplitter ──
  drawBeamSplitter(ctx, bsX, bsY, 14, "BS");

  // ── Arm A (vertical, upward) ──
  // Incident beam offset −2 px left, return +2 px right — clearly separate
  drawBeam(ctx, bsX - 2, bsY - 14, bsX - 2, maY + 3,  colour, 1.8, true);
  drawMirror(ctx, bsX, maY, true, "MA");
  drawBeam(ctx, bsX + 2, maY + 3,  bsX + 2, bsY - 14, colour, 1.6);
  // Arm A length label, right of beam
  ctx.save();
  ctx.fillStyle = "#8ab4cc"; ctx.font = "10px monospace"; ctx.textAlign = "left";
  ctx.fillText(`L_A = ${fmtLen(inp.armA)}`, bsX + 10, (bsY + maY) / 2 + 4);
  ctx.restore();

  // ── Arm B (horizontal, rightward) ──
  drawBeam(ctx, bsX + 14, bsY - 2, mbX - 3, bsY - 2,  colour, 1.8, true);
  drawMirror(ctx, mbX, bsY, false, "MB");
  drawBeam(ctx, mbX - 3, bsY + 2,  bsX + 14, bsY + 2, colour, 1.6);
  // Arm B length label, above beam
  ctx.save();
  ctx.fillStyle = "#8ab4cc"; ctx.font = "10px monospace"; ctx.textAlign = "center";
  ctx.fillText(`L_B = ${fmtLen(inp.armB)}`, (bsX + mbX) / 2, bsY - 12);
  ctx.restore();

  // ── Compensator plate (CP) — in arm B (horizontal) to equalise BS glass dispersion ──
  // In the classic Michelson the source beam passes through BS glass once on the way to
  // arm B; arm A sees the BS glass TWICE (go and return).  The CP in arm B makes both
  // arms traverse the same glass thickness, equalising dispersion.
  const cpMidX = bsX + armH * 0.38;  // roughly 40% along arm B
  const cpHalfH = 10;
  ctx.save();
  ctx.strokeStyle = "#3a7fa8"; ctx.lineWidth = 4; ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.moveTo(cpMidX - 3, bsY - cpHalfH);
  ctx.lineTo(cpMidX + 3, bsY + cpHalfH);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#3a7fa8"; ctx.font = "9px monospace"; ctx.textAlign = "center";
  ctx.fillText("CP", cpMidX, bsY - cpHalfH - 5);
  ctx.restore();

  // ── Output → Detector (downward) ──
  drawBeam(ctx, bsX, bsY + 14, bsX, detY - 16, colour, 1.8, true);
  drawDetector(ctx, bsX, detY, colour);

  drawOPDAnnotation(ctx, model, inp);
}

// ─────────────────────────────────────────────────────────────────────────────
// MACH–ZEHNDER INTERFEROMETER
// Rectangular layout: laser → BS1 (bottom-left) splits into:
//   Arm A (reference, lower): BS1 → M1(bottom-right) → BS2
//   Arm B (sample, upper):    BS1 → M2(top-left)     → BS2
// BS2 (top-right) recombines; detector exits rightward from BS2.
// Sample cell drawn on arm B with refractive index n annotation.
// ─────────────────────────────────────────────────────────────────────────────
function drawMachZehnder(inp, model, colour) {
  const [ctx, w, h] = setupCanvas($("diagram"));
  ctx.fillStyle = "#060e1a"; ctx.fillRect(0,0,w,h);

  // Rectangular beam path corners
  const x1 = w * 0.27, x2 = w * 0.73;
  const yA  = h * 0.70, yB = h * 0.26;
  const bs  = 13; // beamsplitter size

  // ── Source → BS1 ──
  drawSource(ctx, w * 0.09, yA, colour);
  drawBeam(ctx, w * 0.13, yA, x1 - bs, yA, colour, 1.8, true);
  drawBeamSplitter(ctx, x1, yA, bs, "BS1");

  // ── Arm A: lower horizontal → M1 → right vertical up → BS2 ──
  drawBeam(ctx, x1 + bs, yA,  x2 - 4, yA,      colour, 1.8, true);  // lower horiz
  drawMirror(ctx, x2, yA, false, "M1");
  drawBeam(ctx, x2, yA - 4,   x2, yB + bs,      colour, 1.8, true);  // right vert up

  // ── Arm B: left vertical up → M2 → upper horizontal → BS2 ──
  drawBeam(ctx, x1, yA - bs,  x1, yB + 4,        colour, 1.8, true);  // left vert up
  drawMirror(ctx, x1, yB, true, "M2");
  drawBeam(ctx, x1 + 4, yB,   x2 - bs, yB,       colour, 1.8, true);  // upper horiz

  // ── BS2 → output → detector ──
  drawBeamSplitter(ctx, x2, yB, bs, "BS2");
  drawBeam(ctx, x2 + bs, yB, x2 + w * 0.11, yB, colour, 1.8, true);
  drawDetector(ctx, x2 + w * 0.11, yB, colour);

  // ── Path labels ──
  ctx.save();
  ctx.fillStyle = "#8ab4cc"; ctx.font = "10px monospace"; ctx.textAlign = "center";
  // Arm A label below lower beam
  ctx.fillText(`A: ${fmtLen(inp.armA)}`, (x1 + x2) / 2, yA + 18);
  ctx.restore();

  // ── Sample cell on arm B (upper horizontal) ──
  const cx  = (x1 + x2) / 2;
  const cW  = Math.min(50, (x2 - x1) * 0.28), cH = 14;
  // Glass body
  ctx.save();
  ctx.fillStyle   = "rgba(61,180,255,0.12)";
  ctx.strokeStyle = "#3db8f5"; ctx.lineWidth = 1.2;
  ctx.fillRect(cx - cW/2, yB - cH, cW, cH);
  ctx.strokeRect(cx - cW/2, yB - cH, cW, cH);
  // Window lines
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - cW/2 + 4, yB - cH); ctx.lineTo(cx - cW/2 + 4, yB);
  ctx.moveTo(cx + cW/2 - 4, yB - cH); ctx.lineTo(cx + cW/2 - 4, yB);
  ctx.stroke();
  // n label above cell
  ctx.fillStyle = "#3dd6f5"; ctx.font = "bold 9px monospace"; ctx.textAlign = "center";
  ctx.fillText(`n = ${inp.n.toFixed(3)}`, cx, yB - cH - 5);
  ctx.fillStyle = "#8ab4cc"; ctx.font = "10px monospace";
  ctx.fillText(`B: ${fmtLen(inp.armB)}`, cx, yB - cH - 16);
  ctx.restore();

  drawOPDAnnotation(ctx, model, inp);
}

// ─────────────────────────────────────────────────────────────────────────────
// FABRY–PÉROT ETALON
// Two parallel partial-reflector mirrors (M1, M2). Input beam enters, partly
// transmits through M1, bounces back and forth N times. Each round-trip the
// field intensity drops by R². Transmitted beams exit from M2 and are
// collected by the detector. Back-reflection from M1 shown as dashed.
// Beams drawn as a clean fan of parallel horizontal passes, not diagonal —
// correctly representing the paraxial standing-wave cavity.
// ─────────────────────────────────────────────────────────────────────────────
function drawFabryPerot(inp, model, colour) {
  const [ctx, w, h] = setupCanvas($("diagram"));
  ctx.fillStyle = "#060e1a"; ctx.fillRect(0,0,w,h);

  const R   = inp.reflectivity / 100;
  const yMid = h * 0.50;
  const m1x  = w * 0.32;
  const m2x  = w * 0.68;
  const mH   = h * 0.36;        // mirror half-height
  const mW   = 6;               // mirror width

  // ── Source ──
  drawSource(ctx, w * 0.09, yMid, colour);
  drawBeam(ctx, w * 0.13, yMid, m1x - mW, yMid, colour, 1.8, true);

  // ── Partial-reflector mirrors ──
  // Draw a gold slab with a translucent layer whose opacity scales with R
  function drawPRM(mx, lbl) {
    ctx.save();
    // Dark backing (hatching effect)
    ctx.fillStyle = "#1a1000";
    ctx.fillRect(mx + mW/2, yMid - mH, mW, mH * 2);
    // Gold reflective face
    ctx.fillStyle = "#e8b830";
    ctx.fillRect(mx - mW/2, yMid - mH, mW, mH * 2);
    // Translucency overlay: fraction (1-R) let through visually
    ctx.globalAlpha = 0.15 + 0.55 * R;
    ctx.fillStyle = "#c0e8ff";
    ctx.fillRect(mx - mW/2, yMid - mH, mW, mH * 2);
    ctx.globalAlpha = 1;
    // Label above
    ctx.fillStyle = "#d0e8ff"; ctx.font = "bold 11px monospace"; ctx.textAlign = "center";
    ctx.fillText(lbl, mx, yMid - mH - 7);
    // R value below
    ctx.fillStyle = "#8ab4cc"; ctx.font = "9px monospace";
    ctx.fillText(`R = ${(R*100).toFixed(0)}%`, mx, yMid + mH + 14);
    ctx.restore();
  }
  drawPRM(m1x, "M1");
  drawPRM(m2x, "M2");

  // ── Back-reflection from M1 (dashed, fades toward source) ──
  ctx.save();
  ctx.strokeStyle = colour; ctx.globalAlpha = R * 0.55; ctx.lineWidth = 1.3;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(m1x - mW/2, yMid - 9);
  ctx.lineTo(w * 0.13, yMid - 9);
  ctx.stroke();
  ctx.setLineDash([]); ctx.restore();

  // ── Intracavity round-trip beams (horizontal, evenly spaced, dimming) ──
  // Each pass j: intensity ∝ (1−R)·R^j.  Show up to maxPasses passes.
  const maxPasses = 6;
  const yStep  = (mH * 1.6) / (maxPasses + 1);  // even spacing across mirror face
  const yStart = yMid - mH * 0.80;

  for (let j = 0; j < maxPasses; j++) {
    const intensity = (1 - R) * Math.pow(R, j);
    const alpha = Math.min(1, intensity * 3.5);   // scale so j=0 is bright
    if (alpha < 0.04) break;

    const yj = yStart + j * yStep;
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(0.5, 1.8 - j * 0.22);

    // Forward pass (left → right, solid)
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(m1x + mW/2, yj); ctx.lineTo(m2x - mW/2, yj); ctx.stroke();

    // Return pass (right → left, slightly offset downward by yStep/2)
    const yr = yj + yStep * 0.5;
    if (j < maxPasses - 1) {
      ctx.beginPath(); ctx.moveTo(m2x - mW/2, yr); ctx.lineTo(m1x + mW/2, yr); ctx.stroke();
    }

    // Transmitted output from M2 (short stub, fades)
    ctx.globalAlpha = Math.min(1, intensity * 2.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(m2x + mW/2, yj);
    ctx.lineTo(m2x + mW/2 + (m2x - m1x) * 0.18, yj);
    ctx.stroke();
    ctx.restore();
  }

  // ── Main transmitted output → detector ──
  drawBeam(ctx, m2x + mW/2, yMid, w * 0.88, yMid, colour, 1.8, true);
  drawDetector(ctx, w * 0.88, yMid, colour);

  // ── Cavity length dimension line (below mirrors) ──
  const dimY = yMid + mH + 20;
  ctx.save();
  ctx.strokeStyle = "#4a6e89"; ctx.lineWidth = 0.9; ctx.setLineDash([4,3]);
  ctx.beginPath(); ctx.moveTo(m1x, dimY); ctx.lineTo(m2x, dimY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(m1x, dimY-4); ctx.lineTo(m1x, dimY+4);
  ctx.moveTo(m2x, dimY-4); ctx.lineTo(m2x, dimY+4);
  ctx.stroke();
  ctx.fillStyle = "#8ab4cc"; ctx.font = "10px monospace"; ctx.textAlign = "center";
  ctx.fillText(`L = ${fmtLen(inp.armA)}`, (m1x + m2x)/2, dimY + 14);
  ctx.restore();

  drawOPDAnnotation(ctx, model, inp);
}

// ─────────────────────────────────────────────────────────────────────────────
// SAGNAC RING INTERFEROMETER
// Square-ring layout (fibre-optic gyroscope topology):
//   BS  — bottom-left  (input / output coupler)
//   M1  — top-left
//   M2  — top-right
//   M3  — bottom-right
// CCW beam (solid, bright): BS → left-up → M1 → top-right → M2 → right-down → M3 → bottom-left → BS
// CW  beam (dashed, dim):   reverse direction
// Detector on output port of BS (downward).
// Rotation arrow (orange arc) inside ring, labelled with Ω value.
// ─────────────────────────────────────────────────────────────────────────────
function drawSagnac(inp, model, colour) {
  const [ctx, w, h] = setupCanvas($("diagram"));
  ctx.fillStyle = "#060e1a"; ctx.fillRect(0,0,w,h);

  const omega = inp.rotationRate;

  // Ring corner positions — leave room for labels and source/detector outside
  const lm = w * 0.20,  rm = w * 0.86;   // left/right x of ring
  const tm = h * 0.10,  bm = h * 0.72;   // top/bottom y of ring

  // Corners
  const BS = { x: lm, y: bm };   // BS — bottom-left (also input/output port)
  const M1 = { x: lm, y: tm };   // M1 — top-left
  const M2 = { x: rm, y: tm };   // M2 — top-right
  const M3 = { x: rm, y: bm };   // M3 — bottom-right

  const ringCx = (lm + rm) / 2;
  const ringCy = (tm + bm) / 2;

  // ── Source (enters from left of BS) ──
  drawSource(ctx, BS.x - w * 0.12, BS.y, colour);
  drawBeam(ctx, BS.x - w * 0.08, BS.y, BS.x - 13, BS.y, colour, 1.8, true);

  // ── Beamsplitter ──
  drawBeamSplitter(ctx, BS.x, BS.y, 13, "BS");

  // ── Three corner mirrors ──
  // M1 top-left: horizontal flat mirror — beam arrives from below, exits rightward
  drawMirror(ctx, M1.x, M1.y, true, "M1");
  // M2 top-right: vertical flat mirror — beam arrives from left (top leg), exits downward
  drawMirror(ctx, M2.x, M2.y, false, "M2");
  // M3 bottom-right: vertical flat mirror — beam arrives from above, exits leftward
  drawMirror(ctx, M3.x, M3.y, false, "M3");

  // Helper: draw one complete directed beam path around the ring
  // segs = array of {x1,y1,x2,y2} segments
  function drawRingPath(segs, alpha, dashed) {
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.lineWidth   = 1.8;
    ctx.globalAlpha = alpha;
    if (dashed) ctx.setLineDash([6, 5]);
    segs.forEach(({ x1, y1, x2, y2 }, idx) => {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      // Arrowhead midway along each leg
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      beamArrow(ctx, mx, my, x2 - x1, y2 - y1, colour);
    });
    ctx.setLineDash([]);
    ctx.restore();
  }

  const o = 4; // lane offset so CCW and CW beams don't overlap
  // CCW path (solid): BS(up) → M1 → M2 → M3 → BS
  drawRingPath([
    { x1: BS.x - o, y1: BS.y - 13, x2: M1.x - o, y2: M1.y + 4  },   // BS → M1 (left side)
    { x1: M1.x + 4, y1: M1.y - o,  x2: M2.x - 4,  y2: M2.y - o  },   // M1 → M2 (top)
    { x1: M2.x + o, y1: M2.y + 4,  x2: M3.x + o,  y2: M3.y - 4  },   // M2 → M3 (right side)
    { x1: M3.x - 4, y1: M3.y + o,  x2: BS.x + 13, y2: BS.y + o  },   // M3 → BS (bottom)
  ], 0.90, false);

  // CW path (dashed): BS(right) → M3 → M2 → M1 → BS
  drawRingPath([
    { x1: BS.x + 13, y1: BS.y - o, x2: M3.x - 4,  y2: BS.y - o  },   // BS → M3 (bottom)
    { x1: M3.x - o,  y1: M3.y - 4, x2: M2.x - o,  y2: M2.y + 4  },   // M3 → M2 (right)
    { x1: M2.x - 4,  y1: M2.y + o, x2: M1.x + 4,  y2: M1.y + o  },   // M2 → M1 (top)
    { x1: M1.x + o,  y1: M1.y + 4, x2: BS.x - 13, y2: BS.y - 13 },   // M1 → BS (left)
  ], 0.40, true);

  // ── Detector (below BS) ──
  const detY = BS.y + h * 0.16;
  drawBeam(ctx, BS.x, BS.y + 13, BS.x, detY - 16, colour, 1.8, true);
  drawDetector(ctx, BS.x, detY, colour);

  // ── Direction labels ──
  ctx.save();
  ctx.font = "bold 10px monospace"; ctx.textAlign = "center";
  ctx.fillStyle = colour; ctx.globalAlpha = 0.90;
  ctx.fillText("↺ CCW", ringCx - 38, ringCy - 10);
  ctx.globalAlpha = 0.42;
  ctx.fillText("↻ CW", ringCx + 38, ringCy + 16);
  ctx.restore();

  // ── Rotation indicator ──
  const arrowR = Math.min(rm - lm, bm - tm) * 0.18;
  if (Math.abs(omega) > 0.01) {
    const dir = omega > 0 ? 1 : -1;
    ctx.save();
    ctx.strokeStyle = "#f5834a"; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(ringCx, ringCy, arrowR, -Math.PI/2, -Math.PI/2 + dir * TAU * 0.72);
    ctx.stroke();
    // Triangle arrowhead
    const aAng = -Math.PI/2 + dir * TAU * 0.72;
    const ax = ringCx + arrowR * Math.cos(aAng);
    const ay = ringCy + arrowR * Math.sin(aAng);
    const tAng = aAng + dir * Math.PI / 2;
    ctx.fillStyle = "#f5834a";
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - 8 * Math.cos(tAng - 0.4), ay - 8 * Math.sin(tAng - 0.4));
    ctx.lineTo(ax - 8 * Math.cos(tAng + 0.4), ay - 8 * Math.sin(tAng + 0.4));
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#f5834a"; ctx.font = "bold 10px monospace"; ctx.textAlign = "center";
    ctx.fillText(`Ω = ${omega.toFixed(2)}°/s`, ringCx, ringCy + arrowR + 16);
    ctx.restore();
  } else {
    ctx.save();
    ctx.fillStyle = "#5a7e9a"; ctx.font = "10px monospace"; ctx.textAlign = "center";
    ctx.fillText("Ω = 0  (no Sagnac shift)", ringCx, ringCy + arrowR + 16);
    ctx.restore();
  }

  // ── Ring area label (dashed half-diagonal) ──
  ctx.save();
  ctx.strokeStyle = "#4a6e89"; ctx.lineWidth = 0.8; ctx.setLineDash([3,4]);
  ctx.beginPath(); ctx.moveTo(ringCx, ringCy); ctx.lineTo(M2.x, M2.y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#8ab4cc"; ctx.font = "9px monospace"; ctx.textAlign = "center";
  ctx.fillText(`r = ${fmtLen(inp.armA)}`, (ringCx + M2.x)/2 - 8, (ringCy + M2.y)/2 + 14);
  ctx.restore();

  drawOPDAnnotation(ctx, model, inp);
}

// ==================== Fringe Pattern ====================
//
// PHYSICAL SCALE MODEL — wavelength-correct rendering
// ---------------------------------------------------
// For circular / straight fringes we fix the *focal length* f_px of the
// observing lens in pixels (constant for a given canvas size and FOV).
// The angular position θ of a ring depends on λ, so the ring radius
//   r_j = f_px · θ_j = f_px · √(j·λ/OPD₀)
// changes with λ for the same OPD — shorter λ produces tighter rings.
//
// f_px is computed once from a REFERENCE_LAMBDA (633 nm) and a target
// ring count RING_ORDERS_SHOWN_REF at that wavelength so the view is
// well-filled at He-Ne.  At other λ the ring density changes correctly.
//
//  Straight (tilt wedge):
//    Fringe spacing Λ = λ / (2θ_tilt)  [nm].  Rendered at px = Λ · px_per_nm.
//    Shorter λ → finer fringes at same tilt.
//
//  Haidinger (Fabry–Pérot):
//    Auto-scales halfAngle_mrad so that ~5 rings fill the aperture for
//    the current cavity / finesse parameters.

const RING_ORDERS_REF  = 8;     // rings shown at REFERENCE_LAMBDA
const REFERENCE_LAMBDA = 633;   // nm

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
  const fov_mm    = Math.max(0.01, Number($("fringeAperture")?.value ?? 10));
  const fov_nm    = fov_mm * 1e6;
  const px_per_nm = W / fov_nm;

  const gamma = model.gamma;
  const tilt  = inp.tiltAngle; // mrad

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
// rate (Ω⊕ = 15°/hr) annotated.
// FIXED x-axis: always ±180 °/s — matches the plot panel fixed axis.
function drawSagnacSweep(ctx, W, H, PW, PH, dpr, model, colour, inp) {
  const RULER_H = 28;
  const imageH  = H - RULER_H;

  const [sr, sg, sb] = parseColour(colour);
  const { imgData, data } = makeImgData(ctx, PW, PH);

  const gamma  = model.gamma;
  const SF     = model.dPhidOmega;       // rad / (°/s)
  const phOff  = inp.phaseOffset * Math.PI / 180;

  // Fixed ±180 °/s axis — same as the plot panel
  const omega_min = -180;
  const omega_max =  180;
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
// Fixed focal length derived from REFERENCE_LAMBDA so that at He-Ne the
// aperture shows RING_ORDERS_REF rings.  At other λ the fringe density
// changes correctly: more rings for shorter λ (same OPD → more cycles).
function drawCircularFringes(ctx, W, H, PW, PH, dpr, model, colour, gamma,
                             inp, px_per_nm, fov_mm) {
  const RULER_H = 22;
  const imageH  = H - RULER_H;
  const cx = W / 2, cy = imageH / 2;
  const maxR_px = Math.min(W, imageH) * 0.46;

  const [sr, sg, sb] = parseColour(colour);
  const { imgData, data } = makeImgData(ctx, PW, PH);

  const OPD0   = Math.abs(model.opd);
  const lambda = model.lambda;
  const phaseOffset = inp.phaseOffset * Math.PI / 180;

  if (OPD0 < 1e-6) {
    // Zero OPD: uniform field
    const I = 0.5 * (1 + gamma * Math.cos(model.phase));
    const PH_img = Math.round(imageH * dpr);
    for (let py = 0; py < PH_img; py++) {
      const ly = py / dpr - cy;
      for (let px2 = 0; px2 < PW; px2++) {
        const lx = px2 / dpr - cx;
        if (Math.sqrt(lx*lx + ly*ly) > maxR_px) continue;
        const idx = (py * PW + px2) * 4;
        data[idx] = sr * I; data[idx+1] = sg * I; data[idx+2] = sb * I;
      }
    }
  } else {
    // Fixed focal length: calibrate at REFERENCE_LAMBDA so RING_ORDERS_REF rings
    // fill the aperture.  θ_max_ref = √(RING_ORDERS_REF · λ_ref / OPD0)
    // f_px = maxR_px / θ_max_ref  — this is FIXED regardless of actual λ.
    // At a shorter λ the ring j radius r_j = f_px·√(j·λ/OPD0) is smaller
    // → more rings fit → fringe pattern visually differs between wavelengths.
    const theta_max_ref = Math.sqrt(RING_ORDERS_REF * REFERENCE_LAMBDA / OPD0);
    const f_px = maxR_px / theta_max_ref;   // fixed focal length in px/rad

    const PH_img = Math.round(imageH * dpr);
    for (let py = 0; py < PH_img; py++) {
      const ly = py / dpr - cy;
      for (let px2 = 0; px2 < PW; px2++) {
        const lx = px2 / dpr - cx;
        const r_px = Math.sqrt(lx * lx + ly * ly);
        if (r_px > maxR_px) continue;

        const theta = r_px / f_px;
        // Exact equal-inclination OPD: OPD(θ) = OPD0·cos(θ)
        const opd_theta = OPD0 * Math.cos(theta);
        const signed_opd = Math.sign(model.opd) * opd_theta;
        const phase = TAU * (signed_opd / lambda) + phaseOffset;
        const I = 0.5 * (1 + gamma * Math.cos(phase));

        const idx = (py * PW + px2) * 4;
        data[idx] = sr * I; data[idx+1] = sg * I; data[idx+2] = sb * I;
      }
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
  ctx.beginPath(); ctx.moveTo(cx - 12, cy); ctx.lineTo(cx + 12, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy + 12); ctx.stroke();
  ctx.setLineDash([]);

  // Annotation: first-ring radius in physical units
  const f_px_disp = OPD0 < 1 ? null
    : maxR_px / Math.sqrt(RING_ORDERS_REF * REFERENCE_LAMBDA / OPD0);
  const r1_px = f_px_disp ? f_px_disp * Math.sqrt(lambda / OPD0) : null;
  const r1_nm = r1_px ? r1_px / px_per_nm : null;
  const r1_str = r1_nm == null ? "—"
    : r1_nm < 1000 ? r1_nm.toFixed(1) + " nm"
    : r1_nm < 1e6  ? (r1_nm / 1e3).toFixed(3) + " µm"
    :                (r1_nm / 1e6).toFixed(4)  + " mm";

  // How many rings actually visible with this λ
  const nRings = OPD0 < 1 ? 0 : Math.floor(OPD0 / lambda * (maxR_px / f_px_disp) ** 2);
  const mFrac  = ((model.fringeOrder % 1) + 1) % 1;
  const centre = mFrac < 0.08 || mFrac > 0.92 ? "bright"
               : mFrac > 0.42 && mFrac < 0.58  ? "dark" : "partial";
  fringeLegend(ctx, W, H,
    `Equal-incl. · r₁≈${r1_str} · ~${nRings} rings · centre ${centre}`, RULER_H);
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
// Transmission peaks at cos(θ) = mλ/(2nL).  The j-th bright ring from
// normal incidence occurs at θ_j ≈ √(j · λ / (nL)) for small angles.
//
// Auto-scales the angular FOV so ≈5 bright rings fill the aperture when
// the "fringeAperture" slider is at its default; the slider lets the user
// zoom in/out (smaller = magnified view of centre, more rings).
// Ruler ticks are centred at θ = 0 and span symmetrically.
function drawHaidingerFringes(ctx, W, H, PW, PH, dpr, model, colour, gamma,
                              inp, px_per_nm, fov_mm) {
  const RULER_H = 22;
  const imageH  = H - RULER_H;
  const cx = W / 2, cy = imageH / 2;
  const maxR_px = Math.min(W, imageH) * 0.46;

  const [sr, sg, sb] = parseColour(colour);
  const { imgData, data } = makeImgData(ctx, PW, PH);
  const F = model.F !== undefined ? model.F : 1;

  const lambda = model.lambda;          // nm
  const OPD0   = Math.abs(model.opd);   // nm = 2nL  (> 0)
  const phaseOffset = inp.phaseOffset * Math.PI / 180;

  // Auto-compute a sensible half-angle so ~5 rings fill the aperture:
  //   5th ring at θ₅ = √(5·λ/OPD0)
  // The slider value is used as a *zoom multiplier*: default=10 → 5 rings,
  // slider min=0.1 → very zoomed in, slider max=50 → very wide.
  const sliderVal   = Math.max(0.1, Number($("fringeAperture")?.value ?? 10));
  // auto half-angle at zoom=10 shows 5 rings; scale inversely with sliderVal
  const autoAngle_rad = OPD0 > 1 ? Math.sqrt(5 * lambda / OPD0) : 5e-3;
  const halfAngle_rad = autoAngle_rad * (10 / sliderVal);
  const halfAngle_mrad = halfAngle_rad * 1e3;
  const f_px = maxR_px / halfAngle_rad;  // px per radian

  const PH_img = Math.round(imageH * dpr);
  for (let py = 0; py < PH_img; py++) {
    const ly = py / dpr - cy;
    for (let px2 = 0; px2 < PW; px2++) {
      const lx = px2 / dpr - cx;
      const r_px = Math.sqrt(lx * lx + ly * ly);
      if (r_px > maxR_px) continue;

      const theta = r_px / f_px;
      const cosTheta = Math.cos(theta);
      // Exact Airy phase: φ = 2π·OPD0·cosθ/λ
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
  ctx.beginPath(); ctx.moveTo(cx - 12, cy); ctx.lineTo(cx + 12, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy + 12); ctx.stroke();
  ctx.setLineDash([]);

  // Angular ruler — symmetric about centre (θ = 0 maps to cx)
  {
    const rulerY = H - RULER_H;
    ctx.fillStyle = "rgba(6,14,26,0.85)";
    ctx.fillRect(0, rulerY, W, RULER_H);

    // Nice tick step in mrad
    const span_mrad = halfAngle_mrad * 2;
    const TICKS = 6;
    const rawStep = span_mrad / TICKS;
    const mag  = Math.pow(10, Math.floor(Math.log10(rawStep)));
    let step_mrad = mag;
    for (const m of [1, 2, 5, 10]) {
      if (span_mrad / (m * mag) <= TICKS + 1) { step_mrad = m * mag; break; }
    }

    ctx.strokeStyle = "#3dd6f5"; ctx.lineWidth = 0.8;
    ctx.fillStyle   = "#7da4c0"; ctx.font = "9px monospace";

    // Ruler zero is at cx; tick positions from -halfAngle_mrad to +halfAngle_mrad
    const firstTick = Math.ceil(-halfAngle_mrad / step_mrad) * step_mrad;
    for (let ang = firstTick; ang <= halfAngle_mrad + step_mrad * 0.01; ang += step_mrad) {
      // Map angle → pixel: θ=0 at cx, θ=halfAngle_mrad at cx+maxR_px
      const px_pos = cx + (ang / halfAngle_mrad) * maxR_px;
      if (px_pos < 0 || px_pos > W) continue;
      ctx.beginPath(); ctx.moveTo(px_pos, rulerY); ctx.lineTo(px_pos, rulerY + 5); ctx.stroke();
      ctx.textAlign = "center";
      const lbl = Math.abs(ang) < 0.001 ? "0"
                : ang < 0 ? ang.toFixed(step_mrad < 0.1 ? 2 : 1)
                :            "+" + ang.toFixed(step_mrad < 0.1 ? 2 : 1);
      ctx.fillText(lbl, px_pos, H - 5);
    }
    ctx.fillStyle = "#3dd6f5"; ctx.font = "bold 9px monospace";
    ctx.textAlign = "left"; ctx.fillText("mrad", 3, H - 5);
  }

  const finStr = model.finesse ? model.finesse.toFixed(1) : "—";
  fringeLegend(ctx, W, H,
    `ℱ = ${finStr} · ±${halfAngle_mrad.toFixed(2)} mrad`, RULER_H);
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

  // ── Sagnac: I vs Ω  —  FIXED axis ±180 °/s, curve shifts with SF ──────
  // The x-axis is always −180 … +180 °/s regardless of coil geometry.
  // The fringe density and position change as SF = dφ/dΩ changes.
  if (currentInstrument === "sagnac") {
    const SF        = model.dPhidOmega;   // rad/(°/s)
    const OMEGA_MAX = 180;                // fixed axis half-range °/s
    const oMin      = -OMEGA_MAX;
    const oMax      =  OMEGA_MAX;
    const oSpan     = oMax - oMin;
    const oToX      = (o) => box.l + ((o - oMin) / oSpan) * pw;

    // ── Curve: I(Ω) = ½[1 + γ·cos(SF·Ω + φ₀)] ──
    ctx.strokeStyle = colour; ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const t   = i / N;
      const o   = oMin + t * oSpan;
      const phi = SF * o + phaseOffset;
      const I   = 0.5 * (1 + gamma * Math.cos(phi));
      i === 0 ? ctx.moveTo(box.l + t * pw, box.t + ph * (1 - I))
              : ctx.lineTo(box.l + t * pw, box.t + ph * (1 - I));
    }
    ctx.stroke();

    // ── Earth rate: 15°/hr = 0.00417°/s ──
    const earthO = 15 / 3600;
    const xEarth = oToX(earthO);
    ctx.save();
    ctx.strokeStyle = "#f5c542"; ctx.lineWidth = 0.8; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(xEarth, box.t); ctx.lineTo(xEarth, box.t + ph); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#f5c542"; ctx.font = "8px monospace"; ctx.textAlign = "left";
    ctx.fillText("Ω⊕", xEarth + 2, box.t + 10);
    ctx.restore();

    // ── Current Ω marker ──
    const curO  = inp.rotationRate;
    const xCurO = oToX(curO);
    if (xCurO >= box.l && xCurO <= box.l + pw) {
      const I_cur = 0.5 * (1 + gamma * Math.cos(SF * curO + phaseOffset));
      const yCurO = box.t + ph * (1 - I_cur);
      ctx.fillStyle = "#3dd6f5";
      ctx.beginPath(); ctx.arc(xCurO, yCurO, 4.5, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#3dd6f5"; ctx.lineWidth = 0.7; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(xCurO, yCurO); ctx.lineTo(xCurO, box.t + ph); ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── Scale factor annotation ──
    const sfStr = Math.abs(SF) < 1e-6 ? SF.toExponential(2)
                : Math.abs(SF) < 0.01  ? SF.toExponential(3)
                : SF.toFixed(5);
    ctx.fillStyle = "#f5c542"; ctx.font = "8px monospace"; ctx.textAlign = "left";
    ctx.fillText(`SF = ${sfStr} rad/(°/s)`, box.l + 2, box.t + 11);

    // ── Fixed x-axis ticks every 60°/s ──
    ctx.fillStyle = "#7da4c0"; ctx.font = "9px monospace";
    [-180,-120,-60,0,60,120,180].forEach(v => {
      const xv = oToX(v);
      ctx.strokeStyle = "#1f3d5c"; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(xv, box.t + ph); ctx.lineTo(xv, box.t + ph + 4); ctx.stroke();
      ctx.textAlign = "center";
      ctx.fillText(`${v}`, xv, box.t + ph + 15);
    });

    // ── Axis labels ──
    ctx.fillStyle = "#7da4c0"; ctx.font = "10px monospace"; ctx.textAlign = "center";
    ctx.fillText("Rotation rate  Ω  (°/s)", w / 2, h - 4);
    ctx.save();
    ctx.translate(12, h / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText("I / I₀", 0, 0);
    ctx.restore();

    // ── Y-axis ticks ──
    ctx.textAlign = "right";
    [[0,"0"],[0.5,"½"],[1,"1"]].forEach(([v, lbl]) => {
      const yv = box.t + ph * (1 - v);
      ctx.fillStyle = "#7da4c0"; ctx.font = "9px monospace";
      ctx.fillText(lbl, box.l - 3, yv + 3);
      ctx.strokeStyle = "#1f3d5c"; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(box.l - 3, yv); ctx.lineTo(box.l, yv); ctx.stroke();
    });
    return;
  }

  const lambda = model.lambda;

  // ── Fabry–Pérot: Airy plot centred at current resonance order ──────────────
  // The FP OPD = 2nL is typically ≫ λ, so an axis centred at OPD=0 never shows
  // the actual operating point.  Instead we find the nearest resonance order m₀
  // and centre the axis on m₀·λ, spanning ±2·FSR so 4 peaks are always visible.
  if (currentInstrument === "fabryPerot") {
    const R   = inp.reflectivity / 100;
    const F   = (4 * R) / (1 - R) ** 2;
    const opd = model.opd;  // 2nL in nm

    // Nearest integer resonance order to current OPD
    const m0     = Math.round(opd / lambda);
    const centre = m0 * lambda;   // OPD at nearest peak [nm]
    // Span ±2 FSR on each side (FSR = λ in OPD units for the Airy plot)
    const halfSpan = 2 * lambda;
    const fpMin = centre - halfSpan;
    const fpMax = centre + halfSpan;
    const fpSpan = fpMax - fpMin;
    const fpToX = (o) => box.l + ((o - fpMin) / fpSpan) * pw;

    // Integer order tick marks (gold, at each mλ within window)
    ctx.strokeStyle = "#f5c54240"; ctx.lineWidth = 0.8;
    for (let m = Math.ceil(fpMin / lambda); m <= Math.floor(fpMax / lambda); m++) {
      const x = fpToX(m * lambda);
      ctx.beginPath(); ctx.moveTo(x, box.t + ph); ctx.lineTo(x, box.t + ph + 5); ctx.stroke();
    }

    // Airy curve
    ctx.strokeStyle = "#f5834a"; ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const t      = i / N;
      const opdVal = fpMin + t * fpSpan;
      const phase  = TAU * (opdVal / lambda) + phaseOffset;
      const raw    = 1 / (1 + F * Math.sin(phase / 2) ** 2);
      const I      = raw * gamma + 0.5 * (1 - gamma);
      i === 0 ? ctx.moveTo(fpToX(opdVal), box.t + ph * (1 - I))
              : ctx.lineTo(fpToX(opdVal), box.t + ph * (1 - I));
    }
    ctx.stroke();

    // Current OPD marker — actual position (no wrapping needed — it's always in window)
    const fpCx = fpToX(opd);
    const fpCy = box.t + ph * (1 - model.intensity);
    ctx.fillStyle = "#3dd6f5";
    ctx.beginPath(); ctx.arc(fpCx, fpCy, 4.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#3dd6f5"; ctx.lineWidth = 0.7; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(fpCx, fpCy); ctx.lineTo(fpCx, box.t + ph); ctx.stroke();
    ctx.setLineDash([]);

    // Axis labels
    ctx.fillStyle = "#7da4c0"; ctx.font = "10px monospace"; ctx.textAlign = "center";
    ctx.fillText("OPD (nm)", w / 2, h - 4);
    ctx.save();
    ctx.translate(12, h / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText("I / I₀", 0, 0);
    ctx.restore();

    // X tick labels — show OPD values in nm/µm
    ctx.fillStyle = "#7da4c0"; ctx.font = "9px monospace";
    for (let m = Math.ceil(fpMin / lambda); m <= Math.floor(fpMax / lambda); m++) {
      const nmVal = m * lambda;
      const lbl   = nmVal < 1000 ? nmVal.toFixed(0) : (nmVal / 1e3).toFixed(2) + "k";
      ctx.textAlign = "center";
      ctx.fillText(lbl, fpToX(nmVal), box.t + ph + 18);
    }
    // Resonance order + λ annotation
    ctx.fillStyle = "#f5834a"; ctx.font = "8px monospace"; ctx.textAlign = "left";
    ctx.fillText(`m₀ = ${m0}  λ = ${lambda.toFixed(1)} nm`, box.l + 2, box.t + 11);

    // Y ticks
    ctx.textAlign = "right";
    [[0,"0"],[0.5,"0.5"],[1,"1"]].forEach(([v, label]) => {
      const y = box.t + ph * (1 - v);
      ctx.fillStyle = "#7da4c0"; ctx.font = "10px monospace";
      ctx.fillText(label, box.l - 3, y + 3);
      ctx.strokeStyle = "#1f3d5c"; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(box.l - 3, y); ctx.lineTo(box.l, y); ctx.stroke();
    });
    return;
  }

  // ---- Michelson / MZI: fixed x-axis −4λ … +4λ, centred at OPD = 0 ----
  // The axis is FIXED; the cyan marker scrolls to show current OPD position.
  const xSpan   = 8 * lambda;    // nm
  const xMin    = -4 * lambda;
  const xMax    =  4 * lambda;
  const nmToX   = (nm) => box.l + ((nm - xMin) / xSpan) * pw;

  // Lambda tick marks at integer multiples
  ctx.strokeStyle = "#f5c54240"; ctx.lineWidth = 0.8;
  for (let i = -4; i <= 4; i++) {
    const x = nmToX(i * lambda);
    ctx.beginPath(); ctx.moveTo(x, box.t + ph); ctx.lineTo(x, box.t + ph + 5); ctx.stroke();
  }

  ctx.strokeStyle = colour; ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const t      = i / N;
    const opdVal = xMin + t * xSpan;
    const phase  = TAU * (opdVal / lambda) + phaseOffset;
    const I      = 0.5 * (1 + gamma * Math.cos(phase));
    i === 0 ? ctx.moveTo(nmToX(opdVal), box.t + ph * (1 - I))
            : ctx.lineTo(nmToX(opdVal), box.t + ph * (1 - I));
  }
  ctx.stroke();

  // Current OPD marker — wraps onto fixed axis (modulo xSpan)
  const opdWrapped = ((model.opd - xMin) % xSpan + xSpan) % xSpan + xMin;
  const cx = nmToX(opdWrapped);
  const cy = box.t + ph * (1 - model.intensity);
  ctx.fillStyle = "#3dd6f5";
  ctx.beginPath(); ctx.arc(cx, cy, 4.5, 0, TAU); ctx.fill();
  ctx.strokeStyle = "#3dd6f5"; ctx.lineWidth = 0.7; ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, box.t + ph); ctx.stroke();
  ctx.setLineDash([]);

  // Axis labels
  ctx.fillStyle = "#7da4c0"; ctx.font = "10px monospace"; ctx.textAlign = "center";
  ctx.fillText("OPD (nm)", w / 2, h - 4);
  ctx.save();
  ctx.translate(12, h / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText("I / I₀", 0, 0);
  ctx.restore();

  // X tick labels (nm values)
  ctx.fillStyle = "#7da4c0"; ctx.font = "9px monospace";
  for (let i = -4; i <= 4; i++) {
    if (i === 0) { ctx.textAlign = "center"; ctx.fillText("0", nmToX(0), box.t + ph + 18); continue; }
    const nm_val = i * lambda;
    const lbl    = Math.abs(nm_val) < 1000 ? nm_val.toFixed(0) + "" : (nm_val / 1e3).toFixed(1) + "k";
    ctx.textAlign = "center";
    ctx.fillText(lbl, nmToX(nm_val), box.t + ph + 18);
  }
  // λ annotation top-left
  ctx.fillStyle = "#f5c542"; ctx.font = "8px monospace"; ctx.textAlign = "left";
  ctx.fillText(`λ = ${lambda.toFixed(1)} nm`, box.l + 2, box.t + 11);

  // Y-axis ticks 0, 0.5, 1
  ctx.textAlign = "right";
  [[0,"0"],[0.5,"0.5"],[1,"1"]].forEach(([v, label]) => {
    const y = box.t + ph * (1 - v);
    ctx.fillStyle = "#7da4c0"; ctx.font = "10px monospace";
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
  $("fringeApertureOut").textContent = `${inp.fringeAperture.toFixed(1)} ${fovUnit}`;

  // OPD display
  $("opdHeading").textContent = cfg.opdHeading;
  $("opdDisplay").textContent = displayLength(model.opd);
  $("opdDefinition").innerHTML = cfg.opdDef;

  // Coherence bar — fill colour tracks the current wavelength
  const fill = $("coherenceFill");
  fill.style.width = inp.coherence + "%";
  fill.style.background = colour;

  // Header badge
  $("sourcePresetBadge").textContent = SOURCE_PRESETS[sourcePreset.value]?.label || `${inp.wavelength.toFixed(1)} nm`;

  // Intensity — use model.visibility for FP (Airy), model.gamma for two-beam
  const vis = model.visibility;
  $("intensity").textContent = model.intensity.toFixed(4);
  $("intensityMin").textContent = (0.5 * (1 - vis)).toFixed(4);
  $("intensityMax").textContent = (0.5 * (1 + vis)).toFixed(4);
  $("contrast").textContent = `${(vis * 100).toFixed(1)}%`;

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
    $("fsr").textContent = fmtLen(model.fsr);
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

function shiftPhaseOffset(fractions) {
  // For Sagnac: shift the electronic phase offset by λ/4 or λ/2 equivalent
  const delta = fractions * 360; // degrees (λ/4 = 90°, λ/2 = 180°)
  const current = Number(controls.phaseOffset.value);
  const next = ((current + delta) % 360 + 360) % 360;
  controls.phaseOffset.value      = next;
  controls.phaseOffsetInput.value = next.toFixed(1);
  render();
}

$("quarterWave").addEventListener("click", () => {
  if (currentInstrument === "sagnac") shiftPhaseOffset(0.25);
  else shiftArmB(0.25);
});
$("halfWave").addEventListener("click", () => {
  if (currentInstrument === "sagnac") shiftPhaseOffset(0.5);
  else shiftArmB(0.5);
});

// ==================== Resize Observer ====================
// Re-render all canvases when the page layout changes size.

const _resizeObserver = new ResizeObserver(() => render());
["diagram", "fringeCanvas", "plot"].forEach(id => {
  const el = $(id);
  if (el) _resizeObserver.observe(el);
});

// ==================== Startup ====================

updateInstrumentUI();
render();
