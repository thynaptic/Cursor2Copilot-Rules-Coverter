# Build Guide

## Quick Start

```bash
pip install build twine
python3 -m build
pip install -e .
```

## Build

```bash
rm -rf dist/ build/ *.egg-info
python3 -m build
```

Outputs:
- dist/cursor-rules-converter-1.0.0.tar.gz
- dist/cursor-rules-converter-1.0.0-py3-none-any.whl

## Test Locally

```bash
pip install -e .
convertmdc --version
convertmdc --dry-run examples/ test-output.md
```

## Test Built Package

```bash
python3 -m venv test-env
source test-env/bin/activate
pip install dist/cursor-rules-converter-*.whl
convertmdc --version
deactivate
rm -rf test-env
```

## Validation

```bash
python3 -m twine check dist/*
```

## Test Upload

```bash
python3 -m twine upload --repository testpypi dist/*
pip install --index-url https://test.pypi.org/simple/ cursorvertext
convertmdc --version
```

## Troubleshooting

Ensure all dependencies are listed in setup.py and pyproject.toml.

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
