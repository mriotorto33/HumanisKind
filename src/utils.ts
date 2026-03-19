export function normalizeHash(hash: string): string {
  return hash.startsWith("0x") ? hash : `0x${hash}`;
}