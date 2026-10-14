import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/api/appClient';
import { tokenStore } from '@/lib/app-params';
import { LogIn } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [registering, setRegistering] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '', displayName: '' });

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await apiClient.request(registering ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST',
        body: form,
      });
      tokenStore.setToken(result.access_token);
      const returnTo = search.get('returnTo');
      navigate(returnTo?.startsWith('/') ? returnTo : '/', { replace: true });
      window.location.reload();
    } catch (reason) {
      setError(reason?.message || 'Unable to sign in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      icon={LogIn}
      title={registering ? 'Create your account' : 'Welcome back'}
      subtitle="Sign in to publish, message members, and manage your profile."
    >
      <form className="space-y-4" onSubmit={submit}>
        {registering && (
          <Input
            required
            autoComplete="name"
            placeholder="Display name"
            value={form.displayName}
            onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
          />
        )}
        <Input
          required
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        />
        <Input
          required
          type="password"
          minLength={10}
          autoComplete={registering ? 'new-password' : 'current-password'}
          placeholder="Password"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
        />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" disabled={busy} type="submit">
          {busy ? 'Please wait…' : registering ? 'Create account' : 'Sign in'}
        </Button>
        <button
          className="w-full text-sm text-muted-foreground underline"
          type="button"
          disabled={busy}
          onClick={() => setRegistering((value) => !value)}
        >
          {registering ? 'Already have an account? Sign in' : 'New here? Create an account'}
        </button>
      </form>
    </AuthLayout>
  );
}
