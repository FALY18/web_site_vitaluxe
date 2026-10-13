BEGIN;

DO $$ BEGIN
    CREATE TYPE mode_remise AS ENUM ('pourcentage', 'montant');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE vente
  ADD COLUMN mode_remise mode_remise NOT NULL DEFAULT 'pourcentage',
  ADD COLUMN valeur_remise NUMERIC(14, 2) NOT NULL DEFAULT 0,
  ADD COLUMN frais_livraison NUMERIC(14, 2) NOT NULL DEFAULT 0;

ALTER TABLE facture
  ADD COLUMN caissier_id INTEGER REFERENCES utilisateur(id),
  ADD COLUMN sous_total_ht NUMERIC(14, 2) NOT NULL DEFAULT 0,
  ADD COLUMN mode_remise mode_remise NOT NULL DEFAULT 'pourcentage',
  ADD COLUMN valeur_remise NUMERIC(14, 2) NOT NULL DEFAULT 0,
  ADD COLUMN montant_remise NUMERIC(14, 2) NOT NULL DEFAULT 0,
  ADD COLUMN frais_livraison NUMERIC(14, 2) NOT NULL DEFAULT 0;

-- Les anciennes factures n'avaient pas de ligne de remise/livraison.
UPDATE facture SET sous_total_ht = total_ht;

ALTER TABLE vente
  ADD CONSTRAINT ck_vente_remise_valeur CHECK (
    valeur_remise >= 0 AND (mode_remise <> 'pourcentage' OR valeur_remise <= 100)
  ),
  ADD CONSTRAINT ck_vente_frais_livraison CHECK (frais_livraison >= 0);

ALTER TABLE facture
  ADD CONSTRAINT ck_facture_montants_commerciaux CHECK (
    sous_total_ht >= 0 AND valeur_remise >= 0 AND montant_remise >= 0 AND frais_livraison >= 0
    AND (mode_remise <> 'pourcentage' OR valeur_remise <= 100)
  );

COMMIT;
