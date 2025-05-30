/**
 * Trinity MVP Theme Switcher
 * 
 * Manages theme switching between light and dark modes
 * Implements direct DOM styling approach to bypass CSS inheritance issues
 */

class TrinityThemeSwitcher {
  constructor() {
    console.log('[Trinity Theme Switcher] Initializing...');
    this.currentTheme = 'dark'; // Default theme
    
    // Clean up any existing debug indicators
    const existingDebug = document.getElementById('theme-debug-indicator');
    if (existingDebug) {
      existingDebug.remove();
    }
    
    // Define theme colors for direct DOM styling
    this.themes = {
      dark: {
        bg: '#0a0a0a',
        bgSecondary: '#1a1a1a',
        bgTertiary: '#2a2a2a',
        text: '#ffffff',
        textSecondary: '#e0e0e0',
        textMuted: '#a0a0a0',
        border: 'rgba(255, 255, 255, 0.1)'
      },
      light: {
        bg: '#f5f5f5',
        bgSecondary: '#e5e5e5',
        bgTertiary: '#d5d5d5',
        text: '#121212',
        textSecondary: '#323232',
        textMuted: '#555555',
        border: 'rgba(0, 0, 0, 0.1)'
      }
    };
    
    this.initialize();
    console.log(`[Trinity Theme Switcher] Initialized with theme: ${this.currentTheme}`);
  }

  initialize() {
    // Try to load saved theme preference
    this.loadThemePreference();
    
    // Apply current theme
    this.applyTheme(this.currentTheme);
    
    // Listen for system preference changes if browser supports it
    if (window.matchMedia) {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Set initial theme based on system preference if no saved preference
      if (!localStorage.getItem('trinity-theme')) {
        this.currentTheme = darkModeMediaQuery.matches ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
      }
      
      // Listen for changes to system preferences
      darkModeMediaQuery.addEventListener('change', (e) => {
        // Only apply if user hasn't set a preference
        if (!localStorage.getItem('trinity-theme')) {
          this.currentTheme = e.matches ? 'dark' : 'light';
          this.applyTheme(this.currentTheme);
        }
      });
    }
  }

  /**
   * Load saved theme preference from localStorage
   */
  loadThemePreference() {
    const savedTheme = localStorage.getItem('trinity-theme');
    if (savedTheme) {
      this.currentTheme = savedTheme;
    }
  }

  /**
   * Save theme preference to localStorage
   */
  saveThemePreference() {
    localStorage.setItem('trinity-theme', this.currentTheme);
  }

  /**
   * Apply theme using direct DOM styling approach
   * @param {string} theme - 'dark' or 'light'
   */
  applyTheme(theme) {
    console.log(`%c[Trinity Theme Switcher] Applying theme: ${theme}`, 'font-size: 20px; color: red; font-weight: bold;');
    
    // Ensure valid theme value
    if (theme !== 'dark' && theme !== 'light') {
      console.error(`[Trinity Theme Switcher] Invalid theme: ${theme}, defaulting to dark`);
      theme = 'dark';
    }
    
    // Set data-theme attribute for compatibility with existing CSS
    if (theme === 'dark') {
      document.documentElement.removeAttribute('data-theme');
      console.log('[Trinity Theme Switcher] Removed data-theme attribute for dark theme');
      
      // Also set dark mode for any iframes
      document.querySelectorAll('iframe').forEach(iframe => {
        try {
          iframe.contentDocument.documentElement.removeAttribute('data-theme');
        } catch (e) {
          // Ignore cross-origin issues
        }
      });
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      console.log('[Trinity Theme Switcher] Set data-theme="light" for light theme');
      
      // Also set light mode for any iframes
      document.querySelectorAll('iframe').forEach(iframe => {
        try {
          iframe.contentDocument.documentElement.setAttribute('data-theme', 'light');
        } catch (e) {
          // Ignore cross-origin issues
        }
      });
    }
    
    // Apply direct DOM styling to bypass CSS inheritance issues
    // DISABLED: This was overriding the CSS light theme styles
    // this.applyDirectStyling(theme);
    
    // DISABLED: Debug indicator no longer needed
    // this.showThemeIndicator(theme);
    
    // Save preference
    this.currentTheme = theme;
    this.saveThemePreference();
    
    // Dispatch event for other components to respond to theme change
    window.dispatchEvent(new CustomEvent('trinity-theme-changed', { 
      detail: { theme: this.currentTheme } 
    }));
    
    console.log(`%c[Trinity Theme Switcher] Theme changed to: ${this.currentTheme}`, 'font-size: 16px; color: green; font-weight: bold;');
    
    // Return the current theme for chaining
    return this.currentTheme;
  }

  /**
   * Apply direct DOM styling to key UI elements
   * @param {string} theme - 'dark' or 'light'
   */
  applyDirectStyling(theme) {
    const colors = this.themes[theme];
    console.log(`[Trinity Theme Switcher] Applying direct styling for ${theme} theme`);
    
    // Don't set data-theme here - it's already set correctly above
    
    // Wait a tick for CSS to load, then apply direct styles
    setTimeout(() => {
      try {
        // Target Trinity-specific elements
        const selectors = [
          '.trinity-unified-layout',
          '.trinity-chat-panel',
          '.trinity-chat-content',
          '.trinity-chat-messages-container',
          '.trinity-welcome-message',
          '#trinity-chat-messages',
          '.trinity-chat-header'
        ];
        
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            if (el) {
              el.style.backgroundColor = colors.bg;
              el.style.color = colors.text;
            }
          });
        });
        
        // Quick Start box special styling
        const quickStart = document.querySelector('.trinity-quick-start');
        if (quickStart) {
          if (theme === 'light') {
            quickStart.style.backgroundColor = '#e3f2fd';
            quickStart.style.border = '1px solid #90caf9';
            quickStart.style.color = '#1565c0';
          } else {
            quickStart.style.backgroundColor = '#1a237e';
            quickStart.style.border = '1px solid #3949ab';
            quickStart.style.color = colors.text;
          }
        }
        
        // Force body and html
        if (document.body) {
          document.body.style.backgroundColor = colors.bg;
          document.body.style.color = colors.text;
        }
        document.documentElement.style.backgroundColor = colors.bg;
        
        console.log(`[Trinity Theme Switcher] Direct styles applied for ${theme} theme`);
      } catch (error) {
        console.error(`[Trinity Theme Switcher] Error applying direct styles:`, error);
      }
    }, 100);
    
    // Get references to key UI elements
    const elements = this.getUIElements();
    
    // Apply styles to each element directly
    if (elements.html) {
      elements.html.style.backgroundColor = colors.bg;
      elements.html.style.color = colors.text;
      console.log(`[Trinity Theme Switcher] Styled HTML element`);
    }
    
    if (elements.body) {
      elements.body.style.backgroundColor = colors.bg;
      elements.body.style.color = colors.text;
      elements.body.style.background = colors.bg; // Also set background property
      console.log(`[Trinity Theme Switcher] Styled BODY element`);
    }
    
    if (elements.appContainer) {
      elements.appContainer.style.backgroundColor = colors.bg;
      elements.appContainer.style.color = colors.text;
    }
    
    if (elements.mainContent) {
      elements.mainContent.style.backgroundColor = colors.bg;
      elements.mainContent.style.color = colors.text;
    }
    
    if (elements.sidebar) {
      elements.sidebar.style.backgroundColor = colors.bgSecondary;
      elements.sidebar.style.color = colors.textSecondary;
      elements.sidebar.style.borderRight = `1px solid ${colors.border}`;
    }
    
    if (elements.header) {
      elements.header.style.backgroundColor = colors.bgSecondary;
      elements.header.style.color = colors.text;
      elements.header.style.borderBottom = `1px solid ${colors.border}`;
    }
    
    if (elements.contentArea) {
      elements.contentArea.style.backgroundColor = colors.bg;
      elements.contentArea.style.color = colors.text;
    }
    
    if (elements.chatContainer) {
      elements.chatContainer.style.backgroundColor = colors.bg;
      elements.chatContainer.style.color = colors.text;
    }
    
    if (elements.statusBar) {
      elements.statusBar.style.backgroundColor = colors.bgSecondary;
      elements.statusBar.style.color = colors.text;
      elements.statusBar.style.borderBottom = `1px solid ${colors.border}`;
    }
    
    // Apply to all buttons with .trinity-quick-btn class
    elements.buttons.forEach(button => {
      if (theme === 'light') {
        button.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
        button.style.color = colors.textSecondary;
        button.style.border = `1px solid rgba(0, 0, 0, 0.2)`;
      } else {
        button.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        button.style.color = colors.textSecondary;
        button.style.border = `1px solid rgba(255, 255, 255, 0.2)`;
      }
    });
    
    // Force a reflow to ensure styles are applied
    void document.documentElement.offsetHeight;
    
    // Log elements that were styled for debugging
    const styledElements = Object.entries(elements)
      .filter(([key, el]) => el && key !== 'buttons')
      .map(([key]) => key);
    
    console.log(`[Trinity Theme Switcher] Applied direct styling to: ${styledElements.join(', ')}`);
  }
  
  /**
   * Get references to all UI elements that need theme styling
   * @returns {Object} Object containing references to UI elements
   */
  getUIElements() {
    return {
      html: document.documentElement,
      body: document.body,
      appContainer: document.querySelector('.app-container'),
      mainContent: document.querySelector('.main-content'),
      sidebar: document.querySelector('.sidebar'),
      header: document.querySelector('.header'),
      contentArea: document.querySelector('.content-area'),
      chatContainer: document.querySelector('.chat-container'),
      statusBar: document.querySelector('.trinity-nav-status, .trinity-status-bar'),
      buttons: Array.from(document.querySelectorAll('.trinity-quick-btn'))
    };
  }
  
  /**
   * Show theme indicator for visibility
   * @param {string} theme - 'dark' or 'light'
   */
  showThemeIndicator(theme) {
    // Create or get debug indicator
    const debugElement = document.getElementById('theme-debug-indicator') || document.createElement('div');
    debugElement.id = 'theme-debug-indicator';
    debugElement.style.position = 'fixed';
    debugElement.style.bottom = '10px';
    debugElement.style.right = '10px';
    debugElement.style.padding = '10px';
    debugElement.style.zIndex = '99999';
    debugElement.style.fontSize = '16px';
    debugElement.style.fontWeight = 'bold';
    debugElement.style.borderRadius = '4px';
    debugElement.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.3)';
    
    if (theme === 'light') {
      debugElement.style.backgroundColor = '#0288d1';
      debugElement.style.color = 'white';
      debugElement.textContent = 'LIGHT THEME ACTIVE';
    } else {
      debugElement.style.backgroundColor = '#303030';
      debugElement.style.color = 'white';
      debugElement.textContent = 'DARK THEME ACTIVE';
    }
    
    if (!document.getElementById('theme-debug-indicator')) {
      document.body.appendChild(debugElement);
    }
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    console.log(`[Trinity Theme Switcher] Toggle called - switching from ${this.currentTheme} to ${newTheme}`);
    
    this.applyTheme(newTheme);
    
    // Debug after toggling
    const newAttribute = document.documentElement.getAttribute('data-theme');
    console.log(`[Trinity Theme Switcher] New data-theme attribute: ${newAttribute || 'not set (dark)'}`);
    
    return newTheme;
  }

  /**
   * Get current theme
   * @returns {string} Current theme ('dark' or 'light')
   */
  getTheme() {
    return this.currentTheme;
  }
}

// Initialize theme switcher when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.trinityThemeSwitcher = new TrinityThemeSwitcher();
    console.log('[Trinity Theme Switcher] Initialized after DOM ready');
  });
} else {
  // DOM is already ready
  window.trinityThemeSwitcher = new TrinityThemeSwitcher();
  console.log('[Trinity Theme Switcher] Initialized (DOM already ready)');
}