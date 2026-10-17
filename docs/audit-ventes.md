# Audit de la base et du module de vente — 17 octobre 2026

## Périmètre vérifié

Lecture de `src/db/schema.ts`, des migrations SQL, de sell et de la facturation.
Inspection de la base configurée par DATABASE_URL dans une transaction `BEGIN READ ONLY` : contraintes CHECK et clés étrangères, triggers actifs et quatre contrôles de cohérence. Aucun contenu de fiche client ni secret n’est exporté.

Résultats avant migration 006 : aucun total de vente différent de la somme de ses lignes, aucune vente avec plusieurs factures, aucune ligne associant un plateau à un autre article et aucun mode de vente incompatible avec le type d’article. Ces quatre contrôles ciblés ne constituent pas une réconciliation complète du stock physique.

Les triggers de génération des codes articles, numéros de vente et facture, et de protection de l’historique sont présents et activés. La colonne `ligne_vente.annulee` n’était pas présente au moment de cet audit.

## Contraintes et conséquences

| Domaine | Protection en base | Règle appliquée dans le module |
| --- | --- | --- |
| Vente | Client et commercial obligatoires, numéro unique, total positif | Session admin/commercial, client explicitement choisi ou créé, total recalculé dans la transaction |
| Lignes | Nombre entier positif, quantités/prix/montants positifs | Modes selon type, valeurs finies et limites numeric, calcul partagé entre aperçu et serveur |
| Verre | Plateau obligatoire pour découpe/entier/gros ; un plateau par ligne entière | Plateau du bon article, disponible, surface suffisante, dimensions compatibles après rotation et tolérance |
| Aluminium | Stock de barres positif, nombre par pack positif | Prix catalogue à la barre ou au pack ; débit de `packs × nombre_par_pack` barres |
| Stock | FK et historique immuable | Débit/restauration atomiques ; restauration à partir du solde des mouvements, jamais d’une ancienne surface restante |
| Annulation | Les mouvements référencent les lignes et ne peuvent pas être effacés | Retrait logique des lignes ; annulation du bon au lieu de suppression physique |
| Facturation | Montants positifs, remise en pourcentage entre 0 et 100 | Remise fixe plafonnée au total articles ; livraison ajoutée après remise ; verrouillage des factures non brouillon |
| Statuts | Enum uniquement | Brouillon → confirmée → livrée ; annulation des brouillons/confirmées sans facture émise ; aucun retour en arrière |

Les contrôles croisant plusieurs tables (mode/type, propriété du plateau, total des lignes, transitions) sont assurés dans le service transactionnel, pas par les CHECK existants. Des écritures SQL externes peuvent toujours les contourner.

## Stock et précision

Le comportement existant est conservé et explicité : le stock est débité dès l’ajout au brouillon. Confirmation et livraison ne le débitent pas une seconde fois. Les brouillons abandonnés doivent donc être annulés pour libérer leur stock.

Dimensions en mètres avec trois décimales ; surface facturée/stockée avec deux décimales conformément aux colonnes existantes. Le calcul des surfaces utilise les dimensions en millimètres et un arrondi unique à 0,01 m². Prix et montant final utilisent des centimes entiers. Les surfaces arrondies à zéro et les dépassements des limites numeric sont refusés.

La surface restante ne décrit pas la géométrie des chutes. Le contrôle dimensionnel vérifie le rectangle d’origine et la surface globale ; la faisabilité réelle de plusieurs découpes reste à vérifier au dépôt. Une optimisation géométrique nécessiterait un modèle de chutes distinct.

Les anciennes anomalies de stock (par exemple aluminium vendu sans mouvement par l’ancien code) ne sont pas réparées automatiquement. Une restauration ne concerne que les débits réellement enregistrés dans l’historique.

## Migration appliquée

Après autorisation explicite, la migration 006 a été appliquée le 17 octobre 2026 à la base configurée. L’audit relancé confirme `migration006Applied: true`, les quatre triggers toujours actifs et zéro anomalie dans chacun des quatre contrôles ciblés. Les commandes ci-dessous servent à reproduire cette mise à niveau sur un autre environnement.

`drizzle/006_annulation_lignes.sql` ajoute uniquement `ligne_vente.annulee boolean NOT NULL DEFAULT false`. Les anciennes lignes restent actives. Aucun historique n’est supprimé ni réécrit.

Commande depuis le dossier du projet, avec la base cible configurée :

```sh
node scripts/migrate-sales.mjs
```

Le script utilise une transaction et un délai d’attente de verrou de cinq secondes. Il est réexécutable. Ne pas lancer `drizzle-kit push` pour cette modification : les migrations 003 à 005 sont des scripts manuels absents du journal Drizzle existant. La migration 006 suit le même mécanisme explicite.

L’audit est réexécutable en lecture seule :

```sh
node scripts/audit-database.mjs
```

## UI

Thème clair par défaut pour le site et la gestion ; couleurs sémantiques des formulaires, cartes et états. Saisie et bon côte à côte sur grand écran ; sections séparées sur mobile ; facturation isolée. Liste des lignes avec hauteur limitée et en-tête fixe pour garder la saisie et les actions proches. La hauteur disponible et le clavier mobile peuvent nécessiter du défilement local.

## Vérifications

- TypeScript : `tsc --noEmit`.
- ESLint : zéro erreur ; avertissements préexistants sur les images et quelques imports inutilisés.
- Tests : `node --test tests/sales-rules.test.mjs` ; huit tests de règles/calculs.
- Compilation de production Next.js : réussie après autorisation du téléchargement des polices Google.
- Pas de scénario de vente réelle exécuté sur les données métier ; les transactions de stock et leur concurrence restent à tester sur une base de test.
- Rendu visuel et impression à contrôler en navigateur aux largeurs 360, 390, 768 et 1440 px après migration.
