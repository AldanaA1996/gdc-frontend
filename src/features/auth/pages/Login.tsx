import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { LoginCredentials } from '../types/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  identifier: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    identifier: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await login(credentials);
      localStorage.setItem('token', data.jwt);
      // Puedes guardar más información del usuario si lo deseas
      navigate('/dashboard'); // Redirige al dashboard o página principal
    } catch (err) {
      setError('Credenciales inválidas. Por favor, intenta nuevamente.');
    }
  };

  return (
    <Card className="w-96 mx-auto mt-20 bg-gray shadow-lg p-6 justify-center">
      <CardHeader className="text-center">
        <CardTitle>Login</CardTitle>
        <CardDescription>Inicia Sesión</CardDescription>
      </CardHeader>
      <CardContent>
          <form 
            className="flex flex-col gap-4" 
            onSubmit={handleSubmit}>
            <input
              className='border p-2 rounded'
              type="email"
              name="identifier"
              placeholder="Email"
              value={credentials.identifier}
              onChange={handleChange}
              required
            />
            <input
              className='border p-2 rounded'
              type="password"
              name="password"
              placeholder="Contraseña"
              value={credentials.password}
              onChange={handleChange}
              required
            />
            <Button type="submit">Iniciar sesión</Button>
            {error && <p>{error}</p>}
          </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center justify-center">
        <div className=" flex justify-between pb-4 w-full">
          <p className="text-sm text-gray-500">¿No tienes una cuenta?</p>
          <a className="text-sm text-blue-400" href="/register">Registrate</a>
        </div>
        <div className="flex justify-between border-t border-gray-300 pt-4 w-full">
          <p className="text-sm text-gray-500">Olvidaste tu contraseña?</p> <a className="text-sm text-blue-400" href="/forgot-password">Recuperar</a>
        </div>      
      </CardFooter>
    </Card>

    
  );
};

export default Login;
