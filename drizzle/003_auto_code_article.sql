-- =====================================================================
-- VITALUXE - Migration 003 : génération automatique du code article
-- (version corrigée : seuls vitre / alu / accessoire sont automatiques)
--
-- VIT-000001 (vitre) / ALU-000001 (alu) / ACC-000001 (accessoire)
-- service : code à saisir manuellement (aucune règle automatique)
--
-- Ce fichier REMPLACE l'ancienne version de 003_auto_code_article.sql.
-- Il peut être exécuté tel quel, que l'ancienne version ait déjà été
-- lancée ou non (DROP ... IF EXISTS / CREATE OR REPLACE partout).
-- À exécuter sur la base locale ET sur Supabase.
-- =====================================================================

BEGIN;

-- Une séquence par type automatique
CREATE SEQUENCE IF NOT EXISTS seq_code_vitre      START 1;
CREATE SEQUENCE IF NOT EXISTS seq_code_alu        START 1;
CREATE SEQUENCE IF NOT EXISTS seq_code_accessoire START 1;

-- Si l'ancienne version (avec "service") a déjà été exécutée,
-- la séquence devenue inutile est supprimée proprement
DROP SEQUENCE IF EXISTS seq_code_service;

-- Fonction : génère le code selon le type, sauf pour "service"
CREATE OR REPLACE FUNCTION generer_code_article() RETURNS trigger AS $$
DECLARE
    prefixe TEXT;
    numero  BIGINT;
BEGIN
    -- Si un code a déjà été saisi à la main, on ne touche à rien
    IF NEW.code IS NOT NULL AND NEW.code <> '' THEN
        RETURN NEW;
    END IF;

    CASE NEW.type
        WHEN 'vitre' THEN
            prefixe := 'VIT';
            numero  := nextval('seq_code_vitre');
        WHEN 'alu' THEN
            prefixe := 'ALU';
            numero  := nextval('seq_code_alu');
        WHEN 'accessoire' THEN
            prefixe := 'ACC';
            numero  := nextval('seq_code_accessoire');
        ELSE
            -- "service" (ou tout futur type non prévu) : pas de règle
            -- automatique, le code doit être saisi à la main.
            RAISE EXCEPTION
                'Le code article doit être saisi manuellement pour le type "%"',
                NEW.type;
    END CASE;

    NEW.code := prefixe || '-' || lpad(numero::text, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréation propre du trigger (fonctionne même s'il existait déjà)
DROP TRIGGER IF EXISTS trg_generer_code_article ON article;

CREATE TRIGGER trg_generer_code_article
    BEFORE INSERT ON article
    FOR EACH ROW EXECUTE FUNCTION generer_code_article();

COMMIT;

-- =====================================================================
-- ROLLBACK (à exécuter séparément)
-- =====================================================================
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_generer_code_article ON article;
-- DROP FUNCTION IF EXISTS generer_code_article();
-- DROP SEQUENCE IF EXISTS seq_code_vitre;
-- DROP SEQUENCE IF EXISTS seq_code_alu;
-- DROP SEQUENCE IF EXISTS seq_code_accessoire;
-- COMMIT;