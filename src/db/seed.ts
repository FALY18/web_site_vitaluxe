// =====================================================================
// VITALUXE - src/db/seed.ts
// Lancer avec : npx tsx src/db/seed.ts
// =====================================================================

import 'dotenv/config'
import { db } from "./index";
import { parametreSociete, categorie } from "./schema";

async function main() {
  // Paramètres de la société (une seule ligne : id = 1)
  await db
    .insert(parametreSociete)
    .values({
      id: 1,
      nom: "VITALUXE",
      adresse: "Amborimpotsy Talatamaty",
      telephone: "0389657777",
      nif: "A_COMPLETER",
      stat: "A_COMPLETER",
      toleranceMesureM: "0.005", // 5 mm, à ajuster
    })
    .onConflictDoNothing();

  // Catégories de départ
  await db
    .insert(categorie)
    .values([
      { nom: "Vitres" },
      { nom: "Alu" },
      { nom: "Accessoires" },
      { nom: "Services" },
    ])
    .onConflictDoNothing();

  console.log("Seed terminé.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});