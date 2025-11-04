// import runServer from "./runServer";
import runClient from "./runClient";
import quickTest from "./quickTest";
import { recursiveTreeExample, analyzeDirectoryStructure } from "./recursiveTreeUsage";
import { debugRecursiveRead } from "./testRecursive";
import smb2 from "../src";

interface DemoConfig {
  host: string;
  domain: string;
  username: string;
  password: string;
  share: string;
  forceNtlmVersion?: 'v1' | 'v2';
}

async function showMenu(): Promise<number> {
  console.log('\n🎯 === DEMO MENU - @jeffpalos/node-smb2 ===');
  console.log('1. 🚀 Quick Test - Test rapide de la récursion corrigée');
  console.log('2. 🌳 Tree Usage - Exemples avancés avec Tree class');
  console.log('3. 🧪 Original Client - Démo client SMB original');
  console.log('4. 🔍 Debug Recursive - Analyse détaillée de la récursion');
  console.log('5. 📊 Directory Analysis - Analyse complète d\'un répertoire');
  console.log('6. 🛠️  Custom Test - Test personnalisé');
  console.log('0. ❌ Exit');
  console.log('\nConfiguration actuelle:');
  
  const config = getConfig();
  console.log(`Host: ${config.host}`);
  console.log(`Domain: ${config.domain}`);
  console.log(`Username: ${config.username}`);
  console.log(`Share: ${config.share}`);
  
  // Simple input simulation (dans un vrai projet, utilisez readline)
  const choice = process.argv[2] ? parseInt(process.argv[2]) : 1;
  console.log(`\nSélection: ${choice} (utilisez: npm start -- ${choice} pour choisir)`);
  return choice;
}

function getConfig(): DemoConfig {
  const {
    HOST: host = "localhost",
    DOMAIN: domain = "domain", 
    USERNAME: username = "test",
    PASSWORD: password = "1234",
    SHARE: share = "test",
    FORCE_NTLM: forceNtlm
  } = process.env;

  const forceNtlmVersion = forceNtlm === 'v1' ? 'v1' : 
                           forceNtlm === 'v2' ? 'v2' : 
                           undefined;

  return { host, domain, username, password, share, forceNtlmVersion };
}

async function runDemo(choice: number, config: DemoConfig) {
  try {
    switch (choice) {
      case 1:
        console.log('🚀 Exécution du test rapide...');
        await quickTest();
        break;
        
      case 2:
        console.log('🌳 Exécution des exemples Tree...');
        await recursiveTreeExample();
        break;
        
      case 3:
        console.log('🧪 Exécution du client original...');
        await runClient(config.host, config.domain, config.username, 
                       config.password, config.share, config.forceNtlmVersion);
        break;
        
      case 4:
        console.log('🔍 Exécution du debug récursif...');
        // Connexion pour debug
        const client = new smb2.Client(config.host);
        const session = await client.authenticate({
          domain: config.domain,
          username: config.username,
          password: config.password,
          forceNtlmVersion: config.forceNtlmVersion
        });
        const tree = await session.connectTree(config.share);
        await debugRecursiveRead(tree, '/', 2);
        break;
        
      case 5:
        console.log('📊 Analyse complète du répertoire...');
        // Connexion pour analyse
        const client2 = new smb2.Client(config.host);
        const session2 = await client2.authenticate({
          domain: config.domain,
          username: config.username,
          password: config.password,
          forceNtlmVersion: config.forceNtlmVersion
        });
        const tree2 = await session2.connectTree(config.share);
        await analyzeDirectoryStructure(tree2, '/', 3);
        break;
        
      case 6:
        console.log('🛠️  Test personnalisé...');
        await customTest(config);
        break;
        
      case 0:
        console.log('👋 Au revoir !');
        return;
        
      default:
        console.log('❌ Choix invalide, exécution du test par défaut...');
        await quickTest();
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution de la démo:', error);
    console.log('\n💡 Conseils de dépannage:');
    console.log('- Vérifiez les variables d\'environnement HOST, USERNAME, PASSWORD, SHARE');
    console.log('- Assurez-vous que le serveur SMB est accessible');
    console.log('- Vérifiez les permissions d\'accès au partage');
  }
}

async function customTest(config: DemoConfig) {
  console.log('🛠️  Test personnalisé - Comparaison normale vs récursive');
  
  const client = new smb2.Client(config.host);
  const session = await client.authenticate({
    domain: config.domain,
    username: config.username,
    password: config.password,
    forceNtlmVersion: config.forceNtlmVersion
  });
  const tree = await session.connectTree(config.share);

  // Test personnalisable
  const testPath = process.argv[3] || '/';
  const maxDepth = parseInt(process.argv[4]) || 2;
  
  console.log(`Chemin testé: ${testPath}`);
  console.log(`Profondeur max: ${maxDepth}`);
  
  console.time('Lecture normale');
  const normalEntries = await tree.readDirectory(testPath);
  console.timeEnd('Lecture normale');
  
  console.time('Lecture récursive');
  const recursiveEntries = await tree.readDirectoryRecursive(testPath, maxDepth);
  console.timeEnd('Lecture récursive');
  
  const normalFiles = normalEntries.filter(e => e.type === 'File');
  const recursiveFiles = recursiveEntries.filter(e => e.type === 'File');
  
  console.log(`\n📊 Résultats:`);
  console.log(`Normal: ${normalFiles.length} fichiers, ${normalEntries.length - normalFiles.length} répertoires`);
  console.log(`Récursif: ${recursiveFiles.length} fichiers, ${recursiveEntries.length - recursiveFiles.length} répertoires`);
  
  if (recursiveFiles.length > normalFiles.length) {
    console.log('✅ SUCCESS: La récursion fonctionne correctement !');
  }
}

(async () => {
  const config = getConfig();
  const choice = await showMenu();
  await runDemo(choice, config);
  
  console.log('\n📚 Pour plus d\'aide, consultez DEMO_USAGE_GUIDE.md');
  console.log('🚀 Utilisation: npm start -- [1-6] [chemin] [profondeur]');
  console.log('   Exemple: npm start -- 6 /documents 3');
})();