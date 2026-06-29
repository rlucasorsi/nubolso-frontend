import { test, expect } from '@playwright/test';

// Credentials via env vars: E2E_EMAIL and E2E_PASSWORD
const EMAIL = process.env.E2E_EMAIL ?? '';
const PASSWORD = process.env.E2E_PASSWORD ?? '';

test.describe('InvoiceMonthlyChart — scroll inicial', () => {
  test.beforeEach(async ({ page }) => {
    if (!EMAIL || !PASSWORD) {
      test.skip(
        true,
        'E2E_EMAIL e E2E_PASSWORD não definidos. Execute: E2E_EMAIL=x E2E_PASSWORD=y npx playwright test',
      );
    }

    await page.goto('/login');
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    // Aguarda redirecionamento para o dashboard
    await page.waitForURL('**/dashboard', { timeout: 15_000 });
  });

  test('gráfico deve aparecer scrollado para a fatura aberta sem trocar de aba', async ({
    page,
  }) => {
    // Aguarda o container de scroll do gráfico aparecer
    const chartScroll = page.locator('[data-testid="invoice-chart-scroll"]');
    await chartScroll.waitFor({ state: 'visible', timeout: 15_000 });

    // Aguarda os dados carregarem (pelo menos uma barra com valor > 0)
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="invoice-chart-scroll"]');
        return el && el.querySelectorAll('button[style*="minWidth"]').length > 0;
      },
      { timeout: 10_000 },
    );

    // Coleta métricas do scroll container
    const metrics = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="invoice-chart-scroll"]') as HTMLDivElement;
      if (!el) return null;
      return {
        scrollLeft: el.scrollLeft,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        childCount: el.children.length,
      };
    });

    expect(metrics).not.toBeNull();
    console.log('Chart metrics on first load:', metrics);

    // O container deve ser scrollável (conteúdo maior que a área visível)
    expect(metrics!.scrollWidth).toBeGreaterThan(metrics!.clientWidth);

    // O scroll deve estar em posição não-zero (posicionado na fatura aberta, não no início)
    expect(metrics!.scrollLeft).toBeGreaterThan(0);
  });

  test('scroll deve ser igual antes e depois de trocar de aba', async ({ page }) => {
    const chartScroll = page.locator('[data-testid="invoice-chart-scroll"]');
    await chartScroll.waitFor({ state: 'visible', timeout: 15_000 });

    // Aguarda dados carregarem
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="invoice-chart-scroll"]');
        return el && el.scrollWidth > el.clientWidth;
      },
      { timeout: 10_000 },
    );

    // Posição inicial (antes de trocar de aba)
    const scrollBefore = await page.evaluate(
      () =>
        (document.querySelector('[data-testid="invoice-chart-scroll"]') as HTMLDivElement)
          ?.scrollLeft,
    );

    // Troca para "dias de período"
    await page
      .locator('button, [role="tab"]')
      .filter({ hasText: /dias|period/i })
      .first()
      .click();
    await page.waitForTimeout(300);

    // Volta para "visão geral"
    await page
      .locator('button, [role="tab"]')
      .filter({ hasText: /visão geral|overview/i })
      .first()
      .click();
    await chartScroll.waitFor({ state: 'visible', timeout: 5_000 });
    await page.waitForTimeout(300);

    // Posição após trocar de aba
    const scrollAfter = await page.evaluate(
      () =>
        (document.querySelector('[data-testid="invoice-chart-scroll"]') as HTMLDivElement)
          ?.scrollLeft,
    );

    console.log(`scrollLeft before tab switch: ${scrollBefore}, after: ${scrollAfter}`);

    // Ambos devem ser iguais (ou muito próximos) — sem necessidade de trocar de aba para corrigir
    expect(Math.abs((scrollAfter ?? 0) - (scrollBefore ?? 0))).toBeLessThan(5);
    expect(scrollBefore).toBeGreaterThan(0);
  });
});
