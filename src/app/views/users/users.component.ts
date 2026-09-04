import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, of, switchMap } from 'rxjs';
import { UserProfile } from '../../interface/app.interface';
import { AuthService } from '../../services/auth.service';
import { UserRole, UserService } from '../../services/user.service';
import { alert, confirm } from '../../widgets/ui-dialogs';
import { DataGridComponent } from '../../components/data-grid/data-grid.component';
import { Colonne } from '../../interface/app.interface';

@Component({ selector: 'app-users', standalone: true, imports: [CommonModule, FormsModule, DataGridComponent], templateUrl: './users.component.html', styleUrl: './users.component.scss' })
export class UsersComponent {
  private usersService = inject(UserService);
  readonly auth = inject(AuthService);
  users: UserGridRow[] = [];
  filteredUsers: UserGridRow[] = [];
  search = '';
  loading = false;
  error = '';
  nextPageToken: string | null = null;
  selected?: UserProfile;
  selectedOriginalRole?: UserRole;
  busyUid: string | null = null;
  readonly columns: Colonne[] = [{ itemType: 'group', groupDataField: '', data: [
    { type: 'campoImg', colVisible: true, allowEditing: false, dataField: 'photoURL', colWidth: '72', colCaption: 'Avatar', edit: false, groupDataField: undefined },
    { type: 'campo', colVisible: true, allowEditing: false, dataField: 'displayLabel', colWidth: '180', colCaption: 'Utente', edit: false, groupDataField: undefined },
    { type: 'campo', colVisible: true, allowEditing: false, dataField: 'email', colWidth: '230', colCaption: 'Email', edit: false, groupDataField: undefined },
    { type: 'campo', colVisible: true, allowEditing: false, dataField: 'roleLabel', colWidth: '90', colCaption: 'Ruolo', edit: false, groupDataField: undefined },
    { type: 'campo', colVisible: true, allowEditing: false, dataField: 'statusLabel', colWidth: '110', colCaption: 'Stato', edit: false, groupDataField: undefined },
    { type: 'campo', colVisible: true, allowEditing: false, dataField: 'verifiedLabel', colWidth: '105', colCaption: 'Email verificata', edit: false, groupDataField: undefined },
    { type: 'campoDateTime', colVisible: true, allowEditing: false, dataField: 'createdLabel', colWidth: '135', colCaption: 'Creazione', edit: false, groupDataField: undefined },
    { type: 'campoDateTime', colVisible: true, allowEditing: false, dataField: 'lastSignInTime', colWidth: '135', colCaption: 'Ultimo accesso', edit: false, groupDataField: undefined },
    { type: 'campoButton', colVisible: true, allowEditing: false, dataField: '', colWidth: '58', colCaption: 'Reset', edit: false, groupDataField: undefined, button: { text: '', name: 'reset', event: 'reset', icon: 'mdi mdi-lock-reset', hint: 'Reset password' } },
    { type: 'campoButton', colVisible: true, allowEditing: false, dataField: '', colWidth: '58', colCaption: 'Stato', edit: false, groupDataField: undefined, button: { text: '', name: 'toggle', event: 'toggle', icon: 'mdi mdi-account-lock-outline', hint: 'Abilita / disabilita' } },
    { type: 'campoButton', colVisible: true, allowEditing: false, dataField: '', colWidth: '58', colCaption: 'Elimina', edit: false, groupDataField: undefined, button: { text: '', name: 'delete', event: 'delete', icon: 'mdi mdi-trash-can-outline', hint: 'Elimina' } }
  ] }];

  ngOnInit(): void { this.refresh(); }
  refresh(): void { this.users = []; this.nextPageToken = null; this.loadPage(); }
  loadPage(): void {
    if (this.loading) return;
    this.loading = true; this.error = '';
    this.usersService.getUsersPage(50, this.nextPageToken || undefined).pipe(finalize(() => this.loading = false)).subscribe({
      next: page => { this.users.push(...page.data.map(user => this.toGridRow(user))); this.nextPageToken = page.nextPageToken; this.applySearch(); },
      error: () => this.error = 'Impossibile caricare gli utenti.'
    });
  }
  applySearch(): void {
    const term = this.search.trim().toLowerCase();
    this.users.forEach(user => this.updateGridLabels(user));
    this.filteredUsers = !term ? [...this.users] : this.users.filter(user =>
      [user.email, user.displayName, user.nome, user.cognome].some(value => (value || '').toLowerCase().includes(term)));
  }
  openEdit(user: UserProfile): void {
    if (!user?.uid || !this.canOperateProfile(user)) return;
    this.usersService.getUserProfile(user.uid).subscribe({
      next: profile => {
        const role = profile.role || user.role || 'creator';
        this.selected = { ...user, ...profile, role };
        this.selectedOriginalRole = role;
      },
      error: () => this.error = 'Dettaglio utente non disponibile.'
    });
  }
  saveUser(): void {
    if (!this.selected || this.busyUid) return;
    if (this.selected.photoURL && !/^https?:\/\//i.test(this.selected.photoURL)) { this.error = 'Photo URL non valido.'; return; }
    const pending = { ...this.selected };
    const originalRole = this.selectedOriginalRole || 'creator';
    const requestedRole = pending.role || 'creator';
    const roleChanged = requestedRole !== originalRole && this.canChangeRole(pending);
    this.busyUid = pending.uid;
    this.usersService.updateUserProfile(pending.uid, pending).pipe(
      switchMap(() => roleChanged ? this.usersService.updateRole(pending.uid, requestedRole) : of(null)),
      finalize(() => this.busyUid = null)
    ).subscribe({
      next: () => {
        const user = this.users.find(item => item.uid === pending.uid);
        if (user) Object.assign(user, pending, { role: roleChanged ? requestedRole : originalRole });
        this.closeEdit();
        this.applySearch();
        alert('Profilo aggiornato.', 'Operazione completata');
      },
      error: () => {
        if (this.selected) this.selected.role = originalRole;
        this.error = roleChanged ? 'Profilo non completato: modifica ruolo non riuscita.' : 'Impossibile aggiornare il profilo.';
      }
    });
  }
  closeEdit(): void { this.selected = undefined; this.selectedOriginalRole = undefined; }
  canOperateProfile(user: UserProfile): boolean { return this.auth.isAdmin() || user.role === 'creator'; }
  canManage(user: UserProfile): boolean { return user.uid !== this.auth.currentUser()?.uid && this.canOperateProfile(user); }
  canChangeRole(user: UserProfile): boolean { return this.auth.isAdmin() && user.uid !== this.auth.currentUser()?.uid; }
  toggleDisabled(user: UserProfile): void {
    if (!this.canManage(user)) return;
    const action = user.disabled ? 'abilitare' : 'disabilitare';
    confirm(`Confermi di voler ${action} ${user.email}?`, 'Conferma', yes => {
      if (!yes) return; this.busyUid = user.uid;
      const call = user.disabled ? this.usersService.enableUser(user.uid) : this.usersService.disableUser(user.uid);
      call.pipe(finalize(() => this.busyUid = null)).subscribe({ next: () => { user.disabled = !user.disabled; this.applySearch(); alert('Stato utente aggiornato.', 'Operazione completata'); }, error: () => this.error = 'Operazione non autorizzata o non disponibile.' });
    });
  }
  resetPassword(user: UserProfile): void { confirm(`Inviare una email di reset password a ${user.email}?`, 'Conferma', yes => yes && this.usersService.resetPassword(user.uid).subscribe({ next: () => alert('Email di reset inviata.', 'Operazione completata'), error: () => this.error = 'Invio email non riuscito.' })); }
  deleteUser(user: UserProfile): void {
    if (!this.canManage(user)) return;
    confirm(`Eliminare definitivamente l’account ${user.email}? L’operazione non è reversibile.`, 'Conferma eliminazione', yes => yes && this.usersService.deleteUser(user.uid).subscribe({ next: () => { this.users = this.users.filter(item => item.uid !== user.uid); this.applySearch(); alert('Utente eliminato.', 'Operazione completata'); }, error: () => this.error = 'Eliminazione non consentita o non riuscita.' }));
  }
  changeRole(user: UserProfile, role: UserRole): void { if (this.canChangeRole(user)) this.usersService.updateRole(user.uid, role).subscribe({ next: () => { user.role = role; this.applySearch(); }, error: () => this.error = 'Modifica ruolo non consentita.' }); }
  gridEdit(event: any): void {
    const user = event?.rowData || event?.data || event;
    if (event?.cancel !== undefined) event.cancel = true;
    if (user?.uid && this.canOperateProfile(user)) this.openEdit(user);
  }
  gridAction(event: any): void {
    if (event?.name === 'reset' && this.canOperateProfile(event.rowData)) this.resetPassword(event.rowData);
    if (event?.name === 'toggle' && this.canManage(event.rowData)) this.toggleDisabled(event.rowData);
    if (event?.name === 'delete' && this.canManage(event.rowData)) this.deleteUser(event.rowData);
  }
  private toGridRow(user: UserProfile): UserGridRow { return this.updateGridLabels(user as UserGridRow); }
  private updateGridLabels(user: UserGridRow): UserGridRow {
    user.displayLabel = user.displayName || `${user.nome || ''} ${user.cognome || ''}`.trim() || 'Utente';
    user.roleLabel = user.role || 'creator';
    user.statusLabel = user.disabled ? 'DISABILITATO' : 'ATTIVO';
    user.verifiedLabel = user.emailVerified ? 'Sì' : 'No';
    user.createdLabel = user.createdAt || user.createAt;
    return user;
  }
}

type UserGridRow = UserProfile & {
  displayLabel: string;
  roleLabel: UserRole;
  statusLabel: string;
  verifiedLabel: string;
  createdLabel: UserProfile['createdAt'] | UserProfile['createAt'];
};
