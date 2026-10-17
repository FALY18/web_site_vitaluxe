import { DeleteUtilisateurButton } from './delete-utilisateur-button'
import type { UtilisateurRow } from '../types'

const roleBadge: Record<string, string> = {
  admin: 'bg-[#c8a96e]/15 text-primary border-[#c8a96e]/30',
  commercial: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  depot: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
}

const roleLabel: Record<string, string> = {
  admin: 'Admin',
  commercial: 'Commercial',
  depot: 'Dépôt',
}

export function UtilisateurTable({ users, currentUserId }: { users: UtilisateurRow[], currentUserId: number }) {
  return (
    <div className="rounded-xl bg-card ring-1 ring-foreground/10 overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-foreground/8">
            <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-medium">Nom</th>
            <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-medium">Identifiant</th>
            <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-medium">Rôle</th>
            <th className="px-4 py-3 w-12" />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-foreground/5 last:border-0 hover:bg-foreground/3 transition-colors">
              <td className="px-4 py-3 font-medium">{u.nom}</td>
              <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{u.identifiant}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${roleBadge[u.role]}`}>
                  {roleLabel[u.role]}
                </span>
              </td>
              <td className="px-4 py-3">
                {u.id !== currentUserId && <DeleteUtilisateurButton id={u.id} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
