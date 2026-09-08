import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, signal, TemplateRef, ViewChild } from '@angular/core';
import { OverlayService } from '../../services/overlay.service';
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

  @Output() closed = new EventEmitter<void>();
  private overlaySubscription: Subscription = new Subscription();

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
    this.isVisible.set(true);

    setTimeout(() => {
      this.overlayContentRef?.nativeElement.classList.add('active');
    }, 10);
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
