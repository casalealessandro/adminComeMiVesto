import { isBackendRequest } from './auth.interceptor';
describe('auth interceptor URL scope', () => {
  it('accepts only the configured Firebase API', () => {
    expect(isBackendRequest('https://us-central1-comemivesto-5e5f9.cloudfunctions.net/apiDev/user/users')).toBeTrue();
    expect(isBackendRequest('https://api.tradedoubler.com/1.0/products.json')).toBeFalse();
  });
});
