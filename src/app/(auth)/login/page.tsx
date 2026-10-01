import Image from 'next/image'
import { LoginForm } from '@/features/auth/components/login-form'

export const metadata = { title: 'Connexion' }

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 text-center flex flex-col items-center gap-3">
        <div className="rounded-full p-1 ring-2 ring-[#c8a96e]/60 shadow-[0_0_18px_rgba(200,169,110,0.25)]">
          <Image src="/logo.jpeg" alt="VITALUXE" width={80} height={80} className="rounded-full object-cover" priority />
        </div>
      </div>
      <LoginForm />
    </main>
  )
}
