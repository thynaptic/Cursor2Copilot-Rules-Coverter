# Installation Guide

## Install from PyPI

```bash
pip install cursor-rules-converter
```

## Install from Source

```bash
# Clone the repository
git clone https://github.com/thynaptic/Cursor2Copilot-Rules-Coverter.git
cd Cursor2Copilot-Rules-Coverter

# Install in development mode
pip install -e .

# Or install normally
pip install .
```

## Install Development Dependencies

```bash
pip install -e ".[dev]"
```

## Verify Installation

```bash
# Check version
convertmdc --version

# Or use alternative command
cursor-convert --version

# Run help
convertmdc --help
```

## Usage After Installation

Once installed via pip, you can use the command from anywhere:

```bash
# Convert a file
convertmdc input.mdc output.md

# Interactive mode
convertmdc -i examples/

# With preset
convertmdc --preset dev examples/ output.md

# From GitHub
convertmdc https://github.com/user/repo output.md
```

## Uninstall

```bash
pip uninstall cursor-rules-converter
```

## Upgrade

```bash
pip install --upgrade cursor-rules-converter
```

## Virtual Environment (Recommended)

```bash
# Create virtual environment
python3 -m venv venv

# Activate
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Install
pip install cursor-rules-converter

# Deactivate when done
deactivate
```

## System Requirements

- Python 3.7 or later
- pip (usually comes with Python)
- Internet connection (for PyPI installation)

## Troubleshooting

### Command Not Found

If `convertmdc` is not recognized after installation:

```bash
# Check if pip's bin directory is in PATH
python3 -m pip show cursor-rules-converter

# Run using python module syntax
python3 -m convertmdc --help
```

### Permission Errors

Use `--user` flag to install for current user only:

```bash
pip install --user cursor-rules-converter
```

Or use a virtual environment (recommended).
