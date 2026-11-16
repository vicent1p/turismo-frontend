import { Component, computed, inject } from '@angular/core';
import { LanguageService } from '../../services/language.service';

const FOOTER_COPY = {
  es: {
    copyText: '© 2026 Gobernación del Magdalena - Desarrollado por Nelson Vicent. Todos los derechos reservados. - OFICINA TIC',
    gobAlt: 'Gobernación del Magdalena',
    alcaldiaAlt: 'Alcaldía de Plato'
  },
  en: {
    copyText: '© 2026 Government of Magdalena - Developed by Nelson Vicent. All rights reserved. - ICT OFFICE',
    gobAlt: 'Government of Magdalena',
    alcaldiaAlt: 'Mayor’s Office of Plato'
  }
} as const;

@Component({
  selector: 'app-public-footer',
  standalone: true,
  imports: [],
  templateUrl: './public-footer.html',
  styleUrl: './public-footer.css'
})
export class PublicFooterComponent {
  readonly languageService = inject(LanguageService);
  readonly lang = this.languageService.lang;
  readonly t = computed(() => FOOTER_COPY[this.lang()]);
}

