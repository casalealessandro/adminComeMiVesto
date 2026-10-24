import { Component } from '@angular/core';

export interface FashionVisionImagePreviewData {
  image: string;
  name: string;
}

/** App-specific content hosted by the existing Popup Core (caption, focus and close handling). */
@Component({
  selector: 'app-fashion-vision-image-preview',
  standalone: true,
  template: `
    <figure class="fashion-vision-image-preview">
      <img [src]="itemData.image" [alt]="itemData.name || 'Fotografia originale del prodotto'">
    </figure>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      min-width: 0;
    }
    .fashion-vision-image-preview {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      padding: .75rem;
      background: var(--bs-body-bg, #fff);
    }
    .fashion-vision-image-preview img {
      display: block;
      max-width: 100%;
      max-height: 75vh;
      max-height: 75dvh;
      width: auto;
      height: auto;
      object-fit: contain;
    }
    @media (max-width: 767.98px) {
      .fashion-vision-image-preview { padding: .4rem; }
    }
  `],
})
export class FashionVisionImagePreviewComponent {
  itemData: FashionVisionImagePreviewData = { image: '', name: '' };
}
