import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ServiceIconType, getServiceIconType } from '../../services/hoteles.service';

@Component({
  selector: 'app-service-icon',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="service-icon-wrap" aria-hidden="true">
      @switch (iconType) {
        @case ('restaurant') {
          <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none" [attr.stroke]="strokeColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/>
            <path d="M15 2v19"/>
            <path d="M6 2v6a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2"/>
            <path d="M8 10v11"/>
          </svg>
        }
        @case ('wifi') {
          <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none" [attr.stroke]="strokeColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
            <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <line x1="12" y1="20" x2="12.01" y2="20"/>
          </svg>
        }
        @case ('parking') {
          <!-- P de Parqueadero SIN círculo: trazo limpio dorado idéntico -->
          <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none" [attr.stroke]="strokeColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M7 4h6a5 5 0 0 1 0 10H7v7"/>
          </svg>
        }
        @case ('pool') {
          <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none" [attr.stroke]="strokeColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 17c2 1 4 1 6 0s4-1 6 0 4 1 6 0"/>
            <path d="M2 13c2 1 4 1 6 0s4-1 6 0 4 1 6 0"/>
          </svg>
        }
        @case ('ac') {
          <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none" [attr.stroke]="strokeColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"/>
          </svg>
        }
        @case ('tv') {
          <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none" [attr.stroke]="strokeColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="13" rx="2"/>
            <polyline points="17 2 12 7 7 2"/>
          </svg>
        }
        @case ('river_view') {
          <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none" [attr.stroke]="strokeColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 17c3-2 6-2 9 0s6 2 9 0"/>
            <path d="M3 21c3-2 6-2 9 0s6 2 9 0"/>
            <path d="M8 13l4-7 4 7"/>
          </svg>
        }
        @case ('countryside') {
          <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none" [attr.stroke]="strokeColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L4 16h5v6h6v-6h5z"/>
          </svg>
        }
        @case ('downtown') {
          <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none" [attr.stroke]="strokeColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16"/>
            <path d="M9 9h1M14 9h1M9 13h1M14 13h1M10 21v-4h4v4"/>
          </svg>
        }
        @default {
          <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none" [attr.stroke]="strokeColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        }
      }
    </span>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        vertical-align: middle;
      }

      .service-icon-wrap {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
      }
    `
  ]
})
export class ServiceIconComponent {
  @Input({ required: true }) service!: string;
  @Input() size: number = 20;
  @Input() strokeColor: string = '#c8962e';

  get iconType(): ServiceIconType {
    return getServiceIconType(this.service);
  }
}
