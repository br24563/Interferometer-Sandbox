"use strict";

// Professional Michelson Interferometer Lab
// All distance values in picometres (pm); wavelengths in nanometres (nm).
// Using pm for arm lengths gives sub-nanometer precision and allows
// 0.1 nm (100 pm) arm-length adjustments with reasonable slider ranges.

const $ = (id) => document.getElementById(id);
const controls = {
  wavelength: $("wavelength"),
  wavelengthInput: $("wavelengthInput"),
  armA: $("armA"),
  armAInput: $("armAInput"),
  armB: $("armB"),
  armBInput: $("armBInput"),
  phaseOffset: $("phaseOffset"),
  phaseOffsetInput: $("phaseOffsetInput"),
  coherence: $("coherence"),
  coherenceInput: $("coherenceInput")
};

const defaults = {
  wavelength: 532,
  armA: 100000,
  armB: 100500,
  phaseOffset: 0,
  coherence: 100
};

const TAU = 2 * Math.PI;
const MIN_WAVELENGTH = 380;
const MAX_WAVELENGTH = 740;

// ==================== Input Synchronization ====================
// Keep slider and numeric input in sync

function syncFromSlider(sliderId, inputId) {
  const value = Number($(sliderId).value);
  $(inputId).value = (value / 1000).toFixed(1); // Convert pm to nm display
}

function syncFromInput(inputId, sliderId) {
  let value = Number($(inputId).value) * 1000; // Convert nm to pm
  const slider = $(sliderId);
  
  // Clamp to slider range
  const min = Number(slider.min);
  const max = Number(slider.max);
  value = Math.max(min, Math.min(max, value));
  
  $(sliderId).value = value;
  $(inputId).value = (value / 1000).toFixed(1);
}

// Set up two-way sync for each control pair
Object.entries({
  wavelength: "wavelengthInput",
  armA: "armAInput",
  armB: "armBInput",
  phaseOffset: "phaseOffsetInput",
  coherence: "coherenceInput"
}).forEach(([slider, input]) => {
  $(slider).addEventListener("input", () => syncFromSlider(slider, input));
  $(input).addEventListener("change", () => syncFromInput(input, slider));
  $(input).addEventListener("blur", () => syncFromInput(input, slider));
});

// ==================== Read Inputs ====================

function readInputs() {
  return {
    wavelength: Number(controls.wavelength.value),
    armA: Number(controls.armA.value) / 1000, // Convert pm to nm
    armB: Number(controls.armB.value) / 1000, // Convert pm to nm
    phaseOffset: Number(controls.phaseOffset.value),
    coherence: Number(controls.coherence.value)
  };
}

// ==================== Unit Conversion ====================

function wavelengthMicrometres(nanometres) {
  return nanometres / 1000;
}

// ==================== Canvas Setup ====================
// Scale canvas for high-DPI displays to keep lines sharp

function canvasContext(canvas) {
  const rect = canvas.getBoundingClientRect();
  const scale = devicePixelRatio || 1;
  canvas.width = rect.width * scale;
  canvas.height = rect.height * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  return [ctx, rect.width, rect.height];
}

// ==================== Color Mapping ====================
// Map visible-spectrum wavelength (nm) to approximate RGB for display

function spectrumColour(nm) {
  let r = 0, g = 0, b = 0;
  if (nm < 440) {
    r = (440 - nm) / 60;
    b = 1;
  } else if (nm < 490) {
    g = (nm - 440) / 50;
    b = 1;
  } else if (nm < 510) {
    g = 1;
    b = (510 - nm) / 20;
  } else if (nm < 580) {
    r = (nm - 510) / 70;
    g = 1;
  } else if (nm < 645) {
    r = 1;
    g = (645 - nm) / 65;
  } else {
    r = 1;
  }
  
  // Normalize and convert to CSS
  const gamma = 0.8;
  const toSRGB = (linear) => Math.round(255 * Math.pow(Math.max(0, linear), 1 / gamma));
  return `rgb(${toSRGB(r)}, ${toSRGB(g)}, ${toSRGB(b)})`;
}

// ==================== Physics Model ====================
// Core interference equations

function physics(input) {
  const lambda = wavelengthMicrometres(input.wavelength);
  
  // Round-trip optical path difference (both forward and return travel)
  const opd = 2 * Math.abs(input.armB - input.armA);
  
  // Phase from OPD plus user-added offset
  const offset = input.phaseOffset * Math.PI / 180;
  const phase = TAU * (opd / lambda) + offset;
  
  // Normalized intensity for equal beams: I/Imax = [1 + γ cos(φ)] / 2
  const gamma = input.coherence / 100;
  const intensity = 0.5 * (1 + gamma * Math.cos(phase));
  
  // Fringe order (number of wavelengths in the OPD)
  const fringeOrder = opd / lambda;
  
  // Visibility: V = γ (limited by coherence)
  const visibility = gamma;
  
  return {
    lambda,
    opd,
    phase,
    intensity,
    gamma,
    fringeOrder,
    visibility
  };
}

// ==================== Formatting ====================

function formatSigned(value, digits = 3) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;
}

function formatPhase(radians) {
  const degrees = (radians / Math.PI) * 180;
  const normalized = ((degrees % 360) + 360) % 360;
  return `${normalized.toFixed(1)}° (${(radians / Math.PI).toFixed(2)}π rad)`;
}

// ==================== Diagram Rendering ====================
// Draw the Michelson interferometer optical layout with animated arms

function drawDiagram(input, model, colour) {
  const [ctx, w, h] = canvasContext($("diagram"));
  
  const splitX = w * 0.48;
  const beamY = h * 0.55;
  const mirrorX = w * 0.82;
  const mirrorAY = h * 0.35;
  const mirrorBY = h * 0.75;
  
  // Background
  ctx.fillStyle = "#07111f";
  ctx.fillRect(0, 0, w, h);
  
  // Annotations
  ctx.fillStyle = "#a1b8d0";
  ctx.font = "11px monospace";
  ctx.textAlign = "left";
  
  // ---- Light Source ----
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(w * 0.08, beamY, 8, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#a1b8d0";
  ctx.textAlign = "center";
  ctx.fillText("Laser", w * 0.08, beamY + 20);
  
  // ---- Beam Splitter ----
  ctx.strokeStyle = "#58e6ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(splitX - 12, beamY - 12);
  ctx.lineTo(splitX + 12, beamY + 12);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillText("BS", splitX + 20, beamY - 8);
  
  // ---- Incident Beam ----
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(w * 0.12, beamY);
  ctx.lineTo(splitX - 8, beamY);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // ---- Arm A (vertical) ----
  const armALength = input.armA;
  const maxArmLength = 200;
  const armAVisualLength = (armALength / maxArmLength) * (mirrorAY - beamY - 20);
  
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(splitX, beamY);
  ctx.lineTo(splitX, beamY - armAVisualLength);
  ctx.stroke();
  
  // Mirror A
  ctx.fillStyle = "#ffd166";
  ctx.fillRect(splitX - 14, beamY - armAVisualLength - 2, 28, 4);
  ctx.fillStyle = "#a1b8d0";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`M_A`, splitX, beamY - armAVisualLength - 10);
  ctx.fillText(`${armALength.toFixed(2)} nm`, splitX, beamY - armAVisualLength + 15);
  
  // ---- Arm B (horizontal) ----
  const armBLength = input.armB;
  const armBVisualLength = (armBLength / maxArmLength) * (mirrorX - splitX - 20);
  
  ctx.beginPath();
  ctx.moveTo(splitX, beamY);
  ctx.lineTo(splitX + armBVisualLength, beamY);
  ctx.stroke();
  
  // Mirror B
  ctx.fillStyle = "#ffd166";
  ctx.fillRect(splitX + armBVisualLength - 2, beamY - 14, 4, 28);
  ctx.fillStyle = "#a1b8d0";
  ctx.textAlign = "center";
  ctx.fillText(`M_B`, splitX + armBVisualLength + 12, beamY - 8);
  ctx.fillText(`${armBLength.toFixed(2)} nm`, splitX + armBVisualLength, beamY + 18);
  
  // ---- Recombined Beam ----
  const recombineX = splitX + armBVisualLength * 0.5;
  ctx.beginPath();
  ctx.moveTo(splitX, beamY);
  ctx.lineTo(recombineX, beamY + 40);
  ctx.stroke();
  
  // Detector
  ctx.fillStyle = colour;
  ctx.globalAlpha = 0.3;
  ctx.fillRect(recombineX - 16, beamY + 40, 32, 32);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2;
  ctx.strokeRect(recombineX - 16, beamY + 40, 32, 32);
  ctx.fillStyle = "#a1b8d0";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Det", recombineX, beamY + 68);
  
  // ---- Label: OPD ----
  ctx.fillStyle = "#58e6ff";
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`OPD: ${model.opd.toFixed(3)} nm`, 12, 24);
  ctx.fillText(`Phase: ${formatPhase(model.phase)}`, 12, 40);
  ctx.fillText(`λ: ${input.wavelength} nm`, 12, 56);
}

// ==================== Plot Rendering ====================
// Draw intensity vs. optical path difference with smooth sinusoidal curve

function drawPlot(input, model, colour) {
  const [ctx, w, h] = canvasContext($("plot"));
  
  const box = { left: 48, right: 12, top: 14, bottom: 28 };
  const pw = w - box.left - box.right;
  const ph = h - box.top - box.bottom;
  const span = 8 * model.lambda;
  
  // Background
  ctx.fillStyle = "#07111f";
  ctx.fillRect(0, 0, w, h);
  
  // Axes
  ctx.strokeStyle = "#294a6b";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(box.left, box.top);
  ctx.lineTo(box.left, box.top + ph);
  ctx.lineTo(box.left + pw, box.top + ph);
  ctx.stroke();
  
  // Grid and wavelength markers
  ctx.strokeStyle = "#1a3a52";
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 8; i++) {
    const x = box.left + (i / 8) * pw;
    ctx.beginPath();
    ctx.moveTo(x, box.top + ph);
    ctx.lineTo(x, box.top + ph + 4);
    ctx.stroke();
    
    if (i % 2 === 0) {
      ctx.beginPath();
      ctx.moveTo(x, box.top);
      ctx.lineTo(x, box.top + ph);
      ctx.stroke();
    }
  }
  
  // Draw intensity curve with smooth bezier-like interpolation
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  // Increase resolution for smoother curve
  const resolution = 200;
  for (let i = 0; i <= resolution; i++) {
    const t = i / resolution;
    
    // Shift the curve based on current OPD
    const currentPhase = model.phase;
    const currentOPD = model.opd;
    
    // Map t to OPD space, centered around current OPD
    const opdOffset = -span / 2 + t * span;
    const phaseOffset = TAU * (opdOffset / model.lambda) + currentPhase - TAU * (currentOPD / model.lambda);
    
    const gamma = input.coherence / 100;
    const intensity = 0.5 * (1 + gamma * Math.cos(phaseOffset));
    
    const x = box.left + t * pw;
    const y = box.top + ph * (1 - intensity);
    
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  
  // Mark current position on the curve
  const centerT = 0.5;
  const centerX = box.left + centerT * pw;
  const centerY = box.top + ph * (1 - model.intensity);
  
  ctx.fillStyle = "#58e6ff";
  ctx.beginPath();
  ctx.arc(centerX, centerY, 5, 0, TAU);
  ctx.fill();
  
  ctx.strokeStyle = "#58e6ff";
  ctx.lineWidth = 0.5;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(centerX, box.top + ph);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Axis labels
  ctx.fillStyle = "#a1b8d0";
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.fillText("OPD (nm)", w / 2, h - 4);
  ctx.save();
  ctx.translate(12, h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText("Intensity", 0, 0);
  ctx.restore();
  
  // OPD range labels
  ctx.textAlign = "center";
  ctx.fillText("−4λ", box.left, box.top + ph + 16);
  ctx.fillText("0", box.left + pw / 2, box.top + ph + 16);
  ctx.fillText("+4λ", box.left + pw, box.top + ph + 16);
}

// ==================== Coherence Indicator ====================

function updateCoherenceIndicator(coherence) {
  const bar = $("coherenceIndicator").querySelector(".coherence-bar");
  bar.style.width = coherence + "%";
  
  // Color gradient: red (poor) → yellow → green (excellent)
  const hue = (coherence / 100) * 120;
  bar.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;
}

// ==================== Display Update ====================

function render() {
  const input = readInputs();
  const model = physics(input);
  const colour = spectrumColour(input.wavelength);
  
  // Update slider outputs
  $("wavelengthOut").textContent = `${input.wavelength} nm`;
  $("armAOut").textContent = `${input.armA.toFixed(1)} nm`;
  $("armBOut").textContent = `${input.armB.toFixed(1)} nm`;
  $("phaseOffsetOut").textContent = `${input.phaseOffset.toFixed(1)}°`;
  $("coherenceOut").textContent = `${input.coherence.toFixed(1)}%`;
  
  // Update derived quantities
  $("opdDisplay").textContent = `${model.opd.toFixed(3)} nm`;
  $("phaseDiff").textContent = formatPhase(model.phase);
  $("fringeOrder").innerHTML = `${model.fringeOrder.toFixed(2)} (${(model.fringeOrder % 1).toFixed(3)} fringes)`;
  $("visibility").textContent = `${(model.visibility * 100).toFixed(1)}%`;
  
  // Update intensity display
  $("intensity").textContent = model.intensity.toFixed(3);
  $("intensityMin").textContent = (0.5 * (1 - model.gamma)).toFixed(3);
  $("intensityMax").textContent = (0.5 * (1 + model.gamma)).toFixed(3);
  $("contrast").textContent = `${(model.gamma * 100).toFixed(1)}%`;
  
  // Intensity formula
  $("intensityFormula").innerHTML = `${model.intensity.toFixed(3)} = ½[1 + ${model.gamma.toFixed(3)} × cos(${(model.phase / Math.PI).toFixed(2)}π)]`;
  
  // Interference state
  let state;
  if (Math.abs(model.phase % TAU - Math.PI) < 0.2) {
    state = "🌑 Destructive interference (dark)";
  } else if (Math.abs(model.phase % TAU) < 0.2) {
    state = "☀️ Constructive interference (bright)";
  } else {
    state = "📊 Partial interference";
  }
  $("interferenceState").textContent = state;
  
  // Spectrum color
  const colorBox = $("spectrumColor");
  colorBox.style.backgroundColor = colour;
  
  // Update visualizations
  drawDiagram(input, model, colour);
  drawPlot(input, model, colour);
  updateCoherenceIndicator(input.coherence);
}

// ==================== Event Listeners ====================

Object.values(controls).forEach((control) => {
  if (control) control.addEventListener("input", render);
});

$("reset").addEventListener("click", () => {
  Object.entries(defaults).forEach(([key, value]) => {
    const sliderId = key.endsWith("Input") ? key.replace("Input", "") : key;
    const inputId = key.endsWith("Input") ? key : key + "Input";
    
    if ($(sliderId)) $(sliderId).value = value;
    if ($(inputId)) $(inputId).value = value / 1000; // Show in nm
  });
  render();
});

$("quarterWave").addEventListener("click", () => {
  const wavelength = Number(controls.wavelength.value);
  const lambda = wavelengthMicrometres(wavelength);
  const quarterWaveLength = lambda / 4 * 1000; // Convert to pm
  
  const currentArmB = Number(controls.armB.value);
  const newArmB = currentArmB + quarterWaveLength;
  
  const max = Number(controls.armB.max);
  if (newArmB <= max) {
    controls.armB.value = newArmB;
    controls.armBInput.value = (newArmB / 1000).toFixed(1);
  } else {
    alert(`Cannot move Arm B by λ/4 (${(quarterWaveLength / 1000).toFixed(4)} nm): would exceed maximum length.`);
  }
  
  render();
});

addEventListener("resize", render);

// Initial render
render();
