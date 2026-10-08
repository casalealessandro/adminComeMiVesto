import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, of, switchMap } from 'rxjs';

import { DataGridComponent } from '../../components/data-grid/data-grid.component';
import { Colonne, UserProfile } from '../../interface/app.interface';
import { AuthService } from '../../services/auth.service';
import { AdminCreateUserRequest, UserRole, UserService } from '../../services/user.service';
import { alert, confirm } from '../../widgets/ui-dialogs';
import { DynamicFormComponent } from '../../components/dynamic-form/dynamic-form.component';
import { UsersGridProvider } from './users-grid.provider';
import { GridDataProvider, GridLoadRequest, GridPage } from '../../components/data-grid/data-grid-provider';

export interface DynamicFormSubmitEvent {
  name: 'submitForm' | 'cancelForm';
  formData: Record<string, unknown>;
}

export function buildAdminCreateUserRequest(formData: Record<string, unknown>): AdminCreateUserRequest {
  const optionalString = (value: unknown): string | undefined => {
    const normalized = typeof value === 'string' ? value.trim() : '';
    return normalized || undefined;
  };
  return {
    email: String(formData['email'] || '').trim(),
    displayName: optionalString(formData['displayName']),
    nome: optionalString(formData['nome']),
    cognome: optionalString(formData['cognome']),
    gender: optionalString(formData['gender']),
    role: formData['role'] as UserRole
  };
}

export function adminCreateUserErrorMessage(status: number): string {
  if (status === 400) return 'Controlla i dati inseriti.';
  if (status === 401 || status === 403) return 'Non sei autorizzato a creare utenti.';
  if (status === 409) return 'Esiste già un account associato a questa email.';
  if (status === 422) return 'Il display name contiene contenuti non consentiti.';
  if (status === 503) return 'Il servizio di moderazione non è temporaneamente disponibile.';
  return 'Creazione utente non riuscita.';
}

export function adminCreateUserSuccessMessage(passwordSetupEmailSent: boolean): string {
  return passwordSetupEmailSent
    ? 'Utente creato correttamente. È stata inviata l’email per impostare la password.'
    : 'Utente creato correttamente, ma non è stato possibile inviare l’email per impostare la password. Puoi utilizzare Reset password dalla lista utenti.';
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, DataGridComponent, DynamicFormComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnDestroy {
  private usersService = inject(UserService);
  readonly auth = inject(AuthService);
  readonly usersGridProvider = inject(UsersGridProvider);

  private usersGrid?: DataGridComponent<UserProfile>;
  private mobileSearchTimer?: ReturnType<typeof setTimeout>;
  private providerRequestVersion = 0;

  users: UserProfile[] = [];
  search = '';
  loading = false;
  loadingMore = false;
  error = '';
  hasMore = false;

  readonly dataProvider: GridDataProvider<UserProfile> = {
    load: async (request: GridLoadRequest): Promise<GridPage<UserProfile>> => {
      const append = request.continuation !== undefined;
      const version = append ? this.providerRequestVersion : ++this.providerRequestVersion;
      if (append) {
        this.loadingMore = true;
      } else {
        this.loading = true;
        this.error = '';
      }

      try {
        const page = await this.usersGridProvider.load(request);
        if (version === this.providerRequestVersion) {
          const combined = append ? [...this.users, ...page.items] : [...page.items];
          this.users = Array.from(new Map(combined.map(user => [user.uid, user])).values());
          this.hasMore = page.hasMore;
        }
        return page;
      } catch (error) {
        if (version === this.providerRequestVersion) {
          this.error = 'Impossibile caricare gli utenti.';
        }
        throw error;
      } finally {
        if (version === this.providerRequestVersion) {
          if (append) this.loadingMore = false;
          else this.loading = false;
        }
      }
    },
    deleteMany: (users: UserProfile[]): Promise<void> => this.usersGridProvider.deleteMany(users),
  };

  @ViewChild('usersGrid')
  set usersGridView(grid: DataGridComponent<UserProfile> | undefined) {
    this.usersGrid = grid;
    if (!grid) return;
    grid.pageSize = 50;
    queueMicrotask(() => void grid.renderGrid());
  }

  selected?: UserProfile;
  selectedOriginalRole?: UserRole;
  busyUid: string | null = null;
  createUserOpen = false;
  createUserBusy = false;

  readonly columns: Colonne[] = [{
    itemType: 'group',
    groupDataField: '',
    data: [
      {
        type: 'campoImg',
        colVisible: true,
        allowEditing: false,
        allowFiltering: false,
        search: false,
        dataField: 'photoURL',
        colWidth: '72',
        colCaption: 'Avatar',
        edit: false,
        groupDataField: undefined
      },
      {
        type: 'campo',
        colVisible: true,
        allowEditing: false,
        dataField: 'displayName',
        colWidth: '180',
        colCaption: 'Utente',
        edit: false,
        groupDataField: undefined
      },
      {
        type: 'campo',
        colVisible: true,
        allowEditing: false,
        dataField: 'email',
        colWidth: '230',
        colCaption: 'Email',
        edit: false,
        groupDataField: undefined
      },
      {
        type: 'campoLista',
        colVisible: true,
        allowEditing: false,
        dataField: 'role',
        colWidth: '90',
        colCaption: 'Ruolo',
        edit: false,
        groupDataField: undefined,
        lista: {
          valueExp: 'id',
          displayExp: 'value',
          multiple: false,
          parent: null,
          remote: false,
          options: [
            { id: 'creator', value: 'creator' },
            { id: 'editor', value: 'editor' },
            { id: 'admin', value: 'admin' }
          ]
        }
      },
      {
        type: 'campoLista',
        colVisible: true,
        allowEditing: false,
        dataField: 'disabled',
        colWidth: '115',
        colCaption: 'Stato',
        edit: false,
        groupDataField: undefined,
        lista: {
          valueExp: 'id',
          displayExp: 'value',
          multiple: false,
          parent: null,
          remote: false,
          options: [
            { id: false, value: 'ATTIVO' },
            { id: true, value: 'DISABILITATO' }
          ]
        }
      },
      {
        type: 'campoLista',
        colVisible: true,
        allowEditing: false,
        dataField: 'emailVerified',
        colWidth: '120',
        colCaption: 'Email verificata',
        edit: false,
        groupDataField: undefined,
        lista: {
          valueExp: 'id',
          displayExp: 'value',
          multiple: false,
          parent: null,
          remote: false,
          options: [
            { id: true, value: 'Sì' },
            { id: false, value: 'No' }
          ]
        }
      },
      {
        type: 'campoDateTime',
        colVisible: true,
        allowEditing: false,
        dataField: 'createdAt',
        colWidth: '135',
        colCaption: 'Creazione',
        edit: false,
        groupDataField: undefined
      },
      {
        type: 'campoDateTime',
        colVisible: true,
        allowEditing: false,
        dataField: 'lastSignInTime',
        colWidth: '135',
        colCaption: 'Ultimo accesso',
        edit: false,
        groupDataField: undefined
      },
      {
        type: 'campoButton',
        colVisible: true,
        allowEditing: false,
        dataField: '',
        colWidth: '58',
        colCaption: 'Reset',
        edit: false,
        groupDataField: undefined,
        button: { text: '', name: 'reset', event: 'reset', icon: 'mdi mdi-lock-reset', hint: 'Reset password' }
      },
      {
        type: 'campoButton',
        colVisible: true,
        allowEditing: false,
        dataField: '',
        colWidth: '58',
        colCaption: 'Stato',
        edit: false,
        groupDataField: undefined,
        button: { text: '', name: 'toggle', event: 'toggle', icon: 'mdi mdi-account-lock-outline', hint: 'Abilita / disabilita' }
      },
      {
        type: 'campoButton',
        colVisible: true,
        allowEditing: false,
        dataField: '',
        colWidth: '58',
        colCaption: 'Elimina',
        edit: false,
        groupDataField: undefined,
        button: { text: '', name: 'delete', event: 'delete', icon: 'mdi mdi-trash-can-outline', hint: 'Elimina' }
      }
    ]
  }];

  ngOnDestroy(): void {
    this.providerRequestVersion++;
    if (this.mobileSearchTimer !== undefined) clearTimeout(this.mobileSearchTimer);
  }

  openCreateUser(): void {
    if (this.auth.isAdmin()) this.createUserOpen = true;
  }

  closeCreateUser(): void {
    if (!this.createUserBusy) this.createUserOpen = false;
  }

  handleCreateUserForm(event: DynamicFormSubmitEvent): void {
    if (event.name === 'cancelForm') {
      this.closeCreateUser();
      return;
    }
    if (event.name !== 'submitForm' || this.createUserBusy || !this.auth.isAdmin()) return;

    const payload = buildAdminCreateUserRequest(event.formData);
    this.createUserBusy = true;
    this.error = '';

    this.usersService.createAdminUser(payload)
      .pipe(finalize(() => this.createUserBusy = false))
      .subscribe({
        next: created => {
          this.createUserOpen = false;
          this.refresh();
          alert(adminCreateUserSuccessMessage(created.passwordSetupEmailSent), 'Operazione completata');
        },
        error: (apiError: HttpErrorResponse) => {
          this.error = adminCreateUserErrorMessage(apiError.status);
          alert(this.error, 'Creazione utente non riuscita');
        }
      });
  }

  refresh(): void {
    if (!this.usersGrid || this.loading || this.loadingMore) return;
    this.error = '';
    this.usersGrid.refresh();
  }

  private refreshRemoteGrid(): void {
    this.refresh();
  }

  onMobileSearchChange(): void {
    if (this.mobileSearchTimer !== undefined) clearTimeout(this.mobileSearchTimer);
    this.mobileSearchTimer = setTimeout(() => {
      this.mobileSearchTimer = undefined;
      void this.usersGrid?.applyProviderSearch(this.search);
    }, 300);
  }

  async loadMore(): Promise<void> {
    if (!this.usersGrid || this.loading || this.loadingMore || !this.hasMore) return;
    await this.usersGrid.loadNextRemotePage();
  }

  trackByUserUid(_index: number, user: UserProfile): string {
    return user.uid;
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
    if (this.selected.photoURL && !/^https?:\/\//i.test(this.selected.photoURL)) {
      this.error = 'Photo URL non valido.';
      return;
    }

    const pending = { ...this.selected };
    const originalRole = this.selectedOriginalRole || 'creator';
    const requestedRole = pending.role || 'creator';
    const roleChanged = requestedRole !== originalRole && this.canChangeRole(pending);
    this.busyUid = pending.uid;

    this.usersService.updateUserProfile(pending.uid, pending)
      .pipe(
        switchMap(() => roleChanged ? this.usersService.updateRole(pending.uid, requestedRole) : of(null)),
        finalize(() => this.busyUid = null)
      )
      .subscribe({
        next: () => {
          this.closeEdit();
          this.refreshRemoteGrid();
          alert('Profilo aggiornato.', 'Operazione completata');
        },
        error: () => {
          if (this.selected) this.selected.role = originalRole;
          this.error = roleChanged
            ? 'Profilo non completato: modifica ruolo non riuscita.'
            : 'Impossibile aggiornare il profilo.';
        }
      });
  }

  closeEdit(): void {
    this.selected = undefined;
    this.selectedOriginalRole = undefined;
  }

  canOperateProfile(user: UserProfile): boolean {
    return this.auth.isAdmin() || user.role === 'creator';
  }

  canManage(user: UserProfile): boolean {
    return user.uid !== this.auth.currentUser()?.uid && this.canOperateProfile(user);
  }

  canChangeRole(user: UserProfile): boolean {
    return this.auth.isAdmin() && user.uid !== this.auth.currentUser()?.uid;
  }

  toggleDisabled(user: UserProfile): void {
    if (!this.canManage(user)) return;

    const action = user.disabled ? 'abilitare' : 'disabilitare';
    confirm(`Confermi di voler ${action} ${user.email}?`, 'Conferma', yes => {
      if (!yes) return;

      this.busyUid = user.uid;
      const call = user.disabled
        ? this.usersService.enableUser(user.uid)
        : this.usersService.disableUser(user.uid);

      call.pipe(finalize(() => this.busyUid = null)).subscribe({
        next: () => {
          this.refreshRemoteGrid();
          alert('Stato utente aggiornato.', 'Operazione completata');
        },
        error: () => this.error = 'Operazione non autorizzata o non disponibile.'
      });
    });
  }

  resetPassword(user: UserProfile): void {
    confirm(`Inviare una email di reset password a ${user.email}?`, 'Conferma', yes => {
      if (!yes) return;
      this.usersService.resetPassword(user.uid).subscribe({
        next: () => alert('Email di reset inviata.', 'Operazione completata'),
        error: () => this.error = 'Invio email non riuscito.'
      });
    });
  }

  deleteUser(user: UserProfile): void {
    if (!this.canManage(user)) return;

    confirm(`Eliminare definitivamente l’account ${user.email}? L’operazione non è reversibile.`, 'Conferma eliminazione', yes => {
      if (!yes) return;

      this.usersService.deleteUser(user.uid).subscribe({
        next: () => {
          this.refreshRemoteGrid();
          alert('Utente eliminato.', 'Operazione completata');
        },
        error: () => this.error = 'Eliminazione non consentita o non riuscita.'
      });
    });
  }

  changeRole(user: UserProfile, role: UserRole): void {
    if (!this.canChangeRole(user)) return;

    this.usersService.updateRole(user.uid, role).subscribe({
      next: () => {
        this.refreshRemoteGrid();
      },
      error: () => this.error = 'Modifica ruolo non consentita.'
    });
  }

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

}
