import { AiOutfitPreviewResult, AiOutfitTokenUsage } from '../models/affiliate-catalog-api.models';

const TOKENS_PER_MILLION = 1_000_000;

export const AI_OUTFIT_PRICING_AS_OF = '2026-09-13';
export const AI_OUTFIT_USD_TO_EUR_RATE = 0.86;

const TERRA_USD_PER_MILLION = {
  input: 2,
  cachedInput: 0.2,
  output: 12,
} as const;

export interface AiOutfitCostEstimate {
  stylistUsd: number;
  imageOrchestrationUsd: number;
  measurableTotalUsd: number;
  measurableTotalEur: number;
  usdToEurRate: number;
  pricingAsOf: string;
  includesImageModelCost: false;
}

const usageCostUsd = (
  usage: AiOutfitTokenUsage,
  prices: Readonly<{ input: number; cachedInput: number; output: number }>,
): number => {
  const cachedInputTokens = Math.max(0, usage.cachedInputTokens ?? 0);
  const uncachedInputTokens = Math.max(0, usage.inputTokens - cachedInputTokens);
  const outputTokens = Math.max(0, usage.outputTokens);

  return (
    uncachedInputTokens * prices.input
    + cachedInputTokens * prices.cachedInput
    + outputTokens * prices.output
  ) / TOKENS_PER_MILLION;
};

/**
 * The preview backend currently exposes token usage from the GPT-5.6 Terra Responses calls.
 * For the three hero images those counters describe the outer Terra orchestration calls; the
 * Responses image-generation tool does not expose enough Sunburst billing detail in our payload
 * to reconstruct its exact cost. Therefore this estimate deliberately prices only measurable
 * Terra tokens and never presents the result as the complete OpenAI invoice cost.
 */
export const estimateAiOutfitCost = (preview: AiOutfitPreviewResult): AiOutfitCostEstimate | null => {
  if (preview.model !== 'gpt-5.6-terra') return null;

  const stylistUsage = preview.usage.stylist ?? preview.usage;
  const stylistUsd = usageCostUsd(stylistUsage, TERRA_USD_PER_MILLION);
  const imageOrchestrationUsd = preview.usage.imageGeneration
    ? usageCostUsd(preview.usage.imageGeneration, TERRA_USD_PER_MILLION)
    : 0;
  const measurableTotalUsd = stylistUsd + imageOrchestrationUsd;

  return {
    stylistUsd,
    imageOrchestrationUsd,
    measurableTotalUsd,
    measurableTotalEur: measurableTotalUsd * AI_OUTFIT_USD_TO_EUR_RATE,
    usdToEurRate: AI_OUTFIT_USD_TO_EUR_RATE,
    pricingAsOf: AI_OUTFIT_PRICING_AS_OF,
    includesImageModelCost: false,
  };
};
