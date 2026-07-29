jest.mock('axios', () => {
  const mockClient = {
    post: jest.fn(),
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };

  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockClient),
    },
  };
});

import axios from 'axios';
import { authApi } from '../apiClient';

const mockedAxios = axios as typeof axios & {
  create: jest.Mock;
};
const mockClient = mockedAxios.create.mock.results[0]?.value;

describe('authApi', () => {
  beforeEach(() => {
    mockClient.post.mockReset();
  });

  it('registers a new user with email and password', async () => {
    mockClient.post.mockResolvedValue({ data: { user: { id: '1', email: 'test@example.com', role: 'Client' } } });

    await authApi.register({
      email: 'test@example.com',
      password: 'securePass123',
      fullName: 'Ada Lovelace',
      location: 'Yaoundé',
      role: 'Client',
    });

    expect(mockClient.post).toHaveBeenCalledWith('/auth/register', {
      email: 'test@example.com',
      password: 'securePass123',
      fullName: 'Ada Lovelace',
      location: 'Yaoundé',
      role: 'Client',
    });
  });

  it('logs in with email and password', async () => {
    mockClient.post.mockResolvedValue({ data: { user: { id: '1', email: 'test@example.com' }, session: { accessToken: 'token' } } });

    await authApi.login({ email: 'test@example.com', password: 'securePass123' });

    expect(mockClient.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'securePass123',
    });
  });
});

