#!/bin/bash

# Installation script for Cursor Rules Converter Extension v1.1.0
# This script sets up the new features

echo "🚀 Installing Cursor Rules Converter Extension v1.1.0"
echo "======================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the extension directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install failed"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Check if Python is available
echo "🐍 Checking Python installation..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✅ Python found: $PYTHON_VERSION"
else
    echo "⚠️  Warning: Python 3 not found. The extension requires Python 3.7+"
    echo "   Please install Python from https://www.python.org/"
fi

echo ""
echo "======================================================"
echo "✨ Installation complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Reload VS Code window (Cmd/Ctrl+Shift+P → 'Reload Window')"
echo "   2. Check status bar for .mdc file count"
echo "   3. Read SETUP_GUIDE.md for testing instructions"
echo "   4. Read NEW_FEATURES.md for detailed documentation"
echo ""
echo "🎯 New Features:"
echo "   • Preview Pane - See results before converting"
echo "   • Status Bar - Track .mdc files in workspace"
echo "   • Batch Operations - Convert multiple files at once"
echo "   • Validation - Check for errors before conversion"
echo "   • History Panel - Track and replay conversions"
echo ""
echo "📖 Quick Reference: QUICK_REFERENCE.md"
echo "======================================================"
