#!/bin/bash
# Generate SHA256 hash for Homebrew formula after GitHub release

set -e

VERSION=${1:-"1.0.0"}
REPO_URL="https://github.com/thynaptic/Cursor2Copilot-Rules-Coverter"

echo "Generating SHA256 for version v${VERSION}..."
echo ""

# Download the release tarball
TARBALL_URL="${REPO_URL}/archive/refs/tags/v${VERSION}.tar.gz"
echo "Downloading: ${TARBALL_URL}"
curl -L "${TARBALL_URL}" -o "release-${VERSION}.tar.gz"

# Calculate SHA256
SHA256=$(shasum -a 256 "release-${VERSION}.tar.gz" | awk '{print $1}')

echo ""
echo "✓ Download complete"
echo ""
echo "SHA256: ${SHA256}"
echo ""
echo "Update Formula/cursor-rules-converter.rb with:"
echo "  url \"${TARBALL_URL}\""
echo "  sha256 \"${SHA256}\""
echo ""

# Cleanup
rm "release-${VERSION}.tar.gz"
echo "Cleaned up temporary files"
