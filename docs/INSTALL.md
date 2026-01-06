# Installation

## PyPI

```bash
pip install cursor-rules-converter
```

## Source

```bash
git clone https://github.com/thynaptic/Cursor2Copilot-Rules-Coverter.git
cd Cursor2Copilot-Rules-Coverter
pip install -e .  # Development mode
# or
pip install .     # Normal install
```

## Development

```bash
pip install -e ".[dev]"
```

## Verification

```bash
convertmdc --version
cursor-convert --version
convertmdc --help
```

## Usage

```bash
convertmdc input.mdc output.md
convertmdc -i examples/
convertmdc --preset dev examples/ output.md
convertmdc https://github.com/user/repo output.md
```

## Management

```bash
pip uninstall cursor-rules-converter
pip install --upgrade cursor-rules-converter
```

## Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows
pip install cursor-rules-converter
deactivate
```

## Requirements

- Python 3.7+
- pip
- Internet connection

## Troubleshooting

If `convertmdc` command not found:

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
