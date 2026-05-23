// src/services/__tests__/api.test.js

let successHandler;
let errorHandler;

beforeAll(() => {
  jest.resetModules();

  jest.doMock('axios', () => ({
    __esModule: true,
    default: {
      create: jest.fn(() => ({
        interceptors: {
          response: {
            use: jest.fn((s, e) => {
              successHandler = s;
              errorHandler   = e;
            }),
          },
        },
      })),
    },
  }));

  require('../api');
});

afterEach(() => {
  jest.clearAllMocks();
  // pushState est la seule méthode fiable pour modifier window.location dans JSDOM
  window.history.pushState({}, '', '/dashboard');
});

describe('api.js intercepteur response', () => {

  it('laisse passer une réponse 200 sans modification', () => {
    const fakeResponse = { status: 200, data: { ok: true } };
    expect(successHandler(fakeResponse)).toEqual(fakeResponse);
  });

  it('log console.error sur timeout (ECONNABORTED)', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      errorHandler({ code: 'ECONNABORTED', response: undefined })
    ).rejects.toMatchObject({ code: 'ECONNABORTED' });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Timeout'));
    consoleSpy.mockRestore();
  });

  it('log console.error si pas de réponse réseau', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      errorHandler({ response: undefined, code: undefined })
    ).rejects.toBeDefined();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('réseau'));
    consoleSpy.mockRestore();
  });

  it('dispatche auth:unauthorized sur 401 depuis une page protégée', async () => {
    window.history.pushState({}, '', '/profil'); // pathname = '/profil' → non public
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    await expect(
      errorHandler({ response: { status: 401 } })
    ).rejects.toBeDefined();

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'auth:unauthorized' })
    );
  });

  it('NE dispatche PAS auth:unauthorized si déjà sur /connexion', async () => {
    window.history.pushState({}, '', '/connexion'); // pathname public → pas de redirect
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    await expect(
      errorHandler({ response: { status: 401 } })
    ).rejects.toBeDefined();

    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'auth:unauthorized' })
    );
  });

  it('NE dispatche PAS auth:unauthorized depuis la page d\'accueil (/)', async () => {
    window.history.pushState({}, '', '/'); // '/' est dans publicPaths
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    await expect(
      errorHandler({ response: { status: 401 } })
    ).rejects.toBeDefined();

    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'auth:unauthorized' })
    );
  });

  it('log console.error sur erreur 500 (hors production)', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      errorHandler({
        response: { status: 500, data: { message: 'Erreur interne' } },
        message: 'Request failed',
      })
    ).rejects.toBeDefined();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Erreur serveur'),
      expect.anything()
    );
    consoleSpy.mockRestore();
  });

});