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
- Tests : `node --test tests/sales-rules.test.mjs` ; dix-huit tests de règles/calculs, dont les règlements partiels/complets, dépassements de solde, dates et références signées.
- Compilation de production Next.js : réussie après autorisation du téléchargement des polices Google.
- Intégration : `node scripts/test-payment-flow.mjs` exécute la véritable action serveur sur trois tables PostgreSQL temporaires masquant `vente`, `facture` et `paiement`, avec des séquences temporaires propres. Paiement partiel, solde, doublon, trop-perçu, verrouillage et rollback sont vérifiés sans créer de données métier. La concurrence du stock reste à tester sur une base de test.
- Rendu visuel et impression à contrôler en navigateur aux largeurs 360, 390, 768 et 1440 px après migration.

## Réanalyse du reste des plateaux et du paiement

L’inspection en lecture seule a été complétée par `scripts/audit-stock-payments.mjs`. Les cinq contrôles ciblés sont à zéro avant et après la migration 007 : reste actuel différent du dernier mouvement, surface supérieure à l’origine, plateau disponible sans surface, plateau vendu/épuisé avec une surface positive, instantané de ligne différent du mouvement de vente associé.

Le calcul part exclusivement de la valeur actuelle de `plateau.surface_restante_m2`, lue sous verrou dans la transaction de vente :

```text
Découpe : nouveau reste = reste actuel - surface découpée arrondie à 0,01 m²
Plateau entier/gros : nouveau reste = 0,00 m²
Annulation : nouveau reste = reste actuel + débit net enregistré pour la ligne
```

Exemple testé : 6,50 m² − 1,92 m² = 4,58 m² ; une autre découpe de 0,96 m² laisse 3,62 m². Annuler la première découpe restitue 1,92 m² au stock actuel, soit 5,54 m². Le calcul ne repart pas des dimensions d’origine ou d’un ancien instantané.

La confirmation et la livraison ne retirent pas à nouveau les surfaces déjà débitées au brouillon. Le formulaire affiche une projection avant/après, puis confirme le reste enregistré par le serveur. Le bon affiche un récapitulatif dépliable du stock actuel des plateaux concernés, avec un seul comptage par plateau ; les lignes conservent séparément leur instantané historique `surface_restante_apres`.

## Règlements réels : table existante uniquement

À la demande de l’utilisateur, la migration 008 a supprimé `vente.mode_paiement` et `facture.mode_paiement`. La migration 007 reste uniquement dans l’historique du dépôt ; elle n’est plus exécutée par le script de mise à niveau. La table `paiement` et son enum d’origine sont inchangés. L’audit confirme l’absence des deux colonnes et la préservation du schéma des règlements.

La première étape regroupe la remise, les frais et l’enregistrement facultatif d’un règlement reçu : montant strictement positif, mode (espèces, mobile money, virement, chèque) et date de réception valide, sans date future. Sans règlement coché, seules les conditions sont enregistrées ; aucune ligne de paiement n’est créée.

Avec un règlement reçu, la facture est créée/émise si nécessaire, puis le paiement est inséré dans `paiement` dans la même transaction. La facture devient `partielle` si un solde subsiste, `payee` si la somme des règlements atteint le total TTC. Un trop-perçu est refusé ; les conditions d’une facture émise restent verrouillées, mais les règlements complémentaires restent possibles. Une facture à total nul peut être émise comme payée sans créer de paiement fictif de zéro.

Le solde est calculé à partir de `facture.total_ttc - SUM(paiement.montant)` et affiché dans le formulaire et dans les deux exemplaires de facture. Les calculs utilisent des centimes entiers.

Le détail des règlements (dates, modes, montants) est réservé à l’exemplaire société ; l’exemplaire client conserve uniquement le total reçu et le solde. La société dispose aussi d’une colonne de reste du plateau après chaque ligne, issue de `surface_restante_apres`, pour conserver le contexte de la transaction. Cette colonne et les identifiants des plateaux ne figurent pas dans l’exemplaire client.

L’aperçu conserve les deux exemplaires côte à côte sur grand écran et permet le défilement horizontal local des tableaux sur mobile. À la demande de l’utilisateur, les deux exemplaires sont imprimés sur une seule feuille A4 paysage. Avant chaque impression (bouton ou raccourci navigateur), le contenu compact est mesuré puis réduit proportionnellement à la hauteur et à la largeur disponibles. Toutes les lignes sont conservées ; plus il y a d’articles, plus les caractères sont petits. Le facteur est réinitialisé après impression. Des tests de rendu avec 50 articles vérifient l’absence de limite de lignes et la séparation des informations internes ; un test de dimensionnement vérifie la réduction pour trois hauteurs de contenu. Le rendu physique reste à contrôler dans le navigateur d’impression.

L’enregistrement verrouille d’abord la vente, puis la facture. Une référence signée liée à la vente et à l’utilisateur réserve un identifiant dans la séquence existante de `paiement.id`. Une répétition identique cible la même clé primaire et retourne le succès sans nouvel encaissement ; une réutilisation avec d’autres données est refusée. Aucune colonne d’idempotence supplémentaire n’a été ajoutée. Les identifiants peuvent comporter des trous lorsqu’un formulaire est consulté sans enregistrement, comme toute séquence PostgreSQL.

`node scripts/migrate-sales.mjs` applique désormais les migrations 006 et 008 de façon réexécutable dans la même transaction. Aucun mode prévu n’a été converti en règlement réel. Aucun ancien encaissement n’a été modifié ou supprimé.
