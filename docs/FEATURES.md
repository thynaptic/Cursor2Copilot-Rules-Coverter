# CLI Feature Reference

Advanced features for automation, debugging, and workflow optimization.

## Dry Run Mode

Preview conversions without writing files.

```bash
python3 convertmdc.py --dry-run examples/ output/test.md
```

**Output**
```
[DRY RUN MODE] - No files will be modified

Would convert 19 file(s)
Would write to: output/test.md
Output size: 131.73 KB
```

## Statistics Tracking

Display detailed conversion metrics.

```bash
python3 convertmdc.py --stats examples/ output/rules.md
```

**Metrics**

| Category | Details |
|----------|---------|
| Files | Total scanned, successful, failed, skipped |
| Rules | Total extracted across all files |
| Data | Total size processed |
| Timing | Duration and average per file |

## Configuration Files

Save default settings in `.convertmdcrc` file.

**Locations**
- Current directory: `./.convertmdcrc`
- Home directory: `~/.convertmdcrc`
- Custom path: `--config /path/to/config.json`

**Format**
```json
{
  "verbose": true,
  "dry_run": false,
  "show_stats": true
}
```

**Priority**: CLI arguments > `--config` file > `.convertmdcrc` > Defaults

## Configuration Presets

Pre-configured profiles for common workflows.

| Preset | Verbose | Dry Run | Stats | Use Case |
|--------|---------|---------|-------|----------|
| dev | ✓ | ✗ | ✓ | Development & debugging |
| prod | ✗ | ✗ | ✗ | Production automation |
| preview | ✗ | ✓ | ✓ | Safe preview mode |

**Usage**
```bash
# Development preset
python3 convertmdc.py --preset dev examples/ output/rules.md

# Production preset
python3 convertmdc.py --preset prod examples/ output/rules.md

# Preview preset
python3 convertmdc.py --preset preview examples/

# Override preset settings
python3 convertmdc.py --preset dev --no-stats examples/ output/rules.md
```

**Customization**
- Edit `.convertmdcrc.dev`, `.convertmdcrc.prod`, or `.convertmdcrc.preview`
- Presets can be combined with `--config` for additional settings

## Verbose Mode

Enable detailed debugging output.

```bash
python3 convertmdc.py -v examples/engineering/api_standards.mdc
```

**Use Cases**
- Troubleshooting parsing issues
- Understanding conversion flow
- Debugging GitHub cloning
- Performance analysis

## Version Management

Check current version and available updates.

```bash
# Show version
python3 convertmdc.py --version

# Check for updates
python3 convertmdc.py --check-update

# Auto-update
python3 convertmdc.py --update
```

**Auto-Update Process**
1. Checks for latest version
2. Prompts for confirmation
3. Creates backup (`convertmdc.backup.py`)
4. Downloads and installs update
5. Reports success

## Feature Combinations

**Development Workflow**
```bash
python3 convertmdc.py --dry-run --stats -v examples/ output/test.md
```

**Production Monitoring**
```bash
python3 convertmdc.py --stats examples/ output/rules.md
```

**Quick Testing**
```bash
python3 convertmdc.py --dry-run examples/ output/test.md
```

## Backward Compatibility

All features are optional and non-breaking. Existing commands work unchanged:

```bash
python3 convertmdc.py examples/ output/rules.md
```
