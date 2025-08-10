-- Migration pour ajouter la colonne type_vehicule à la table photo_cta
-- Types de véhicules : CTVL (1 an), CTPL (6 mois), CTTAXI (3 mois)

ALTER TABLE photo_cta 
ADD COLUMN type_vehicule ENUM('CTVL', 'CTPL', 'CTTAXI') NOT NULL DEFAULT 'CTVL' 
COMMENT 'Type de véhicule pour déterminer la validité';

-- Mise à jour des colonnes existantes si nécessaire
UPDATE photo_cta SET type_vehicule = 'CTVL' WHERE type_vehicule IS NULL;

-- Index pour optimiser les requêtes par type de véhicule
CREATE INDEX idx_photo_cta_type_vehicule ON photo_cta(type_vehicule); 