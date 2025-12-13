import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { sendApiRequest } from '../../lib/sdk/core/client';
import { usersApi } from '../../lib/sdk/modules/users';
import { resolveAuthOptions } from '../../lib/sdk/clients/_internal';

export default function Security() {
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

  const handleSaveEmail = async () => {
    if (!emailInput || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) return;
    setIsSavingEmail(true);
    try {
      const authOptions = await resolveAuthOptions();
      await usersApi.updateEmail({ email: emailInput.trim() }, authOptions);
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
      await sendApiRequest('/users/me/password', {
        method: 'POST',
        body: { currentPassword, newPassword },
        target: 'api',
        token: authOptions.token,
      });
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
      await sendApiRequest('/users/me', {
        method: 'DELETE',
        target: 'api',
        token: authOptions.token,
      });
      setDeleteModalOpen(false);
    } catch (err) {
      console.error('failed to delete account', err);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="flex gap-3">
      <Button type="button" variant="outline" onClick={() => setEmailModalOpen(true)}>
        Alterar e-mail
      </Button>
      <Button type="button" variant="outline" onClick={() => setPasswordModalOpen(true)}>
        Alterar senha
      </Button>
      <Button type="button" variant="destructive" onClick={() => setDeleteModalOpen(true)}>
        Excluir conta
      </Button>

      <Modal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        title={'Alterar e-mail'}
        description={''}
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
          <label htmlFor="email-input" className="text-sm font-medium">
            E-mail
          </label>
          <Input
            id="email-input"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            type="email"
          />
        </div>
      </Modal>

      <Modal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title={'Alterar senha'}
        description={''}
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
          <label htmlFor="current-password" className="text-sm font-medium">
            Senha atual
          </label>
          <Input
            id="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            type="password"
          />
          <label htmlFor="new-password" className="text-sm font-medium">
            Nova senha
          </label>
          <Input
            id="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            type="password"
          />
          <label htmlFor="confirm-password" className="text-sm font-medium">
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

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={'Excluir conta'}
        description={'Esta ação é irreversível.'}
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
            Digite &quot;DELETAR&quot; para confirmar.
          </p>
          <Input
            id="delete-confirm"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
