/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import {AuthProvider, useAuth} from '../src/context/AuthContext';

const {act} = ReactTestRenderer;

const user = {id: 'u1', name: 'Asha', email: 'asha@test.com', phone: '', avatar: '', roles: [], createdAt: ''};
const TOKEN = 'secret-token';

let auth: ReturnType<typeof useAuth>;
const Capture = () => {
  auth = useAuth();
  return null;
};

async function renderAuth() {
  await act(async () => {
    ReactTestRenderer.create(
      <AuthProvider>
        <Capture />
      </AuthProvider>,
    );
  });
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({token: TOKEN, user}),
  });
});

test('keeps the token in secure storage, never AsyncStorage', async () => {
  await renderAuth();
  await act(async () => {
    await auth.login('asha@test.com', 'password');
  });

  expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
    'u1',
    TOKEN,
    expect.objectContaining({service: 'realapp.auth'}),
  );
  const keys = await AsyncStorage.getAllKeys();
  const saved = await AsyncStorage.multiGet(keys);
  expect(JSON.stringify(saved)).not.toContain(TOKEN);
});

test('restores the session from secure storage', async () => {
  await AsyncStorage.setItem('@realapp_user', JSON.stringify(user));
  (Keychain.getGenericPassword as jest.Mock).mockResolvedValueOnce({username: 'u1', password: TOKEN});
  await renderAuth();

  expect(auth.isAuthenticated).toBe(true);
  expect(auth.user?.id).toBe('u1');
});

test('stays signed out when there is no saved token', async () => {
  await AsyncStorage.setItem('@realapp_user', JSON.stringify(user));
  await renderAuth();

  expect(auth.isAuthenticated).toBe(false);
});

test('clears secure storage on logout', async () => {
  await renderAuth();
  await act(async () => {
    await auth.login('asha@test.com', 'password');
    await auth.logout();
  });

  expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({service: 'realapp.auth'});
  expect(await AsyncStorage.getItem('@realapp_user')).toBeNull();
});

test('still signs in when the device cannot save the session', async () => {
  (Keychain.setGenericPassword as jest.Mock).mockRejectedValueOnce(new Error('no secure storage'));
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  await renderAuth();

  let error: string | null = 'not called';
  await act(async () => {
    error = await auth.login('asha@test.com', 'password');
  });

  expect(error).toBeNull();
  expect(auth.isAuthenticated).toBe(true);
  warn.mockRestore();
});
