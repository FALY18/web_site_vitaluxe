-- =====================================================================
-- VITALUXE - Migration 004 : numérotation automatique Vente et Facture
-- Vente.numero  : entier, démarre à 1147 (dernier bon papier connu : 1146)
-- Facture.numero : texte, format FAC-000001
-- À exécuter après 003_auto_code_article.sql (local ET Supabase)
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- Vente : numéro entier séquentiel
-- ---------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS seq_numero_vente START WITH 1147;

CREATE OR REPLACE FUNCTION generer_numero_vente() RETURNS trigger AS $$
BEGIN
    IF NEW.numero IS NULL OR NEW.numero = 0 THEN
        NEW.numero := nextval('seq_numero_vente');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generer_numero_vente
    BEFORE INSERT ON vente
    FOR EACH ROW EXECUTE FUNCTION generer_numero_vente();

-- ---------------------------------------------------------------------
-- Facture : numéro texte FAC-000001
-- ---------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS seq_numero_facture START WITH 1;

CREATE OR REPLACE FUNCTION generer_numero_facture() RETURNS trigger AS $$
BEGIN
    IF NEW.numero IS NULL OR NEW.numero = '' THEN
        NEW.numero := 'FAC-' || lpad(nextval('seq_numero_facture')::text, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generer_numero_facture
    BEFORE INSERT ON facture
    FOR EACH ROW EXECUTE FUNCTION generer_numero_facture();

-- ---------------------------------------------------------------------
-- Parametre_Societe : les compteurs manuels ne servent plus
-- ---------------------------------------------------------------------
ALTER TABLE parametre_societe DROP COLUMN IF EXISTS prochain_numero_vente;
ALTER TABLE parametre_societe DROP COLUMN IF EXISTS prochain_numero_facture;

COMMIT;

-- =====================================================================
-- Si des ventes ou factures existent déjà (base non vide) :
-- resynchroniser les séquences pour éviter un doublon de numéro.
-- À exécuter une seule fois, APRÈS le bloc ci-dessus, uniquement si
-- des lignes existent déjà dans vente / facture.
-- =====================================================================
-- SELECT setval('seq_numero_vente',
--     (SELECT COALESCE(MAX(numero), 1146) FROM vente));
--
-- SELECT setval('seq_numero_facture',
--     (SELECT COALESCE(MAX(substring(numero FROM 5)::int), 0) FROM facture));

-- =====================================================================
-- ROLLBACK (à exécuter séparément)
-- =====================================================================
-- BEGIN;
-- ALTER TABLE parametre_societe ADD COLUMN prochain_numero_vente INTEGER NOT NULL DEFAULT 1147;
-- ALTER TABLE parametre_societe ADD COLUMN prochain_numero_facture INTEGER NOT NULL DEFAULT 1;
-- DROP TRIGGER IF EXISTS trg_generer_numero_facture ON facture;
-- DROP FUNCTION IF EXISTS generer_numero_facture();
-- DROP SEQUENCE IF EXISTS seq_numero_facture;
-- DROP TRIGGER IF EXISTS trg_generer_numero_vente ON vente;
-- DROP FUNCTION IF EXISTS generer_numero_vente();
-- DROP SEQUENCE IF EXISTS seq_numero_vente;
-- COMMIT;