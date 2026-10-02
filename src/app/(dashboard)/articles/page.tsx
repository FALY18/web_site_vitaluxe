import { getSession } from '@/features/auth/session'
import { getArticles } from '@/features/article/queries/article'
import { ArticleList } from '@/features/article/components/article-list'
import { PageHeader } from '@/features/dashboard/components/page-header'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function ArticlesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const articles = await getArticles()
  const canEdit = session.role !== 'commercial'

  return (
    <div className="p-6 flex flex-col gap-6">
      <PageHeader
        title="Articles"
        description={`${articles.length} article${articles.length > 1 ? 's' : ''} au catalogue`}
        action={
          canEdit && (
            <Link href="/dashboard/articles/nouveau">
              <Button size="sm">
                <Plus className="size-4" />
                Nouvel article
              </Button>
            </Link>
          )
        }
      />
      <ArticleList articles={articles} role={session.role} />
    </div>
  )
}
