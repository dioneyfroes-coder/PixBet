export type DepositModalCopy = {
  title?: string;
  description?: string;
  confirming?: string;
  confirm?: string;
  close?: string;
  amountLabel?: string;
  expiresHelper?: string;
  testingTitle?: string;
  testingDescription?: string;
  processingHint?: string;
  awaitingConfirmation?: string;
  devHelper?: string;
};

export type DepositCardCopy = {
  title?: string;
  description?: string;
  amountLabel?: string;
  submitting?: string;
  submit?: string;
  pausedHelper?: string;
  modal?: DepositModalCopy;
  pendingHint?: string;
  summaryLabel?: string;
  expiresLabel?: string;
  errors?: {
    depositMin?: string;
    depositMax?: string;
    depositCreate?: string;
  };
};

export type WithdrawCardCopy = {
  title?: string;
  description?: string;
  amountLabel?: string;
  submitting?: string;
  submit?: string;
  pixRegisteredLabel?: string;
  missingPixNote?: string;
  ctaRegisterPix?: string;
  registerLabel?: string;
  registerTitle?: string;
  registerDescription?: string;
  registerInvalid?: string;
  registering?: string;
  registerConfirm?: string;
  registerCancel?: string;
  registerHint?: string;
  registerFailed?: string;
  confirmTitle?: string;
  confirmDescription?: string;
  confirm?: string;
  cancel?: string;
  confirmHint?: string;
  successNote?: string;
  requestFail?: string;
  pausedHelper?: string;
  /** optional helpers to describe min/max limits */
  limitsHelper?: { range?: string; minOnly?: string; maxOnly?: string };
  status?: { active?: string; paused?: string };
};

export type SummaryCardCopy = {
  title?: string;
  description?: string;
  liquidLabel?: string;
  lastDepositLabel?: string;
  realtimeLabel?: string;
  syncingLabel?: string;
  hiddenBalancePlaceholder?: string;
  showBalance?: string;
  hideBalance?: string;
  loadingBalance?: string;
  balanceError?: string;
  noRecords?: string;
  pendingTemplate?: string;
  activeChannels?: string;
};

export type MonitoringCardCopy = {
  title?: string;
  description?: string;
  orchestratorLabel?: string;
  onlineCopy?: string;
  syncingCopy?: string;
  transactionsLabel?: string;
  successRateLabel?: string;
};

export type ChannelsCopy = Record<string, string>;
export type StatusesCopy = Record<string, string>;

export default {} as never;
import type { TranslationMessages } from '../i18n/config';

export type HomeCopy = TranslationMessages['home'];
export type GamesHubCopy = TranslationMessages['gamesHub'];
export type AuditCopy = TranslationMessages['audit'];
export type ContactCopy = TranslationMessages['contact'];
export type LoginCopy = TranslationMessages['login'];
export type StoreCopy = TranslationMessages['store'];
export type ProfileCopy = TranslationMessages['profile'];
export type ActivityCopy = TranslationMessages['activity'];
export type AboutCopy = TranslationMessages['about'];
export type GameDetailCopy = TranslationMessages['gameDetail'];
export type WalletCopy = TranslationMessages['wallet'];

export type ProfileHistoryStatus = keyof TranslationMessages['profile']['history']['statusLabels'];
