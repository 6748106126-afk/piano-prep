# Piano Prep — 3-Month Accompaniment Hub

A practice hub for going from **zero piano knowledge** to comfortably accompanying yourself (and eventually playing melody) on all 127 songs from your YouTube Music playlist, built around one core idea:

> Pop songs (Thai ballads especially) reuse a small set of chord progressions. Learn a progression + a left-hand pattern once, and you can sight-read it across every song that shares it — you don't need to memorize each song individually.

## The 3-month shape

- **Months 1–2 (weeks 1–8):** foundations, then one new progression family + accompaniment pattern per week. Two tracks every week — **Deep-dive** (~14 Foundation songs, practiced to real fluency) and **Coverage** (every other song, sight-read once at slow tempo once its family is unlocked, with simplified triad-only chords for the 50 harder "complex-other" songs). All 127 songs get touched by the end of week 8.
- **Month 3 (weeks 9–12):** cleanup (close every open loop, re-practice anything shaky), then **melody** — right-hand tune over your left-hand pattern, taught as an ear-training skill (see below), applied to your favorite songs, finishing with full chords+melody run-throughs.

## Using the hub

Open `index.html` in a browser (double-click works — no server needed, no build step, no dependencies).

- **Dashboard** — progress stats, streak, today's suggested song, deliberate-practice spots due today.
- **Song Library** — all songs, filterable by tier / progression family / practice status. Click a song for its chord chart (plus a simplified version where relevant), key, suggested left-hand pattern, and a YouTube link (lyrics stay on YouTube — copyright).
- **Technique Library** — fingering basics, chord shapes, the 6 left-hand accompaniment patterns, chord-progression families, and (Month 3) how to find melody by ear.
- **2-Month Schedule** *(12-week plan)* — week-by-week, skill-first, with Deep-dive/Coverage/Melody song lists per week.
- **Deliberate Practice** — flag a specific trouble spot on any song, log clean/missed attempts, spaced-repetition scheduling (1/3/7/14/30 days) surfaces what's due today.
- **Song Data** — chord-symbol statistics across the whole library (progression families, most-used chords, keys, difficulty) — no lyrics involved, just the chord data.

Progress (song status, deliberate-practice spots) is saved in your browser's `localStorage` — it's per-browser/device, nothing is sent anywhere.

### On melody (Month 3)

No song's melody is transcribed anywhere in this app — a melody is the copyrighted part of a song (unlike chord symbols, which are functional/factual), so it can't be reproduced here. Month 3's melody content teaches the *skill* of finding a melody by ear over chords you already know, which transfers to every song, not just a transcribed few.

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
