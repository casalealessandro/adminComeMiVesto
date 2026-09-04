import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { AdminCreateUserRequest, UserService } from './user.service';

describe('UserService admin creation', () => {
  let service: UserService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

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
