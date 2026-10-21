# Metro — transit map designer

Design custom transit maps on a grid in your browser and export them as PNG, JPG or SVG.

**Live:** https://fwury.github.io/metro/

## Controls

| Action | How |
| --- | --- |
| Add a station | Double-click or right-click empty grid |
| Edit a station (name, label side, marker, delete) | Right-click it, or select it and press Enter |
| Draw a connection | Double-click a station, click grid points to add waypoints, double-click a station to finish |
| Finish at a new station | Double-click empty grid while drawing |
| Flip the next bend / remove last waypoint / cancel | Hold Alt / Backspace / Esc |
| Reshape a connection | Select it, drag its waypoint handles; drag a ＋ to add a bend, double-click a handle to remove it |
| Edit a connection (line, corridor order, redraw, reverse) | Select it and use the panel |
| Select | Click, Shift-click to add, drag a box, ⌘/Ctrl A for all |
| Delete selection | Backspace / Delete |
| Move stations | Drag, or arrow keys |
| Pan / zoom / fit | Scroll or Space-drag · ⌘/Ctrl-scroll or pinch · F |
| Undo / redo | ⌘/Ctrl Z · ⇧⌘/Ctrl Z |

Connections that share grid edges are drawn side by side; their order in a shared corridor can be changed from the connection panel. Corners are rounded automatically, with concentric curves for parallel lines.

Maps save to `localStorage` automatically, and can be saved to / opened from a `.metro.json` file.

No build step — it's plain HTML, CSS and JavaScript.
