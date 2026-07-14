"use strict";

// Interferometer Lab: all distance values below are in micrometres (µm).
// Using µm lets a 400–740 nm visible wavelength be written as 0.400–0.740 µm.
const $ = (id) => document.getElementById(id);
const controls = ["wavelength", "armA", "armB", "phaseOffset", "coherence"].map($);
const defaults = { wavelength: 532, armA: 500, armB: 501, phaseOffset: 0, coherence: 100 };
const TAU = 2 * Math.PI;

function readInputs() { return Object.fromEntries(controls.map((input) => [input.id, Number(input.value)])); }
function wavelengthMicrometres(nanometres) { return nanometres / 1000; }

// A canvas' CSS size and its bitmap size differ on high-DPI displays. Scaling
// the drawing context keeps lines sharp without changing the physics model.
function canvasContext(canvas) { const rect = canvas.getBoundingClientRect(); const scale = devicePixelRatio || 1; canvas.width = rect.width * scale; canvas.height = rect.height * scale; const context = canvas.getContext("2d"); context.scale(scale, scale); return [context, rect.width, rect.height]; }

// Approximate visible-spectrum colour for the diagram only; calculations use
// the actual numeric wavelength, never this display colour.
function spectrumColour(nm) { let r=0,g=0,b=0; if(nm<440){r=(440-nm)/60;b=1;}else if(nm<490){g=(nm-440)/50;b=1;}else if(nm<510){g=1;b=(510-nm)/20;}else if(nm<580){r=(nm-510)/70;g=1;}else if(nm<645){r=1;g=(645-nm)/65;}else{r=1;} return `rgb(${Math.round(255*r)},${Math.round(255*g)},${Math.round(255*b)})`; }

// For equal returning beam intensities, normalized intensity is
// I/Imax = [1 + γ cos(φ)] / 2.  γ (0–1) is the degree of coherence.
function physics(input) { const lambda = wavelengthMicrometres(input.wavelength); const opd = 2 * (input.armB - input.armA); const offset = input.phaseOffset * Math.PI / 180; const phase = TAU * opd / lambda + offset; const gamma = input.coherence / 100; const intensity = (1 + gamma * Math.cos(phase)) / 2; return { lambda, opd, phase, gamma, intensity, fringeOrder: opd / lambda }; }

function formatSigned(value, digits=3) { return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`; }
function drawDiagram(colour) { const [ctx,w,h] = canvasContext($("diagram")); const splitX=w*.48, beamY=h*.59; ctx.fillStyle="#07111f";ctx.fillRect(0,0,w,h); ctx.save();ctx.globalAlpha=.16;ctx.strokeStyle=colour;ctx.lineWidth=15;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(24,beamY);ctx.lineTo(splitX,beamY);ctx.lineTo(splitX,h*.18);ctx.moveTo(splitX,beamY);ctx.lineTo(w*.84,beamY);ctx.stroke();ctx.restore();ctx.strokeStyle=colour;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(24,beamY);ctx.lineTo(splitX,beamY);ctx.lineTo(splitX,h*.18);ctx.moveTo(splitX,beamY);ctx.lineTo(w*.84,beamY);ctx.stroke();ctx.strokeStyle="#d7eaff";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(splitX-13,beamY+13);ctx.lineTo(splitX+13,beamY-13);ctx.stroke();ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(splitX-35,h*.15);ctx.lineTo(splitX+35,h*.15);ctx.moveTo(w*.84,beamY-35);ctx.lineTo(w*.84,beamY+35);ctx.stroke();ctx.fillStyle=colour;ctx.beginPath();ctx.arc(24,beamY,7,0,TAU);ctx.fill();ctx.fillStyle="#ffd166";ctx.beginPath();ctx.arc(w*.9,beamY,8,0,TAU);ctx.fill();ctx.fillStyle="#9db8d0";ctx.font="12px system-ui";ctx.fillText("laser",19,beamY-16);ctx.fillText("beam splitter",splitX-39,beamY+33);ctx.fillText("mirror A",splitX-24,h*.1);ctx.fillText("mirror B",w*.77,beamY+53);ctx.fillText("detector",w*.86,beamY-17); }
function drawPlot(input, model, colour) { const [ctx,w,h] = canvasContext($("plot")); const box={left:32,right:12,top:14,bottom:25}, pw=w-box.left-box.right, ph=h-box.top-box.bottom, span=8*model.lambda;ctx.fillStyle="#081727";ctx.fillRect(0,0,w,h);ctx.strokeStyle="#274562";for(let n=0;n<5;n++){const y=box.top+n*ph/4;ctx.beginPath();ctx.moveTo(box.left,y);ctx.lineTo(w-box.right,y);ctx.stroke();}ctx.strokeStyle=colour;ctx.lineWidth=2;ctx.beginPath();for(let px=0;px<=pw;px++){const path=px/pw*span-span/2;const y=(1+model.gamma*Math.cos(TAU*path/model.lambda+input.phaseOffset*Math.PI/180))/2;const py=box.top+(1-y)*ph;px?ctx.lineTo(box.left+px,py):ctx.moveTo(box.left+px,py);}ctx.stroke();const marker=box.left+(model.opd+span/2)/span*pw;ctx.strokeStyle="#ffd166";ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(marker,box.top);ctx.lineTo(marker,box.top+ph);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle="#9db8d0";ctx.font="10px system-ui";ctx.fillText("0",10,box.top+ph);ctx.fillText("1",10,box.top+5);ctx.fillText("OPD (µm)",w/2-25,h-5); }

function render() { const input=readInputs(), model=physics(input), colour=spectrumColour(input.wavelength); $("wavelengthOut").textContent=`${input.wavelength} nm`;$("armAOut").textContent=`${input.armA.toFixed(3)} µm`;$("armBOut").textContent=`${input.armB.toFixed(3)} µm`;$("phaseOffsetOut").textContent=`${input.phaseOffset}°`;$("coherenceOut").textContent=`${input.coherence}%`;$("intensity").textContent=`${(model.intensity*100).toFixed(1)}%`;const cosine=Math.cos(model.phase);$("interferenceState").textContent=cosine>.9?"Near constructive interference (bright fringe).":cosine<-.9?"Near destructive interference (dark fringe).":"Intermediate interference.";$("opd").textContent=`${formatSigned(model.opd)} µm`;$("phaseDifference").textContent=`${(model.phase*180/Math.PI).toFixed(1)}°`;$("fringeOrder").textContent=model.fringeOrder.toFixed(3);$("equation").textContent=`I/Imax = ½ [1 + γ cos(2πΔ/λ + φ₀)] = ${model.intensity.toFixed(4)}`;drawDiagram(colour);drawPlot(input,model,colour); }
controls.forEach((control) => control.addEventListener("input", render));
$("reset").addEventListener("click", () => { Object.entries(defaults).forEach(([key,value]) => { $(key).value=value; }); render(); });
// Moving one mirror by λ/4 changes the round-trip OPD by λ/2, shifting phase by π.
$("quarterWave").addEventListener("click", () => { $("armB").value = (Number($("armB").value) + wavelengthMicrometres(Number($("wavelength").value))/4).toFixed(3); render(); });
addEventListener("resize", render); render();
