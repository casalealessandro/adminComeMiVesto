import { OutfitStyleImage } from '../../services/taxonomy.service';
import { buildOccasionUpdate, MAX_OCCASION_IMAGE_BASE64_LENGTH, occasionImageDataUrl } from './occasions.component';

describe('Occasion image helpers', () => {
  const image: OutfitStyleImage = {
    imageBase64: 'YWJjZA==',
    imageMimeType: 'image/jpeg',
    imageFileName: 'OFFICE.jpg',
  };

  it('renders a preview data URL using the persisted image', () => {
    expect(occasionImageDataUrl(image)).toBe('data:image/jpeg;base64,YWJjZA==');
    expect(occasionImageDataUrl(null)).toBe('');
  });

  it('does not send unchanged image data on normal occasion edits', () => {
    expect(buildOccasionUpdate({ value: 'Ufficio', order: 2, active: true }, false, image))
      .toEqual({ value: 'Ufficio', order: 2, active: true });
  });

  it('sends a new image only when replaced', () => {
    expect(buildOccasionUpdate({ value: 'Ufficio', order: 2, active: true }, true, image))
      .toEqual({ value: 'Ufficio', order: 2, active: true, image });
  });

  it('supports explicit image removal without changing the occasion ID', () => {
    expect(buildOccasionUpdate({ value: 'Ufficio', order: 2, active: true }, true, null))
      .toEqual({ value: 'Ufficio', order: 2, active: true, image: null });
  });

  it('shares the backend 350000-character limit', () => {
    expect(MAX_OCCASION_IMAGE_BASE64_LENGTH).toBe(350000);
  });
});
