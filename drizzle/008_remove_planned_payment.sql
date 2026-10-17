-- Remove the planned-method fields introduced by migration 007.
-- Actual receipts and the existing mode_paiement enum are preserved.
ALTER TABLE vente DROP COLUMN IF EXISTS mode_paiement;
ALTER TABLE facture DROP COLUMN IF EXISTS mode_paiement;
