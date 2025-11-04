import smb2 from '../src';
import DirectoryEntry from '../src/protocol/models/DirectoryEntry';

// Exemple d'utilisation de la fonctionnalité récursive avec la classe Tree
async function recursiveTreeExample() {
  const host = 'your-server-address';
  const domain = 'your-domain';
  const username = 'your-username';
  const password = 'your-password';
  const share = 'your-share';

  try {
    console.log(`Connecting to ${host}\\${share} as ${domain}\\${username}`);
    
    // Connexion au serveur SMB
    const client = new smb2.Client(host);
    const session = await client.authenticate({
      domain,
      username,
      password
    });
    const tree = await session.connectTree(share);

    console.log('🌳 ===== UTILISATION AVEC LA CLASSE TREE =====');

    // 1. Lecture simple (non-récursive) avec Tree
    console.log('\n📁 1. Lecture simple du répertoire racine:');
    const rootEntries = await tree.readDirectory('/');
    console.log(`Found ${rootEntries.length} entries at root level`);
    rootEntries.slice(0, 5).forEach((entry: DirectoryEntry) => {
      console.log(`  ${entry.type}: ${entry.filename}`);
    });

    // 2. Lecture récursive avec la méthode readDirectoryRecursive()
    console.log('\n🔄 2. Lecture récursive avec readDirectoryRecursive():');
    const recursiveEntries = await tree.readDirectoryRecursive('/', 3); // Max depth: 3
    console.log(`Found ${recursiveEntries.length} total entries (recursive, max depth 3)`);
    
    // Grouper par type pour un meilleur affichage
    const files = recursiveEntries.filter(entry => entry.type === 'File');
    const directories = recursiveEntries.filter(entry => entry.type === 'Directory');
    
    console.log(`  📄 Files: ${files.length}`);
    console.log(`  📁 Directories: ${directories.length}`);

    // Afficher quelques exemples avec chemins complets
    console.log('\n📂 Exemples avec chemins complets:');
    recursiveEntries.slice(0, 10).forEach((entry: DirectoryEntry) => {
      const indent = '  '.repeat((entry.fullPath?.split('/').length || 1) - 1);
      console.log(`${indent}${entry.type === 'Directory' ? '📁' : '📄'} ${entry.fullPath || entry.filename}`);
    });

    // 3. Lecture récursive avec paramètres personnalisés via readDirectory()
    console.log('\n🎯 3. Lecture récursive avec paramètres personnalisés:');
    const customRecursive = await tree.readDirectory('/', true, 2); // Récursif, max depth 2
    console.log(`Found ${customRecursive.length} entries with max depth 2`);

    // 4. Lecture d'un sous-répertoire spécifique de manière récursive
    console.log('\n🎯 4. Lecture récursive d\'un sous-répertoire:');
    try {
      const subDirRecursive = await tree.readDirectoryRecursive('/some/subfolder', 5);
      console.log(`Found ${subDirRecursive.length} entries in subfolder (recursive)`);
    } catch (error: any) {
      console.log(`Subfolder not accessible or doesn't exist: ${error.message}`);
    }

    // 5. Comparaison des performances
    console.log('\n⚡ 5. Comparaison des performances:');
    
    console.time('Non-recursive scan');
    const nonRecursiveEntries = await tree.readDirectory('/');
    console.timeEnd('Non-recursive scan');
    console.log(`Non-recursive: ${nonRecursiveEntries.length} entries`);
    
    console.time('Recursive scan (depth 2)');
    const recursiveEntries2 = await tree.readDirectory('/', true, 2);
    console.timeEnd('Recursive scan (depth 2)');
    console.log(`Recursive (depth 2): ${recursiveEntries2.length} entries`);

    // 6. Recherche de fichiers spécifiques
    console.log('\n🔍 6. Recherche de fichiers .txt de manière récursive:');
    const allFiles = await tree.readDirectoryRecursive('/', 3);
    const textFiles = allFiles.filter(entry => 
      entry.type === 'File' && entry.filename.toLowerCase().endsWith('.txt')
    );
    console.log(`Found ${textFiles.length} .txt files:`);
    textFiles.slice(0, 5).forEach((file: DirectoryEntry) => {
      console.log(`  📄 ${file.fullPath || file.filename}`);
    });

    console.log('\n✅ Démonstration terminée avec succès !');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Fonction utilitaire pour analyser la structure d'un répertoire
export async function analyzeDirectoryStructure(tree: any, path: string = '/', maxDepth: number = 5) {
  console.log(`\n📊 Analysis of directory structure at: ${path}`);
  
  const entries = await tree.readDirectoryRecursive(path, maxDepth);
  
  const stats = {
    totalFiles: 0,
    totalDirectories: 0,
    byDepth: {} as Record<number, { files: number; dirs: number }>,
    largestFiles: [] as DirectoryEntry[],
    fileExtensions: {} as Record<string, number>
  };

  entries.forEach((entry: DirectoryEntry) => {
    const depth = (entry.fullPath?.split('/').length || 1) - 1;
    
    if (!stats.byDepth[depth]) {
      stats.byDepth[depth] = { files: 0, dirs: 0 };
    }

    if (entry.type === 'File') {
      stats.totalFiles++;
      stats.byDepth[depth].files++;
      
      // Track file extensions
      const ext = entry.filename.split('.').pop()?.toLowerCase() || 'no-extension';
      stats.fileExtensions[ext] = (stats.fileExtensions[ext] || 0) + 1;
      
      // Track largest files
      if (stats.largestFiles.length < 10) {
        stats.largestFiles.push(entry);
      } else {
        stats.largestFiles.sort((a, b) => Number(b.fileSize) - Number(a.fileSize));
        if (Number(entry.fileSize) > Number(stats.largestFiles[9].fileSize)) {
          stats.largestFiles[9] = entry;
        }
      }
    } else {
      stats.totalDirectories++;
      stats.byDepth[depth].dirs++;
    }
  });

  // Sort largest files
  stats.largestFiles.sort((a, b) => Number(b.fileSize) - Number(a.fileSize));

  console.log(`📈 Total: ${stats.totalFiles} files, ${stats.totalDirectories} directories`);
  console.log('📊 By depth:');
  Object.entries(stats.byDepth).forEach(([depth, counts]) => {
    console.log(`  Level ${depth}: ${counts.files} files, ${counts.dirs} directories`);
  });
  
  console.log('📄 File extensions:');
  Object.entries(stats.fileExtensions)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([ext, count]) => {
      console.log(`  .${ext}: ${count} files`);
    });

  console.log('💾 Largest files:');
  stats.largestFiles.slice(0, 5).forEach(file => {
    const sizeMB = (Number(file.fileSize) / (1024 * 1024)).toFixed(2);
    console.log(`  ${file.fullPath || file.filename} (${sizeMB} MB)`);
  });

  return stats;
}

// Usage
if (require.main === module) {
  recursiveTreeExample();
}