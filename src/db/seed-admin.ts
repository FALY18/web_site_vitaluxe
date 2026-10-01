import 'dotenv/config'
import { db } from './index'
import { utilisateur } from './schema'
import { hash } from 'bcryptjs'

async function seedAdmin() {
  const motDePasseHash = await hash('admin1234', 12)

  await db
    .insert(utilisateur)
    .values({
      nom: 'Administrateur',
      identifiant: 'admin',
      motDePasseHash,
      role: 'admin',
    })
    .onConflictDoNothing()

  console.log('Admin créé : identifiant=admin / mot de passe=admin1234')
  process.exit(0)
}

seedAdmin().catch((e) => { console.error(e); process.exit(1) })
