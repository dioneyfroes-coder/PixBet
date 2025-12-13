import React from 'react';
import type { ProfileCopy } from '../../types/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import Security from './Security';

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  document: string;
  bio: string;
}

interface Props {
  profileCopy: ProfileCopy['personalForm'];
  profileForm: ProfileForm;
  setProfileForm: (fn: (current: ProfileForm) => ProfileForm) => void;
  profileStatus: 'idle' | 'saving' | 'saved';
  handleProfileSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function PersonalForm({
  profileCopy,
  profileForm,
  setProfileForm,
  profileStatus,
  handleProfileSubmit,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{profileCopy.title}</CardTitle>
        <p className="text-sm text-[var(--color-muted)]">{profileCopy.description}</p>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleProfileSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="profile-name">
                {profileCopy.fields.name.label}
              </label>
              <Input
                id="profile-name"
                value={profileForm.name}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setProfileForm((current) => ({ ...current, name: event.target.value }))
                }
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="profile-email">
                {profileCopy.fields.email.label}
              </label>
              <Input
                id="profile-email"
                type="email"
                value={profileForm.email}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setProfileForm((current) => ({ ...current, email: event.target.value }))
                }
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="profile-phone">
                {profileCopy.fields.phone.label}
              </label>
              <Input
                id="profile-phone"
                value={profileForm.phone}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setProfileForm((current) => ({ ...current, phone: event.target.value }))
                }
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="profile-document">
                {profileCopy.fields.document.label}
              </label>
              <Input
                id="profile-document"
                value={profileForm.document}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setProfileForm((current) => ({ ...current, document: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="profile-bio">
              {profileCopy.fields.notes.label}
            </label>
            <textarea
              id="profile-bio"
              value={profileForm.bio}
              onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                setProfileForm((current) => ({ ...current, bio: event.target.value }))
              }
              className="min-h-[120px] w-full rounded-2xl border border-[color:var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text)] outline-none focus-visible:ring focus-visible:ring-[color:var(--color-primary)]/40"
              placeholder={profileCopy.fields.notes.placeholder}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" disabled={profileStatus === 'saving'}>
              {profileStatus === 'saving' ? profileCopy.savingLabel : profileCopy.saveCta}
            </Button>
            <Security />
            {profileStatus === 'saved' && (
              <span className="text-sm text-emerald-400">{profileCopy.savedNote}</span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
