import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnChanges,
  OnDestroy,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { MapaHotel } from '../../services/dashboard.service';

@Component({
  selector: 'app-mapa-hoteles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mapa-hoteles.html',
  styleUrl: './mapa-hoteles.css'
})
export class MapaHotelesComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() hoteles: MapaHotel[] = [];
  @Output() editar = new EventEmitter<string>();

  @ViewChild('mapContainer') mapContainer?: ElementRef<HTMLDivElement>;

  map: L.Map | null = null;
  private markersGroup: L.LayerGroup | null = null;

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      setTimeout(() => this.inicializarMapa(), 60);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['hoteles'] && !changes['hoteles'].firstChange) {
      if (this.map) {
        this.actualizarMarcadores();
      } else {
        setTimeout(() => this.inicializarMapa(), 60);
      }
    }
  }

  ngOnDestroy(): void {
    this.destruirMapa();
  }

  destruirMapa(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.markersGroup = null;
    }
  }

  private inicializarMapa(): void {
    if (typeof window === 'undefined') return;
    if (!this.mapContainer?.nativeElement) return;
    if (this.map) return;
    if (!this.hoteles || this.hoteles.length === 0) return;

    try {
      // Coordenadas iniciales por defecto: Plato, Magdalena
      this.map = L.map(this.mapContainer.nativeElement, {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView([9.7903, -74.7825], 13);

      // Capa OpenStreetMap estándar gratuita sin API Key
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
        maxZoom: 19
      }).addTo(this.map);

      this.markersGroup = L.layerGroup().addTo(this.map);

      // Cargar marcadores
      this.actualizarMarcadores();

      // Forzar ajuste de tamaño del mapa en contenedores dinámicos
      setTimeout(() => {
        this.map?.invalidateSize();
      }, 150);
    } catch {
      // Manejo seguro en entornos sin soporte WebGL/DOM completo
    }
  }

  private actualizarMarcadores(): void {
    if (!this.map) return;

    if (!this.markersGroup) {
      this.markersGroup = L.layerGroup().addTo(this.map);
    } else {
      this.markersGroup.clearLayers();
    }

    const hotelesValidos = (this.hoteles || []).filter(
      h => typeof h.latitud === 'number' && typeof h.longitud === 'number' && !isNaN(h.latitud) && !isNaN(h.longitud)
    );

    if (hotelesValidos.length === 0) return;

    const latLngs: L.LatLngExpression[] = [];

    hotelesValidos.forEach(hotel => {
      const latLng: [number, number] = [hotel.latitud, hotel.longitud];
      latLngs.push(latLng);

      const marker = L.marker(latLng, {
        icon: this.crearIconoPersonalizado(hotel.disponible),
        title: hotel.nombre
      });

      // Crear ventana emergente (Popup)
      const popupHtml = this.generarPopupHtml(hotel);
      marker.bindPopup(popupHtml, {
        maxWidth: 280,
        className: 'hotel-leaflet-popup'
      });

      marker.on('popupopen', (e) => {
        const popupElement = e.popup.getElement();
        if (popupElement) {
          const btnEditar = popupElement.querySelector<HTMLButtonElement>('.btn-popup-editar');
          if (btnEditar) {
            btnEditar.onclick = (event) => {
              event.preventDefault();
              this.editar.emit(hotel.id);
            };
          }
        }
      });

      this.markersGroup?.addLayer(marker);
    });

    // Encuadre inicial fitBounds de todos los marcadores
    if (latLngs.length === 1) {
      this.map.setView(latLngs[0], 15);
    } else if (latLngs.length > 1) {
      const bounds = L.latLngBounds(latLngs);
      this.map.fitBounds(bounds, {
        padding: [45, 45],
        maxZoom: 16
      });
    }
  }

  /**
   * Genera íconos personalizados en SVG puro con L.divIcon.
   * Resuelve definitivamente el problema conocido de rutas rotas de assets de Leaflet en Angular.
   * Verde = Disponible (#10b981), Rojo = No disponible (#ef4444).
   */
  private crearIconoPersonalizado(disponible: boolean): L.DivIcon {
    const color = disponible ? '#10b981' : '#ef4444';
    const borderColor = disponible ? '#059669' : '#dc2626';
    const statusText = disponible ? 'Disponible' : 'No disponible';

    const svgIcon = `
      <div class="custom-pin-wrap" title="${statusText}">
        <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 0C7.61116 0 0 7.61116 0 17C0 27.2 14.5 42.5 16.2 43.7C16.65 44.1 17.35 44.1 17.8 43.7C19.5 42.5 34 27.2 34 17C34 7.61116 26.3888 0 17 0Z" fill="${color}" stroke="${borderColor}" stroke-width="1.5"/>
          <circle cx="17" cy="17" r="8" fill="#ffffff"/>
          <circle cx="17" cy="17" r="5" fill="${color}"/>
        </svg>
      </div>
    `;

    return L.divIcon({
      html: svgIcon,
      className: `leaflet-hotel-icon ${disponible ? 'is-disponible' : 'is-no-disponible'}`,
      iconSize: [34, 44],
      iconAnchor: [17, 44],
      popupAnchor: [0, -42]
    });
  }

  private generarPopupHtml(hotel: MapaHotel): string {
    const estrellasStr = '★'.repeat(Math.max(1, Math.min(5, Math.round(hotel.estrellas))));
    const estadoClass = hotel.disponible ? 'status-green' : 'status-red';
    const estadoLabel = hotel.disponible ? '✓ Disponible' : '✗ No disponible';
    const telDigits = (hotel.whatsapp || '').replace(/\D/g, '');
    const waUrl = telDigits ? `https://wa.me/${telDigits}` : '#';

    return `
      <div class="popup-hotel-card">
        <div class="popup-header">
          <span class="popup-badge ${estadoClass}">${estadoLabel}</span>
          <span class="popup-mun">📍 ${hotel.municipio || 'Plato'}</span>
        </div>
        <h4 class="popup-title">${hotel.nombre}</h4>
        <div class="popup-stars" title="${hotel.estrellas} estrellas">${estrellasStr} <span class="stars-num">(${hotel.estrellas})</span></div>
        <div class="popup-actions">
          ${telDigits ? `
            <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn-popup-wa">
              <span>💬 WhatsApp</span>
            </a>
          ` : ''}
          <button type="button" class="btn-popup-editar" data-id="${hotel.id}">
            <span>✏️ Editar</span>
          </button>
        </div>
      </div>
    `;
  }
}

