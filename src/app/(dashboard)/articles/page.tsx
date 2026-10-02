import { getSession } from '@/features/auth/session'
import { getArticles, getCategories } from '@/features/article/queries/article'
import { ArticleList } from '@/features/article/components/article-list'
import { ArticleForm } from '@/features/article/components/article-form'
import { PageHeader } from '@/features/dashboard/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ArticlesPage() {
  const session = await getSession()
  const [articles, categories] = await Promise.all([getArticles(), getCategories()])
  const canEdit = session?.role !== 'commercial'

  return (
    <div className="p-6 flex flex-col gap-6">
      <PageHeader
        title="Articles"
        description={`${articles.length} article${articles.length > 1 ? 's' : ''} au catalogue`}
      />

      <ArticleList articles={articles} role={session!.role} />

      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ajouter un article</CardTitle>
          </CardHeader>
          <CardContent>
            <ArticleForm categories={categories} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
