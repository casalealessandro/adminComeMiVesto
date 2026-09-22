import { AiOutfitPreviewOutfit } from './affiliate-catalog-api.models';

export interface AiOutfitPublishRequest {
  title: string;
  description: string;
  previewImageUrl: string;
  gender: AiOutfitPreviewOutfit['gender'];
  season: AiOutfitPreviewOutfit['season'];
  style: AiOutfitPreviewOutfit['style'];
  creatorUid?: string;
  draftId?: string;
  products: Array<{
    catalogProductId: string;
    role: string;
    x?: number;
    y?: number;
  }>;
}

export interface AiOutfitPublishedResult {
  id: string;
  title: string;
  imageUrl: string;
  status: 'approved';
  userId: string;
  createdAt: number;
}
