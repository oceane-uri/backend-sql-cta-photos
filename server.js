const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const os = require('os');

// Charger les variables d'environnement
dotenv.config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Fonction pour détecter l'IP locale
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Ignorer les interfaces IPv6 et les interfaces de loopback
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'IP non détectée';
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cta', require('./routes/cta'));
app.use('/api/users', require('./routes/users'));
// Route photo-cta supprimée car intégrée dans /api/cta

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API CTA Backend - Contrôle Technique Automobile' });
});

// Route pour récupérer l'IP du serveur
app.get('/api/server-info', (req, res) => {
  const localIP = getLocalIP();
  res.json({
    success: true,
    serverIP: localIP,
    port: PORT,
    apiUrl: `http://${localIP}:${PORT}/api`,
    message: 'Informations du serveur'
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

app.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log(`🚀 Serveur démarré sur le port ${PORT} et accessible sur toutes les interfaces`);
  console.log(`📍 IP locale détectée: ${localIP}`);
  console.log(`🌐 URL locale: http://localhost:${PORT}`);
  console.log(`🌐 URL réseau: http://${localIP}:${PORT}`);
  console.log(`📱 Utilisez cette URL dans votre app mobile: http://${localIP}:${PORT}/api`);
}); 