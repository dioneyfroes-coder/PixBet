import type { Route } from './+types/perfil';
import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLoaderData } from 'react-router';
import { useAccountHydration } from '../hooks/useAccountHydration';
import { selectWalletBalance, useAccountStore } from '../stores/useAccountStore';
import type { AccountHydrationPayload } from '../stores/useAccountStore';
import { PageShell } from '../components/page-shell';
import AccountStats from '../components/account/AccountStats';
import { FadeIn } from '../components/animation';
import Notifications from '../components/profile/Notifications';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Modal } from '../components/ui/modal';
import PersonalForm from '../components/profile/PersonalForm';
import PixKeyCard from '../components/profile/PixKeyCard';

import { requireAuth } from '../utils/auth.server';
import { useI18n } from '../i18n/i18n-provider';
import { usersApi, type PreferencesSnapshot } from '../lib/sdk/modules/users';
import { resolveOptionalAuthOptions, resolveAuthOptions } from '../lib/sdk/clients/_internal';
// SecureBalance removed from profile to avoid displaying wallet balance in profile

interface StatItem {
  label?: string;
  value?: string | number;
}

interface HistoryEntry {
  event?: string;
  odd?: string | number;
  status?: string;
}

interface UserProfile {
  name?: string;
  email?: string;
  phone?: string;
  document?: string;
  bio?: string;
  stats?: StatItem[];
  history?: { entries?: HistoryEntry[] };
  notifications?: Record<string, boolean>;
}

const preferenceFieldMap: Record<string, keyof PreferencesSnapshot> = {
  email: 'emailNotifications',
  push: 'smsNotifications',
  security: 'marketingEmails',
} satisfies Record<string, keyof PreferencesSnapshot>;
import { getPageMeta } from '../i18n/page-copy';
import type { ProfileCopy, WalletCopy } from '../types/i18n';

export function meta({}: Route.MetaArgs) {
  const meta = getPageMeta('profile');
  return [{ title: meta.title }, { name: 'description', content: meta.description }];
}

export default function Perfil() {
  const { initialAccountSnapshot } = useLoaderData<{
    initialAccountSnapshot: AccountHydrationPayload | null;
  }>();
  useAccountHydration(initialAccountSnapshot);
  const _walletBalanceCents = useAccountStore(selectWalletBalance);
  const accountUser = useAccountStore((state) => state.user);
  const refreshAccount = useAccountStore((state) => state.refreshAll);
  const resolvedProfileData = useMemo(() => {
    if (!accountUser || typeof accountUser !== 'object') {
      return null;
    }
    const maybe = (accountUser as { user?: unknown }).user;
    if (maybe && typeof maybe === 'object') {
      return maybe as Record<string, unknown>;
    }
    return accountUser as Record<string, unknown>;
  }, [accountUser]);
  const _resolvedBalanceCents =
    _walletBalanceCents ?? initialAccountSnapshot?.wallet?.balance?.amount ?? null;
  const { messages } = useI18n();
  const profileCopy: ProfileCopy = messages.profile;
  const walletCopy = messages.wallet as WalletCopy;
  const getPersonalMsg = (key: string): string | undefined => {
    const v = (profileCopy.personalForm as ProfileCopy['personalForm'])[
      key as keyof ProfileCopy['personalForm']
    ];
    return typeof v === 'string' ? v : undefined;
  };
  const summaryCard = walletCopy.summaryCard;

  // Start with empty form state; backend will populate when available.
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    bio: '',
  });
  const [profileStatus, setProfileStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [documentStatus, setDocumentStatus] = useState<'idle' | 'uploading' | 'processed'>('idle');
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [_documentFiles, setDocumentFiles] = useState<File[] | null>(null);
  const [pixKey, setPixKey] = useState<string | null>(null);
  const [pixStatus, setPixStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [pixError, setPixError] = useState<string | null>(null);
  // modals and related state
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Build notifications initial state from translation keys when backend not available.
  const initialNotifications = useMemo(
    () =>
      (profileCopy?.notifications?.items ?? []).reduce(
        (acc, it) => ({ ...acc, [it.id]: false }),
        {} as Record<string, boolean>
      ),
    [profileCopy?.notifications?.items]
  );
  const mapPreferencesToNotifications = useCallback(
    (prefs?: PreferencesSnapshot | null) => {
      const base = { ...initialNotifications };
      if (!prefs) return base;
      Object.entries(preferenceFieldMap).forEach(([toggle, field]) => {
        if (typeof prefs[field] === 'boolean') {
          base[toggle] = prefs[field] as boolean;
        }
      });
      return base;
    },
    [initialNotifications]
  );
  const [notifications, setNotifications] = useState<Record<string, boolean>>(initialNotifications);
  const [notificationDefaults, setNotificationDefaults] = useState(initialNotifications);
  const profileSnapshotRef = useRef<string | null>(null);

  useEffect(() => {
    setNotifications(initialNotifications);
    setNotificationDefaults(initialNotifications);
  }, [initialNotifications]);

  const [_remoteProfile, setRemoteProfile] = useState<null | Record<string, unknown>>(null);

  useEffect(() => {
    if (!resolvedProfileData) {
      profileSnapshotRef.current = null;
      return;
    }
    const serialized = JSON.stringify(resolvedProfileData);
    if (profileSnapshotRef.current === serialized) {
      return;
    }
    profileSnapshotRef.current = serialized;
    const normalized = resolvedProfileData as UserProfile & {
      firstName?: string;
      lastName?: string;
      username?: string;
    };
    console.info('[perfil] resolved profile data', normalized);
    setRemoteProfile(normalized as Record<string, unknown>);
    setProfileForm((current) => {
      const composedName = [normalized.firstName, normalized.lastName]
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .join(' ');
      return {
        ...current,
        name: normalized.name ?? (composedName.length ? composedName : current.name),
        email: normalized.email ?? current.email,
        phone: normalized.phone ?? current.phone,

        document: normalized.document ?? current.document,
        bio: normalized.bio ?? current.bio,
      };
    });
    if (normalized.notifications && typeof normalized.notifications === 'object') {
      setNotifications((current) => ({ ...current, ...normalized.notifications }));
    }
    // Populate pixKey from resolved profile when available (use safe access)
    const maybePix = (normalized as Record<string, unknown>)['pixKey'];
    if (typeof maybePix === 'string') setPixKey(maybePix);
  }, [resolvedProfileData]);

  // If profile didn't include pixKey, try to fetch it via SDK (optional)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (pixKey !== null) return;
      try {
        const authOptions = await resolveOptionalAuthOptions();
        if (!authOptions) return;
        const { data } = await usersApi.getPixKey(authOptions);
        if (!mounted) return;
        if (data && typeof data.pixKey === 'string') {
          setPixKey(data.pixKey || null);
        }
      } catch {
        // ignore — optional fetch
      }
    })();
    return () => {
      mounted = false;
    };
  }, [pixKey]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const authOptions = await resolveAuthOptions();
        const { data } = await usersApi.getPreferences(authOptions);
        if (!mounted) return;
        const next = mapPreferencesToNotifications(data ?? null);
        setNotifications(next);
        setNotificationDefaults(next);
      } catch (err) {
        console.error('[perfil] failed to load preferences', err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [mapPreferencesToNotifications]);

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.info('[perfil] submitting profile update', {
      current: _remoteProfile,
      form: profileForm,
    });
    (async () => {
      setProfileStatus('saving');
      try {
        // basic validation
        if (!profileForm.name || profileForm.name.trim().length < 2) {
          throw new Error(getPersonalMsg('nameRequired') ?? 'Nome inválido');
        }
        if (!profileForm.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
          throw new Error(getPersonalMsg('emailInvalid') ?? 'E-mail inválido');
        }
        const authOptions = await resolveAuthOptions();
        const parts = profileForm.name.trim().split(/\s+/);
        const firstName = parts.shift() ?? '';
        const lastName = parts.join(' ') || undefined;
        await usersApi.updateProfile(
          {
            firstName: firstName || undefined,
            lastName: lastName || undefined,
          },
          authOptions
        );
        // Update additional free-form profile fields if provided
        const extra: Record<string, unknown> = {};
        if (profileForm.phone && profileForm.phone.trim().length > 0)
          extra.phone = profileForm.phone.trim();
        if (profileForm.document && profileForm.document.trim().length > 0)
          extra.document = profileForm.document.trim();
        if (profileForm.bio && profileForm.bio.trim().length > 0)
          extra.bio = profileForm.bio.trim();
        if (Object.keys(extra).length > 0) {
          await usersApi.patchProfile(extra as Record<string, string>, authOptions);
        }
        console.info('[perfil] profile update succeeded', {
          name: profileForm.name.trim(),
          email: profileForm.email.trim(),
          extra,
        });
        setProfileStatus('saved');
        window.setTimeout(() => setProfileStatus('idle'), 1200);
      } catch (err) {
        console.error('failed to update profile', err);
        setProfileStatus('idle');
      }
    })();
  };

  const handleSavePreferences = async () => {
    try {
      const authOptions = await resolveAuthOptions();
      const payload: Partial<PreferencesSnapshot> = {};
      Object.entries(preferenceFieldMap).forEach(([toggle, field]) => {
        payload[field] = Boolean(notifications[toggle]);
      });
      console.info('[perfil] saving notification preferences', payload);
      const { data } = await usersApi.updatePreferences(payload, authOptions);
      const next = mapPreferencesToNotifications(data ?? null);
      setNotifications(next);
      setNotificationDefaults(next);
      console.info('[perfil] notification preferences saved', { data });
    } catch (err) {
      console.error('[perfil] failed to save notification preferences', err);
    }
  };

  const handlePixSave = async (event?: FormEvent | MouseEvent) => {
    event?.preventDefault?.();
    setPixStatus('saving');
    setPixError(null);
    try {
      // Normalize: trim and remove internal whitespace
      const raw = pixKey ?? '';
      const normalized = raw.trim().replace(/\s+/g, '');
      // Allow clearing the pixKey (empty string) to remove it
      if (normalized.length === 0) {
        const authOptions = await resolveAuthOptions();
        await usersApi.updatePixKey({ pixKey: '' }, authOptions);
        await refreshAccount({ accessToken: authOptions.token });
        setPixKey('');
        setPixStatus('saved');
        window.setTimeout(() => setPixStatus('idle'), 1200);
        return;
      }

      // Basic length checks
      if (normalized.length < 5) {
        setPixStatus('error');
        setPixError(getPersonalMsg('pixKeyTooShort') ?? getPersonalMsg('pixKeyInvalid') ?? null);
        return;
      }
      if (normalized.length > 180) {
        setPixStatus('error');
        setPixError(getPersonalMsg('pixKeyTooLong') ?? getPersonalMsg('pixKeyInvalid') ?? null);
        return;
      }

      // Type-specific validation
      const isEmail = /@/.test(normalized);
      const isPossiblePhone = /^\+?\d[\d\-() ]+$/.test(raw);
      const digitsOnly = normalized.replace(/\D/g, '');
      const isCpfCnpj =
        /^\d+$/.test(digitsOnly) && (digitsOnly.length === 11 || digitsOnly.length === 14);

      // Helper: CPF verifier
      const validateCPF = (cpf: string) => {
        const nums = cpf.replace(/\D/g, '');
        if (nums.length !== 11) return false;
        // reject same digits
        if (/^(\d)\1{10}$/.test(nums)) return false;
        const calc = (t: number) => {
          let sum = 0;
          for (let i = 0; i < t - 1; i++) sum += Number(nums.charAt(i)) * (t - i);
          const d = (sum * 10) % 11;
          return d === 10 ? 0 : d;
        };
        const v1 = calc(10);
        const v2 = calc(11);
        return v1 === Number(nums.charAt(9)) && v2 === Number(nums.charAt(10));
      };

      // Helper: CNPJ verifier
      const validateCNPJ = (cnpj: string) => {
        const nums = cnpj.replace(/\D/g, '');
        if (nums.length !== 14) return false;
        if (/^(\d)\1{13}$/.test(nums)) return false;
        const calc = (t: number) => {
          let sum = 0;
          let pos = t - 7;
          for (let i = t; i >= 1; i--) {
            sum += Number(nums.charAt(t - i)) * pos--;
            if (pos < 2) pos = 9;
          }
          const res = sum % 11;
          return res < 2 ? 0 : 11 - res;
        };
        const v1 = calc(12);
        const v2 = calc(13);
        return v1 === Number(nums.charAt(12)) && v2 === Number(nums.charAt(13));
      };

      if (isEmail) {
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(normalized)) {
          setPixStatus('error');
          setPixError(
            getPersonalMsg('pixKeyInvalidEmail') ?? getPersonalMsg('pixKeyInvalid') ?? null
          );
          return;
        }
      } else if (isPossiblePhone) {
        const phone = normalized.replace(/[^0-9+]/g, '');
        const phoneRe = /^\+?\d{8,15}$/;
        if (!phoneRe.test(phone)) {
          setPixStatus('error');
          setPixError(
            getPersonalMsg('pixKeyInvalidPhone') ?? getPersonalMsg('pixKeyInvalid') ?? null
          );
          return;
        }
      } else if (isCpfCnpj) {
        // In production, apply strict checksum validation for CPF/CNPJ
        if (process.env.NODE_ENV === 'production') {
          const valid =
            digitsOnly.length === 11 ? validateCPF(digitsOnly) : validateCNPJ(digitsOnly);
          if (!valid) {
            setPixStatus('error');
            setPixError(
              getPersonalMsg('pixKeyInvalidCpfCnpjDigits') ??
                getPersonalMsg('pixKeyInvalidCpfCnpj') ??
                getPersonalMsg('pixKeyInvalid') ??
                null
            );
            return;
          }
        }
      }

      const authOptions = await resolveAuthOptions();
      await usersApi.updatePixKey({ pixKey: normalized }, authOptions);
      await refreshAccount({ accessToken: authOptions.token });
      // reflect normalized value in UI
      setPixKey(normalized || '');
      setPixStatus('saved');
      setPixError(null);
      window.setTimeout(() => setPixStatus('idle'), 1200);
    } catch (err) {
      console.error('failed to update pix key', err);
      setPixStatus('error');
      window.setTimeout(() => setPixStatus('idle'), 2000);
    }
  };

  const handleDocUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) return;
    setDocumentFiles(files);
    setDocumentName(files.map((f) => f.name).join(', '));
    // require at least 3 documents
    if (files.length < 3) {
      setDocumentStatus('idle');
      return;
    }
    (async () => {
      setDocumentStatus('uploading');
      try {
        const authOptions = await resolveAuthOptions();
        const form = new FormData();
        files.forEach((f) => form.append('files', f));
        await usersApi.uploadDocuments(form, authOptions);
        setDocumentStatus('processed');
      } catch (err) {
        console.error('document upload failed', err);
        setDocumentStatus('idle');
      }
    })();
  };

  const _openEmailModal = () => {
    setEmailInput(profileForm.email ?? '');
    setEmailModalOpen(true);
  };

  const handleSaveEmail = async () => {
    if (!emailInput || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) return;
    setIsSavingEmail(true);
    try {
      const authOptions = await resolveAuthOptions();
      await usersApi.updateEmail({ email: emailInput.trim() }, authOptions);
      setProfileForm((c) => ({ ...c, email: emailInput.trim() }));
      setEmailModalOpen(false);
    } catch (err) {
      console.error('failed to update email', err);
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) return;
    setIsChangingPassword(true);
    try {
      const authOptions = await resolveAuthOptions();
      await usersApi.changePassword({ currentPassword, newPassword }, authOptions);
      setPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('failed to change password', err);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== 'DELETAR') return;
    setIsDeletingAccount(true);
    try {
      const authOptions = await resolveAuthOptions();
      await usersApi.deleteAccount(authOptions);
      // best-effort: navigate to home or show message; leave to caller to logout
      setDeleteModalOpen(false);
    } catch (err) {
      console.error('failed to delete account', err);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <PageShell title={profileCopy.title} description={profileCopy.description}>
      <FadeIn>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{summaryCard.title}</CardTitle>
              <p className="text-sm text-[var(--color-muted)]">{summaryCard.description}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Balance display removed from profile for privacy */}
            <p className="text-xs text-[var(--color-muted)]">{summaryCard.realtimeLabel}</p>
          </CardContent>
        </Card>
      </FadeIn>
      {/* Replace mock stats visual with AccountStats component which reads from the store */}
      <AccountStats />

      {/* Recent history removed from profile — activities are centralized in Atividades */}

      <FadeIn>
        <PersonalForm
          profileCopy={profileCopy.personalForm}
          profileForm={profileForm}
          setProfileForm={setProfileForm}
          profileStatus={profileStatus}
          handleProfileSubmit={handleProfileSubmit}
        />
      </FadeIn>

      <FadeIn delay={0.05}>
        <PixKeyCard
          walletCopy={walletCopy}
          pixKey={pixKey}
          setPixKey={(v: string) => setPixKey(v)}
          pixStatus={pixStatus}
          pixError={pixError}
          handlePixSave={handlePixSave}
        />
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-2">
        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{profileCopy.documentUpload.title}</CardTitle>
              <p className="text-sm text-[var(--color-muted)]">
                {profileCopy.documentUpload.description}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <label
                htmlFor="document-upload"
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[color:var(--color-border)] bg-[var(--color-surface-muted)] px-6 py-10 text-center"
              >
                <p className="text-lg font-semibold text-[var(--color-text)]">
                  {documentName ?? profileCopy.documentUpload.dropzoneLabel}
                </p>
                <p className="text-sm text-[var(--color-muted)]">
                  {profileCopy.documentUpload.acceptedFormats}
                </p>
                <span className="mt-3 rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                  {profileCopy.documentUpload.statusLabels[documentStatus]}
                </span>
              </label>
              <input
                id="document-upload"
                type="file"
                accept=".pdf,image/*"
                className="sr-only"
                onChange={handleDocUpload}
              />
              <p className="text-xs text-[var(--color-muted)]">
                {profileCopy.documentUpload.helper}
              </p>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Notifications
            copy={profileCopy.notifications}
            notifications={notifications}
            onChange={(next) => setNotifications(next)}
            onReset={() => setNotifications(notificationDefaults)}
            onSave={handleSavePreferences}
          />
        </FadeIn>
      </div>
      {/* Email modal */}
      <Modal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        title={getPersonalMsg('changeEmailTitle') ?? 'Alterar e-mail'}
        description={getPersonalMsg('changeEmailDescription') ?? ''}
        footer={
          <>
            <Button type="button" onClick={handleSaveEmail} disabled={isSavingEmail}>
              {isSavingEmail ? 'Salvando...' : 'Salvar e-mail'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setEmailModalOpen(false)}>
              Cancelar
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="text-sm font-medium" htmlFor="modal-email-input">
            {profileCopy.personalForm.fields.email.label}
          </label>
          <Input
            id="modal-email-input"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            type="email"
          />
        </div>
      </Modal>

      {/* Password modal */}
      <Modal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title={getPersonalMsg('changePasswordTitle') ?? 'Alterar senha'}
        description={getPersonalMsg('changePasswordDescription') ?? ''}
        footer={
          <>
            <Button type="button" onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? 'Aguarde...' : 'Alterar senha'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setPasswordModalOpen(false)}>
              Cancelar
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="text-sm font-medium" htmlFor="current-password">
            Senha atual
          </label>
          <Input
            id="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            type="password"
          />
          <label className="text-sm font-medium" htmlFor="new-password">
            Nova senha
          </label>
          <Input
            id="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            type="password"
          />
          <label className="text-sm font-medium" htmlFor="confirm-password">
            Confirmar nova senha
          </label>
          <Input
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
          />
        </div>
      </Modal>

      {/* Delete account modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={getPersonalMsg('deleteAccountTitle') ?? 'Excluir conta'}
        description={getPersonalMsg('deleteAccountDescription') ?? 'Esta ação é irreversível.'}
        footer={
          <>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
            >
              {isDeletingAccount ? 'Excluindo...' : 'Excluir conta'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancelar
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-muted)]">
            {getPersonalMsg('deleteConfirmNote') ?? 'Digite "DELETAR" para confirmar.'}
          </p>
          <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} />
        </div>
      </Modal>
    </PageShell>
  );
}

export async function loader(args: Route.LoaderArgs) {
  const { accessToken } = await requireAuth(args);
  try {
    const [{ getMyWallet }, { me }] = await Promise.all([
      import('../lib/sdk/clients/wallet'),
      import('../lib/sdk/clients/auth'),
    ]);
    const [wallet, user] = await Promise.all([getMyWallet({ accessToken }), me({ accessToken })]);
    return {
      initialAccountSnapshot: {
        wallet,
        user,
        syncedAt: new Date().toISOString(),
      },
    };
  } catch {
    return { initialAccountSnapshot: null };
  }
}
