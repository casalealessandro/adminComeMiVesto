import { buildOutfitFormPayload, EDITABLE_OUTFIT_FIELDS } from './outfit-form.component';
import { Tag } from '../../../services/outfit.service';

describe('Outfit DynamicForm payload', () => {
  const tag = { id: 'tag1', name: 'Blazer', x: 0.3, y: 0.4, color: 'N', outfitCategory: 'outerwear' } as Tag;

  it('includes only supported editable fields, keeps tags and leaves derived metadata to backend', () => {
    const result = buildOutfitFormPayload({
      id: 'original-id',
      title: 'Outfit lavoro',
      gender: 'D',
      season: 'I',
      occasion: 'OFFICE',
      style: 'CL',
      status: 'rifiutato',
      color: ['N'],
      visits: 200,
      userId: 'other-user',
      updatedAt: 12,
    }, 'https://example.org/look.jpg', [tag], 'https://example.org/look.jpg');
    expect(result).toEqual({
      title: 'Outfit lavoro',
      gender: 'D',
      season: 'I',
      occasion: 'OFFICE',
      style: 'CL',
      imageUrl: 'https://example.org/look.jpg',
      tags: [tag],
    });
    expect(EDITABLE_OUTFIT_FIELDS).toEqual(['title', 'description', 'gender', 'style', 'season', 'occasion']);
  });

  it('supports imageUrl in a Firebase form when photo editor has not changed the image', () => {
    const result = buildOutfitFormPayload(
      { title: 'Look', imageUrl: 'https://example.org/new.jpg' },
      'https://example.org/old.jpg',
      [], 'https://example.org/old.jpg',
    );
    expect(result.imageUrl).toBe('https://example.org/new.jpg');
  });

  it('prioritizes photo editor changes over an old form value', () => {
    const result = buildOutfitFormPayload(
      { title: 'Look', imageUrl: 'https://example.org/old.jpg' },
      'https://example.org/from-photo.jpg',
      [], 'https://example.org/old.jpg',
    );
    expect(result.imageUrl).toBe('https://example.org/from-photo.jpg');
  });
});
