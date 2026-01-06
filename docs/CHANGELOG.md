# Change Log

All notable changes to the Cursor Rules to Copilot Instructions Converter extension will be documented in this file.

## [1.1.0] - 2026-01-06

### Added - Extension Enhancements (Top 5 Most Impactful Features)

#### 1. Preview Pane 👁️
- New command: `Preview Conversion` - See results before converting
- Side-by-side preview in webview panel
- Live preview of conversion output
- Copy to clipboard functionality
- No temporary files created
- Accessible via context menu and command palette

#### 2. Auto-detect & Status Bar 📊
- Status bar showing `.mdc` file count in workspace
- Automatic workspace scanning on startup
- New command: `Show .mdc Files` - Quick access to all .mdc files
- Click status bar to view, preview, convert, or validate files
- Real-time updates when files are added/deleted
- File system watcher for automatic detection

#### 3. Batch Operations ⚡
- New command: `Batch Convert Files` - Multi-file conversion with selection
- New command: `Convert All .mdc Files` - One-click workspace conversion
- New command: `Toggle Watch Mode` - Auto-convert on save
- Multiple output strategies (same directory, custom directory, combined file)
- Preset support for batch operations
- Progress indicators for long-running operations
- Watch mode with configurable auto-conversion

#### 4. Validation ✅
- New command: `Validate .mdc File` - Pre-conversion error checking
- YAML syntax validation
- Structure and format verification
- Common typo detection
- Tab vs. spaces warnings
- Required section detection
- Detailed error and warning reports
- Output panel integration

#### 5. History Panel 📜
- New command: `Show Conversion History` - View all past conversions
- New command: `Clear Conversion History` - Reset history
- Automatic tracking of all conversions
- View source and output files from history
- Re-run previous conversions
- Copy conversion metadata
- Success/failure indicators
- Configurable history size (default: 50 entries)

### Enhanced
- Context menus now include Preview and Validate options
- Better error handling with silent mode for batch operations
- Improved user feedback with progress notifications

### Configuration
- Added `cursorvertext.watchModeEnabled` - Enable/disable auto-conversion
- Added `cursorvertext.showStatusBar` - Show/hide status bar item
- Added `cursorvertext.maxHistoryEntries` - Configure history size (10-200)

### Dependencies
- Added `js-yaml` for YAML validation

### Activation
- Changed to `onStartupFinished` for better workspace detection
- Status bar initializes automatically

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
