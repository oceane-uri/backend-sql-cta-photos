const express = require('express');
const pool = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Créer la table photo_cta si elle n'existe pas
const createPhotoCTATable = async () => {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS photo_cta (
        id INT AUTO_INCREMENT PRIMARY KEY,
        immatriculation VARCHAR(20) NOT NULL,
        date_visite DATE NOT NULL,
        date_validite DATE NOT NULL,
        centre VARCHAR(100) NOT NULL,
        technicien_name VARCHAR(100) NOT NULL,
        photo_base64 LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    await pool.execute(createTableQuery);
    console.log('Table photo_cta créée ou déjà existante');
  } catch (error) {
    console.error('Erreur lors de la création de la table photo_cta:', error);
  }
};

// Initialiser la table au démarrage
createPhotoCTATable();

// Route pour ajouter un nouveau contrôle technique avec photo
router.post('/photo', auth, async (req, res) => {
  try {
    const { 
      immatriculation, 
      date_visite, 
      date_validite, 
      centre, 
      technicien_name, 
      photo_base64 
    } = req.body;

    // Validation des données
    if (!immatriculation || !date_visite || !date_validite || !centre || !technicien_name || !photo_base64) {
      return res.status(400).json({ 
        error: 'Tous les champs sont requis: immatriculation, date_visite, date_validite, centre, technicien_name, photo_base64' 
      });
    }

    // Insérer les données
    const [result] = await pool.execute(
      `INSERT INTO photo_cta 
       (immatriculation, date_visite, date_validite, centre, technicien_name, photo_base64) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [immatriculation, date_visite, date_validite, centre, technicien_name, photo_base64]
    );

    res.status(201).json({
      message: 'Contrôle technique enregistré avec succès',
      id: result.insertId
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout du contrôle technique:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Route pour récupérer tous les contrôles techniques
router.get('/photos', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, immatriculation, date_visite, date_validite, centre, technicien_name, created_at FROM photo_cta ORDER BY created_at DESC'
    );

    res.json(rows);

  } catch (error) {
    console.error('Erreur lors de la récupération des contrôles techniques:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Route pour récupérer un contrôle technique spécifique avec photo
router.get('/photo/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      'SELECT * FROM photo_cta WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Contrôle technique non trouvé' });
    }

    res.json(rows[0]);

  } catch (error) {
    console.error('Erreur lors de la récupération du contrôle technique:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Route pour rechercher par immatriculation
router.get('/search/:immatriculation', auth, async (req, res) => {
  try {
    const { immatriculation } = req.params;

    const [rows] = await pool.execute(
      'SELECT id, immatriculation, date_visite, date_validite, centre, technicien_name, created_at FROM photo_cta WHERE immatriculation LIKE ? ORDER BY created_at DESC',
      [`%${immatriculation}%`]
    );

    res.json(rows);

  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Route pour mettre à jour un contrôle technique
router.put('/photo/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      immatriculation, 
      date_visite, 
      date_validite, 
      centre, 
      technicien_name, 
      photo_base64 
    } = req.body;

    // Vérifier si l'enregistrement existe
    const [existing] = await pool.execute(
      'SELECT id FROM photo_cta WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Contrôle technique non trouvé' });
    }

    // Mettre à jour
    await pool.execute(
      `UPDATE photo_cta 
       SET immatriculation = ?, date_visite = ?, date_validite = ?, 
           centre = ?, technicien_name = ?, photo_base64 = ?
       WHERE id = ?`,
      [immatriculation, date_visite, date_validite, centre, technicien_name, photo_base64, id]
    );

    res.json({ message: 'Contrôle technique mis à jour avec succès' });

  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Route pour supprimer un contrôle technique
router.delete('/photo/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM photo_cta WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Contrôle technique non trouvé' });
    }

    res.json({ message: 'Contrôle technique supprimé avec succès' });

  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router; 