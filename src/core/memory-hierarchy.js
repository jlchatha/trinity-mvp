/**
 * Trinity Memory Hierarchy - Direct MVP Implementation
 * Professional Assistant Memory Management System
 * 
 * Built directly in production environment per "Direct Development Strategy"
 * File-based, manageable, zero path translation issues
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

/**
 * Four-Tier Memory Hierarchy for Professional Context Management
 * Eliminates frontier model context waste through intelligent persistence
 */
class MemoryHierarchy extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // MVP-specific base directories (build where it runs!)
    this.baseDir = options.baseDir || process.cwd();
    this.mvpDataDir = options.mvpDataDir || path.join(process.env.HOME || process.env.USERPROFILE, '.trinity-mvp');
    
    // Four-tier memory structure
    this.memoryDirs = {
      core: path.join(this.mvpDataDir, 'memory', 'core'),           // Essential files required in every session
      working: path.join(this.mvpDataDir, 'memory', 'working'),     // Files needed for specific tasks  
      reference: path.join(this.mvpDataDir, 'memory', 'reference'), // Documentation and guides
      historical: path.join(this.mvpDataDir, 'memory', 'historical') // Previous reports and logs
    };
    
    // User profiles and projects
    this.profilesDir = path.join(this.mvpDataDir, 'memory', 'profiles');
    this.projectsDir = path.join(this.mvpDataDir, 'memory', 'projects');
    
    // Configuration
    this.config = {
      maxFileSize: options.maxFileSize || 1024 * 1024, // 1MB default
      maxFiles: options.maxFiles || 1000,
      compressionEnabled: options.compressionEnabled !== false,
      retentionDays: options.retentionDays || 30,
      ...options
    };
    
    this.initialized = false;
    
    console.log(`[${new Date().toISOString()}] INFO    Trinity Memory Hierarchy initialized for MVP`);
  }
  
  /**
   * Initialize the memory hierarchy directory structure
   */
  async initialize() {
    try {
      // Create all memory directories
      await this.ensureDirectories();
      
      // Initialize metadata
      await this.initializeMetadata();
      
      this.initialized = true;
      
      console.log(`[${new Date().toISOString()}] INFO    🧠 Trinity Memory Hierarchy ready - Professional context management`);
      this.emit('memory-initialized', { memoryDirs: this.memoryDirs });
      
      return true;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR   Trinity Memory Hierarchy initialization failed:`, error.message);
      this.emit('memory-error', { error: error.message, phase: 'initialization' });
      throw error;
    }
  }
  
  /**
   * Store content in specified memory tier
   */
  async store(tier, content, metadata = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    if (!this.memoryDirs[tier]) {
      throw new Error(`Invalid memory tier: ${tier}. Valid tiers: ${Object.keys(this.memoryDirs).join(', ')}`);
    }
    
    try {
      const timestamp = new Date().toISOString();
      const id = metadata.id || this.generateId();
      const filename = `${id}.json`;
      const filePath = path.join(this.memoryDirs[tier], filename);
      
      const memoryEntry = {
        id,
        tier,
        content,
        metadata: {
          title: metadata.title || 'Untitled',
          description: metadata.description || '',
          tags: metadata.tags || [],
          priority: metadata.priority || 'medium',
          project: metadata.project || null,
          user: metadata.user || null,
          ...metadata
        },
        timestamps: {
          created: timestamp,
          modified: timestamp,
          accessed: timestamp
        },
        size: Buffer.byteLength(JSON.stringify(content), 'utf8'),
        version: '1.0.0'
      };
      
      await fs.promises.writeFile(filePath, JSON.stringify(memoryEntry, null, 2), 'utf8');
      
      console.log(`[${new Date().toISOString()}] INFO    Memory stored: ${tier}/${filename} (${memoryEntry.size} bytes)`);
      this.emit('memory-stored', { tier, id, metadata: memoryEntry.metadata });
      
      return { id, filePath, tier };
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR   Memory storage failed:`, error.message);
      this.emit('memory-error', { error: error.message, phase: 'storage', tier });
      throw error;
    }
  }
  
  /**
   * Retrieve content from memory by ID or search criteria
   */
  async retrieve(criteria) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      let results = [];
      
      // Search by specific ID
      if (criteria.id) {
        const entry = await this.findById(criteria.id);
        if (entry) results.push(entry);
      }
      // Search by criteria
      else {
        results = await this.search(criteria);
      }
      
      // Update access timestamps
      for (const result of results) {
        await this.updateAccessTime(result.tier, result.id);
      }
      
      this.emit('memory-retrieved', { 
        criteria, 
        resultCount: results.length,
        results: results.map(r => ({ id: r.id, tier: r.tier, title: r.metadata.title }))
      });
      
      return results;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR   Memory retrieval failed:`, error.message);
      this.emit('memory-error', { error: error.message, phase: 'retrieval', criteria });
      throw error;
    }
  }
  
  /**
   * Build optimized context for user request
   * Core value proposition: eliminate frontier model context waste
   */
  async buildOptimizedContext(userId, projectId, requestType) {
    try {
      const context = {
        user: await this.getUserContext(userId),
        project: await this.getProjectContext(projectId),
        relevant: await this.getRelevantContext(requestType, projectId),
        recent: await this.getRecentContext(userId, projectId)
      };
      
      // Calculate context efficiency metrics
      const totalTokens = this.estimateTokens(context);
      const efficiency = this.calculateContextEfficiency(context);
      
      console.log(`[${new Date().toISOString()}] INFO    Built optimized context: ${totalTokens} tokens, ${Math.round(efficiency * 100)}% efficiency`);
      
      this.emit('context-optimized', {
        userId,
        projectId,
        requestType,
        totalTokens,
        efficiency,
        components: Object.keys(context)
      });
      
      return {
        context,
        metadata: {
          totalTokens,
          efficiency,
          timestamp: new Date().toISOString(),
          userId,
          projectId,
          requestType
        }
      };
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR   Context optimization failed:`, error.message);
      this.emit('memory-error', { error: error.message, phase: 'context-optimization' });
      throw error;
    }
  }
  
  /**
   * Store user profile for context optimization
   */
  async storeUserProfile(userId, profile) {
    const profilePath = path.join(this.profilesDir, `${userId}.json`);
    
    const userProfile = {
      id: userId,
      profile,
      timestamps: {
        created: profile.created || new Date().toISOString(),
        modified: new Date().toISOString()
      },
      version: '1.0.0'
    };
    
    await fs.promises.writeFile(profilePath, JSON.stringify(userProfile, null, 2), 'utf8');
    
    console.log(`[${new Date().toISOString()}] INFO    User profile stored: ${userId}`);
    this.emit('profile-stored', { userId, profile });
    
    return userProfile;
  }
  
  /**
   * Store project context for continuity
   */
  async storeProjectContext(projectId, context) {
    const projectPath = path.join(this.projectsDir, `${projectId}.json`);
    
    const projectContext = {
      id: projectId,
      context,
      timestamps: {
        created: context.created || new Date().toISOString(),
        modified: new Date().toISOString()
      },
      version: '1.0.0'
    };
    
    await fs.promises.writeFile(projectPath, JSON.stringify(projectContext, null, 2), 'utf8');
    
    console.log(`[${new Date().toISOString()}] INFO    Project context stored: ${projectId}`);
    this.emit('project-stored', { projectId, context });
    
    return projectContext;
  }
  
  /**
   * Get memory hierarchy statistics
   */
  async getStats() {
    const stats = {
      tiers: {},
      total: { files: 0, size: 0 },
      lastUpdated: new Date().toISOString()
    };
    
    for (const [tierName, tierPath] of Object.entries(this.memoryDirs)) {
      try {
        const files = await fs.promises.readdir(tierPath);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        
        let tierSize = 0;
        for (const file of jsonFiles) {
          const filePath = path.join(tierPath, file);
          const stat = await fs.promises.stat(filePath);
          tierSize += stat.size;
        }
        
        stats.tiers[tierName] = {
          files: jsonFiles.length,
          size: tierSize
        };
        
        stats.total.files += jsonFiles.length;
        stats.total.size += tierSize;
      } catch (error) {
        console.warn(`[${new Date().toISOString()}] WARN    Could not read tier ${tierName}:`, error.message);
        stats.tiers[tierName] = { files: 0, size: 0, error: error.message };
      }
    }
    
    return stats;
  }
  
  // Private helper methods
  
  async ensureDirectories() {
    const allDirs = [
      ...Object.values(this.memoryDirs),
      this.profilesDir,
      this.projectsDir
    ];
    
    for (const dir of allDirs) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
  }
  
  async initializeMetadata() {
    const metadataPath = path.join(this.mvpDataDir, 'memory', 'metadata.json');
    
    if (!fs.existsSync(metadataPath)) {
      const metadata = {
        version: '1.0.0',
        created: new Date().toISOString(),
        tiers: Object.keys(this.memoryDirs),
        config: this.config
      };
      
      await fs.promises.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
    }
  }
  
  generateId() {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  async findById(id) {
    for (const [tierName, tierPath] of Object.entries(this.memoryDirs)) {
      const filePath = path.join(tierPath, `${id}.json`);
      
      try {
        const content = await fs.promises.readFile(filePath, 'utf8');
        return JSON.parse(content);
      } catch (error) {
        // File not found in this tier, continue searching
        continue;
      }
    }
    
    return null;
  }
  
  async search(criteria) {
    const results = [];
    
    for (const [tierName, tierPath] of Object.entries(this.memoryDirs)) {
      try {
        const files = await fs.promises.readdir(tierPath);
        
        for (const file of files) {
          if (!file.endsWith('.json')) continue;
          
          const filePath = path.join(tierPath, file);
          const content = await fs.promises.readFile(filePath, 'utf8');
          const entry = JSON.parse(content);
          
          if (this.matchesCriteria(entry, criteria)) {
            results.push(entry);
          }
        }
      } catch (error) {
        console.warn(`[${new Date().toISOString()}] WARN    Search error in tier ${tierName}:`, error.message);
        continue;
      }
    }
    
    return results;
  }
  
  matchesCriteria(entry, criteria) {
    // Basic matching logic - can be enhanced
    if (criteria.tier && entry.tier !== criteria.tier) return false;
    if (criteria.project && entry.metadata.project !== criteria.project) return false;
    if (criteria.user && entry.metadata.user !== criteria.user) return false;
    if (criteria.tags && !criteria.tags.some(tag => entry.metadata.tags.includes(tag))) return false;
    if (criteria.title && !entry.metadata.title.toLowerCase().includes(criteria.title.toLowerCase())) return false;
    
    return true;
  }
  
  async updateAccessTime(tier, id) {
    const filePath = path.join(this.memoryDirs[tier], `${id}.json`);
    
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      const entry = JSON.parse(content);
      
      entry.timestamps.accessed = new Date().toISOString();
      
      await fs.promises.writeFile(filePath, JSON.stringify(entry, null, 2), 'utf8');
    } catch (error) {
      console.warn(`[${new Date().toISOString()}] WARN    Could not update access time for ${tier}/${id}:`, error.message);
    }
  }
  
  async getUserContext(userId) {
    try {
      const profilePath = path.join(this.profilesDir, `${userId}.json`);
      const content = await fs.promises.readFile(profilePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return null; // User profile not found
    }
  }
  
  async getProjectContext(projectId) {
    try {
      const projectPath = path.join(this.projectsDir, `${projectId}.json`);
      const content = await fs.promises.readFile(projectPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return null; // Project context not found
    }
  }
  
  async getRelevantContext(requestType, projectId) {
    // Find relevant memories for this request type and project
    return await this.search({
      project: projectId,
      tags: [requestType, 'relevant', 'pattern']
    });
  }
  
  async getRecentContext(userId, projectId) {
    // Get recent context for user and project
    const results = await this.search({
      user: userId,
      project: projectId
    });
    
    // Sort by modified timestamp and take recent entries
    return results
      .sort((a, b) => new Date(b.timestamps.modified) - new Date(a.timestamps.modified))
      .slice(0, 10);
  }
  
  estimateTokens(context) {
    // Rough token estimation (4 chars per token average)
    const text = JSON.stringify(context);
    return Math.ceil(text.length / 4);
  }
  
  calculateContextEfficiency(context) {
    // Calculate how much of the context is likely to be relevant
    // Higher efficiency = more relevant, less waste
    const components = Object.keys(context);
    const nonEmptyComponents = components.filter(k => context[k] && Object.keys(context[k]).length > 0);
    
    return nonEmptyComponents.length / components.length;
  }
}

module.exports = MemoryHierarchy;