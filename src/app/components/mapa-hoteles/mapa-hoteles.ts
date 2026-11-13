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
  SimpleChanges,
  signal,
  computed
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

  // Filtro reactivo dentro del mapa por tipo de servicio turístico
  readonly filtroTipo = signal<string>('todos'); // 'todos' | 'hotel' | 'cabana' | 'restaurante'

  readonly establecimientosFiltrados = computed(() => {
    const list = this.hoteles || [];
    const tipo = this.filtroTipo();
    if (tipo === 'todos') {
      return list;
    }
    return list.filter(h => (!h.tipo && tipo === 'hotel') || h.tipo === tipo);
  });

  setFiltroTipo(tipo: string): void {
    this.filtroTipo.set(tipo);
    this.actualizarMarcadores();
  }

  countTipo(tipo: 'hotel' | 'cabana' | 'restaurante'): number {
    return (this.hoteles || []).filter(h => (!h.tipo && tipo === 'hotel') || h.tipo === tipo).length;
  }

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

    const items = this.establecimientosFiltrados().filter(
      h => typeof h.latitud === 'number' && typeof h.longitud === 'number' && !isNaN(h.latitud) && !isNaN(h.longitud)
    );

    if (items.length === 0) return;

    const latLngs: L.LatLngExpression[] = [];

    items.forEach(hotel => {
      const latLng: [number, number] = [hotel.latitud, hotel.longitud];
      latLngs.push(latLng);

      const marker = L.marker(latLng, {
        icon: this.crearIconoPersonalizado(hotel.disponible, hotel.tipo),
        title: `${hotel.nombre} (${hotel.tipo || 'hotel'})`
      });

      // Crear ventana emergente (Popup)
      const popupHtml = this.generarPopupHtml(hotel);
      marker.bindPopup(popupHtml, {
        maxWidth: 300,
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
   * Genera íconos personalizados en SVG puro con L.divIcon para Hoteles, Cabañas y Restaurantes.
   * Diferencia visualmente cada categoría por color e ícono, y la disponibilidad por un punto verde/rojo.
   */
  private crearIconoPersonalizado(disponible: boolean, tipo?: string): L.DivIcon {
    const tipoNorm = (tipo || 'hotel').toLowerCase();
    let pinColor = '#0284c7'; // Hotel: azul
    let pinBorder = '#0369a1';
    let iconEmoji = '🏨';
    let labelTipo = 'Hotel';

    if (tipoNorm === 'cabana') {
      pinColor = '#d97706'; // Cabaña: ámbar
      pinBorder = '#b45309';
      iconEmoji = '🏡';
      labelTipo = 'Cabaña';
    } else if (tipoNorm === 'restaurante') {
      pinColor = '#ea580c'; // Restaurante: terracota/naranja
      pinBorder = '#c2410c';
      iconEmoji = '🍽️';
      labelTipo = 'Restaurante';
    }

    const dotColor = disponible ? '#10b981' : '#ef4444';
    const statusText = disponible ? 'Disponible' : 'No disponible';

    const svgIcon = `
      <div class="custom-pin-wrap pin-${tipoNorm}" title="${labelTipo}: ${statusText}">
        <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Cuerpo del Pin -->
          <path d="M18 0C8.05888 0 0 8.05888 0 18C0 28.8 15.3 44.5 17.15 45.7C17.65 46.1 18.35 46.1 18.85 45.7C20.7 44.5 36 28.8 36 18C36 8.05888 27.9411 0 18 0Z" fill="${pinColor}" stroke="${pinBorder}" stroke-width="1.5"/>
          <!-- Círculo interior blanco -->
          <circle cx="18" cy="18" r="11" fill="#ffffff"/>
          <!-- Ícono de categoría -->
          <text x="18" y="22" font-size="12" text-anchor="middle">${iconEmoji}</text>
          <!-- Punto de disponibilidad -->
          <circle cx="28" cy="8" r="5" fill="${dotColor}" stroke="#ffffff" stroke-width="1.5"/>
        </svg>
      </div>
    `;

    return L.divIcon({
      html: svgIcon,
      className: `leaflet-hotel-icon is-tipo-${tipoNorm} ${disponible ? 'is-disponible' : 'is-no-disponible'}`,
      iconSize: [36, 46],
      iconAnchor: [18, 46],
      popupAnchor: [0, -44]
    });
  }

  private generarPopupHtml(hotel: MapaHotel): string {
    const starCount = Math.max(1, Math.min(5, Math.round(hotel.estrellas || 1)));
    const estrellasStr = `<span class="star-on">${'★'.repeat(starCount)}</span><span class="star-off">${'★'.repeat(5 - starCount)}</span>`;
    const estadoClass = hotel.disponible ? 'status-green' : 'status-red';
    const estadoLabel = hotel.disponible ? '✓ Disponible' : '✗ No disponible';
    const telDigits = (hotel.whatsapp || '').replace(/\D/g, '');
    const waUrl = telDigits ? `https://wa.me/${telDigits}` : '#';

    const tipoNorm = (hotel.tipo || 'hotel').toLowerCase();
    const tipoLabel = tipoNorm === 'cabana' ? 'Cabaña' : (tipoNorm === 'restaurante' ? 'Restaurante' : 'Hotel');
    const tipoIcon = tipoNorm === 'cabana' ? '🏡' : (tipoNorm === 'restaurante' ? '🍽️' : '🏨');
    const badgeTipoClass = `popup-badge-tipo-${tipoNorm}`;

    return `
      <div class="popup-hotel-card">
        <div class="popup-header">
          <span class="popup-badge ${badgeTipoClass}">${tipoIcon} ${tipoLabel}</span>
          <span class="popup-badge ${estadoClass}">${estadoLabel}</span>
        </div>
        <h4 class="popup-title">${hotel.nombre}</h4>
        <div class="popup-meta-sub">
          <span class="popup-mun">📍 ${hotel.municipio || 'Plato, Magdalena'}</span>
          <div class="popup-stars" title="${hotel.estrellas} estrellas">${estrellasStr} <span class="stars-num">(${hotel.estrellas})</span></div>
        </div>
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
