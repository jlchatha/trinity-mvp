# Trinity MVP - Getting Started

Welcome to Trinity MVP! This guide will have you up and running in just 5 simple steps.

## What You'll Need

- **Linux or macOS computer** (RHEL 8+, Ubuntu 20.04+, Fedora 35+, or macOS 10.15+)
- **Internet connection** for installation
- **5-10 minutes** of your time

---

## Step 1: Download Trinity MVP 📥

1. **Download the installer**: Get the latest Trinity MVP from GitHub
2. **Save to Desktop**: Keep it somewhere easy to find

---

## Step 2: Run the Installer 🚀

1. **Open Terminal** (Linux: Ctrl+Alt+T | macOS: Cmd+Space, type "Terminal", press Enter)
2. **Run the setup command for your system**:

   **Linux:**
   ```bash
   curl -sSL https://raw.githubusercontent.com/jlchatha/trinity-mvp/main/scripts/setup-linux.sh | bash
   ```

   **macOS:**
   ```bash
   curl -sSL https://raw.githubusercontent.com/jlchatha/trinity-mvp/main/scripts/setup-macos.sh | bash
   ```

3. **Follow the prompts**: The installer will handle everything automatically

> **What's happening?** The installer downloads and sets up Node.js, Claude Code, and Trinity MVP for your platform.

---

## Step 3: Get Your Claude API Key 🔑

1. **Visit**: [Claude Console](https://console.anthropic.com/)
2. **Sign in** or create an account
3. **Get API Key**: Navigate to "API Keys" and create a new key
4. **Copy the key**: You'll need it in the next step

> **Keep it safe!** Treat your API key like a password - don't share it with anyone.

---

## Step 4: Start Trinity MVP ⚡

1. **Navigate to Trinity MVP directory**: 
   ```bash
   cd trinity-mvp
   ```
2. **Start the application**:
   ```bash
   npm start
   ```
3. **Enter your API key** when prompted
4. **Click "Start Chatting"** to begin!

---

## Step 5: Try Your First Conversation 💬

**Say hello!** Try asking Trinity:
- *"Hello! Can you introduce yourself?"*
- *"What can you help me with?"*
- *"How do I update Trinity MVP?"*

**That's it!** You're now ready to use Trinity MVP.

---

## Quick Tips 💡

### **Updating Trinity MVP**
- Click **"Trinity MVP" → "Check for Updates"** in the menu bar
- Trinity will automatically download and install updates

### **Getting Help**
- Click **"Trinity MVP" → "Send Feedback"** to create a support package
- Check the [documentation](../technical/) for advanced features

### **Something Not Working?**
- Try restarting Trinity MVP
- Check your internet connection
- Make sure your Claude API key is valid

---

## What's Next?

Now that Trinity MVP is running, you can:
- **Explore**: Ask Trinity about your projects and goals
- **Learn**: Trinity remembers your conversations and preferences
- **Collaborate**: Use Trinity for coding, writing, and problem-solving

**Welcome to the Trinity experience!** 🎉

---

*Need more help? Check out our [Technical Documentation](../technical/) or [send feedback](../../scripts/feedback.md) to our team.*