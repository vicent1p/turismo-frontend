import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type SocialNetwork =
  | 'whatsapp'
  | 'wa'
  | 'facebook'
  | 'fb'
  | 'instagram'
  | 'ig'
  | 'x'
  | 'twitter'
  | 'tiktok'
  | 'tk'
  | 'web'
  | 'link';

@Component({
  selector: 'app-social-icon',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      [href]="href"
      target="_blank"
      rel="noopener noreferrer"
      class="social-circle-btn"
      [attr.aria-label]="label"
      [title]="title || label"
      (click)="$event.stopPropagation()"
    >
      @switch (normalizedNetwork) {
        @case ('whatsapp') {
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
          </svg>
        }
        @case ('facebook') {
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffffff" aria-hidden="true">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
          </svg>
        }
        @case ('instagram') {
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
          </svg>
        }
        @case ('x') {
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#ffffff" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        }
        @case ('tiktok') {
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#ffffff" aria-hidden="true">
            <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.068-.102a2.895 2.895 0 0 1 3.12-4.387V9.45a6.34 6.34 0 0 0-5.789 2.128 6.343 6.343 0 0 0 .524 8.795 6.341 6.341 0 0 0 9.176-.902 6.29 6.29 0 0 0 1.663-4.326V8.136a8.212 8.212 0 0 0 3.79 1.09V5.77a4.847 4.847 0 0 1-.001-.084z"/>
          </svg>
        }
        @case ('web') {
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        }
      }
      <span class="sr-only">{{ label }}</span>
    </a>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }

      .social-circle-btn {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #cfa035;
        border: 1px solid #c8962e;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        cursor: pointer;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1),
          box-shadow 0.2s ease,
          background-color 0.2s ease;
      }

      .social-circle-btn:hover {
        background: #b88628;
        transform: translateY(-2px) scale(1.08);
        box-shadow: 0 4px 10px rgba(184, 134, 40, 0.38);
      }

      .social-circle-btn:active {
        transform: scale(0.96);
      }

      .social-circle-btn:focus-visible {
        outline: 2px solid #16542d;
        outline-offset: 2px;
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }

      @media (max-width: 640px) {
        .social-circle-btn {
          width: 32px;
          height: 32px;
        }
      }
    `
  ]
})
export class SocialIconComponent {
  @Input({ required: true }) network!: SocialNetwork;
  @Input({ required: true }) href!: string;
  @Input({ required: true }) label!: string;
  @Input() title?: string;

  get normalizedNetwork(): 'whatsapp' | 'facebook' | 'instagram' | 'x' | 'tiktok' | 'web' {
    const net = (this.network || '').toLowerCase().trim();
    if (net === 'wa' || net === 'whatsapp') return 'whatsapp';
    if (net === 'fb' || net === 'facebook') return 'facebook';
    if (net === 'ig' || net === 'instagram') return 'instagram';
    if (net === 'x' || net === 'twitter') return 'x';
    if (net === 'tk' || net === 'tiktok') return 'tiktok';
    return 'web';
  }
}
