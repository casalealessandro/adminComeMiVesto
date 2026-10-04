import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';

import { DataGridComponent } from '../../components/data-grid/data-grid.component';
import { AuthService } from '../../services/auth.service';
import { FormService } from '../../services/form.service';
import { UserService } from '../../services/user.service';
import { GridLoadRequest } from '../../components/data-grid/data-grid-provider';
import { UsersGridProvider } from './users-grid.provider';
import {
  UsersComponent,
  adminCreateUserErrorMessage,
  adminCreateUserSuccessMessage,
  buildAdminCreateUserRequest
} from './users.component';

describe('UsersComponent admin creation', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;
  let userService: jasmine.SpyObj<UserService>;
  const isAdmin = jasmine.createSpy().and.returnValue(true);
  const gridProvider = {
    load: jasmine.createSpy('load').and.resolveTo({
      items: [],
      hasMore: false,
      totalCount: 0
    }),
    deleteMany: jasmine.createSpy('deleteMany').and.resolveTo()
  };

  beforeEach(async () => {
    isAdmin.and.returnValue(true);
    gridProvider.load.calls.reset();
    gridProvider.deleteMany.calls.reset();
    userService = jasmine.createSpyObj('UserService', ['getUsersPage', 'createAdminUser']);
    userService.getUsersPage.and.returnValue(of({ data: [], nextPageToken: null }));

    await TestBed.configureTestingModule({
      imports: [UsersComponent],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: UsersGridProvider, useValue: gridProvider },
        { provide: AuthService, useValue: { isAdmin, currentUser: () => null } },
        { provide: FormService, useValue: { getFormFields: () => of([]) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    userService.getUsersPage.calls.reset();
  });

  it('configures the users DataGrid on the provider-neutral remote path', () => {
    const grid = fixture.debugElement.query(By.directive(DataGridComponent)).componentInstance as DataGridComponent;

    expect(grid.remoteOperation).toBeTrue();
    expect(grid.selectionRowMode).toBe('multiple');
    expect(grid.dataProvider).toBe(gridProvider);
    expect(typeof grid.dataProvider?.deleteMany).toBe('function');
    expect(grid.showToolbarTop).toBeTrue();
    expect(grid.showFilter).toBeTrue();
    expect(grid.isSearchable).toBeTrue();
    expect(gridProvider.load).toHaveBeenCalledWith({ pageSize: 20 });
  });

  it('keeps the role filter in the request and filter row when the users grid refreshes', async () => {
    const grid = fixture.debugElement.query(By.directive(DataGridComponent)).componentInstance as DataGridComponent;
    const requests: GridLoadRequest[] = [];
    gridProvider.load.and.callFake(async request => {
      requests.push(request);
      return { items: [], hasMore: false, totalCount: 0 };
    });

    await grid.applyProviderColumnFilter('role', 'admin');
    fixture.detectChanges();
    component.refresh();
    await fixture.whenStable();
    fixture.detectChanges();

    const roleFilter = [{ field: 'role', operator: 'eq' as const, value: 'admin' }];
    const roleSelect = fixture.nativeElement.querySelector(
      '.desktop-grid select[data-grid-filter-field="role"]'
    ) as HTMLSelectElement;

    expect(requests).toEqual([
      { pageSize: 20, filters: roleFilter },
      { pageSize: 20, filters: roleFilter },
    ]);
    expect(grid.providerFilterValue('role')).toBe('admin');
    expect(roleSelect.value).toBe('admin');
  });

  it('shows the action to admins and opens the DynamicForm dialog', () => {
    expect(fixture.nativeElement.textContent).toContain('Nuovo utente');
    component.openCreateUser();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-dynamic-form')).toBeTruthy();
  });

  it('does not show the action to editors', () => {
    isAdmin.and.returnValue(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Nuovo utente');
  });

  it('cancels without an API call', () => {
    component.createUserOpen = true;
    component.handleCreateUserForm({ name: 'cancelForm', formData: {} });
    expect(component.createUserOpen).toBeFalse();
    expect(userService.createAdminUser).not.toHaveBeenCalled();
  });

  it('whitelists the payload and refreshes after successful creation', () => {
    userService.createAdminUser.and.returnValue(of({
      uid: '1',
      email: 'new@example.com',
      role: 'creator' as const,
      passwordSetupEmailSent: true
    }));

    component.createUserOpen = true;
    component.handleCreateUserForm({
      name: 'submitForm',
      formData: { email: ' new@example.com ', role: 'creator', admin: true, password: 'secret' }
    });

    expect(userService.createAdminUser).toHaveBeenCalledWith({
      email: 'new@example.com',
      role: 'creator',
      displayName: undefined,
      nome: undefined,
      cognome: undefined,
      gender: undefined
    });
    expect(userService.getUsersPage).toHaveBeenCalled();
    expect(component.createUserOpen).toBeFalse();
  });

  it('prevents a double submit while the request is pending', () => {
    const pending = new Subject<any>();
    userService.createAdminUser.and.returnValue(pending);
    const event = { name: 'submitForm' as const, formData: { email: 'new@example.com', role: 'admin' } };

    component.handleCreateUserForm(event);
    component.handleCreateUserForm(event);

    expect(userService.createAdminUser).toHaveBeenCalledTimes(1);
    pending.error({ status: 500 });
    expect(component.createUserBusy).toBeFalse();
  });

  it('maps authorization and duplicate errors without exposing technical data', () => {
    expect(adminCreateUserErrorMessage(403)).toBe('Non sei autorizzato a creare utenti.');
    expect(adminCreateUserErrorMessage(409)).toBe('Esiste già un account associato a questa email.');
  });

  it('reports both password-email outcomes as a successfully created account', () => {
    expect(adminCreateUserSuccessMessage(true)).toContain('È stata inviata');
    expect(adminCreateUserSuccessMessage(false)).toContain('Utente creato correttamente');
    expect(adminCreateUserSuccessMessage(false)).toContain('Reset password');
  });

  it('accepts every closed RBAC role in the whitelisted DTO', () => {
    expect(['creator', 'editor', 'admin'].map(role => buildAdminCreateUserRequest({ email: 'a@b.it', role }).role))
      .toEqual(['creator', 'editor', 'admin']);
  });
});
