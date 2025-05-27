/**
 * User Document Ingestion
 * Handles file upload, processing, and storage in Trinity memory hierarchy
 * 
 * Supports multiple file formats with intelligent categorization and semantic processing
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const TrinityMemoryIntegration = require('./trinity-memory-integration');

class UserDocumentIngestion {
    constructor(options = {}) {
        this.baseDir = options.baseDir || path.join(process.env.HOME || process.env.USERPROFILE, '.trinity-mvp');
        this.uploadsDir = path.join(this.baseDir, 'uploads');
        this.tempDir = path.join(this.baseDir, 'temp');
        
        // Initialize memory integration
        this.memoryIntegration = options.memoryIntegration || new TrinityMemoryIntegration({
            baseDir: this.baseDir,
            logger: options.logger || console
        });
        
        this.logger = options.logger || console;
        
        // Supported file types
        this.supportedTypes = {
            '.txt': 'text/plain',
            '.md': 'text/markdown', 
            '.markdown': 'text/markdown',
            '.json': 'application/json',
            '.js': 'text/javascript',
            '.ts': 'text/typescript',
            '.py': 'text/python',
            '.html': 'text/html',
            '.css': 'text/css',
            '.xml': 'text/xml',
            '.yaml': 'text/yaml',
            '.yml': 'text/yaml',
            '.csv': 'text/csv',
            '.log': 'text/plain'
        };
        
        // File size limits (in bytes)
        this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB default
        this.maxFiles = options.maxFiles || 100; // Max files per batch
        
        this.initialized = false;
    }

    /**
     * Initialize the document ingestion system
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Create necessary directories
            await fs.mkdir(this.uploadsDir, { recursive: true });
            await fs.mkdir(this.tempDir, { recursive: true });
            
            // Initialize memory integration
            await this.memoryIntegration.initialize();
            
            this.initialized = true;
            this.logger.info('User Document Ingestion initialized');
            
        } catch (error) {
            this.logger.error('Failed to initialize User Document Ingestion:', error);
            throw error;
        }
    }

    /**
     * Process uploaded file(s)
     * @param {string|Array} filePaths - Path(s) to uploaded file(s)
     * @param {Object} options - Processing options
     * @returns {Object} - Processing results
     */
    async processFiles(filePaths, options = {}) {
        await this.initialize();
        
        // Normalize to array
        const files = Array.isArray(filePaths) ? filePaths : [filePaths];
        
        // Validate file count
        if (files.length > this.maxFiles) {
            throw new Error(`Too many files: ${files.length}. Maximum allowed: ${this.maxFiles}`);
        }
        
        const results = {
            successful: [],
            failed: [],
            totalFiles: files.length,
            totalSize: 0,
            processingTime: 0
        };
        
        const startTime = Date.now();
        
        try {
            for (const filePath of files) {
                try {
                    const result = await this.processSingleFile(filePath, options);
                    results.successful.push(result);
                    results.totalSize += result.metadata.originalSize;
                    
                } catch (error) {
                    this.logger.error(`Failed to process file ${filePath}:`, error);
                    results.failed.push({
                        filePath,
                        error: error.message
                    });
                }
            }
            
            results.processingTime = Date.now() - startTime;
            
            this.logger.info(`Processed ${results.successful.length}/${results.totalFiles} files successfully`);
            
            return results;
            
        } catch (error) {
            this.logger.error('Batch file processing failed:', error);
            throw error;
        }
    }

    /**
     * Process a single uploaded file
     * @param {string} filePath - Path to the uploaded file
     * @param {Object} options - Processing options
     * @returns {Object} - Processing result
     */
    async processSingleFile(filePath, options = {}) {
        // Validate file exists and get stats
        const stats = await fs.stat(filePath);
        
        if (stats.size > this.maxFileSize) {
            throw new Error(`File too large: ${stats.size} bytes. Maximum: ${this.maxFileSize} bytes`);
        }
        
        // Get file info
        const fileName = path.basename(filePath);
        const fileExt = path.extname(fileName).toLowerCase();
        const mimeType = this.supportedTypes[fileExt];
        
        if (!mimeType) {
            throw new Error(`Unsupported file type: ${fileExt}. Supported types: ${Object.keys(this.supportedTypes).join(', ')}`);
        }
        
        // Read and process file content
        const rawContent = await fs.readFile(filePath, 'utf8');
        const processedContent = this.processFileContent(rawContent, mimeType, fileName);
        
        // Determine category (user can override)
        const detectedCategory = options.category || this.memoryIntegration.compressor.detectCategory(processedContent.content);
        
        // Create document metadata
        const documentData = {
            type: 'user_document',
            content: processedContent.content,
            source: fileName,
            metadata: {
                originalFileName: fileName,
                fileExtension: fileExt,
                mimeType: mimeType,
                originalSize: stats.size,
                uploadedAt: new Date().toISOString(),
                processingInfo: processedContent.processingInfo,
                userSpecifiedCategory: options.category || null,
                detectedCategory: detectedCategory,
                ...options.metadata
            },
            tags: [
                ...this.extractFilenameTags(fileName),
                ...this.extractContentTags(processedContent.content),
                ...(options.tags || [])
            ]
        };
        
        // Store in memory hierarchy
        const storageResult = await this.memoryIntegration.store(detectedCategory, documentData);
        
        // Copy file to uploads directory for reference
        const uploadedFilePath = await this.archiveUploadedFile(filePath, fileName);
        
        const result = {
            itemId: storageResult.itemId,
            fileName: fileName,
            category: storageResult.category,
            metadata: {
                originalSize: stats.size,
                processedSize: processedContent.content.length,
                compressionStats: storageResult.compressionStats,
                mimeType: mimeType,
                uploadPath: uploadedFilePath,
                tags: documentData.tags
            }
        };
        
        this.logger.info(`Successfully processed document: ${fileName} (${result.category})`);
        
        return result;
    }

    /**
     * Process file content based on type
     * @param {string} rawContent - Raw file content
     * @param {string} mimeType - File MIME type
     * @param {string} fileName - Original file name
     * @returns {Object} - Processed content and metadata
     */
    processFileContent(rawContent, mimeType, fileName) {
        const processingInfo = {
            mimeType,
            originalLength: rawContent.length,
            processedAt: new Date().toISOString()
        };
        
        let processedContent = rawContent;
        
        try {
            switch (mimeType) {
                case 'application/json':
                    // Format JSON for better readability
                    const jsonData = JSON.parse(rawContent);
                    processedContent = JSON.stringify(jsonData, null, 2);
                    processingInfo.formatted = true;
                    break;
                    
                case 'text/csv':
                    // Add basic CSV structure info
                    const lines = rawContent.split('\n');
                    const csvHeaders = lines[0]?.split(',').length || 0;
                    processingInfo.csvInfo = {
                        rows: lines.length,
                        columns: csvHeaders
                    };
                    break;
                    
                case 'text/markdown':
                    // Extract markdown structure
                    const mdHeaders = (rawContent.match(/^#+\s+.+$/gm) || []).length;
                    const codeBlocks = (rawContent.match(/```[\s\S]*?```/g) || []).length;
                    processingInfo.markdownInfo = {
                        headers: mdHeaders,
                        codeBlocks
                    };
                    break;
                    
                case 'text/javascript':
                case 'text/typescript':
                case 'text/python':
                    // Extract code structure info
                    const functions = (rawContent.match(/function\s+\w+|def\s+\w+|const\s+\w+\s*=/g) || []).length;
                    const classes = (rawContent.match(/class\s+\w+/g) || []).length;
                    processingInfo.codeInfo = {
                        functions,
                        classes,
                        lines: rawContent.split('\n').filter(line => line.trim().length > 0).length
                    };
                    break;
                    
                default:
                    // Plain text processing
                    const wordCount = rawContent.split(/\s+/).filter(word => word.length > 0).length;
                    const paragraphs = rawContent.split(/\n\s*\n/).length;
                    processingInfo.textInfo = {
                        wordCount,
                        paragraphs
                    };
                    break;
            }
            
        } catch (error) {
            this.logger.warn(`Content processing warning for ${fileName}:`, error.message);
            processingInfo.processingWarning = error.message;
        }
        
        return {
            content: processedContent,
            processingInfo
        };
    }

    /**
     * Extract tags from filename
     * @param {string} fileName - File name
     * @returns {Array} - Array of tags
     */
    extractFilenameTags(fileName) {
        const baseName = path.basename(fileName, path.extname(fileName));
        
        // Split on common separators
        const parts = baseName.toLowerCase()
            .split(/[-_\s\.]+/)
            .filter(part => part.length > 2);
            
        return [...new Set(parts)]; // Remove duplicates
    }

    /**
     * Extract content-based tags
     * @param {string} content - File content
     * @returns {Array} - Array of content tags
     */
    extractContentTags(content) {
        // This uses the same logic as Trinity memory integration
        return this.memoryIntegration.extractTags(content).slice(0, 5); // Limit to 5 tags
    }

    /**
     * Archive uploaded file to uploads directory
     * @param {string} sourcePath - Source file path
     * @param {string} fileName - Original file name
     * @returns {string} - Path to archived file
     */
    async archiveUploadedFile(sourcePath, fileName) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const archivedFileName = `${timestamp}_${safeFileName}`;
        const archivedPath = path.join(this.uploadsDir, archivedFileName);
        
        try {
            await fs.copyFile(sourcePath, archivedPath);
            return archivedPath;
        } catch (error) {
            this.logger.warn(`Failed to archive uploaded file ${fileName}:`, error.message);
            return null;
        }
    }

    /**
     * Handle drag and drop file upload
     * @param {Array} fileList - List of files from drag/drop event
     * @param {Object} options - Processing options
     * @returns {Object} - Processing results
     */
    async handleDragDropUpload(fileList, options = {}) {
        const tempPaths = [];
        
        try {
            // Save files to temp directory first
            for (let i = 0; i < fileList.length; i++) {
                const file = fileList[i];
                const tempPath = path.join(this.tempDir, `upload_${Date.now()}_${i}_${file.name}`);
                
                // This would typically be handled by the frontend
                // For now, assume files are already saved to temp paths
                tempPaths.push(tempPath);
            }
            
            // Process all files
            const results = await this.processFiles(tempPaths, options);
            
            return results;
            
        } finally {
            // Clean up temp files
            for (const tempPath of tempPaths) {
                try {
                    await fs.unlink(tempPath);
                } catch (error) {
                    this.logger.warn(`Failed to clean up temp file ${tempPath}:`, error.message);
                }
            }
        }
    }

    /**
     * Get supported file types for UI display
     * @returns {Object} - Supported file types and descriptions
     */
    getSupportedTypes() {
        const typeDescriptions = {
            'text/plain': 'Plain text files (.txt, .log)',
            'text/markdown': 'Markdown documents (.md, .markdown)',
            'application/json': 'JSON data files (.json)',
            'text/javascript': 'JavaScript code (.js)',
            'text/typescript': 'TypeScript code (.ts)',
            'text/python': 'Python code (.py)',
            'text/html': 'HTML documents (.html)',
            'text/css': 'CSS stylesheets (.css)',
            'text/xml': 'XML documents (.xml)',
            'text/yaml': 'YAML configuration (.yaml, .yml)',
            'text/csv': 'CSV data files (.csv)'
        };
        
        return {
            extensions: Object.keys(this.supportedTypes),
            mimeTypes: Object.values(this.supportedTypes),
            descriptions: typeDescriptions,
            maxFileSize: this.maxFileSize,
            maxFiles: this.maxFiles
        };
    }

    /**
     * Get upload statistics
     * @returns {Object} - Upload statistics
     */
    async getUploadStats() {
        try {
            const memoryStats = this.memoryIntegration.getStats();
            
            // Count user documents specifically
            let userDocumentCount = 0;
            let userDocumentSize = 0;
            
            for (const [category, dir] of Object.entries(this.memoryIntegration.memoryTiers)) {
                try {
                    const files = await fs.readdir(dir);
                    for (const file of files) {
                        if (file.endsWith('.json')) {
                            const filePath = path.join(dir, file);
                            const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
                            if (data.type === 'user_document') {
                                userDocumentCount++;
                                userDocumentSize += data.metadata?.originalSize || 0;
                            }
                        }
                    }
                } catch (error) {
                    // Skip if directory doesn't exist or can't be read
                }
            }
            
            return {
                totalDocuments: userDocumentCount,
                totalSize: userDocumentSize,
                totalMemoryItems: memoryStats.totalItems,
                memoryByCategory: memoryStats.itemsByCategory,
                supportedTypes: Object.keys(this.supportedTypes).length
            };
            
        } catch (error) {
            this.logger.error('Failed to get upload stats:', error);
            return {
                totalDocuments: 0,
                totalSize: 0,
                totalMemoryItems: 0,
                memoryByCategory: {},
                supportedTypes: 0
            };
        }
    }
}

module.exports = UserDocumentIngestion;