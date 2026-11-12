import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { AdminCreateUserRequest, UserService } from './user.service';

describe('UserService admin', () => {
  let service: UserService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('retrieves every users page for the outfit creator selector', () => {
    let users: Array<{ uid: string }> = [];
    service.getAllUsers().subscribe(value => users = value);

    const first = http.expectOne(`${environment.apiBaseUrl}/user/users?limit=100`);
    expect(first.request.method).toBe('GET');
    first.flush({ data: [{ uid: 'existing', role: 'creator' }], nextPageToken: 'next-page' });

    const second = http.expectOne(`${environment.apiBaseUrl}/user/users?limit=100&pageToken=next-page`);
    expect(second.request.method).toBe('GET');
    second.flush({ data: [{ uid: 'new-user', role: 'creator' }], nextPageToken: null });

    expect(users.map(user => user.uid)).toEqual(['existing', 'new-user']);
  });

  it('posts the request to POST /admin/users and unwraps data', () => {
    const payload: AdminCreateUserRequest = { email: 'admin@example.com', role: 'admin' };
    let response: any;
    service.createAdminUser(payload).subscribe(value => response = value);

    const request = http.expectOne(`${environment.apiBaseUrl}/admin/users`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({ message: 'User created successfully', data: { uid: 'uid-1', ...payload, passwordSetupEmailSent: true } });
    expect(response.uid).toBe('uid-1');
    expect(response.passwordSetupEmailSent).toBeTrue();
  });
});
