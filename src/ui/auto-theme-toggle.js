/**
 * Auto Theme Toggle for Trinity MVP
 * Automatically toggles theme on load for testing
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('[Auto Theme Toggle] DOM loaded, initializing...');
  
  // Function to toggle theme
  function autoToggleTheme() {
    console.log('[Auto Theme Toggle] Attempting to toggle theme...');
    
    // Method 1: Use existing theme switcher if available
    if (window.trinityThemeSwitcher && typeof window.trinityThemeSwitcher.toggleTheme === 'function') {
      console.log('[Auto Theme Toggle] Using existing theme switcher');
      window.trinityThemeSwitcher.toggleTheme();
      return;
    }
    
    // Method 2: Direct DOM manipulation
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    console.log(`[Auto Theme Toggle] Current theme: ${currentTheme || 'dark'}, switching to: ${newTheme}`);
    html.setAttribute('data-theme', newTheme);
    
    // Save to localStorage
    localStorage.setItem('trinity-theme', newTheme);
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('trinity-theme-changed', { 
      detail: { theme: newTheme } 
    }));
    
    // Force repaint
    html.style.display = 'none';
    html.offsetHeight; // Trigger reflow
    html.style.display = '';
    
    console.log(`[Auto Theme Toggle] Theme changed to: ${newTheme}`);
  }
  
  // Set to light theme automatically after a short delay
  setTimeout(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme !== 'light') {
      console.log('[Auto Theme Toggle] Auto-switching to light theme...');
      autoToggleTheme();
    }
  }, 2000);
  
  // Also expose function globally for testing
  window.autoToggleTheme = autoToggleTheme;
});

// Immediate execution fallback
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log('[Auto Theme Toggle] Document already loaded, setting light theme immediately');
  setTimeout(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('trinity-theme', 'light');
  }, 1000);
}