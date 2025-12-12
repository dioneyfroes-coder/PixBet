import { authApi } from '../modules';
import type {
  AuthCredentialsPayload,
  AuthRegistrationPayload,
  AuthSessionSnapshot,
  UserProfile,
} from '../schemas';
import { resolveOptionalAuthOptions } from './_internal';
import type { AccessTokenOptions } from './_internal';

export type LoginPayload = AuthCredentialsPayload;
export type RegisterPayload = AuthRegistrationPayload;
export type AuthSession = AuthSessionSnapshot;
export type RegisterResponse = AuthSessionSnapshot;
export type UserSnapshot = UserProfile;

export type LoginOptions = AccessTokenOptions & {
  suppressErrorHandler?: boolean;
};

export async function login(payload: LoginPayload, _options?: LoginOptions): Promise<AuthSession> {
  const { data } = await authApi.login(payload);
  if (!data) {
    throw new Error('Não foi possível autenticar agora. Tente novamente.');
  }
  return data;
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  const { data } = await authApi.register(payload);
  if (!data) {
    throw new Error('Cadastro respondido sem dados. Verifique e tente novamente.');
  }
  return data;
}

export async function me(opts?: AccessTokenOptions): Promise<UserSnapshot | null> {
  const authOptions = await resolveOptionalAuthOptions(opts);
  if (!authOptions?.token) {
    return null;
  }
  const { data } = await authApi.me(authOptions);
  return data ?? null;
}

export async function logout(opts?: AccessTokenOptions): Promise<void> {
  const authOptions = await resolveOptionalAuthOptions(opts);
  if (!authOptions?.token) {
    return;
  }
  await authApi.logout(authOptions);
}

export default { login, register, me, logout };
