# 🌐 HIK Production Edge Proxy (YouTube Live Relay)

This directory contains the **Production-Ready** Cloudflare Worker designed to securely sit between a hardware stream (like a Google Pixel 10) and YouTube Live's ingestion servers. 

The worker acts as a **Zero-Trust Reverse Proxy**. It physically intercepts the HLS chunks (`.ts`, `.m3u8`), uses the native Web Crypto API to furiously verify the Ed25519 `CMCD-Custom-hik-sig` cryptographic telemetry in under `O(1)` time, and dynamically pipes legally compliant chunks straight into `https://a.upload.youtube.com/http_upload_hls`.

## ⚙️ Configuration & Deployment

To deploy this straight to Cloudflare for a production demo, Fefo's infrastructure team must set two environment variables (Cloudflare Secrets):

1. `HIK_BROADCASTER_PUBLIC_KEY`: The raw PEM Ed25519 Public Key matching the private key the Pixel 10 StrongBox used to sign the CMCD headers.
2. `YOUTUBE_STREAM_KEY`: The actual YouTube Live ID key assigned to the broadcasting channel.

## 🚀 Running Locally via Wrangler

This directory natively supports Wrangler for local HTTP routing tests! Follow these steps to verify it offline:

1. Create a local `.dev.vars` file in this directory and populate the exact API keys.
2. Boot the simulator: 
```bash
npx wrangler dev worker.ts
```
3. Your local server is now acting as an airtight YouTube firewall. Point your local test scripts directly at `http://localhost:8787/`. Unsigned or tampered chunks trigger an instant 403. Clean chunks trigger a direct YouTube pipeline output.
