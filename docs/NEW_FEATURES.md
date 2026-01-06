# Extension Enhancements

Version 1.1.0 adds five productivity features to streamline your workflow.

## Preview Pane

See conversion results before creating files. Side-by-side preview with clipboard support.

**Usage**
- Right-click `.mdc` file → **Preview Conversion**
- Command Palette → **"Cursor Rules: Preview Conversion"**

**Features**
- Live preview in webview panel
- Copy to clipboard
- No temporary files created

## Workspace Detection

Automatic `.mdc` file discovery with status bar integration.

**Status Bar**
- Shows `.mdc` file count
- Click to view all files
- Auto-updates on file changes

**Quick Actions**
- Preview, convert, or validate from file list
- Command: **"Show .mdc Files"**

## Batch Operations

Process multiple files efficiently with three operation modes.

| Operation | Description | Command |
|-----------|-------------|---------|
| Batch Convert | Select specific files | Batch Convert Files |
| Convert All | Process entire workspace | Convert All .mdc Files |
| Watch Mode | Auto-convert on save | Toggle Watch Mode |

**Output Strategies**
- Same directory (in-place conversion)
- Custom directory (consolidated output)
- Combined file (merged output)

## Validation

Pre-conversion error checking with detailed reports.

**Checks**
- YAML syntax parsing
- Structure validation
- Common typo detection
- Tab/space consistency
- Required section presence

**Usage**
- Right-click `.mdc` file → **Validate .mdc File**
- Results appear in Output panel

## History Panel

Track and replay conversions with workspace-persistent storage.

**Features**
- Automatic conversion tracking
- View source and output files
- Re-run previous conversions
- Success/failure indicators
- Configurable history size (default: 50)

**Usage**
- Command Palette → **"Show Conversion History"**
- Select entry for actions: Open Source, Open Output, Re-convert, Copy Details

## Configuration

```json
{
  "cursorvertext.watchModeEnabled": false,
  "cursorvertext.showStatusBar": true,
  "cursorvertext.maxHistoryEntries": 50
}
```

## Context Menu Integration

Right-click any `.mdc` file:
- Convert Cursor Rule File
- Preview Conversion
- Validate .mdc File

## Installation

```bash
npm install
```

Reload VS Code window after installation.

## Requirements

- Python 3.7+
- js-yaml (installed via npm)

## Troubleshooting

**Status bar not visible**
- Enable in settings: `cursorvertext.showStatusBar`
- Ensure workspace contains `.mdc` files

**Preview fails**
- Verify Python installation
- Check Output panel for errors

**Validation warnings**
- Run `npm install` to ensure js-yaml is present

## Release Notes

See [CHANGELOG.md](CHANGELOG.md) for detailed changes.
