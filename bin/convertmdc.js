#!/usr/bin/env node

/**
 * npm CLI wrapper for cursor-rules-converter
 * Executes the Python script with Node.js process management
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Find the Python script
const scriptPath = path.join(__dirname, '..', 'convertmdc.py');

// Check if Python script exists
if (!fs.existsSync(scriptPath)) {
    console.error(`Error: Cannot find convertmdc.py at ${scriptPath}`);
    process.exit(1);
}

// Try common Python commands
const pythonCommands = ['python3', 'python', 'py'];

function tryPython(commands, index = 0) {
    if (index >= commands.length) {
        console.error('Error: Python 3 not found. Please install Python 3.7 or later.');
        console.error('Visit: https://www.python.org/downloads/');
        process.exit(1);
    }

    const python = commands[index];
    const args = [scriptPath, ...process.argv.slice(2)];
    
    const proc = spawn(python, args, {
        stdio: 'inherit',
        shell: false
    });

    proc.on('error', (err) => {
        if (err.code === 'ENOENT') {
            // Try next Python command
            tryPython(commands, index + 1);
        } else {
            console.error(`Error executing Python: ${err.message}`);
            process.exit(1);
        }
    });

    proc.on('exit', (code) => {
        process.exit(code || 0);
    });
}

// Check for dependencies
const checkDeps = process.argv.includes('--check-deps') || process.argv.includes('--version');
if (!checkDeps) {
    // Quick dependency check
    const testProc = spawn('python3', ['-c', 'import yaml'], {
        stdio: 'pipe'
    });
    
    testProc.on('error', () => {
        console.warn('Warning: Python dependencies may not be installed.');
        console.warn('Run: pip3 install -r requirements.txt');
    });
    
    testProc.on('exit', (code) => {
        if (code !== 0) {
            console.warn('\nWarning: PyYAML not found. Installing dependencies...');
            console.warn('Run: pip3 install pyyaml>=5.1\n');
        }
    });
}

// Start the Python script
tryPython(pythonCommands);
