# VS Code Extension - Cursor Rules to Copilot Instructions Converter

## Installation

### From VSIX Package
1. Package the extension:
   ```bash
   npm install -g @vscode/vsce
   vsce package
   ```

2. Install in VS Code:
   - Open VS Code
   - Go to Extensions (Cmd+Shift+X)
   - Click "..." menu → "Install from VSIX"
   - Select the generated `.vsix` file

### From Marketplace (After Publishing)
1. Open VS Code
2. Go to Extensions (Cmd+Shift+X)
3. Search for "Cursor Rules to Copilot Instructions"
4. Click "Install"

## Usage

### Convert a Single File
**Method 1: Context Menu**
- Right-click any `.mdc` file in Explorer
- Select "Convert Cursor Rule File"
- Choose output location

**Method 2: Command Palette**
- Open a `.mdc` file
- Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows/Linux)
- Type "Convert Cursor Rule File"
- Choose output location

### Convert a Folder
**Method 1: Context Menu**
- Right-click a folder in Explorer
- Select "Convert Cursor Rules Folder (Interactive)"
- Choose which subfolders to convert
- Choose output location

**Method 2: Command Palette**
- Press Cmd+Shift+P
- Type "Convert Cursor Rules Folder"
- Select folder
- Choose output location

### Convert from GitHub
- Press Cmd+Shift+P
- Type "Convert from GitHub Repository"
- Enter repository URL
- Choose output location

### Use Preset Configurations
- Press Cmd+Shift+P
- Type "Convert with Preset Configuration"
- Select preset (dev/prod/preview)
- Select input type (file/folder/GitHub)
- Provide input path
- Choose output location (except for preview mode)

### Check for Updates
- Press Cmd+Shift+P
- Type "Check for Updates"
- Follow prompts if update available

## Configuration

Access settings via:
- Code → Settings → Extensions → Cursor Rules Converter (Mac)
- File → Preferences → Settings → Extensions → Cursor Rules Converter (Windows/Linux)

### Available Settings

**`cursorvertext.verbose`**
- Type: Boolean
- Default: `false`
- Enable verbose logging for debugging

**`cursorvertext.showStats`**
- Type: Boolean
- Default: `true`
- Display conversion statistics after processing

**`cursorvertext.autoBackup`**
- Type: Boolean
- Default: `true`
- Create backups before overwriting existing files

**`cursorvertext.pythonPath`**
- Type: String
- Default: `"python3"`
- Path to Python executable
- Options: `python3`, `python`, or full path like `/usr/bin/python3`

**`cursorvertext.defaultPreset`**
- Type: String
- Default: `"none"`
- Options: `none`, `dev`, `prod`, `preview`
- Default preset configuration to use

## Output Channel

View conversion progress and logs:
1. Open Output panel (View → Output or Cmd+Shift+U)
2. Select "Cursor Rules Converter" from dropdown

## Requirements

- Python 3.7 or later
- PyYAML package (`pip install pyyaml`)

The extension will prompt if Python is not found or configured incorrectly.

## Troubleshooting

### Python Not Found
1. Ensure Python 3.7+ is installed
2. Configure path in settings: `cursorvertext.pythonPath`
3. Try: `python3`, `python`, or full path

### PyYAML Missing
```bash
pip install pyyaml
# or
pip3 install pyyaml
```

### Permission Errors
Ensure the converter script is executable:
```bash
chmod +x convertmdc.py
```

### View Detailed Logs
1. Enable verbose mode in settings
2. Check Output panel (Cursor Rules Converter)
3. Review error messages for specific issues

## Publishing to Marketplace

### Prerequisites
```bash
npm install -g @vscode/vsce
```

### Create Personal Access Token
1. Go to https://dev.azure.com/
2. Create organization (if needed)
3. User Settings → Personal Access Tokens
4. Create token with "Marketplace (Manage)" scope

### Package and Publish
```bash
# Package
vsce package

# Login
vsce login thynaptic

# Publish
vsce publish
```

### Update Version
```bash
# Patch (1.0.0 → 1.0.1)
vsce publish patch

# Minor (1.0.0 → 1.1.0)
vsce publish minor

# Major (1.0.0 → 2.0.0)
vsce publish major
```

## Development

### Local Testing
1. Open project in VS Code
2. Press F5 to launch Extension Development Host
3. Test commands in the new window

### Debugging
1. Set breakpoints in `extension.js`
2. Press F5
3. Use Debug Console to inspect variables

## License

MIT
