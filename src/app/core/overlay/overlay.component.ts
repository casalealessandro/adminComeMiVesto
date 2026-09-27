import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, signal, TemplateRef, ViewChild } from '@angular/core';
import { OverlayService } from './overlay.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overlay.component.html',
  styleUrl: './overlay.component.scss'
})
export class OverlayComponent {

  @ViewChild('overlayContent', { static: false }) overlayContentRef!: ElementRef;

  @Input() contentTemplate!: TemplateRef<any>;
  @Input() templateContext: any = {}; // Per passare dati al template
  @Input() showBgOverlay:boolean = true //Mostra il background a tutto schermo.

  isVisible = signal(false);
  position = signal({ top: 0, left: 0 });
  zIndex = signal(1200);
  backdropZIndex = signal(1199);

  @Output() closed = new EventEmitter<void>();
  private overlaySubscription: Subscription = new Subscription();
  private readonly viewportMargin = 10;

  constructor(private overlayService: OverlayService) {}

  // Listener per il click fuori dal componente
  @HostListener('document:click', ['$event'])
  clickOutside(event: MouseEvent) {
    const currentTarget = event.target as Node | null;

    if (
      this.overlayContentRef &&
      currentTarget &&
      !this.overlayContentRef.nativeElement.contains(currentTarget) &&
      this.isVisible()
    ) {
      this.closeOverlay();
    }
  }

  ngOnInit() {
    this.overlaySubscription.add(
      this.overlayService.overlayData$.subscribe((data) => {
        if (!data) {
          this.isVisible.set(false);
          return;
        }

        this.contentTemplate = data?.contentTemplate || null; // Passa il template al componente
        this.showBgOverlay = data.showBgOverlay;
        this.openOverlay(data.position);
      })
    );
  }

  openOverlay(position: { top: number; left: number }): void {
    this.position.set(position);
    this.resolveLayer();
    this.isVisible.set(true);

    setTimeout(() => {
      this.keepInsideHorizontalViewport();
      this.overlayContentRef?.nativeElement.classList.add('active');
    }, 10);
  }

  private resolveLayer(): void {
    const modalZIndexes = Array.from(document.querySelectorAll('.modal.popup'))
      .map(element => parseFloat(window.getComputedStyle(element).zIndex))
      .filter(zIndex => Number.isFinite(zIndex));

    const highestModalZIndex = modalZIndexes.length ? Math.max(...modalZIndexes) : 0;
    const resolvedZIndex = highestModalZIndex > 0 ? highestModalZIndex + 100 : 1200;

    this.zIndex.set(resolvedZIndex);
    this.backdropZIndex.set(resolvedZIndex - 1);
  }

  private keepInsideHorizontalViewport(): void {
    const overlayElement = this.overlayContentRef?.nativeElement as HTMLElement | undefined;
    if (!overlayElement) {
      return;
    }

    const overlayWidth = overlayElement.getBoundingClientRect().width;
    const viewportLeft = window.scrollX;
    const viewportRight = viewportLeft + window.innerWidth;
    const currentPosition = this.position();
    const minLeft = viewportLeft + this.viewportMargin;
    const maxLeft = viewportRight - overlayWidth - this.viewportMargin;
    const correctedLeft = Math.max(minLeft, Math.min(currentPosition.left, maxLeft));

    if (correctedLeft !== currentPosition.left) {
      this.position.set({ ...currentPosition, left: correctedLeft });
    }
  }

  ngOnDestroy() {
    // Annulla la sottoscrizione quando il componente viene distrutto
    this.overlaySubscription.unsubscribe();
  }

  closeOverlay(): void {
    this.overlayContentRef?.nativeElement.classList.remove('active');

    setTimeout(() => {
      this.isVisible.set(false);
      this.overlayService.closeOverlay(); // Chiamata al servizio per chiudere l'overlay
      this.closed.emit();
    }, 200); // Tempo per chiusura animata
  }
}
