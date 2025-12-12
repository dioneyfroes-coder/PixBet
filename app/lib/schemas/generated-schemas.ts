// Auto-generated from docs da backend/openapi.json — do not edit manually
import { z } from 'zod';

export const User = z.object({
  "id": z.string().uuid(),
  "email": z.string().email(),
  "username": z.string(),
  "firstName": z.string().optional(),
  "lastName": z.string().optional(),
  "status": z.enum(["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED"] as const),
  "createdAt": z.string()
});

export const Wallet = z.object({
  "id": z.string().uuid().optional(),
  "userId": z.string().uuid().optional(),
  "balance": z.object({
  "amount": z.number().optional(),
  "currency": z.string().optional()
}).optional(),
  "createdAt": z.string().optional()
});

export const RegisterRequest = z.object({
  "email": z.string().email(),
  "password": z.string(),
  "firstName": z.string(),
  "lastName": z.string(),
  "username": z.string()
});

export const LogoutResponse = z.object({
  "success": z.boolean().optional(),
  "data": z.object({
  "message": z.string().optional()
}).optional(),
  "meta": z.object({
  "timestamp": z.string().optional()
}).optional()
});

export const ConflictError = z.object({
  "success": z.boolean().optional(),
  "error": z.object({
  "code": z.string().optional(),
  "message": z.string().optional()
}).optional(),
  "meta": z.object({
  "timestamp": z.string().optional()
}).optional()
});

export const ValidationError = z.record(z.string());

export const Transaction = z.object({
  "id": z.string().uuid().optional(),
  "type": z.string().optional(),
  "amount": z.number().optional(),
  "currency": z.string().optional(),
  "description": z.string().optional(),
  "createdAt": z.string().optional()
});

export const UnauthorizedError = z.object({
  "success": z.boolean().optional(),
  "error": z.object({
  "code": z.string().optional(),
  "message": z.string().optional()
}).optional(),
  "meta": z.object({
  "timestamp": z.string().optional()
}).optional()
});

export const ContactRequest = z.object({
  "name": z.string().optional(),
  "email": z.string().email().optional(),
  "message": z.string(),
  "recaptchaToken": z.string().optional()
});

export const ContactResponse = z.object({
  "success": z.boolean().optional(),
  "data": z.object({
  "message": z.string().optional(),
  "ticketId": z.string().uuid().optional()
}).optional(),
  "meta": z.object({
  "timestamp": z.string().optional()
}).optional()
});

export const UploadDocumentRequest = z.object({
  "document": z.string().optional()
});

export const UploadDocumentResponse = z.object({
  "success": z.boolean().optional(),
  "data": z.object({
  "message": z.string().optional(),
  "document": z.object({
  "id": z.string().optional(),
  "filename": z.string().optional(),
  "originalName": z.string().optional(),
  "mimeType": z.string().optional(),
  "size": z.number().optional(),
  "url": z.string().optional(),
  "uploadedAt": z.string().optional(),
  "verified": z.boolean().optional()
}).optional()
}).optional(),
  "meta": z.object({
  "timestamp": z.string().optional()
}).optional()
});

export const PlaceBetRequest = z.object({
  "eventId": z.string().uuid(),
  "marketId": z.string(),
  "oddId": z.string(),
  "amount": z.number(),
  "type": z.enum(["SINGLE", "MULTIPLE"] as const).optional(),
  "currency": z.enum(["BRL", "USD", "EUR"] as const).optional()
});

export const CancelBetRequest = z.object({
  "betId": z.string().uuid(),
  "reason": z.string().optional()
});

export const BetResponse = z.object({
  "id": z.string().uuid().optional(),
  "userId": z.string().uuid().optional(),
  "eventId": z.string().uuid().optional(),
  "marketId": z.string().optional(),
  "amount": z.number().optional(),
  "odds": z.number().optional(),
  "potentialReturn": z.number().optional(),
  "status": z.enum(["PENDING", "WON", "LOST", "CANCELED"] as const).optional(),
  "type": z.string().optional(),
  "createdAt": z.string().optional(),
  "resolvedAt": z.string().nullable().optional(),
  "cancellationReason": z.string().nullable().optional()
});

export const EventMarket = z.object({
  "id": z.string().optional(),
  "name": z.string().optional(),
  "status": z.enum(["OPEN", "SUSPENDED", "CLOSED"] as const).optional(),
  "result": z.unknown().optional(),
  "odds": z.record(z.number()).optional()
});

export const EventCategoriesResponse = z.object({
  "categories": z.array(z.string()).optional()
});

export const CoinFlipRound = z.object({
  "id": z.string().uuid().optional(),
  "userId": z.string().uuid().optional(),
  "gameType": z.string().optional(),
  "wagerAmount": z.number().optional(),
  "currency": z.string().optional(),
  "playerChoice": z.enum(["HEADS", "TAILS"] as const).optional(),
  "outcome": z.enum(["HEADS", "TAILS"] as const).optional(),
  "result": z.enum(["WIN", "LOSE"] as const).optional(),
  "payoutAmount": z.number().optional(),
  "createdAt": z.string().optional()
});

export const AdminOverviewResponse = z.object({
  "service": z.object({
  "appName": z.string().optional(),
  "serviceName": z.string().optional(),
  "env": z.string().optional()
}).optional(),
  "observability": z.object({
  "usePm2WebUi": z.boolean().optional(),
  "enablePrometheus": z.boolean().optional(),
  "enableEmailAlerts": z.boolean().optional()
}).optional(),
  "risk": z.object({
  "maxExposurePerUser": z.number().optional()
}).optional(),
  "dependencies": z.unknown().optional(),
  "timestamp": z.string().optional()
});

export const AdminRiskResponse = z.object({
  "userId": z.string().optional(),
  "exposure": z.number().optional(),
  "maxExposure": z.number().optional()
});

export const SettleBetRequest = z.object({
  "result": z.enum(["WON", "LOST"] as const),
  "marketResult": z.string()
});

export const UpdateEventStatusRequest = z.object({
  "action": z.enum(["START", "FINISH", "CANCEL"] as const)
});

export const AuthResponse = z.object({
  "success": z.boolean().optional(),
  "data": z.object({
  "accessToken": z.string().optional(),
  "refreshToken": z.string().optional(),
  "user": User.optional()
}).optional(),
  "meta": z.object({
  "timestamp": z.string().optional()
}).optional()
});

export const RegisterResponse = z.object({
  "success": z.boolean().optional(),
  "data": z.object({
  "message": z.string().optional(),
  "registrationRequestId": z.string().uuid().optional(),
  "status": z.enum(["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED"] as const).optional(),
  "isActive": z.boolean().optional(),
  "accessToken": z.unknown().optional(),
  "refreshToken": z.unknown().optional(),
  "sessionId": z.unknown().optional(),
  "user": User.optional(),
  "wallet": z.object({
  "id": z.string().optional(),
  "userId": z.string().optional(),
  "balance": z.number().optional(),
  "lockedBalance": z.number().optional(),
  "currency": z.string().optional()
}).optional()
}).optional(),
  "meta": z.object({
  "timestamp": z.string().optional()
}).optional()
});

export const MeResponse = z.object({
  "success": z.boolean().optional(),
  "data": User.optional(),
  "meta": z.object({
  "timestamp": z.string().optional()
}).optional()
});

export const ErrorResponse = z.object({
  "success": z.boolean().optional(),
  "error": z.object({
  "code": z.string().optional(),
  "message": z.string().optional(),
  "details": z.union([ValidationError, z.record(z.string(), z.unknown())]).optional()
}).optional(),
  "meta": z.object({
  "timestamp": z.string().optional()
}).optional()
});

export const AppError = z.object({
  "code": z.string().optional(),
  "message": z.string().optional(),
  "details": z.union([ValidationError, z.record(z.string(), z.unknown())]).optional()
});

export const TransactionHistory = z.object({
  "transactions": z.array(Transaction).optional(),
  "total": z.number().optional()
});

export const BetListResponse = z.object({
  "bets": z.array(BetResponse).optional()
});

export const Event = z.object({
  "id": z.string().optional(),
  "name": z.string().optional(),
  "category": z.string().optional(),
  "status": z.enum(["SCHEDULED", "LIVE", "FINISHED", "CANCELED"] as const).optional(),
  "startDate": z.string().optional(),
  "participants": z.array(z.string()).optional(),
  "markets": z.record(EventMarket).optional()
});

export const EventMarketsResponse = z.object({
  "eventId": z.string().optional(),
  "markets": z.array(EventMarket).optional()
});

export const EventListResponse = z.object({
  "events": z.array(Event).optional()
});


export const schemas = {
  User,
  Wallet,
  RegisterRequest,
  AuthResponse,
  ErrorResponse,
  RegisterResponse,
  MeResponse,
  LogoutResponse,
  ConflictError,
  ValidationError,
  AppError,
  Transaction,
  TransactionHistory,
  UnauthorizedError,
  ContactRequest,
  ContactResponse,
  UploadDocumentRequest,
  UploadDocumentResponse,
  PlaceBetRequest,
  CancelBetRequest,
  BetResponse,
  BetListResponse,
  EventMarket,
  Event,
  EventListResponse,
  EventMarketsResponse,
  EventCategoriesResponse,
  CoinFlipRound,
  AdminOverviewResponse,
  AdminRiskResponse,
  SettleBetRequest,
  UpdateEventStatusRequest,
} as const;
