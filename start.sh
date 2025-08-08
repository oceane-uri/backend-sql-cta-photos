#!/bin/bash

echo "🚀 Démarrage de l'API CTA..."

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier si les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Vérifier si le fichier de configuration existe
if [ ! -f "config.env" ]; then
    echo "❌ Le fichier config.env n'existe pas. Veuillez le créer."
    exit 1
fi

# Démarrer le serveur
echo "✅ Démarrage du serveur sur le port 3000..."
npm run dev 