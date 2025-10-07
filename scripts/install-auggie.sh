#!/bin/bash
# Automated Auggie Installation Script

set -e

echo "🚀 Auggie Installation Script"
echo ""

# Check Node version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node --version 2>/dev/null || echo "not installed")

if [[ "$NODE_VERSION" == "not installed" ]]; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js 22+ first"
    exit 1
fi

# Extract major version
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)

if [ "$MAJOR_VERSION" -lt 22 ]; then
    echo "⚠️  Current Node version: $NODE_VERSION"
    echo "⚠️  Auggie requires Node.js 22 or later"
    echo ""
    echo "Please complete the Node.js 22 installation that just opened"
    echo "Then run this script again"
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION (compatible)"
echo ""

# Install Auggie
echo "📥 Installing Auggie CLI..."
echo "You will be prompted for your admin password"
echo ""

sudo npm install -g @augmentcode/auggie

echo ""
echo "✅ Auggie installed successfully!"
echo ""

# Verify installation
echo "🔍 Verifying installation..."
AUGGIE_VERSION=$(auggie --version 2>/dev/null || echo "failed")

if [[ "$AUGGIE_VERSION" == "failed" ]]; then
    echo "❌ Installation verification failed"
    exit 1
fi

echo "✅ Auggie version: $AUGGIE_VERSION"
echo ""

# Show usage
echo "🎉 Installation complete!"
echo ""
echo "Usage:"
echo "  auggie              # Interactive mode"
echo "  auggie review       # Review current changes"
echo "  auggie chat         # Chat with AI"
echo "  auggie --help       # Show all commands"
echo ""
echo "Try it now: auggie"

