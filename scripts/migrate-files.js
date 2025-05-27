#!/usr/bin/env node

/**
 * Safe File Migration Script for Trinity MVP Repository Cleanup
 * Provides safe file migration with backup and rollback capabilities
 */

const fs = require('fs');
const path = require('path');

class SafeMigration {
  constructor() {
    this.backups = new Map();
    this.operations = [];
    this.dryRun = process.argv.includes('--dry-run');
    this.verbose = process.argv.includes('--verbose');
  }

  /**
   * Migrate file from source to destination with backup
   */
  async migrate(sourcePath, destinationPath) {
    if (this.dryRun) {
      console.log(`[DRY RUN] Would move: ${sourcePath} → ${destinationPath}`);
      return { success: true, dryRun: true };
    }

    try {
      // Create backup before moving
      const backupResult = await this.backup(sourcePath);
      if (!backupResult.success) {
        return { success: false, error: `Backup failed: ${backupResult.error}` };
      }

      // Ensure destination directory exists
      const destinationDir = path.dirname(destinationPath);
      if (!fs.existsSync(destinationDir)) {
        fs.mkdirSync(destinationDir, { recursive: true });
        if (this.verbose) console.log(`Created directory: ${destinationDir}`);
      }

      // Move file
      fs.renameSync(sourcePath, destinationPath);
      
      this.operations.push({
        type: 'move',
        source: sourcePath,
        destination: destinationPath,
        backup: backupResult.backupPath,
        timestamp: new Date().toISOString(),
      });

      if (this.verbose) console.log(`✅ Moved: ${sourcePath} → ${destinationPath}`);
      return { success: true };

    } catch (error) {
      // Rollback on failure
      const rollbackResult = await this.rollback(sourcePath);
      return { 
        success: false, 
        error: error.message,
        rollback: rollbackResult.success 
      };
    }
  }

  /**
   * Remove file safely (with backup)
   */
  async remove(filePath) {
    if (this.dryRun) {
      console.log(`[DRY RUN] Would remove: ${filePath}`);
      return { success: true, dryRun: true };
    }

    try {
      // Create backup before removing
      const backupResult = await this.backup(filePath);
      if (!backupResult.success) {
        return { success: false, error: `Backup failed: ${backupResult.error}` };
      }

      // Remove file
      fs.unlinkSync(filePath);
      
      this.operations.push({
        type: 'remove',
        source: filePath,
        backup: backupResult.backupPath,
        timestamp: new Date().toISOString(),
      });

      if (this.verbose) console.log(`✅ Removed: ${filePath}`);
      return { success: true };

    } catch (error) {
      // Rollback on failure
      const rollbackResult = await this.rollback(filePath);
      return { 
        success: false, 
        error: error.message,
        rollback: rollbackResult.success 
      };
    }
  }

  /**
   * Create backup of file
   */
  async backup(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File does not exist' };
      }

      const backupDir = path.join(__dirname, '../.migration-backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `${path.basename(filePath)}.${timestamp}.backup`;
      const backupPath = path.join(backupDir, backupName);

      fs.copyFileSync(filePath, backupPath);
      this.backups.set(filePath, backupPath);

      if (this.verbose) console.log(`📦 Backed up: ${filePath} → ${backupPath}`);
      return { success: true, backupPath };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Rollback file from backup
   */
  async rollback(filePath) {
    try {
      const backupPath = this.backups.get(filePath);
      if (!backupPath || !fs.existsSync(backupPath)) {
        return { success: false, error: 'No backup found' };
      }

      fs.copyFileSync(backupPath, filePath);
      if (this.verbose) console.log(`🔄 Rolled back: ${filePath}`);
      return { success: true };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Test Trinity MVP functionality
   */
  async testFunctionality() {
    try {
      const { spawn } = require('child_process');
      
      return new Promise((resolve) => {
        const proc = spawn('node', ['quick-conversation-test.js'], {
          cwd: process.cwd(),
          stdio: 'pipe'
        });

        let output = '';
        proc.stdout.on('data', (data) => output += data.toString());
        proc.stderr.on('data', (data) => output += data.toString());

        proc.on('close', (code) => {
          const success = code === 0 && output.includes('SUCCESS');
          resolve({ 
            success, 
            code, 
            output: this.verbose ? output : output.slice(-200) 
          });
        });

        setTimeout(() => {
          proc.kill();
          resolve({ success: false, error: 'Test timeout' });
        }, 30000);
      });

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate operations report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalOperations: this.operations.length,
      operations: this.operations,
      backupLocation: path.join(__dirname, '../.migration-backups'),
    };

    const reportPath = path.join(__dirname, '../migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📋 Migration report saved: ${reportPath}`);
    return report;
  }
}

// Main execution
async function main() {
  const migration = new SafeMigration();
  
  console.log('🚀 Trinity MVP Safe File Migration');
  console.log('==================================\n');

  if (migration.dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be actually moved\n');
  }

  // Files to remove from public repository (already copied to private)
  const filesToRemove = [
    'POST-AUTOCOMPACT-TRINITY-IMPROVEMENT-PLAN.md',
    'IMPLEMENTATION-PHASE.md',
    'security-audit.txt',
    'development-artifacts-inventory.md',
  ];

  // Directories to remove from public repository
  const directoriesToRemove = [
    'planning',
    'forensic-analysis',
  ];

  let successCount = 0;
  let errorCount = 0;

  // Remove individual files
  console.log('📄 Removing development files...');
  for (const file of filesToRemove) {
    if (fs.existsSync(file)) {
      const result = await migration.remove(file);
      if (result.success) {
        successCount++;
      } else {
        console.error(`❌ Failed to remove ${file}: ${result.error}`);
        errorCount++;
      }
    } else {
      console.log(`⏭️  File not found (already moved): ${file}`);
    }
  }

  // Remove directories
  console.log('\n📁 Removing development directories...');
  for (const dir of directoriesToRemove) {
    if (fs.existsSync(dir)) {
      try {
        // Remove directory recursively (already backed up to private repo)
        if (!migration.dryRun) {
          fs.rmSync(dir, { recursive: true, force: true });
          console.log(`✅ Removed directory: ${dir}`);
          successCount++;
        } else {
          console.log(`[DRY RUN] Would remove directory: ${dir}`);
        }
      } catch (error) {
        console.error(`❌ Failed to remove directory ${dir}: ${error.message}`);
        errorCount++;
      }
    } else {
      console.log(`⏭️  Directory not found: ${dir}`);
    }
  }

  // Test functionality after migration
  if (!migration.dryRun) {
    console.log('\n🧪 Testing Trinity MVP functionality...');
    const testResult = await migration.testFunctionality();
    
    if (testResult.success) {
      console.log('✅ Trinity MVP functionality test PASSED');
    } else {
      console.error('❌ Trinity MVP functionality test FAILED');
      console.error('Test output:', testResult.output || testResult.error);
      errorCount++;
    }
  }

  // Generate report
  console.log('\n📋 Generating migration report...');
  const report = migration.generateReport();

  // Summary
  console.log('\n📊 Migration Summary:');
  console.log(`✅ Successful operations: ${successCount}`);
  console.log(`❌ Failed operations: ${errorCount}`);
  console.log(`📦 Backups created: ${migration.backups.size}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Migration completed with errors');
    process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  });
}

module.exports = SafeMigration;