import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { UserProfile } from '../../interface/app.interface';
import { UsersGridProvider } from './users-grid.provider';

describe('UsersGridProvider', () => {
  let provider: UsersGridProvider;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UsersGridProvider, provideHttpClient(), provideHttpClientTesting()]
    });
    provider = TestBed.inject(UsersGridProvider);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts selected user uids to the backend bulk-delete endpoint', async () => {
    const users = [
      { uid: 'user-a' },
      { uid: 'user-b' }
    ] as UserProfile[];

    const promise = provider.deleteMany(users);

    const request = http.expectOne(`${environment.apiBaseUrl}/admin/users/bulk-delete`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ uids: ['user-a', 'user-b'] });

    request.flush({ requested: 2, deleted: 2 });
    await expectAsync(promise).toBeResolved();
  });
});
