# npm Package

## Installation

```bash
npm install -g cursor-rules-converter
```

## Usage

```bash
convertmdc input.mdc output.md
convertmdc -i examples/
convertmdc --preset dev examples/ output.md
convertmdc https://github.com/user/repo output.md

# Alternative command
cursor-convert input.mdc output.md
```

## Publishing (Maintainers)

### Prerequisites

- npm account with publishing rights
- Authenticated: `npm login`

### Publish

```bash
# Verify version
cat package.json | grep version

# Test locally
npm pack
npm install -g cursor-rules-converter-*.tgz
convertmdc --version

# Publish
npm publish
```

### Update

```bash
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0

git push && git push --tags
npm publish
```

## Package Contents

- bin/convertmdc.js - CLI wrapper
- convertmdc.py - Core converter
- .convertmdcrc.* - Preset configurations
- requirements.txt - Python dependencies

## Requirements

- Node.js >=14.0.0
- Python 3.7+
- PyYAML >=5.1

Missing dependencies prompt automatic installation:
```bash
pip3 install pyyaml>=5.1
```

## Testing

```bash
npm pack
npm install -g ./cursor-rules-converter-*.tgz
convertmdc --version
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
