export interface LoginCredentials {
    identifier: string;
    password: string;
  }
  
  export interface LoginResponse {
    jwt: string;
    user: {
      id: number;
      username: string;
      email: string;
      password: string;
    };
  }
  