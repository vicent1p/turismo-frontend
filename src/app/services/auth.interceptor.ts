import { HttpInterceptorFn } from '@angular/common/http';
import { getApiBaseUrl } from './api.config';

const TOKEN_STORAGE_KEY = 'plato400-jwt-token';

/** Attaches the persisted Bearer JWT only on requests targeting our configured backend API. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (typeof window === 'undefined') {
    return next(req);
  }

  const baseUrl = getApiBaseUrl();
  const isApiTarget = req.url.startsWith(baseUrl) || req.url.startsWith('/api') || req.url.startsWith('/dashboard');
  if (!isApiTarget || req.headers.has('Authorization')) {
    return next(req);
  }

  let token: string | null = null;
  try {
    token = localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    token = null;
  }

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
  );
};

