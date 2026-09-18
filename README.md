# Piano Prep — 2-Month Accompaniment Hub

A practice hub for going from **zero piano knowledge** to comfortably accompanying yourself on ~127 songs from your YouTube Music playlist, built around one core idea:

> Pop songs (Thai ballads especially) reuse a small set of chord progressions. Learn a progression + a left-hand pattern once, and you can sight-read it across every song that shares it — you don't need to memorize each song individually.

## Why not "master all 127 songs"?

At 30–45 min/day for 2 months (~30–45 hours total), true memorized mastery of 127 songs isn't physically possible — see the math in the app's Dashboard intro. Instead:

- **Foundation tier** (~12–14 songs): your clear favorites + the easiest entries, practiced to real fluency over 2 months.
- **Stretch tier**: songs that share a progression family/pattern you've already learned — playable by sight-reading the chart once the foundation skills are solid.
- **Reference tier**: everything else, cataloged with chords ready so you can pick them up any time after month 2 using the same skills.

## Using the hub

Open `index.html` in a browser (double-click works — no server needed, no build step, no dependencies).

- **Dashboard** — progress stats, streak, today's suggested song.
- **Song Library** — all songs, filterable by tier / progression family / practice status. Click a song for its chord chart, key, suggested left-hand pattern, and a YouTube link (lyrics stay on YouTube — copyright).
- **Technique Library** — fingering basics, chord shapes, the 6 left-hand accompaniment patterns, and the chord-progression families explained in plain language.
- **2-Month Schedule** — week-by-week plan, skill-first: weeks 1–2 are fundamentals, then each week unlocks a new progression family/pattern and the cluster of songs it applies to.

Progress (song status: not started / learning / comfortable / mastered) is saved in your browser's `localStorage` — it's per-browser/device, nothing is sent anywhere.

## Editing / adding data

Source data lives in `data/*.json`:

- `data/songs.json` — one entry per song (title, artist, key, chords, progression family, difficulty, suggested pattern, chord source).
- `data/technique.json` — the curriculum content (fundamentals, chord shapes, patterns, progression families, practice method).
- `data/schedule.json` — the week-by-week plan.

After editing any of these, regenerate the bundled `data/data.js` that the app actually loads:

```
python3 data/generate.py
```

### Chord data notes

Chords were researched from public chord-chart sites (dochord.com and similar) plus well-documented standard chords for well-known English pop songs. Each song's `confidence` field is `"verified"` (found a real chart) or `"estimated"` (inferred from genre/artist convention when no chart was found) — check the `source` field before trusting an estimated entry, and feel free to correct any entry once you find better sheet.

Full song lyrics are intentionally **not** stored here (copyright) — each song links out to YouTube instead.
