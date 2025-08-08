# API CTA - Contrôle Technique Automobile

Backend Node.js pour l'application mobile de contrôle technique automobile avec FlutterFlow.

## Configuration

### Base de données
- **Host**: 137.255.9.45
- **Port**: 13306
- **Base de données**: cnsrtest
- **Utilisateur**: root
- **Mot de passe**: Y@sser2013

### Variables d'environnement
Copiez le fichier `config.env` et configurez vos variables :
```
DB_HOST=137.255.9.45
DB_PORT=13306
DB_USER=root
DB_PASSWORD=Y@sser2013
DB_NAME=cnsrtest
JWT_SECRET=cta_secret_key_2024
PORT=3000
```

## Installation

```bash
# Installer les dépendances
npm install

# Démarrer le serveur en mode développement
npm run dev

# Démarrer le serveur en production
npm start
```

## Structure de la base de données

### Table `user` (existante)
- `id` - Identifiant unique
- `name` - Nom de l'utilisateur
- `email` - Email de connexion
- `password` - Mot de passe hashé

### Table `photo_cta` (créée automatiquement)
- `id` - Identifiant unique
- `immatriculation` - Immatriculation du véhicule
- `date_visite` - Date de visite
- `date_validite` - Date de validité
- `centre` - Centre de contrôle
- `technicien_name` - Nom du technicien
- `photo_base64` - Photo en base64
- `created_at` - Date de création
- `updated_at` - Date de modification

## API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion utilisateur
- `GET /api/auth/verify` - Vérifier le token

### Contrôles Techniques
- `POST /api/cta/photo` - Ajouter un contrôle technique
- `GET /api/cta/photos` - Récupérer tous les contrôles
- `GET /api/cta/photo/:id` - Récupérer un contrôle spécifique
- `GET /api/cta/search/:immatriculation` - Rechercher par immatriculation
- `PUT /api/cta/photo/:id` - Modifier un contrôle
- `DELETE /api/cta/photo/:id` - Supprimer un contrôle

### Gestion des Utilisateurs
- `GET /api/users` - Récupérer tous les utilisateurs
- `GET /api/users/:id` - Récupérer un utilisateur spécifique
- `POST /api/users` - Créer un nouvel utilisateur
- `PUT /api/users/:id` - Modifier un utilisateur
- `DELETE /api/users/:id` - Supprimer un utilisateur
- `GET /api/users/search/:query` - Rechercher des utilisateurs

## Utilisation avec FlutterFlow

### Connexion
```javascript
// Exemple de requête de connexion
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const data = await response.json();
// Stocker le token: data.token
```

### Ajouter un contrôle technique
```javascript
// Exemple d'ajout de contrôle technique
const response = await fetch('http://localhost:3000/api/cta/photo', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    immatriculation: 'AB-123-CD',
    date_visite: '2024-01-15',
    date_validite: '2025-01-15',
    centre: 'Centre Auto Plus',
    technicien_name: 'Jean Dupont',
    photo_base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...'
  })
});
```

### Créer un nouvel utilisateur
```javascript
// Exemple de création d'utilisateur
const response = await fetch('http://localhost:3000/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    name: 'Nouveau Technicien',
    email: 'nouveau@example.com',
    password: 'password123'
  })
});
```

### Récupérer tous les utilisateurs
```javascript
// Exemple de récupération des utilisateurs
const response = await fetch('http://localhost:3000/api/users', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

## Sécurité

- Authentification JWT obligatoire pour toutes les routes CTA
- Mots de passe hashés avec bcrypt
- Validation des données d'entrée
- Gestion des erreurs centralisée 