# Setup Guide

Quick installation and verification for version 1.1.0 features.

## Installation

```bash
npm install
```

Reload VS Code: `Cmd+Shift+P` → "Reload Window"

## Verification

**Status Bar**
- Bottom-right corner shows `.mdc` file count (if files present)

**Commands**
- Open Command Palette → type "Cursor Rules"
- Should see: Preview, Validate, Batch Convert, History, etc.

**Context Menus**
- Right-click `.mdc` file → Convert, Preview, Validate

## Feature Tests

**Preview Pane**
```bash
Right-click .mdc file → Preview Conversion
```

**Status Bar**
```bash
Create .mdc file → Check status bar for count → Click to view list
```

**Validation**
```bash
Right-click .mdc file → Validate → Check Output panel
```

**History**
```bash
Convert a file → Command Palette → Show Conversion History
```

**Batch Operations**
```bash
Command Palette → Batch Convert Files → Select files → Convert
1. Create a `.mdc` file in your workspace
2. Look at status bar (bottom-right)
3. Should show: `$(file-code) 1 .mdc file`
4. Click it to see the file list

### Test Validation
1. Open a `.mdc` file
2. Right-click → Validate .mdc File
3. Check the Output panel for validation results

### Test History
1. Convert a `.mdc` file
2. Open Command Palette → "Cursor Rules: Show Conversion History"
3. Should see your recent conversion

### Test Batch Operations
1. Have multiple `.mdc` files in workspace
2. Command Palette → "Cursor Rules: Batch Convert Files"
3. Select files and convert

```

## Configuration

```json
{
  "cursorvertext.showStatusBar": true,
  "cursorvertext.watchModeEnabled": false,
  "cursorvertext.maxHistoryEntries": 50
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Status bar missing | Enable `showStatusBar` in settings |
| Preview fails | Verify Python installation |
| Validation errors | Run `npm install` for js-yaml |
| Commands missing | Reload VS Code window |

## Requirements

- Python 3.7+
- js-yaml (installed via npm)
- VS Code 1.75.0+

## Documentation

- [NEW_FEATURES.md](NEW_FEATURES.md) - Feature reference
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [README.md](README.md) - Main documentation
