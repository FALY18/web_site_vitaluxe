-- Chosen payment method, not an actual receipt. Reuse the existing PostgreSQL enum.
-- Nullable so historical sales/invoices are not assigned an invented payment method.
ALTER TABLE vente ADD COLUMN IF NOT EXISTS mode_paiement mode_paiement;
ALTER TABLE facture ADD COLUMN IF NOT EXISTS mode_paiement mode_paiement;
