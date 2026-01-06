const vscode = require('vscode');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Activate the extension
 */
function activate(context) {
    console.log('Cursor Rules Converter extension activated');

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('cursorvertext.convertFile', convertFile),
        vscode.commands.registerCommand('cursorvertext.convertFolder', convertFolder),
        vscode.commands.registerCommand('cursorvertext.convertFromGithub', convertFromGithub),
        vscode.commands.registerCommand('cursorvertext.convertWithPreset', convertWithPreset),
        vscode.commands.registerCommand('cursorvertext.checkUpdate', checkUpdate)
    );
}

/**
 * Convert a single .mdc file
 */
async function convertFile(uri) {
    const filePath = uri?.fsPath || vscode.window.activeTextEditor?.document.uri.fsPath;
    
    if (!filePath) {
        vscode.window.showErrorMessage('No file selected');
        return;
    }

    if (!filePath.endsWith('.mdc')) {
        vscode.window.showErrorMessage('Please select a .mdc file');
        return;
    }

    // Suggest output file name
    const defaultOutputName = path.basename(filePath, '.mdc') + '-copilot-instructions.md';
    const defaultOutputPath = path.join(path.dirname(filePath), defaultOutputName);

    const outputUri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(defaultOutputPath),
        filters: { 'Markdown': ['md'] },
        title: 'Save Copilot Instructions'
    });

    if (!outputUri) return;

    await runConverter([filePath, outputUri.fsPath]);
}

/**
 * Convert a folder with interactive selection
 */
async function convertFolder(uri) {
    const folderPath = uri?.fsPath || await selectFolder();
    
    if (!folderPath) {
        vscode.window.showErrorMessage('No folder selected');
        return;
    }

    // Suggest output file name
    const defaultOutputName = 'copilot-instructions.md';
    const defaultOutputPath = path.join(folderPath, defaultOutputName);

    const outputUri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(defaultOutputPath),
        filters: { 'Markdown': ['md'] },
        title: 'Save Copilot Instructions'
    });

    if (!outputUri) return;

    // Use interactive mode
    await runConverter(['-i', folderPath, outputUri.fsPath]);
}

/**
 * Convert from GitHub repository
 */
async function convertFromGithub() {
    const repoUrl = await vscode.window.showInputBox({
        prompt: 'Enter GitHub repository URL',
        placeHolder: 'https://github.com/user/repo or github.com/user/repo',
        validateInput: (value) => {
            if (!value) return 'URL is required';
            if (!value.includes('github.com')) return 'Must be a GitHub URL';
            return null;
        }
    });

    if (!repoUrl) return;

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('Please open a workspace folder first');
        return;
    }

    const defaultOutputPath = path.join(workspaceFolder, 'copilot-instructions.md');

    const outputUri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(defaultOutputPath),
        filters: { 'Markdown': ['md'] },
        title: 'Save Copilot Instructions'
    });

    if (!outputUri) return;

    await runConverter([repoUrl, outputUri.fsPath]);
}

/**
 * Convert with preset configuration
 */
async function convertWithPreset() {
    const preset = await vscode.window.showQuickPick([
        { label: 'dev', description: 'Development mode (verbose + stats)' },
        { label: 'prod', description: 'Production mode (quiet)' },
        { label: 'preview', description: 'Preview mode (dry-run + stats)' }
    ], {
        placeHolder: 'Select a preset configuration'
    });

    if (!preset) return;

    // Select input
    const inputType = await vscode.window.showQuickPick([
        { label: 'File', value: 'file' },
        { label: 'Folder', value: 'folder' },
        { label: 'GitHub Repository', value: 'github' }
    ], {
        placeHolder: 'Select input type'
    });

    if (!inputType) return;

    let inputPath, outputUri;

    if (inputType.value === 'file') {
        const fileUri = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            filters: { 'Cursor Rules': ['mdc'] },
            title: 'Select Cursor Rule File'
        });
        if (!fileUri || fileUri.length === 0) return;
        inputPath = fileUri[0].fsPath;
    } else if (inputType.value === 'folder') {
        inputPath = await selectFolder();
        if (!inputPath) return;
    } else {
        inputPath = await vscode.window.showInputBox({
            prompt: 'Enter GitHub repository URL',
            placeHolder: 'https://github.com/user/repo'
        });
        if (!inputPath) return;
    }

    // For preview mode, output is optional
    if (preset.label !== 'preview') {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || path.dirname(inputPath);
        const defaultOutputPath = path.join(workspaceFolder, 'copilot-instructions.md');

        outputUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(defaultOutputPath),
            filters: { 'Markdown': ['md'] },
            title: 'Save Copilot Instructions'
        });

        if (!outputUri) return;
    }

    const args = ['--preset', preset.label, inputPath];
    if (outputUri) args.push(outputUri.fsPath);

    await runConverter(args);
}

/**
 * Check for updates
 */
async function checkUpdate() {
    await runConverter(['--check-update']);
}

/**
 * Run the Python converter script
 */
async function runConverter(args) {
    const config = vscode.workspace.getConfiguration('cursorvertext');
    const scriptPath = path.join(__dirname, 'convertmdc.py');
    
    // Verify script exists
    if (!fs.existsSync(scriptPath)) {
        vscode.window.showErrorMessage('Converter script not found. Please reinstall the extension.');
        return;
    }

    // Build command arguments
    const flags = [];
    
    // Only add config flags if not using preset
    if (!args.includes('--preset')) {
        if (config.get('verbose')) flags.push('-v');
        if (config.get('showStats')) flags.push('--stats');
        if (!config.get('autoBackup')) flags.push('--no-backup');
    }

    const pythonPath = config.get('pythonPath') || 'python3';
    const fullArgs = [scriptPath, ...flags, ...args];

    // Create output channel
    const output = vscode.window.createOutputChannel('Cursor Rules Converter');
    output.show();
    output.appendLine(`Running: ${pythonPath} ${fullArgs.join(' ')}\n`);

    return new Promise((resolve, reject) => {
        const python = spawn(pythonPath, fullArgs, {
            cwd: __dirname
        });

        let hasError = false;

        python.stdout.on('data', (data) => {
            output.append(data.toString());
        });

        python.stderr.on('data', (data) => {
            const message = data.toString();
            output.append(message);
            
            // Check if it's an actual error (not just warnings)
            if (message.includes('Error:') || message.includes('Traceback')) {
                hasError = true;
            }
        });

        python.on('error', (error) => {
            output.appendLine(`\nFailed to start Python: ${error.message}`);
            output.appendLine('\nPlease ensure Python 3.7+ is installed and accessible.');
            output.appendLine('You can configure the Python path in settings: cursorvertext.pythonPath');
            vscode.window.showErrorMessage('Failed to start Python. See output for details.');
            reject(error);
        });

        python.on('close', (code) => {
            output.appendLine(`\nProcess exited with code ${code}`);
            
            if (code === 0) {
                vscode.window.showInformationMessage('Conversion completed successfully!');
                resolve();
            } else {
                vscode.window.showErrorMessage(`Conversion failed. See output for details.`);
                reject(new Error(`Process exited with code ${code}`));
            }
        });
    });
}

/**
 * Select a folder using file picker
 */
async function selectFolder() {
    const folderUri = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        title: 'Select Cursor Rules Folder'
    });

    return folderUri && folderUri.length > 0 ? folderUri[0].fsPath : null;
}

/**
 * Deactivate the extension
 */
function deactivate() {
    console.log('Cursor Rules Converter extension deactivated');
}

module.exports = {
    activate,
    deactivate
};
