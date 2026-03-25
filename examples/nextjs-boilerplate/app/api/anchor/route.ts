import { NextResponse } from "next/server";
import { signAndAnchor, hashAssetFile } from "human-is-kind-sdk"; 
import * as path from "path";
import * as fs from "fs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const simulateKmirFailure = body.simulateKmirFailure === true;

    const assetPath = path.join(process.cwd(), "public", "demo-image.jpg");
    if (!fs.existsSync(assetPath)) fs.writeFileSync(assetPath, "AI Generated Image Data...");

    const actualHash = "0x" + hashAssetFile(assetPath);

    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_KEY;
    
    // Strictly live IPFS as requested
    const useMockIPFS = false;

    const config = {
      useMockIPFS,
      blockchain: {
        // Zero-config Vercel deployment: Auto-connect to Sepolia if built on Vercel without an explicit RPC
        rpcUrl: process.env.RPC_URL || (process.env.VERCEL === "1" ? "https://ethereum-sepolia-rpc.publicnode.com" : "http://127.0.0.1:8545"),
        privateKey: process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        contractAddress: process.env.HIK_REGISTRY_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      },
      storage: {
        pinataApiKey,
        pinataSecretKey
      }, 
      kmirPolicy: {
        ai_agent_id: "humaniskind-nextjs-demo-agent",
        source_corpus_hash: actualHash,
        allowed_transformations: [],
        guardrails: {
          // If simulate failure is true, we dangerously omit the deepfake flag to trigger the crash
          ...(simulateKmirFailure ? {} : { no_deepfake_manipulation: true }),
          transparent_training_data: true,
          human_in_the_loop: true
        }
      },
      agentRules: {
        agent_id: "humaniskind-nextjs-demo-agent",
        vendor: "HumanIsKind",
        compliance_flags: {
          allows_synthetic_derivatives: false,
          requires_human_verification: true,
          respects_opt_out_crawling: true
        }
      }
    };

    const certificate = await signAndAnchor(assetPath, config as any);

    return NextResponse.json({ success: true, certificate });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
