import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Página não encontrada — Fluxo de Caixa',
};

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Página não encontrada.</p>
      <Link
        href="/painel"
        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Ir para o Painel
      </Link>
    </div>
  );
}
