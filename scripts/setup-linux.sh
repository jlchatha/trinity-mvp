#!/bin/bash

# Trinity MVP Linux Setup Script
set -e

echo "Trinity MVP - Linux Setup"
echo "========================="
echo

echo "Checking system requirements..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found. Please install Node.js 18+"
    echo "On RHEL: sudo dnf install nodejs npm"
    exit 1
fi

echo "Node.js found: $(node --version)"

# Check Claude Code
if ! command -v claude &> /dev/null; then
    echo "WARNING: Claude Code not found"
    echo "Please install Claude Code: https://claude.ai/code"
    echo "Then run this setup script again"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo
echo "Installing Trinity MVP dependencies..."
npm install

echo
echo "Setting up Trinity MVP directories..."
mkdir -p "$HOME/.trinity-mvp"/{queue/{input,processing,output,failed},sessions,logs}

echo
echo "Trinity MVP setup complete!"
echo "Run 'npm start' to launch Trinity MVP"
