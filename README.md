# Metro — transit map designer

Design custom transit maps on a grid in your browser and export them as PNG, JPG or SVG.

**Live:** https://fwury.github.io/metro/

## Controls

| Action | How |
| --- | --- |
| Add a station | Right-click an empty grid point |
| Edit a station (name, label side, marker, delete) | Right-click the station |
| Draw a connection | Click a station, trace the path along the grid, click another station (Shift-click to keep going) |
| Drop a new station at the end of a trace | Right-click an empty point while tracing |
| Step back / cancel a trace | Backspace / Esc |
| Edit a connection (line, corridor order, re-trace, reverse, delete) | Click it |
| Move a station | Drag it — its connections follow |
| Pan / zoom / fit | Drag empty space · scroll · F |
| Undo / redo | ⌘/Ctrl Z · ⇧⌘/Ctrl Z |

Connections that share grid edges are drawn side by side; their order in a shared corridor can be changed from the connection panel. Corners are rounded automatically, with concentric curves for parallel lines.

Maps save to `localStorage` automatically, and can be saved to / opened from a `.metro.json` file.

No build step — it's plain HTML, CSS and JavaScript.
