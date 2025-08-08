# 👥 Routes de Gestion des Utilisateurs

## 📋 Vue d'ensemble

Nouvelles routes ajoutées pour la gestion complète des utilisateurs (CRUD) avec authentification JWT obligatoire.

## 🔗 Endpoints Disponibles

### 1. Récupérer tous les utilisateurs
```
GET /api/users
```
**Headers requis :**
```
Authorization: Bearer <token>
```

**Réponse :**
```json
[
  {
    "id": 1,
    "name": "Jean Dupont",
    "email": "jean@example.com",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
]
```

### 2. Récupérer un utilisateur spécifique
```
GET /api/users/:id
```
**Headers requis :**
```
Authorization: Bearer <token>
```

**Réponse :**
```json
{
  "id": 1,
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

### 3. Créer un nouvel utilisateur
```
POST /api/users
```
**Headers requis :**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body :**
```json
{
  "name": "Nouveau Technicien",
  "email": "nouveau@example.com",
  "password": "password123"
}
```

**Réponse :**
```json
{
  "message": "Utilisateur créé avec succès",
  "user": {
    "id": 2,
    "name": "Nouveau Technicien",
    "email": "nouveau@example.com",
    "created_at": "2024-01-15T11:00:00.000Z"
  }
}
```

### 4. Modifier un utilisateur
```
PUT /api/users/:id
```
**Headers requis :**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (champs optionnels) :**
```json
{
  "name": "Nom Modifié",
  "email": "modifie@example.com",
  "password": "nouveau_password"
}
```

**Réponse :**
```json
{
  "message": "Utilisateur mis à jour avec succès",
  "user": {
    "id": 1,
    "name": "Nom Modifié",
    "email": "modifie@example.com",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### 5. Supprimer un utilisateur
```
DELETE /api/users/:id
```
**Headers requis :**
```
Authorization: Bearer <token>
```

**Réponse :**
```json
{
  "message": "Utilisateur supprimé avec succès"
}
```

### 6. Rechercher des utilisateurs
```
GET /api/users/search/:query
```
**Headers requis :**
```
Authorization: Bearer <token>
```

**Réponse :**
```json
[
  {
    "id": 1,
    "name": "Jean Dupont",
    "email": "jean@example.com",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
]
```

## 🔒 Sécurité

- **Authentification JWT obligatoire** pour toutes les routes
- **Mots de passe hashés** avec bcrypt (salt rounds: 10)
- **Validation des données** d'entrée
- **Vérification des doublons** d'email
- **Protection contre la suppression** d'utilisateurs avec contrôles techniques associés

## ⚠️ Validations

### Création d'utilisateur
- Tous les champs (name, email, password) sont requis
- L'email doit être unique
- Le mot de passe est automatiquement hashé

### Modification d'utilisateur
- Au moins un champ doit être fourni
- L'email doit être unique (sauf pour l'utilisateur lui-même)
- Le mot de passe est automatiquement hashé si fourni

### Suppression d'utilisateur
- L'utilisateur ne peut pas être supprimé s'il a des contrôles techniques associés
- Vérification de l'existence de l'utilisateur

## 🎯 Utilisation avec FlutterFlow

### Variables Globales à Ajouter
```javascript
usersList = []  // Liste des utilisateurs
```

### Action de Chargement des Utilisateurs
```javascript
const response = await fetch('${apiBaseUrl}/users', {
  headers: {
    'Authorization': 'Bearer ${FFAppState().authToken}'
  }
});

if (response.ok) {
  const data = await response.json();
  FFAppState().update(() {
    FFAppState().usersList = data;
  });
}
```

### Action de Création d'Utilisateur
```javascript
const response = await fetch('${apiBaseUrl}/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${FFAppState().authToken}'
  },
  body: JSON.stringify({
    name: nameController.text,
    email: emailController.text,
    password: passwordController.text
  })
});
```

## 📊 Codes d'Erreur

| Code | Description |
|------|-------------|
| 400 | Données invalides ou email déjà utilisé |
| 401 | Token d'authentification manquant ou invalide |
| 404 | Utilisateur non trouvé |
| 500 | Erreur interne du serveur |

## 🚀 Exemples d'Utilisation

### Avec cURL
```bash
# Récupérer tous les utilisateurs
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/users

# Créer un utilisateur
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"123"}' \
  http://localhost:3000/api/users
```

### Avec JavaScript/Fetch
```javascript
// Récupérer les utilisateurs
const users = await fetch('/api/users', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// Créer un utilisateur
const newUser = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Nouveau',
    email: 'nouveau@example.com',
    password: 'password123'
  })
}).then(r => r.json());
```

---

## ✅ Statut

- ✅ Routes implémentées
- ✅ Authentification sécurisée
- ✅ Validation des données
- ✅ Gestion des erreurs
- ✅ Documentation complète
- ✅ Intégration FlutterFlow prête 