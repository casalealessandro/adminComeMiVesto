import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class OverlayService {

  private overlayData = new Subject<any>();  // Dati che vuoi passare all'overlay

  currentOverlayIndex=signal<any>('')
  // Observable per recuperare i dati
  overlayData$ = this.overlayData.asObservable();


  // Funzione per inviare i dati e la visibilità all'overlay
  /**
 * Opens the overlay with the provided data.
 *
 * @param data - The data to be passed to the overlay.
 * @param data.position - The position of the overlay on the screen.
 * @param data.position.top - The vertical position of the overlay in pixels.
 * @param data.position.left - The horizontal position of the overlay in pixels.
 * @param data.contentTemplate - The template to be displayed inside the overlay.
 *
 * @returns {void}
 */
  openOverlay(data: { position: { top: number; left: number } ; contentTemplate: any;showBgOverlay:boolean,index:any},) {
    this.currentOverlayIndex.set(data.index)
    this.overlayData.next(data); // Passa i dati
  }
  // Funzione per chiudere l'overlay
  closeOverlay() {
    this.overlayData.next(null); // Passa i dati
  }
}
