# Contributing to Ghost Office

Small, focused improvements are welcome. This project is a scripted task-flow simulation, not a live LLM service. Keep that distinction clear in code, demos and documentation.

## Reproduce before changing

1. Download or clone the repository and run `python -m http.server 8000` inside it.
2. Open `http://localhost:8000` in a browser.
3. Note the seed, brief count, playback speed and browser version.
4. Start a new workday and reproduce the behavior.

When reporting a bug, include the expected result, actual result, settings and steps. A short recording or exported workday JSON can help. Only attach files you are comfortable making public; do not include credentials or unrelated personal data.

## Check a change

```sh
node test.cjs
```

Keep the engine independent of the browser and preserve its fixed simulation step. Tests must continue to cover single ownership, four handoffs per completed brief, continuous movement and workers returning home before the clock stops.

For interface changes, also check:

- A fresh workday with 1 and 12 briefs.
- Pause/resume, reset and all three speed settings.
- JSON export and supported-browser video recording.
- A narrow browser window and keyboard access to controls.
- Reduced-motion preference, which should start playback paused.

## Open a pull request

Describe the problem, the change and how you verified it. Add a regression test for engine fixes. Keep unrelated changes in separate pull requests, and preserve the original mascot rather than replacing it as part of an unrelated edit.
