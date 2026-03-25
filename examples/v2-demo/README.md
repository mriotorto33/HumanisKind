# HIK v2.0 Demo: Pixel 10 Simulator & Telemetry Middleware

Este demo demuestra el flujo de integridad en tiempo real para streams de video (v2.0).

## Requisitos
- Node.js instalado
- Las dependencias de la raíz instaladas

## Instalación
Desde la raíz del proyecto:
```bash
cd examples/v2-demo
npm install
```

## Ejecución

### 1. Iniciar Middleware (Simulación de Cloudflare Worker)
En una terminal:
```bash
npm run start:middleware
```

### 2. Iniciar Simulador Pixel 10 (Broadcaster honesto)
En otra terminal:
```bash
npm run start:simulator
```

### 3. Iniciar Simulador Malicioso (Opcional)
Para simular un ataque de deepfake o manipulación de telemetría:
```bash
$env:SIM_MALICIOUS="true"; npm run start:simulator
```

## Dashboard
Puedes ver los resultados en tiempo real en:
[http://localhost:3000](http://localhost:3000)
