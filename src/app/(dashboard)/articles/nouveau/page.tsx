import { getSession } from '@/features/auth/session'
import { getCategories } from '@/features/article/queries/article'
import { NouvelArticleClient } from '@/features/article/components/nouvel-article-client'
import { PageHeader } from '@/features/dashboard/components/page-header'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default async function NouvelArticlePage() {
  const session = await getSession()
  if (!session || session.role === 'commercial') redirect('/dashboard/articles')

  const categories = await getCategories()

  return (
    <div className="p-6 flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/articles">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <PageHeader
          title="Nouvel article"
          description="Remplissez les informations du nouvel article"
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Informations article</CardTitle>
          <CardDescription>
            Le code est généré automatiquement pour les vitres, aluminiums et accessoires.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NouvelArticleClient categories={categories} />
        </CardContent>
      </Card>
    </div>
  )
}
