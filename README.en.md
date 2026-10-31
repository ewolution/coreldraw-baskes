# CorelDRAW · Bleed Script

[Türkçe](README.md) | **English**

A JavaScript macro that runs **inside CorelDRAW**. It adds a **2 mm bleed**
behind the artwork so slight print/cut misregistration does not leave a white
paper edge on magenta-cut jobs.

**Cut lines (CMYK `0/100/0/0`) are never touched:** the script never copies,
thickens, recolours or deletes them. Bleed is produced from the artwork only.

```
       ┌─────────────────────────┐
       │▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│  ← 2 mm bleed (artwork colour)
       │▒▒▒┌───────────────────┐▒▒│
       │▒▒▒│      artwork      │▒▒│  ← magenta cut line
       │▒▒▒└───────────────────┘▒▒│
       │▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│
       └─────────────────────────┘
```

## Install

1. Download **`Coreldraw-Baskes-Kur-vX.Y.Z.bat`** from
   [Releases](https://github.com/ewolution/coreldraw-baskes/releases/latest).
2. Double-click it. It decodes itself and copies `Baskes-Payi.js` into every
   CorelDRAW version's `Draw\Scripts` folder.
3. Restart CorelDRAW (save your work first).

Check: `Tools ▸ Scripts ▸ Scripts` (`Alt+Shift+F11`) →
**JavaScript ▸ User Scripts ▸ Baskes-Payi**

Uninstall: delete `Baskes-Payi.js` from the same folder, or use `Kaldir.bat`
from the ZIP package.

## Usage

1. Select the objects to bleed (select the whole group).
2. `Alt+Shift+F11` → **Baskes-Payi**.
3. Check the result window, undo with `Ctrl+Z` if needed.

## How it works

- Selection is used when present; otherwise the active page is processed.
- Groups are handled part by part.
- Magenta (`0/100/0/0`) fills and unfilled magenta outlines are skipped.
- **Solid colours:** the copy gets a 4 mm outline (2 mm outside, since outlines
  are centred), coloured with the fill colour (verified by reading it back).
- **Gradients:** tried in order — contour effect (inherits the object's fill) →
  outline converted to an object with the original gradient copied onto it →
  flat CMYK average as a last resort. The bleed band keeps the gradient in the
  first two cases.
- Copies are named `BLEED_…` and placed directly behind the original.
- The whole run is a single undo step.

## Settings

At the top of `Baskes-Payi.js`:

| Setting | Default | Description |
|---|---|---|
| `payMM` | `2.0` | Bleed amount in mm |
| `kesimCmyk` | `[0, 100, 0, 0]` | Cut colour — never processed |
| `kesimTolerans` | `0.5` | Cut colour match tolerance (CMYK %) |
| `degradeKontur` | `true` | Try the contour effect for gradients |
| `onek` | `"BLEED_"` | Name prefix for copies |

## Limits

- Bleed overlaps neighbouring objects (expected for cutting).
- Bitmap / pattern / texture / hatch fills get no bleed.
- PowerClip objects are skipped.
- Locked layers must be unlocked first.

## Notes

`Outline.Width` may be in mm or points depending on the CorelDRAW version; the
script measures it at runtime with a temporary 1×1 mm rectangle and adapts, so
the bleed is always 2 mm.
