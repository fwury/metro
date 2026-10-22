# Metro — transit map designer

Design custom transit maps on a grid in your browser and export them as PNG, JPG or SVG.

**Live:** https://fwury.github.io/metro/

## Controls

| Action | How |
| --- | --- |
| Add a station | Right-click, Shift-click or double-click empty grid (on a connection, the station is inserted into it) |
| Edit a station (name, label side, marker, delete) | Click it or its name |
| Draw a connection | Double-click a station, click grid points to add waypoints, double-click a station to finish |
| Finish at a new station | Double-click empty grid while drawing |
| Flip the next bend / remove last waypoint / cancel | Hold Alt / Backspace / Esc |
| Edit a connection's path | Double-click it, or select it and drag its handles |
| Edit a connection (line, corridor order, reverse) | Select it and use the panel |
| Select | Click, ⌘/Ctrl-click to add, drag a box, ⌘/Ctrl A for all |
| Delete selection | Backspace / Delete |
| Move stations | Drag, or arrow keys |
| Reorder lines | Drag them in the sidebar |
| Branching lines | Turn on "Merge shared track" for a line |
| Pan / zoom / fit | Scroll or Space-drag · ⌘/Ctrl-scroll or pinch · F |
| Undo / redo | ⌘/Ctrl Z · ⇧⌘/Ctrl Z |

Connections that share grid edges are drawn side by side and keep their order through bends; the order in a shared corridor can be changed from the connection panel. Corners are rounded automatically, with concentric curves for parallel lines.

Maps save to `localStorage` automatically, and can be saved to / opened from a `.metro.json` file.

No build step — it's plain HTML, CSS and JavaScript.
