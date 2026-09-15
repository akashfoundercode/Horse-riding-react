# 🏇 Horse Race Arena (React)

Landscape-only, mobile-responsive horse racing game — 12 horses race across
the track using a real-photo sprite animation (built from your 4 uploaded
frames, combined into `public/sprites/horse-run-sheet.png` and cycled with
a CSS `steps(4)` animation — same technique as a GIF, but pure CSS so it
stays smooth with 12 horses running together). There's a 3-2-1 countdown, a
slow-motion photo-finish stretch near the line, and a result screen with a
Photo Finish card + winner card, matching the reference screenshots.

Since only one horse's photo set was provided, each lane is given a
distinct look with a CSS color filter (hue-rotate/saturate/brightness) —
this also tints the jockey's silks differently per horse, similar to real
race colours. Drop in more 4-frame sets later (e.g. `h2f1.png..h2f4.png`)
in `public/sprites/` and update `Horse.jsx` if you want fully unique photos
per horse instead of the filter trick.

## Chalane ka tarika (Run karne ke steps)

```bash
npm install
npm run dev        # local development, http://localhost:5173
```

Production build banane ke liye:

```bash
npm run build       # dist/ folder me output milega
npm run preview     # build ko test karne ke liye
```

`dist/` folder ko kisi bhi static host (Netlify, Vercel, Hostinger, cPanel
etc.) pe upload kar dijiye — yeh pure static app hai, koi backend nahi
chahiye.

## Features

- **Landscape-locked responsive layout** — chhota phone ho ya tablet, track
  hamesha `100vw x 100dvh` me fit hota hai. Portrait me pakadne par ek
  "screen ghumaiye" prompt dikhta hai.
- **12 horses**, har ek alag rang/pace/surge pattern ke saath — SVG legs +
  body CSS keyframes se gallop karte hain (ek self-contained "gif" jaisa
  effect, bina kisi external image ke).
- **3-2-1 countdown → race → finish-line slow-down → photo finish flash →
  result modal**, jaisa screenshots me dikhaya gaya tha.
- **Bottom horse-number strip** — race shuru hone se pehle horse select
  karke bet lagayi ja sakti hai; jeetne par payout milta hai, warna
  "You Won 0".
- **Scoreboard side strip** — reference screenshot ke building/tree motif
  ko CSS shapes se recreate kiya gaya hai (koi external asset nahi).

## Project structure

```
src/
  App.jsx              # game state, race loop, countdown, result modal
  index.css            # landscape layout, gallop keyframes, theming
  components/
    Horse.jsx           # vector horse ("gif" replacement) with gallop legs
```

Sab kuch plain React + CSS hai — koi extra animation library nahi, isliye
build chhota aur fast hai.
# Horse-riding-react
