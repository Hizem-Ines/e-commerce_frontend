// src/services/__tests__/authService.test.js
import * as authService from '../authService';
import api from '../api';

// Factory mock inline — Jest n'essaie jamais de charger le vrai api.js
jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get:    jest.fn(),
    post:   jest.fn(),
    put:    jest.fn(),
    patch:  jest.fn(),
    delete: jest.fn(),
  },
}));

const fakeUser  = { id: 1, email: 'test@goffa.ch', name_fr: 'Jean Dupont' };
const fakeToken = 'abc123token';

beforeEach(() => jest.clearAllMocks());

describe('authService', () => {

  describe('register', () => {
    it('appelle POST /auth/register avec les bonnes données', async () => {
      const payload = { email: 'new@goffa.ch', password: 'Pass123!' };
      api.post.mockResolvedValueOnce({ data: { user: fakeUser } });

      const result = await authService.register(payload);

      expect(api.post).toHaveBeenCalledWith('/auth/register', payload);
      expect(result.data.user.email).toBe(fakeUser.email);
    });

    it('propage l\'erreur 409 (email déjà utilisé)', async () => {
      api.post.mockRejectedValueOnce({ response: { status: 409 } });

      await expect(authService.register({ email: 'dup@goffa.ch' }))
        .rejects.toMatchObject({ response: { status: 409 } });
    });
  });

  describe('login', () => {
    it('appelle POST /auth/login avec email + password', async () => {
      api.post.mockResolvedValueOnce({ data: { user: fakeUser } });

      await authService.login({ email: 'test@goffa.ch', password: 'Pass123!' });

      expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'test@goffa.ch', password: 'Pass123!' });
    });

    it('propage l\'erreur 401 si identifiants invalides', async () => {
      api.post.mockRejectedValueOnce({ response: { status: 401 } });

      await expect(authService.login({ email: 'x', password: 'wrong' }))
        .rejects.toMatchObject({ response: { status: 401 } });
    });
  });

  describe('logout', () => {
    it('appelle POST /auth/logout sans body', async () => {
      api.post.mockResolvedValueOnce({ data: {} });

      await authService.logout();

      expect(api.post).toHaveBeenCalledWith('/auth/logout');
    });
  });

  describe('getMe', () => {
    it('appelle GET /auth/me et retourne l\'utilisateur courant', async () => {
      api.get.mockResolvedValueOnce({ data: { user: fakeUser } });

      const result = await authService.getMe();

      expect(api.get).toHaveBeenCalledWith('/auth/me');
      expect(result.data.user.id).toBe(1);
    });
  });

  describe('updateProfile', () => {
    it('appelle PUT /auth/me avec Content-Type multipart/form-data', async () => {
      const formData = new FormData();
      api.put.mockResolvedValueOnce({ data: { user: fakeUser } });

      await authService.updateProfile(formData);

      expect(api.put).toHaveBeenCalledWith(
        '/auth/me',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
    });
  });

  describe('updatePassword', () => {
    it('appelle PUT /auth/password avec old + new password', async () => {
      const payload = { oldPassword: 'Old123!', newPassword: 'New456!' };
      api.put.mockResolvedValueOnce({ data: { message: 'Mis à jour' } });

      await authService.updatePassword(payload);

      expect(api.put).toHaveBeenCalledWith('/auth/password', payload);
    });
  });

  describe('forgotPassword', () => {
    it('appelle POST /auth/forgot-password avec l\'email', async () => {
      api.post.mockResolvedValueOnce({ data: { message: 'Email envoyé' } });

      await authService.forgotPassword({ email: 'test@goffa.ch' });

      expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'test@goffa.ch' });
    });
  });

  describe('resetPassword', () => {
    it('appelle POST /auth/reset-password/:token avec le bon token dans l\'URL', async () => {
      const payload = { password: 'NewPass123!' };
      api.post.mockResolvedValueOnce({ data: { message: 'Réinitialisé' } });

      await authService.resetPassword(fakeToken, payload);

      expect(api.post).toHaveBeenCalledWith(`/auth/reset-password/${fakeToken}`, payload);
    });
  });

  describe('verifyEmail', () => {
    it('appelle GET /auth/verify-email/:token', async () => {
      api.get.mockResolvedValueOnce({ data: { message: 'Email vérifié' } });

      await authService.verifyEmail(fakeToken);

      expect(api.get).toHaveBeenCalledWith(`/auth/verify-email/${fakeToken}`);
    });
  });

  describe('verifyMfa', () => {
    it('appelle POST /auth/login/verify-mfa avec le code OTP', async () => {
      api.post.mockResolvedValueOnce({ data: { user: fakeUser } });

      await authService.verifyMfa({ code: '123456' });

      expect(api.post).toHaveBeenCalledWith('/auth/login/verify-mfa', { code: '123456' });
    });
  });

  describe('resendVerification', () => {
    it('appelle POST /auth/resend-verification avec l\'email', async () => {
      api.post.mockResolvedValueOnce({ data: {} });

      await authService.resendVerification({ email: 'test@goffa.ch' });

      expect(api.post).toHaveBeenCalledWith('/auth/resend-verification', { email: 'test@goffa.ch' });
    });
  });

  describe('updateAddresses', () => {
    it('appelle PUT /auth/me/addresses avec les données d\'adresse', async () => {
      const payload = { address_line1: 'Rue de la Paix 12', city: 'Genève', canton: 'GE' };
      api.put.mockResolvedValueOnce({ data: { message: 'Adresse mise à jour' } });

      await authService.updateAddresses(payload);

      expect(api.put).toHaveBeenCalledWith('/auth/me/addresses', payload);
    });
  });

});