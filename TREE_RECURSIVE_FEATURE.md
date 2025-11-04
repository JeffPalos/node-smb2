# Fonctionnalité de lecture récursive - Classe Tree

## Nouvelles méthodes ajoutées à la classe Tree

### 1. Méthode `readDirectory()` étendue

La méthode existante `readDirectory()` a été étendue pour supporter la lecture récursive :

```typescript
async readDirectory(path: string = "/", recursive: boolean = false, maxDepth: number = 10): Promise<DirectoryEntry[]>
```

**Paramètres :**
- `path` : Chemin du répertoire à lire (défaut: `"/"`)
- `recursive` : Active la lecture récursive (défaut: `false`)
- `maxDepth` : Profondeur maximale de récursion (défaut: `10`)

### 2. Nouvelle méthode `readDirectoryRecursive()`

Une méthode utilitaire dédiée à la lecture récursive :

```typescript
async readDirectoryRecursive(path: string = "/", maxDepth: number = 10): Promise<DirectoryEntry[]>
```

**Paramètres :**
- `path` : Chemin du répertoire à lire (défaut: `"/"`)
- `maxDepth` : Profondeur maximale de récursion (défaut: `10`)

## Utilisation avec la classe Tree

### Exemples de base

```typescript
import smb2 from '@jeffpalos/node-smb2';

// Configuration de connexion
const client = new smb2.Client('server-address');
const session = await client.authenticate({
  domain: 'domain',
  username: 'username',
  password: 'password'
});
const tree = await session.connectTree('share');

// 1. Lecture simple (comportement existant inchangé)
const entries = await tree.readDirectory('/path');

// 2. Lecture récursive avec readDirectoryRecursive() - RECOMMANDÉ
const allEntries = await tree.readDirectoryRecursive('/path', 5);

// 3. Lecture récursive avec readDirectory() étendu
const recursiveEntries = await tree.readDirectory('/path', true, 3);
```

### Cas d'utilisation avancés

#### Analyse complète d'une arborescence
```typescript
// Lire tout le contenu récursivement avec une profondeur limitée
const allContent = await tree.readDirectoryRecursive('/', 10);

console.log(`Total: ${allContent.length} éléments trouvés`);

// Filtrer par type
const files = allContent.filter(entry => entry.type === 'File');
const directories = allContent.filter(entry => entry.type === 'Directory');

console.log(`Fichiers: ${files.length}, Répertoires: ${directories.length}`);
```

#### Recherche de fichiers spécifiques
```typescript
// Chercher tous les fichiers .pdf récursivement
const allFiles = await tree.readDirectoryRecursive('/documents', 5);
const pdfFiles = allFiles.filter(entry => 
  entry.type === 'File' && 
  entry.filename.toLowerCase().endsWith('.pdf')
);

pdfFiles.forEach(file => {
  console.log(`PDF trouvé: ${file.fullPath || file.filename}`);
});
```

#### Analyse des tailles de fichiers
```typescript
const entries = await tree.readDirectoryRecursive('/', 3);
const files = entries.filter(entry => entry.type === 'File');

// Trier par taille (plus gros en premier)
files.sort((a, b) => Number(b.fileSize) - Number(a.fileSize));

console.log('🏆 Top 5 des plus gros fichiers:');
files.slice(0, 5).forEach(file => {
  const sizeMB = (Number(file.fileSize) / (1024 * 1024)).toFixed(2);
  console.log(`${file.fullPath}: ${sizeMB} MB`);
});
```

## Avantages par rapport à l'utilisation directe de Directory

### ✅ Simplicité d'utilisation
- **Tree**: `await tree.readDirectoryRecursive('/path')`
- **Directory**: Nécessite `new Directory()`, `open()`, `read()`, `close()`

### ✅ Gestion automatique des ressources
- La classe Tree gère automatiquement l'ouverture et la fermeture des répertoires
- Pas de risque d'oubli de fermeture de handles

### ✅ API cohérente
- S'intègre naturellement avec les autres méthodes de Tree
- Même pattern que `readFile()`, `createFile()`, etc.

### ✅ Code plus propre
```typescript
// ❌ Avec Directory (verbose)
const directory = new Directory(tree);
await directory.open('/path');
const entries = await directory.readRecursive(5);
await directory.close();

// ✅ Avec Tree (concis)
const entries = await tree.readDirectoryRecursive('/path', 5);
```

## Comparaison des performances

```typescript
console.time('Lecture normale');
const normal = await tree.readDirectory('/');
console.timeEnd('Lecture normale');
// ~10ms pour 100 éléments

console.time('Lecture récursive (profondeur 3)');
const recursive = await tree.readDirectoryRecursive('/', 3);
console.timeEnd('Lecture récursive (profondeur 3)');
// ~150ms pour 1000+ éléments (selon la structure)
```

## Fonctionnalités de sécurité héritées

Toutes les fonctionnalités de sécurité de la classe `Directory` sont présentes :

- 🛡️ **Protection anti-boucle infinie** : Limite de profondeur
- 🚫 **Limite mémoire** : Arrêt après 200,000 entrées
- 🔄 **Gestion d'erreurs robuste** : Continue malgré les erreurs sur certains sous-répertoires
- 📊 **Logging informatif** : Messages d'avertissement détaillés

## Migration du code existant

### Code existant (inchangé)
```typescript
const entries = await tree.readDirectory('/path'); // ✅ Fonctionne toujours
```

### Nouveau code récursif
```typescript
const entries = await tree.readDirectoryRecursive('/path'); // 🆕 Nouvelle fonctionnalité
// ou
const entries = await tree.readDirectory('/path', true); // 🆕 Paramètre optionnel
```

**Aucune modification nécessaire** pour le code existant - totalement rétrocompatible !

## Cas d'utilisation recommandés

| Cas d'usage | Méthode recommandée | Raison |
|-------------|---------------------|---------|
| Lecture simple d'un répertoire | `readDirectory(path)` | Performance optimale |
| Exploration complète d'une arborescence | `readDirectoryRecursive(path, depth)` | API claire et simple |
| Recherche de fichiers dans l'arborescence | `readDirectoryRecursive(path, depth)` + filter | Une seule requête |
| Interface utilisateur (navigation) | `readDirectory(path)` | Chargement à la demande |
| Backup/synchronisation | `readDirectoryRecursive(path, ∞)` | Vision complète |