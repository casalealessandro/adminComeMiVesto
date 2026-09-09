import { Directive, inject, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { OverlayService } from '../../services/overlay.service';
import { CustomScrollbarComponent } from './custom-scrollbar.component';

@Directive({
  selector: 'app-custom-scrollbar[appCloseOverlayOnScroll]',
  standalone: true
})
export class CloseOverlayOnScrollDirective implements OnDestroy {
  private readonly scrollbar = inject(CustomScrollbarComponent);
  private readonly overlayService = inject(OverlayService);
  private readonly subscription: Subscription;

  constructor() {
    this.subscription = this.scrollbar.scrolled.subscribe(() => {
      this.overlayService.closeOverlay();
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
