# Page snapshot

```yaml
- heading "Beyond Borders" [level=5]
- paragraph: Add a circular, flag-colored border to your profile picture.
- button "Toggle dark mode"
- button "Switch to image mode and upload a file" [pressed]: Choose image
- text: OR
- button "Switch to flag selection mode": Just the flag
- text: Select a flag
- combobox "Select a flag"
- group "Presentation":
  - text: Presentation
  - radiogroup "Presentation style":
    - radio "Ring" [checked] [disabled]
    - text: Ring
    - radio "Segment" [disabled]
    - text: Segment
    - radio "Cutout" [disabled]
    - text: Cutout
- paragraph: "Border thickness: 7%"
- slider "Border thickness" [disabled]: "7"
- paragraph: "Inset/Outset: 0%"
- slider "Inset or outset" [disabled]: "0"
- text: Background
- combobox "Background" [disabled]:
  - paragraph: Transparent
- button "Download generated PNG" [disabled]: Download PNG
- button "Reset position"
- img "Preview canvas. Drag to reposition image. Use arrow keys to nudge."
- img
```