import { Injectable, signal, WritableSignal } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class MenuService {
    // Segnale che rappresenta lo stato del menu (aperto o chiuso)
    readonly isOpenMenu: WritableSignal<boolean> = signal(false);

    // Getter per restituire lo stato del menu in modalità readonly
    get getIsMenuOpen() {
        return this.isOpenMenu.asReadonly();
    }
    // Metodo per alternare lo stato del menu (aperto ↔ chiuso)
    toggleMenu() {
        const newValue = !this.isOpenMenu(); // Inverte lo stato corrente
        this.isOpenMenu.set(newValue); // Aggiorna lo stato del menu
    }
    // Metodo per chiudere il menu
    closeMenu() {
        this.isOpenMenu.set(false); // Imposta il segnale su false
    }
    // Metodo per aprire il menu
    openMenu() {
        this.isOpenMenu.set(true); // Imposta il segnale su true
    }
}
