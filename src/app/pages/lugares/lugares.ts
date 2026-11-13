import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { EditorialShellComponent } from '../../components/editorial-shell/editorial-shell';
import {
  CardType,
  Hotel,
  HotelesService,
  PlaceCategoryTab,
  ServiceIconType,
  buildUbicacionUrl,
  buildWhatsAppUrl,
  buildXLink,
  filterHotelsByCategory,
  getServiceIconAsset,
  getServiceIconType,
  normalizeCardType,
  resolveHotelDescription,
  resolveHotelServices
} from '../../services/hoteles.service';
import { AppLang, LanguageService } from '../../services/language.service';

interface CategoryMeta {
  id: PlaceCategoryTab;
  label: string;
  singularLabel: string;
  summaryText: string;
}

interface LugaresLocaleContent {
  breadcrumbHome: string;
  breadcrumbCurrent: string;
  metaPill: string;
  eyebrow: string;
  pageTitle: string;
  subtitle: string;
  metricHotelsLabel: string;
  metricRestaurantsLabel: string;
  metricCabinsLabel: string;
  switcherAriaLabel: string;
  categories: ReadonlyArray<CategoryMeta>;
  filterAll: string;
  filterAvailable: string;
  showingPrefix: string;
  inPlato: string;
  available: string;
  unavailable: string;
  amenitiesTitle: string;
  viewDetail: string;
  verUbicacionBtn: string;
  mapsLabel: string;
  whatsappLabel: string;
  closeModal: string;
  prevPhoto: string;
  nextPhoto: string;
  noImage: string;
  emptyCategory: string;
  emptyAvailable: string;
  showAllBtn: string;
  closingTag: string;
  closingTitle: string;
  closingDesc: string;
  ctaAgenda: string;
  ctaCulture: string;
  ctaBackHome: string;
}

const VALID_TABS: ReadonlySet<PlaceCategoryTab> = new Set<PlaceCategoryTab>([
  'hoteles',
  'restaurantes',
  'cabanas'
]);

const LUGARES_CONTENT: Record<AppLang, LugaresLocaleContent> = {
  es: {
    breadcrumbHome: 'Inicio',
    breadcrumbCurrent: 'Lugares y Experiencias',
    metaPill: 'Directorio Turístico · Plato 400 Años',
    eyebrow: 'GUÍA DE HOSPEDAJE Y GASTRONOMÍA · PLATO, MAGDALENA',
    pageTitle: 'Lugares y Experiencias',
    subtitle:
      'Explora hoteles, restaurantes típicos y cabañas campestres en la tierra del Hombre Caimán. Selecciona una categoría para ver ubicaciones, servicios y contacto directo.',
    metricHotelsLabel: 'Hoteles',
    metricRestaurantsLabel: 'Restaurantes',
    metricCabinsLabel: 'Cabañas',
    switcherAriaLabel: 'Categorías de lugares y experiencias',
    categories: [
      {
        id: 'hoteles',
        label: 'Hoteles',
        singularLabel: 'Hotel',
        summaryText: 'Estancias céntricas, confort ejecutivo y hospitalidad ribereña.'
      },
      {
        id: 'restaurantes',
        label: 'Restaurantes',
        singularLabel: 'Restaurante',
        summaryText: 'Gastronomía del Magdalena, fogón tradicional, cafés y dulcería local.'
      },
      {
        id: 'cabanas',
        label: 'Cabañas',
        singularLabel: 'Cabaña',
        summaryText: 'Refugios naturales frente a la ciénaga, brisa fluvial y descanso familiar.'
      }
    ],
    filterAll: 'Todos',
    filterAvailable: 'Disponibles',
    showingPrefix: 'Mostrando',
    inPlato: 'en Plato',
    available: 'Disponible',
    unavailable: 'Sin cupo',
    amenitiesTitle: 'Servicios destacados',
    viewDetail: 'Ver detalle',
    verUbicacionBtn: 'Ver ubicación',
    mapsLabel: 'Ubicación',
    whatsappLabel: 'WhatsApp',
    closeModal: 'Cerrar detalle',
    prevPhoto: 'Foto anterior',
    nextPhoto: 'Foto siguiente',
    noImage: 'Sin imagen',
    emptyCategory: 'Aún no hay establecimientos registrados en esta categoría.',
    emptyAvailable: 'No hay establecimientos con disponibilidad inmediata en esta categoría.',
    showAllBtn: 'Ver todos',
    closingTag: 'PLANEACIÓN DE VIAJE · PLATO 400 AÑOS',
    closingTitle: 'Completa tu itinerario conmemorativo en Plato',
    closingDesc:
      'Consulta la programación oficial del cuatricentenario o recorre el archivo histórico y cultural del municipio.',
    ctaAgenda: 'Ver Programación 400 Años',
    ctaCulture: 'Nuestra Historia y Cultura',
    ctaBackHome: 'Volver a la portada'
  },
  en: {
    breadcrumbHome: 'Home',
    breadcrumbCurrent: 'Places & Experiences',
    metaPill: 'Tourism Directory · Plato 400 Years',
    eyebrow: 'STAYS & DINING GUIDE · PLATO, MAGDALENA',
    pageTitle: 'Places & Experiences',
    subtitle:
      'Explore hotels, traditional restaurants, and countryside cabins in the land of the Hombre Caimán. Choose a category to check locations, amenities, and direct contact.',
    metricHotelsLabel: 'Hotels',
    metricRestaurantsLabel: 'Restaurants',
    metricCabinsLabel: 'Cabins',
    switcherAriaLabel: 'Categories of places and experiences',
    categories: [
      {
        id: 'hoteles',
        label: 'Hotels',
        singularLabel: 'Hotel',
        summaryText: 'Central stays, executive comfort, and riverside hospitality.'
      },
      {
        id: 'restaurantes',
        label: 'Restaurants',
        singularLabel: 'Restaurant',
        summaryText: 'Magdalena riverside cuisine, charcoal grills, cafés, and local sweets.'
      },
      {
        id: 'cabanas',
        label: 'Cabins',
        singularLabel: 'Cabin',
        summaryText: 'Eco retreats overlooking wetlands, river breeze, and family relaxation.'
      }
    ],
    filterAll: 'All',
    filterAvailable: 'Available',
    showingPrefix: 'Showing',
    inPlato: 'in Plato',
    available: 'Available',
    unavailable: 'Booked',
    amenitiesTitle: 'Featured amenities',
    viewDetail: 'View details',
    verUbicacionBtn: 'View location',
    mapsLabel: 'Location',
    whatsappLabel: 'WhatsApp',
    closeModal: 'Close details',
    prevPhoto: 'Previous photo',
    nextPhoto: 'Next photo',
    noImage: 'No image',
    emptyCategory: 'No places are registered in this category yet.',
    emptyAvailable: 'No places with immediate availability in this category.',
    showAllBtn: 'Show all',
    closingTag: 'TRIP PLANNING · PLATO 400 YEARS',
    closingTitle: 'Complete your 400th anniversary itinerary in Plato',
    closingDesc:
      'Check the official quadricentennial schedule or browse the municipality’s historical and cultural archive.',
    ctaAgenda: 'View 400 Years Schedule',
    ctaCulture: 'Our History & Culture',
    ctaBackHome: 'Back to Home'
  }
};

@Component({
  selector: 'app-lugares',
  standalone: true,
  imports: [CommonModule, EditorialShellComponent],
  templateUrl: './lugares.html',
  styleUrl: './lugares.css'
})
export class LugaresComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hotelesService = inject(HotelesService);
  private readonly languageService = inject(LanguageService);

  readonly lang = this.languageService.lang;
  readonly content = computed(() => LUGARES_CONTENT[this.lang()]);

  readonly categoriaActiva = signal<PlaceCategoryTab>('hoteles');
  readonly soloDisponibles = signal<boolean>(false);
  readonly selectedPlace = signal<Hotel | null>(null);
  readonly modalPhotoIdx = signal<number>(0);

  readonly allItems = computed(() => this.hotelesService.dataset().hoteles);

  readonly countHoteles = computed(() => filterHotelsByCategory(this.allItems(), 'hoteles').length);
  readonly countRestaurantes = computed(
    () => filterHotelsByCategory(this.allItems(), 'restaurantes').length
  );
  readonly countCabanas = computed(() => filterHotelsByCategory(this.allItems(), 'cabanas').length);

  readonly metrics = computed(() => {
    const t = this.content();
    return [
      { id: 'hoteles' as PlaceCategoryTab, label: t.metricHotelsLabel, value: this.countHoteles() },
      {
        id: 'restaurantes' as PlaceCategoryTab,
        label: t.metricRestaurantsLabel,
        value: this.countRestaurantes()
      },
      { id: 'cabanas' as PlaceCategoryTab, label: t.metricCabinsLabel, value: this.countCabanas() }
    ];
  });

  readonly activeCategoryMeta = computed(() => {
    const active = this.categoriaActiva();
    return (
      this.content().categories.find(c => c.id === active) ?? this.content().categories[0]
    );
  });

  readonly categoryItems = computed(() =>
    filterHotelsByCategory(this.allItems(), this.categoriaActiva())
  );

  readonly visibleItems = computed(() => {
    const list = this.categoryItems();
    if (!this.soloDisponibles()) {
      return list;
    }
    return list.filter(item => item.disponible);
  });

  readonly modalPhotos = computed(() => this.selectedPlace()?.fotos ?? []);

  ngOnInit(): void {
    void this.hotelesService.sincronizarDesdeApi();
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params: ParamMap) => {
        const param = params.get('categoria') as PlaceCategoryTab | null;
        if (param && VALID_TABS.has(param)) {
          this.categoriaActiva.set(param);
        }
      });
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.selectedPlace()) {
      this.cerrarDetalle();
    }
  }

  setCategoria(cat: PlaceCategoryTab): void {
    this.categoriaActiva.set(cat);
    this.soloDisponibles.set(false);
    this.cerrarDetalle();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { categoria: cat },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  setSoloDisponibles(onlyAvailable: boolean): void {
    this.soloDisponibles.set(onlyAvailable);
  }

  abrirDetalle(place: Hotel): void {
    this.selectedPlace.set(place);
    this.modalPhotoIdx.set(0);
  }

  cerrarDetalle(): void {
    this.selectedPlace.set(null);
    this.modalPhotoIdx.set(0);
  }

  stepModalPhoto(delta: number): void {
    const photos = this.modalPhotos();
    if (photos.length <= 1) return;
    const next = (this.modalPhotoIdx() + delta + photos.length) % photos.length;
    this.modalPhotoIdx.set(next);
  }

  getDesc(place: Hotel): string {
    return resolveHotelDescription(place, this.lang());
  }

  getServices(place: Hotel): string[] {
    return resolveHotelServices(place, this.lang());
  }

  getCardCategoryBadge(tipo?: CardType): string {
    const normalized = normalizeCardType(tipo);
    const categories = this.content().categories;
    const match = categories.find(cat =>
      (normalized === 'restaurante' && cat.id === 'restaurantes') ||
      (normalized === 'cabana' && cat.id === 'cabanas') ||
      (normalized === 'hotel' && cat.id === 'hoteles')
    );
    return match?.singularLabel ?? categories[0].singularLabel;
  }

  getHotelServicios(place: Hotel): string[] {
    return resolveHotelServices(place, this.lang());
  }

  getServIconType(serv: string): ServiceIconType {
    return getServiceIconType(serv);
  }

  getServIconAsset(serv: string): string | null {
    return getServiceIconAsset(serv);
  }

  getUbicacionLink(place: Hotel): string {
    if (place.ubicacion) return place.ubicacion;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.nombre + ' Plato Magdalena')}`;
  }

  getWhatsAppLink(place: Hotel): string {
    return this.getWhatsAppHref(place);
  }

  getFacebookLink(place: Hotel): string {
    return this.getFacebookHref(place);
  }

  getInstagramLink(place: Hotel): string {
    return place.instagram || 'https://www.instagram.com/';
  }

  getXLink(place: Hotel): string {
    return buildXLink(place.x);
  }

  getTikTokLink(place: Hotel): string {
    const raw = (place.tiktok || '').trim();
    if (!raw) return 'https://www.tiktok.com/';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    const cleanUser = raw.startsWith('@') ? raw : `@${raw}`;
    return `https://www.tiktok.com/${cleanUser}`;
  }

  getPaginaWebLink(place: Hotel): string {
    const raw = (place.paginaWeb || '').trim();
    if (!raw) return '#';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return `https://${raw}`;
  }

  getMapsUrl(place: Hotel): string {
    return buildUbicacionUrl(place);
  }

  getFacebookHref(place: Hotel): string {
    const raw = (place.facebook || '').trim();
    if (!raw) return 'https://www.facebook.com/';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return `https://www.facebook.com/${raw.replace(/^@/, '')}`;
  }

  getWhatsAppHref(place: Hotel): string {
    const msg =
      this.lang() === 'en'
        ? `Hello, I found ${place.nombre} on Plato 400 Years Tourism Guide and would like more information.`
        : `Hola, vi ${place.nombre} en la guía turística Plato 400 Años y me gustaría más información.`;
    return buildWhatsAppUrl(place, msg);
  }

  getStarArray(count: number): number[] {
    const safe = Math.max(1, Math.min(5, Math.round(count || 1)));
    return Array.from({ length: safe }, (_, i) => i + 1);
  }
}

