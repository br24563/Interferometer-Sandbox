# Professional Michelson Interferometer Lab

A rigorous, browser-based simulation of a Michelson interferometer with precise optical path control and professional-grade visualizations. Open `index.html` in a modern browser—no install, build, or dependencies required.

## Features

### ✓ Dual Input Controls
- **Slider** for rapid exploration and smooth parameter sweep
- **Numeric input** (with focus blur) for nm-precision quantitative measurements
- Synchronized bidirectional updates

### ✓ Improved Unit Scaling
- **Wavelengths:** 380–740 nm (visible spectrum)
- **Arm lengths:** 0–200 µm (submicron-precision slider steps of 0.01 µm)
- Slider ranges chosen to prevent runaway parameter changes; fine control preserved

### ✓ Animated Optical Diagram
- Michelson interferometer schematic with labeled beam splitter, mirrors, detector
- **Mirror positions scale with arm lengths**: grow arm A or B geometrically and see the mirror move
- Current optical path difference (OPD) and phase displayed in real time
- Spectrum color reflects the selected wavelength

### ✓ Comprehensive Coherence Model
- **Degree of coherence γ** (0–100%) controls fringe visibility
- **Visual coherence indicator**: color gradient (red=poor, green=excellent)
- Frequency-domain explanation: γ represents finite spectral linewidth
- At γ=100% (ideal laser), fringes have maximum contrast; lower values degrade fringe quality
- **Visibility V = γ**: mathematically defined as (I_max − I_min) / (I_max + I_min)

### ✓ Real-Time Derived Quantities
- **Optical Path Difference (OPD):** 2|L_B − L_A| µm
- **Phase difference:** 2π(OPD)/λ + φ₀ (displayed in degrees and radians)
- **Fringe order:** number of wavelengths in the OPD
- **Normalized intensity:** I/I_max = ½[1 + γ cos(φ)]
- **Interference state:** "Constructive," "Destructive," or "Partial"

### ✓ Dual Visualizations
1. **Intensity vs. OPD plot** shows the full interference curve with coherence envelope; current operating point marked
2. **Optical diagram** displays the setup and current arm configuration

### ✓ Professional UI
- Dark theme optimized for scientific displays
- High-DPI canvas scaling for crisp rendering on Retina / 4K displays
- Responsive grid layout (single column on mobile)
- Measurement tips and equation reference

## Physics Model

### Normalized Intensity (Equal Beams)
```
I/Imax = ½[1 + γ cos(φ)]
```

Where:
- **φ = 2π(OPD)/λ + φ₀** — total phase difference in radians
- **OPD = 2|L_B − L_A|** — round-trip optical path difference (both forward and return travel)
- **γ ∈ [0, 1]** — degree of coherence (temporal coherence factor)
- **λ** — vacuum wavelength in the same units as OPD

### Fringe Order
```
m = OPD / λ
```
Tells you how many wavelengths fit in the current path difference.

### Visibility
```
V = (I_max − I_min) / (I_max + I_min) = γ
```
At γ = 1 (perfect coherence), V = 1 (ideal fringes). At γ = 0 (incoherent), V = 0 (no fringes).

## Experimental Tips

1. **Set coherence to 100%** for an ideal single-frequency laser. Reduce it to simulate a thermal or broadband source.
2. **Use numeric inputs** for precise measurements (e.g., to place the OPD at an exact multiple of λ/4).
3. **Use sliders** for interactive exploration and fringe scanning.
4. **Press "Move B by λ/4"** repeatedly to step through fringes. Each click advances the phase by π (half a fringe).
5. **Scan the arm difference** near zero OPD to see maximum contrast; at large OPD, fringes wash out due to finite coherence.
6. **Observe the diagram**: as you adjust arm lengths, watch the mirrors move and see the OPD and phase update.

## Technical Highlights

- **Accuracy:** All calculations use IEEE 754 double-precision floating-point; wavelength-to-phase conversion is numerically stable.
- **Canvas rendering:** Drawing context is scaled for high-DPI displays to keep lines sharp.
- **Responsive:** Adapts from mobile (single column) to desktop (two-column grid).
- **Accessibility:** Semantic HTML with ARIA labels; keyboard-navigable inputs.
- **Pure JavaScript:** No external libraries or build tools.

## File Structure

- `index.html` — Semantic HTML with control groups, canvas elements, and derived-quantity display
- `app.js` — Physics engine, synchronization logic, and rendering (canvas drawing + DOM updates)
- `styles.css` — Professional dark theme, responsive grid, slider/input styling
- `README.md` — This file

## Browser Compatibility

Tested on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires `<canvas>`, ES6 (arrow functions, const/let, template literals), and CSS Grid.

## Future Enhancements

- Non-equal beam intensities (asymmetric splitter)
- Polarization control and Stokes parameters
- Data export (CSV of intensity trace)
- Thermal wavelength shifts
- Multiple wavelengths (white light fringes)
- Fresnel coefficients for different mirror types

---

Built for education and research in classical optics.
