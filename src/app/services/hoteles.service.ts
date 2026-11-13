import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, isDevMode, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ApiHotelDto,
  ApiMunicipioDto,
  ApiServicioDto,
  extractApiErrorMessage,
  getApiBaseUrl,
  isNetworkUnavailableError,
  mapApiHotelToFrontend,
  mapFrontendHotelToApiPayload
} from './api.config';
import { AuthService } from './auth.service';

export interface HotelLangData {
  desc: string;
  serv: string[];
}

export type CardType = 'hotel' | 'cabana' | 'restaurante';

export interface Hotel {
  id: string;
  tipo?: CardType;
  estrellas: number;
  nombre: string;
  municipio?: string;
  disponible: boolean;
  whatsapp: string;
  facebook?: string;
  instagram?: string;
  x?: string;
  tiktok?: string;
  paginaWeb?: string;
  ubicacion?: string;
  fotos?: string[];
  latitud?: number;
  longitud?: number;
  es: HotelLangData;
  en: HotelLangData;
  actualizadoEn?: string;
}

export type ServiceIconType =
  | 'restaurant'
  | 'wifi'
  | 'parking'
  | 'river_view'
  | 'ac'
  | 'countryside'
  | 'tv'
  | 'downtown'
  | 'pool'
  | 'other';

const SERVICE_ICON_ASSETS: Partial<Record<ServiceIconType, string>> = {
  restaurant: '/icon-serv-restaurante.png',
  wifi: '/icon-serv-wifi.png',
  parking: '/icon-serv-parqueadero.png',
  river_view: '/icon-serv-vista-rio.png',
  ac: '/icon-serv-aire.png',
  countryside: '/icon-serv-campestre.png',
  tv: '/icon-serv-tv-cable.png',
  downtown: '/icon-serv-centro.png'
};

/** Maps a service label (ES or EN) to its semantic icon category. */
export function getServiceIconType(serv: string): ServiceIconType {
  const s = (serv || '').toLowerCase().trim();
  if (s.includes('vista al r') || s.includes('river view') || ((s.includes('río') || s.includes('rio')) && s.includes('vista'))) return 'river_view';
  if (s.includes('aire') || s === 'a/c' || s.includes('air cond')) return 'ac';
  if (s.includes('campestr') || s.includes('countryside') || s.includes('garden')) return 'countryside';
  if (s.includes('tv') || s.includes('cable') || s.includes('televis')) return 'tv';
  if (s.includes('centro') || s.includes('céntrico') || s.includes('centrico') || s.includes('downtown')) return 'downtown';
  if (s.includes('restauran') || s.includes('comida') || s.includes('desayuno') || s.includes('bar') || s.includes('signature')) return 'restaurant';
  if (s.includes('wifi') || s.includes('wi-fi') || s.includes('internet')) return 'wifi';
  if (s.includes('parque') || s.includes('estacion') || s.includes('park')) return 'parking';
  if (s.includes('piscina') || s.includes('pool')) return 'pool';
  return 'other';
}

/** Returns the public custom PNG path for mapped hotel service icons. */
export function getServiceIconAsset(serv: string): string | null {
  return SERVICE_ICON_ASSETS[getServiceIconType(serv)] ?? null;
}

/** Normalizes an X/Twitter handle or URL into an external profile link. */
export function buildXLink(raw?: string): string {
  const val = (raw || '').trim();
  if (!val) return 'https://x.com/';
  if (val.startsWith('http://') || val.startsWith('https://')) return val;
  return `https://x.com/${val.replace(/^@/, '')}`;
}

export type PlaceCategoryTab = 'hoteles' | 'restaurantes' | 'cabanas';

const TAB_TO_CARD_TYPE: Record<PlaceCategoryTab, CardType> = {
  hoteles: 'hotel',
  restaurantes: 'restaurante',
  cabanas: 'cabana'
};

/** Maps a UI category pill to its underlying card type. */
export function mapCategoryTabToCardType(tab: PlaceCategoryTab): CardType {
  return TAB_TO_CARD_TYPE[tab];
}

/** Normalizes legacy records without `tipo` to `'hotel'`. */
export function normalizeCardType(tipo?: CardType): CardType {
  return tipo ?? 'hotel';
}

/** Filters catalog cards matching the selected UI category tab. */
export function filterHotelsByCategory(hoteles: readonly Hotel[], tab: PlaceCategoryTab): Hotel[] {
  const target = mapCategoryTabToCardType(tab);
  return hoteles.filter(item => normalizeCardType(item.tipo) === target);
}

const SERVICE_EN_MAP: Record<string, string> = {
  'piscina': 'Pool',
  'aire acondicionado': 'Air Conditioning',
  'a/c': 'A/C',
  'parqueadero': 'Parking',
  'parqueadero privado': 'Private Parking',
  'wifi': 'Wi-Fi',
  'wifi de alta velocidad': 'High-Speed Wi-Fi',
  'restaurante': 'Restaurant',
  'restaurante de autor': 'Signature Restaurant',
  'vista al río': 'River View',
  'desayuno incluido': 'Breakfast Included',
  'desayuno típico': 'Traditional Breakfast',
  'recepción 24h': '24/7 Front Desk',
  'suites ejecutivas': 'Executive Suites',
  'bar y terraza': 'Bar & Terrace',
  'pet friendly': 'Pet Friendly',
  'centro': 'Downtown',
  'tv cable': 'Cable TV',
  'zona campestre': 'Countryside Area',
  'suites': 'Suites'
};

/** Translates a Spanish amenity chip label into English when available. */
export function translateServiceLabel(serv: string): string {
  const key = (serv || '').toLowerCase().trim();
  return SERVICE_EN_MAP[key] || serv;
}

/** Resolves localized description for a hotel, restaurant, or cabin card. */
export function resolveHotelDescription(hotel: Hotel, lang: 'es' | 'en'): string {
  if (lang !== 'en') {
    return hotel.es?.desc || '';
  }
  if (hotel.en?.desc && hotel.en.desc.trim() !== '' && hotel.en.desc !== hotel.es?.desc) {
    return hotel.en.desc;
  }
  const text = hotel.es?.desc || '';
  if (text.includes('Tradición y confort en el corazón de Plato')) {
    return 'Tradition and comfort in the heart of Plato. Spacious air-conditioned rooms, a refreshing outdoor pool, typical regional restaurant, and secure parking.';
  }
  if (text.includes('Hospedaje céntrico y acogedor')) {
    return 'Central and welcoming stay, just steps from the main square and downtown commerce. Ideal for business or leisure travelers visiting Plato.';
  }
  if (text.includes('Tranquilidad frente al majestuoso río Magdalena')) {
    return 'Tranquility facing the majestic Magdalena River. Beautiful river sunset views, countryside relaxation areas, and the warmest local hospitality.';
  }
  if (text.includes('Exclusivo hospedaje ecoturístico')) {
    return 'Exclusive ecotourism stay with panoramic river views, comfortable suites, restaurant and garden areas.';
  }
  if (text.includes('Hotel boutique temático')) {
    return 'Themed boutique hotel with native wood finishes, infinity pool, and signature restaurant.';
  }
  return text;
}

/** Resolves localized amenities list for a card. */
export function resolveHotelServices(hotel: Hotel, lang: 'es' | 'en'): string[] {
  const list =
    lang === 'en' && hotel.en?.serv && hotel.en.serv.length > 0 && hotel.en.serv !== hotel.es?.serv
      ? hotel.en.serv
      : (hotel.es?.serv || []);
  return lang === 'en' ? list.map(s => translateServiceLabel(s)) : list;
}

/** Builds a clean WhatsApp chat URL for a card. */
export function buildWhatsAppUrl(hotel: Hotel, message: string): string {
  const cleanPhone = (hotel.whatsapp || '').replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/** Builds a Google Maps fallback URL when explicit `ubicacion` is absent. */
export function buildUbicacionUrl(hotel: Hotel): string {
  if (hotel.ubicacion) return hotel.ubicacion;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.nombre + ' Plato Magdalena')}`;
}

export interface HotelDataset {
  actualizado: string;
  hoteles: Hotel[];
}

export const INITIAL_HOTELES: Hotel[] = [
  {
    id: 'h1',
    estrellas: 4,
    nombre: 'Hotel Los Recuerdos',
    municipio: 'Plato',
    disponible: true,
    whatsapp: '573000000001',
    facebook: 'https://www.facebook.com/hotellosrecuerdosplato',
    instagram: 'https://www.instagram.com/hotellosrecuerdos',
    ubicacion: 'https://www.google.com/maps/search/?api=1&query=Hotel+Los+Recuerdos+Plato+Magdalena',
    latitud: 9.7925,
    longitud: -74.7812,
    fotos: ['cultura-plato.jpg', 'iglesia-plato.jpg', 'hombre-caiman.jpg'],
    es: {
      desc: 'Tradición y confort en el corazón de Plato. Habitaciones amplias con aire acondicionado, piscina para refrescarse del clima cálido, restaurante de comida típica y parqueadero seguro.',
      serv: ['Piscina', 'Aire acondicionado', 'Restaurante', 'Parqueadero', 'Wifi']
    },
    en: {
      desc: 'Tradition and comfort in the heart of Plato. Spacious air-conditioned rooms, a refreshing outdoor pool, typical regional restaurant, and secure parking.',
      serv: ['Pool', 'A/C', 'Restaurant', 'Parking', 'Wi-Fi']
    }
  },
  {
    id: 'h2',
    estrellas: 3,
    nombre: 'Hotel San Martín',
    municipio: 'Plato',
    disponible: true,
    whatsapp: '573000000002',
    facebook: 'https://www.facebook.com/hotelsanmartinplato',
    instagram: 'https://www.instagram.com/hotelsanmartinplato',
    ubicacion: 'https://www.google.com/maps/search/?api=1&query=Hotel+San+Martin+Plato+Magdalena',
    latitud: 9.7891,
    longitud: -74.784,
    fotos: ['iglesia-fachada.jpg', 'collage-plato.jpg'],
    es: {
      desc: 'Hospedaje céntrico y acogedor, a solo pasos de la plaza principal y del comercio. Ideal para estancias de negocios o turismo durante las fiestas de los 400 años.',
      serv: ['Centro', 'Wifi de alta velocidad', 'Aire acondicionado', 'TV Cable']
    },
    en: {
      desc: 'Central and welcoming stay, just steps from the main square and downtown commerce. Ideal for business or leisure travelers visiting Plato.',
      serv: ['Downtown', 'High-speed Wi-Fi', 'A/C', 'Cable TV']
    }
  },
  {
    id: 'h3',
    tipo: 'hotel',
    estrellas: 3,
    nombre: 'Hotel Posada del Río',
    municipio: 'Plato',
    disponible: false,
    whatsapp: '573000000003',
    facebook: 'https://www.facebook.com/posadadelrioplato',
    instagram: 'https://www.instagram.com/posadadelrioplato',
    ubicacion: 'https://www.google.com/maps/search/?api=1&query=Posada+del+Rio+Plato+Magdalena',
    latitud: 9.794,
    longitud: -74.7865,
    fotos: ['iglesia-plato.jpg', 'cultura-plato.jpg'],
    es: {
      desc: 'Tranquilidad frente al majestuoso río Magdalena. Hermosas vistas del atardecer ribereño, zonas de descanso campestres y la mejor atención de la región.',
      serv: ['Vista al río', 'Desayuno típico', 'Zona campestre', 'Wifi']
    },
    en: {
      desc: 'Tranquility facing the majestic Magdalena River. Beautiful river sunset views, countryside relaxation areas, and the warmest local hospitality.',
      serv: ['River view', 'Traditional breakfast', 'Garden area', 'Wi-Fi']
    }
  },
  {
    id: 'r1',
    tipo: 'restaurante',
    estrellas: 5,
    nombre: 'Restaurante Fogón del Magdalena',
    municipio: 'Plato',
    disponible: true,
    whatsapp: '573000000004',
    instagram: 'https://www.instagram.com/fogondelmagdalena',
    ubicacion: 'https://www.google.com/maps/search/?api=1&query=Plato+Magdalena+Restaurante+Fogon',
    latitud: 9.7918,
    longitud: -74.7848,
    fotos: ['cultura/cultura-rio-atardecer.jpg', 'cultura-plato.jpg'],
    es: {
      desc: 'Cocina tradicional ribereña frente al río Grande: bocachico en cabrito, viuda de pescado, cayeye con queso costeño y jugos de corozo fresco.',
      serv: ['Vista al río', 'Desayuno típico', 'Terraza', 'Aire', 'Wifi']
    },
    en: {
      desc: 'Traditional riverside cuisine along the Magdalena: roasted bocachico fish, local viuda stew, plantain cayeye with coastal cheese, and fresh corozo juice.',
      serv: ['River view', 'Traditional breakfast', 'Terrace', 'AC', 'Wi-Fi']
    }
  },
  {
    id: 'r2',
    tipo: 'restaurante',
    estrellas: 4,
    nombre: 'Asados & Sabores El Caimán',
    municipio: 'Plato',
    disponible: true,
    whatsapp: '573000000005',
    facebook: 'https://www.facebook.com/asadoselcaimanplato',
    instagram: 'https://www.instagram.com/asadoselcaimanplato',
    ubicacion: 'https://www.google.com/maps/search/?api=1&query=Parque+Hombre+Caiman+Plato+Magdalena',
    latitud: 9.7909,
    longitud: -74.7853,
    fotos: ['hombre-caiman.jpg', 'collage-plato.jpg'],
    es: {
      desc: 'Cortes al carbón, sancocho de gallina criolla y arepas de huevo artesanales a pocos pasos del Parque del Hombre Caimán en ambiente familiar.',
      serv: ['Restaurante', 'Parqueadero', 'Aire', 'Wifi']
    },
    en: {
      desc: 'Charcoal-grilled cuts, traditional creole hen stew, and handmade arepas de huevo steps from Hombre Caimán Park in a warm family atmosphere.',
      serv: ['Restaurant', 'Parking', 'AC', 'Wi-Fi']
    }
  },
  {
    id: 'r3',
    tipo: 'restaurante',
    estrellas: 4,
    nombre: 'Café & Dulcería La Inmaculada',
    municipio: 'Plato',
    disponible: true,
    whatsapp: '573000000006',
    instagram: 'https://www.instagram.com/cafelainmaculadaplato',
    ubicacion: 'https://www.google.com/maps/search/?api=1&query=Iglesia+Inmaculada+Concepcion+Plato+Magdalena',
    latitud: 9.7905,
    longitud: -74.7851,
    fotos: ['iglesia-fachada.jpg', 'cultura/cultura-plaza-aerea.jpg'],
    es: {
      desc: 'Dulcería típica plateña, enyucado horneado, cocadas, café de la sierra y desayunos tradicionales con vista a la plaza central.',
      serv: ['Desayuno típico', 'Terraza', 'Wifi', 'Aire']
    },
    en: {
      desc: 'Authentic Plato sweets, baked enyucado, coconut candies, Sierra coffee, and hearty traditional breakfasts overlooking the main plaza.',
      serv: ['Traditional breakfast', 'Terrace', 'Wi-Fi', 'AC']
    }
  },
  {
    id: 'c1',
    tipo: 'cabana',
    estrellas: 5,
    nombre: 'Cabañas Brisas de la Ciénaga',
    municipio: 'Plato',
    disponible: true,
    whatsapp: '573000000007',
    instagram: 'https://www.instagram.com/brisasdelacienagaplato',
    ubicacion: 'https://www.google.com/maps/search/?api=1&query=Cienaga+Plato+Magdalena',
    latitud: 9.7962,
    longitud: -74.7891,
    fotos: ['cultura/cultura-pueblo-cienaga.jpg', 'cultura/cultura-canoas-rio.jpg'],
    es: {
      desc: 'Cabañas ecológicas de madera y palma rodeadas de espejos de agua, amaneceres tranquilos, hamacas privadas y recorridos guiados en canoa.',
      serv: ['Vista al río', 'Zona campestre', 'Piscina', 'Aire', 'Parqueadero']
    },
    en: {
      desc: 'Eco-friendly wood and palm cabins surrounded by tranquil wetlands, peaceful sunrises, private hammocks, and guided canoe tours.',
      serv: ['River view', 'Garden area', 'Pool', 'AC', 'Parking']
    }
  },
  {
    id: 'c2',
    tipo: 'cabana',
    estrellas: 4,
    nombre: 'Finca Eco-Cabañas El Manglar',
    municipio: 'Plato',
    disponible: true,
    whatsapp: '573000000008',
    facebook: 'https://www.facebook.com/fincaelmanglarplato',
    ubicacion: 'https://www.google.com/maps/search/?api=1&query=Finca+Plato+Magdalena',
    latitud: 9.7875,
    longitud: -74.7808,
    fotos: ['cultura/cultura-ocaso-iglesia-rio.jpg', 'cultura/cultura-puente-magdalena.jpg'],
    es: {
      desc: 'Refugio campestre ideal para familias y grupos en la tierra del Caimán: amplios jardines, piscina al aire libre, cocina equipada y fogata nocturna.',
      serv: ['Piscina', 'Zona campestre', 'Parqueadero', 'Wifi', 'Aire']
    },
    en: {
      desc: 'Countryside retreat ideal for families and groups in the land of the Caimán: spacious gardens, outdoor pool, full kitchen, and evening firepit.',
      serv: ['Pool', 'Garden area', 'Parking', 'Wi-Fi', 'AC']
    }
  },
  {
    id: 'c3',
    tipo: 'cabana',
    estrellas: 4,
    nombre: 'Cabañas Mirador del Puente',
    municipio: 'Plato',
    disponible: false,
    whatsapp: '573000000009',
    instagram: 'https://www.instagram.com/miradordelpuenteplato',
    ubicacion: 'https://www.google.com/maps/search/?api=1&query=Puente+Plato+Magdalena',
    latitud: 9.7931,
    longitud: -74.7924,
    fotos: ['cultura/cultura-puente-magdalena.jpg', 'cultura/cultura-rio-atardecer.jpg'],
    es: {
      desc: 'Cabañas elevadas con terraza privada hacia el Puente Antonio Escobar Camargo, diseñadas para descansar escuchando la brisa del Magdalena.',
      serv: ['Terraza', 'Vista al río', 'Desayuno típico', 'Aire', 'Wifi']
    },
    en: {
      desc: 'Elevated cabins with private terraces facing the Antonio Escobar Camargo Bridge, designed for peaceful stays in the Magdalena River breeze.',
      serv: ['Terrace', 'River view', 'Traditional breakfast', 'AC', 'Wi-Fi']
    }
  }
];

const STORAGE_KEY = 'plato400-hotels-data';

@Injectable({
  providedIn: 'root'
})
export class HotelesService {
  private readonly http = inject(HttpClient, { optional: true });
  private readonly authService = inject(AuthService);

  readonly dataset = signal<HotelDataset>({
    actualizado: new Date().toISOString().slice(0, 10),
    hoteles: [...INITIAL_HOTELES]
  });
  readonly municipiosCatalogo = signal<ApiMunicipioDto[]>([]);
  readonly serviciosCatalogo = signal<ApiServicioDto[]>([]);
  readonly syncLoading = signal<boolean>(false);
  readonly syncError = signal<string | null>(null);

  private broadcastChannel?: BroadcastChannel;

  constructor() {
    this.cargarDesdeStorage();
    this.configurarSincronizacionEnVivo();
  }

  private configurarSincronizacionEnVivo(): void {
    if (typeof window === 'undefined') return;

    // Canal de difusión para sincronización instantánea multiventana/pestaña
    if ('BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('plato400_sync_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data === 'sync_hoteles') {
            void this.sincronizarDesdeApi();
          }
        };
      } catch {}
    }

    // Escuchar cambios de localStorage emitidos desde otras pestañas
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed: HotelDataset = JSON.parse(e.newValue);
          if (parsed && Array.isArray(parsed.hoteles)) {
            this.dataset.set(parsed);
          }
        } catch {}
      }
    });

    // Auto-refrescar cuando el usuario vuelve a la pestaña (Landing page, Lugares o Panel)
    window.addEventListener('focus', () => {
      void this.sincronizarDesdeApi();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        void this.sincronizarDesdeApi();
      }
    });

    // Polling periódico cada 10s para mantener actualizados administradores, gestores y landing page en tiempo real
    setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void this.sincronizarDesdeApi();
      }
    }, 10000);
  }

  public notificarCambioGlobal(): void {
    try {
      this.broadcastChannel?.postMessage('sync_hoteles');
    } catch {}
  }

  private cargarDesdeStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: HotelDataset = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.hoteles)) {
          const hasRestaurante = parsed.hoteles.some(h => h.tipo === 'restaurante');
          const hasCabana = parsed.hoteles.some(h => h.tipo === 'cabana');
          let merged = [...parsed.hoteles];
          if (!hasRestaurante) {
            const seedRestaurantes = INITIAL_HOTELES.filter(s => s.tipo === 'restaurante');
            merged = [...merged, ...seedRestaurantes];
          }
          if (!hasCabana) {
            const seedCabanas = INITIAL_HOTELES.filter(s => s.tipo === 'cabana');
            merged = [...merged, ...seedCabanas];
          }
          this.dataset.set({
            ...parsed,
            hoteles: merged
          });
        }
      }
    } catch {}
  }

  private guardar(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.dataset()));
    } catch {}
  }

  get hoteles(): Hotel[] {
    return this.dataset().hoteles;
  }

  agregarHotel(hotelData: Omit<Hotel, 'id'>): Hotel {
    const newId = 'h_' + Date.now();
    const nuevoHotel: Hotel = {
      ...hotelData,
      id: newId
    };

    const actual = this.dataset();
    this.dataset.set({
      actualizado: new Date().toISOString().slice(0, 10),
      hoteles: [nuevoHotel, ...actual.hoteles]
    });
    this.guardar();
    this.notificarCambioGlobal();
    return nuevoHotel;
  }

  actualizarHotel(hotelActualizado: Hotel): void {
    const actual = this.dataset();
    const index = actual.hoteles.findIndex(h => h.id === hotelActualizado.id);
    const ahoraIso = new Date().toISOString();
    const itemActualizado: Hotel = {
      ...hotelActualizado,
      actualizadoEn: ahoraIso
    };
    if (index !== -1) {
      // Mover el establecimiento modificado al inicio para que se refleje de inmediato
      const otros = actual.hoteles.filter(h => h.id !== hotelActualizado.id);
      this.dataset.set({
        ...actual,
        actualizado: ahoraIso.slice(0, 10),
        hoteles: [itemActualizado, ...otros]
      });
      this.guardar();
      this.notificarCambioGlobal();
    }
  }

  eliminarHotel(id: string): void {
    const actual = this.dataset();
    this.dataset.set({
      ...actual,
      hoteles: actual.hoteles.filter(h => h.id !== id)
    });
    this.guardar();
    this.notificarCambioGlobal();
  }

  agregarFoto(hotelId: string, fotoUrl: string): void {
    const actual = this.dataset();
    const index = actual.hoteles.findIndex(h => h.id === hotelId);
    if (index !== -1) {
      const hotel = actual.hoteles[index];
      const fotos = hotel.fotos ? [...hotel.fotos, fotoUrl] : [fotoUrl];
      const nuevos = [...actual.hoteles];
      nuevos[index] = { ...hotel, fotos };
      this.dataset.set({ ...actual, hoteles: nuevos });
      this.guardar();
    }
  }

  eliminarFoto(hotelId: string, fotoIndex: number): void {
    const actual = this.dataset();
    const index = actual.hoteles.findIndex(h => h.id === hotelId);
    if (index !== -1) {
      const hotel = actual.hoteles[index];
      if (hotel.fotos && hotel.fotos.length > 0) {
        const fotos = hotel.fotos.filter((_, i) => i !== fotoIndex);
        const nuevos = [...actual.hoteles];
        nuevos[index] = { ...hotel, fotos };
        this.dataset.set({ ...actual, hoteles: nuevos });
        this.guardar();
      }
    }
  }

  setStars(hotelId: string, estrellas: number): void {
    const actual = this.dataset();
    const index = actual.hoteles.findIndex(h => h.id === hotelId);
    if (index !== -1) {
      const hotel = actual.hoteles[index];
      const nuevos = [...actual.hoteles];
      nuevos[index] = { ...hotel, estrellas };
      this.dataset.set({ ...actual, hoteles: nuevos });
      this.guardar();
    }
  }

  toggleDisponible(hotelId: string): void {
    const actual = this.dataset();
    const index = actual.hoteles.findIndex(h => h.id === hotelId);
    if (index !== -1) {
      const hotel = actual.hoteles[index];
      const ahoraIso = new Date().toISOString();
      const itemActualizado: Hotel = {
        ...hotel,
        disponible: !hotel.disponible,
        actualizadoEn: ahoraIso
      };
      const otros = actual.hoteles.filter(h => h.id !== hotelId);
      this.dataset.set({
        ...actual,
        actualizado: ahoraIso.slice(0, 10),
        hoteles: [itemActualizado, ...otros]
      });
      this.guardar();
    }
  }

  restaurarDatos(): void {
    this.dataset.set({
      actualizado: new Date().toISOString().slice(0, 10),
      hoteles: [...INITIAL_HOTELES]
    });
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }

  /** Pulls the public catalog (`GET /api/hoteles`) from PostgreSQL and keeps local state cached. */
  async sincronizarDesdeApi(): Promise<boolean> {
    if (!this.http) {
      return false;
    }

    this.syncLoading.set(true);
    this.syncError.set(null);

    try {
      const remote = await firstValueFrom(
        this.http.get<ApiHotelDto[]>(`${getApiBaseUrl()}/api/hoteles`)
      );
      if (Array.isArray(remote)) {
        const mapped = remote.map(item => mapApiHotelToFrontend(item));
        const remoteIds = new Set(mapped.map(m => m.id));

        // Preservar y subir tarjetas locales no sincronizadas todavía
        const localPending = this.dataset().hoteles.filter(h => h.id.startsWith('h_') && !remoteIds.has(h.id));
        if (localPending.length > 0 && this.authService.accessToken()) {
          for (const pending of localPending) {
            void this.crearTarjetaRemota(pending);
          }
        }

        const combined = [...localPending, ...mapped];
        this.dataset.set({
          actualizado: new Date().toISOString().slice(0, 10),
          hoteles: combined
        });
        this.guardar();
      }
      return true;
    } catch (err) {
      this.syncError.set(extractApiErrorMessage(err, 'Usando catálogo local sin conexión al servidor.'));
      return false;
    } finally {
      this.syncLoading.set(false);
    }
  }

  private allowOfflineFallback(err?: unknown): boolean {
    return isDevMode() && (err === undefined || isNetworkUnavailableError(err));
  }

  /** Creates a hotel, cabin, or restaurant card in PostgreSQL (`POST /api/hoteles`) with dev-only offline fallback. */
  async crearTarjetaRemota(
    hotelData: Omit<Hotel, 'id'>
  ): Promise<{ exito: boolean; hotel?: Hotel; error?: string }> {
    const token = await this.authService.getOrRefreshToken();
    if (!this.http || !token) {
      if (this.allowOfflineFallback()) {
        const hotel = this.agregarHotel(hotelData);
        this.notificarCambioGlobal();
        return { exito: true, hotel };
      }
      return { exito: false, error: 'Sesión no válida o sin conexión con el servidor.' };
    }

    try {
      const created = await firstValueFrom(
        this.http.post<ApiHotelDto>(
          `${getApiBaseUrl()}/api/hoteles`,
          mapFrontendHotelToApiPayload(hotelData)
        )
      );
      const mapped = mapApiHotelToFrontend(created);
      const actual = this.dataset();
      this.dataset.set({
        actualizado: new Date().toISOString().slice(0, 10),
        hoteles: [mapped, ...actual.hoteles.filter(h => h.id !== mapped.id)]
      });
      this.guardar();
      this.notificarCambioGlobal();
      return { exito: true, hotel: mapped };
    } catch (err) {
      if (this.allowOfflineFallback(err)) {
        const hotel = this.agregarHotel(hotelData);
        this.notificarCambioGlobal();
        return { exito: true, hotel };
      }
      return {
        exito: false,
        error: extractApiErrorMessage(err, 'No se pudo guardar el establecimiento en el servidor.')
      };
    }
  }

  /** Updates a hotel, cabin, or restaurant card in PostgreSQL (`PATCH /api/hoteles/:id`). */
  async actualizarTarjetaRemota(
    hotelActualizado: Hotel
  ): Promise<{ exito: boolean; hotel?: Hotel; error?: string }> {
    const token = await this.authService.getOrRefreshToken();
    if (!this.http || !token) {
      if (this.allowOfflineFallback()) {
        this.actualizarHotel(hotelActualizado);
        this.notificarCambioGlobal();
        return { exito: true, hotel: hotelActualizado };
      }
      return { exito: false, error: 'Sesión no válida o sin conexión con el servidor.' };
    }

    try {
      const updated = await firstValueFrom(
        this.http.patch<ApiHotelDto>(
          `${getApiBaseUrl()}/api/hoteles/${encodeURIComponent(hotelActualizado.id)}`,
          mapFrontendHotelToApiPayload(hotelActualizado)
        )
      );
      const mapped = mapApiHotelToFrontend(updated);
      this.actualizarHotel(mapped);
      this.notificarCambioGlobal();
      return { exito: true, hotel: mapped };
    } catch (err) {
      if (this.allowOfflineFallback(err)) {
        this.actualizarHotel(hotelActualizado);
        this.notificarCambioGlobal();
        return { exito: true, hotel: hotelActualizado };
      }
      return {
        exito: false,
        error: extractApiErrorMessage(err, 'No se pudo actualizar el establecimiento en el servidor.')
      };
    }
  }

  /** Toggles card availability in PostgreSQL (`PATCH /api/hoteles/:id/disponibilidad`). */
  async toggleDisponibleRemoto(hotelId: string): Promise<{ exito: boolean; error?: string }> {
    const actual = this.dataset().hoteles.find(h => h.id === hotelId);
    if (!actual) {
      return { exito: false, error: 'Establecimiento no encontrado.' };
    }

    const token = await this.authService.getOrRefreshToken();
    if (!this.http || !token) {
      if (this.allowOfflineFallback()) {
        this.toggleDisponible(hotelId);
        this.notificarCambioGlobal();
        return { exito: true };
      }
      return { exito: false, error: 'Sesión no válida o sin conexión con el servidor.' };
    }

    try {
      const updated = await firstValueFrom(
        this.http.patch<ApiHotelDto>(
          `${getApiBaseUrl()}/api/hoteles/${encodeURIComponent(hotelId)}/disponibilidad`,
          { disponible: !actual.disponible }
        )
      );
      this.actualizarHotel(mapApiHotelToFrontend(updated));
      this.notificarCambioGlobal();
      return { exito: true };
    } catch (err) {
      if (this.allowOfflineFallback(err)) {
        this.toggleDisponible(hotelId);
        this.notificarCambioGlobal();
        return { exito: true };
      }
      return {
        exito: false,
        error: extractApiErrorMessage(err, 'No se pudo actualizar la disponibilidad.')
      };
    }
  }

  /** Soft-deletes a card in PostgreSQL (`DELETE /api/hoteles/:id`). */
  async eliminarTarjetaRemota(id: string): Promise<{ exito: boolean; error?: string }> {
    const token = await this.authService.getOrRefreshToken();
    if (!this.http || !token) {
      if (this.allowOfflineFallback()) {
        this.eliminarHotel(id);
        this.notificarCambioGlobal();
        return { exito: true };
      }
      return { exito: false, error: 'Sesión no válida o sin conexión con el servidor.' };
    }

    try {
      await firstValueFrom(
        this.http.delete(`${getApiBaseUrl()}/api/hoteles/${encodeURIComponent(id)}`)
      );
      this.eliminarHotel(id);
      this.notificarCambioGlobal();
      return { exito: true };
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 404) {
        this.eliminarHotel(id);
        this.notificarCambioGlobal();
        return { exito: true };
      }
      if (this.allowOfflineFallback(err)) {
        this.eliminarHotel(id);
        this.notificarCambioGlobal();
        return { exito: true };
      }
      return {
        exito: false,
        error: extractApiErrorMessage(err, 'No se pudo eliminar el establecimiento en el servidor.')
      };
    }
  }

  private async actualizarParcialRemoto(
    hotelId: string,
    updater: (current: Hotel) => Hotel
  ): Promise<{ exito: boolean; error?: string }> {
    const current = this.dataset().hoteles.find(h => h.id === hotelId);
    if (!current) {
      return { exito: false, error: 'Establecimiento no encontrado.' };
    }
    const nextHotel = updater(current);
    const res = await this.actualizarTarjetaRemota(nextHotel);
    return { exito: res.exito, error: res.error };
  }

  /** Updates star rating from Portada and persists to PostgreSQL (`PATCH /api/hoteles/:id`). */
  async setStarsRemoto(hotelId: string, estrellas: number): Promise<{ exito: boolean; error?: string }> {
    return this.actualizarParcialRemoto(hotelId, current => ({ ...current, estrellas }));
  }

  /** Appends uploaded photos from Portada and persists to PostgreSQL (`PATCH /api/hoteles/:id`). */
  async agregarFotosRemotas(hotelId: string, nuevasFotos: string[]): Promise<{ exito: boolean; error?: string }> {
    if (nuevasFotos.length === 0) {
      return { exito: true };
    }
    return this.actualizarParcialRemoto(hotelId, current => ({
      ...current,
      fotos: [...(current.fotos ?? []), ...nuevasFotos]
    }));
  }

  /** Uploads binary image files via `POST /api/uploads/imagenes`, falling back offline when unreachable. */
  async subirImagenesRemotas(
    files: File[],
    offlineFallback?: () => Promise<string[]>
  ): Promise<{ exito: boolean; urls: string[]; error?: string }> {
    if (files.length === 0) {
      return { exito: true, urls: [] };
    }

    if (!this.http || !this.authService.accessToken()) {
      if (this.allowOfflineFallback() && offlineFallback) {
        return { exito: true, urls: await offlineFallback() };
      }
      return { exito: false, urls: [], error: 'Sesión no válida o sin conexión con el servidor.' };
    }

    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file, file.name);
    }

    try {
      const res = await firstValueFrom(
        this.http.post<{ urls: string[] }>(`${getApiBaseUrl()}/api/uploads/imagenes`, formData)
      );
      return { exito: true, urls: Array.isArray(res?.urls) ? res.urls : [] };
    } catch (err) {
      if (this.allowOfflineFallback(err) && offlineFallback) {
        const urls = await offlineFallback();
        return { exito: true, urls };
      }
      return {
        exito: false,
        urls: [],
        error: extractApiErrorMessage(err, 'No se pudieron subir las imágenes al servidor.')
      };
    }
  }

  /** Removes a photo by index from Portada and persists to PostgreSQL (`PATCH /api/hoteles/:id`). */
  async eliminarFotoRemota(hotelId: string, fotoIndex: number): Promise<{ exito: boolean; error?: string }> {
    return this.actualizarParcialRemoto(hotelId, current => ({
      ...current,
      fotos: (current.fotos ?? []).filter((_, idx) => idx !== fotoIndex)
    }));
  }

  /** Loads registered municipalities from `GET /api/municipios`, returning `null` when unavailable. */
  async cargarMunicipiosRemotos(): Promise<string[] | null> {
    if (!this.http) return null;
    try {
      const list = await firstValueFrom(
        this.http.get<ApiMunicipioDto[]>(`${getApiBaseUrl()}/api/municipios`)
      );
      if (!Array.isArray(list)) return null;
      this.municipiosCatalogo.set(list);
      return list.map(m => m.nombre.trim()).filter(Boolean);
    } catch {
      return null;
    }
  }

  /** Creates a municipality in PostgreSQL (`POST /api/municipios`). */
  async crearMunicipioRemoto(payload: {
    nombre: string;
    ciudad?: string;
    departamento?: string;
  }): Promise<{ exito: boolean; municipio?: ApiMunicipioDto; error?: string }> {
    const nombre = payload.nombre.trim();
    if (!nombre) return { exito: false, error: 'El nombre del municipio es obligatorio.' };

    if (!this.http || !this.authService.accessToken()) {
      if (this.allowOfflineFallback()) {
        const localItem: ApiMunicipioDto = {
          id: 'mun-' + Date.now(),
          nombre,
          ciudad: payload.ciudad?.trim() || null,
          departamento: payload.departamento?.trim() || 'Magdalena',
          totalTarjetas: 0
        };
        this.municipiosCatalogo.update(list => [...list, localItem]);
        return { exito: true, municipio: localItem };
      }
      return { exito: false, error: 'Sesión no válida o sin conexión con el servidor.' };
    }

    try {
      const created = await firstValueFrom(
        this.http.post<ApiMunicipioDto>(`${getApiBaseUrl()}/api/municipios`, {
          nombre,
          ciudad: payload.ciudad?.trim() || undefined,
          departamento: payload.departamento?.trim() || 'Magdalena'
        })
      );
      const fullItem: ApiMunicipioDto = { ...created, totalTarjetas: created.totalTarjetas ?? 0 };
      this.municipiosCatalogo.update(list =>
        [...list, fullItem].sort((a, b) => a.nombre.localeCompare(b.nombre))
      );
      return { exito: true, municipio: fullItem };
    } catch (err) {
      return {
        exito: false,
        error: extractApiErrorMessage(err, 'No se pudo crear el municipio.')
      };
    }
  }

  /** Updates a municipality in PostgreSQL (`PATCH /api/municipios/:id`). */
  async actualizarMunicipioRemoto(
    id: string,
    payload: { nombre?: string; ciudad?: string; departamento?: string }
  ): Promise<{ exito: boolean; municipio?: ApiMunicipioDto; error?: string }> {
    if (!this.http || !this.authService.accessToken()) {
      if (this.allowOfflineFallback()) {
        let updatedItem: ApiMunicipioDto | undefined;
        this.municipiosCatalogo.update(list =>
          list.map(m => {
            if (m.id !== id) return m;
            updatedItem = {
              ...m,
              ...(payload.nombre !== undefined ? { nombre: payload.nombre.trim() } : {}),
              ...(payload.ciudad !== undefined ? { ciudad: payload.ciudad.trim() || null } : {}),
              ...(payload.departamento !== undefined
                ? { departamento: payload.departamento.trim() || 'Magdalena' }
                : {})
            };
            return updatedItem;
          })
        );
        return { exito: true, municipio: updatedItem };
      }
      return { exito: false, error: 'Sesión no válida o sin conexión con el servidor.' };
    }

    try {
      const updated = await firstValueFrom(
        this.http.patch<ApiMunicipioDto>(
          `${getApiBaseUrl()}/api/municipios/${encodeURIComponent(id)}`,
          payload
        )
      );
      this.municipiosCatalogo.update(list =>
        list
          .map(m => (m.id === id ? { ...m, ...updated } : m))
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
      );
      return { exito: true, municipio: updated };
    } catch (err) {
      return {
        exito: false,
        error: extractApiErrorMessage(err, 'No se pudo actualizar el municipio.')
      };
    }
  }

  /** Deletes an unused municipality in PostgreSQL (`DELETE /api/municipios/:id`). */
  async eliminarMunicipioRemoto(id: string): Promise<{ exito: boolean; error?: string }> {
    if (!this.http || !this.authService.accessToken()) {
      if (this.allowOfflineFallback()) {
        this.municipiosCatalogo.update(list => list.filter(m => m.id !== id));
        return { exito: true };
      }
      return { exito: false, error: 'Sesión no válida o sin conexión con el servidor.' };
    }

    try {
      await firstValueFrom(
        this.http.delete(`${getApiBaseUrl()}/api/municipios/${encodeURIComponent(id)}`)
      );
      this.municipiosCatalogo.update(list => list.filter(m => m.id !== id));
      return { exito: true };
    } catch (err) {
      return {
        exito: false,
        error: extractApiErrorMessage(err, 'No se pudo eliminar el municipio.')
      };
    }
  }

  /** Loads registered amenities from `GET /api/servicios`, returning `null` when unavailable. */
  async cargarServiciosRemotos(): Promise<string[] | null> {
    if (!this.http) return null;
    try {
      const list = await firstValueFrom(
        this.http.get<ApiServicioDto[]>(`${getApiBaseUrl()}/api/servicios`)
      );
      if (!Array.isArray(list)) return null;
      this.serviciosCatalogo.set(list);
      return list.map(s => s.nombre.trim()).filter(Boolean);
    } catch {
      return null;
    }
  }

  /** Creates a service/amenity in PostgreSQL (`POST /api/servicios`). */
  async crearServicioRemoto(payload: {
    nombre: string;
    nombreEn?: string;
    icono?: string;
  }): Promise<{ exito: boolean; servicio?: ApiServicioDto; error?: string }> {
    const nombre = payload.nombre.trim();
    if (!nombre) return { exito: false, error: 'El nombre del servicio es obligatorio.' };

    if (!this.http || !this.authService.accessToken()) {
      if (this.allowOfflineFallback()) {
        const localItem: ApiServicioDto = {
          id: 'srv-' + Date.now(),
          nombre,
          nombreEn: payload.nombreEn?.trim() || null,
          icono: payload.icono?.trim() || null
        };
        this.serviciosCatalogo.update(list => [...list, localItem]);
        return { exito: true, servicio: localItem };
      }
      return { exito: false, error: 'Sesión no válida o sin conexión con el servidor.' };
    }

    try {
      const created = await firstValueFrom(
        this.http.post<ApiServicioDto>(`${getApiBaseUrl()}/api/servicios`, {
          nombre,
          nombreEn: payload.nombreEn?.trim() || undefined,
          icono: payload.icono?.trim() || undefined
        })
      );
      this.serviciosCatalogo.update(list =>
        [...list, created].sort((a, b) => a.nombre.localeCompare(b.nombre))
      );
      return { exito: true, servicio: created };
    } catch (err) {
      return {
        exito: false,
        error: extractApiErrorMessage(err, 'No se pudo crear el servicio.')
      };
    }
  }

  /** Deletes an amenity in PostgreSQL (`DELETE /api/servicios/:id`). */
  async eliminarServicioRemoto(id: string): Promise<{ exito: boolean; error?: string }> {
    if (!this.http || !this.authService.accessToken()) {
      if (this.allowOfflineFallback()) {
        this.serviciosCatalogo.update(list => list.filter(s => s.id !== id));
        return { exito: true };
      }
      return { exito: false, error: 'Sesión no válida o sin conexión con el servidor.' };
    }

    try {
      await firstValueFrom(
        this.http.delete(`${getApiBaseUrl()}/api/servicios/${encodeURIComponent(id)}`)
      );
      this.serviciosCatalogo.update(list => list.filter(s => s.id !== id));
      return { exito: true };
    } catch (err) {
      return {
        exito: false,
        error: extractApiErrorMessage(err, 'No se pudo eliminar el servicio.')
      };
    }
  }
}

