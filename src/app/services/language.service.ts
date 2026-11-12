import { Injectable, signal } from '@angular/core';

export type AppLang = 'es' | 'en';

const STORAGE_KEY = 'turismo_lang';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  readonly lang = signal<AppLang>(this.detectInitialLang());

  setLang(next: AppLang): void {
    this.lang.set(next);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Ignore storage errors in restricted environments
      }
    }
  }

  private detectInitialLang(): AppLang {
    if (typeof window === 'undefined') {
      return 'es';
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as AppLang | null;
      if (saved === 'es' || saved === 'en') {
        return saved;
      }
    } catch {
      // Ignore storage access errors
    }
    const browserLang = (navigator.language || 'es').slice(0, 2).toLowerCase();
    return browserLang === 'en' ? 'en' : 'es';
  }
}

