/**
 * Trinity Bubble Component - Professional UI Bubbles
 * 
 * Reusable bubble component for tooltips, notifications, and informational overlays
 * Matches Trinity's professional dark theme and glass morphism design
 */

class TrinityBubble {
  constructor(options = {}) {
    this.options = {
      // Content
      content: options.content || '',
      html: options.html || false, // Allow HTML content
      
      // Positioning
      target: options.target || null, // Element to attach to
      position: options.position || 'top', // top, bottom, left, right, center
      offset: options.offset || 10,
      
      // Appearance
      theme: options.theme || 'default', // default, success, warning, error, info
      size: options.size || 'medium', // small, medium, large
      arrow: options.arrow !== false, // Show arrow by default
      
      // Behavior
      trigger: options.trigger || 'hover', // hover, click, manual
      duration: options.duration || 0, // Auto-hide after ms (0 = no auto-hide)
      animation: options.animation !== false, // Enable animations
      
      // Callbacks
      onShow: options.onShow || null,
      onHide: options.onHide || null,
      onDestroy: options.onDestroy || null
    };
    
    this.element = null;
    this.isVisible = false;
    this.timeoutId = null;
    
    this.createBubble();
    this.setupEventListeners();
  }

  /**
   * Create the bubble DOM element
   */
  createBubble() {
    this.element = document.createElement('div');
    this.element.className = this.buildClasses();
    this.element.innerHTML = this.buildHTML();
    
    // Add to document
    document.body.appendChild(this.element);
    
    // Position the bubble
    this.updatePosition();
  }

  /**
   * Build CSS classes for the bubble
   */
  buildClasses() {
    const classes = [
      'trinity-bubble',
      `trinity-bubble--${this.options.theme}`,
      `trinity-bubble--${this.options.size}`,
      `trinity-bubble--${this.options.position}`
    ];
    
    if (this.options.arrow) {
      classes.push('trinity-bubble--with-arrow');
    }
    
    if (this.options.animation) {
      classes.push('trinity-bubble--animated');
    }
    
    return classes.join(' ');
  }

  /**
   * Build bubble HTML content
   */
  buildHTML() {
    const content = this.options.html 
      ? this.options.content 
      : this.escapeHtml(this.options.content);
    
    return `
      <div class="trinity-bubble__inner">
        <div class="trinity-bubble__content">${content}</div>
        ${this.options.arrow ? '<div class="trinity-bubble__arrow"></div>' : ''}
      </div>
    `;
  }

  /**
   * Setup event listeners based on trigger type
   */
  setupEventListeners() {
    if (!this.options.target) return;
    
    switch (this.options.trigger) {
      case 'hover':
        this.options.target.addEventListener('mouseenter', () => this.show());
        this.options.target.addEventListener('mouseleave', () => this.hide());
        // Keep bubble visible when hovering over it
        this.element.addEventListener('mouseenter', () => this.cancelHide());
        this.element.addEventListener('mouseleave', () => this.hide());
        break;
        
      case 'click':
        this.options.target.addEventListener('click', (e) => {
          e.preventDefault();
          this.toggle();
        });
        // Hide when clicking outside
        document.addEventListener('click', (e) => {
          if (!this.element.contains(e.target) && !this.options.target.contains(e.target)) {
            this.hide();
          }
        });
        break;
    }
  }

  /**
   * Update bubble position relative to target
   */
  updatePosition() {
    if (!this.options.target) {
      // Center on screen if no target
      this.element.style.position = 'fixed';
      this.element.style.top = '50%';
      this.element.style.left = '50%';
      this.element.style.transform = 'translate(-50%, -50%)';
      return;
    }
    
    const targetRect = this.options.target.getBoundingClientRect();
    const bubbleRect = this.element.getBoundingClientRect();
    const offset = this.options.offset;
    
    let top, left;
    
    switch (this.options.position) {
      case 'top':
        top = targetRect.top - bubbleRect.height - offset;
        left = targetRect.left + (targetRect.width - bubbleRect.width) / 2;
        break;
        
      case 'bottom':
        top = targetRect.bottom + offset;
        left = targetRect.left + (targetRect.width - bubbleRect.width) / 2;
        break;
        
      case 'left':
        top = targetRect.top + (targetRect.height - bubbleRect.height) / 2;
        left = targetRect.left - bubbleRect.width - offset;
        break;
        
      case 'right':
        top = targetRect.top + (targetRect.height - bubbleRect.height) / 2;
        left = targetRect.right + offset;
        break;
        
      default:
        top = targetRect.top + (targetRect.height - bubbleRect.height) / 2;
        left = targetRect.left + (targetRect.width - bubbleRect.width) / 2;
    }
    
    // Ensure bubble stays within viewport
    top = Math.max(10, Math.min(top, window.innerHeight - bubbleRect.height - 10));
    left = Math.max(10, Math.min(left, window.innerWidth - bubbleRect.width - 10));
    
    this.element.style.position = 'fixed';
    this.element.style.top = `${top}px`;
    this.element.style.left = `${left}px`;
  }

  /**
   * Show the bubble
   */
  show() {
    if (this.isVisible) return;
    
    this.isVisible = true;
    this.element.classList.add('trinity-bubble--visible');
    this.updatePosition();
    
    if (this.options.onShow) {
      this.options.onShow(this);
    }
    
    // Auto-hide if duration is set
    if (this.options.duration > 0) {
      this.timeoutId = setTimeout(() => this.hide(), this.options.duration);
    }
  }

  /**
   * Hide the bubble
   */
  hide() {
    if (!this.isVisible) return;
    
    this.isVisible = false;
    this.element.classList.remove('trinity-bubble--visible');
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    if (this.options.onHide) {
      this.options.onHide(this);
    }
  }

  /**
   * Toggle bubble visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Cancel auto-hide
   */
  cancelHide() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Update bubble content
   */
  updateContent(content, isHTML = false) {
    const contentEl = this.element.querySelector('.trinity-bubble__content');
    if (isHTML) {
      contentEl.innerHTML = content;
    } else {
      contentEl.textContent = content;
    }
    this.options.content = content;
    this.options.html = isHTML;
    this.updatePosition();
  }

  /**
   * Update bubble position setting
   */
  updatePosition(position) {
    if (position) {
      this.element.className = this.element.className.replace(/trinity-bubble--\w+(?=\s|$)/, `trinity-bubble--${position}`);
      this.options.position = position;
    }
    this.updatePosition();
  }

  /**
   * Destroy the bubble
   */
  destroy() {
    if (this.options.onDestroy) {
      this.options.onDestroy(this);
    }
    
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Static methods for quick bubble creation
TrinityBubble.tooltip = (target, content, options = {}) => {
  return new TrinityBubble({
    target,
    content,
    trigger: 'hover',
    position: 'top',
    ...options
  });
};

TrinityBubble.notification = (content, options = {}) => {
  return new TrinityBubble({
    content,
    position: 'center',
    trigger: 'manual',
    duration: 3000,
    theme: 'info',
    ...options
  });
};

TrinityBubble.confirm = (content, options = {}) => {
  return new TrinityBubble({
    content,
    position: 'center',
    trigger: 'manual',
    theme: 'warning',
    html: true,
    ...options
  });
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TrinityBubble;
}

// Global assignment for browser
if (typeof window !== 'undefined') {
  window.TrinityBubble = TrinityBubble;
}