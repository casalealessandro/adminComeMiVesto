import { of } from 'rxjs';
import { ComeMiVestoHeaderUserService } from './app-header-user.service';
import { UserService } from './services/user.service';

describe('ComeMiVestoHeaderUserService E.3.2 adapter', () => {
  let auth: any;
  let userService: jasmine.SpyObj<UserService>;
  let service: ComeMiVestoHeaderUserService;

  beforeEach(() => {
    auth = {
      currentUser: jasmine.createSpy('currentUser'),
      logout: jasmine.createSpy('logout').and.returnValue(Promise.resolve())
    };
    userService = jasmine.createSpyObj<UserService>('UserService', ['getUserProfile']);
    service = new ComeMiVestoHeaderUserService(auth, userService);
  });

  it('maps the ComeMiVesto profile to the generic header user', (done) => {
    auth.currentUser.and.returnValue({ uid: 'user-1' });
    userService.getUserProfile.and.returnValue(of({
      displayName: 'Mario Display',
      nome: 'Mario',
      cognome: 'Rossi',
      photoURL: 'avatar.jpg'
    } as any));

    service.getUser().subscribe(user => {
      expect(user).toEqual({
        displayName: 'Mario Display',
        profileLabel: 'Mario Rossi',
        photoURL: 'avatar.jpg'
      });
      done();
    });
  });

  it('uses displayName as profile label when nome and cognome are not available', (done) => {
    auth.currentUser.and.returnValue({ uid: 'user-1' });
    userService.getUserProfile.and.returnValue(of({
      displayName: 'Mario Display',
      photoURL: 'avatar.jpg'
    } as any));

    service.getUser().subscribe(user => {
      expect(user?.profileLabel).toBe('Mario Display');
      done();
    });
  });

  it('does not request the profile when there is no authenticated user', (done) => {
    auth.currentUser.and.returnValue(null);

    service.getUser().subscribe(user => {
      expect(user).toBeNull();
      expect(userService.getUserProfile).not.toHaveBeenCalled();
      done();
    });
  });

  it('delegates logout to AuthService', async () => {
    await service.logout();

    expect(auth.logout).toHaveBeenCalled();
  });
});
