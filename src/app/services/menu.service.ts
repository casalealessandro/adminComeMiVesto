import { Injectable, signal, WritableSignal, computed } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({ providedIn: 'root' })
export class MenuService {
    // Segnale che rappresenta lo stato del menu (aperto o chiuso)
    private isOpenMenu: WritableSignal<boolean> = signal(false);
    // BehaviorSubject per monitorare lo stato del menu in modalità osservabile (compatibile con RxJS)
    private isOpenMenuSubject = new BehaviorSubject<boolean>(this.isOpenMenu());

    // Getter per restituire lo stato del menu in modalità readonly
    get getIsMenuOpen() {
        return this.isOpenMenu.asReadonly();
    }
// Getter per restituire un Observable dello stato del menu
    get getIsMenuOpenObservable() {
        return this.isOpenMenuSubject.asObservable();
    }
    // Metodo per alternare lo stato del menu (aperto ↔ chiuso)
    toggleMenu() {
        const newValue = !this.isOpenMenu(); // Inverte lo stato corrente
        this.isOpenMenu.set(newValue); // Aggiorna il segnale
        this.isOpenMenuSubject.next(newValue); // Aggiorna l'osservabile
    }
    // Metodo per chiudere il menu
    closeMenu() {
        this.isOpenMenu.set(false); // Imposta il segnale su false
        this.isOpenMenuSubject.next(false); // Notifica il cambiamento
    }
    // Metodo per aprire il menu
    openMenu() {
        this.isOpenMenu.set(true); // Imposta il segnale su true
        this.isOpenMenuSubject.next(true); // Notifica il cambiamento
    }
}
