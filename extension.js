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
        vscode.commands.registerCommand('cursorvertext.checkUpdate', checkUpdate),
        vscode.commands.registerCommand('cursorvertext.openConverterUI', () => openConverterUI(context))
    );
}

/**
 * Open the Converter UI
 */
function openConverterUI(context) {
    const panel = vscode.window.createWebviewPanel(
        'cursorConverterUI',
        'Cursor Rules Converter',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    panel.webview.html = getWebviewContent();

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) {
                case 'selectFile':
                    const fileUri = await vscode.window.showOpenDialog({
                        canSelectFiles: true,
                        canSelectFolders: false,
                        canSelectMany: false,
                        filters: { 'Cursor Rules': ['mdc'] },
                        title: 'Select Cursor Rules File'
                    });
                    if (fileUri && fileUri[0]) {
                        panel.webview.postMessage({ 
                            command: 'fileSelected', 
                            path: fileUri[0].fsPath 
                        });
                    }
                    break;

                case 'selectFolder':
                    const folderUri = await vscode.window.showOpenDialog({
                        canSelectFiles: false,
                        canSelectFolders: true,
                        canSelectMany: false,
                        title: 'Select Cursor Rules Folder'
                    });
                    if (folderUri && folderUri[0]) {
                        panel.webview.postMessage({ 
                            command: 'folderSelected', 
                            path: folderUri[0].fsPath 
                        });
                    }
                    break;

                case 'selectOutput':
                    const outputUri = await vscode.window.showSaveDialog({
                        filters: { 'Markdown': ['md'] },
                        title: 'Save Copilot Instructions'
                    });
                    if (outputUri) {
                        panel.webview.postMessage({ 
                            command: 'outputSelected', 
                            path: outputUri.fsPath 
                        });
                    }
                    break;

                case 'convertFile':
                    if (!message.inputPath || !message.outputPath) {
                        vscode.window.showErrorMessage('Please select both input file and output location');
                        return;
                    }
                    const fileArgs = message.preset ? 
                        ['--preset', message.preset, message.inputPath, message.outputPath] :
                        [message.inputPath, message.outputPath];
                    await runConverter(fileArgs);
                    panel.webview.postMessage({ command: 'conversionComplete' });
                    break;

                case 'convertFolder':
                    if (!message.inputPath || !message.outputPath) {
                        vscode.window.showErrorMessage('Please select both input folder and output location');
                        return;
                    }
                    const folderArgs = message.preset ?
                        ['--preset', message.preset, '-i', message.inputPath, message.outputPath] :
                        ['-i', message.inputPath, message.outputPath];
                    await runConverter(folderArgs);
                    panel.webview.postMessage({ command: 'conversionComplete' });
                    break;

                case 'convertGithub':
                    if (!message.repoUrl || !message.outputPath) {
                        vscode.window.showErrorMessage('Please enter GitHub URL and select output location');
                        return;
                    }
                    const githubArgs = message.preset ?
                        ['--preset', message.preset, message.repoUrl, message.outputPath] :
                        [message.repoUrl, message.outputPath];
                    await runConverter(githubArgs);
                    panel.webview.postMessage({ command: 'conversionComplete' });
                    break;
            }
        },
        undefined,
        context.subscriptions
    );
}

/**
 * Get the webview HTML content
 */
function getWebviewContent() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cursor Rules Converter</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        h1 {
            color: var(--vscode-editor-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .section {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .section h2 {
            margin-top: 0;
            color: var(--vscode-editor-foreground);
            font-size: 18px;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }
        .input-group {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        input[type="text"] {
            flex: 1;
            padding: 8px 12px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            font-family: var(--vscode-font-family);
        }
        input[type="text"]:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }
        select {
            padding: 8px 12px;
            background: var(--vscode-dropdown-background);
            color: var(--vscode-dropdown-foreground);
            border: 1px solid var(--vscode-dropdown-border);
            border-radius: 3px;
            cursor: pointer;
            font-family: var(--vscode-font-family);
        }
        button {
            padding: 8px 16px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-family: var(--vscode-font-family);
            font-size: 13px;
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        button.secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        button.secondary:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        button.convert {
            width: 100%;
            padding: 10px;
            font-size: 14px;
            font-weight: 500;
            margin-top: 10px;
        }
        .status {
            margin-top: 10px;
            padding: 10px;
            border-radius: 3px;
            display: none;
        }
        .status.success {
            background: var(--vscode-testing-iconPassed);
            color: var(--vscode-editor-background);
        }
        .status.error {
            background: var(--vscode-testing-iconFailed);
            color: var(--vscode-editor-background);
        }
        .info {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔄 Cursor Rules Converter</h1>
        
        <!-- Convert File Section -->
        <div class="section">
            <h2>📄 Convert Single File</h2>
            <div class="form-group">
                <label>Input .mdc File:</label>
                <div class="input-group">
                    <input type="text" id="fileInput" placeholder="No file selected" readonly>
                    <button class="secondary" onclick="selectFile()">Browse...</button>
                </div>
            </div>
            <div class="form-group">
                <label>Output Location:</label>
                <div class="input-group">
                    <input type="text" id="fileOutput" placeholder="No output location selected" readonly>
                    <button class="secondary" onclick="selectOutput('file')">Browse...</button>
                </div>
            </div>
            <div class="form-group">
                <label>Preset:</label>
                <select id="filePreset">
                    <option value="">None</option>
                    <option value="dev">Development (verbose + stats)</option>
                    <option value="prod">Production (quiet)</option>
                    <option value="preview">Preview (dry-run)</option>
                </select>
            </div>
            <button class="convert" onclick="convertFile()">Convert File</button>
            <div id="fileStatus" class="status"></div>
        </div>

        <!-- Convert Folder Section -->
        <div class="section">
            <h2>📁 Convert Folder</h2>
            <div class="form-group">
                <label>Input Folder:</label>
                <div class="input-group">
                    <input type="text" id="folderInput" placeholder="No folder selected" readonly>
                    <button class="secondary" onclick="selectFolder()">Browse...</button>
                </div>
                <div class="info">Interactive mode will let you select which files to convert</div>
            </div>
            <div class="form-group">
                <label>Output Location:</label>
                <div class="input-group">
                    <input type="text" id="folderOutput" placeholder="No output location selected" readonly>
                    <button class="secondary" onclick="selectOutput('folder')">Browse...</button>
                </div>
            </div>
            <div class="form-group">
                <label>Preset:</label>
                <select id="folderPreset">
                    <option value="">None</option>
                    <option value="dev">Development (verbose + stats)</option>
                    <option value="prod">Production (quiet)</option>
                    <option value="preview">Preview (dry-run)</option>
                </select>
            </div>
            <button class="convert" onclick="convertFolder()">Convert Folder</button>
            <div id="folderStatus" class="status"></div>
        </div>

        <!-- Convert from GitHub Section -->
        <div class="section">
            <h2>🌐 Convert from GitHub</h2>
            <div class="form-group">
                <label>GitHub Repository URL:</label>
                <input type="text" id="githubUrl" placeholder="https://github.com/user/repo">
                <div class="info">Enter a GitHub repository URL containing .mdc files</div>
            </div>
            <div class="form-group">
                <label>Output Location:</label>
                <div class="input-group">
                    <input type="text" id="githubOutput" placeholder="No output location selected" readonly>
                    <button class="secondary" onclick="selectOutput('github')">Browse...</button>
                </div>
            </div>
            <div class="form-group">
                <label>Preset:</label>
                <select id="githubPreset">
                    <option value="">None</option>
                    <option value="dev">Development (verbose + stats)</option>
                    <option value="prod">Production (quiet)</option>
                    <option value="preview">Preview (dry-run)</option>
                </select>
            </div>
            <button class="convert" onclick="convertGithub()">Convert from GitHub</button>
            <div id="githubStatus" class="status"></div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function selectFile() {
            vscode.postMessage({ command: 'selectFile' });
        }

        function selectFolder() {
            vscode.postMessage({ command: 'selectFolder' });
        }

        function selectOutput(type) {
            vscode.postMessage({ command: 'selectOutput', type: type });
        }

        function convertFile() {
            const inputPath = document.getElementById('fileInput').value;
            const outputPath = document.getElementById('fileOutput').value;
            const preset = document.getElementById('filePreset').value;
            
            if (!inputPath || !outputPath) {
                showStatus('fileStatus', 'Please select input file and output location', 'error');
                return;
            }

            showStatus('fileStatus', 'Converting...', 'success');
            vscode.postMessage({ 
                command: 'convertFile', 
                inputPath, 
                outputPath, 
                preset: preset || null 
            });
        }

        function convertFolder() {
            const inputPath = document.getElementById('folderInput').value;
            const outputPath = document.getElementById('folderOutput').value;
            const preset = document.getElementById('folderPreset').value;
            
            if (!inputPath || !outputPath) {
                showStatus('folderStatus', 'Please select input folder and output location', 'error');
                return;
            }

            showStatus('folderStatus', 'Converting...', 'success');
            vscode.postMessage({ 
                command: 'convertFolder', 
                inputPath, 
                outputPath, 
                preset: preset || null 
            });
        }

        function convertGithub() {
            const repoUrl = document.getElementById('githubUrl').value;
            const outputPath = document.getElementById('githubOutput').value;
            const preset = document.getElementById('githubPreset').value;
            
            if (!repoUrl || !outputPath) {
                showStatus('githubStatus', 'Please enter GitHub URL and select output location', 'error');
                return;
            }

            showStatus('githubStatus', 'Converting...', 'success');
            vscode.postMessage({ 
                command: 'convertGithub', 
                repoUrl, 
                outputPath, 
                preset: preset || null 
            });
        }

        function showStatus(elementId, message, type) {
            const statusEl = document.getElementById(elementId);
            statusEl.textContent = message;
            statusEl.className = 'status ' + type;
            statusEl.style.display = 'block';
            
            if (type === 'success' && message !== 'Converting...') {
                setTimeout(() => {
                    statusEl.style.display = 'none';
                }, 5000);
            }
        }

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'fileSelected':
                    document.getElementById('fileInput').value = message.path;
                    break;
                case 'folderSelected':
                    document.getElementById('folderInput').value = message.path;
                    break;
                case 'outputSelected':
                    // Set the appropriate output field based on which one was active
                    const activeSection = document.activeElement.closest('.section');
                    if (activeSection) {
                        const outputInput = activeSection.querySelector('input[id*="Output"]');
                        if (outputInput) {
                            outputInput.value = message.path;
                        }
                    }
                    break;
                case 'conversionComplete':
                    // Find which conversion was active and show success
                    const sections = ['file', 'folder', 'github'];
                    sections.forEach(section => {
                        const statusEl = document.getElementById(section + 'Status');
                        if (statusEl.style.display === 'block' && statusEl.textContent === 'Converting...') {
                            showStatus(section + 'Status', '✓ Conversion completed successfully!', 'success');
                        }
                    });
                    break;
            }
        });
    </script>
</body>
</html>`;
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
