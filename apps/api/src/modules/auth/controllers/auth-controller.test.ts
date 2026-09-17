import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';

const { loginMock, registerMock, refreshMock, logoutMock } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  registerMock: vi.fn(),
  refreshMock: vi.fn(),
  logoutMock: vi.fn(),
}));

vi.mock('../services/auth-service.js', () => ({
  default: { login: loginMock, register: registerMock, refresh: refreshMock, logout: logoutMock },
}));

import authController from './auth-controller.js';

function makeReq(body: unknown) {
  return { body } as Request;
}

interface FakeRes extends Response {
  statusCode: number;
  body: unknown;
  status(code: number): this;
  json(data: unknown): this;
}

function makeRes(): FakeRes {
  const res = {
    statusCode: 0,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      if (this.statusCode === 0) this.statusCode = 200;
      this.body = data;
      return this;
    },
  };
  return res as FakeRes;
}

describe('AuthController.login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 400 com dados inválidos', async () => {
    const res = makeRes();

    await authController.login(makeReq({ email: '', password: '' }), res);

    expect(res.statusCode).toBe(400);
  });

  it('retorna 200 com user + tokens', async () => {
    loginMock.mockResolvedValue({ user: { id: '1' }, accessToken: 'at', refreshToken: 'rt' });
    const res = makeRes();

    await authController.login(makeReq({ email: 'a@b.com', password: '12345678' }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ user: { id: '1' }, accessToken: 'at', refreshToken: 'rt' });
  });

  it('retorna 401 se o serviço lança Error', async () => {
    loginMock.mockRejectedValue(new Error('Senha inválida'));
    const res = makeRes();

    await authController.login(makeReq({ email: 'a@b.com', password: 'x' }), res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Senha inválida' });
  });

  it('retorna 500 se o serviço lança algo que não é Error', async () => {
    loginMock.mockRejectedValue('boom');
    const res = makeRes();

    await authController.login(makeReq({ email: 'a@b.com', password: '12345678' }), res);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ message: 'Erro interno do servidor' });
  });
});

describe('AuthController.register', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 400 com dados inválidos', async () => {
    const res = makeRes();

    await authController.register(makeReq({}), res);

    expect(res.statusCode).toBe(400);
  });

  it('retorna 201 com user + tokens', async () => {
    registerMock.mockResolvedValue({ user: { id: '1' }, accessToken: 'at', refreshToken: 'rt' });
    const res = makeRes();

    await authController.register(
      makeReq({ name: 'João', email: 'a@b.com', password: '12345678', companyName: 'Empresa' }),
      res,
    );

    expect(res.statusCode).toBe(201);
    expect((res.body as { message: string }).message).toBe('Usuário criado com sucesso');
    expect((res.body as { accessToken: string }).accessToken).toBe('at');
  });

  it('retorna 400 se o serviço lança Error', async () => {
    registerMock.mockRejectedValue(new Error('E-mail já está em uso'));
    const res = makeRes();

    await authController.register(
      makeReq({ name: 'João', email: 'a@b.com', password: '12345678', companyName: 'Empresa' }),
      res,
    );

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: 'E-mail já está em uso' });
  });

  it('retorna 500 se o serviço lança algo que não é Error', async () => {
    registerMock.mockRejectedValue('boom');
    const res = makeRes();

    await authController.register(
      makeReq({ name: 'João', email: 'a@b.com', password: '12345678', companyName: 'Empresa' }),
      res,
    );

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ message: 'Erro interno do servidor' });
  });
});

describe('AuthController.refresh', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 400 sem refresh token', async () => {
    const res = makeRes();

    await authController.refresh(makeReq({}), res);

    expect(res.statusCode).toBe(400);
  });

  it('retorna 200 com novo par de tokens', async () => {
    refreshMock.mockResolvedValue({ accessToken: 'novo-at', refreshToken: 'novo-rt' });
    const res = makeRes();

    await authController.refresh(makeReq({ refreshToken: 'rt' }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ accessToken: 'novo-at', refreshToken: 'novo-rt' });
  });

  it('retorna 401 se o serviço lança Error', async () => {
    refreshMock.mockRejectedValue(new Error('Refresh token inválido'));
    const res = makeRes();

    await authController.refresh(makeReq({ refreshToken: 'rt' }), res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Refresh token inválido' });
  });

  it('retorna 500 se o serviço lança algo que não é Error', async () => {
    refreshMock.mockRejectedValue('boom');
    const res = makeRes();

    await authController.refresh(makeReq({ refreshToken: 'rt' }), res);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ message: 'Erro interno do servidor' });
  });
});

describe('AuthController.logout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 400 sem refresh token', async () => {
    const res = makeRes();

    await authController.logout(makeReq({}), res);

    expect(res.statusCode).toBe(400);
  });

  it('retorna 200 com mensagem de sucesso', async () => {
    logoutMock.mockResolvedValue(undefined);
    const res = makeRes();

    await authController.logout(makeReq({ refreshToken: 'rt' }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: 'Logout realizado com sucesso' });
  });

  it('retorna 400 se o serviço lança Error', async () => {
    logoutMock.mockRejectedValue(new Error('Erro ao fazer logout'));
    const res = makeRes();

    await authController.logout(makeReq({ refreshToken: 'rt' }), res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: 'Erro ao fazer logout' });
  });

  it('retorna 500 se o serviço lança algo que não é Error', async () => {
    logoutMock.mockRejectedValue('boom');
    const res = makeRes();

    await authController.logout(makeReq({ refreshToken: 'rt' }), res);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ message: 'Erro interno do servidor' });
  });
});
