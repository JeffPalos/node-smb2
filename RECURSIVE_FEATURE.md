# Fonctionnalité de lecture récursive des répertoires

## Modifications apportées

### 1. Méthode `read()` étendue
La méthode `read()` de la classe `Directory` a été étendue pour supporter la lecture récursive :

```typescript
async read(recursive: boolean = false, currentPath: string = '', maxDepth: number = 10): Promise<DirectoryEntry[]>
```

**Paramètres :**
- `recursive` : Active la lecture récursive des sous-répertoires (défaut: `false`)
- `currentPath` : Chemin actuel pour le suivi des chemins complets (défaut: `''`)
- `maxDepth` : Profondeur maximale de récursion pour éviter les boucles infinies (défaut: `10`)

### 2. Nouvelle méthode `readRecursive()`
Une méthode utilitaire pour simplifier la lecture récursive :

```typescript
async readRecursive(maxDepth: number = 10): Promise<DirectoryEntry[]>
```

### 3. Interface `DirectoryEntry` étendue
Ajout du champ `fullPath` pour tracer le chemin complet des fichiers dans l'arborescence :

```typescript
interface DirectoryEntry {
  // ... autres propriétés existantes
  fullPath?: string; // Chemin complet du fichier/dossier
}
```

## Utilisation

### Lecture simple (non-récursive)
```typescript
const entries = await directory.read();
// ou
const entries = await directory.read(false);
```

### Lecture récursive
```typescript
// Avec la méthode utilitaire (recommandé)
const allEntries = await directory.readRecursive(5); // Max depth: 5

// Ou avec la méthode read() complète
const allEntries = await directory.read(true, '', 5);
```

## Exemple complet

```typescript
import smb2 from '@jeffpalos/node-smb2';
import Directory from '@jeffpalos/node-smb2/dist/client/Directory';

async function example() {
  const client = new smb2.Client('server-address');
  const session = await client.authenticate({
    domain: 'domain',
    username: 'username',
    password: 'password'
  });
  const tree = await session.connectTree('share');

  const directory = new Directory(tree);
  await directory.open('/path/to/directory');

  // Lecture récursive
  const allEntries = await directory.readRecursive(3);
  
  allEntries.forEach(entry => {
    console.log(`${entry.type}: ${entry.fullPath || entry.filename}`);
  });

  await directory.close();
}
```

## Fonctionnalités de sécurité

1. **Protection contre les boucles infinies** : Limite de profondeur configurable (`maxDepth`)
2. **Limite d'entrées** : Arrêt automatique après 200,000 entrées pour éviter la surcharge mémoire
3. **Gestion d'erreurs robuste** : Les erreurs sur les sous-répertoires n'interrompent pas le traitement global
4. **Logging informatif** : Messages d'avertissement pour les problèmes non-critiques

## Notes techniques

- La récursion utilise de nouvelles instances de `Directory` pour chaque sous-répertoire
- Les erreurs d'accès aux sous-répertoires sont loggées mais n'interrompent pas le processus
- Le champ `fullPath` facilite la navigation dans l'arborescence résultante
- Compatible avec l'API existante (paramètres optionnels)