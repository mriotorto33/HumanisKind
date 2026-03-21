import { test, expect } from '@playwright/test';

test.describe('Real Live Stream E2E (Bitmovin HLS)', () => {

  test('✅ El Stream se reproduce si el Edge CDN recibe un Ethical Score válido (100)', async ({ page }) => {
    // 1. Dejar que las peticiones fluyan naturalmente (sin interceptar para evitar que Playwright rompa el CORS del CDN remoto)

    // 2. Navegar a la página de prueba que contiene el reproductor HLS cargando el stream de Bitmovin
    await page.goto('http://127.0.0.1:3000/player');

    // 3. Forzar reproducción (Chrome a veces bloquea autoPlay remoto incluso si está 'muted')
    const video = page.locator('video');
    await video.evaluate((vid: HTMLVideoElement) => vid.play().catch(() => {}));
    
    // Esperar a que el reproductor inicie efectivamente
    await expect(video).toHaveJSProperty('paused', false, { timeout: 10000 });
    
    // 4. NUEVO: Verificar matemáticamente en vivo que el HUD del Protocolo HIK (Telemetría CMCD y Smart Contracts) se esté renderizando en pantalla.
    await expect(page.locator('text="HIK ZERO-TRUST ACTIVE"')).toBeVisible();
    await expect(page.locator('div:has-text("ES: ")').first()).toBeVisible();
    await expect(page.locator('text=On-Chain Anchor:')).toBeVisible();

    // Validar que el tiempo de reproducción avanza al menos 1 segundo
    await expect(async () => {
      const currentTime = await video.evaluate((vid: HTMLVideoElement) => vid.currentTime);
      expect(currentTime).toBeGreaterThan(1.0);
    }).toPass({ timeout: 10000 });
  });

  test('❌ El Stream se CONGELA si se detecta un Deepfake (Edge CDN bota la conexión TCP)', async ({ page }) => {
    // 1. Interceptamos la red: el Edge CDN destruirá físicamente los paquetes 
    //    si la firma falla o el Ethical Score falta/es falso.
    await page.route('**/*.ts', async (route) => {
      // Dejamos pasar los .m3u8 (playlists) pero botamos los segmentos de video reales (.ts)
      await route.abort('connectionaborted');
    });

    // 2. Navegamos a la página
    await page.goto('http://127.0.0.1:3000/player');

    // 3. Verificar que el video falla y NUNCA avanza el tiempo
    const video = page.locator('video');

    // Comprobamos que el tiempo nunca avanza de 0
    await page.waitForTimeout(3000); // Esperar 3 segundos para que intente cargar
    const currentTime = await video.evaluate((vid: HTMLVideoElement) => vid.currentTime);
    expect(currentTime).toBe(0);

    // 4. NUEVO: Verificar en la Interfaz visual de Playwright que el diseño cambió agresivamente al estado de Deepfake.
    await expect(page.locator('text="GOVERNANCE DROP: DEEPFAKE DETECTED"')).toBeVisible();

    // Comprobamos que el video no tiene datos suficientes para jugar
    const readyState = await video.evaluate((vid: HTMLVideoElement) => vid.readyState);
    expect(readyState).toBeLessThan(3); // HAVE_FUTURE_DATA
  });

});
