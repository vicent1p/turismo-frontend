import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AppLang, LanguageService } from '../../services/language.service';

const NAV_COPY = {
  es: {
    navAria: 'Navegación principal',
    navInicio: 'Inicio',
    navHistoria: 'Historia',
    navCultura: 'Cultura',
    navPueblo: 'Nuestro Pueblo',
    btnCelebracion: 'Únete a la celebración',
    adminActivo: 'Admin Activo',
    miEspacio: 'Mi Espacio',
    logoutBtn: 'Cerrar sesión',
    panelTitle: 'Portal de Administración'
  },
  en: {
    navAria: 'Main navigation',
    navInicio: 'Home',
    navHistoria: 'History',
    navCultura: 'Culture',
    navPueblo: 'Our Town',
    btnCelebracion: 'Join the celebration',
    adminActivo: 'Active Admin',
    miEspacio: 'My Space',
    logoutBtn: 'Log Out',
    panelTitle: 'Administration Portal'
  }
} as const;

@Component({
  selector: 'app-public-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './public-navbar.html',
  styleUrl: './public-navbar.css'
})
export class PublicNavbarComponent {
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  readonly languageService = inject(LanguageService);

  readonly activeSection = input<'inicio' | 'historia' | 'cultura' | 'programacion' | 'lugares'>('inicio');

  readonly mobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  readonly lang = this.languageService.lang;
  readonly t = computed(() => NAV_COPY[this.lang()]);
  readonly roleLabel = computed(() => this.authService.roleLabel());

  setLang(next: AppLang): void {
    this.languageService.setLang(next);
  }

  logout(): void {
    this.authService.logout();
  }

  onHomeAnchorClick(event: Event, elementId: string): void {
    const currentPath = this.router.url.split('#')[0].split('?')[0];
    if (currentPath === '/' || currentPath === '') {
      event.preventDefault();
      if (elementId === 'top') {
        if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }
      if (typeof document !== 'undefined') {
        document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }
}
