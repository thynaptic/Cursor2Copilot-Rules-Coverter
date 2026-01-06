# Cursor Rules Converter

![Logo](Logo_512x512.png)

Convert Cursor Rules (`.mdc` files) to VS Code Copilot Instructions. Available as both a VS Code extension and a powerful CLI tool.

## Overview

Seamlessly migrate your development workflows from Cursor to VS Code Copilot. This tool handles non-standard YAML formats, batch processing, and GitHub repository imports with automatic backups and comprehensive error handling.

## VS Code Extension

### Quick Start

**Convert a Single File**
- Right-click any `.mdc` file → **"Convert Cursor Rule File"**
- Choose output location
- Done!

**Convert a Folder**
- Right-click folder → **"Convert Cursor Rules Folder"**
- Select subfolders interactively
- Save combined output

**Convert from GitHub**
- Command Palette (`Cmd+Shift+P`) → **"Convert from GitHub Repository"**
- Enter repository URL
- Automatic cloning and conversion

### Configuration Presets

| Preset | Verbose | Dry Run | Stats | Best For |
|--------|---------|---------|-------|----------|
| Dev | ✓ | ✗ | ✓ | Development & debugging |
| Prod | ✗ | ✗ | ✗ | Production automation |
| Preview | ✗ | ✓ | ✓ | Safe preview mode |

Access via Command Palette → **"Convert with Preset Configuration"**

### Extension Settings

- `cursorvertext.verbose` - Enable detailed logging
- `cursorvertext.showStats` - Display conversion metrics
- `cursorvertext.autoBackup` - Create backups automatically
- `cursorvertext.pythonPath` - Custom Python path
- `cursorvertext.defaultPreset` - Default configuration

## Command Line Interface

For automation, CI/CD pipelines, and advanced workflows:

```bash
# Convert single file
python3 convertmdc.py input.mdc output.md

# Convert directory
python3 convertmdc.py examples/ output/instructions.md

# GitHub repository
python3 convertmdc.py https://github.com/user/repo output.md

# Interactive mode
python3 convertmdc.py -i examples/

# With preset
python3 convertmdc.py --preset dev examples/ output.md

# Dry run
python3 convertmdc.py --dry-run --stats examples/
```

### CLI Options

- `-i, --interactive` - Choose folders interactively
- `--preset dev|prod|preview` - Use configuration preset
- `--dry-run` - Preview without writing files
- `-v, --verbose` - Detailed debug output
- `--stats` - Show conversion statistics
- `--config FILE` - Custom configuration file
- `--no-backup` - Skip backup creation
- `--check-update` - Check for updates
- `--update` - Auto-update to latest version

## Features

**Robust Parsing**
- Non-standard YAML format support
- Unquoted glob patterns (`*.py`, `*.js`)
- Backticks and special characters
- Multiline strings with pipe syntax

**Flexible Processing**
- Single files or entire directories
- GitHub repository cloning
- Interactive folder selection
- Automatic versioned backups

**Development Tools**
- Dry-run mode for safe previews
- Statistics tracking (timing, counts, errors)
- Verbose logging for debugging
- Configuration file support
- Version checking and auto-update

## Requirements

- Python 3.7+
- PyYAML: `pip install pyyaml`

The extension will prompt if Python is not configured.

## Output Format

Converts Cursor Rules to structured VS Code Copilot Instructions:

```markdown
# VS Code Copilot Instructions

## Metadata
- Source: `filename.mdc`
- Applies To: `*.py`

## Rules

### rule.id.example
**Severity:** error

[Description with preserved formatting]
```

## Commands

All commands available via Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`):

- **Convert Cursor Rule File**
- **Convert Cursor Rules Folder (Interactive)**
- **Convert from GitHub Repository**
- **Convert with Preset Configuration**
- **Check for Updates**

## Known Issues

- Large repositories may take time to clone
- Some non-standard YAML may require review
- Special characters in paths need encoding

## Release Notes

### 1.0.0

Initial release with full feature set.

## License

MIT

---

**Questions or Issues?**
[GitHub Repository](https://github.com/thynaptic/cursorvertext)
