/// <reference types="node" />
// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import http from 'http';
import type { AddressInfo } from 'net';
import apiClient, { ApiError } from './http-client';

let server: http.Server;
let baseUrl: string;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    if (req.url === '/success') {
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Usuário criado com sucesso' }));
      return;
    }
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'E-mail já está em uso' }));
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('ApiError', () => {
  it('define message e status corretamente', () => {
    const error = new ApiError('E-mail já está em uso', 400);
    expect(error.message).toBe('E-mail já está em uso');
    expect(error.status).toBe(400);
    expect(error.name).toBe('ApiError');
  });
});

describe('http-client', () => {
  it('interceptor transforma resposta de erro em ApiError com message da API', async () => {
    await expect(apiClient.post(`${baseUrl}/error`)).rejects.toMatchObject({
      name: 'ApiError',
      message: 'E-mail já está em uso',
      status: 400,
    });
  });

  it('interceptor lança ApiError de conexão quando não há resposta', async () => {
    await expect(apiClient.get('http://127.0.0.1:1/nonexistent')).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Erro de conexão com o servidor',
      status: 0,
    });
  });

  it('interceptor de sucesso retorna a resposta', async () => {
    const response = await apiClient.post(`${baseUrl}/success`);
    expect(response.data).toEqual({ message: 'Usuário criado com sucesso' });
  });
});
