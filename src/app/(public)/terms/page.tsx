import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Uso — NuBolso',
};

export default function TermsPage() {
  const lastUpdated = '22 de junho de 2025';

  return (
    <main className="min-h-dvh bg-background text-foreground px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Voltar
          </Link>
          <h1 className="mt-4 text-3xl font-bold font-display text-primary">Termos de Uso</h1>
          <p className="mt-1 text-sm text-muted-foreground">Última atualização: {lastUpdated}</p>
        </div>

        <Section title="1. Aceitação dos termos">
          <p>
            Ao criar uma conta ou utilizar o <strong>NuBolso</strong>, você concorda com estes Termos de Uso
            e com nossa{' '}
            <Link href="/privacy">Política de Privacidade</Link>
            . Se não concordar, não utilize o serviço.
          </p>
        </Section>

        <Section title="2. Descrição do serviço">
          <p>
            O NuBolso é um aplicativo de controle financeiro pessoal que permite registrar transações,
            acompanhar faturas de cartão de crédito, definir metas financeiras e visualizar projeções
            de saldo.
          </p>
          <p>
            O serviço é fornecido "como está" e pode ser alterado, suspenso ou encerrado a qualquer momento,
            com aviso prévio sempre que possível.
          </p>
        </Section>

        <Section title="3. Elegibilidade">
          <p>
            Para utilizar o NuBolso, você deve ter pelo menos 18 anos ou a maioridade legal em sua
            jurisdição, e fornecer informações verdadeiras no cadastro.
          </p>
        </Section>

        <Section title="4. Responsabilidades do usuário">
          <p>Você é responsável por:</p>
          <ul>
            <li>Manter a confidencialidade de suas credenciais de acesso.</li>
            <li>Garantir que as informações financeiras inseridas são de uso pessoal e legal.</li>
            <li>Não utilizar o serviço para fins ilegais, fraudulentos ou que violem direitos de terceiros.</li>
            <li>Não tentar acessar contas ou dados de outros usuários.</li>
          </ul>
        </Section>

        <Section title="5. Limitação de responsabilidade">
          <p>
            O NuBolso fornece ferramentas de organização financeira pessoal. <strong>Não somos uma
            instituição financeira e não prestamos assessoria financeira, de investimentos ou tributária.</strong>
          </p>
          <p>
            Não nos responsabilizamos por decisões financeiras tomadas com base nas informações exibidas
            no aplicativo, por perdas ou danos decorrentes de erros de dados inseridos pelo usuário,
            ou por falhas técnicas fora de nosso controle.
          </p>
        </Section>

        <Section title="6. Propriedade intelectual">
          <p>
            Todo o conteúdo do NuBolso — código, design, textos e marca — é protegido por direitos
            autorais. É proibida a reprodução, modificação ou distribuição sem autorização prévia por escrito.
          </p>
          <p>
            Os dados financeiros que você insere permanecem de sua propriedade. Ao usar o serviço,
            você nos concede licença limitada para processar esses dados com o único propósito de
            fornecer o serviço.
          </p>
        </Section>

        <Section title="7. Encerramento de conta">
          <p>
            Você pode excluir sua conta a qualquer momento em <strong>Configurações → Meus Dados</strong>.
            Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos.
          </p>
        </Section>

        <Section title="8. Alterações nos termos">
          <p>
            Podemos atualizar estes Termos periodicamente. Alterações significativas serão comunicadas
            por e-mail ou notificação no aplicativo. O uso continuado após a notificação implica
            aceitação dos novos termos.
          </p>
        </Section>

        <Section title="9. Lei aplicável">
          <p>
            Estes Termos são regidos pelas leis brasileiras. Eventuais disputas serão submetidas
            ao foro da Comarca de São Paulo, SP, salvo disposição legal em contrário.
          </p>
        </Section>

        <Section title="10. Contato">
          <p>
            Dúvidas sobre estes termos:{' '}
            <a href="mailto:contato@nubolso.com" className="text-primary underline underline-offset-2 hover:opacity-80">
              contato@nubolso.com
            </a>
          </p>
        </Section>

        <div className="border-t border-white/10 pt-6 text-xs text-muted-foreground">
          <Link href="/privacy" className="text-primary underline underline-offset-2 hover:opacity-80">
            Política de Privacidade
          </Link>
          {' · '}
          <Link href="/login" className="hover:text-foreground transition-colors">
            Voltar ao login
          </Link>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="text-sm text-muted-foreground space-y-2 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </div>
    </section>
  );
}
