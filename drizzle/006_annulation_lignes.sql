-- Apply after 005_remise_livraison_facture.sql, before deploying the sale changes.
-- Soft deletion preserves immutable mouvement_stock references and the audit trail.
ALTER TABLE ligne_vente ADD COLUMN IF NOT EXISTS annulee boolean NOT NULL DEFAULT false;
