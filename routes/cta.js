const express = require('express');
const pool = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Types de véhicules et leurs durées de validité (en mois)
const VEHICLE_TYPES = {
  'CTVL': 12,    // 1 an
  'CTPL': 6,     // 6 mois
  'CTTAXI': 3    // 3 mois
};

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
        type_vehicule ENUM('CTVL', 'CTPL', 'CTTAXI') NOT NULL DEFAULT 'CTVL',
        photo_base64 LONGTEXT NOT NULL,
        cta_id INT,
        technicien_name VARCHAR(100) NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        adresse VARCHAR(255),
        timestamp_photo DATETIME,
        fiche_controle_pdf LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_photo_cta_type_vehicule (type_vehicule),
        INDEX idx_photo_cta_cta_id (cta_id)
      )
    `;
    
    await pool.execute(createTableQuery);
    console.log('Table photo_cta créée ou déjà existante');
    
    // Ajouter la colonne type_vehicule si elle n'existe pas
    try {
      await pool.execute('ALTER TABLE photo_cta ADD COLUMN type_vehicule ENUM("CTVL", "CTPL", "CTTAXI") NOT NULL DEFAULT "CTVL"');
      console.log('Colonne type_vehicule ajoutée');
    } catch (error) {
      // La colonne existe déjà
      console.log('Colonne type_vehicule déjà présente');
    }
    
    // Ajouter la colonne cta_id si elle n'existe pas
    try {
      await pool.execute('ALTER TABLE photo_cta ADD COLUMN cta_id INT');
      console.log('Colonne cta_id ajoutée');
    } catch (error) {
      // La colonne existe déjà
      console.log('Colonne cta_id déjà présente');
    }
    
    // Ajouter la colonne technicien_name si elle n'existe pas
    try {
      await pool.execute('ALTER TABLE photo_cta ADD COLUMN technicien_name VARCHAR(100) NOT NULL DEFAULT "Technicien"');
      console.log('Colonne technicien_name ajoutée');
    } catch (error) {
      // La colonne existe déjà
      console.log('Colonne technicien_name déjà présente');
    }
    
    // Ajouter la colonne latitude si elle n'existe pas
    try {
      await pool.execute('ALTER TABLE photo_cta ADD COLUMN latitude DECIMAL(10, 8)');
      console.log('Colonne latitude ajoutée');
    } catch (error) {
      // La colonne existe déjà
      console.log('Colonne latitude déjà présente');
    }
    
    // Ajouter la colonne longitude si elle n'existe pas
    try {
      await pool.execute('ALTER TABLE photo_cta ADD COLUMN longitude DECIMAL(11, 8)');
      console.log('Colonne longitude ajoutée');
    } catch (error) {
      // La colonne existe déjà
      console.log('Colonne longitude déjà présente');
    }
    
    // Ajouter la colonne adresse si elle n'existe pas
    try {
      await pool.execute('ALTER TABLE photo_cta ADD COLUMN adresse VARCHAR(255)');
      console.log('Colonne adresse ajoutée');
    } catch (error) {
      // La colonne existe déjà
      console.log('Colonne adresse déjà présente');
    }
    
    // Ajouter la colonne timestamp_photo si elle n'existe pas
    try {
      await pool.execute('ALTER TABLE photo_cta ADD COLUMN timestamp_photo DATETIME');
      console.log('Colonne timestamp_photo ajoutée');
    } catch (error) {
      // La colonne existe déjà
      console.log('Colonne timestamp_photo déjà présente');
    }
    
    // Ajouter la colonne fiche_controle_pdf si elle n'existe pas
    try {
      await pool.execute('ALTER TABLE photo_cta ADD COLUMN fiche_controle_pdf LONGTEXT');
      console.log('Colonne fiche_controle_pdf ajoutée');
    } catch (error) {
      // La colonne existe déjà
      console.log('Colonne fiche_controle_pdf déjà présente');
    }
    
  } catch (error) {
    console.error('Erreur lors de la création/mise à jour de la table photo_cta:', error);
  }
};

// Calculer la date de validité basée sur le type de véhicule
const calculateValidityDate = (vehicleType, visitDate) => {
  const months = VEHICLE_TYPES[vehicleType] || 12;
  const visit = new Date(visitDate);
  const validity = new Date(visit);
  validity.setMonth(validity.getMonth() + months);
  return validity.toISOString().split('T')[0];
};

// Initialiser la table au démarrage
createPhotoCTATable();

// Route temporaire pour créer un CTA de test
router.post('/create-test-cta', async (req, res) => {
  try {
    // Créer la table cta si elle n'existe pas
    const createCTATableQuery = `
      CREATE TABLE IF NOT EXISTS cta (
        id INT AUTO_INCREMENT PRIMARY KEY,
        immatriculation VARCHAR(20) NOT NULL,
        date_visite DATE NOT NULL,
        centre VARCHAR(100) NOT NULL,
        technicien_name VARCHAR(100) DEFAULT 'Technicien Test',
        date_validite DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await pool.execute(createCTATableQuery);
    
    // Insérer un CTA de test
    const insertQuery = `
      INSERT INTO cta (immatriculation, date_visite, centre, date_validite) 
      VALUES (?, CURDATE(), ?, DATE_ADD(CURDATE(), INTERVAL 12 MONTH))
    `;
    
    const [result] = await pool.execute(insertQuery, ['TEST-123-AB', 'EKPE']);
    
    res.json({
      success: true,
      message: 'CTA de test créé',
      ctaId: result.insertId
    });
    
  } catch (error) {
    console.error('Erreur lors de la création du CTA de test:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du CTA de test',
      error: error.message
    });
  }
});

// Route pour ajouter un nouveau contrôle technique avec photo
router.post('/photo', auth, async (req, res) => {
  try {
          console.log('📸 Données reçues');
    const { 
      immatriculation, 
      date_visite, 
      centre, 
      type_vehicule = 'CTVL',
      photo_base64,
      cta_id,
      latitude,
      longitude,
      adresse,
      timestamp_photo,
      fiche_controle_pdf
    } = req.body;

    // Récupérer le nom du technicien depuis le token JWT
    const technicien_name = req.user ? req.user.name || req.user.username || 'Technicien' : 'Technicien';

    // Validation des données
    if (!immatriculation || !date_visite || !centre || !photo_base64) {
      return res.status(400).json({ 
        success: false,
        message: 'Tous les champs sont requis: immatriculation, date_visite, centre, photo_base64' 
      });
    }

    // Validation du type de véhicule
    if (!VEHICLE_TYPES[type_vehicule]) {
      return res.status(400).json({
        success: false,
        message: 'Type de véhicule invalide. Types acceptés: CTVL, CTPL, CTTAXI'
      });
    }

    // Calcul automatique de la date de validité
    const date_validite = calculateValidityDate(type_vehicule, date_visite);

    // Convertir undefined en null pour MySQL
    const latitudeValue = latitude || null;
    const longitudeValue = longitude || null;
    const adresseValue = adresse || null;
    const ficheControlePdfValue = fiche_controle_pdf || null;

    console.log('🔧 Valeurs converties pour MySQL');

    // Insérer les données
    const [result] = await pool.execute(
      `INSERT INTO photo_cta 
       (immatriculation, date_visite, date_validite, centre, type_vehicule, photo_base64, cta_id, technicien_name, latitude, longitude, adresse, timestamp_photo, fiche_controle_pdf) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [immatriculation, date_visite, date_validite, centre, type_vehicule, photo_base64, cta_id, technicien_name, latitudeValue, longitudeValue, adresseValue, timestamp_photo, ficheControlePdfValue]
    );

    res.status(201).json({
      success: true,
      message: 'Contrôle technique enregistré avec succès',
      data: {
        id: result.insertId,
        immatriculation,
        date_visite,
        date_validite,
        centre,
        type_vehicule,
        cta_id,
        latitude,
        longitude,
        adresse,
        timestamp_photo,
        fiche_controle_pdf
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout du contrôle technique:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
});

// Route pour récupérer tous les contrôles techniques
router.get('/photos', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, immatriculation, date_visite, date_validite, centre, type_vehicule, cta_id, created_at, fiche_controle_pdf 
       FROM photo_cta 
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des contrôles techniques:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
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
      return res.status(404).json({ 
        success: false,
        message: 'Contrôle technique non trouvé' 
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du contrôle technique:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
});

// Route pour récupérer toutes les photos d'un CTA spécifique
router.get('/photos/cta/:ctaId', auth, async (req, res) => {
  try {
    const { ctaId } = req.params;

    const [rows] = await pool.execute(
      `SELECT id, immatriculation, date_visite, date_validite, centre, type_vehicule, cta_id, created_at, fiche_controle_pdf 
       FROM photo_cta 
       WHERE cta_id = ? 
       ORDER BY created_at DESC`,
      [ctaId]
    );

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des photos du CTA:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
});

// Route pour rechercher par immatriculation
router.get('/search/:immatriculation', auth, async (req, res) => {
  try {
    const { immatriculation } = req.params;

    const [rows] = await pool.execute(
      `SELECT id, immatriculation, date_visite, date_validite, centre, type_vehicule, cta_id, created_at, fiche_controle_pdf 
       FROM photo_cta 
       WHERE immatriculation LIKE ? 
       ORDER BY created_at DESC`,
      [`%${immatriculation}%`]
    );

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
});

// Route pour mettre à jour un contrôle technique
router.put('/photo/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      immatriculation, 
      date_visite, 
      centre, 
      type_vehicule,
      photo_base64,
      cta_id,
      fiche_controle_pdf
    } = req.body;

    // Vérifier si l'enregistrement existe
    const [existing] = await pool.execute(
      'SELECT id FROM photo_cta WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Contrôle technique non trouvé' 
      });
    }

    // Validation du type de véhicule si fourni
    if (type_vehicule && !VEHICLE_TYPES[type_vehicule]) {
      return res.status(400).json({
        success: false,
        message: 'Type de véhicule invalide. Types acceptés: CTVL, CTPL, CTTAXI'
      });
    }

    // Calculer la nouvelle date de validité si le type ou la date de visite change
    let date_validite = null;
    if (type_vehicule && date_visite) {
      date_validite = calculateValidityDate(type_vehicule, date_visite);
    }

    // Construire la requête de mise à jour dynamiquement
    let updateQuery = 'UPDATE photo_cta SET ';
    let updateValues = [];
    let updateFields = [];

    if (immatriculation) {
      updateFields.push('immatriculation = ?');
      updateValues.push(immatriculation);
    }
    if (date_visite) {
      updateFields.push('date_visite = ?');
      updateValues.push(date_visite);
    }
    if (date_validite) {
      updateFields.push('date_validite = ?');
      updateValues.push(date_validite);
    }
    if (centre) {
      updateFields.push('centre = ?');
      updateValues.push(centre);
    }
    if (type_vehicule) {
      updateFields.push('type_vehicule = ?');
      updateValues.push(type_vehicule);
    }
    if (photo_base64) {
      updateFields.push('photo_base64 = ?');
      updateValues.push(photo_base64);
    }
    if (cta_id !== undefined) {
      updateFields.push('cta_id = ?');
      updateValues.push(cta_id);
    }
    if (fiche_controle_pdf !== undefined) {
      updateFields.push('fiche_controle_pdf = ?');
      updateValues.push(fiche_controle_pdf);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun champ à mettre à jour'
      });
    }

    updateQuery += updateFields.join(', ') + ' WHERE id = ?';
    updateValues.push(id);

    await pool.execute(updateQuery, updateValues);

    res.json({ 
      success: true,
      message: 'Contrôle technique mis à jour avec succès' 
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
});

// Route pour supprimer un contrôle technique
router.delete('/photo/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si la photo existe
    const [checkRows] = await pool.execute('SELECT id FROM photo_cta WHERE id = ?', [id]);

    if (checkRows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Contrôle technique non trouvé' 
      });
    }

    const [result] = await pool.execute(
      'DELETE FROM photo_cta WHERE id = ?',
      [id]
    );

    res.json({ 
      success: true,
      message: 'Contrôle technique supprimé avec succès' 
    });

  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
});

// Route pour les statistiques générales
router.get('/stats/overview', auth, async (req, res) => {
  try {
    // Total des photos
    const totalQuery = 'SELECT COUNT(*) as total FROM photo_cta';
    const [totalRows] = await pool.execute(totalQuery);

    // Photos par type de véhicule
    const vehicleTypeQuery = `
      SELECT type_vehicule, COUNT(*) as count 
      FROM photo_cta 
      GROUP BY type_vehicule
    `;
    const [vehicleTypeRows] = await pool.execute(vehicleTypeQuery);

    // Photos par centre
    const centerQuery = `
      SELECT centre, COUNT(*) as count 
      FROM photo_cta 
      GROUP BY centre
    `;
    const [centerRows] = await pool.execute(centerQuery);

    // Photos récentes (7 derniers jours)
    const recentQuery = `
      SELECT COUNT(*) as count 
      FROM photo_cta 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `;
    const [recentRows] = await pool.execute(recentQuery);

    res.json({
      success: true,
      data: {
        total: totalRows[0].total,
        byVehicleType: vehicleTypeRows,
        byCenter: centerRows,
        recentWeek: recentRows[0].count
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
});

module.exports = router; 