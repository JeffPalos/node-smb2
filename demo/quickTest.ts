import smb2 from '../src';
import { loadSMBConfig, displaySMBConfig, validateSMBConfig } from './smbConfig';

/**
 * Exemple simple pour tester et démontrer la correction de la lecture récursive
 */
async function quickRecursiveTest() {
  // Chargement de la configuration depuis les variables d'environnement
  const config = loadSMBConfig();
  
  displaySMBConfig(config);
  
  if (!validateSMBConfig(config)) {
    return;
  }

  try {
    // Connexion
    const client = new smb2.Client(config.host);
    const session = await client.authenticate({
      domain: config.domain,
      username: config.username,
      password: config.password,
      forceNtlmVersion: config.forceNtlmVersion
    });
    const tree = await session.connectTree(config.share);

    console.log('🔍 Test de la lecture récursive corrigée...\n');

    // Test 1: Lecture du répertoire racine (non-récursive)
    console.log('📁 Étape 1: Lecture normale du répertoire racine');
    const rootEntries = await tree.readDirectory('/');
    const rootFiles = rootEntries.filter(e => e.type === 'File');
    const rootDirs = rootEntries.filter(e => e.type === 'Directory');
    
    console.log(`  Trouvé: ${rootFiles.length} fichiers, ${rootDirs.length} répertoires`);
    console.log(`  Exemples de répertoires:`, rootDirs.slice(0, 3).map(d => d.filename));

    // Test 2: Lecture récursive (profondeur 2)
    console.log('\n🔄 Étape 2: Lecture récursive (profondeur 2)');
    const recursiveEntries = await tree.readDirectoryRecursive('/', 2);
    const allFiles = recursiveEntries.filter(e => e.type === 'File');
    const allDirs = recursiveEntries.filter(e => e.type === 'Directory');
    
    console.log(`  Trouvé: ${allFiles.length} fichiers, ${allDirs.length} répertoires`);

    // Test 3: Vérification que les fichiers des sous-répertoires sont inclus
    console.log('\n📊 Étape 3: Analyse des résultats');
    const filesInSubdirs = allFiles.filter(f => f.fullPath && f.fullPath.includes('/'));
    
    console.log(`  Fichiers à la racine: ${rootFiles.length}`);
    console.log(`  Fichiers total (récursif): ${allFiles.length}`);
    console.log(`  Fichiers dans les sous-répertoires: ${filesInSubdirs.length}`);

    if (allFiles.length > rootFiles.length) {
      console.log('\n✅ SUCCESS: La récursion fonctionne ! Plus de fichiers trouvés en mode récursif.');
    } else {
      console.log('\n⚠️  WARNING: Même nombre de fichiers en mode récursif - vérifiez s\'il y a des sous-répertoires avec des fichiers.');
    }

    // Test 4: Afficher quelques exemples de fichiers dans les sous-répertoires
    if (filesInSubdirs.length > 0) {
      console.log('\n📄 Exemples de fichiers trouvés dans les sous-répertoires:');
      filesInSubdirs.slice(0, 10).forEach(file => {
        console.log(`  ${file.fullPath}`);
      });
    }

    // Test 5: Structure par niveau
    console.log('\n🏗️ Structure par niveau de profondeur:');
    const levels: Record<number, { files: number; dirs: number }> = {};
    
    recursiveEntries.forEach(entry => {
      const depth = entry.fullPath ? entry.fullPath.split('/').length - 1 : 0;
      if (!levels[depth]) levels[depth] = { files: 0, dirs: 0 };
      
      if (entry.type === 'File') levels[depth].files++;
      else levels[depth].dirs++;
    });

    Object.entries(levels).forEach(([depth, counts]) => {
      console.log(`  Niveau ${depth}: ${counts.files} fichiers, ${counts.dirs} répertoires`);
    });

    console.log('\n🎉 Test terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

export default quickRecursiveTest;

if (require.main === module) {
  quickRecursiveTest();
}