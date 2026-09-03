import { colorSaveMode } from './colors.component';
describe('ColorsComponent save identity', () => {
  it('creates when no original id exists', () => expect(colorSaveMode(null)).toBe('create'));
  it('updates the immutable original identity', () => expect(colorSaveMode('BLACK')).toBe('update'));
});
