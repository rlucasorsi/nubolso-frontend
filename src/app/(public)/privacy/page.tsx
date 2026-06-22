import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade — NuBolso',
};

export default function PrivacyPage() {
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
          <h1 className="mt-4 text-3xl font-bold font-display text-primary">Política de Privacidade</h1>
          <p className="mt-1 text-sm text-muted-foreground">Última atualização: {lastUpdated}</p>
        </div>

        <Section title="1. Quem somos">
          <p>
            O <strong>NuBolso</strong> é um aplicativo de controle financeiro pessoal. Neste documento,
            "nós" refere-se aos responsáveis pelo NuBolso, e "você" refere-se ao usuário do aplicativo.
          </p>
        </Section>

        <Section title="2. Dados que coletamos">
          <p>Coletamos apenas os dados necessários para o funcionamento do serviço:</p>
          <ul>
            <li><strong>Cadastro:</strong> nome e endereço de e-mail.</li>
            <li><strong>Financeiros:</strong> transações, saldo inicial, cartões de crédito, metas e templates recorrentes que você cadastra voluntariamente.</li>
            <li><strong>Técnicos:</strong> token de sessão (cookie essencial) para manter você autenticado.</li>
          </ul>
          <p>Não coletamos dados de localização, contatos, câmera ou qualquer informação além do descrito acima.</p>
        </Section>

        <Section title="3. Como usamos seus dados">
          <p>Seus dados são utilizados exclusivamente para:</p>
          <ul>
            <li>Prestar o serviço de controle financeiro pessoal.</li>
            <li>Identificar e autenticar sua conta.</li>
            <li>Enviar e-mails transacionais (confirmação de conta, redefinição de senha).</li>
          </ul>
          <p>Não vendemos, alugamos nem compartilhamos seus dados com terceiros para fins publicitários.</p>
        </Section>

        <Section title="4. Compartilhamento de dados">
          <p>
            Seus dados podem ser processados por prestadores de serviço técnico (hospedagem de banco de dados,
            infraestrutura de nuvem) operando sob acordos de confidencialidade. Não há compartilhamento
            com terceiros para fins comerciais ou de marketing.
          </p>
        </Section>

        <Section title="5. Cookies">
          <p>
            Utilizamos apenas um cookie essencial (<code>accessToken</code>) para manter sua sessão ativa.
            Esse cookie é necessário para o funcionamento do aplicativo e não pode ser desativado.
            Não utilizamos cookies de rastreamento ou publicidade.
          </p>
        </Section>

        <Section title="6. Seus direitos (LGPD)">
          <p>Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
          <ul>
            <li><strong>Confirmação e acesso:</strong> saber quais dados temos sobre você.</li>
            <li><strong>Exportação:</strong> baixar todos os seus dados em formato legível (disponível em Configurações → Meus Dados).</li>
            <li><strong>Correção:</strong> atualizar seus dados diretamente no aplicativo.</li>
            <li><strong>Exclusão:</strong> apagar sua conta e todos os dados associados (disponível em Configurações → Meus Dados).</li>
            <li><strong>Revogação de consentimento:</strong> você pode encerrar sua conta a qualquer momento.</li>
          </ul>
        </Section>

        <Section title="7. Retenção de dados">
          <p>
            Seus dados são mantidos enquanto sua conta estiver ativa. Ao excluir sua conta, todos os dados
            são removidos permanentemente de nossos sistemas em até 30 dias.
          </p>
        </Section>

        <Section title="8. Segurança">
          <p>
            Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo transmissão
            via HTTPS, armazenamento de senhas com hash e controles de acesso. Nenhum sistema é 100%
            seguro, mas nos comprometemos a notificá-lo em caso de incidente que afete seus dados.
          </p>
        </Section>

        <Section title="9. Contato">
          <p>
            Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato:
            <br />
            <strong>E-mail:</strong>{' '}
            <a href="mailto:privacidade@nubolso.app" className="text-primary underline underline-offset-2 hover:opacity-80">
              privacidade@nubolso.app
            </a>
          </p>
        </Section>

        <div className="border-t border-white/10 pt-6 text-xs text-muted-foreground">
          <Link href="/terms" className="text-primary underline underline-offset-2 hover:opacity-80">
            Termos de Uso
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
      <div className="text-sm text-muted-foreground space-y-2 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-foreground [&_code]:bg-white/10 [&_code]:px-1 [&_code]:rounded [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </div>
    </section>
  );
}
