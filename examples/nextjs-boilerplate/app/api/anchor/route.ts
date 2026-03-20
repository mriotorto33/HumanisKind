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

    // Read Pinata keys from the environment or fallback to the provided demo keys
    const pinataApiKey = process.env.PINATA_API_KEY || "af3c785db618cf47c992";
    const pinataSecretKey = process.env.PINATA_SECRET_KEY || "296ed0fbecbe1e0f2b52dde9c2fd107d12131bfdb821eb93c15739ae3614169f";
    
    // Automatically fallback to mock IPFS only if keys are completely missing
    const useMockIPFS = !(pinataApiKey && pinataSecretKey);

    const config = {
      useMockIPFS,
      blockchain: {
        rpcUrl: process.env.RPC_URL || "http://127.0.0.1:8545",
        privateKey: process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        contractAddress: process.env.HIK_REGISTRY_ADDRESS || "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
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
