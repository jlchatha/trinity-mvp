# Trinity MVP - PowerShell Installer for Windows
# Run as Administrator: PowerShell -ExecutionPolicy Bypass -File Install-TrinityMVP.ps1

param(
    [switch]$QuickTest = $false,
    [string]$InstallPath = "$env:USERPROFILE\trinity-mvp"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Trinity MVP - Windows PowerShell Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator for full installation
if (-not $QuickTest) {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    $isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    
    if (-not $isAdmin) {
        Write-Host "ERROR: Full installation requires Administrator privileges" -ForegroundColor Red
        Write-Host "Right-click PowerShell and 'Run as Administrator'" -ForegroundColor Red
        Write-Host ""
        Write-Host "Or run quick test (no WSL installation): Install-TrinityMVP.ps1 -QuickTest" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
}

function Test-Prerequisites {
    Write-Host "Checking prerequisites..." -ForegroundColor Yellow
    
    $issues = @()
    
    # Check Windows version
    $version = [System.Environment]::OSVersion.Version
    if ($version.Major -lt 10) {
        $issues += "Windows 10 or later required"
    } else {
        Write-Host "✓ Windows version: $($version)" -ForegroundColor Green
    }
    
    # Check Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
        } else {
            $issues += "Node.js not found"
        }
    } catch {
        $issues += "Node.js not found"
    }
    
    # Check Git
    try {
        $gitVersion = git --version 2>$null
        if ($gitVersion) {
            Write-Host "✓ Git: $gitVersion" -ForegroundColor Green
        } else {
            $issues += "Git not found"
        }
    } catch {
        $issues += "Git not found"
    }
    
    # Check WSL (only for full installation)
    if (-not $QuickTest) {
        try {
            $wslVersion = wsl --version 2>$null
            if ($wslVersion) {
                Write-Host "✓ WSL available" -ForegroundColor Green
            } else {
                $issues += "WSL not available"
            }
        } catch {
            $issues += "WSL not available"
        }
    }
    
    return $issues
}

function Install-NodeJS {
    Write-Host "Installing Node.js 18 LTS..." -ForegroundColor Yellow
    
    $nodeInstaller = "$env:TEMP\node-installer.msi"
    $nodeUrl = "https://nodejs.org/dist/v18.18.0/node-v18.18.0-x64.msi"
    
    try {
        Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller -UseBasicParsing
        Start-Process -FilePath "msiexec" -ArgumentList "/i", $nodeInstaller, "/quiet" -Wait
        Remove-Item $nodeInstaller -Force
        Write-Host "✓ Node.js installed" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to install Node.js: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Please install manually from: https://nodejs.org/" -ForegroundColor Yellow
    }
}

function Install-Git {
    Write-Host "Installing Git for Windows..." -ForegroundColor Yellow
    
    $gitInstaller = "$env:TEMP\git-installer.exe"
    $gitUrl = "https://github.com/git-scm/git/releases/download/v2.42.0/Git-2.42.0.2-64-bit.exe"
    
    try {
        Invoke-WebRequest -Uri $gitUrl -OutFile $gitInstaller -UseBasicParsing
        Start-Process -FilePath $gitInstaller -ArgumentList "/VERYSILENT", "/NORESTART" -Wait
        Remove-Item $gitInstaller -Force
        Write-Host "✓ Git installed" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to install Git: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Please install manually from: https://git-scm.com/" -ForegroundColor Yellow
    }
}

function Install-WSL {
    Write-Host "Installing Windows Subsystem for Linux..." -ForegroundColor Yellow
    
    try {
        # Enable WSL feature
        Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -All -NoRestart
        
        # Enable Virtual Machine Platform
        Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -All -NoRestart
        
        # Install WSL2
        wsl --install --no-launch
        
        Write-Host "✓ WSL installation initiated" -ForegroundColor Green
        Write-Host "Note: System restart will be required" -ForegroundColor Yellow
    } catch {
        Write-Host "✗ Failed to install WSL: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Please install manually: wsl --install" -ForegroundColor Yellow
    }
}

function Install-TrinityMVP {
    Write-Host "Installing Trinity MVP..." -ForegroundColor Yellow
    
    # Create installation directory
    if (Test-Path $InstallPath) {
        Write-Host "Removing existing installation..." -ForegroundColor Yellow
        Remove-Item $InstallPath -Recurse -Force
    }
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    
    # Clone repository
    Write-Host "Cloning Trinity MVP repository..." -ForegroundColor Yellow
    Set-Location $InstallPath
    git clone https://github.com/jlchatha/trinity-mvp.git .
    
    # Install dependencies
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    
    # Create start script
    $startScript = @"
@echo off
cd /d "$InstallPath"
npm start
"@
    $startScript | Out-File "$InstallPath\start-trinity-mvp.bat" -Encoding ASCII
    
    # Create desktop shortcut
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut("$env:USERPROFILE\Desktop\Trinity MVP.lnk")
    $shortcut.TargetPath = "$InstallPath\start-trinity-mvp.bat"
    $shortcut.WorkingDirectory = $InstallPath
    $shortcut.Description = "Trinity MVP - AI Assistant with Persistent Memory"
    $shortcut.Save()
    
    Write-Host "✓ Trinity MVP installed to: $InstallPath" -ForegroundColor Green
    Write-Host "✓ Desktop shortcut created" -ForegroundColor Green
}

function Show-CompletionMessage {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Trinity MVP Installation Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Installation location: $InstallPath" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Get your Anthropic API key from: https://console.anthropic.com/"
    Write-Host "2. Set environment variable: `$env:ANTHROPIC_API_KEY='your-key-here'"
    Write-Host "3. Install Claude Code in WSL: https://claude.ai/code"
    Write-Host "4. Launch Trinity MVP using the desktop shortcut"
    Write-Host ""
    Write-Host "Testing:" -ForegroundColor Yellow
    Write-Host "- Health check: cd '$InstallPath' && npm run health-check"
    Write-Host "- Quick start: cd '$InstallPath' && npm start"
    Write-Host ""
    
    if (-not $QuickTest) {
        Write-Host "IMPORTANT: System restart may be required for WSL" -ForegroundColor Red
        $restart = Read-Host "Restart now? (y/N)"
        if ($restart -eq "y" -or $restart -eq "Y") {
            Restart-Computer -Force
        }
    }
}

# Main installation flow
try {
    $issues = Test-Prerequisites
    
    if ($QuickTest) {
        Write-Host "Running quick test installation (no WSL setup)..." -ForegroundColor Cyan
        
        if ($issues -contains "Node.js not found") {
            Write-Host "✗ Node.js required for quick test" -ForegroundColor Red
            Write-Host "Please install Node.js first: https://nodejs.org/" -ForegroundColor Yellow
            exit 1
        }
        
        if ($issues -contains "Git not found") {
            Write-Host "✗ Git required for quick test" -ForegroundColor Red
            Write-Host "Please install Git first: https://git-scm.com/" -ForegroundColor Yellow
            exit 1
        }
        
        Install-TrinityMVP
        Show-CompletionMessage
    } else {
        Write-Host "Running full installation..." -ForegroundColor Cyan
        
        # Install missing prerequisites
        if ($issues -contains "Node.js not found") {
            Install-NodeJS
        }
        
        if ($issues -contains "Git not found") {
            Install-Git
        }
        
        if ($issues -contains "WSL not available") {
            Install-WSL
        }
        
        # Refresh environment
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
        
        Install-TrinityMVP
        Show-CompletionMessage
    }
} catch {
    Write-Host "Installation failed: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}