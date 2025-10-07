#!/bin/bash
# Complete Automated Installation - One Password Prompt Only

set -e

echo "🚀 Complete Automated Installation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This script will:"
echo "  1. Install Node.js 22"
echo "  2. Install Auggie CLI"
echo "  3. Verify everything works"
echo ""
echo "⚠️  You will be prompted for your admin password ONCE"
echo ""
read -p "Press Enter to continue..."

# Install Node.js 22 silently
echo ""
echo "📦 Installing Node.js 22..."
sudo installer -pkg /tmp/node-v22-installer.pkg -target /

echo "✅ Node.js 22 installed"
echo ""

# Verify Node installation
echo "🔍 Verifying Node.js..."
export PATH="/usr/local/bin:$PATH"
NODE_VERSION=$(node --version)
echo "✅ Node version: $NODE_VERSION"
echo ""

# Install Auggie (using cached sudo)
echo "📥 Installing Auggie CLI..."
sudo npm install -g @augmentcode/auggie

echo "✅ Auggie installed"
echo ""

# Verify Auggie
echo "🔍 Verifying Auggie..."
AUGGIE_VERSION=$(auggie --version)
echo "✅ Auggie version: $AUGGIE_VERSION"
echo ""

# Success
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Installation Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Installed:"
echo "  ✅ Node.js $NODE_VERSION"
echo "  ✅ Auggie $AUGGIE_VERSION"
echo ""
echo "Usage:"
echo "  auggie              # Interactive mode"
echo "  auggie review       # Review code changes"
echo "  auggie chat         # Chat with AI"
echo "  auggie --help       # Show all commands"
echo ""
echo "Try it now:"
echo "  auggie"
echo ""

