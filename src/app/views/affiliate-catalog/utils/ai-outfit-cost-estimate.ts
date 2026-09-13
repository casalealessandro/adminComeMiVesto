import { AiOutfitPreviewResult, AiOutfitTokenUsage } from '../models/affiliate-catalog-api.models';

const TOKENS_PER_MILLION = 1_000_000;

export const AI_OUTFIT_PRICING_AS_OF = '2026-09-13';
export const AI_OUTFIT_USD_TO_EUR_RATE = 0.86;

const TERRA_USD_PER_MILLION = {
  input: 2,
  cachedInput: 0.2,
  output: 12,
} as const;

/**
 * Sunburst input pricing differs between text and image tokens. The preview API only exposes
 * aggregate input tokens, so use the higher image-input rate to avoid understating the estimate.
 */
const SUNBURST_CONSERVATIVE_USD_PER_MILLION = {
  input: 8,
  cachedInput: 2,
  output: 30,
} as const;

export interface AiOutfitCostEstimate {
  stylistUsd: number;
  imageGenerationUsd: number;
  totalUsd: number;
  totalEur: number;
  usdToEurRate: number;
  pricingAsOf: string;
  conservativeImageInputPricing: boolean;
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

export const estimateAiOutfitCost = (preview: AiOutfitPreviewResult): AiOutfitCostEstimate | null => {
  const stylistUsage = preview.usage.stylist ?? preview.usage;
  if (preview.model !== 'gpt-5.6-terra') return null;

  const stylistUsd = usageCostUsd(stylistUsage, TERRA_USD_PER_MILLION);
  const imageUsage = preview.usage.imageGeneration;
  let imageGenerationUsd = 0;

  if (imageUsage) {
    const models = imageUsage.model.split(',').map((model) => model.trim()).filter(Boolean);
    if (!models.length || models.some((model) => model !== 'gpt-image-2.5-sunburst')) return null;
    imageGenerationUsd = usageCostUsd(imageUsage, SUNBURST_CONSERVATIVE_USD_PER_MILLION);
  }

  const totalUsd = stylistUsd + imageGenerationUsd;
  return {
    stylistUsd,
    imageGenerationUsd,
    totalUsd,
    totalEur: totalUsd * AI_OUTFIT_USD_TO_EUR_RATE,
    usdToEurRate: AI_OUTFIT_USD_TO_EUR_RATE,
    pricingAsOf: AI_OUTFIT_PRICING_AS_OF,
    conservativeImageInputPricing: Boolean(imageUsage),
  };
};
