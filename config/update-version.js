const fs = require('fs');
const path = require('path');

console.log('Starting version update script...');
console.log('Current directory:', process.cwd());

const updateVersion = () => {
  try {
    const versionPath = path.join(process.cwd(), 'config/version.js');
    console.log('Looking for version file at:', versionPath);
    
    const content = fs.readFileSync(versionPath, 'utf8');
    
    // Extract current version
    const versionMatch = content.match(/number: '(\d+\.\d+\.\d+)'/);
    if (!versionMatch) throw new Error('Version pattern not found');
    
    const currentVersion = versionMatch[1];
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    // Increment patch version
    const newVersion = `${major}.${minor}.${patch + 1}`;
    
    // Update file content
    const newContent = content.replace(
      /number: '\d+\.\d+\.\d+'/,
      `number: '${newVersion}'`
    );
    
    fs.writeFileSync(versionPath, newContent);
    console.log(`Version updated to ${newVersion}`);
    
    // Also update package.json
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    packageJson.version = newVersion;
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  } catch (error) {
    console.error('Error updating version:', error);
    process.exit(1);
  }
};

updateVersion();