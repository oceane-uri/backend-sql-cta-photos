const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 3000;

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

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur démarré sur le port ${PORT} et accessible sur toutes les interfaces`);
  console.log(`URL locale: http://localhost:${PORT}`);
  console.log(`URL réseau: http://192.168.100.32:${PORT}`);
}); 