# npm Package Publishing Guide

## Install from npm

```bash
npm install -g cursor-rules-converter
```

## Usage

After installation, two commands are available globally:

```bash
# Convert a file
convertmdc input.mdc output.md

# Interactive mode
convertmdc -i examples/

# With preset
convertmdc --preset dev examples/ output.md

# From GitHub
convertmdc https://github.com/user/repo output.md

# Alternative command name
cursor-convert input.mdc output.md
```

## Publishing to npm (For Maintainers)

### Prerequisites

1. npm account with publishing rights
2. Logged in to npm: `npm login`

### Publish Steps

```bash
# 1. Ensure version is correct in package.json
cat package.json | grep version

# 2. Make Python dependencies are listed
cat requirements.txt

# 3. Test the package locally
npm pack
npm install -g cursor-rules-converter-1.0.0.tgz
convertmdc --version

# 4. Publish to npm
npm publish

# Or for initial publish if name is already taken
npm publish --access public
```

### Update Package

```bash
# 1. Update version (patch/minor/major)
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# 2. Push tags
git push && git push --tags

# 3. Publish
npm publish
```

## Package Structure

The npm package includes:
- `bin/convertmdc.js` - Node.js CLI wrapper
- `convertmdc.py` - Core Python converter
- `.convertmdcrc.*` - Preset configurations
- `requirements.txt` - Python dependencies

## Dependencies

The package requires:
- **Node.js**: >=14.0.0 (for CLI wrapper)
- **Python**: 3.7+ (for converter script)
- **PyYAML**: >=5.1 (installed via pip)

Users will be prompted to install Python dependencies if missing:
```bash
pip3 install pyyaml>=5.1
```

## Testing

```bash
# Test local package
npm pack
npm install -g ./cursor-rules-converter-1.0.0.tgz

# Verify commands
which convertmdc
which cursor-convert

# Test functionality
convertmdc --version
convertmdc --help
```

## Troubleshooting

### Command Not Found

Ensure npm global bin is in PATH:
```bash
npm config get prefix
# Add /bin to PATH if needed
```

### Python Not Found

Install Python 3:
```bash
# macOS
brew install python3

# Ubuntu/Debian
sudo apt install python3 python3-pip

# Windows
# Download from python.org
```

### PyYAML Missing

```bash
pip3 install pyyaml>=5.1
# or
pip install pyyaml>=5.1
```

## Distribution Channels

This project is available via multiple channels:

1. **npm**: `npm install -g cursor-rules-converter`
2. **pip**: `pip install cursor-rules-converter`
3. **Homebrew**: `brew install cursor-rules-converter`
4. **VS Code**: Search "Cursor Rules Converter" in Extensions Marketplace
