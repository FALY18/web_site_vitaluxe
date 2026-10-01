// =====================================================================
// VITALUXE - src/db/schema.ts (Phase 1)
// Drizzle ORM + PostgreSQL + Next.js (TypeScript)
// Les CHECK non exprimables ici et le trigger sont dans constraints.sql
// =====================================================================

import {
  pgTable,
  pgEnum,
  serial,
  integer,
  varchar,
  numeric,
  date,
  timestamp,
  smallint,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ---------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------
export const roleEnum = pgEnum("role", ["commercial", "depot", "admin"]);

export const typeArticleEnum = pgEnum("type_article", [
  "vitre",
  "alu",
  "accessoire",
  "service",
]);

export const uniteVenteEnum = pgEnum("unite_vente", [
  "m2",
  "barre",
  "unite",
  "forfait",
  "heure",
]);

export const statutPlateauEnum = pgEnum("statut_plateau", [
  "disponible",
  "epuise",
  "vendu_entier",
]);

export const statutVenteEnum = pgEnum("statut_vente", [
  "brouillon",
  "confirmee",
  "livree",
  "annulee",
]);

export const modeLigneEnum = pgEnum("mode_ligne", [
  "decoupe",
  "plateau_entier",
  "plateau_gros",
  "barre",
  "pack",
  "standard",
]);

export const typeMouvementEnum = pgEnum("type_mouvement", [
  "reception",
  "vente",
  "annulation",
  "ajustement",
]);

export const statutFactureEnum = pgEnum("statut_facture", [
  "brouillon",
  "emise",
  "partielle",
  "payee",
  "annulee",
]);

export const modePaiementEnum = pgEnum("mode_paiement", [
  "especes",
  "mobile_money",
  "virement",
  "cheque",
]);

// ---------------------------------------------------------------------
// 1. Utilisateur
// ---------------------------------------------------------------------
export const utilisateur = pgTable("utilisateur", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 120 }).notNull(),
  identifiant: varchar("identifiant", { length: 60 }).notNull(),
  motDePasseHash: varchar("mot_de_passe_hash", { length: 255 }).notNull(),
  role: roleEnum("role").notNull(),
}, (t) => ({
  identifiantUnique: uniqueIndex("utilisateur_identifiant_key").on(t.identifiant),
}));

// ---------------------------------------------------------------------
// 2. Client
// ---------------------------------------------------------------------
export const client = pgTable("client", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 150 }).notNull(),
  telephone: varchar("telephone", { length: 30 }),
  adresse: varchar("adresse", { length: 255 }),
});

// ---------------------------------------------------------------------
// 3. Categorie
// ---------------------------------------------------------------------
export const categorie = pgTable("categorie", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 100 }).notNull(),
}, (t) => ({
  nomUnique: uniqueIndex("categorie_nom_key").on(t.nom),
}));

// ---------------------------------------------------------------------
// 4. Article (tout ce qui se vend)
// ---------------------------------------------------------------------
export const article = pgTable("article", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 30 }).notNull(),
  designation: varchar("designation", { length: 200 }).notNull(),
  categorieId: integer("categorie_id")
    .notNull()
    .references(() => categorie.id),
  type: typeArticleEnum("type").notNull(),
  couleur: varchar("couleur", { length: 50 }),
  uniteVente: uniteVenteEnum("unite_vente").notNull(),
  prixVente: numeric("prix_vente", { precision: 14, scale: 2 }).notNull(),
}, (t) => ({
  codeUnique: uniqueIndex("article_code_key").on(t.code),
  categorieIdx: index("idx_article_categorie").on(t.categorieId),
  typeIdx: index("idx_article_type").on(t.type),
  prixPositif: check("ck_article_prix", sql`${t.prixVente} >= 0`),
}));

// ---------------------------------------------------------------------
// 5. Article_Vitre_Detail (1 pour 1 avec Article)
// ---------------------------------------------------------------------
export const articleVitreDetail = pgTable("article_vitre_detail", {
  articleId: integer("article_id")
    .primaryKey()
    .references(() => article.id, { onDelete: "cascade" }),
  epaisseurMm: numeric("epaisseur_mm", { precision: 5, scale: 1 }).notNull(),
  prixPlateauEntier: numeric("prix_plateau_entier", {
    precision: 14,
    scale: 2,
  }).notNull(),
  prixPlateauGros: numeric("prix_plateau_gros", { precision: 14, scale: 2 }),
}, (t) => ({
  epaisseurPositive: check("ck_vitre_epaisseur", sql`${t.epaisseurMm} > 0`),
  prixEntierPositif: check(
    "ck_vitre_prix_entier",
    sql`${t.prixPlateauEntier} >= 0`
  ),
  prixGrosPositif: check(
    "ck_vitre_prix_gros",
    sql`${t.prixPlateauGros} IS NULL OR ${t.prixPlateauGros} >= 0`
  ),
}));

// ---------------------------------------------------------------------
// 6. Article_Alu_Detail (1 pour 1 avec Article)
// ---------------------------------------------------------------------
export const articleAluDetail = pgTable("article_alu_detail", {
  articleId: integer("article_id")
    .primaryKey()
    .references(() => article.id, { onDelete: "cascade" }),
  prixPack: numeric("prix_pack", { precision: 14, scale: 2 }).notNull(),
  nombreParPack: integer("nombre_par_pack").notNull(),
  stockBarres: integer("stock_barres").notNull().default(0),
  emplacement: varchar("emplacement", { length: 30 }),
}, (t) => ({
  prixPackPositif: check("ck_alu_prix_pack", sql`${t.prixPack} >= 0`),
  nombrePackPositif: check(
    "ck_alu_nombre_pack",
    sql`${t.nombreParPack} > 0`
  ),
  stockPositif: check("ck_alu_stock", sql`${t.stockBarres} >= 0`),
}));

// ---------------------------------------------------------------------
// 7. Plateau (stock de verre brut)
// ---------------------------------------------------------------------
export const plateau = pgTable("plateau", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id")
    .notNull()
    .references(() => article.id),
  longueurOrigineM: numeric("longueur_origine_m", {
    precision: 6,
    scale: 3,
  }).notNull(),
  hauteurOrigineM: numeric("hauteur_origine_m", {
    precision: 6,
    scale: 3,
  }).notNull(),
  surfaceRestanteM2: numeric("surface_restante_m2", {
    precision: 10,
    scale: 2,
  }).notNull(),
  emplacement: varchar("emplacement", { length: 30 }),
  statut: statutPlateauEnum("statut").notNull().default("disponible"),
}, (t) => ({
  articleIdx: index("idx_plateau_article").on(t.articleId),
  statutIdx: index("idx_plateau_statut").on(t.statut),
  longueurPositive: check(
    "ck_plateau_longueur",
    sql`${t.longueurOrigineM} > 0`
  ),
  hauteurPositive: check("ck_plateau_hauteur", sql`${t.hauteurOrigineM} > 0`),
  surfacePositive: check(
    "ck_plateau_surface",
    sql`${t.surfaceRestanteM2} >= 0`
  ),
}));

// ---------------------------------------------------------------------
// 8. Vente
// ---------------------------------------------------------------------
export const vente = pgTable("vente", {
  id: serial("id").primaryKey(),
  numero: integer("numero").notNull(),
  clientId: integer("client_id")
    .notNull()
    .references(() => client.id),
  commercialId: integer("commercial_id")
    .notNull()
    .references(() => utilisateur.id),
  date: date("date").notNull().defaultNow(),
  statut: statutVenteEnum("statut").notNull().default("brouillon"),
  total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
}, (t) => ({
  numeroUnique: uniqueIndex("vente_numero_key").on(t.numero),
  clientIdx: index("idx_vente_client").on(t.clientId),
  commercialIdx: index("idx_vente_commercial").on(t.commercialId),
  statutIdx: index("idx_vente_statut").on(t.statut),
  totalPositif: check("ck_vente_total", sql`${t.total} >= 0`),
}));

// ---------------------------------------------------------------------
// 9. Ligne_Vente
// ---------------------------------------------------------------------
export const ligneVente = pgTable("ligne_vente", {
  id: serial("id").primaryKey(),
  venteId: integer("vente_id")
    .notNull()
    .references(() => vente.id, { onDelete: "cascade" }),
  articleId: integer("article_id")
    .notNull()
    .references(() => article.id),
  plateauId: integer("plateau_id").references(() => plateau.id),
  mode: modeLigneEnum("mode").notNull(),
  nombre: integer("nombre").notNull(),
  longueurM: numeric("longueur_m", { precision: 6, scale: 3 }),
  hauteurM: numeric("hauteur_m", { precision: 6, scale: 3 }),
  quantiteFacturee: numeric("quantite_facturee", {
    precision: 10,
    scale: 2,
  }).notNull(),
  prixApplique: numeric("prix_applique", {
    precision: 14,
    scale: 2,
  }).notNull(),
  montant: numeric("montant", { precision: 14, scale: 2 }).notNull(),
  surfaceRestanteApres: numeric("surface_restante_apres", {
    precision: 10,
    scale: 2,
  }),
  longueurControleeM: numeric("longueur_controlee_m", {
    precision: 6,
    scale: 3,
  }),
  hauteurControleeM: numeric("hauteur_controlee_m", {
    precision: 6,
    scale: 3,
  }),
  nombreControle: integer("nombre_controle"),
}, (t) => ({
  venteIdx: index("idx_ligne_vente_vente").on(t.venteId),
  articleIdx: index("idx_ligne_vente_article").on(t.articleId),
  plateauIdx: index("idx_ligne_vente_plateau").on(t.plateauId),
  nombrePositif: check("ck_ligne_nombre", sql`${t.nombre} > 0`),
  longueurPositive: check(
    "ck_ligne_longueur",
    sql`${t.longueurM} IS NULL OR ${t.longueurM} > 0`
  ),
  hauteurPositive: check(
    "ck_ligne_hauteur",
    sql`${t.hauteurM} IS NULL OR ${t.hauteurM} > 0`
  ),
  quantitePositive: check(
    "ck_ligne_quantite",
    sql`${t.quantiteFacturee} >= 0`
  ),
  prixPositif: check("ck_ligne_prix", sql`${t.prixApplique} >= 0`),
  montantPositif: check("ck_ligne_montant", sql`${t.montant} >= 0`),
  surfaceApresPositive: check(
    "ck_ligne_surface_apres",
    sql`${t.surfaceRestanteApres} IS NULL OR ${t.surfaceRestanteApres} >= 0`
  ),
  nombreControlePositif: check(
    "ck_ligne_nombre_controle",
    sql`${t.nombreControle} IS NULL OR ${t.nombreControle} >= 0`
  ),
  // plateau_entier et plateau_gros : 1 plateau par ligne, plateau obligatoire
  plateauEntierRegle: check(
    "ck_ligne_plateau_entier",
    sql`${t.mode} NOT IN ('plateau_entier', 'plateau_gros')
        OR (${t.nombre} = 1 AND ${t.plateauId} IS NOT NULL)`
  ),
  // decoupe : plateau et dimensions obligatoires
  decoupeRegle: check(
    "ck_ligne_decoupe",
    sql`${t.mode} <> 'decoupe'
        OR (${t.plateauId} IS NOT NULL
            AND ${t.longueurM} IS NOT NULL
            AND ${t.hauteurM} IS NOT NULL)`
  ),
}));

// ---------------------------------------------------------------------
// 10. Mouvement_Stock (historique - jamais modifié ni supprimé)
// Protection : voir le trigger dans constraints.sql
// ---------------------------------------------------------------------
export const mouvementStock = pgTable("mouvement_stock", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id")
    .notNull()
    .references(() => article.id),
  plateauId: integer("plateau_id").references(() => plateau.id),
  ligneVenteId: integer("ligne_vente_id").references(() => ligneVente.id),
  utilisateurId: integer("utilisateur_id")
    .notNull()
    .references(() => utilisateur.id),
  type: typeMouvementEnum("type").notNull(),
  quantite: numeric("quantite", { precision: 10, scale: 2 }).notNull(), // négatif = sortie
  stockApres: numeric("stock_apres", { precision: 10, scale: 2 }).notNull(),
  motif: varchar("motif", { length: 255 }),
  dateHeure: timestamp("date_heure", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => ({
  articleIdx: index("idx_mvt_article").on(t.articleId, t.dateHeure),
  plateauIdx: index("idx_mvt_plateau").on(t.plateauId, t.dateHeure),
  ligneIdx: index("idx_mvt_ligne").on(t.ligneVenteId),
  userIdx: index("idx_mvt_user").on(t.utilisateurId),
}));

// ---------------------------------------------------------------------
// 11. Facture
// ---------------------------------------------------------------------
export const facture = pgTable("facture", {
  id: serial("id").primaryKey(),
  numero: varchar("numero", { length: 20 }).notNull(),
  venteId: integer("vente_id")
    .notNull()
    .references(() => vente.id),
  dateEmission: date("date_emission").notNull().defaultNow(),
  totalHt: numeric("total_ht", { precision: 14, scale: 2 }).notNull(),
  montantTva: numeric("montant_tva", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  totalTtc: numeric("total_ttc", { precision: 14, scale: 2 }).notNull(),
  statut: statutFactureEnum("statut").notNull().default("brouillon"),
}, (t) => ({
  numeroUnique: uniqueIndex("facture_numero_key").on(t.numero),
  venteIdx: index("idx_facture_vente").on(t.venteId),
  statutIdx: index("idx_facture_statut").on(t.statut),
  montantsPositifs: check(
    "ck_facture_montants",
    sql`${t.totalHt} >= 0 AND ${t.montantTva} >= 0 AND ${t.totalTtc} >= 0`
  ),
}));

// ---------------------------------------------------------------------
// 12. Paiement
// ---------------------------------------------------------------------
export const paiement = pgTable("paiement", {
  id: serial("id").primaryKey(),
  factureId: integer("facture_id")
    .notNull()
    .references(() => facture.id),
  date: date("date").notNull().defaultNow(),
  montant: numeric("montant", { precision: 14, scale: 2 }).notNull(),
  mode: modePaiementEnum("mode").notNull(),
}, (t) => ({
  factureIdx: index("idx_paiement_facture").on(t.factureId),
  montantPositif: check("ck_paiement_montant", sql`${t.montant} > 0`),
}));

// ---------------------------------------------------------------------
// 13. Parametre_Societe (une seule ligne : id = 1)
// ---------------------------------------------------------------------
export const parametreSociete = pgTable("parametre_societe", {
  id: smallint("id").primaryKey().default(1),
  nom: varchar("nom", { length: 150 }).notNull(),
  adresse: varchar("adresse", { length: 255 }),
  telephone: varchar("telephone", { length: 30 }),
  nif: varchar("nif", { length: 40 }),
  stat: varchar("stat", { length: 40 }),
  prochainNumeroVente: integer("prochain_numero_vente").notNull().default(1),
  prochainNumeroFacture: integer("prochain_numero_facture")
    .notNull()
    .default(1),
  toleranceMesureM: numeric("tolerance_mesure_m", { precision: 6, scale: 3 })
    .notNull()
    .default("0.005"),
}, (t) => ({
  idUnique: check("ck_parametre_unique", sql`${t.id} = 1`),
  numVentePositif: check(
    "ck_parametre_num_vente",
    sql`${t.prochainNumeroVente} > 0`
  ),
  numFacturePositif: check(
    "ck_parametre_num_facture",
    sql`${t.prochainNumeroFacture} > 0`
  ),
  tolerancePositive: check(
    "ck_parametre_tolerance",
    sql`${t.toleranceMesureM} >= 0`
  ),
}));

// =====================================================================
// Relations (pour db.query.xxx.findMany({ with: {...} }))
// =====================================================================

export const utilisateurRelations = relations(utilisateur, ({ many }) => ({
  ventes: many(vente),
  mouvements: many(mouvementStock),
}));

export const clientRelations = relations(client, ({ many }) => ({
  ventes: many(vente),
}));

export const categorieRelations = relations(categorie, ({ many }) => ({
  articles: many(article),
}));

export const articleRelations = relations(article, ({ one, many }) => ({
  categorie: one(categorie, {
    fields: [article.categorieId],
    references: [categorie.id],
  }),
  vitreDetail: one(articleVitreDetail, {
    fields: [article.id],
    references: [articleVitreDetail.articleId],
  }),
  aluDetail: one(articleAluDetail, {
    fields: [article.id],
    references: [articleAluDetail.articleId],
  }),
  plateaux: many(plateau),
  lignes: many(ligneVente),
  mouvements: many(mouvementStock),
}));

export const articleVitreDetailRelations = relations(
  articleVitreDetail,
  ({ one }) => ({
    article: one(article, {
      fields: [articleVitreDetail.articleId],
      references: [article.id],
    }),
  })
);

export const articleAluDetailRelations = relations(
  articleAluDetail,
  ({ one }) => ({
    article: one(article, {
      fields: [articleAluDetail.articleId],
      references: [article.id],
    }),
  })
);

export const plateauRelations = relations(plateau, ({ one, many }) => ({
  article: one(article, {
    fields: [plateau.articleId],
    references: [article.id],
  }),
  lignes: many(ligneVente),
  mouvements: many(mouvementStock),
}));

export const venteRelations = relations(vente, ({ one, many }) => ({
  client: one(client, { fields: [vente.clientId], references: [client.id] }),
  commercial: one(utilisateur, {
    fields: [vente.commercialId],
    references: [utilisateur.id],
  }),
  lignes: many(ligneVente),
  factures: many(facture),
}));

export const ligneVenteRelations = relations(ligneVente, ({ one, many }) => ({
  vente: one(vente, {
    fields: [ligneVente.venteId],
    references: [vente.id],
  }),
  article: one(article, {
    fields: [ligneVente.articleId],
    references: [article.id],
  }),
  plateau: one(plateau, {
    fields: [ligneVente.plateauId],
    references: [plateau.id],
  }),
  mouvements: many(mouvementStock),
}));

export const mouvementStockRelations = relations(
  mouvementStock,
  ({ one }) => ({
    article: one(article, {
      fields: [mouvementStock.articleId],
      references: [article.id],
    }),
    plateau: one(plateau, {
      fields: [mouvementStock.plateauId],
      references: [plateau.id],
    }),
    ligneVente: one(ligneVente, {
      fields: [mouvementStock.ligneVenteId],
      references: [ligneVente.id],
    }),
    utilisateur: one(utilisateur, {
      fields: [mouvementStock.utilisateurId],
      references: [utilisateur.id],
    }),
  })
);

export const factureRelations = relations(facture, ({ one, many }) => ({
  vente: one(vente, { fields: [facture.venteId], references: [vente.id] }),
  paiements: many(paiement),
}));

export const paiementRelations = relations(paiement, ({ one }) => ({
  facture: one(facture, {
    fields: [paiement.factureId],
    references: [facture.id],
  }),
}));
