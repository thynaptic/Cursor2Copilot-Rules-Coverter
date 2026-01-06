# Command Reference

Quick access guide for version 1.1.0 features.

## Commands

| Feature | Command | Access |
|---------|---------|--------|
| Preview | Preview Conversion | Context menu, Command Palette |
| Validate | Validate .mdc File | Context menu, Command Palette |
| Batch | Batch Convert Files | Command Palette |
| Convert All | Convert All .mdc Files | Command Palette |
| History | Show Conversion History | Command Palette |
| Status Bar | Show .mdc Files | Click status bar |
| Watch Mode | Toggle Watch Mode | Command Palette |

## Quick Access

Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`):

```
preview     → Preview Conversion
validate    → Validate .mdc File
batch       → Batch Convert
history     → Show History
convert all → Convert All Files
watch       → Toggle Watch Mode

```

## Context Menus

**Right-click .mdc file:**
- Convert Cursor Rule File
- Preview Conversion
- Validate .mdc File

**Status Bar:**
- Click to view all `.mdc` files

## Configuration

```json
{
  "cursorvertext.showStatusBar": true,
  "cursorvertext.watchModeEnabled": false,
  "cursorvertext.maxHistoryEntries": 50
}
```

## Workflows

**Single File**
```
Validate → Preview → Convert → Check History
```

**Batch Processing**
```
Status Bar → Batch Convert → Select Files → Choose Preset
```

**Active Development**
```
Toggle Watch Mode → Edit & Save → Auto-converts
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Status bar missing | Enable `showStatusBar` |
| Preview fails | Verify Python |
| Validation warnings | Run `npm install` |
| Commands missing | Reload window |

## Documentation

- [NEW_FEATURES.md](NEW_FEATURES.md)
- [SETUP_GUIDE.md](SETUP_GUIDE.md)
- [CHANGELOG.md](CHANGELOG.md)
