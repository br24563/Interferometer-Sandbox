# Interferometer Sandbox

A dependency-free, browser-based teaching lab for a Michelson interferometer.
Open `index.html` in a modern browser—there is no install or build step.

## What it models

- Round-trip optical path difference: `Δ = 2(LB − LA)`.
- Phase difference: `φ = 2πΔ/λ + φ0`.
- Equal-beam normalized intensity: `I/Imax = ½[1 + γ cos(φ)]`.

The code is deliberately commented for students. `app.js` contains the model;
`styles.css` contains only presentation; `index.html` provides semantic controls.
The contrast control is the degree of coherence `γ`, not a separate physical
source of phase. Set it to 100% for the ideal coherent-laser experiment.
