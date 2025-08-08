#!/bin/bash

echo "🚀 Démarrage sécurisé du Backend CTA..."

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

# Vérifier et libérer le port 3000 si nécessaire
PORT=3000
if lsof -ti:$PORT > /dev/null 2>&1; then
    echo "⚠️ Le port $PORT est utilisé. Libération en cours..."
    lsof -ti:$PORT | xargs kill -9
    sleep 2
    echo "✅ Port $PORT libéré"
fi

# Démarrer le serveur
echo "✅ Démarrage du serveur sur le port $PORT..."
echo "🌐 API disponible sur: http://localhost:$PORT/api"
echo "📚 Documentation: http://localhost:$PORT"
echo ""
echo "Pour arrêter le serveur: Ctrl+C"
echo ""

npm run dev 