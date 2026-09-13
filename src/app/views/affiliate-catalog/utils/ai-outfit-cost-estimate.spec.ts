import { AiOutfitPreviewResult } from '../models/affiliate-catalog-api.models';
import {
  AI_OUTFIT_USD_TO_EUR_RATE,
  estimateAiOutfitCost,
} from './ai-outfit-cost-estimate';

const preview = (): AiOutfitPreviewResult => ({
  generatedAt: 1,
  model: 'gpt-5.6-terra',
  providerResponseId: 'resp-1',
  request: { gender: 'MAN', season: 'SPRING', occasion: 'EVERYDAY', style: 'CASUAL' },
  candidatesEvaluated: 36,
  imagesEvaluated: 36,
  usage: {
    inputTokens: 1300,
    cachedInputTokens: 100,
    outputTokens: 900,
    totalTokens: 2200,
    stylist: { inputTokens: 1000, cachedInputTokens: 100, outputTokens: 100, totalTokens: 1100 },
    imageGeneration: {
      inputTokens: 300,
      cachedInputTokens: 0,
      outputTokens: 800,
      totalTokens: 1100,
      model: 'gpt-image-2.5-sunburst',
      imagesGenerated: 3,
      providerResponseIds: ['img-1', 'img-2', 'img-3'],
    },
  },
  outfits: [],
});

describe('AI outfit cost estimate', () => {
  it('prices measurable Terra calls and converts USD to EUR', () => {
    const cost = estimateAiOutfitCost(preview());

    expect(cost).not.toBeNull();
    expect(cost!.stylistUsd).toBeCloseTo(0.00302, 8);
    expect(cost!.imageOrchestrationUsd).toBeCloseTo(0.0102, 8);
    expect(cost!.measurableTotalUsd).toBeCloseTo(0.01322, 8);
    expect(cost!.measurableTotalEur).toBeCloseTo(0.01322 * AI_OUTFIT_USD_TO_EUR_RATE, 8);
    expect(cost!.includesImageModelCost).toBeFalse();
  });

  it('prices cached input at the dedicated cached Terra rate', () => {
    const value = preview();
    value.usage.stylist = {
      inputTokens: 1_000_000,
      cachedInputTokens: 1_000_000,
      outputTokens: 0,
      totalTokens: 1_000_000,
    };
    value.usage.imageGeneration = undefined;

    const cost = estimateAiOutfitCost(value);
    expect(cost!.stylistUsd).toBeCloseTo(0.2, 8);
    expect(cost!.imageOrchestrationUsd).toBe(0);
  });

  it('does not invent a price for an unknown outer model', () => {
    const value = preview();
    value.model = 'future-model';
    expect(estimateAiOutfitCost(value)).toBeNull();
  });
});
