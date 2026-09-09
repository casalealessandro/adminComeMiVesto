import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicFileBoxComponent } from './dynamic-file-box.component';

describe('DynamicFileBoxComponent characterization', () => {
  let component: DynamicFileBoxComponent;
  let fixture: ComponentFixture<DynamicFileBoxComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DynamicFileBoxComponent] }).compileComponents();
    fixture = TestBed.createComponent(DynamicFileBoxComponent); component = fixture.componentInstance;
    component.config = { name: 'photo', type: 'fileBox', typeInput: 'file', label: 'Photo' };
  });
  const file = (type: string, size: number) => new File([new Uint8Array(size)], 'file', { type });

  it('accepts the three supported image MIME types', () => {
    for (const mime of ['image/jpeg', 'image/png', 'image/gif']) expect(component.validateFile(file(mime, 1))).toBeTrue();
  });
  it('rejects unsupported MIME types', () => expect(component.validateFile(file('image/webp', 1))).toBeFalse());
  it('uses a 2 MiB default maximum, inclusively', () => {
    expect(component.validateFile(file('image/jpeg', 2 * 1024 * 1024))).toBeTrue();
    expect(component.validateFile(file('image/jpeg', 2 * 1024 * 1024 + 1))).toBeFalse();
  });
  it('uses fileBoxOptions.maxSize in MiB', () => {
    component.fileBoxOptions = { maxWidth: 10, maxHeight: 10, maxSize: 1 };
    expect(component.validateFile(file('image/png', 1024 * 1024))).toBeTrue();
    expect(component.validateFile(file('image/png', 1024 * 1024 + 1))).toBeFalse();
  });
  it('treats maxSize zero as absent and therefore uses the default', () => {
    component.fileBoxOptions = { maxWidth: 10, maxHeight: 10, maxSize: 0 };
    expect(component.validateFile(file('image/gif', 2 * 1024 * 1024))).toBeTrue();
  });
  it('copies supported file metadata after view init without applying dimensions to component inputs', () => {
    const metadata = { maxWidth: 640, maxHeight: 480, maxSize: 3 };
    component.config.fileBoxOptions = metadata; component.ngAfterViewInit();
    expect(component.fileBoxOptions).toBe(metadata); expect(component.maxWidth).toBe(300); expect(component.maxHeight).toBe(1350);
  });
  async function expectResize(originalWidth: number, originalHeight: number, maxWidth: number, maxHeight: number,
    expectedWidth: number, expectedHeight: number) {
    const nativeImage = window.Image;
    const fakeImage: any = { width: originalWidth, height: originalHeight, set src(_value: string) { queueMicrotask(() => this.onload()); } };
    (window as any).Image = function() { return fakeImage; };
    const ctx = { drawImage: jasmine.createSpy('drawImage') };
    const canvas: any = { width: 0, height: 0, getContext: () => ctx, toDataURL: jasmine.createSpy().and.returnValue('data:image/png;base64,result') };
    const create = spyOn(document, 'createElement').and.callFake(((tag: string) => tag === 'canvas' ? canvas : document.createElement(tag)) as any);
    try {
      const result = await component.resizeImage('data:image/png;base64,input', maxWidth, maxHeight, 'png');
      expect(canvas.width).toBe(expectedWidth); expect(canvas.height).toBe(expectedHeight);
      expect(ctx.drawImage).toHaveBeenCalledWith(fakeImage, 0, 0, expectedWidth, expectedHeight);
      expect(canvas.toDataURL).toHaveBeenCalledWith('image/png', 0.7); expect(result).toEqual({ dataUrl: 'data:image/png;base64,result', format: 'png' });
    } finally { create.and.callThrough(); (window as any).Image = nativeImage; }
  }
  it('resizes to the width limit while preserving aspect ratio and MIME', async () => {
    await expectResize(1000, 500, 400, 1000, 400, 200);
  });
  it('resizes to the height limit while preserving aspect ratio', async () => {
    await expectResize(500, 1200, 1000, 600, 250, 600);
  });
  it('uses the stricter width and height ratio', async () => {
    await expectResize(1200, 2400, 600, 800, 400, 800);
  });
  it('does not upscale an image already within both limits', async () => {
    await expectResize(400, 300, 600, 800, 400, 300);
  });
});
