import { deleteArticle } from '../action/article'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export function DeleteArticleButton({ id }: { id: number }) {
  return (
    <form action={deleteArticle.bind(null, id)}>
      <Button variant="ghost" size="icon-sm" type="submit" className="text-muted-foreground hover:text-destructive">
        <Trash2 className="size-3.5" />
      </Button>
    </form>
  )
}
