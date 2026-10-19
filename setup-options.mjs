/** Output-length options for initial profile setup. Actual ceilings are model/provider-specific. */
export const MIN_SETUP_OUTPUT_TOKENS=512;
export const MAX_SETUP_OUTPUT_TOKENS=65536;
export const DEFAULT_SETUP_OUTPUT_TOKENS=5000;
export function normalizeSetupOutputTokens(value){
 const n=Number(value);
 if(!Number.isFinite(n)||n<=0)return DEFAULT_SETUP_OUTPUT_TOKENS;
 return Math.min(MAX_SETUP_OUTPUT_TOKENS,Math.max(MIN_SETUP_OUTPUT_TOKENS,Math.trunc(n)));
}
