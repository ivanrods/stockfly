export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
  token: string;
}
