# Intégration FlutterFlow - API CTA

## Configuration dans FlutterFlow

### 1. Variables Globales
Ajoutez ces variables dans FlutterFlow :
- `apiBaseUrl` (String): `http://localhost:3000/api` (ou votre URL de production)
- `authToken` (String): Pour stocker le token JWT
- `ctaList` (List): Liste des contrôles techniques
- `searchResults` (List): Résultats de recherche
- `usersList` (List): Liste des utilisateurs
- `currentUser` (Map): Informations utilisateur connecté

### 2. Page de Connexion

#### Action de Connexion
```javascript
// Dans l'action "Login" de FlutterFlow
const response = await fetch('${apiBaseUrl}/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: loginEmailController.text,
    password: loginPasswordController.text
  })
});

const data = await response.json();

if (response.ok) {
  // Stocker le token
  FFAppState().update(() {
    FFAppState().authToken = data.token;
  });
  
  // Naviguer vers la page principale
  context.pushNamed('HomePage');
} else {
  // Afficher l'erreur
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(data.error))
  );
}
```

### 3. Page d'Ajout de Contrôle Technique

#### Action d'Ajout
```javascript
// Dans l'action "AddCTA" de FlutterFlow
const response = await fetch('${apiBaseUrl}/cta/photo', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${FFAppState().authToken}'
  },
  body: JSON.stringify({
    immatriculation: immatriculationController.text,
    date_visite: dateVisiteController.text,
    date_validite: dateValiditeController.text,
    centre: centreController.text,
    technicien_name: technicienController.text,
    photo_base64: selectedImageBase64
  })
});

const data = await response.json();

if (response.ok) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('Contrôle technique ajouté avec succès'))
  );
  context.pop();
} else {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(data.error))
  );
}
```

### 4. Page de Liste des Contrôles

#### Action de Chargement
```javascript
// Dans l'action "LoadCTAs" de FlutterFlow
const response = await fetch('${apiBaseUrl}/cta/photos', {
  headers: {
    'Authorization': 'Bearer ${FFAppState().authToken}'
  }
});

const data = await response.json();

if (response.ok) {
  // Mettre à jour la liste
  FFAppState().update(() {
    FFAppState().ctaList = data;
  });
} else {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('Erreur de chargement'))
  );
}
```

### 5. Page de Recherche

#### Action de Recherche
```javascript
// Dans l'action "SearchCTA" de FlutterFlow
const response = await fetch('${apiBaseUrl}/cta/search/${searchController.text}', {
  headers: {
    'Authorization': 'Bearer ${FFAppState().authToken}'
  }
});

const data = await response.json();

if (response.ok) {
  FFAppState().update(() {
    FFAppState().searchResults = data;
  });
} else {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('Erreur de recherche'))
  );
}
```

### 6. Page de Gestion des Utilisateurs

#### Action de Chargement des Utilisateurs
```javascript
// Dans l'action "LoadUsers" de FlutterFlow
const response = await fetch('${apiBaseUrl}/users', {
  headers: {
    'Authorization': 'Bearer ${FFAppState().authToken}'
  }
});

const data = await response.json();

if (response.ok) {
  FFAppState().update(() {
    FFAppState().usersList = data;
  });
} else {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('Erreur de chargement des utilisateurs'))
  );
}
```

#### Action de Création d'Utilisateur
```javascript
// Dans l'action "CreateUser" de FlutterFlow
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

const data = await response.json();

if (response.ok) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('Utilisateur créé avec succès'))
  );
  context.pop();
} else {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(data.error))
  );
}
```

## Structure des Données FlutterFlow

### Modèle CTA
```json
{
  "id": "number",
  "immatriculation": "string",
  "date_visite": "string (YYYY-MM-DD)",
  "date_validite": "string (YYYY-MM-DD)",
  "centre": "string",
  "technicien_name": "string",
  "created_at": "string"
}
```

### Modèle User
```json
{
  "id": "number",
  "name": "string",
  "email": "string"
}
```

## Gestion des Images

### Conversion Image vers Base64
```javascript
// Dans FlutterFlow, utilisez cette action pour convertir une image
import 'dart:convert';
import 'dart:typed_data';

// Après avoir sélectionné une image
final bytes = await imageFile.readAsBytes();
final base64String = base64Encode(bytes);
final dataUrl = 'data:image/jpeg;base64,$base64String';

// Utilisez dataUrl comme photo_base64
```

## Gestion des Erreurs

### Vérification du Token
```javascript
// Action pour vérifier si le token est valide
const response = await fetch('${apiBaseUrl}/auth/verify', {
  headers: {
    'Authorization': 'Bearer ${FFAppState().authToken}'
  }
});

if (!response.ok) {
  // Token invalide, rediriger vers la page de connexion
  FFAppState().update(() {
    FFAppState().authToken = '';
  });
  context.pushNamed('LoginPage');
}
```

## Exemple de Workflow Complet

1. **Démarrage** → Vérifier le token
2. **Connexion** → Stocker le token
3. **Accueil** → Charger la liste des CTA
4. **Ajout** → Prendre photo + saisir données
5. **Recherche** → Filtrer par immatriculation
6. **Détails** → Afficher photo complète

## Conseils d'Implémentation

- Utilisez des variables globales pour le token et l'URL de l'API
- Gérez les erreurs réseau avec des try/catch
- Affichez des indicateurs de chargement pendant les requêtes
- Validez les données côté client avant envoi
- Utilisez des images compressées pour réduire la taille des données 