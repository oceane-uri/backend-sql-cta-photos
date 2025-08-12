const express = require('express');
const pool = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Middleware pour vérifier que l'utilisateur est un superviseur
const requireSupervisorRole = (req, res, next) => {
  if (req.user.role !== 'superviseur' && req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Accès non autorisé. Rôle superviseur requis.' 
    });
  }
  next();
};

// Route pour récupérer toutes les fiches en attente de validation
router.get('/fiches-en-attente', auth, requireSupervisorRole, async (req, res) => {
  try {
    console.log('📋 Récupération des fiches en attente pour le superviseur');
    
    const [rows] = await pool.execute(`
      SELECT 
        id,
        immatriculation,
        date_visite,
        centre,
        type_vehicule,
        technicien_name,
        created_at,
        statut_validation,
        latitude,
        longitude,
        adresse
      FROM photo_cta 
      WHERE statut_validation = 'en_attente'
      ORDER BY created_at DESC
    `);

    console.log(`✅ ${rows.length} fiches en attente trouvées`);
    
    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des fiches:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur',
      error: error.message 
    });
  }
});

// Route pour valider une fiche
router.post('/valider-fiche/:id', auth, requireSupervisorRole, async (req, res) => {
  try {
    const { id } = req.params;
    const { commentaires } = req.body;
    const superviseurId = req.user.id;

    console.log(`✅ Validation de la fiche ${id} par le superviseur ${superviseurId}`);

    // Mettre à jour le statut de la fiche
    await pool.execute(`
      UPDATE photo_cta 
      SET 
        statut_validation = 'validée',
        superviseur_id = ?,
        date_validation = NOW(),
        commentaires_superviseur = ?
      WHERE id = ?
    `, [superviseurId, commentaires || null, id]);

    console.log(`✅ Fiche ${id} validée avec succès`);

    res.json({
      success: true,
      message: 'Fiche validée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la validation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur',
      error: error.message 
    });
  }
});

// Route pour rejeter une fiche
router.post('/rejeter-fiche/:id', auth, requireSupervisorRole, async (req, res) => {
  try {
    const { id } = req.params;
    const { commentaires } = req.body;
    const superviseurId = req.user.id;

    if (!commentaires) {
      return res.status(400).json({
        success: false,
        message: 'Les commentaires sont obligatoires pour rejeter une fiche'
      });
    }

    console.log(`❌ Rejet de la fiche ${id} par le superviseur ${superviseurId}`);

    // Mettre à jour le statut de la fiche
    await pool.execute(`
      UPDATE photo_cta 
      SET 
        statut_validation = 'rejetée',
        superviseur_id = ?,
        date_validation = NOW(),
        commentaires_superviseur = ?
      WHERE id = ?
    `, [superviseurId, commentaires, id]);

    console.log(`✅ Fiche ${id} rejetée avec succès`);

    res.json({
      success: true,
      message: 'Fiche rejetée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors du rejet:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur',
      error: error.message 
    });
  }
});

// Route pour récupérer l'historique des validations
router.get('/historique-validations', auth, requireSupervisorRole, async (req, res) => {
  try {
    console.log('📊 Récupération de l\'historique des validations');
    
    const [rows] = await pool.execute(`
      SELECT 
        id,
        immatriculation,
        centre,
        type_vehicule,
        technicien_name,
        statut_validation,
        commentaires_superviseur,
        date_validation,
        created_at
      FROM photo_cta 
      WHERE statut_validation IN ('validée', 'rejetée')
      ORDER BY date_validation DESC
      LIMIT 50
    `);

    console.log(`✅ ${rows.length} validations trouvées dans l'historique`);
    
    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur',
      error: error.message 
    });
  }
});

// Route pour récupérer les statistiques du superviseur
router.get('/statistiques', auth, requireSupervisorRole, async (req, res) => {
  try {
    console.log('📈 Récupération des statistiques du superviseur');
    
    const [stats] = await pool.execute(`
      SELECT 
        statut_validation,
        COUNT(*) as count
      FROM photo_cta 
      GROUP BY statut_validation
    `);

    const statistiques = {
      en_attente: 0,
      validée: 0,
      rejetée: 0
    };

    stats.forEach(stat => {
      statistiques[stat.statut_validation] = stat.count;
    });

    console.log('✅ Statistiques récupérées avec succès');
    
    res.json({
      success: true,
      data: statistiques
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur',
      error: error.message 
    });
  }
});

module.exports = router; 