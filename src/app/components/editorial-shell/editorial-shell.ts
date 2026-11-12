import { AfterViewInit, Component, OnDestroy, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicNavbarComponent } from '../public-navbar/public-navbar';
import { PublicFooterComponent } from '../public-footer/public-footer';

@Component({
  selector: 'app-editorial-shell',
  standalone: true,
  imports: [RouterLink, PublicNavbarComponent, PublicFooterComponent],
  templateUrl: './editorial-shell.html',
  styleUrl: './editorial-shell.css'
})
export class EditorialShellComponent implements AfterViewInit, OnDestroy {
  readonly activeSection = input<'inicio' | 'historia' | 'cultura' | 'programacion' | 'lugares'>('historia');
  readonly sheetWidth = input<'chronicle' | 'gallery' | 'wide'>('chronicle');
  readonly breadcrumbAria = input<string>('Ruta de navegación');
  readonly breadcrumbHome = input.required<string>();
  readonly breadcrumbCurrent = input.required<string>();
  readonly metaPill = input.required<string>();
  readonly eyebrow = input.required<string>();
  readonly pageTitle = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly closingTag = input.required<string>();
  readonly closingTitle = input.required<string>();
  readonly closingDesc = input.required<string>();
  readonly ctaPrimaryLabel = input.required<string>();
  readonly ctaPrimaryRoute = input<string>('/');
  readonly ctaPrimaryFragment = input<string | undefined>(undefined);
  readonly ctaSecondaryLabel = input.required<string>();
  readonly ctaSecondaryRoute = input<string>('/');
  readonly ctaSecondaryFragment = input<string | undefined>(undefined);
  readonly ctaBackLabel = input.required<string>();

  readonly readProgress = signal<number>(0);

  private readonly onScrollBound = () => this.updateProgress();

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.addEventListener('scroll', this.onScrollBound, { passive: true });
    this.updateProgress();
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.onScrollBound);
    }
  }

  private updateProgress(): void {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const pct = Math.min(100, Math.max(0, Math.round((window.scrollY / maxScroll) * 100)));
    this.readProgress.set(pct);
  }
}

