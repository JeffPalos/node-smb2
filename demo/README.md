# 🚀 Guide d'utilisation des démos

## Installation et préparation

```bash
# 1. Installer les dépendances
npm install

# 2. Créer le fichier .env (si pas déjà fait)
cp .env.example .env

# 3. Modifier .env avec vos vraies valeurs
nano .env

# 4. Vérifier que les variables sont bien chargées
npm run test:env
```

## ⚡ Exécution rapide

### Option 1: Scripts npm (recommandé)
```bash
# Demo principale avec menu
npm start

# Tests spécifiques
npm run demo:quick      # Test rapide de la récursion
npm run demo:tree       # Exemples avancés Tree  
npm run demo:debug      # Debug détaillé
npm run demo:original   # Client original
```

### Option 2: Fichier spécifique
```bash
# Exemple simple (modifiez le fichier avec vos paramètres)
npx ts-node demo/simpleExample.ts

# Avec paramètres
npx ts-node demo/index.ts 1    # Quick test
npx ts-node demo/index.ts 2    # Tree examples
```

## 🔧 Configuration

### Via fichier .env (recommandé)
```bash
# Editez le fichier .env
HOST=192.168.1.100
DOMAIN=WORKGROUP  
USERNAME=user
PASSWORD=password
SHARE=shared

# Vérifiez que ça fonctionne
npm run test:env
```

### Via variables d'environnement
```bash
export HOST="192.168.1.100"
export USERNAME="user"
export PASSWORD="password"
export SHARE="shared"
npm start
```

### Via modification directe
Editez `demo/simpleExample.ts` ligne 8-14

## 📁 Fichiers de démo disponibles

| Fichier | Description | Usage |
|---------|-------------|-------|
| `simpleExample.ts` | ⭐ **Recommandé pour débuter** | Test simple avec config intégrée |
| `quickTest.ts` | Test rapide de la récursion | Vérification que le bug est corrigé |
| `recursiveTreeUsage.ts` | Exemples avancés Tree | Toutes les fonctionnalités récursives |
| `testRecursive.ts` | Debug détaillé | Analyse approfondie |
| `runClient.ts` | Client original | Comparaison avec l'ancien comportement |
| `index.ts` | Menu interactif | Point d'entrée avec choix |

## 🎯 Tests recommandés par ordre

1. **Première fois**: `simpleExample.ts` - Modifiez et testez
2. **Vérification**: `npm run demo:quick` - Test de la correction
3. **Exploration**: `npm run demo:tree` - Voir toutes les fonctionnalités
4. **Debug**: `npm run demo:debug` - Si problèmes

## 📊 Que vérifier dans les résultats

### ✅ Bon fonctionnement:
```
Normal: 5 éléments
Récursif: 12 éléments    ← Plus d'éléments
Fichiers dans sous-répertoires: 7    ← > 0
```

### ⚠️ Problème possible:
```
Normal: 5 éléments  
Récursif: 5 éléments     ← Même nombre
Fichiers dans sous-répertoires: 0    ← Aucun fichier trouvé
```
**Cause**: Pas de sous-répertoires ou sous-répertoires vides

## 🔍 Dépannage

### Erreur de connexion
```
❌ Error: Connection failed
```
**Solutions**:
- Vérifiez HOST, USERNAME, PASSWORD dans .env
- Testez avec `ping HOST` 
- Vérifiez que le service SMB est démarré

### Erreur de partage  
```
❌ Error: Share not found
```
**Solutions**:
- Vérifiez que SHARE existe 
- Testez l'accès manuel au partage
- Vérifiez les permissions

### Pas de différence récursive
```
Normal: X éléments
Récursif: X éléments (même nombre)
```
**Solutions**:
- Testez un autre répertoire avec `npm start -- 6 /autre/path 3`
- Créez des fichiers dans des sous-répertoires pour tester
- Vérifiez avec `npm run demo:debug` pour voir la structure détaillée

## 💡 Conseils d'utilisation

### Performance
- Pour gros répertoires: limitez la profondeur (2-3)
- Utilisez `console.time()` pour mesurer

### Sécurité  
- Ne commitez jamais le fichier .env
- Utilisez des comptes dédiés pour les tests

### Production
- Gérez les erreurs avec try/catch
- Limitez la profondeur récursive
- Implémentez des timeouts appropriés

## 🎪 Exemples pratiques

### Rechercher tous les .pdf
```typescript
const allFiles = await tree.readDirectoryRecursive('/documents', 5);
const pdfs = allFiles.filter(f => f.filename.endsWith('.pdf'));
```

### Calculer la taille totale
```typescript  
const allFiles = await tree.readDirectoryRecursive('/data', 3);
const totalSize = allFiles
  .filter(e => e.type === 'File')
  .reduce((sum, f) => sum + Number(f.fileSize), 0);
```