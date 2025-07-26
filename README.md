# HosMApp - Application Mobile de Suivi Patient

Application mobile React Native destinée aux **patients** pour suivre leur statut hospitalier, connectée à l'API Node.js.

## Fonctionnalités

- **Authentification patient** avec email et mot de passe
- **Suivi du statut actuel** du patient
- **Historique des changements de statut** avec commentaires
- **Prise de rendez-vous** avec les services disponibles
- **Gestion des rendez-vous** (voir, annuler)
- **File d'attente en temps réel** avec position et temps d'attente
- **Notifications temps réel** pour les mises à jour importantes
- **WebSocket temps réel** pour les mises à jour instantanées
- **Informations personnelles** du patient
- **Stockage local sécurisé** des données d'authentification
- **Gestion d'erreurs robuste**
- **Actualisation en temps réel** (pull-to-refresh)

## Prérequis

- Node.js (version 18 ou supérieure)
- npm ou yarn
- React Native CLI
- Android Studio (pour Android)
- Xcode (pour iOS - macOS uniquement)
- API Node.js en cours d'exécution

## Installation

### 1. Cloner le projet

```bash
git clone <repository-url>
cd hosmapp
```

### 2. Installer les dépendances

```bash
npm install
```

### 4. Configuration pour Android

Pour le développement Android, vous devrez peut-être modifier l'URL de l'API pour utiliser l'IP de votre machine au lieu de localhost :

```typescript
BASE_URL: __DEV__ 
  ? 'http://xxx.xxx.x.xxx:3000/api'
```
xxx.xxx.x.xxx = ip de la machine

### 5. Démarrer l'application

#### Pour Android :
```bash
npm run android
```

#### Démarrer le bundler Metro :
```bash
npm start
```

### Configuration de l'API

Le fichier `src/config/api.ts` contient toute la configuration de l'API :

- URLs des endpoints patients
- Timeouts
- Messages d'erreur personnalisés
- Configuration CORS

## Authentification Patient

L'application utilise un système d'authentification spécifique aux patients :

- **Login** : Authentification avec numéro de dossier + téléphone
- **Token JWT** : Stocké dans AsyncStorage
- **Auto-logout** : En cas d'expiration du token
- **Persistance** : Le patient reste connecté entre les sessions

### Processus de connexion

1. Le patient saisit son **adresse email**
2. Le patient saisit son **mot de passe**
3. L'API vérifie les informations
4. Si valides, un token JWT est généré
5. Le patient accède à son tableau de bord

## Fonctionnalités Patient

### Statut Actuel
- Affichage du statut actuel du patient
- Couleur distinctive selon le statut
- Description détaillée du statut

### Informations Personnelles
- Nom et prénom
- Date de naissance
- Sexe
- Numéro de téléphone
- Adresse
- Numéro de dossier

### Historique des Statuts
- Liste chronologique des changements de statut
- Date et heure de chaque changement
- Commentaires associés (si disponibles)
- Couleurs distinctives pour chaque statut

### Prise de Rendez-vous
- Consultation des services disponibles
- Sélection de date et heure
- Ajout de commentaires optionnels
- Validation des données avant envoi

### Gestion des Rendez-vous
- Liste de tous les rendez-vous du patient
- Statuts des rendez-vous (En attente, Confirmé, Annulé, Terminé)
- Possibilité d'annuler les rendez-vous en attente
- Actualisation en temps réel

### File d'Attente en Temps Réel
- Affichage de la position actuelle dans la file d'attente
- Temps d'attente estimé et temps d'attente réel
- Statut de la queue (En attente, En cours, Terminé, Annulé)
- Statistiques de la file d'attente (nombre total de patients, temps moyen)
- Connexion WebSocket pour les mises à jour instantanées
- Animation de pulse pour indiquer l'activité temps réel

### Notifications Temps Réel
- Système de notifications push pour les mises à jour importantes
- Types de notifications : Changement de statut, Mise à jour de queue, Rappel de rendez-vous
- Marquage des notifications comme lues
- Historique complet des notifications
- Interface intuitive avec indicateurs visuels

## Interface Utilisateur

L'application utilise un design moderne avec :

- **Couleurs cohérentes** : Palette de couleurs professionnelle
- **Typographie claire** : Hiérarchie visuelle bien définie
- **Composants réutilisables** : Design system cohérent
- **Responsive** : Adaptation aux différentes tailles d'écran
- **Accessibilité** : Support des lecteurs d'écran
- **Pull-to-refresh** : Actualisation facile des données

## Gestion d'Erreurs

L'application gère plusieurs types d'erreurs :

- **Erreurs réseau** : Connexion internet
- **Erreurs d'authentification** : Token expiré/invalide
- **Erreurs de validation** : Données invalides
- **Erreurs serveur** : Problèmes côté API
- **Patient non trouvé** : Email/mot de passe incorrect

## Développement

### Architecture Temps Réel

L'application utilise une architecture temps réel basée sur WebSocket :

#### Service WebSocket (`src/services/realtime.ts`)
- Gestion automatique de la connexion/déconnexion
- Reconnexion automatique en cas de perte de connexion
- Heartbeat pour maintenir la connexion active
- Système d'événements pour les mises à jour

#### Types d'événements supportés
- `QUEUE_UPDATE` : Mise à jour de la position dans la file d'attente
- `STATUT_CHANGE` : Changement de statut du patient
- `NOTIFICATION` : Nouvelle notification
- `HEARTBEAT` : Vérification de la connexion

#### Configuration WebSocket
```typescript
// Configuration selon l'environnement
url: __DEV__ ? 'ws://localhost:3000/ws' : 'wss://your-production-api.com/ws'
reconnectInterval: 5000, // 5 secondes
maxReconnectAttempts: 10,
heartbeatInterval: 30000, // 30 secondes
```

### Ajouter un nouvel écran

1. Créer le fichier dans `src/screens/`
2. Importer dans `App.tsx`
3. Ajouter la navigation

### Ajouter un nouveau service API

1. Ajouter les méthodes dans `src/services/api.ts`
2. Ajouter les types TypeScript
3. Utiliser dans les composants

### Modifier la configuration

1. Éditer `src/config/api.ts`
2. Redémarrer l'application si nécessaire

## Build et Déploiement

### Build Android

```bash
cd android
./gradlew assembleRelease
```

### Build iOS

```bash
cd ios
xcodebuild -workspace hosmapp.xcworkspace -scheme hosmapp -configuration Release
```