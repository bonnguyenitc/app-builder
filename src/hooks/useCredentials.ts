import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Credential } from '../types/credential';

export const useCredentials = () => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCredentials = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<Credential[]>('get_credentials');
      setCredentials(result);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const createCredential = async (
    credential: Credential,
    apiKeyContent?: string,
    serviceAccountJson?: string,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<Credential>('create_credential', {
        credential,
        apiKeyContent,
        serviceAccountJson,
      });
      await loadCredentials();
      return result;
    } catch (err) {
      setError(err as string);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCredential = async (
    credential: Credential,
    apiKeyContent?: string,
    serviceAccountJson?: string,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<Credential>('update_credential', {
        credential,
        apiKeyContent,
        serviceAccountJson,
      });
      await loadCredentials();
      return result;
    } catch (err) {
      setError(err as string);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCredential = async (credentialId: string, platform: string) => {
    setLoading(true);
    setError(null);
    try {
      await invoke('delete_credential_by_id', {
        credentialId,
        platform,
      });
      await loadCredentials();
    } catch (err) {
      setError(err as string);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getCredentialSecret = async (credentialId: string, platform: string) => {
    try {
      const secret = await invoke<string>('get_credential_secret', {
        credentialId,
        platform,
      });
      return secret;
    } catch (err) {
      setError(err as string);
      throw err;
    }
  };

  useEffect(() => {
    loadCredentials();
  }, []);

  return {
    credentials,
    loading,
    error,
    loadCredentials,
    createCredential,
    updateCredential,
    deleteCredential,
    getCredentialSecret,
  };
};
