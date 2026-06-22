import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Perguntas Frequentes — NuBolso',
};

const FAQS = [
  {
    q: 'O que é o NuBolso?',
    a: 'O NuBolso é um aplicativo de controle financeiro pessoal. Você pode registrar entradas e saídas, acompanhar faturas de cartão de crédito, criar metas financeiras e visualizar projeções de saldo ao longo do tempo.',
  },
  {
    q: 'Como configuro o saldo inicial?',
    a: 'Acesse Configurações → Saldo Inicial. Informe o valor que você tinha em uma data de referência. O NuBolso usará esse ponto de partida para calcular seu saldo a cada dia com base nas transações registradas.',
  },
  {
    q: 'O que é o "Período do Mês"?',
    a: 'O período define quando começa e termina o mês financeiro para você. Por exemplo, se suas contas chegam todo dia 10, você pode definir que seu mês começa no dia 10 — o painel e os relatórios refletirão esse ciclo.',
  },
  {
    q: 'Como funciona o cartão de crédito?',
    a: 'Adicione seu cartão em Cartões e informe os dias de fechamento e vencimento. Ao registrar uma compra parcelada, o app distribui automaticamente as parcelas nas faturas corretas e mostra o impacto no seu saldo projetado.',
  },
  {
    q: 'O que é antecipar parcelas?',
    a: 'A antecipação permite pagar parcelas futuras na fatura atual, geralmente com desconto. Na tela de detalhe da fatura, clique em "Antecipar" em uma compra parcelada e informe o valor negociado. Para desfazer, clique no ícone de reverter ao lado do adiantamento.',
  },
  {
    q: 'Posso importar meu extrato bancário?',
    a: 'Sim. O NuBolso suporta importação de arquivos OFX (formato padrão dos bancos brasileiros). Acesse Lançamentos → Importar e selecione o arquivo exportado pelo seu banco. O app identifica duplicatas automaticamente.',
  },
  {
    q: 'Posso criar transações recorrentes?',
    a: 'Sim. Em Recorrentes, você pode cadastrar contas fixas (aluguel, academia, assinaturas) com valor estimado e dia de vencimento. O app cria as transações automaticamente todo mês.',
  },
  {
    q: 'Como exportar meus dados?',
    a: 'Acesse Configurações → Meus Dados → Exportar meus dados. Um arquivo JSON com todas as suas informações será baixado automaticamente. Esse recurso existe para garantir seus direitos sob a LGPD.',
  },
  {
    q: 'Como excluir minha conta?',
    a: 'Acesse Configurações → Meus Dados → Excluir conta. Confirme a ação na tela de confirmação. Todos os seus dados serão removidos permanentemente. Essa ação não pode ser desfeita.',
  },
  {
    q: 'O NuBolso é seguro?',
    a: 'Sim. Todas as comunicações são criptografadas via HTTPS, senhas são armazenadas com hash seguro (nunca em texto plano) e seu token de sessão fica em cookie protegido. Não compartilhamos seus dados com terceiros.',
  },
  {
    q: 'Não encontrei o que procurava. Como falo com o suporte?',
    a: 'Entre em contato pelo formulário de suporte disponível no menu lateral (ícone de balão) ou em Configurações → Suporte. Respondemos em até 2 dias úteis.',
  },
];

export default function FaqPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Voltar
          </Link>
          <h1 className="mt-4 text-3xl font-bold font-display text-primary">Perguntas Frequentes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Respostas para as dúvidas mais comuns sobre o NuBolso.</p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <details
              key={i}
              className="group glass-card border border-white/10 rounded-2xl overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none select-none hover:bg-white/5 transition-colors">
                <span className="text-sm font-semibold text-foreground">{faq.q}</span>
                <span className="shrink-0 text-muted-foreground text-lg leading-none transition-transform duration-200 group-open:rotate-45">+</span>
              </summary>
              <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-white/5 pt-3">
                {faq.a}
              </div>
            </details>
          ))}
        </div>

        <div className="border-t border-white/10 pt-6 text-sm text-muted-foreground">
          <p>
            Ainda com dúvidas?{' '}
            <Link href="/privacy" className="text-primary underline underline-offset-2 hover:opacity-80">
              Política de Privacidade
            </Link>
            {' · '}
            <Link href="/terms" className="text-primary underline underline-offset-2 hover:opacity-80">
              Termos de Uso
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
