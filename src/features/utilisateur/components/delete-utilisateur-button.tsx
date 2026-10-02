import { deleteUtilisateur } from '../action/utilisateur'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export function DeleteUtilisateurButton({ id }: { id: number }) {
  return (
    <form action={deleteUtilisateur.bind(null, id)}>
      <Button variant="ghost" size="icon-sm" type="submit" className="text-muted-foreground hover:text-destructive">
        <Trash2 className="size-3.5" />
      </Button>
    </form>
  )
}
