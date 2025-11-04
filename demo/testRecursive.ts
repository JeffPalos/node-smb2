import smb2 from '../src';
import Directory from '../src/client/Directory';
import { loadSMBConfig, displaySMBConfig, validateSMBConfig } from './smbConfig';

// Test simple pour vérifier la fonctionnalité récursive
async function testRecursiveRead() {
  const config = loadSMBConfig();
  
  displaySMBConfig(config);
  
  if (!validateSMBConfig(config)) {
    return;
  }

  try {
    console.log('🧪 Test de la lecture récursive...');
    
    // Connexion
    const client = new smb2.Client(config.host);
    const session = await client.authenticate({
      domain: config.domain,
      username: config.username,
      password: config.password,
      forceNtlmVersion: config.forceNtlmVersion
    });
    const tree = await session.connectTree(config.share);

    // Test 1: Lecture normale vs récursive
    console.log('\n📁 Test 1: Comparaison normale vs récursive');
    
    const normalEntries = await tree.readDirectory('/');
    console.log(`Lecture normale: ${normalEntries.length} éléments`);
    
    const recursiveEntries = await tree.readDirectoryRecursive('/', 2);
    console.log(`Lecture récursive (depth 2): ${recursiveEntries.length} éléments`);
    
    // Analyser les types d'entrées
    const normalFiles = normalEntries.filter(e => e.type === 'File');
    const normalDirs = normalEntries.filter(e => e.type === 'Directory');
    
    const recursiveFiles = recursiveEntries.filter(e => e.type === 'File');
    const recursiveDirs = recursiveEntries.filter(e => e.type === 'Directory');
    
    console.log('\n📊 Analyse des résultats:');
    console.log(`Normal  - Fichiers: ${normalFiles.length}, Répertoires: ${normalDirs.length}`);
    console.log(`Récursif - Fichiers: ${recursiveFiles.length}, Répertoires: ${recursiveDirs.length}`);
    
    // Vérifier qu'on a plus de fichiers en mode récursif
    if (recursiveFiles.length > normalFiles.length) {
      console.log('✅ SUCCESS: La récursion trouve plus de fichiers !');
    } else {
      console.log('❌ PROBLEM: La récursion ne trouve pas plus de fichiers');
    }
    
    // Test 2: Afficher quelques exemples de fichiers trouvés
    console.log('\n📄 Exemples de fichiers trouvés en mode récursif:');
    recursiveFiles.slice(0, 10).forEach(file => {
      console.log(`  ${file.fullPath || file.filename}`);
    });
    
    // Test 3: Vérifier la structure des chemins
    console.log('\n🔍 Vérification des chemins complets:');
    const filesWithFullPath = recursiveEntries.filter(e => e.fullPath && e.fullPath.includes('/'));
    console.log(`Fichiers avec chemin complet: ${filesWithFullPath.length}/${recursiveEntries.length}`);
    
    if (filesWithFullPath.length > 0) {
      console.log('✅ SUCCESS: Les chemins complets sont correctement générés !');
      filesWithFullPath.slice(0, 5).forEach(file => {
        console.log(`  ${file.type}: ${file.fullPath}`);
      });
    } else {
      console.log('❌ PROBLEM: Aucun chemin complet généré');
    }

  } catch (error) {
    console.error('❌ Erreur de test:', error);
  }
}

// Version de debug avec plus de détails
export async function debugRecursiveRead(tree: any, path: string = '/', depth: number = 2) {
  console.log(`\n🐛 DEBUG: Lecture récursive de ${path} (depth: ${depth})`);
  
  const directory = new Directory(tree);
  await directory.open(path);
  
  console.log(`📂 Ouverture du répertoire: ${path}`);
  const entries = await directory.read(true, '', depth);
  
  console.log(`📊 Total trouvé: ${entries.length} éléments`);
  
  // Grouper par niveau de profondeur
  const byLevel: Record<number, { files: any[]; dirs: any[] }> = {};
  
  entries.forEach(entry => {
    const level = entry.fullPath ? entry.fullPath.split('/').length - 1 : 0;
    if (!byLevel[level]) {
      byLevel[level] = { files: [], dirs: [] };
    }
    
    if (entry.type === 'File') {
      byLevel[level].files.push(entry);
    } else {
      byLevel[level].dirs.push(entry);
    }
  });
  
  // Afficher par niveau
  Object.entries(byLevel).forEach(([level, counts]) => {
    console.log(`  Niveau ${level}: ${counts.files.length} fichiers, ${counts.dirs.length} répertoires`);
    
    // Afficher quelques exemples
    if (counts.files.length > 0) {
      console.log(`    📄 Exemples de fichiers:`);
      counts.files.slice(0, 3).forEach(file => {
        console.log(`      ${file.fullPath || file.filename}`);
      });
    }
    
    if (counts.dirs.length > 0) {
      console.log(`    📁 Exemples de répertoires:`);
      counts.dirs.slice(0, 3).forEach(dir => {
        console.log(`      ${dir.fullPath || dir.filename}`);
      });
    }
  });
  
  await directory.close();
  return entries;
}

if (require.main === module) {
  testRecursiveRead();
}