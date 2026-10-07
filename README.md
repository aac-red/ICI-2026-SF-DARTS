# ICI 2026 SF Darts

A single-page scoreboard for a two-player **Cricket**-style darts game, built for the ICI 2026 Sports Fest. It runs entirely in the browser: no build step, no server, no dependencies to install.

Numbers in play: **20, 19, 18, 17, 16, 15, 14, 13, 12 and Bull** (Bull is worth 25).

## Running it

Open `index.html` in any modern browser (desktop or mobile). To host it, copy the four files to any static web server.

> The Oswald and Inter fonts load from Google Fonts. Offline, the app still works and falls back to system fonts.

## Files

| File         | Purpose                                                         |
| ------------ | --------------------------------------------------------------- |
| `index.html` | Page structure: player cards, board, status line, buttons       |
| `style.css`  | Layout, theme colors (light/dark), face-off logo emblems        |
| `script.js`  | Game state, scoring rules, saving, logo upload                  |
| `prism.js`   | Generates the animated low-poly "prism" background and sparkles |

When you change a file, bump the `?v=` number on its `<link>`/`<script>` tag in `index.html` so browsers don't serve a cached copy.

## How to use

1. **Names and logos.** Edit a player's name in their card (16 characters max). Tap the **+** circle to upload a PNG or JPEG logo. It is cropped to a square, shrunk, and also shown as a large face-off emblem beside that player's side.
2. **Enter hits.** In each row, type how many hits that player has on that number (0-99). Marks update automatically: `/` for 1 hit, `Λ` for 2, `▲` for 3 (closed).
3. **Read the card.** Each player card shows:
   - **POINTS**: the player's total score. Tap it to type a correction by hand; it is then outlined with a dotted underline.
   - **BASE**: how many numbers the player has closed (3 or more hits), out of 10.
   - **★ first**: how many numbers the player closed before the opponent.
4. **Buttons.**
   - **New game** clears hits and score adjustments but keeps names and logos.
   - **Reset players** clears everything, including names and logos.

## Scoring rules

- A number is **closed** at 3 hits.
- Once a player has closed a number and the opponent has **not**, every extra hit scores the number's value: `(hits - 3) x value`.
- When **both** players have closed a number, the player who closed it first keeps the points earned up to that moment (their hit count when the opponent closed it). Nobody scores further on that number. The other player scores nothing on it.
- Re-opening a number (lowering a hit count below 3) re-evaluates who closed first.
- The number cell is colored for whoever closed it first, and that player's mark is highlighted.
- **Total** = automatic points + any manual adjustment typed into POINTS.

### Winning

- A player who has closed all 10 numbers wins if their score is **equal to or higher** than the opponent's.
- If both players have closed all 10, the higher score wins. If the scores are level, whoever closed more numbers first wins; if that is also level, it is a tie.
- Otherwise the status line shows who is leading, or that scores are tied.

## Saving

The game is saved automatically in the browser's `localStorage` (key `cricket_darts_v2`), so a refresh or a closed tab won't lose it. The state lives only on that device and browser. If storage is full or blocked, the app keeps working but won't remember the game.

## Notes for developers

- Number list and values are the `NUMS` and `VALS` arrays at the top of `script.js`; `MAX_HITS` caps hits per number.
- Saved data is validated by `sanitize()` on load, so a corrupted save falls back to a fresh game instead of breaking the page.
- Colors and fonts are CSS variables on `:root` in `style.css` (`--p1` and `--p2` are the two player colors).
