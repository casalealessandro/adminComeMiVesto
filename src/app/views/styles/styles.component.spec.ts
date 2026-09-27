import { OutfitStyle, OutfitStyleImage } from '../../services/taxonomy.service';
import { buildStyleColumns, buildStyleUpdate, isStyleIdReadonly, isStyleValid, MAX_IMAGE_BASE64_LENGTH, styleImageDataUrl } from './styles.component';

describe('StylesComponent helpers', () => {
  const man: OutfitStyleImage = { imageBase64: 'MAN', imageMimeType: 'image/jpeg', imageFileName: 'c-u.jpg' };
  const woman: OutfitStyleImage = { imageBase64: 'WOMAN', imageMimeType: 'image/jpeg', imageFileName: 'c-d.jpg' };
  const style: OutfitStyle = { id: 'C', value: 'Casual', parent: null, order: 10, gender: ['U', 'D'], images: { U: man, D: woman } };

  it('builds a data URL without changing the stored base64', () => {
    expect(styleImageDataUrl(man)).toBe('data:image/jpeg;base64,MAN');
    expect(man.imageBase64).toBe('MAN');
  });

  it('requires at least one gender', () => {
    expect(isStyleValid({ ...style, gender: [] })).toBeFalse();
    expect(isStyleValid(style)).toBeTrue();
  });

  it('makes the id readonly only while editing', () => {
    expect(isStyleIdReadonly('C')).toBeTrue();
    expect(isStyleIdReadonly(null)).toBeFalse();
  });

  it('sends only a changed Uomo image', () => {
    const payload = buildStyleUpdate(style, { U: true, D: false });
    expect(payload.images).toEqual({ U: man });
    expect(payload.images?.D).toBeUndefined();
  });

  it('sends only a changed Donna image', () => {
    const payload = buildStyleUpdate(style, { U: false, D: true });
    expect(payload.images).toEqual({ D: woman });
    expect(payload.images?.U).toBeUndefined();
  });

  it('removes Uomo without touching Donna', () => {
    const payload = buildStyleUpdate({ ...style, images: { ...style.images, U: null } }, { U: true, D: false });
    expect(payload.images).toEqual({ U: null });
  });

  it('defines the 350000 character base64 limit', () => expect(MAX_IMAGE_BASE64_LENGTH).toBe(350000));

  it('builds columns for the shared DataGrid including edit and delete actions', () => {
    const columns = buildStyleColumns()[0].data;
    expect(columns.some(column => column.dataField === 'imageU' && column.type === 'campoImg')).toBeTrue();
    expect(columns.filter(column => column.type === 'campoButton').map(column => column.button.name)).toEqual(['edit', 'delete']);
  });
});
