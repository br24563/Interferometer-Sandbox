# Interferometer Lab — Optical Engineering Simulator

A rigorous, browser-based simulation of four canonical interferometer configurations.
Open `index.html` in any modern browser — no install, build step, or external dependencies required.

---

## Instruments

| Instrument | Physical principle | Key observable |
|---|---|---|
| **Michelson** | Round-trip two-beam interference | OPD = 2n(L_B − L_A) |
| **Mach–Zehnder** | Single-pass transmission interferometer | OPD = n·L_B − L_A |
| **Fabry–Pérot** | Multiple-beam etalon (Airy function) | Finesse ℱ, FSR |
| **Sagnac** | Non-reciprocal ring interferometer | Sagnac phase ∝ Ω |

---

## Physics Models

### Michelson & Mach–Zehnder — two-beam interference

```
I / I₀ = ½ [ 1 + γ cos(φ) ]
```

| Symbol | Meaning |
|---|---|
| `φ = 2π·OPD/λ + φ₀` | Total phase difference (rad) |
| `OPD = 2n(L_B − L_A)` | Michelson round-trip path difference (nm) |
| `OPD = n·L_B − L_A` | Mach–Zehnder single-pass path difference (nm) |
| `γ ∈ [0, 1]` | Degree of temporal coherence (fringe visibility) |
| `λ` | Vacuum wavelength (nm) |

Fringe visibility `V = (I_max − I_min)/(I_max + I_min) = γ`.

### Fabry–Pérot — Airy transmission function

```
T = 1 / [ 1 + F · sin²(φ/2) ]
```

| Symbol | Meaning |
|---|---|
| `F = 4R / (1 − R)²` | Coefficient of finesse |
| `φ = 2π · 2nL / λ` | Round-trip cavity phase |
| `ℱ = π√R / (1 − R)` | Finesse (sharpness of peaks) |
| `FSR = λ² / (2nL)` | Free spectral range (wavelength units) |

Peak transmission at `φ = 2mπ`; FWHM per peak = FSR / ℱ.
Resolving power = `m · ℱ`.

### Sagnac — non-reciprocal ring interferometer

```
φ_S = 8π · N · A · Ω / (λ · c)
```

| Symbol | Meaning |
|---|---|
| `N` | Number of fibre coil turns |
| `A = πr²` | Single-loop area (m²) |
| `Ω` | Platform angular velocity (rad/s) |
| `λ` | Vacuum wavelength (m) |
| `c` | Speed of light (m/s) |

Scale factor `dφ/dΩ = 8πNA/(λc)` — linear in N, A and 1/λ.
Earth rotation rate ≈ 15°/hr = 4.17 × 10⁻³ °/s; FOG gyroscopes resolve < 0.001°/hr.

---

## Features

### Controls
- **Dual slider + numeric input** for every parameter — sliders for rapid exploration, numeric inputs for sub-wavelength precision.
- **Source presets**: He-Ne 632.8 nm, Nd:YAG 532 nm, Na-D 589.3 nm, Ar⁺ 488/514.5 nm, diode 780 nm, or any custom wavelength.
- **Length units**: switch between nm, µm, mm at any time — all values convert automatically.
- **Coherence γ** (0–100%): models temporal coherence; at 100% fringes have maximum contrast; lower values wash out fringes as for an LED or multimode source.

### Visualisations
1. **Optical diagram** — annotated schematic with correct component layout, labelled beam paths, and a live OPD/φ/λ annotation overlay.
2. **Fringe pattern canvas** — wavelength-correct pixel rendering:
   - *Michelson/MZI*: equal-inclination circular fringes (Haidinger-type) or straight wedge fringes when mirror tilt > 0.
   - *Fabry–Pérot*: Haidinger ring pattern using the exact Airy transmission function.
   - *Sagnac*: I(Ω) sweep image showing the current rotation rate and Earth-rate marker.
3. **Intensity vs OPD plot** — fixed ±4λ window with a faint coherence-envelope band so the effect of reducing γ is immediately visible. Fabry–Pérot shows the Airy curve; Sagnac shows I(Ω).
4. **Detector signal panel** — normalised intensity I/I₀, fringe min/max, visibility, and interference state (constructive / destructive / partial).
5. **Derived quantities table** — phase difference, fringe order m, visibility V, coherence length ℓ_c, spectrum colour swatch, and instrument-specific quantities (ℱ, FSR, Sagnac scale factor).
6. **Physical model card** — live equation block with current parameter values substituted in.

### Rendering pipeline
- All canvas draws are coalesced through `requestAnimationFrame` — fast slider sweeps never trigger more than one repaint per frame.
- High-DPI aware: canvases are sized with `devicePixelRatio` so lines are crisp on Retina and 4K displays.
- Fringe patterns are rendered pixel-by-pixel using the exact physical intensity formula — no lookup tables or approximations.

---

## Controls Reference

| Control | Range | Notes |
|---|---|---|
| Vacuum wavelength λ | 380–780 nm | Visible spectrum; affects fringe scale and beam colour |
| Coherence γ | 0–100% | 100% = ideal CW laser; 0% = fully incoherent |
| Arm / cavity length | 0–1 mm | Displayed in selected unit; internal storage always nm |
| Refractive index n | 1.0–3.0 | Applied to sample arm (MZI) or cavity medium (FP) |
| Mirror reflectivity R | 0–99% | Fabry–Pérot only; drives finesse ℱ |
| Rotation rate Ω | ±1000 °/s | Sagnac only; positive = CCW |
| Fibre turns N | 1–5000 | Sagnac only; scales effective area linearly |
| Fringe aperture | 0.1–50 mm (or mrad) | Spatial FOV of fringe canvas |
| Mirror tilt θ | 0–30 mrad | Converts circular to straight fringes (Michelson/MZI) |
| Phase offset φ₀ | 0–360° | Electronic phase bias on detector |

**+λ/4 / +λ/2 buttons** — step Arm B by one quarter or half wavelength; equivalent to a precision PZT mirror scan. On the Sagnac tab these buttons shift the electronic phase offset instead.

---

## Experimental Tips

1. **He-Ne at zero OPD** — set both arms equal and coherence to 100%; the detector reads maximum brightness (constructive). Add a λ/4 step to reach the dark fringe.
2. **Coherence scan** — at a large OPD (e.g. 100 µm), reduce coherence from 100% down to 10% and watch the fringes wash out while the average intensity stays constant.
3. **Fabry–Pérot finesse** — set R = 95%; ℱ ≈ 61. The plot shows narrow Airy peaks. Compare to R = 50%; ℱ ≈ 2 — peaks become as broad as a two-beam fringe.
4. **Sagnac scale factor** — increase fibre turns from 100 to 1000; the scale factor (and fringe density in the I(Ω) plot) grows proportionally. This is how real FOGs achieve high sensitivity without a larger coil.
5. **Wedge fringes** — on Michelson, set tilt θ > 0.1 mrad and watch the circular fringes snap into straight parallel lines with spacing Λ = λ/(2θ). A golden bracket annotation shows the fringe period.

---

## Technical Notes

### Accuracy
- All calculations use IEEE 754 double-precision floating-point.
- The spectrum-to-RGB conversion uses the Bruton (1996) piecewise model with correct sRGB gamma encoding (γ = 1/2.2) applied once to linear-light values, plus an eye-sensitivity rolloff at the spectral limits (< 420 nm, > 700 nm).
- The coherence length is modelled as ℓ_c = λ / (π(1 − γ)) — consistent with a Lorentzian lineshape where Δλ ≈ λ²/(π·ℓ_c).
- The Fabry–Pérot intensity blends the ideal Airy peak `T·γ` with an incoherent background `½(1 − γ)` — the correct treatment for partial temporal coherence.

### Performance
- `requestAnimationFrame` throttling: every slider, number-input, and button event calls `scheduleRender()` which posts at most one `rAF` callback per frame, eliminating redundant repaints during fast drags.
- `ResizeObserver` re-renders all three canvases whenever the layout changes (window resize, panel reflow).

### Accessibility
- All interactive elements have `aria-label` attributes.
- Tab buttons implement the WAI-ARIA `tablist`/`tab` pattern with `aria-selected`.
- `:focus-visible` keyboard navigation rings are shown only when using a keyboard (not on mouse clicks).
- `prefers-reduced-motion` suppresses all CSS transitions and animations.
- `inputmode="decimal"` on numeric inputs invokes the correct on-screen keyboard on mobile.

---

## File Structure

```
index.html   — Semantic HTML: controls, canvases, derived-quantity display
app.js       — Physics engine, state management, canvas rendering (no dependencies)
styles.css   — Dark optical-bench theme, responsive grid, accessibility rules, print styles
README.md    — This file
```

---

## Browser Compatibility

Requires `<canvas>`, ES2017+ (async/await not used, but `const`/`let`, arrow functions,
template literals, destructuring, `ResizeObserver`), and CSS Grid.

| Browser | Minimum version |
|---|---|
| Chrome / Edge | 90+ |
| Firefox | 88+ |
| Safari | 14+ |

---

## Possible Extensions

- Non-equal beam intensities (asymmetric beamsplitter ratio)
- Polarisation control and Jones-matrix propagation
- White-light / broadband source simulation (coherence envelope sampling)
- CSV export of intensity vs OPD trace
- Thermal / mechanical noise perturbation mode
- Fresnel-coefficient mirror model (angle-dependent phase shift)

---

*Built for education and research in classical wave optics.*
