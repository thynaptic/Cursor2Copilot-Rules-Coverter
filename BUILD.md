# Building and Testing the Package

## Quick Start

```bash
# Install build tools
pip install build twine

# Build the package
python3 -m build

# Test locally
pip install -e .
```

## Build Package

```bash
# Clean previous builds
rm -rf dist/ build/ *.egg-info

# Build both source and wheel distributions
python3 -m build

# Output:
# dist/cursor-rules-converter-1.0.0.tar.gz
# dist/cursor-rules-converter-1.0.0-py3-none-any.whl
```

## Test Installation Locally

```bash
# Install in editable/development mode
pip install -e .

# Test the commands
convertmdc --version
cursor-convert --help

# Test conversion
convertmdc --dry-run examples/ test-output.md
```

## Test Built Package

```bash
# Create virtual environment for testing
python3 -m venv test-env
source test-env/bin/activate

# Install from built wheel
pip install dist/cursor-rules-converter-*.whl

# Test
convertmdc --version
convertmdc --help

# Cleanup
deactivate
rm -rf test-env
```

## Check Package Contents

```bash
# List files in wheel
python3 -m zipfile -l dist/cursor-rules-converter-*.whl

# List files in source distribution
tar -tzf dist/cursor-rules-converter-*.tar.gz
```

## Validate Package

```bash
# Check package metadata
python3 -m twine check dist/*

# Should show: PASSED
```

## Test Upload to TestPyPI

```bash
# Upload to TestPyPI (test first!)
python3 -m twine upload --repository testpypi dist/*

# Install from TestPyPI
pip install --index-url https://test.pypi.org/simple/ cursorvertext

# Test installation
convertmdc --version
```

## Common Issues

### ModuleNotFoundError

Ensure all dependencies are in setup.py and pyproject.toml

### Command Not Found After Install

Check that pip's bin directory is in PATH:
```bash
python3 -m pip show cursor-rules-converter
```

### Import Errors

Test the module directly:
```bash
python3 -c "import convertmdc; print(convertmdc.__version__)"
```

## Development Workflow

```bash
# 1. Make changes to code
vim convertmdc.py

# 2. Install in editable mode
pip install -e .

# 3. Test changes
convertmdc --dry-run examples/

# 4. Update version
echo "1.0.1" > VERSION

# 5. Build
python3 -m build

# 6. Test
twine check dist/*

# 7. Upload to TestPyPI
twine upload --repository testpypi dist/*

# 8. If good, upload to PyPI
twine upload dist/*
```

## Files Created by Build

- `dist/` - Distribution packages (wheel and tarball)
- `build/` - Temporary build files
- `*.egg-info/` - Package metadata

These are in .gitignore and should not be committed.
