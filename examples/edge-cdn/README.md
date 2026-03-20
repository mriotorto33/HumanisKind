# Edge CDN Telemetry Interceptor

This boilerplate demonstrates how to configure your CDN (e.g. **Cloudflare Workers** or **Fastly Compute@Edge**) to enforce Human Is Kind (HIK) **CMCDv2 Telemetry Guardrails**.

By inspecting the incoming headers for `hik-es` (Ethical Score) and `hik-ps` (Provenance Score), your edge nodes can deterministically disconnect and drop streaming video frames *before* they interact with the origin server or get served to your global viewers if a Deepfake or untagged synthentic layer is detected upstream!

## Usage

Deploy `worker.ts` as a Cloudflare Worker proxying traffic to your main HLS/DASH media origin server.
