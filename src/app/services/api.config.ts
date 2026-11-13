import { HttpErrorResponse } from '@angular/common/http';
import type { CardType, Hotel } from './hoteles.service';

export type ApiRol = 'ADMIN' | 'GESTOR';
export type ApiTipoTarjeta = 'HOTEL' | 'CABANA' | 'RESTAURANTE';

export interface ApiUserDto {
  id: string;
  correo: string;
  nombreCompleto: string;
  rol: ApiRol;
  activo?: boolean;
  creadoEn?: string;
}

export interface ApiLoginResponseDto {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: ApiUserDto;
}

export interface ApiHotelDto {
  id: string;
  tipo: ApiTipoTarjeta;
  nombre: string;
  estrellas: number;
  resena?: string | null;
  resenaEn?: string | null;
  whatsapp?: string | null;
  telefonoContacto?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  xUrl?: string | null;
  tiktokUrl?: string | null;
  paginaWebUrl?: string | null;
  direccion?: string | null;
  ubicacionUrl?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  disponible: boolean;
  municipio?: {
    id: string;
    nombre: string;
    ciudad?: string | null;
    departamento: string;
  } | null;
  servicios?: Array<{
    id: string;
    nombre: string;
    nombreEn?: string | null;
    icono?: string | null;
  }>;
  fotos?: string[];
}

export interface ApiMunicipioDto {
  id: string;
  nombre: string;
  ciudad?: string | null;
  departamento: string;
  totalTarjetas?: number;
}

export interface ApiServicioDto {
  id: string;
  nombre: string;
  nombreEn?: string | null;
  icono?: string | null;
}

/**
 * Resolves the NestJS backend base URL.
 * Supports `window.__PLATO_API_URL__`, `<meta name="plato-api-url">`, same-origin `'/'` (returns `''`),
 * and defaults to `http://localhost:3000` for local development.
 */
export function getApiBaseUrl(): string {
  const custom = (globalThis as { __PLATO_API_URL__?: string }).__PLATO_API_URL__;
  if (typeof custom === 'string' && custom.trim().length > 0) {
    const clean = custom.trim();
    return clean === '/' ? '' : clean.replace(/\/+$/, '');
  }

  if (typeof document !== 'undefined') {
    const meta = document.querySelector('meta[name="plato-api-url"]')?.getAttribute('content');
    if (typeof meta === 'string' && meta.trim().length > 0) {
      const clean = meta.trim();
      return clean === '/' ? '' : clean.replace(/\/+$/, '');
    }
  }

  return 'https://proturismo.magdalena.gov.co';
}

/** Maps backend card type enum (`HOTEL`/`CABANA`/`RESTAURANTE`) to frontend CardType. */
export function mapApiTipoToCardType(tipo?: ApiTipoTarjeta | string | null): CardType {
  switch ((tipo || '').toUpperCase()) {
    case 'CABANA':
      return 'cabana';
    case 'RESTAURANTE':
      return 'restaurante';
    default:
      return 'hotel';
  }
}

/** Maps frontend CardType (`hotel`/`cabana`/`restaurante`) to backend `TipoTarjeta`. */
export function mapCardTypeToApiTipo(tipo?: CardType): ApiTipoTarjeta {
  switch (tipo) {
    case 'cabana':
      return 'CABANA';
    case 'restaurante':
      return 'RESTAURANTE';
    default:
      return 'HOTEL';
  }
}

/** Normalizes relative backend media paths (`/uploads/...`) against `getApiBaseUrl()`. */
export function resolveMediaUrl(url: string): string {
  const clean = url.trim();
  if (clean.startsWith('/uploads/')) {
    return `${getApiBaseUrl()}${clean}`;
  }
  return clean;
}

/** Maps an API hotel record into the frontend `Hotel` model. */
export function mapApiHotelToFrontend(item: ApiHotelDto): Hotel {
  const esServ = (item.servicios ?? []).map(s => s.nombre);
  const enServ = (item.servicios ?? []).map(s => s.nombreEn || s.nombre);
  const resenaEs = item.resena || '';
  const resenaEn = item.resenaEn || resenaEs;

  return {
    id: item.id,
    tipo: mapApiTipoToCardType(item.tipo),
    estrellas: item.estrellas ?? 3,
    nombre: item.nombre,
    municipio: item.municipio?.nombre || 'Plato',
    disponible: item.disponible,
    whatsapp: item.whatsapp || item.telefonoContacto || '',
    facebook: item.facebookUrl || undefined,
    instagram: item.instagramUrl || undefined,
    x: item.xUrl || undefined,
    tiktok: item.tiktokUrl || undefined,
    paginaWeb: item.paginaWebUrl || undefined,
    ubicacion: item.ubicacionUrl || undefined,
    latitud: item.latitud ?? undefined,
    longitud: item.longitud ?? undefined,
    fotos: Array.isArray(item.fotos) ? item.fotos.map(resolveMediaUrl) : [],
    es: {
      desc: resenaEs,
      serv: esServ
    },
    en: {
      desc: resenaEn,
      serv: enServ
    }
  };
}

/** Returns true when an HTTP failure stems from offline/unreachable backend rather than a 4xx/5xx API rejection. */
export function isNetworkUnavailableError(err: unknown): boolean {
  return (err instanceof HttpErrorResponse && err.status === 0) || err instanceof TypeError;
}

/** Extracts a readable error message from NestJS `{ message: string | string[] }` payloads. */
export function extractApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    const rawMsg = (err.error as { message?: string | string[] } | null)?.message;
    if (Array.isArray(rawMsg) && rawMsg.length > 0) {
      return rawMsg.join('. ');
    }
    if (typeof rawMsg === 'string' && rawMsg.trim().length > 0) {
      return rawMsg.trim();
    }
  }
  return fallback;
}

/** Maps a frontend `Hotel` create/update object to the NestJS API payload. */
export function mapFrontendHotelToApiPayload(hotel: Partial<Hotel> & { nombre: string }) {
  return {
    tipo: mapCardTypeToApiTipo(hotel.tipo),
    nombre: hotel.nombre,
    estrellas: hotel.estrellas ?? 3,
    resena: hotel.es?.desc || '',
    resenaEn: hotel.en?.desc || hotel.es?.desc || '',
    whatsapp: hotel.whatsapp || undefined,
    facebookUrl: hotel.facebook || undefined,
    instagramUrl: hotel.instagram || undefined,
    xUrl: hotel.x || undefined,
    tiktokUrl: hotel.tiktok || undefined,
    paginaWebUrl: hotel.paginaWeb || undefined,
    ubicacionUrl: hotel.ubicacion || undefined,
    latitud: hotel.latitud,
    longitud: hotel.longitud,
    disponible: hotel.disponible ?? true,
    municipioNombre: hotel.municipio || 'Plato',
    serviciosNombres: hotel.es?.serv ?? [],
    fotos: hotel.fotos ?? []
  };
}
