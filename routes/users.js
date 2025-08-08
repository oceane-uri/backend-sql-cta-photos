const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Route pour récupérer tous les utilisateurs (sans les mots de passe)
router.get('/', auth, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, name, email, created_at FROM user ORDER BY created_at DESC'
    );

    res.json(users);

  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Route pour récupérer un utilisateur spécifique
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.execute(
      'SELECT id, name, email, created_at FROM user WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(users[0]);

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Route pour créer un nouvel utilisateur
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation des données
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Tous les champs sont requis: name, email, password' 
      });
    }

    // Vérifier si l'email existe déjà
    const [existingUsers] = await pool.execute(
      'SELECT id FROM user WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        error: 'Un utilisateur avec cet email existe déjà' 
      });
    }

    // Hasher le mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insérer le nouvel utilisateur
    const [result] = await pool.execute(
      'INSERT INTO user (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    // Récupérer l'utilisateur créé (sans le mot de passe)
    const [newUser] = await pool.execute(
      'SELECT id, name, email, created_at FROM user WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: newUser[0]
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Route pour modifier un utilisateur
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const [existingUsers] = await pool.execute(
      'SELECT id FROM user WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Préparer les données à mettre à jour
    let updateFields = [];
    let updateValues = [];

    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (email) {
      // Vérifier si l'email existe déjà pour un autre utilisateur
      const [emailCheck] = await pool.execute(
        'SELECT id FROM user WHERE email = ? AND id != ?',
        [email, id]
      );

      if (emailCheck.length > 0) {
        return res.status(400).json({ 
          error: 'Un autre utilisateur utilise déjà cet email' 
        });
      }

      updateFields.push('email = ?');
      updateValues.push(email);
    }

    if (password) {
      // Hasher le nouveau mot de passe
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ 
        error: 'Aucune donnée à mettre à jour' 
      });
    }

    // Ajouter l'ID à la fin des valeurs
    updateValues.push(id);

    // Mettre à jour l'utilisateur
    await pool.execute(
      `UPDATE user SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Récupérer l'utilisateur mis à jour
    const [updatedUser] = await pool.execute(
      'SELECT id, name, email, created_at FROM user WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Utilisateur mis à jour avec succès',
      user: updatedUser[0]
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Route pour supprimer un utilisateur
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'utilisateur existe
    const [existingUsers] = await pool.execute(
      'SELECT id FROM user WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'utilisateur a des contrôles techniques associés
    const [ctaCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM photo_cta WHERE technicien_name = (SELECT name FROM user WHERE id = ?)',
      [id]
    );

    if (ctaCount[0].count > 0) {
      return res.status(400).json({ 
        error: 'Impossible de supprimer cet utilisateur car il a des contrôles techniques associés' 
      });
    }

    // Supprimer l'utilisateur
    const [result] = await pool.execute(
      'DELETE FROM user WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ message: 'Utilisateur supprimé avec succès' });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Route pour rechercher des utilisateurs par nom ou email
router.get('/search/:query', auth, async (req, res) => {
  try {
    const { query } = req.params;

    const [users] = await pool.execute(
      'SELECT id, name, email, created_at FROM user WHERE name LIKE ? OR email LIKE ? ORDER BY name ASC',
      [`%${query}%`, `%${query}%`]
    );

    res.json(users);

  } catch (error) {
    console.error('Erreur lors de la recherche d\'utilisateurs:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router; 