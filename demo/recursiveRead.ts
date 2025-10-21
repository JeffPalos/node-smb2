import smb2 from '../src';
import Directory from '../src/client/Directory';
import DirectoryEntry from '../src/protocol/models/DirectoryEntry';

// Exemple d'utilisation de la fonction read() récursive
async function recursiveDirectoryExample() {
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

    // Ouvrir un répertoire
    const directory = new Directory(tree);
    await directory.open('/some/path'); // Remplacez par votre chemin

    console.log('📁 Lecture simple (non-récursive):');
    const entries = await directory.read();
    console.log(`Found ${entries.length} entries`);
    entries.forEach((entry: DirectoryEntry) => {
      console.log(`  ${entry.type}: ${entry.filename}`);
    });

    console.log('\n🔄 Lecture récursive (avec sous-répertoires):');
    const recursiveEntries = await directory.readRecursive(5); // Max depth: 5
    console.log(`Found ${recursiveEntries.length} total entries (including subdirectories)`);
    
    recursiveEntries.forEach((entry: DirectoryEntry) => {
      const indent = '  '.repeat((entry.fullPath?.split('/').length || 1) - 1);
      console.log(`${indent}${entry.type}: ${entry.fullPath || entry.filename}`);
    });

    console.log('\n🎯 Lecture récursive avec paramètres personnalisés:');
    const customRecursive = await directory.read(true, '', 3); // Récursif, path vide, max depth 3
    console.log(`Found ${customRecursive.length} entries with max depth 3`);

    // Fermer le répertoire
    await directory.close();

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Usage
recursiveDirectoryExample();