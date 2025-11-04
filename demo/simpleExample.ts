import smb2 from '../src';

/**
 * Exemple simple et direct pour tester la fonctionnalité récursive
 * Modifiez les valeurs ci-dessous avec vos vraies informations de connexion
 */
async function simpleExample() {
  // 🔧 CONFIGURATION - MODIFIEZ CES VALEURS
  const config = {
    host: '192.168.1.100',        // ⬅️ IP de votre serveur SMB
    domain: 'WORKGROUP',          // ⬅️ Votre domaine (ou WORKGROUP)
    username: 'user',             // ⬅️ Votre nom d'utilisateur
    password: 'password',         // ⬅️ Votre mot de passe
    share: 'shared'               // ⬅️ Nom de votre partage
  };

  console.log('🔗 Connexion au serveur SMB...');
  console.log(`Host: ${config.host}\\${config.share}`);
  console.log(`User: ${config.domain}\\${config.username}`);

  try {
    // Connexion
    const client = new smb2.Client(config.host);
    const session = await client.authenticate({
      domain: config.domain,
      username: config.username,
      password: config.password
    });
    const tree = await session.connectTree(config.share);
    
    console.log('✅ Connexion réussie !\n');

    // 📁 Test 1: Lecture simple du répertoire racine
    console.log('📁 1. Lecture normale du répertoire racine:');
    const normalEntries = await tree.readDirectory('/');
    
    console.log(`   Trouvé: ${normalEntries.length} éléments`);
    console.log('   Exemples:');
    normalEntries.slice(0, 5).forEach(entry => {
      console.log(`   ${entry.type === 'Directory' ? '📁' : '📄'} ${entry.filename}`);
    });

    // 🔄 Test 2: Lecture récursive (profondeur 2)
    console.log('\n🔄 2. Lecture récursive (profondeur 2):');
    const recursiveEntries = await tree.readDirectoryRecursive('/', 2);
    
    console.log(`   Trouvé: ${recursiveEntries.length} éléments`);
    
    // Analyser les résultats
    const files = recursiveEntries.filter(e => e.type === 'File');
    const dirs = recursiveEntries.filter(e => e.type === 'Directory');
    
    console.log(`   📄 Fichiers: ${files.length}`);
    console.log(`   📁 Répertoires: ${dirs.length}`);

    // 🎯 Test 3: Vérification que la récursion fonctionne
    console.log('\n🎯 3. Vérification de la récursion:');
    const filesInSubdirs = files.filter(f => f.fullPath && f.fullPath.includes('/'));
    
    if (filesInSubdirs.length > 0) {
      console.log(`✅ SUCCESS: ${filesInSubdirs.length} fichiers trouvés dans les sous-répertoires !`);
      console.log('   Exemples de fichiers avec chemin complet:');
      filesInSubdirs.slice(0, 5).forEach(file => {
        console.log(`   📄 ${file.fullPath}`);
      });
    } else {
      console.log('ℹ️  INFO: Aucun fichier dans les sous-répertoires ou sous-répertoires vides');
    }

    // 📊 Test 4: Analyse des performances
    console.log('\n📊 4. Test de performance:');
    
    console.time('Lecture normale');
    await tree.readDirectory('/');
    console.timeEnd('Lecture normale');
    
    console.time('Lecture récursive');
    await tree.readDirectoryRecursive('/', 2);
    console.timeEnd('Lecture récursive');

    console.log('\n🎉 Test terminé avec succès !');
    
  } catch (error: any) {
    console.error('\n❌ Erreur de connexion:', error.message);
    console.log('\n💡 Vérifiez:');
    console.log('- L\'adresse IP du serveur');
    console.log('- Le nom d\'utilisateur et mot de passe');
    console.log('- Le nom du partage');
    console.log('- Que le serveur SMB est démarré');
    console.log('- Les permissions d\'accès au partage');
  }
}

// Execution directe
if (require.main === module) {
  simpleExample();
}

export default simpleExample;