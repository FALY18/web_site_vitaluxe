import { TypeBadge, UniteBadge } from './article-badge'
import { DeleteArticleButton } from './delete-article-button'
import type { ArticleWithDetail } from '../types'
import type { Role } from '@/features/auth/types'

function formatAr(val: string) {
  return Number(val).toLocaleString('fr-MG') + ' Ar'
}

export function ArticleTable({ articles, role }: { articles: ArticleWithDetail[], role: Role }) {
  const canEdit = role !== 'commercial'

  if (articles.length === 0) {
    return (
      <div className="rounded-xl bg-card ring-1 ring-foreground/10 p-12 text-center text-sm text-muted-foreground">
        Aucun article. Créez le premier article ci-dessous.
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/8">
            <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-medium">Code</th>
            <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-medium">Désignation</th>
            <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-medium">Type</th>
            <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-medium">Catégorie</th>
            <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-medium">Unité</th>
            <th className="text-right px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-medium">Prix vente</th>
            <th className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-medium">Détails</th>
            {canEdit && <th className="px-4 py-3 w-10" />}
          </tr>
        </thead>
        <tbody>
          {articles.map((a) => (
            <tr key={a.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.code}</td>
              <td className="px-4 py-3 font-medium max-w-[200px] truncate">
                {a.designation}
                {a.couleur && <span className="ml-1.5 text-xs text-muted-foreground">· {a.couleur}</span>}
              </td>
              <td className="px-4 py-3"><TypeBadge type={a.type} /></td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{a.categorieNom}</td>
              <td className="px-4 py-3"><UniteBadge unite={a.uniteVente} /></td>
              <td className="px-4 py-3 text-right">
                <span className="font-medium text-[#c8a96e]">{formatAr(a.prixVente)}</span>
                <span className="block text-[10px] text-muted-foreground">
                  {a.type === 'vitre' ? '/m²' : a.type === 'alu' ? '/barre' : '/unité'}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {a.type === 'vitre' && a.vitreDetail && (
                  <span className="flex flex-col gap-0.5">
                    <span>{a.vitreDetail.epaisseurMm} mm</span>
                    <span>Plateau entier : {formatAr(a.vitreDetail.prixPlateauEntier)}</span>
                    {a.vitreDetail.prixPlateauGros && (
                      <span>Gros plateau : {formatAr(a.vitreDetail.prixPlateauGros)}</span>
                    )}
                  </span>
                )}
                {a.type === 'alu' && a.aluDetail && (
                  <span className="flex flex-col gap-0.5">
                    <span>Pack {a.aluDetail.nombreParPack} barres : {formatAr(a.aluDetail.prixPack)}</span>
                    <span>Stock : {a.aluDetail.stockBarres} barres</span>
                    {a.aluDetail.emplacement && <span>Empl. : {a.aluDetail.emplacement}</span>}
                  </span>
                )}
              </td>
              {canEdit && (
                <td className="px-4 py-3">
                  <DeleteArticleButton id={a.id} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
