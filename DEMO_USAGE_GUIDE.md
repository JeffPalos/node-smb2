# Guide d'utilisation des fichiers de démonstration

## 📁 Fichiers disponibles dans le dossier `demo/`

### Fichiers principaux de test :
- **`quickTest.ts`** - Test simple de la fonctionnalité récursive corrigée
- **`testRecursive.ts`** - Test détaillé avec debug de la récursion
- **`recursiveTreeUsage.ts`** - Exemples avancés d'utilisation avec Tree
- **`recursiveRead.ts`** - Exemples avec la classe Directory
- **`runClient.ts`** - Client SMB original du projet
- **`index.ts`** - Point d'entrée principal pour les démos

## 🚀 Comment utiliser les démos

### 1. Configuration des variables d'environnement

#### Option A: Fichier .env (recommandée)
Créez ou modifiez le fichier `.env` dans le répertoire racine :

```bash
# Configuration SMB pour les démos
HOST=votre-serveur-smb          # Adresse du serveur SMB
DOMAIN=votre-domaine            # Domaine Windows  
USERNAME=votre-utilisateur      # Nom d'utilisateur
PASSWORD=votre-mot-de-passe     # Mot de passe
SHARE=votre-partage             # Nom du partage SMB
FORCE_NTLM=v2                   # Version NTLM (optionnel)
```

#### Option B: Variables d'environnement système
```bash
export HOST="votre-serveur-smb"
export DOMAIN="votre-domaine" 
export USERNAME="votre-utilisateur"
export PASSWORD="votre-mot-de-passe"
export SHARE="votre-partage"
```

#### Vérification de la configuration
```bash
npm run test:env    # Vérifier que les variables .env sont bien chargées
```

### 2. Exécution des démos

#### Option A: Via npm (recommandée)
```bash
# Exécuter la démo principale
npm start

# Exécuter un fichier de démo spécifique
npx ts-node demo/quickTest.ts
npx ts-node demo/recursiveTreeUsage.ts
```

#### Option B: Via TypeScript direct
```bash
# Compiler d'abord
npm run build

# Puis exécuter les fichiers JS
node dist/demo/index.js
node dist/demo/quickTest.js
```

### 3. Tests spécifiques de la récursion

#### Test rapide de la correction du bug :
```bash
npx ts-node demo/quickTest.ts
```
**Ce fichier :** Vérifie que la récursion trouve bien les fichiers dans les sous-répertoires

#### Test détaillé avec analyse :
```bash
npx ts-node demo/testRecursive.ts
```
**Ce fichier :** Analyse en profondeur la structure récursive avec debug

#### Exemples avancés avec Tree :
```bash
npx ts-node demo/recursiveTreeUsage.ts
```
**Ce fichier :** Démontre toutes les fonctionnalités récursives de Tree

## 🔧 Personnalisation des démos

### Modification rapide des paramètres de connexion

Éditez le fichier que vous voulez utiliser et modifiez cette section :
```typescript
const config = {
  host: 'votre-serveur',      // ⬅️ Changez ici
  domain: 'votre-domaine',    // ⬅️ Changez ici  
  username: 'votre-user',     // ⬅️ Changez ici
  password: 'votre-password', // ⬅️ Changez ici
  share: 'votre-partage'      // ⬅️ Changez ici
};
```

### Modification des paramètres de test

Pour changer le répertoire testé ou la profondeur :
```typescript
// Dans les fichiers de test, cherchez ces lignes :
const recursiveEntries = await tree.readDirectoryRecursive('/path', 3);
//                                                          ^^^^^ ^^^
//                                                          path  profondeur
```

## 📊 Que faire si les tests échouent

### Erreur de connexion :
```
❌ Error: Connection failed
```
**Solution :** Vérifiez HOST, USERNAME, PASSWORD, DOMAIN

### Erreur de partage :
```  
❌ Error: Share not found
```
**Solution :** Vérifiez que SHARE existe et que vous y avez accès

### Pas de différence entre normal et récursif :
```
Normal: 5 éléments
Récursif: 5 éléments  ← Même nombre
```
**Cause possible :** Aucun sous-répertoire ou sous-répertoires vides
**Solution :** Testez avec un répertoire contenant des fichiers dans des sous-dossiers

## 🧪 Tests recommandés par ordre

1. **Test de base** : `quickTest.ts` pour vérifier que tout fonctionne
2. **Test complet** : `recursiveTreeUsage.ts` pour voir toutes les fonctionnalités  
3. **Debug si problème** : `testRecursive.ts` pour analyser en détail
4. **Client original** : `runClient.ts` pour comparer avec l'ancien comportement

## 💡 Conseils d'utilisation

### Pour des gros répertoires :
- Limitez la profondeur : `maxDepth: 2` ou `3`
- Utilisez `console.time()` pour mesurer les performances

### Pour débugger :
- Utilisez `testRecursive.ts` qui affiche le détail par niveau
- Ajoutez des `console.log()` dans vos tests

### Pour la production :
- Utilisez `tree.readDirectoryRecursive(path, depth)` (API simple)
- Gérez les erreurs avec try/catch appropriés

## 🎯 Exemples d'utilisation pratique

### Rechercher tous les fichiers .pdf :
```typescript
const allEntries = await tree.readDirectoryRecursive('/documents', 5);
const pdfFiles = allEntries.filter(entry => 
  entry.type === 'File' && entry.filename.toLowerCase().endsWith('.pdf')
);
```

### Calculer la taille totale d'un répertoire :
```typescript
const allEntries = await tree.readDirectoryRecursive('/data', 10);
const totalSize = allEntries
  .filter(entry => entry.type === 'File')
  .reduce((sum, file) => sum + Number(file.fileSize), 0);
```

### Lister tous les répertoires vides :
```typescript
const allEntries = await tree.readDirectoryRecursive('/', 5);
const directories = allEntries.filter(entry => entry.type === 'Directory');
// Vérifiez ensuite chaque répertoire individuellement
```