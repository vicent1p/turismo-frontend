import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  PlaceCategoryTab,
  filterHotelsByCategory
} from '../../services/hoteles.service';
import { AuthService } from '../../services/auth.service';
import { HotelesService, Hotel, HotelDataset, ServiceIconType, buildXLink, getServiceIconAsset, getServiceIconType } from '../../services/hoteles.service';
import { LanguageService } from '../../services/language.service';
import { PublicNavbarComponent } from '../../components/public-navbar/public-navbar';
import { PublicFooterComponent } from '../../components/public-footer/public-footer';

export type { Hotel, HotelDataset };

export const TRANSLATIONS = {
  es: {
    kicker: 'Gobernación del Magdalena · Turismo',
    heroTitle: 'años de Plato',
    heroSub: 'Cuatro siglos de historia, cultura y hospitalidad a orillas del río Magdalena. Reserva tu estadía y vive la celebración.',
    cta: 'Ver hoteles',
    aboutT: 'Conoce Plato',
    aboutS: 'Municipio del departamento del Magdalena, Colombia, que celebra sus 400 años.',
    b1t: 'Historia (1626 – 2026)',
    b1p: 'Fundado en 1626 por Fray Dionisio de Sanctis. Celebramos cuatro siglos de memoria ribereña, pujanza y encuentro comercial sobre el majestuoso río Magdalena.',
    b2t: 'Cultura y Tradición',
    b2p: 'Cuna de la célebre Leyenda del Hombre Caimán (Saúl Montenegro) y del Festival Nacional del Hombre Caimán, con música de acordeón, tambora, danzas folclóricas y gastronomía del bocachico.',
    b3t: 'Qué Hacer y Visitar',
    b3p: 'Conoce la Plaza y el Monumento al Hombre Caimán, recorre el Malecón del Río Magdalena, visita la Iglesia de la Inmaculada Concepción y navega en canoa por el río.',
    b4t: 'Cómo Llegar a Plato',
    b4p: 'Estratégicamente ubicado en el centro del Magdalena sobre la Troncal de los Contenedores. Conexión directa por carretera desde Santa Marta (3h), Barranquilla (2.5h) y Valledupar (2h).',
    hotT: 'Dónde disfrutar y hospedarte',
    hotS: 'Descubre las mejores cabañas, restaurantes y hoteles de Plato. Conoce sus servicios, fotografías y datos de contacto para planear tu visita.',
    btnDescubreMas: 'Descubre más lugares y experiencias',
    tabHoteles: 'Hoteles',
    tabRestaurantes: 'Restaurantes',
    tabCabanas: 'Cabañas',
    verUbicacionBtn: 'Ver ubicación',
    fAll: 'Todos',
    fYes: 'Con disponibilidad',
    fNo: 'Sin disponibilidad',
    yes: 'Con disponibilidad',
    no: 'Sin disponibilidad',
    wa: 'Escribir por WhatsApp',
    msg: 'Hola, vi su hotel en la página de los 400 años de Plato y quisiera consultar disponibilidad.',
    footA: 'Plato 400 años · Prueba piloto',
    footB: 'Disponibilidad actualizada:',
    empty: 'No hay hoteles en esta categoría por ahora.',
    emptyRestaurantes: 'No hay restaurantes en esta categoría por ahora.',
    emptyCabanas: 'No hay cabañas en esta categoría por ahora.',
    admin: 'Modo administrador: cambia las estrellas y datos de cada hotel.',
    adminLocal: 'Modo administrador: tus cambios se guardan localmente.',
    copy: 'Copiar datos',
    reset: 'Descartar cambios',
    copied: '¡Copiado!',
    stLbl: 'Estrellas del hotel',
    stHint: 'Toca una estrella para asignar la categoría',
    heroAlt: 'Monumento al Hombre Caimán · Plato 400 años',
    loginBtn: 'Iniciar sesión',
    miEspacio: 'Mi Espacio',
    logoutBtn: 'Cerrar sesión',
    adminSession: 'Sesión activa',
    adminPerms: 'Tienes permisos para subir y administrar fotos de los hoteles.',
    adminActivo: 'Admin Activo',
    instalaciones: 'Instalaciones y servicios:',
    boxWa: 'WhatsApp',
    boxWaSub: 'Chatear directo',
    boxIg: 'Instagram',
    boxIgSub: 'Ver perfil',
    boxX: 'X',
    boxXSub: 'Ver perfil',
    boxTk: 'TikTok',
    boxTkSub: 'Ver videos',
    boxWeb: 'Página Web',
    boxWebSub: 'Visitar sitio web',
    boxFb: 'Facebook',
    boxFbSub: 'Página oficial',
    boxUbi: 'Ubicación',
    boxUbiSub: 'Cómo llegar',
    fotosTitle: 'Fotos de las instalaciones',
    fotosCount: 'Fotos',
    subirFotos: 'Subir fotos',
    subirFotoBtn: 'Subir foto',
    eliminarFoto: 'Quitar foto',
    sinFotosTitle: 'Aún no hay fotos cargadas',
    sinFotosSub: 'Toca aquí para subir las fotos de este hotel',
    oficinaPasaportes: 'Oficina de Pasaportes',
    derechosReservados: 'Todos los derechos reservados.',
    // Nuevas traducciones para el diseño Plato 400 Años
    heroKicker400: '400 AÑOS DE HISTORIA, CULTURA Y ORGULLO PLATEÑO',
    heroHeadline1: 'Plato, tierra de cumbia,',
    heroHeadline2: 'corazón del magdalena',
    heroDesc400: 'Hace 400 años comenzó nuestra historia. Hoy celebramos nuestras raíces, nuestra gente y todo lo que nos hace únicos',
    btnConoceHistoria: 'Conoce nuestra historia',
    btnVerVideo: 'Ver video',
    pillar1Title: '1624 – 2024',
    pillar1Sub: '400 años de historia',
    pillar2Title: 'Gente que inspira',
    pillar2Sub: 'Tradición y calidez',
    pillar3Title: 'Tierra de cumbia',
    pillar3Sub: 'Ritmo que nos representa',
    pillar4Title: 'Naturaleza y vida',
    pillar4Sub: 'Un paraíso por descubrir',
    raicesTag: 'NUESTRAS RAÍCES',
    raicesTitle1: 'Cuatro siglos construyendo',
    raicesTitle2: 'identidad y futuro',
    raicesDesc: 'Plato es historia, es cultura, es pasión. Desde su fundación, ha sido un territorio de encuentros, tradiciones y sueños que se han transmitido de generación en generación.',
    raicesLink: 'Descubre más'
  },
  en: {
    kicker: 'Magdalena Tourism Office · Colombia',
    heroTitle: 'years of Plato',
    heroSub: 'Four centuries of history, culture and warm hospitality on the banks of the Magdalena River. Book your stay and join the celebration.',
    cta: 'Browse hotels',
    aboutT: 'Discover Plato',
    aboutS: 'A municipality in the Magdalena department, Colombia, celebrating its 400th anniversary.',
    b1t: 'History (1626 – 2026)',
    b1p: 'Founded in 1626 by Friar Dionisio de Sanctis. Celebrating four centuries of river heritage, commercial spirit, and vibrant community on the banks of the Magdalena River.',
    b2t: 'Culture & Tradition',
    b2p: 'Birthplace of the legendary Alligator Man (Saúl Montenegro) and host of the National Alligator Man Festival, celebrated with accordion music, folklore dances, and delicious river gastronomy.',
    b3t: 'Things to Do & Visit',
    b3p: 'Visit the central plaza and the Alligator Man Monument, stroll along the Magdalena River boardwalk, visit the colonial Church of the Immaculate Conception, and enjoy boat rides on the river.',
    b4t: 'How to Get to Plato',
    b4p: 'Centrally located in the Magdalena department along the Container Highway. Easily reached by paved road from Santa Marta (3h), Barranquilla (2.5h), and Valledupar (2h).',
    hotT: 'Where to Stay',
    hotS: 'Discover the best cabins, restaurants and hotels in Plato. Explore their amenities, photos and contact details to plan your visit.',
    btnDescubreMas: 'Discover more places and experiences',
    tabHoteles: 'Hotels',
    tabRestaurantes: 'Restaurants',
    tabCabanas: 'Cabins',
    verUbicacionBtn: 'View location',
    fAll: 'All',
    fYes: 'Available',
    fNo: 'Fully booked',
    yes: 'Rooms available',
    no: 'No availability',
    wa: 'Chat on WhatsApp',
    msg: 'Hello, I saw your hotel on the Plato 400 Years website and would like to check availability.',
    footA: 'Plato 400 years · Pilot program',
    footB: 'Availability last updated:',
    empty: 'No hotels available in this category right now.',
    emptyRestaurantes: 'No restaurants available in this category right now.',
    emptyCabanas: 'No cabins available in this category right now.',
    admin: 'Admin mode: update stars and hotel details.',
    adminLocal: 'Admin mode: changes saved locally.',
    copy: 'Copy data',
    reset: 'Discard changes',
    copied: 'Copied!',
    stLbl: 'Hotel stars',
    stHint: 'Tap a star to set the category',
    heroAlt: 'Alligator Man Monument · Plato 400 years',
    loginBtn: 'Log In',
    miEspacio: 'My Space',
    logoutBtn: 'Log Out',
    adminSession: 'Active session',
    adminPerms: 'You have permissions to upload and manage hotel photos.',
    adminActivo: 'Active Admin',
    instalaciones: 'Amenities & Services:',
    boxWa: 'WhatsApp',
    boxWaSub: 'Direct Chat',
    boxIg: 'Instagram',
    boxIgSub: 'View Profile',
    boxX: 'X',
    boxXSub: 'View Profile',
    boxTk: 'TikTok',
    boxTkSub: 'Watch videos',
    boxWeb: 'Website',
    boxWebSub: 'Visit website',
    boxFb: 'Facebook',
    boxFbSub: 'Official Page',
    boxUbi: 'Location',
    boxUbiSub: 'Get Directions',
    fotosTitle: 'Facility Photos',
    fotosCount: 'Photos',
    subirFotos: 'Upload photos',
    subirFotoBtn: 'Upload photo',
    eliminarFoto: 'Remove photo',
    sinFotosTitle: 'No photos uploaded yet',
    sinFotosSub: 'Tap here to upload photos for this hotel',
    oficinaPasaportes: 'Passport Office',
    derechosReservados: 'All rights reserved.',
    // Nuevas traducciones en inglés para el diseño Plato 400 Años
    heroKicker400: '400 YEARS OF HISTORY, CULTURE AND LOCAL PRIDE',
    heroHeadline1: 'Plato, land of cumbia,',
    heroHeadline2: 'heart of the Magdalena',
    heroDesc400: '400 years ago our story began. Today we celebrate our roots, our people, and everything that makes us unique.',
    btnConoceHistoria: 'Discover our history',
    btnVerVideo: 'Watch video',
    pillar1Title: '1624 – 2024',
    pillar1Sub: '400 years of history',
    pillar2Title: 'Inspiring people',
    pillar2Sub: 'Tradition and warmth',
    pillar3Title: 'Land of cumbia',
    pillar3Sub: 'Rhythm that defines us',
    pillar4Title: 'Nature and life',
    pillar4Sub: 'A paradise to discover',
    raicesTag: 'OUR ROOTS',
    raicesTitle1: 'Four centuries building',
    raicesTitle2: 'identity and future',
    raicesDesc: 'Plato is history, culture, and passion. Since its founding, it has been a land of encounters, traditions, and dreams passed down through generations.',
    raicesLink: 'Learn more'
  }
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, PublicNavbarComponent, PublicFooterComponent],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  readonly hotelesService = inject(HotelesService);
  readonly languageService = inject(LanguageService);

  readonly lang = this.languageService.lang;
  readonly filtro = signal<'todos' | 'si' | 'no'>('todos');
  readonly categoriaActiva = signal<PlaceCategoryTab>('hoteles');
  readonly data = computed(() => this.hotelesService.dataset());
  readonly hotelesPorCategoria = computed(() =>
    filterHotelsByCategory(this.data().hoteles, this.categoriaActiva())
  );
  readonly emptyCategoriaMsg = computed(() => {
    const t = this.t();
    switch (this.categoriaActiva()) {
      case 'restaurantes':
        return t.emptyRestaurantes;
      case 'cabanas':
        return t.emptyCabanas;
      default:
        return t.empty;
    }
  });
  readonly copied = signal<boolean>(false);
  readonly jsonExport = signal<string | null>(null);
  readonly selectedPhoto = signal<{ url: string; hotelNombre: string } | null>(null);

  readonly admin = computed(() => this.authService.isAuthenticated());
  readonly canManagePhotos = computed(() => this.authService.canManageHoteles());
  readonly roleLabel = computed(() => this.authService.roleLabel());

  readonly t = computed(() => TRANSLATIONS[this.lang()]);

  readonly filteredHoteles = computed(() => {
    const f = this.filtro();
    const list = this.data().hoteles;
    if (f === 'todos') return list;
    return list.filter(h => (f === 'si' ? h.disponible : !h.disponible));
  });

  readonly fechaFormateada = computed(() => {
    try {
      const d = new Date(this.data().actualizado + 'T12:00:00');
      return d.toLocaleDateString(this.lang() === 'es' ? 'es-CO' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return this.data().actualizado;
    }
  });

  ngOnInit(): void {
    void this.hotelesService.sincronizarDesdeApi();
    if (typeof window !== 'undefined') {
      const hash = (window.location.hash || '').toLowerCase();
      if (hash === '#admin' || hash === '#administrador' || hash === '#admini' || hash === '#login') {
        this.router.navigate(['/administrador']);
      }
    }
  }

  logout(): void {
    this.authService.logout();
  }

  setLang(l: 'es' | 'en'): void {
    this.languageService.setLang(l);
  }

  setCategoria(cat: PlaceCategoryTab): void {
    this.categoriaActiva.set(cat);
    if (typeof document !== 'undefined') {
      const grid = document.getElementById('grid');
      if (grid) grid.scrollLeft = 0;
    }
  }

  scrollHotels(dir: number): void {
    if (typeof document !== 'undefined') {
      const grid = document.getElementById('grid');
      if (grid) {
        grid.scrollBy({ left: dir * 370, behavior: 'smooth' });
      }
    }
  }

  getHotelDesc(hotel: Hotel): string {
    if (this.lang() === 'en') {
      if (hotel.en?.desc && hotel.en.desc.trim() !== '' && hotel.en.desc !== hotel.es?.desc) {
        return hotel.en.desc;
      }
      return this.traducirTextoHotel(hotel.es?.desc || '');
    }
    return hotel.es?.desc || '';
  }

  getHotelServicios(hotel: Hotel): string[] {
    const list = this.lang() === 'en' && hotel.en?.serv && hotel.en.serv.length > 0 && hotel.en.serv !== hotel.es?.serv
      ? hotel.en.serv
      : (hotel.es?.serv || []);

    if (this.lang() === 'en') {
      return list.map(s => this.traducirServicio(s));
    }
    return list;
  }

  private traducirServicio(s: string): string {
    const key = (s || '').toLowerCase().trim();
    const map: Record<string, string> = {
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
    return map[key] || s;
  }

  private traducirTextoHotel(texto: string): string {
    if (!texto) return '';
    if (texto.includes('Tradición y confort en el corazón de Plato')) {
      return 'Tradition and comfort in the heart of Plato. Spacious air-conditioned rooms, a refreshing outdoor pool, typical regional restaurant, and secure parking.';
    }
    if (texto.includes('Hospedaje céntrico y acogedor')) {
      return 'Central and welcoming stay, just steps from the main square and downtown commerce. Ideal for business or leisure travelers visiting Plato.';
    }
    if (texto.includes('Tranquilidad frente al majestuoso río Magdalena')) {
      return 'Tranquility facing the majestic Magdalena River. Beautiful river sunset views, countryside relaxation areas, and the warmest local hospitality.';
    }
    if (texto.includes('Exclusivo hospedaje ecoturístico')) {
      return 'Exclusive ecotourism stay with panoramic river views, comfortable suites, restaurant and garden areas.';
    }
    if (texto.includes('Hotel boutique temático')) {
      return 'Themed boutique hotel with native wood finishes, infinity pool, and signature restaurant.';
    }
    return texto;
  }

  setFiltro(f: 'todos' | 'si' | 'no'): void {
    this.filtro.set(f);
  }

  setStars(id: string, n: number): void {
    const hotel = this.data().hoteles.find(h => h.id === id);
    const currentStars = hotel ? Math.round(Number(hotel.estrellas) || 0) : 0;
    void this.hotelesService.setStarsRemoto(id, currentStars === n ? 0 : n);
  }

  openLightbox(url: string, hotelNombre: string): void {
    this.selectedPhoto.set({ url, hotelNombre });
  }

  closeLightbox(): void {
    this.selectedPhoto.set(null);
  }

  scrollCarousel(container: HTMLElement, direction: number): void {
    container.scrollBy({
      left: direction * container.clientWidth,
      behavior: 'smooth'
    });
  }

  async addPhotos(id: string, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const files = Array.from(input.files);

    const uploaded = await this.hotelesService.subirImagenesRemotas(files, () =>
      Promise.all(files.map(file => this.compressImage(file)))
    );
    if (uploaded.exito && uploaded.urls.length > 0) {
      await this.hotelesService.agregarFotosRemotas(id, uploaded.urls);
    }
    input.value = '';
  }

  removePhoto(id: string, index: number): void {
    void this.hotelesService.eliminarFotoRemota(id, index);
  }

  private compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 900;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  getServIconType(serv: string): ServiceIconType {
    return getServiceIconType(serv);
  }

  getServIconAsset(serv: string): string | null {
    return getServiceIconAsset(serv);
  }

  getWhatsAppLink(hotel: Hotel): string {
    const msg = encodeURIComponent(this.t().msg);
    const cleanPhone = (hotel.whatsapp || '').replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${msg}`;
  }

  getInstagramLink(hotel: Hotel): string {
    return hotel.instagram || 'https://www.instagram.com/';
  }

  getFacebookLink(hotel: Hotel): string {
    return hotel.facebook || 'https://www.facebook.com/';
  }

  getXLink(hotel: Hotel): string {
    return buildXLink(hotel.x);
  }

  getTikTokLink(hotel: Hotel): string {
    const raw = (hotel.tiktok || '').trim();
    if (!raw) return 'https://www.tiktok.com/';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    const cleanUser = raw.startsWith('@') ? raw : `@${raw}`;
    return `https://www.tiktok.com/${cleanUser}`;
  }

  getPaginaWebLink(hotel: Hotel): string {
    const raw = (hotel.paginaWeb || '').trim();
    if (!raw) return '#';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return `https://${raw}`;
  }

  getUbicacionLink(hotel: Hotel): string {
    if (hotel.ubicacion) return hotel.ubicacion;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.nombre + ' Plato Magdalena')}`;
  }

  getStarArray(n: number): number[] {
    const count = Math.max(0, Math.min(5, Math.round(Number(n) || 0)));
    return Array.from({ length: count }, (_, i) => i + 1);
  }

  getEmptyStarArray(n: number): number[] {
    const count = Math.max(0, Math.min(5, Math.round(Number(n) || 0)));
    return Array.from({ length: 5 - count }, (_, i) => i + 1);
  }

  copiarDatos(): void {
    const txt = JSON.stringify(this.data(), null, 2);
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(
        () => {
          this.copied.set(true);
          setTimeout(() => this.copied.set(false), 3000);
        },
        () => {
          this.jsonExport.set(txt);
        }
      );
    } else {
      this.jsonExport.set(txt);
    }
  }

  descartarLocal(): void {
    this.hotelesService.restaurarDatos();
  }
}
