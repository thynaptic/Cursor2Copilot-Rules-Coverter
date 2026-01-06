# Change Log

All notable changes to the Cursor Rules to Copilot Instructions Converter extension will be documented in this file.

## [1.0.0] - 2026-01-06

### Added
- Initial release of VS Code extension
- Command: Convert single `.mdc` file to Copilot Instructions
- Command: Convert folder with interactive selection
- Command: Convert from GitHub repository
- Command: Convert with preset configurations (dev, prod, preview)
- Command: Check for updates
- Context menu integration for `.mdc` files and folders
- Configuration settings:
  - Verbose logging toggle
  - Statistics display toggle
  - Automatic backup toggle
  - Custom Python path configuration
  - Default preset selection
- Output channel for conversion progress and logs
- Support for all Python script features:
  - Robust YAML parsing
  - Batch processing
  - GitHub repository cloning
  - Interactive mode
  - Dry-run mode
  - Configuration presets
  - Version checking and auto-update

### Python Script Features
- Parse non-standard YAML formats (unquoted globs, backticks, multiline strings)
- Process single files, directories, or GitHub repositories
- Interactive folder selection mode
- Automatic file backups with versioning
- Preserve all formatting, metadata, and severity levels
- Dry-run mode for preview without file modification
- Verbose logging for debugging
- Statistics tracking (timing, counts, errors)
- Configuration file support (`.convertmdcrc`)
- Preset configurations (dev, prod, preview)
- Version checking and auto-update mechanism
- Graceful error handling with fallback parsing

## [Unreleased]

### Planned
- Workspace-wide conversion command
- Batch conversion progress indicator
- Custom preset creation UI
- Integration with VS Code's Copilot settings
- Conversion history tracking
- Diff preview before conversion
- Support for custom YAML schemas
