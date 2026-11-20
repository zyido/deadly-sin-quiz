# 7 Deadly Sins Test

A 14-question quiz that scores all seven sins and ranks them, so the result is
"pride 82, envy 61, sloth 30…" instead of a single label. Static HTML + JS,
no backend, no sign-up, shareable result links.

> Unofficial fan project. Not affiliated with, endorsed by, or sponsored by any
> studio. Results are for entertainment only and are not a personality
> assessment.

## What's here

| File | What it does |
| --- | --- |
| `index.html` | Page shell: the quiz markup, fonts, script tag |
| `quiz.js` | Answer state, weighted scoring, ranking, result rendering |
| `questions.json` | The 14 situations, their answer weights, and the result copy |
| `styles.css` | Layout only, no framework |
| `assets/` | Start button and the seven medallions (one sprite strip) |

## How the scoring works

Every answer adds weighted points to one or more of the seven sins. The totals
are normalised, sorted, and the top sin becomes the headline result while the
rest are shown as a ranked list.

## Swapping in your own quiz

1. Keep the sin keys (`pride`, `greed`, `lust`, `envy`, `gluttony`, `wrath`,
   `sloth`) — the ranking reads them by name.
2. Rewrite `questions.json`: each question is a prompt plus 2–4 answers, each
   answer carries a weight per sin.
3. Set `resultCopy` for each sin. Everything else (progress, ranking, share
   link) works unchanged.

Weights do not have to sum to the same number per question — scoring is
normalised at the end, so uneven weights are fine.

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Links

- Take the test — https://mydeadlysin.com/
- What each of the seven sins means — https://mydeadlysin.com/seven-deadly-sins-explained
- The seven sins and the seven heavenly virtues — https://mydeadlysin.com/seven-deadly-sins-and-heavenly-virtues

## Notes

The result page never claims to diagnose anything. If you fork this for a
different topic, keep that framing — it is what keeps a quiz page out of
trouble.

## License

MIT for the code. Question text is original to this project.
