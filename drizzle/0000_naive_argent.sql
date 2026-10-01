CREATE TYPE "public"."mode_ligne" AS ENUM('decoupe', 'plateau_entier', 'plateau_gros', 'barre', 'pack', 'standard');--> statement-breakpoint
CREATE TYPE "public"."mode_paiement" AS ENUM('especes', 'mobile_money', 'virement', 'cheque');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('commercial', 'depot', 'admin');--> statement-breakpoint
CREATE TYPE "public"."statut_facture" AS ENUM('brouillon', 'emise', 'partielle', 'payee', 'annulee');--> statement-breakpoint
CREATE TYPE "public"."statut_plateau" AS ENUM('disponible', 'epuise', 'vendu_entier');--> statement-breakpoint
CREATE TYPE "public"."statut_vente" AS ENUM('brouillon', 'confirmee', 'livree', 'annulee');--> statement-breakpoint
CREATE TYPE "public"."type_article" AS ENUM('vitre', 'alu', 'accessoire', 'service');--> statement-breakpoint
CREATE TYPE "public"."type_mouvement" AS ENUM('reception', 'vente', 'annulation', 'ajustement');--> statement-breakpoint
CREATE TYPE "public"."unite_vente" AS ENUM('m2', 'barre', 'unite', 'forfait', 'heure');--> statement-breakpoint
CREATE TABLE "article" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(30) NOT NULL,
	"designation" varchar(200) NOT NULL,
	"categorie_id" integer NOT NULL,
	"type" "type_article" NOT NULL,
	"couleur" varchar(50),
	"unite_vente" "unite_vente" NOT NULL,
	"prix_vente" numeric(14, 2) NOT NULL,
	CONSTRAINT "ck_article_prix" CHECK ("article"."prix_vente" >= 0)
);
--> statement-breakpoint
CREATE TABLE "article_alu_detail" (
	"article_id" integer PRIMARY KEY NOT NULL,
	"prix_pack" numeric(14, 2) NOT NULL,
	"nombre_par_pack" integer NOT NULL,
	"stock_barres" integer DEFAULT 0 NOT NULL,
	"emplacement" varchar(30),
	CONSTRAINT "ck_alu_prix_pack" CHECK ("article_alu_detail"."prix_pack" >= 0),
	CONSTRAINT "ck_alu_nombre_pack" CHECK ("article_alu_detail"."nombre_par_pack" > 0),
	CONSTRAINT "ck_alu_stock" CHECK ("article_alu_detail"."stock_barres" >= 0)
);
--> statement-breakpoint
CREATE TABLE "article_vitre_detail" (
	"article_id" integer PRIMARY KEY NOT NULL,
	"epaisseur_mm" numeric(5, 1) NOT NULL,
	"prix_plateau_entier" numeric(14, 2) NOT NULL,
	"prix_plateau_gros" numeric(14, 2),
	CONSTRAINT "ck_vitre_epaisseur" CHECK ("article_vitre_detail"."epaisseur_mm" > 0),
	CONSTRAINT "ck_vitre_prix_entier" CHECK ("article_vitre_detail"."prix_plateau_entier" >= 0),
	CONSTRAINT "ck_vitre_prix_gros" CHECK ("article_vitre_detail"."prix_plateau_gros" IS NULL OR "article_vitre_detail"."prix_plateau_gros" >= 0)
);
--> statement-breakpoint
CREATE TABLE "categorie" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(150) NOT NULL,
	"telephone" varchar(30),
	"adresse" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "facture" (
	"id" serial PRIMARY KEY NOT NULL,
	"numero" varchar(20) NOT NULL,
	"vente_id" integer NOT NULL,
	"date_emission" date DEFAULT now() NOT NULL,
	"total_ht" numeric(14, 2) NOT NULL,
	"montant_tva" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total_ttc" numeric(14, 2) NOT NULL,
	"statut" "statut_facture" DEFAULT 'brouillon' NOT NULL,
	CONSTRAINT "ck_facture_montants" CHECK ("facture"."total_ht" >= 0 AND "facture"."montant_tva" >= 0 AND "facture"."total_ttc" >= 0)
);
--> statement-breakpoint
CREATE TABLE "ligne_vente" (
	"id" serial PRIMARY KEY NOT NULL,
	"vente_id" integer NOT NULL,
	"article_id" integer NOT NULL,
	"plateau_id" integer,
	"mode" "mode_ligne" NOT NULL,
	"nombre" integer NOT NULL,
	"longueur_m" numeric(6, 3),
	"hauteur_m" numeric(6, 3),
	"quantite_facturee" numeric(10, 2) NOT NULL,
	"prix_applique" numeric(14, 2) NOT NULL,
	"montant" numeric(14, 2) NOT NULL,
	"surface_restante_apres" numeric(10, 2),
	"longueur_controlee_m" numeric(6, 3),
	"hauteur_controlee_m" numeric(6, 3),
	"nombre_controle" integer,
	CONSTRAINT "ck_ligne_nombre" CHECK ("ligne_vente"."nombre" > 0),
	CONSTRAINT "ck_ligne_longueur" CHECK ("ligne_vente"."longueur_m" IS NULL OR "ligne_vente"."longueur_m" > 0),
	CONSTRAINT "ck_ligne_hauteur" CHECK ("ligne_vente"."hauteur_m" IS NULL OR "ligne_vente"."hauteur_m" > 0),
	CONSTRAINT "ck_ligne_quantite" CHECK ("ligne_vente"."quantite_facturee" >= 0),
	CONSTRAINT "ck_ligne_prix" CHECK ("ligne_vente"."prix_applique" >= 0),
	CONSTRAINT "ck_ligne_montant" CHECK ("ligne_vente"."montant" >= 0),
	CONSTRAINT "ck_ligne_surface_apres" CHECK ("ligne_vente"."surface_restante_apres" IS NULL OR "ligne_vente"."surface_restante_apres" >= 0),
	CONSTRAINT "ck_ligne_nombre_controle" CHECK ("ligne_vente"."nombre_controle" IS NULL OR "ligne_vente"."nombre_controle" >= 0),
	CONSTRAINT "ck_ligne_plateau_entier" CHECK ("ligne_vente"."mode" NOT IN ('plateau_entier', 'plateau_gros')
        OR ("ligne_vente"."nombre" = 1 AND "ligne_vente"."plateau_id" IS NOT NULL)),
	CONSTRAINT "ck_ligne_decoupe" CHECK ("ligne_vente"."mode" <> 'decoupe'
        OR ("ligne_vente"."plateau_id" IS NOT NULL
            AND "ligne_vente"."longueur_m" IS NOT NULL
            AND "ligne_vente"."hauteur_m" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "mouvement_stock" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer NOT NULL,
	"plateau_id" integer,
	"ligne_vente_id" integer,
	"utilisateur_id" integer NOT NULL,
	"type" "type_mouvement" NOT NULL,
	"quantite" numeric(10, 2) NOT NULL,
	"stock_apres" numeric(10, 2) NOT NULL,
	"motif" varchar(255),
	"date_heure" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paiement" (
	"id" serial PRIMARY KEY NOT NULL,
	"facture_id" integer NOT NULL,
	"date" date DEFAULT now() NOT NULL,
	"montant" numeric(14, 2) NOT NULL,
	"mode" "mode_paiement" NOT NULL,
	CONSTRAINT "ck_paiement_montant" CHECK ("paiement"."montant" > 0)
);
--> statement-breakpoint
CREATE TABLE "parametre_societe" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"nom" varchar(150) NOT NULL,
	"adresse" varchar(255),
	"telephone" varchar(30),
	"nif" varchar(40),
	"stat" varchar(40),
	"prochain_numero_vente" integer DEFAULT 1 NOT NULL,
	"prochain_numero_facture" integer DEFAULT 1 NOT NULL,
	"tolerance_mesure_m" numeric(6, 3) DEFAULT '0.005' NOT NULL,
	CONSTRAINT "ck_parametre_unique" CHECK ("parametre_societe"."id" = 1),
	CONSTRAINT "ck_parametre_num_vente" CHECK ("parametre_societe"."prochain_numero_vente" > 0),
	CONSTRAINT "ck_parametre_num_facture" CHECK ("parametre_societe"."prochain_numero_facture" > 0),
	CONSTRAINT "ck_parametre_tolerance" CHECK ("parametre_societe"."tolerance_mesure_m" >= 0)
);
--> statement-breakpoint
CREATE TABLE "plateau" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer NOT NULL,
	"longueur_origine_m" numeric(6, 3) NOT NULL,
	"hauteur_origine_m" numeric(6, 3) NOT NULL,
	"surface_restante_m2" numeric(10, 2) NOT NULL,
	"emplacement" varchar(30),
	"statut" "statut_plateau" DEFAULT 'disponible' NOT NULL,
	CONSTRAINT "ck_plateau_longueur" CHECK ("plateau"."longueur_origine_m" > 0),
	CONSTRAINT "ck_plateau_hauteur" CHECK ("plateau"."hauteur_origine_m" > 0),
	CONSTRAINT "ck_plateau_surface" CHECK ("plateau"."surface_restante_m2" >= 0)
);
--> statement-breakpoint
CREATE TABLE "utilisateur" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(120) NOT NULL,
	"identifiant" varchar(60) NOT NULL,
	"mot_de_passe_hash" varchar(255) NOT NULL,
	"role" "role" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vente" (
	"id" serial PRIMARY KEY NOT NULL,
	"numero" integer NOT NULL,
	"client_id" integer NOT NULL,
	"commercial_id" integer NOT NULL,
	"date" date DEFAULT now() NOT NULL,
	"statut" "statut_vente" DEFAULT 'brouillon' NOT NULL,
	"total" numeric(14, 2) DEFAULT '0' NOT NULL,
	CONSTRAINT "ck_vente_total" CHECK ("vente"."total" >= 0)
);
--> statement-breakpoint
ALTER TABLE "article" ADD CONSTRAINT "article_categorie_id_categorie_id_fk" FOREIGN KEY ("categorie_id") REFERENCES "public"."categorie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_alu_detail" ADD CONSTRAINT "article_alu_detail_article_id_article_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."article"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_vitre_detail" ADD CONSTRAINT "article_vitre_detail_article_id_article_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."article"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facture" ADD CONSTRAINT "facture_vente_id_vente_id_fk" FOREIGN KEY ("vente_id") REFERENCES "public"."vente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ligne_vente" ADD CONSTRAINT "ligne_vente_vente_id_vente_id_fk" FOREIGN KEY ("vente_id") REFERENCES "public"."vente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ligne_vente" ADD CONSTRAINT "ligne_vente_article_id_article_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."article"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ligne_vente" ADD CONSTRAINT "ligne_vente_plateau_id_plateau_id_fk" FOREIGN KEY ("plateau_id") REFERENCES "public"."plateau"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mouvement_stock" ADD CONSTRAINT "mouvement_stock_article_id_article_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."article"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mouvement_stock" ADD CONSTRAINT "mouvement_stock_plateau_id_plateau_id_fk" FOREIGN KEY ("plateau_id") REFERENCES "public"."plateau"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mouvement_stock" ADD CONSTRAINT "mouvement_stock_ligne_vente_id_ligne_vente_id_fk" FOREIGN KEY ("ligne_vente_id") REFERENCES "public"."ligne_vente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mouvement_stock" ADD CONSTRAINT "mouvement_stock_utilisateur_id_utilisateur_id_fk" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateur"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paiement" ADD CONSTRAINT "paiement_facture_id_facture_id_fk" FOREIGN KEY ("facture_id") REFERENCES "public"."facture"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plateau" ADD CONSTRAINT "plateau_article_id_article_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."article"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vente" ADD CONSTRAINT "vente_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vente" ADD CONSTRAINT "vente_commercial_id_utilisateur_id_fk" FOREIGN KEY ("commercial_id") REFERENCES "public"."utilisateur"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "article_code_key" ON "article" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_article_categorie" ON "article" USING btree ("categorie_id");--> statement-breakpoint
CREATE INDEX "idx_article_type" ON "article" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "categorie_nom_key" ON "categorie" USING btree ("nom");--> statement-breakpoint
CREATE UNIQUE INDEX "facture_numero_key" ON "facture" USING btree ("numero");--> statement-breakpoint
CREATE INDEX "idx_facture_vente" ON "facture" USING btree ("vente_id");--> statement-breakpoint
CREATE INDEX "idx_facture_statut" ON "facture" USING btree ("statut");--> statement-breakpoint
CREATE INDEX "idx_ligne_vente_vente" ON "ligne_vente" USING btree ("vente_id");--> statement-breakpoint
CREATE INDEX "idx_ligne_vente_article" ON "ligne_vente" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "idx_ligne_vente_plateau" ON "ligne_vente" USING btree ("plateau_id");--> statement-breakpoint
CREATE INDEX "idx_mvt_article" ON "mouvement_stock" USING btree ("article_id","date_heure");--> statement-breakpoint
CREATE INDEX "idx_mvt_plateau" ON "mouvement_stock" USING btree ("plateau_id","date_heure");--> statement-breakpoint
CREATE INDEX "idx_mvt_ligne" ON "mouvement_stock" USING btree ("ligne_vente_id");--> statement-breakpoint
CREATE INDEX "idx_mvt_user" ON "mouvement_stock" USING btree ("utilisateur_id");--> statement-breakpoint
CREATE INDEX "idx_paiement_facture" ON "paiement" USING btree ("facture_id");--> statement-breakpoint
CREATE INDEX "idx_plateau_article" ON "plateau" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "idx_plateau_statut" ON "plateau" USING btree ("statut");--> statement-breakpoint
CREATE UNIQUE INDEX "utilisateur_identifiant_key" ON "utilisateur" USING btree ("identifiant");--> statement-breakpoint
CREATE UNIQUE INDEX "vente_numero_key" ON "vente" USING btree ("numero");--> statement-breakpoint
CREATE INDEX "idx_vente_client" ON "vente" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_vente_commercial" ON "vente" USING btree ("commercial_id");--> statement-breakpoint
CREATE INDEX "idx_vente_statut" ON "vente" USING btree ("statut");
-- =====================================================================
-- VITALUXE - constraints.sql
-- Ce que Drizzle ne sait pas générer : le trigger qui protège l'historique.
-- Les CHECK sont déjà dans schema.ts (ils sortent dans la migration .sql
-- générée par drizzle-kit). Ne coller QUE ce qui suit, à la fin de la
-- première migration générée (drizzle/0000_xxx.sql), avant de l'exécuter.
-- =====================================================================

-- Protection de l'historique : mouvement_stock ne se modifie ni ne se supprime
CREATE FUNCTION mouvement_stock_immuable() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'mouvement_stock est un historique : modification et suppression interdites';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mouvement_stock_immuable
    BEFORE UPDATE OR DELETE ON mouvement_stock
    FOR EACH ROW EXECUTE FUNCTION mouvement_stock_immuable();