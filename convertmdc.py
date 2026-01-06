#!/usr/bin/env python3
"""
Cursor Rules to VS Code Copilot Instructions Converter

This script converts Cursor Rules (.mdc files) into formatted VS Code Copilot Instructions
(.github/copilot-instructions.md format).
It supports processing individual files, entire directories (with optional recursion),
and cloning from GitHub repositories. An interactive mode allows users to select specific
folders for conversion.

"""

import argparse
import re
import sys
import subprocess
import tempfile
import shutil
import json
import urllib.request
import urllib.error
from pathlib import Path
from typing import Dict, List, Any, Optional
from collections import defaultdict
import yaml

# Version information
__version__ = "1.0.0"
__update_url__ = "https://raw.githubusercontent.com/thynaptic/Cursor2Copilot-Rules-Coverter/main/convertmdc.py"
__version_url__ = "https://raw.githubusercontent.com/thynaptic/Cursor2Copilot-Rules-Coverter/main/VERSION"
__github_releases__ = "https://github.com/thynaptic/Cursor2Copilot-Rules-Coverter/releases/latest"


class CursorRuleConverter:
    """Converts Cursor Rules to VS Code Copilot Instructions."""
    
    def __init__(self, verbose: bool = False):
        self.processed_files: List[Path] = []
        self.errors: List[str] = []
        self.scanned_folders: Dict[Path, List[Path]] = {}
        self.temp_repo_dir: Optional[Path] = None
        self.verbose: bool = verbose
        self.stats: Dict[str, Any] = {
            'total_files': 0,
            'successful': 0,
            'failed': 0,
            'skipped': 0,
            'total_rules': 0,
            'total_size_bytes': 0,
            'start_time': None,
            'end_time': None
        }
    
    def is_github_url(self, url: str) -> bool:
        """Check if string is a GitHub repository URL."""
        patterns = [
            r'https?://github\.com/[\w-]+/[\w.-]+',
            r'git@github\.com:[\w-]+/[\w.-]+\.git',
            r'github\.com/[\w-]+/[\w.-]+'
        ]
        return any(re.match(pattern, url) for pattern in patterns)
    
    def clone_github_repo(self, repo_url: str) -> Optional[Path]:
        """Clone a GitHub repository to a temporary directory."""
        try:
            # Normalize URL
            if not repo_url.startswith(('http://', 'https://', 'git@')):
                repo_url = f'https://github.com/{repo_url}'
            if repo_url.endswith('.git'):
                repo_url = repo_url[:-4]
            if not repo_url.endswith('.git'):
                repo_url = repo_url + '.git'
            
            # Create temp directory
            temp_dir = Path(tempfile.mkdtemp(prefix='cursor_rules_'))
            self.temp_repo_dir = temp_dir
            
            print(f"Cloning repository: {repo_url}")
            print("This may take a moment...\n")
            
            # Clone the repository
            result = subprocess.run(
                ['git', 'clone', '--depth', '1', repo_url, str(temp_dir)],
                capture_output=True,
                text=True,
                timeout=300
            )
            
            if result.returncode != 0:
                print(f"Error cloning repository: {result.stderr}", file=sys.stderr)
                return None
            
            print(f"Repository cloned to: {temp_dir}\n")
            return temp_dir
            
        except subprocess.TimeoutExpired:
            print("Error: Repository cloning timed out", file=sys.stderr)
            return None
        except FileNotFoundError:
            print("Error: git command not found. Please install git.", file=sys.stderr)
            return None
        except Exception as e:
            print(f"Error cloning repository: {e}", file=sys.stderr)
            return None
    
    def cleanup_temp_repo(self):
        """Clean up temporary repository directory."""
        if self.temp_repo_dir and self.temp_repo_dir.exists():
            shutil.rmtree(self.temp_repo_dir)
            self.temp_repo_dir = None
    
    def print_statistics(self):
        """Print detailed conversion statistics."""
        print("\n" + "="*70)
        print("CONVERSION STATISTICS")
        print("="*70)
        
        print(f"\nFiles:")
        print(f"  Total scanned:  {self.stats['total_files']}")
        print(f"  Successful:     {self.stats['successful']}")
        print(f"  Failed:         {self.stats['failed']}")
        print(f"  Skipped:        {self.stats['skipped']}")
        
        print(f"\nRules:")
        print(f"  Total extracted: {self.stats['total_rules']}")
        
        print(f"\nData:")
        size_kb = self.stats['total_size_bytes'] / 1024
        print(f"  Total size:      {size_kb:.2f} KB")
        
        if self.stats['start_time'] and self.stats['end_time']:
            duration = (self.stats['end_time'] - self.stats['start_time']).total_seconds()
            print(f"\nTiming:")
            print(f"  Duration:        {duration:.2f} seconds")
            if self.stats['successful'] > 0:
                avg_time = duration / self.stats['successful']
                print(f"  Avg per file:    {avg_time:.3f} seconds")
        
        if self.errors:
            print(f"\nErrors ({len(self.errors)}):")
            for error in self.errors[:10]:  # Show first 10 errors
                print(f"  - {error}")
            if len(self.errors) > 10:
                print(f"  ... and {len(self.errors) - 10} more")
        
        print("="*70 + "\n")
    
    @staticmethod
    def load_config(config_path: Optional[Path] = None) -> Dict[str, Any]:
        """Load configuration from .convertmdcrc file."""
        if config_path is None:
            # Check for config in current directory or home directory
            config_path = Path('.convertmdcrc')
            if not config_path.exists():
                config_path = Path.home() / '.convertmdcrc'
        
        if not config_path.exists():
            return {}
        
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
            return config
        except (json.JSONDecodeError, IOError) as e:
            print(f"Warning: Could not load config from {config_path}: {e}", file=sys.stderr)
            return {}
    
    @staticmethod
    def check_for_updates(current_version: str = __version__) -> Optional[str]:
        """Check if a newer version is available.
        
        Returns:
            New version string if available, None otherwise
        """
        try:
            with urllib.request.urlopen(__version_url__, timeout=5) as response:
                latest_version = response.read().decode('utf-8').strip()
                
                # Simple version comparison (assumes semantic versioning)
                current_parts = [int(x) for x in current_version.split('.')]
                latest_parts = [int(x) for x in latest_version.split('.')]
                
                if latest_parts > current_parts:
                    return latest_version
                return None
        except (urllib.error.URLError, ValueError, Exception) as e:
            if isinstance(e, urllib.error.URLError):
                print(f"Unable to check for updates: {e.reason}", file=sys.stderr)
            else:
                print(f"Error checking for updates: {e}", file=sys.stderr)
            return None
    
    @staticmethod
    def auto_update() -> bool:
        """Download and install the latest version of the script.
        
        Returns:
            True if update successful, False otherwise
        """
        try:
            print("Checking for updates...")
            latest_version = CursorRuleConverter.check_for_updates()
            
            if not latest_version:
                print(f"You are already running the latest version ({__version__})")
                return True
            
            print(f"New version available: {latest_version} (current: {__version__})")
            response = input("Do you want to update? [y/N]: ").strip().lower()
            
            if response != 'y':
                print("Update cancelled.")
                return False
            
            print(f"Downloading version {latest_version}...")
            
            # Download new version
            with urllib.request.urlopen(__update_url__, timeout=30) as response:
                new_content = response.read()
            
            # Get current script path
            script_path = Path(__file__).resolve()
            backup_path = script_path.parent / f"{script_path.stem}.backup{script_path.suffix}"
            
            # Create backup
            print(f"Creating backup: {backup_path}")
            shutil.copy2(script_path, backup_path)
            
            # Write new version
            print(f"Installing update to: {script_path}")
            script_path.write_bytes(new_content)
            
            print(f"\n✓ Successfully updated to version {latest_version}!")
            print(f"  Backup saved to: {backup_path}")
            print(f"\nPlease restart the script to use the new version.")
            return True
            
        except Exception as e:
            print(f"\n✗ Update failed: {e}", file=sys.stderr)
            print(f"\nYou can manually download the latest version from:")
            print(f"  {__github_releases__}")
            return False
    
    def _preprocess_frontmatter(self, frontmatter_str: str) -> str:
        """
        Preprocess frontmatter to handle unquoted globs patterns.
        
        Args:
            frontmatter_str: Raw frontmatter string
            
        Returns:
            Processed frontmatter string safe for YAML parsing
        """
        lines = frontmatter_str.split('\n')
        processed_lines: List[str] = []
        
        for line in lines:
            # Check if line starts with 'globs:' or 'description:'
            if line.strip().startswith('globs:'):
                # Extract the value after 'globs:'
                parts = line.split(':', 1)
                if len(parts) == 2:
                    key = parts[0]
                    value = parts[1].strip()
                    # If value is not already quoted and contains special chars, quote it
                    if value and not (value.startswith('"') or value.startswith("'")):
                        # Quote the value
                        value = f'"{value}"'
                    processed_lines.append(f'{key}: {value}')
                    continue
            
            processed_lines.append(line)
        
        return '\n'.join(processed_lines)
    
    def _extract_rules_manually(self, rules_content: str) -> List[Dict[str, Any]]:
        """
        Fallback method to extract rules using regex when YAML parsing fails.
        
        Args:
            rules_content: Raw rules content string
            
        Returns:
            List of rule dictionaries
        """
        rules: List[Dict[str, Any]] = []
        
        # Pattern to match rule entries (- id: or - name:)
        rule_pattern = r'^\s*-\s+(id|name):\s*(.+?)$'
        
        # Split into potential rules
        lines = rules_content.split('\n')
        current_rule: Optional[Dict[str, Any]] = None
        current_field: Optional[str] = None
        buffer: List[str] = []
        
        for line in lines:
            match = re.match(rule_pattern, line)
            if match:
                # Save previous rule if exists
                if current_rule:
                    if buffer and current_field:
                        current_rule[current_field] = '\n'.join(buffer).strip()
                    rules.append(current_rule)
                
                # Start new rule
                field_name = match.group(1)
                field_value = match.group(2).strip()
                current_rule = {field_name: field_value}
                buffer = []
                current_field = None
            elif current_rule and re.match(r'^\s+(description|severity|name):\s*', line):
                # New field in current rule
                if buffer and current_field:
                    current_rule[current_field] = '\n'.join(buffer).strip()
                    buffer = []
                
                field_match = re.match(r'^\s+(description|severity|name):\s*(.*)', line)
                if field_match:
                    current_field = field_match.group(1)
                    value = field_match.group(2).strip()
                    if value and value != '|':
                        if current_field:  # Type guard
                            current_rule[current_field] = value
                        current_field = None
                    # else continue collecting multiline
            elif current_field:
                # Continuation of multiline field
                buffer.append(line)
        
        # Save last rule
        if current_rule:
            if buffer and current_field:
                current_rule[current_field] = '\n'.join(buffer).strip()
            rules.append(current_rule)
        
        return rules
    
    def parse_mdc_file(self, file_path: Path) -> Optional[Dict[str, Any]]:
        """
        Parse a .mdc file and extract frontmatter and rules.
        
        Args:
            file_path: Path to the .mdc file
            
        Returns:
            Dictionary containing parsed data or None if parsing fails
        """
        if self.verbose:
            print(f"  [DEBUG] Parsing: {file_path}")
        
        try:
            self.stats['total_size_bytes'] += file_path.stat().st_size
            content = file_path.read_text(encoding='utf-8')
            
            # Extract YAML frontmatter
            frontmatter_match = re.match(r'^---\s*\n(.*?\n)---\s*\n', content, re.DOTALL)
            if not frontmatter_match:
                self.errors.append(f"No frontmatter found in {file_path}")
                return None
            
            frontmatter_str = frontmatter_match.group(1)
            rest_content = content[frontmatter_match.end():]
            
            # Parse frontmatter as YAML
            # Handle globs field that may not be quoted
            try:
                # Pre-process frontmatter to handle unquoted globs patterns
                processed_frontmatter = self._preprocess_frontmatter(frontmatter_str)
                frontmatter = yaml.safe_load(processed_frontmatter)
            except yaml.YAMLError as e:
                self.errors.append(f"YAML parsing error in {file_path}: {e}")
                return None
            
            # Extract the rules section and references
            rules_match = re.search(r'^rules:\s*\n(.*?)(?=^references:|^---|\Z)', 
                                   rest_content, re.MULTILINE | re.DOTALL)
            references_match = re.search(r'^references:\s*\n(.*?)(?=^---|\Z)', 
                                        rest_content, re.MULTILINE | re.DOTALL)
            
            rules_data = None
            references_data = None
            enforcement_data = None
            
            if rules_match:
                rules_content = rules_match.group(1)
                
                # Check if there's an enforcement section (non-standard)
                enforcement_match = re.search(r'^enforcement:\s*\n(.*?)(\Z|^[a-z_]+:)', 
                                             rules_content, re.MULTILINE | re.DOTALL)
                if enforcement_match:
                    enforcement_data = enforcement_match.group(1).strip()
                    # Remove enforcement section from rules content
                    rules_content = rules_content[:enforcement_match.start()]
                
                rules_str = "rules:\n" + rules_content
                try:
                    parsed = yaml.safe_load(rules_str)
                    rules_data = parsed.get('rules', [])
                except yaml.YAMLError as e:
                    # Try to be more lenient - sometimes backticks cause issues
                    # Log but continue processing
                    self.errors.append(f"Warning: Could not fully parse rules in {file_path}: {e}")
                    # Try to extract rules manually using regex as fallback
                    rules_data = self._extract_rules_manually(rules_content)
            
            if references_match:
                refs_str = "references:\n" + references_match.group(1)
                try:
                    parsed = yaml.safe_load(refs_str)
                    references_data = parsed.get('references', [])
                except yaml.YAMLError as e:
                    # References might not parse as clean YAML, that's okay
                    pass
            
            # Extract markdown header (between frontmatter and rules)
            markdown_header = ""
            if rules_match:
                markdown_header = rest_content[:rules_match.start()].strip()
            
            return {
                'file_path': file_path,
                'frontmatter': frontmatter,
                'markdown_header': markdown_header,
                'rules': rules_data or [],
                'references': references_data or [],
                'enforcement': enforcement_data
            }
            
        except Exception as e:
            self.errors.append(f"Error reading {file_path}: {e}")
            return None
    
    def format_rule_as_markdown(self, rule: Dict[str, Any], level: int = 3) -> str:
        """
        Format a single rule as markdown for Copilot instructions.
        
        Args:
            rule: Rule dictionary with id, description, severity
            level: Heading level (default: 3 for ###)
            
        Returns:
            Formatted markdown string
        """
        rule_id = rule.get('id', 'unknown')
        description = rule.get('description', '').strip()
        severity = rule.get('severity', 'warning')
        
        # Create heading
        heading = "#" * level + f" {rule_id}"
        
        # Add severity badge
        severity_badge = f"**Severity:** `{severity}`"
        
        # Format description (already contains formatting and bullets)
        formatted_desc = description
        
        output = f"{heading}\n\n{severity_badge}\n\n{formatted_desc}\n"
        
        return output
    
    def convert_to_copilot_instructions(self, parsed_data: Dict[str, Any]) -> str:
        """
        Convert parsed Cursor Rules to Copilot Instructions format.
        
        Args:
            parsed_data: Parsed .mdc file data
            
        Returns:
            Formatted Copilot Instructions markdown
        """
        frontmatter = parsed_data['frontmatter']
        rules = parsed_data['rules']
        references = parsed_data['references']
        enforcement = parsed_data.get('enforcement')
        markdown_header = parsed_data['markdown_header']
        file_path = parsed_data['file_path']
        
        # Build the output
        output_lines: List[str] = []
        
        # Title
        description = frontmatter.get('description', file_path.stem.replace('_', ' ').title())
        output_lines.append(f"# {description}\n")
        
        # Metadata section
        output_lines.append("## Metadata\n")
        output_lines.append(f"- **Source:** `{file_path.name}`")
        output_lines.append(f"- **Always Apply:** `{frontmatter.get('alwaysApply', False)}`")
        
        if 'globs' in frontmatter:
            output_lines.append(f"- **Applies To:** `{frontmatter['globs']}`")
        
        output_lines.append("")  # Blank line
        
        # Include markdown header if present
        if markdown_header:
            output_lines.append(markdown_header)
            output_lines.append("")
        
        # Rules section
        if rules:
            output_lines.append("## Rules\n")
            
            for rule in rules:
                rule_md = self.format_rule_as_markdown(rule)
                output_lines.append(rule_md)
        
        # Enforcement section (if present)
        if enforcement:
            output_lines.append("## Enforcement\n")
            output_lines.append(enforcement)
            output_lines.append("")
        
        # References section
        if references:
            output_lines.append("## References\n")
            for ref in references:
                if isinstance(ref, str):
                    output_lines.append(f"- {ref}")
                else:
                    output_lines.append(f"- {ref}")
            output_lines.append("")
        
        # Add separator
        output_lines.append("\n---\n")
        
        return "\n".join(output_lines)
    
    def process_file(self, file_path: Path) -> Optional[str]:
        """Process a single .mdc file."""
        if not file_path.suffix == '.mdc':
            return None
        
        self.stats['total_files'] += 1
        if self.verbose:
            print(f"  [DEBUG] Processing: {file_path}")
        
        parsed = self.parse_mdc_file(file_path)
        if not parsed:
            self.stats['failed'] += 1
            return None
        
        self.processed_files.append(file_path)
        self.stats['successful'] += 1
        if parsed.get('rules'):
            self.stats['total_rules'] += len(parsed['rules'])
        
        return self.convert_to_copilot_instructions(parsed)
    
    def backup_repo(self, repo_path: Path, output_path: Path) -> Optional[Path]:
        """Backup entire repository structure before conversion."""
        try:
            # Create backup directory
            backup_dir = output_path.parent / '.backups'
            backup_dir.mkdir(exist_ok=True)
            
            # Create timestamped repo backup folder
            from datetime import datetime
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            repo_name = repo_path.name
            backup_path = backup_dir / f"repo_{repo_name}_{timestamp}"
            
            print(f"Creating repository backup: {backup_path}")
            
            # Copy entire repo (excluding .git)
            def ignore_patterns(directory: str, files: List[str]) -> List[str]:
                return ['.git', '__pycache__', '*.pyc', '.DS_Store']
            
            shutil.copytree(repo_path, backup_path, ignore=ignore_patterns)
            print(f"Repository backup created successfully\n")
            
            return backup_path
        except Exception as e:
            print(f"Warning: Could not create repository backup: {e}", file=sys.stderr)
            return None
    
    def scan_directory(self, dir_path: Path, recursive: bool = True) -> Dict[Path, List[Path]]:
        """Scan directory and group .mdc files by folder."""
        pattern = "**/*.mdc" if recursive else "*.mdc"
        mdc_files = sorted(dir_path.glob(pattern))
        
        # Group files by their parent directory
        folders: Dict[Path, List[Path]] = defaultdict(list)
        for mdc_file in mdc_files:
            folders[mdc_file.parent].append(mdc_file)
        
        self.scanned_folders = dict(folders)
        return self.scanned_folders
    
    def process_directory(self, dir_path: Path, recursive: bool = True) -> List[str]:
        """Process all .mdc files in a directory."""
        pattern = "**/*.mdc" if recursive else "*.mdc"
        mdc_files = sorted(dir_path.glob(pattern))
        
        results: List[str] = []
        for mdc_file in mdc_files:
            result: Optional[str] = self.process_file(mdc_file)
            if result is not None:
                results.append(result)
        
        return results
    
    def process_selected_folders(self, selected_folders: List[Path]) -> List[str]:
        """Process .mdc files from selected folders only."""
        results: List[str] = []
        for folder in selected_folders:
            if folder in self.scanned_folders:
                for mdc_file in self.scanned_folders[folder]:
                    result: Optional[str] = self.process_file(mdc_file)
                    if result is not None:
                        results.append(result)
        return results
    
    def process_files_with_progress(self, files: List[Path]) -> List[str]:
        """Process specific files with progress tracking."""
        results: List[str] = []
        total = len(files)
        
        print("")
        for idx, mdc_file in enumerate(files, 1):
            print(f"[{idx}/{total}] Processing: {mdc_file.name}")
            result: Optional[str] = self.process_file(mdc_file)
            if result is not None:
                results.append(result)
                print(f"  ✓ Done")
            else:
                print(f"  ✗ Failed")
        
        return results
    
    def process_directory_with_progress(self, dir_path: Path, recursive: bool = True) -> List[str]:
        """Process all .mdc files in a directory with progress tracking."""
        pattern = "**/*.mdc" if recursive else "*.mdc"
        mdc_files = sorted(dir_path.glob(pattern))
        
        results: List[str] = []
        total = len(mdc_files)
        
        print("")
        for idx, mdc_file in enumerate(mdc_files, 1):
            rel_path = mdc_file.relative_to(dir_path)
            print(f"[{idx}/{total}] Processing: {rel_path}")
            result: Optional[str] = self.process_file(mdc_file)
            if result is not None:
                results.append(result)
                print(f"  ✓ Done")
            else:
                print(f"  ✗ Failed")
        
        return results
    
    def process_selected_folders_with_progress(self, selected_folders: List[Path]) -> List[str]:
        """Process .mdc files from selected folders with progress tracking."""
        results: List[str] = []
        
        # Count total files
        total = sum(len(self.scanned_folders.get(folder, [])) for folder in selected_folders)
        current = 0
        
        print("")
        for folder in selected_folders:
            if folder in self.scanned_folders:
                for mdc_file in self.scanned_folders[folder]:
                    current += 1
                    print(f"[{current}/{total}] Processing: {mdc_file.name}")
                    result: Optional[str] = self.process_file(mdc_file)
                    if result is not None:
                        results.append(result)
                        print(f"  ✓ Done")
                    else:
                        print(f"  ✗ Failed")
        
        return results
    
    def convert(self, input_path: Path, output_path: Optional[Path] = None, 
                recursive: bool = True, interactive: bool = False,
                backup_existing: bool = True, dry_run: bool = False,
                show_stats: bool = False) -> bool:
        """
        Main conversion function.
        
        Args:
            input_path: Input file or directory path
            output_path: Output file path (if None, prints to stdout)
            recursive: Process directories recursively
            interactive: Enable interactive folder selection mode
            backup_existing: Create backup of existing output file before overwriting
            dry_run: Preview conversion without writing files
            show_stats: Display detailed statistics after conversion
            
        Returns:
            True if successful, False otherwise
        """
        from datetime import datetime as dt
        self.stats['start_time'] = dt.now()
        
        if dry_run:
            print("\n[DRY RUN MODE] - No files will be modified\n")
        
        if self.verbose:
            print(f"[DEBUG] Verbose mode enabled")
            print(f"[DEBUG] Input path: {input_path}")
            print(f"[DEBUG] Output path: {output_path}")
            print(f"[DEBUG] Recursive: {recursive}")
            print(f"[DEBUG] Interactive: {interactive}")
        
        # Check if input is a GitHub URL
        if isinstance(input_path, str) and self.is_github_url(str(input_path)):
            if self.verbose:
                print(f"[DEBUG] Detected GitHub URL: {input_path}")
            
            cloned_path = self.clone_github_repo(str(input_path))
            if not cloned_path:
                return False
            
            # Backup the repo before converting
            if output_path and not dry_run:
                self.backup_repo(cloned_path, output_path)
            
            input_path = cloned_path
            # Force interactive mode for repos
            interactive = True
        
        if not input_path.exists():
            print(f"Error: {input_path} does not exist", file=sys.stderr)
            return False
        
        # Collect all converted content
        converted_content: List[str] = []
        
        if input_path.is_file():
            result = self.process_file(input_path)
            if result:
                converted_content.append(result)
        elif input_path.is_dir():
            if interactive:
                # Scan and let user choose
                print(f"Scanning for Cursor Rules in {input_path}...\n")
                folders = self.scan_directory(input_path, recursive)
                
                if not folders:
                    print("No .mdc files found.", file=sys.stderr)
                    return False
                
                # Separate root files from folder files
                root_files = folders.get(input_path, [])
                folder_files = {k: v for k, v in folders.items() if k != input_path}
                
                # Show results
                total_files = sum(len(files) for files in folders.values())
                print(f"Found {total_files} Cursor Rules file(s):\n")
                
                if root_files:
                    print(f"  Root level: {len(root_files)} file(s)")
                if folder_files:
                    print(f"  In folders: {sum(len(f) for f in folder_files.values())} file(s) across {len(folder_files)} folder(s)")
                
                print("\n" + "="*50)
                
                # Show folder breakdown
                folder_list: List[Path] = []
                if folder_files:
                    print("\nFolder breakdown:")
                    folder_list = sorted(folder_files.keys())
                    for idx, folder in enumerate(folder_list, 1):
                        rel_path = folder.relative_to(input_path) if folder != input_path else Path(".")
                        file_count = len(folder_files[folder])
                        print(f"  [{idx}] {rel_path}/ ({file_count} file{'s' if file_count != 1 else ''})")
                
                # Ask user what to convert
                print("\nConversion Options:")
                print("  [all]     Convert everything (root files + all folders)")
                print("  [folders] Convert folder files only (exclude root files)")
                print("  [files]   Convert root files only (exclude folders)")
                if folder_files:
                    print(f"  [1-{len(folder_list)}]  Convert specific folder(s) (comma-separated)")
                print("  [q]       Quit")
                
                choice = input("\nYour choice: ").strip().lower()
                
                if choice == 'q':
                    print("Cancelled.")
                    return False
                elif choice == 'all':
                    print(f"\nConverting all {total_files} file(s)...")
                    converted_content = self.process_directory_with_progress(input_path, recursive)
                elif choice == 'folders':
                    if not folder_files:
                        print("No folder files to convert.", file=sys.stderr)
                        return False
                    print(f"\nConverting {sum(len(f) for f in folder_files.values())} file(s) from folders...")
                    converted_content = self.process_selected_folders_with_progress(list(folder_files.keys()))
                elif choice == 'files':
                    if not root_files:
                        print("No root files to convert.", file=sys.stderr)
                        return False
                    print(f"\nConverting {len(root_files)} root file(s)...")
                    converted_content = self.process_files_with_progress(root_files)
                else:
                    # Parse folder selection
                    try:
                        folder_list = sorted(folder_files.keys())
                        selected_indices = [int(x.strip()) for x in choice.split(',')]
                        selected_folders = [folder_list[i-1] for i in selected_indices 
                                          if 1 <= i <= len(folder_list)]
                        
                        if not selected_folders:
                            print("No valid selections made.", file=sys.stderr)
                            return False
                        
                        total_selected = sum(len(folder_files[f]) for f in selected_folders)
                        print(f"\nConverting {total_selected} file(s) from {len(selected_folders)} folder(s)...")
                        converted_content = self.process_selected_folders_with_progress(selected_folders)
                    except (ValueError, IndexError) as e:
                        print(f"Invalid selection: {e}", file=sys.stderr)
                        return False
            else:
                converted_content = self.process_directory(input_path, recursive)
        else:
            print(f"Error: {input_path} is not a file or directory", file=sys.stderr)
            return False
        
        # Report errors
        if self.errors:
            print("\nErrors encountered:", file=sys.stderr)
            for error in self.errors:
                print(f"  - {error}", file=sys.stderr)
        
        # Build final output
        if not converted_content:
            print("No content was converted", file=sys.stderr)
            return False
        
        # Add header
        header = """# VS Code Copilot Instructions
<!-- Generated from Cursor Rules -->

"""
        
        final_content = header + "\n".join(converted_content)
        
        # Write output
        from datetime import datetime as dt
        final_content = "\n\n".join(converted_content)
        self.stats['end_time'] = dt.now()
        
        if dry_run:
            print("\n" + "="*70)
            print("DRY RUN RESULTS")
            print("="*70)
            print(f"\nWould convert {len(self.processed_files)} file(s)")
            if output_path:
                print(f"Would write to: {output_path}")
                print(f"Output size: {len(final_content)} characters ({len(final_content)/1024:.2f} KB)")
            else:
                print("Would write to: stdout")
            
            if self.errors:
                print(f"\nErrors encountered: {len(self.errors)}")
                for error in self.errors[:5]:
                    print(f"  - {error}")
                if len(self.errors) > 5:
                    print(f"  ... and {len(self.errors) - 5} more")
        elif output_path:
            # Handle backup if file exists
            if output_path.exists() and backup_existing:
                # Create backup directory next to the output file
                backup_dir = output_path.parent / '.backups'
                backup_dir.mkdir(exist_ok=True)
                
                # Create backup filename with timestamp
                timestamp = dt.now().strftime('%Y%m%d_%H%M%S')
                backup_filename = f"{output_path.stem}_{timestamp}{output_path.suffix}"
                backup_path = backup_dir / backup_filename
                
                # Copy existing file to backup location
                shutil.copy2(output_path, backup_path)
                print(f"Backup created: {backup_path}")
            elif output_path.exists() and not backup_existing:
                print(f"Overwriting existing file: {output_path}")
            
            output_path.write_text(final_content, encoding='utf-8')
            print(f"\nSuccessfully converted {len(self.processed_files)} file(s)")
            print(f"Output written to: {output_path}")
        else:
            print(final_content)
        
        # Show statistics if requested
        if show_stats:
            self.print_statistics()
        
        # Cleanup temp repo if it was cloned
        self.cleanup_temp_repo()
        
        return True
        
        # Cleanup temp repo if it was cloned
        self.cleanup_temp_repo()
        
        return True


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="""
╔══════════════════════════════════════════════════════════════════════════════╗
║        Cursor Rules to VS Code Copilot Instructions Converter               ║
╚══════════════════════════════════════════════════════════════════════════════╝

Convert Cursor Rules (.mdc files) to VS Code Copilot Instructions format.

This tool parses Cursor Rules frontmatter (YAML) and converts the rules into
properly formatted VS Code Copilot Instructions. It handles:
  • Single files or entire directory trees
  • GitHub repository cloning and conversion
  • Interactive folder/file selection
  • Automatic backups of existing output files
  • Progress tracking for large conversions
        """,
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
╔══════════════════════════════════════════════════════════════════════════════╗
║ USAGE EXAMPLES                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─ Basic Conversion ────────────────────────────────────────────────────────────┐
│                                                                               │
│ Convert a single file:                                                        │
│   python convertmdc.py examples/engineering/api_standards.mdc output.md      │
│                                                                               │
│ Convert all files in a directory (recursive by default):                     │
│   python convertmdc.py examples/ copilot-instructions.md                     │
│                                                                               │
│ Print to stdout instead of file:                                             │
│   python convertmdc.py examples/engineering/api_standards.mdc                │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

┌─ Interactive Mode ────────────────────────────────────────────────────────────┐
│                                                                               │
│ Scan and choose specific folders or files:                                   │
│   python convertmdc.py -i examples/ output.md                                │
│                                                                               │
│ Interactive options presented:                                               │
│   [all]     - Convert all files found                                        │
│   [folders] - Convert folder files only (exclude root)                       │
│   [files]   - Convert root files only (exclude folders)                      │
│   [1-N]     - Convert specific folders (comma-separated: 1,3,5)              │
│   [q]       - Quit                                                            │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

┌─ GitHub Repository Support ───────────────────────────────────────────────────┐
│                                                                               │
│ Clone and convert a GitHub repository:                                       │
│   python convertmdc.py https://github.com/user/repo output.md                │
│                                                                               │
│ Supported URL formats:                                                        │
│   • https://github.com/user/repo                                             │
│   • https://github.com/user/repo.git                                         │
│   • git@github.com:user/repo.git                                             │
│                                                                               │
│ Note: GitHub repos automatically enable interactive mode and create backups  │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

┌─ Backup & Overwrite ──────────────────────────────────────────────────────────┐
│                                                                               │
│ Automatic backup (default behavior):                                         │
│   python convertmdc.py examples/ output.md                                   │
│   → Creates: .backups/output_20260106_143022.md                              │
│                                                                               │
│ Overwrite without backup:                                                    │
│   python convertmdc.py examples/ output.md --no-backup                       │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

┌─ Non-Recursive Mode ──────────────────────────────────────────────────────────┐
│                                                                               │
│ Process only files in the specified directory (no subdirectories):           │
│   python convertmdc.py --no-recursive examples/ output.md                    │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

┌─ Dry Run & Debugging ─────────────────────────────────────────────────────────┐
│                                                                               │
│ Preview conversion without writing files:                                    │
│   python convertmdc.py --dry-run examples/ output.md                         │
│                                                                               │
│ Enable verbose debug logging:                                                │
│   python convertmdc.py -v examples/ output.md                                │
│                                                                               │
│ Show detailed statistics after conversion:                                   │
│   python convertmdc.py --stats examples/ output.md                           │
│                                                                               │
│ Combine options:                                                             │
│   python convertmdc.py --dry-run --stats -v examples/ output.md              │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

┌─ Configuration File ──────────────────────────────────────────────────────────┐
│                                                                               │
│ Create .convertmdcrc in current or home directory:                           │
│   {                                                                           │
│     "verbose": true,                                                          │
│     "dry_run": false,                                                         │
│     "show_stats": true                                                        │
│   }                                                                           │
│                                                                               │
│ Use custom config file:                                                      │
│   python convertmdc.py --config myconfig.json examples/ output.md            │
│                                                                               │
│ Use preset configurations:                                                   │
│   python convertmdc.py --preset dev examples/ output.md                      │
│   python convertmdc.py --preset prod examples/ output.md                     │
│   python convertmdc.py --preset preview examples/ output.md                  │
│                                                                               │
│ Available presets:                                                           │
│   dev     - Development (verbose=true, stats=true)                           │
│   prod    - Production (all quiet, no extras)                                │
│   preview - Preview mode (dry-run=true, stats=true)                          │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

┌─ Version Management ──────────────────────────────────────────────────────────┐
│                                                                               │
│ Check current version:                                                       │
│   python convertmdc.py --version                                             │
│                                                                               │
│ Check for updates:                                                           │
│   python convertmdc.py --check-update                                        │
│                                                                               │
│ Auto-update to latest version:                                               │
│   python convertmdc.py --update                                              │
│                                                                               │
│ Note: Creates backup before updating (script.backup.py)                      │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════════════╗
║ NOTES                                                                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

• Backups are stored in .backups/ directory with timestamps
• GitHub repos are cloned to temporary directories and cleaned up after use
• Progress indicators show [X/Y] for file processing status
• Interactive mode shows detailed folder breakdown before conversion
• Empty or failed conversions are marked with ✗ in progress output
• Dry-run mode shows preview without modifying any files
• Verbose mode displays debug information during processing
• Statistics include timing, file counts, rule counts, and error details
• Config file supports: verbose, dry_run, show_stats options
• Auto-update creates backup before updating (script.backup.py)
• Version checking requires internet connection

For more information, visit: https://github.com/thynaptic/cursorvertext
        """
    )
    
    parser.add_argument(
        'input',
        type=str,
        nargs='?',
        metavar='INPUT',
        help='Input source: .mdc file, directory, or GitHub repository URL'
    )
    
    parser.add_argument(
        'output',
        type=str,
        nargs='?',
        metavar='OUTPUT',
        help='Output file path (optional, prints to stdout if omitted)'
    )
    
    parser.add_argument(
        '--no-recursive',
        action='store_true',
        dest='no_recursive',
        help='Only process files in the specified directory, skip subdirectories'
    )
    
    parser.add_argument(
        '-i', '--interactive',
        action='store_true',
        dest='interactive',
        help='Enable interactive mode to select specific folders or files to convert'
    )
    
    parser.add_argument(
        '--no-backup',
        action='store_true',
        dest='no_backup',
        help='Overwrite existing output file without creating a timestamped backup'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        dest='dry_run',
        help='Preview conversion without writing any files (shows what would be converted)'
    )
    
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        dest='verbose',
        help='Enable verbose output with detailed debugging information'
    )
    
    parser.add_argument(
        '--stats',
        action='store_true',
        dest='show_stats',
        help='Display detailed conversion statistics after processing'
    )
    
    parser.add_argument(
        '--config',
        type=str,
        metavar='CONFIG_FILE',
        help='Path to configuration file (defaults to .convertmdcrc in current or home directory)'
    )
    
    parser.add_argument(
        '--preset',
        type=str,
        choices=['dev', 'prod', 'preview'],
        metavar='PRESET',
        help='Load a preset configuration: dev (verbose+stats), prod (quiet), preview (dry-run+stats)'
    )
    
    parser.add_argument(
        '--version',
        action='version',
        version=f'%(prog)s {__version__}',
        help='Show version number and exit'
    )
    
    parser.add_argument(
        '--check-update',
        action='store_true',
        dest='check_update',
        help='Check if a newer version is available'
    )
    
    parser.add_argument(
        '--update',
        action='store_true',
        dest='auto_update',
        help='Update to the latest version'
    )
    
    args = parser.parse_args()
    
    # Handle version checking and updates first
    if args.check_update:
        print(f"Current version: {__version__}")
        latest = CursorRuleConverter.check_for_updates()
        if latest:
            print(f"New version available: {latest}")
            print(f"\nTo update, run: python3 {Path(__file__).name} --update")
            print(f"Or visit: {__github_releases__}")
        else:
            print("You are running the latest version!")
        sys.exit(0)
    
    if args.auto_update:
        success = CursorRuleConverter.auto_update()
        sys.exit(0 if success else 1)
    
    # Validate required arguments for conversion
    if not args.input:
        parser.error("the following arguments are required: INPUT")
    
    # Load preset configuration if specified
    preset_config = {}
    if hasattr(args, 'preset') and args.preset:
        preset_file = Path(__file__).parent / f".convertmdcrc.{args.preset}"
        if preset_file.exists():
            print(f"Loading preset: {args.preset}")
            preset_config = CursorRuleConverter.load_config(preset_file)
        else:
            print(f"Warning: Preset '{args.preset}' not found, using defaults", file=sys.stderr)
    
    # Load configuration file if specified
    # If preset is used, only load user config if --config is explicitly specified
    config = {}
    if hasattr(args, 'config') and args.config:
        config = CursorRuleConverter.load_config(Path(args.config))
    elif not args.preset:
        # Only auto-load .convertmdcrc if no preset is specified
        config = CursorRuleConverter.load_config(None)
    
    # Merge configs: preset < config file < CLI args (CLI has highest precedence)
    merged_config = {**preset_config, **config}
    
    # Merge CLI args with config - only use CLI if explicitly set
    # For boolean flags, if they weren't explicitly set, use config value
    verbose = merged_config.get('verbose', False)
    dry_run = merged_config.get('dry_run', False)
    show_stats = merged_config.get('show_stats', False)
    
    # Override with CLI args if they were explicitly provided
    if args.verbose:
        verbose = True
    if args.dry_run:
        dry_run = True
    if args.show_stats:
        show_stats = True
    
    # Convert paths (or keep as string for GitHub URL)
    converter = CursorRuleConverter(verbose=verbose)
    if converter.is_github_url(args.input):
        input_path = args.input  # Keep as string for GitHub URLs
    else:
        input_path = Path(args.input)
    output_path = Path(args.output) if args.output else None
    
    # Run converter (already instantiated above for GitHub URL check)
    success = converter.convert(
        input_path,
        output_path,
        recursive=not args.no_recursive,
        interactive=args.interactive,
        backup_existing=not args.no_backup,
        dry_run=dry_run,
        show_stats=show_stats
    )
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()