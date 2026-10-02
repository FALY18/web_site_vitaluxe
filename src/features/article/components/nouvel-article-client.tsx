'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createArticle } from '@/features/article/action/article'
import { ArticleForm } from '@/features/article/components/article-form'
import type { ArticleFormState } from '@/features/article/types'

type Props = {
  categories: { id: number; nom: string }[]
}

const initial: ArticleFormState = {}

export function NouvelArticleClient({ categories }: Props) {
  const router = useRouter()

  return (
    <ArticleForm
      categories={categories}
      onSuccess={() => router.push('/dashboard/articles')}
    />
  )
}
