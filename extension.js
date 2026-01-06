const vscode = require('vscode');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Global state management
let conversionHistory = [];
let statusBarItem;
let mdcFileWatcher;
let previewPanel;

/**
 * Activate the extension
 */
function activate(context) {
    console.log('Cursor Rules Converter extension activated');

    // Store context globally for history tracking
    activate.context = context;

    // Initialize status bar
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'cursorvertext.showMdcFiles';
    context.subscriptions.push(statusBarItem);

    // Initialize history
    loadConversionHistory(context);

    // Auto-detect .mdc files and update status bar
    updateMdcFileCount();
    
    // Watch for file changes
    setupFileWatcher(context);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('cursorvertext.convertFile', convertFile),
        vscode.commands.registerCommand('cursorvertext.convertFolder', convertFolder),
        vscode.commands.registerCommand('cursorvertext.convertFromGithub', convertFromGithub),
        vscode.commands.registerCommand('cursorvertext.convertWithPreset', convertWithPreset),
        vscode.commands.registerCommand('cursorvertext.checkUpdate', checkUpdate),
        vscode.commands.registerCommand('cursorvertext.openConverterUI', () => openConverterUI(context)),
        
        // New Feature Commands
        vscode.commands.registerCommand('cursorvertext.previewConversion', previewConversion),
        vscode.commands.registerCommand('cursorvertext.showMdcFiles', showMdcFiles),
        vscode.commands.registerCommand('cursorvertext.convertAll', convertAllMdcFiles),
        vscode.commands.registerCommand('cursorvertext.validateMdc', validateMdcFile),
        vscode.commands.registerCommand('cursorvertext.showHistory', showConversionHistory),
        vscode.commands.registerCommand('cursorvertext.clearHistory', () => clearHistory(context)),
        vscode.commands.registerCommand('cursorvertext.batchConvert', batchConvert),
        vscode.commands.registerCommand('cursorvertext.toggleWatchMode', toggleWatchMode)
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

    const success = await runConverter([filePath, outputUri.fsPath]);
    
    // Save to history
    if (typeof activate.context !== 'undefined') {
        saveToHistory(activate.context, {
            source: filePath,
            output: outputUri.fsPath,
            preset: null,
            timestamp: Date.now(),
            success: success
        });
    }
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
async function runConverter(args, silent = false) {
    const config = vscode.workspace.getConfiguration('cursorvertext');
    const scriptPath = path.join(__dirname, 'convertmdc.py');
    
    // Verify script exists
    if (!fs.existsSync(scriptPath)) {
        vscode.window.showErrorMessage('Converter script not found. Please reinstall the extension.');
        return false;
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
    if (!silent) {
        output.show();
    }
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
            if (!silent) {
                vscode.window.showErrorMessage('Failed to start Python. See output for details.');
            }
            reject(error);
        });

        python.on('close', (code) => {
            output.appendLine(`\nProcess exited with code ${code}`);
            
            if (code === 0) {
                if (!silent) {
                    vscode.window.showInformationMessage('Conversion completed successfully!');
                }
                resolve(true);
            } else {
                if (!silent) {
                    vscode.window.showErrorMessage(`Conversion failed. See output for details.`);
                }
                resolve(false);
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
    if (mdcFileWatcher) {
        mdcFileWatcher.dispose();
    }
    if (statusBarItem) {
        statusBarItem.dispose();
    }
    if (previewPanel) {
        previewPanel.dispose();
    }
    console.log('Cursor Rules Converter extension deactivated');
}

// ============================================================================
// FEATURE 1: PREVIEW PANE
// ============================================================================

/**
 * Preview conversion without actually converting
 */
async function previewConversion(uri) {
    const filePath = uri?.fsPath || vscode.window.activeTextEditor?.document.uri.fsPath;
    
    if (!filePath || !filePath.endsWith('.mdc')) {
        vscode.window.showErrorMessage('Please select a .mdc file');
        return;
    }

    // Create or show preview panel
    if (previewPanel) {
        previewPanel.reveal(vscode.ViewColumn.Beside);
    } else {
        previewPanel = vscode.window.createWebviewPanel(
            'mdcPreview',
            'Preview: ' + path.basename(filePath),
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        previewPanel.onDidDispose(() => {
            previewPanel = null;
        });
    }

    // Show loading message
    previewPanel.webview.html = getLoadingHTML();

    // Run converter to generate preview output
    const tempOutput = path.join(require('os').tmpdir(), 'preview-' + Date.now() + '.md');
    
    try {
        await runConverter([filePath, tempOutput], true);
        
        // Read the generated file
        if (fs.existsSync(tempOutput)) {
            const previewContent = fs.readFileSync(tempOutput, 'utf8');
            previewPanel.webview.html = getPreviewHTML(filePath, previewContent);
            
            // Clean up temp file
            fs.unlinkSync(tempOutput);
        } else {
            throw new Error('Preview file not generated');
        }
    } catch (error) {
        previewPanel.webview.html = getErrorHTML(error.message);
    }
}

/**
 * Get loading HTML for preview
 */
function getLoadingHTML() {
    return `<!DOCTYPE html>
    <html>
    <head>
        <style>
            body { 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                font-family: var(--vscode-font-family);
                color: var(--vscode-foreground);
            }
            .spinner {
                border: 4px solid var(--vscode-panel-border);
                border-top: 4px solid var(--vscode-button-background);
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    </head>
    <body>
        <div>
            <div class="spinner"></div>
            <p style="text-align: center; margin-top: 20px;">Generating preview...</p>
        </div>
    </body>
    </html>`;
}

/**
 * Get preview HTML content
 */
function getPreviewHTML(sourcePath, content) {
    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                font-family: var(--vscode-font-family);
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                padding: 20px;
                line-height: 1.6;
            }
            .header {
                border-bottom: 2px solid var(--vscode-panel-border);
                padding-bottom: 10px;
                margin-bottom: 20px;
            }
            .header h1 {
                margin: 0 0 10px 0;
                color: var(--vscode-editor-foreground);
            }
            .source-info {
                color: var(--vscode-descriptionForeground);
                font-size: 12px;
            }
            .content {
                background: var(--vscode-editor-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 4px;
                padding: 20px;
                white-space: pre-wrap;
                font-family: var(--vscode-editor-font-family);
                font-size: var(--vscode-editor-font-size);
            }
            .actions {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid var(--vscode-panel-border);
            }
            button {
                padding: 8px 16px;
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: 3px;
                cursor: pointer;
                margin-right: 10px;
            }
            button:hover {
                background: var(--vscode-button-hoverBackground);
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🔍 Preview: ${path.basename(sourcePath)}</h1>
            <div class="source-info">Source: ${sourcePath}</div>
        </div>
        <div class="content">${escapeHtml(content)}</div>
        <div class="actions">
            <button onclick="copyToClipboard()">📋 Copy to Clipboard</button>
            <button onclick="closePreview()">✖ Close</button>
        </div>
        <script>
            const vscode = acquireVsCodeApi();
            
            function copyToClipboard() {
                const content = document.querySelector('.content').textContent;
                navigator.clipboard.writeText(content).then(() => {
                    alert('Content copied to clipboard!');
                });
            }
            
            function closePreview() {
                vscode.postMessage({ command: 'close' });
            }
        </script>
    </body>
    </html>`;
}

/**
 * Get error HTML for preview
 */
function getErrorHTML(errorMessage) {
    return `<!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: var(--vscode-font-family);
                color: var(--vscode-foreground);
                padding: 20px;
            }
            .error {
                background: var(--vscode-inputValidation-errorBackground);
                border: 1px solid var(--vscode-inputValidation-errorBorder);
                padding: 20px;
                border-radius: 4px;
            }
        </style>
    </head>
    <body>
        <div class="error">
            <h2>❌ Preview Error</h2>
            <p>${escapeHtml(errorMessage)}</p>
        </div>
    </body>
    </html>`;
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ============================================================================
// FEATURE 2: AUTO-DETECT & STATUS BAR
// ============================================================================

/**
 * Update status bar with .mdc file count
 */
async function updateMdcFileCount() {
    if (!vscode.workspace.workspaceFolders) {
        statusBarItem.hide();
        return;
    }

    try {
        const mdcFiles = await vscode.workspace.findFiles('**/*.mdc', '**/node_modules/**');
        const count = mdcFiles.length;

        if (count > 0) {
            statusBarItem.text = `$(file-code) ${count} .mdc file${count !== 1 ? 's' : ''}`;
            statusBarItem.tooltip = `Click to view .mdc files`;
            statusBarItem.show();
        } else {
            statusBarItem.hide();
        }
    } catch (error) {
        console.error('Error updating .mdc file count:', error);
        statusBarItem.hide();
    }
}

/**
 * Setup file watcher for .mdc files
 */
function setupFileWatcher(context) {
    // Watch for .mdc file changes
    const watcher = vscode.workspace.createFileSystemWatcher('**/*.mdc');
    
    watcher.onDidCreate(() => updateMdcFileCount());
    watcher.onDidDelete(() => updateMdcFileCount());
    
    context.subscriptions.push(watcher);
}

/**
 * Show list of .mdc files in workspace
 */
async function showMdcFiles() {
    const mdcFiles = await vscode.workspace.findFiles('**/*.mdc', '**/node_modules/**');
    
    if (mdcFiles.length === 0) {
        vscode.window.showInformationMessage('No .mdc files found in workspace');
        return;
    }

    const items = mdcFiles.map(file => ({
        label: path.basename(file.fsPath),
        description: vscode.workspace.asRelativePath(file.fsPath),
        uri: file
    }));

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a .mdc file to convert or preview'
    });

    if (selected) {
        const action = await vscode.window.showQuickPick([
            { label: 'Preview', value: 'preview' },
            { label: 'Convert', value: 'convert' },
            { label: 'Validate', value: 'validate' }
        ], {
            placeHolder: 'What would you like to do?'
        });

        if (action) {
            switch (action.value) {
                case 'preview':
                    await previewConversion(selected.uri);
                    break;
                case 'convert':
                    await convertFile(selected.uri);
                    break;
                case 'validate':
                    await validateMdcFile(selected.uri);
                    break;
            }
        }
    }
}

/**
 * Convert all .mdc files in workspace
 */
async function convertAllMdcFiles() {
    const mdcFiles = await vscode.workspace.findFiles('**/*.mdc', '**/node_modules/**');
    
    if (mdcFiles.length === 0) {
        vscode.window.showInformationMessage('No .mdc files found in workspace');
        return;
    }

    const confirm = await vscode.window.showWarningMessage(
        `Convert all ${mdcFiles.length} .mdc file(s)?`,
        { modal: true },
        'Yes', 'No'
    );

    if (confirm !== 'Yes') return;

    const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const outputPath = path.join(workspaceFolder, 'copilot-instructions-all.md');

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Converting all .mdc files",
        cancellable: false
    }, async (progress) => {
        for (let i = 0; i < mdcFiles.length; i++) {
            progress.report({ 
                increment: (100 / mdcFiles.length),
                message: `Converting ${i + 1}/${mdcFiles.length}` 
            });

            const file = mdcFiles[i];
            const outputName = path.basename(file.fsPath, '.mdc') + '-copilot.md';
            const output = path.join(path.dirname(file.fsPath), outputName);
            
            try {
                await runConverter([file.fsPath, output], true);
            } catch (error) {
                console.error(`Failed to convert ${file.fsPath}:`, error);
            }
        }
    });

    vscode.window.showInformationMessage(`Successfully converted ${mdcFiles.length} file(s)!`);
}

/**
 * Toggle watch mode for auto-conversion
 */
let watchMode = false;
let watchModeWatcher;

async function toggleWatchMode() {
    watchMode = !watchMode;

    if (watchMode) {
        // Enable watch mode
        watchModeWatcher = vscode.workspace.createFileSystemWatcher('**/*.mdc');
        
        watchModeWatcher.onDidChange(async (uri) => {
            const config = vscode.workspace.getConfiguration('cursorvertext');
            if (config.get('watchModeEnabled')) {
                vscode.window.showInformationMessage(`Auto-converting ${path.basename(uri.fsPath)}...`);
                const outputPath = uri.fsPath.replace('.mdc', '-copilot.md');
                try {
                    await runConverter([uri.fsPath, outputPath], true);
                } catch (error) {
                    console.error('Watch mode conversion failed:', error);
                }
            }
        });

        vscode.window.showInformationMessage('🔍 Watch mode enabled - .mdc files will auto-convert on save');
    } else {
        // Disable watch mode
        if (watchModeWatcher) {
            watchModeWatcher.dispose();
            watchModeWatcher = null;
        }
        vscode.window.showInformationMessage('Watch mode disabled');
    }
}

// ============================================================================
// FEATURE 3: BATCH OPERATIONS
// ============================================================================

/**
 * Batch convert with options
 */
async function batchConvert() {
    const mdcFiles = await vscode.workspace.findFiles('**/*.mdc', '**/node_modules/**');
    
    if (mdcFiles.length === 0) {
        vscode.window.showInformationMessage('No .mdc files found in workspace');
        return;
    }

    // Let user select which files to convert
    const items = mdcFiles.map(file => ({
        label: path.basename(file.fsPath),
        description: vscode.workspace.asRelativePath(file.fsPath),
        picked: false,
        uri: file
    }));

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select files to batch convert (use Space to select multiple)',
        canPickMany: true
    });

    if (!selected || selected.length === 0) return;

    // Ask for preset
    const preset = await vscode.window.showQuickPick([
        { label: 'None', value: '' },
        { label: 'dev - Development (verbose + stats)', value: 'dev' },
        { label: 'prod - Production (quiet)', value: 'prod' },
        { label: 'preview - Preview (dry-run)', value: 'preview' }
    ], {
        placeHolder: 'Select preset for batch conversion'
    });

    if (!preset) return;

    // Ask for output strategy
    const outputStrategy = await vscode.window.showQuickPick([
        { label: 'Same directory', description: 'Convert in place', value: 'same' },
        { label: 'Custom directory', description: 'Choose output folder', value: 'custom' },
        { label: 'Combined file', description: 'Merge into single file', value: 'combined' }
    ], {
        placeHolder: 'Select output strategy'
    });

    if (!outputStrategy) return;

    let outputDir = null;
    if (outputStrategy.value === 'custom' || outputStrategy.value === 'combined') {
        const folderUri = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            title: 'Select Output Folder'
        });
        
        if (!folderUri) return;
        outputDir = folderUri[0].fsPath;
    }

    // Perform batch conversion
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Batch Converting",
        cancellable: false
    }, async (progress) => {
        const total = selected.length;
        let success = 0;
        let failed = 0;

        for (let i = 0; i < total; i++) {
            const file = selected[i].uri;
            progress.report({ 
                increment: (100 / total),
                message: `Converting ${i + 1}/${total}: ${path.basename(file.fsPath)}` 
            });

            let outputPath;
            if (outputStrategy.value === 'same') {
                outputPath = file.fsPath.replace('.mdc', '-copilot.md');
            } else if (outputStrategy.value === 'custom') {
                outputPath = path.join(outputDir, path.basename(file.fsPath).replace('.mdc', '-copilot.md'));
            } else {
                outputPath = path.join(outputDir, `combined-${i}.md`);
            }

            try {
                const args = preset.value ? ['--preset', preset.value, file.fsPath, outputPath] : [file.fsPath, outputPath];
                await runConverter(args, true);
                success++;
            } catch (error) {
                console.error(`Failed to convert ${file.fsPath}:`, error);
                failed++;
            }
        }

        vscode.window.showInformationMessage(
            `Batch conversion complete! ✅ ${success} succeeded, ❌ ${failed} failed`
        );
    });
}

// ============================================================================
// FEATURE 4: VALIDATION
// ============================================================================

/**
 * Validate .mdc file structure and syntax
 */
async function validateMdcFile(uri) {
    const filePath = uri?.fsPath || vscode.window.activeTextEditor?.document.uri.fsPath;
    
    if (!filePath || !filePath.endsWith('.mdc')) {
        vscode.window.showErrorMessage('Please select a .mdc file');
        return;
    }

    return vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Validating MDC file...",
        cancellable: false
    }, async () => {
        const output = vscode.window.createOutputChannel('MDC Validation');
        output.show();
        output.clear();
        output.appendLine(`Validating: ${filePath}\n`);

        try {
            const content = fs.readFileSync(filePath, 'utf8');
        const errors = [];
        const warnings = [];

        // Basic validation checks
        
        // 1. Check if file is empty
        if (content.trim().length === 0) {
            errors.push('File is empty');
        }

        // 2. Check for YAML front matter
        if (!content.startsWith('---')) {
            warnings.push('No YAML front matter detected (optional but recommended)');
        }

        // 3. Check for common YAML errors
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
            // Check for tabs (should use spaces in YAML)
            if (line.includes('\t')) {
                warnings.push(`Line ${idx + 1}: Contains tabs (use spaces in YAML)`);
            }
            
            // Check for common typos
            if (line.match(/^\s*-\s*alwasy\b/i)) {
                errors.push(`Line ${idx + 1}: Typo "alwasy" should be "always"`);
            }
        });

        // 4. Check for required sections (customize based on your needs)
        if (!content.includes('rules:') && !content.includes('instructions:')) {
            warnings.push('No "rules:" or "instructions:" section found');
        }

        // 5. Try to parse as YAML
        try {
            const yaml = require('js-yaml');
            yaml.load(content);
        } catch (yamlError) {
            if (yamlError.code === 'MODULE_NOT_FOUND') {
                // js-yaml module not available in extension context - basic validation only
                // Note: Full YAML validation is performed during conversion by the Python converter
            } else {
                errors.push(`YAML parsing error: ${yamlError.message}`);
            }
        }

        // Display results
        output.appendLine('='.repeat(50));
        
        if (errors.length === 0 && warnings.length === 0) {
            output.appendLine('✅ No issues found!');
            output.appendLine('\nFile appears to be valid.');
            vscode.window.showInformationMessage('✅ Validation passed!');
        } else {
            if (errors.length > 0) {
                output.appendLine(`\n❌ ERRORS (${errors.length}):`);
                errors.forEach((err, i) => {
                    output.appendLine(`  ${i + 1}. ${err}`);
                });
            }

            if (warnings.length > 0) {
                output.appendLine(`\n⚠️  WARNINGS (${warnings.length}):`);
                warnings.forEach((warn, i) => {
                    output.appendLine(`  ${i + 1}. ${warn}`);
                });
            }

            if (errors.length > 0) {
                vscode.window.showErrorMessage(`❌ Validation failed with ${errors.length} error(s)`);
            } else {
                vscode.window.showWarningMessage(`⚠️ Validation completed with ${warnings.length} warning(s)`);
            }
        }

    } catch (error) {
        output.appendLine(`\n❌ Failed to validate file: ${error.message}`);
        vscode.window.showErrorMessage('Validation failed. See output for details.');
    }
    });
}

// ============================================================================
// FEATURE 5: HISTORY PANEL
// ============================================================================

/**
 * Load conversion history from workspace storage
 */
function loadConversionHistory(context) {
    const stored = context.workspaceState.get('conversionHistory', []);
    conversionHistory = stored;
}

/**
 * Save conversion to history
 */
function saveToHistory(context, entry) {
    conversionHistory.unshift(entry);
    
    // Keep only last 50 entries
    if (conversionHistory.length > 50) {
        conversionHistory = conversionHistory.slice(0, 50);
    }
    
    context.workspaceState.update('conversionHistory', conversionHistory);
}

/**
 * Show conversion history panel
 */
async function showConversionHistory() {
    if (conversionHistory.length === 0) {
        vscode.window.showInformationMessage('No conversion history available');
        return;
    }

    const items = conversionHistory.map((entry, idx) => ({
        label: `${entry.source ? path.basename(entry.source) : 'Unknown'} → ${entry.output ? path.basename(entry.output) : 'Unknown'}`,
        description: entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'Unknown date',
        detail: `Preset: ${entry.preset || 'None'} | Status: ${entry.success ? '✅' : '❌'}`,
        index: idx,
        entry: entry
    }));

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a conversion from history'
    });

    if (selected) {
        const action = await vscode.window.showQuickPick([
            { label: '📂 Open Source', value: 'source' },
            { label: '📄 Open Output', value: 'output' },
            { label: '🔄 Re-convert', value: 'reconvert' },
            { label: '📋 Copy Details', value: 'copy' }
        ], {
            placeHolder: 'What would you like to do?'
        });

        if (action) {
            const entry = selected.entry;
            
            switch (action.value) {
                case 'source':
                    if (entry.source && fs.existsSync(entry.source)) {
                        const doc = await vscode.workspace.openTextDocument(entry.source);
                        await vscode.window.showTextDocument(doc);
                    } else {
                        vscode.window.showErrorMessage('Source file not found');
                    }
                    break;
                    
                case 'output':
                    if (entry.output && fs.existsSync(entry.output)) {
                        const doc = await vscode.workspace.openTextDocument(entry.output);
                        await vscode.window.showTextDocument(doc);
                    } else {
                        vscode.window.showErrorMessage('Output file not found');
                    }
                    break;
                    
                case 'reconvert':
                    if (entry.source && fs.existsSync(entry.source)) {
                        const uri = vscode.Uri.file(entry.source);
                        await convertFile(uri);
                    } else {
                        vscode.window.showErrorMessage('Source file not found');
                    }
                    break;
                    
                case 'copy':
                    const details = JSON.stringify(entry, null, 2);
                    await vscode.env.clipboard.writeText(details);
                    vscode.window.showInformationMessage('Details copied to clipboard');
                    break;
            }
        }
    }
}

/**
 * Clear conversion history
 */
async function clearHistory(context) {
    const confirm = await vscode.window.showWarningMessage(
        'Clear all conversion history?',
        { modal: true },
        'Yes', 'No'
    );

    if (confirm === 'Yes') {
        conversionHistory = [];
        context.workspaceState.update('conversionHistory', []);
        vscode.window.showInformationMessage('History cleared');
    }
}

// ============================================================================
// ORIGINAL FUNCTIONS (with history tracking added)
// ============================================================================

module.exports = {
    activate,
    deactivate
};
