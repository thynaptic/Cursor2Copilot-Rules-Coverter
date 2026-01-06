# Publishing to PyPI

## Prerequisites

1. Create accounts:
   - PyPI: https://pypi.org/account/register/
   - TestPyPI: https://test.pypi.org/account/register/

2. Install build tools:
```bash
pip install build twine
```

3. Create API tokens:
   - PyPI: https://pypi.org/manage/account/token/
   - TestPyPI: https://test.pypi.org/manage/account/token/

## Build Distribution

```bash
# Clean previous builds
rm -rf dist/ build/ *.egg-info

# Build package
python3 -m build

# This creates:
# - dist/cursorvertext-1.0.0.tar.gz (source)
# - dist/cursorvertext-1.0.0-py3-none-any.whl (wheel)
```

## Test on TestPyPI First

```bash
# Upload to TestPyPI
python3 -m twine upload --repository testpypi dist/*

# Install from TestPyPI to test
pip install --index-url https://test.pypi.org/simple/ cursor-rules-converter

# Test the installation
convertmdc --version
convertmdc --help
```

## Publish to PyPI

```bash
# Upload to PyPI
python3 -m twine upload dist/*

# Enter your credentials or API token when prompted
```

## Using API Token (Recommended)

Create `~/.pypirc`:

```ini
[distutils]
index-servers =
    pypi
    testpypi

[pypi]
username = __token__
password = pypi-AgEIcHlwaS5vcmc...

[testpypi]
username = __token__
password = pypi-AgENdGVzdC5weXBp...
```

Then upload without prompts:
```bash
twine upload dist/*
```

## Version Management

Update version in `VERSION` file:
```bash
echo "1.0.1" > VERSION
```

Commit and tag:
```bash
git add VERSION
git commit -m "Bump version to 1.0.1"
git tag v1.0.1
git push origin main --tags
```

Then rebuild and publish.

## Publishing Checklist

- [ ] Update VERSION file
- [ ] Update CHANGELOG.md
- [ ] Update README.md if needed
- [ ] Commit all changes
- [ ] Create git tag
- [ ] Clean build directories
- [ ] Build distribution
- [ ] Test on TestPyPI
- [ ] Upload to PyPI
- [ ] Verify installation: `pip install cursorvertext`
- [ ] Test installed package
- [ ] Create GitHub release

## Automation with GitHub Actions

Create `.github/workflows/publish.yml` for automatic publishing on tags:

```yaml
name: Publish to PyPI

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.x'
      - name: Install build tools
        run: pip install build twine
      - name: Build package
        run: python -m build
      - name: Publish to PyPI
        env:
          TWINE_USERNAME: __token__
          TWINE_PASSWORD: ${{ secrets.PYPI_API_TOKEN }}
        run: twine upload dist/*
```

Add `PYPI_API_TOKEN` to GitHub repository secrets.

## Verify Published Package

```bash
# Check on PyPI
open https://pypi.org/project/cursor-rules-converter/

# Test installation
pip install cursor-rules-converter

# Test functionality
convertmdc --version
```

## Update Package

For updates, increment version and republish:

```bash
# Update VERSION
echo "1.0.2" > VERSION

# Clean and rebuild
rm -rf dist/ build/ *.egg-info
python3 -m build

# Upload new version
twine upload dist/*
```

## Troubleshooting

### File Already Exists

You cannot upload the same version twice. Increment VERSION and rebuild.

### Invalid Token

Regenerate API token and update `~/.pypirc`

### Missing Dependencies

Install: `pip install build twine setuptools wheel`

### Package Name Taken

Choose a different name in setup.py and pyproject.toml
