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
