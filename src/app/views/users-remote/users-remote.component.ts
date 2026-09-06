import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DataGridComponent } from '../../components/data-grid/data-grid.component';
import { Colonne } from '../../interface/app.interface';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../services/user.service';
import { UserGridProvider, UserRemoteGridRow } from './user-grid.provider';

/**
 * Isolated laboratory page for exercising the provider-neutral DataGrid against
 * real ComeMiVesto administrative APIs.
 *
 * The existing `UsersComponent` remains untouched and acts as the functional
 * baseline. This page intentionally uses `dataProvider + remoteOperation` for
 * load/search/filter/sort/paging and invokes the grid CRUD facade for create,
 * update and delete flows.
 */
@Component({
  selector: 'app-users-remote',
  standalone: true,
  imports: [CommonModule, FormsModule, DataGridComponent],
  templateUrl: './users-remote.component.html',
  styleUrl: './users-remote.component.scss',
})
export class UsersRemoteComponent {
  @ViewChild(DataGridComponent) private grid?: DataGridComponent<UserRemoteGridRow>;

  readonly provider = inject(UserGridProvider);
  readonly auth = inject(AuthService);

  error = '';
  createOpen = false;
  createBusy = false;
  editBusy = false;
  editDraft?: UserRemoteGridRow;
  createDraft: Partial<UserRemoteGridRow> & { email: string; role: UserRole } = this.emptyCreateDraft();

  /**
   * Raw user fields are used deliberately so server-side filtering and sorting
   * can be validated without client-only display aliases hiding API behavior.
   */
  readonly columns: Colonne[] = [{
    itemType: 'group',
    groupDataField: '',
    data: [
      { type: 'campoImg', colVisible: true, allowEditing: false, allowFiltering: false, search: false, dataField: 'photoURL', colWidth: '72', colCaption: 'Avatar', edit: false, groupDataField: undefined },
      { type: 'campo', colVisible: true, allowEditing: true, allowFiltering: true, search: true, dataField: 'displayName', colWidth: '170', colCaption: 'Display name', edit: false, groupDataField: undefined },
      { type: 'campo', colVisible: true, allowEditing: false, allowFiltering: true, search: true, dataField: 'email', colWidth: '230', colCaption: 'Email', edit: false, groupDataField: undefined },
      { type: 'campo', colVisible: true, allowEditing: true, allowFiltering: true, search: true, dataField: 'nome', colWidth: '120', colCaption: 'Nome', edit: false, groupDataField: undefined },
      { type: 'campo', colVisible: true, allowEditing: true, allowFiltering: true, search: true, dataField: 'cognome', colWidth: '130', colCaption: 'Cognome', edit: false, groupDataField: undefined },
      {
        type: 'campoLista', colVisible: true, allowEditing: false, allowFiltering: true, search: false,
        dataField: 'role', colWidth: '100', colCaption: 'Ruolo', edit: false, groupDataField: undefined,
        lista: {
          displayExp: 'label', valueExp: 'value', multiple: false, remote: false, parent: null,
          options: [
            { value: 'creator', label: 'creator' },
            { value: 'editor', label: 'editor' },
            { value: 'admin', label: 'admin' },
          ],
        },
      },
      { type: 'campoBoolean', colVisible: true, allowEditing: false, allowFiltering: true, search: false, dataField: 'disabled', colWidth: '95', colCaption: 'Disabilitato', edit: false, groupDataField: undefined },
      { type: 'campoBoolean', colVisible: true, allowEditing: false, allowFiltering: true, search: false, dataField: 'emailVerified', colWidth: '110', colCaption: 'Verificata', edit: false, groupDataField: undefined },
      { type: 'campoDateTime', colVisible: true, allowEditing: false, allowFiltering: true, search: true, dataField: 'createdAt', colWidth: '145', colCaption: 'Creazione', edit: false, groupDataField: undefined },
      { type: 'campoDateTime', colVisible: true, allowEditing: false, allowFiltering: true, search: true, dataField: 'lastSignInTime', colWidth: '145', colCaption: 'Ultimo accesso', edit: false, groupDataField: undefined },
      { type: 'campo', colVisible: true, allowEditing: true, allowFiltering: true, search: true, dataField: 'gender', colWidth: '100', colCaption: 'Gender', edit: false, groupDataField: undefined },
    ],
  }];

  /** Reloads the laboratory through the DataGrid public facade. */
  refresh(): void {
    this.error = '';
    this.grid?.refresh();
  }

  /**
   * Handles both provider create and update events emitted by the grid toolbar
   * and editor buttons. Setting `cancel=true` keeps editing external, matching
   * the current Admin DataGrid contract.
   */
  handleEditEvent(event: any): void {
    if (event?.operation === 'create' || event?.name === 'buttonNewRowEvent') {
      event.cancel = true;
      this.openCreate();
      return;
    }

    const row = event?.rowData || event?.data;
    if (!row?.uid) return;
    event.cancel = true;

    if (!this.canEdit(row)) {
      this.error = 'Non sei autorizzato a modificare questo profilo.';
      return;
    }

    this.error = '';
    this.editDraft = { ...row };
  }

  /** Opens a fresh provider-create form for administrators. */
  openCreate(): void {
    if (!this.auth.isAdmin()) return;
    this.error = '';
    this.createDraft = this.emptyCreateDraft();
    this.createOpen = true;
  }

  closeCreate(): void {
    if (!this.createBusy) this.createOpen = false;
  }

  /**
   * Exercises `DataGridComponent.createProviderRow()`: provider mutation first,
   * then authoritative remote reload through `DataGridEngine`.
   */
  async createUser(): Promise<void> {
    if (!this.grid || this.createBusy || !this.auth.isAdmin()) return;
    this.createBusy = true;
    this.error = '';

    try {
      const created = await this.grid.createProviderRow({ ...this.createDraft });
      if (!created) {
        this.error = 'Creazione utente non riuscita.';
        return;
      }
      this.createOpen = false;
      this.createDraft = this.emptyCreateDraft();
    } finally {
      this.createBusy = false;
    }
  }

  closeEdit(): void {
    if (!this.editBusy) this.editDraft = undefined;
  }

  /**
   * Exercises `DataGridComponent.updateProviderRow()` while leaving role/status
   * changes outside the generic profile mutation contract.
   */
  async saveEdit(): Promise<void> {
    if (!this.grid || !this.editDraft || this.editBusy) return;
    this.editBusy = true;
    this.error = '';

    try {
      const updated = await this.grid.updateProviderRow({ ...this.editDraft });
      if (!updated) {
        this.error = 'Aggiornamento utente non riuscito.';
        return;
      }
      this.editDraft = undefined;
    } finally {
      this.editBusy = false;
    }
  }

  /** Mirrors the authorization expectations of the existing Users page. */
  canEdit(user: UserRemoteGridRow): boolean {
    return this.auth.isAdmin() || user.role === 'creator';
  }

  private emptyCreateDraft(): Partial<UserRemoteGridRow> & { email: string; role: UserRole } {
    return {
      email: '',
      displayName: '',
      nome: '',
      cognome: '',
      gender: '',
      role: 'creator',
    };
  }
}
