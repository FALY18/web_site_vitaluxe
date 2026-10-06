export function formatMoney(value: string | number | null | undefined) {
  const n = Number(value ?? 0)

  return `${n.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} Ar`
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function getModeLabel(mode: string) {
  const labels: Record<string, string> = {
    decoupe: 'Découpe',
    plateau_entier: 'Plateau entier',
    plateau_gros: 'Plateau gros',
    barre: 'Barre',
    pack: 'Pack',
    standard: 'Standard',
  }

  return labels[mode] ?? mode
}
