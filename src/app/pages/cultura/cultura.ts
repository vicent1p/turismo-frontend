import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { EditorialShellComponent } from '../../components/editorial-shell/editorial-shell';
import { AppLang, LanguageService } from '../../services/language.service';

export type CulturaCategoryId = 'all' | 'mito' | 'rio' | 'patrimonio';

export interface CulturaPhotoItem {
  id: string;
  order: string;
  image: string;
  category: Exclude<CulturaCategoryId, 'all'>;
  categoryLabel: string;
  location: string;
  title: string;
  caption: string;
  lightboxNote: string;
  alt: string;
}

interface CulturaFilterTab {
  id: CulturaCategoryId;
  label: string;
}

interface CulturaLocaleContent {
  breadcrumbHome: string;
  breadcrumbCurrent: string;
  metaPill: string;
  eyebrow: string;
  pageTitle: string;
  subtitle: string;
  pillars: ReadonlyArray<{ label: string; value: string }>;
  filterAriaLabel: string;
  filters: ReadonlyArray<CulturaFilterTab>;
  expandHint: string;
  galleryAriaLabel: string;
  lightboxCloseAria: string;
  lightboxPrevAria: string;
  lightboxNextAria: string;
  photos: ReadonlyArray<CulturaPhotoItem>;
  closingTag: string;
  closingTitle: string;
  closingDesc: string;
  ctaHistory: string;
  ctaHotels: string;
  ctaBackHome: string;
}

const CULTURA_CONTENT: Record<AppLang, CulturaLocaleContent> = {
  es: {
    breadcrumbHome: 'Inicio',
    breadcrumbCurrent: 'Cultura',
    metaPill: 'Galería Cultural · 9 postales de Plato',
    eyebrow: 'TRADICIÓN, MITO Y PAISAJE · PLATO 400 AÑOS',
    pageTitle: 'Cultura',
    subtitle: 'Postales vivas de la fe, las aguas del Magdalena y la leyenda del Hombre Caimán',
    pillars: [
      { label: 'Colección visual', value: '9 Postales de Plato' },
      { label: 'Esencia folclórica', value: 'Mito y Escultura' },
      { label: 'Horizonte ribereño', value: 'Río y Ciénagas' }
    ],
    filterAriaLabel: 'Filtrar postales culturales por categoría',
    filters: [
      { id: 'all', label: 'Todas' },
      { id: 'mito', label: 'Mito y Escultura' },
      { id: 'rio', label: 'Río y Ciénagas' },
      { id: 'patrimonio', label: 'Arquitectura y Fe' }
    ],
    expandHint: 'Ver postal',
    galleryAriaLabel: 'Galería de tarjetas culturales de Plato, Magdalena',
    lightboxCloseAria: 'Cerrar visor de postal',
    lightboxPrevAria: 'Postal anterior',
    lightboxNextAria: 'Siguiente postal',
    photos: [
      {
        id: 'iglesia-fachada',
        order: '01',
        image: '/cultura/cultura-iglesia-fachada.jpg',
        category: 'patrimonio',
        categoryLabel: 'Arquitectura y Fe',
        location: 'Centro Histórico',
        title: 'Iglesia Inmaculada Concepción',
        caption: 'Templo emblemático de muros blancos y acentos terracota frente a la plaza mayor.',
        lightboxNote:
          'Corazón espiritual y arquitectónico de Plato. Su torre campanario y su cúpula dominan las tardes del centro histórico rodeadas de trinitarias.',
        alt: 'Fachada frontal de la Iglesia de la Inmaculada Concepción de Plato al atardecer'
      },
      {
        id: 'hombre-caiman',
        order: '02',
        image: '/cultura/cultura-hombre-caiman.jpg',
        category: 'mito',
        categoryLabel: 'Mito y Escultura',
        location: 'Símbolo Plateño',
        title: 'Monumento al Hombre Caimán',
        caption: 'Escultura icónica que inmortaliza el mito narrado por pescadores y cronistas.',
        lightboxNote:
          'Homenaje a Saúl Montenegro, el pescador de nuestra leyenda inmortalizado en bronce y mosaico verde frente al horizonte del Magdalena.',
        alt: 'Monumento al Hombre Caimán en Plato iluminado con luz de atardecer'
      },
      {
        id: 'rio-atardecer',
        order: '03',
        image: '/cultura/cultura-rio-atardecer.jpg',
        category: 'rio',
        categoryLabel: 'Río y Ciénagas',
        location: 'Orillas del Magdalena',
        title: 'Atardecer en el Río Magdalena',
        caption: 'Chalupa tradicional reposando en la ribera dorada bajo el sol del Caribe.',
        lightboxNote:
          'Las aguas del Río Grande de la Magdalena tiñen la tarde de oro mientras las embarcaciones descansan junto a los playones de pesca.',
        alt: 'Atardecer dorado sobre el Río Magdalena con una chalupa tradicional en la orilla'
      },
      {
        id: 'lavanderas-caiman',
        order: '04',
        image: '/cultura/cultura-lavanderas-caiman.jpg',
        category: 'mito',
        categoryLabel: 'Mito y Escultura',
        location: 'Relato Popular',
        title: 'Las Lavanderas y el Caimán',
        caption: 'Conjunto escultórico que recrea la célebre escena ribereña de nuestra tradición oral.',
        lightboxNote:
          'Obra costumbrista que evoca el pasaje más recordado de la tradición plateña a orillas del caño y del río, donde mito y oficio cotidiano se encuentran.',
        alt: 'Escultura de piedra que representa al Hombre Caimán observando a las lavanderas'
      },
      {
        id: 'canoas-rio',
        order: '05',
        image: '/cultura/cultura-canoas-rio.jpg',
        category: 'rio',
        categoryLabel: 'Río y Ciénagas',
        location: 'Puerto Fluvial',
        title: 'Canoas Ribereñas',
        caption: 'Botes artesanales de madera alineados en el barranco, pulso diario del pescador.',
        lightboxNote:
          'Vista aérea de las canoas de madera que desde hace generaciones conectan los playones, ciénagas e islas pesqueras alrededor de Plato.',
        alt: 'Vista aérea cenital de canoas tradicionales de madera en la ribera de Plato'
      },
      {
        id: 'pueblo-cienaga',
        order: '06',
        image: '/cultura/cultura-pueblo-cienaga.jpg',
        category: 'rio',
        categoryLabel: 'Río y Ciénagas',
        location: 'Complejo Cenagoso',
        title: 'Ciénagas y Pueblo Ribereño',
        caption: 'Panorámica verde del segundo complejo cenagoso más importante del país.',
        lightboxNote:
          'Entre humedales fértiles y vegetación tropical se despliega el territorio heredero del antiguo asentamiento de Zárate y Plato Viejo.',
        alt: 'Panorámica aérea de las ciénagas verdes y el caserío ribereño de Plato'
      },
      {
        id: 'puente-magdalena',
        order: '07',
        image: '/cultura/cultura-puente-magdalena.jpg',
        category: 'rio',
        categoryLabel: 'Río y Ciénagas',
        location: 'Vía Caribe',
        title: 'Puente Antonio Escobar Camargo',
        caption: 'Majestuosa silueta al ocaso uniendo los departamentos de Magdalena y Bolívar.',
        lightboxNote:
          'Símbolo de integración regional bautizado en honor al ilustre jurista plateño Antonio Escobar Camargo sobre el cauce del Magdalena.',
        alt: 'Silueta del Puente Antonio Escobar Camargo al atardecer sobre el Río Magdalena'
      },
      {
        id: 'plaza-aerea',
        order: '08',
        image: '/cultura/cultura-plaza-aerea.jpg',
        category: 'patrimonio',
        categoryLabel: 'Arquitectura y Fe',
        location: 'Trazado Urbano',
        title: 'Plaza Central desde el Aire',
        caption: 'Encuentro ciudadano donde convergen fiestas patronales, cumbia y memoria.',
        lightboxNote:
          'Perspectiva elevada del corazón cívico de Plato, testigo de celebraciones culturales, retretas y cuatro siglos de vida comunitaria.',
        alt: 'Vista aérea de la plaza central y la iglesia blanca con tejas y detalles rojos'
      },
      {
        id: 'ocaso-iglesia-rio',
        order: '09',
        image: '/cultura/cultura-ocaso-iglesia-rio.jpg',
        category: 'patrimonio',
        categoryLabel: 'Arquitectura y Fe',
        location: 'Horizonte Plateño',
        title: 'Ocaso entre Cúpulas y Río',
        caption: 'Cúpulas parroquiales recortadas frente al resplandor vespertino del Magdalena.',
        lightboxNote:
          'Postal de cierre que une en un solo cuadro la arquitectura sacra de Plato con el espejo dorado de su gran río al caer la tarde.',
        alt: 'Vista aérea al atardecer sobre las cúpulas de la iglesia hacia el Río Magdalena'
      }
    ],
    closingTag: 'EXPLORA MÁS DE NUESTRA TIERRA',
    closingTitle: 'Cuatro siglos de memoria viva',
    closingDesc: 'Complementa este recorrido visual leyendo la crónica histórica de Plato desde el País Chimila hasta nuestros días.',
    ctaHistory: 'Leer nuestra Historia',
    ctaHotels: 'Ver hoteles en Plato',
    ctaBackHome: 'Volver al inicio'
  },
  en: {
    breadcrumbHome: 'Home',
    breadcrumbCurrent: 'Culture',
    metaPill: 'Cultural Gallery · 9 postcards of Plato',
    eyebrow: 'TRADITION, MYTH & LANDSCAPE · PLATO 400 YEARS',
    pageTitle: 'Culture',
    subtitle: 'Living postcards of faith, Magdalena river waters, and the Alligator Man legend',
    pillars: [
      { label: 'Visual archive', value: '9 Postcards of Plato' },
      { label: 'Folkloric spirit', value: 'Myth & Sculpture' },
      { label: 'River horizon', value: 'River & Wetlands' }
    ],
    filterAriaLabel: 'Filter cultural postcards by category',
    filters: [
      { id: 'all', label: 'All' },
      { id: 'mito', label: 'Myth & Sculpture' },
      { id: 'rio', label: 'River & Wetlands' },
      { id: 'patrimonio', label: 'Architecture & Faith' }
    ],
    expandHint: 'View card',
    galleryAriaLabel: 'Plato Magdalena cultural gallery cards',
    lightboxCloseAria: 'Close postcard viewer',
    lightboxPrevAria: 'Previous postcard',
    lightboxNextAria: 'Next postcard',
    photos: [
      {
        id: 'iglesia-fachada',
        order: '01',
        image: '/cultura/cultura-iglesia-fachada.jpg',
        category: 'patrimonio',
        categoryLabel: 'Architecture & Faith',
        location: 'Historic Center',
        title: 'Immaculate Conception Church',
        caption: 'Iconic whitewashed parish church with terracotta trim facing the main square.',
        lightboxNote:
          'Spiritual and architectural landmark of Plato, crowned by its bell tower and dome framed by tropical bougainvillea.',
        alt: 'Front facade of the Immaculate Conception Church in Plato at sunset'
      },
      {
        id: 'hombre-caiman',
        order: '02',
        image: '/cultura/cultura-hombre-caiman.jpg',
        category: 'mito',
        categoryLabel: 'Myth & Sculpture',
        location: 'Local Symbol',
        title: 'Hombre Caimán Monument',
        caption: 'Signature sculpture celebrating the folkloric legend passed down by river fishermen.',
        lightboxNote:
          'Tribute to Saúl Montenegro, the legendary fisherman cast in bronze and emerald mosaic overlooking the Magdalena horizon.',
        alt: 'Hombre Caimán monument in Plato bathed in warm sunset light'
      },
      {
        id: 'rio-atardecer',
        order: '03',
        image: '/cultura/cultura-rio-atardecer.jpg',
        category: 'rio',
        categoryLabel: 'River & Wetlands',
        location: 'Magdalena Banks',
        title: 'Sunset on the Magdalena River',
        caption: 'Traditional wooden riverboat resting along the golden shoreline at dusk.',
        lightboxNote:
          'Golden Caribbean light reflects across the Magdalena River while local boats anchor along the grassy fishing banks.',
        alt: 'Golden sunset over the Magdalena River with a traditional river boat moored ashore'
      },
      {
        id: 'lavanderas-caiman',
        order: '04',
        image: '/cultura/cultura-lavanderas-caiman.jpg',
        category: 'mito',
        categoryLabel: 'Myth & Sculpture',
        location: 'Oral Tradition',
        title: 'The Washerwomen & The Alligator',
        caption: 'Narrative stone sculpture group depicting the iconic riverside folklore scene.',
        lightboxNote:
          'Carved ensemble bringing to life Plato’s cherished oral tale of everyday riverside life intertwined with magical realism.',
        alt: 'Stone sculpture depicting the Alligator Man watching over the riverside washerwomen'
      },
      {
        id: 'canoas-rio',
        order: '05',
        image: '/cultura/cultura-canoas-rio.jpg',
        category: 'rio',
        categoryLabel: 'River & Wetlands',
        location: 'River Port',
        title: 'Riverside Wooden Canoes',
        caption: 'Handcrafted canoes lined up along the bank, the daily pulse of local fishermen.',
        lightboxNote:
          'Top-down aerial view of the traditional wooden canoes connecting Plato with surrounding marsh islands and fishing grounds.',
        alt: 'Overhead drone view of traditional wooden fishing canoes along the riverbank'
      },
      {
        id: 'pueblo-cienaga',
        order: '06',
        image: '/cultura/cultura-pueblo-cienaga.jpg',
        category: 'rio',
        categoryLabel: 'River & Wetlands',
        location: 'Wetland Complex',
        title: 'Wetlands & River Town',
        caption: 'Verdant aerial panorama across Colombia’s second-largest marshland complex.',
        lightboxNote:
          'Lush marshes and fertile floodplains surrounding the historic territory founded beside the ancient Zárate settlement.',
        alt: 'Aerial panorama of the green wetlands and riverside settlement of Plato'
      },
      {
        id: 'puente-magdalena',
        order: '07',
        image: '/cultura/cultura-puente-magdalena.jpg',
        category: 'rio',
        categoryLabel: 'River & Wetlands',
        location: 'Caribbean Crossing',
        title: 'Antonio Escobar Camargo Bridge',
        caption: 'Majestic dusk silhouette linking Magdalena and Bolívar across the great river.',
        lightboxNote:
          'Iconic river crossing named in honor of renowned Plato jurist and statesman Antonio Escobar Camargo.',
        alt: 'Silhouette of the Antonio Escobar Camargo Bridge at sunset over the Magdalena River'
      },
      {
        id: 'plaza-aerea',
        order: '08',
        image: '/cultura/cultura-plaza-aerea.jpg',
        category: 'patrimonio',
        categoryLabel: 'Architecture & Faith',
        location: 'Town Square',
        title: 'Central Plaza from Above',
        caption: 'Civic gathering place where patron saint feasts, cumbia, and heritage meet.',
        lightboxNote:
          'Elevated perspective over the central plaza and church, witnessing four centuries of community traditions.',
        alt: 'Aerial view of Plato’s central square and white-and-terracotta parish church'
      },
      {
        id: 'ocaso-iglesia-rio',
        order: '09',
        image: '/cultura/cultura-ocaso-iglesia-rio.jpg',
        category: 'patrimonio',
        categoryLabel: 'Architecture & Faith',
        location: 'Evening Skyline',
        title: 'Dusk Between Domes & River',
        caption: 'Parish church domes framed against the glowing evening waters of the Magdalena.',
        lightboxNote:
          'Closing postcard uniting Plato’s sacred architecture and the shimmering Magdalena River under tropical twilight.',
        alt: 'Aerial dusk view looking past the church domes toward the glowing Magdalena River'
      }
    ],
    closingTag: 'EXPLORE MORE OF OUR HERITAGE',
    closingTitle: 'Four centuries of living memory',
    closingDesc: 'Pair this visual showcase with the full historical chronicle of Plato from the Chimila lands to today.',
    ctaHistory: 'Read our History',
    ctaHotels: 'View hotels in Plato',
    ctaBackHome: 'Back to Home'
  }
};

@Component({
  selector: 'app-cultura',
  standalone: true,
  imports: [EditorialShellComponent],
  templateUrl: './cultura.html',
  styleUrl: './cultura.css'
})
export class CulturaComponent {
  private readonly languageService = inject(LanguageService);

  readonly lang = this.languageService.lang;
  readonly activeCategory = signal<CulturaCategoryId>('all');
  readonly selectedPhotoId = signal<string | null>(null);

  readonly content = computed(() => CULTURA_CONTENT[this.lang()]);

  readonly filteredPhotos = computed(() => {
    const category = this.activeCategory();
    const all = this.content().photos;
    return category === 'all' ? all : all.filter(item => item.category === category);
  });

  readonly categoryCounts = computed<Record<CulturaCategoryId, number>>(() => {
    const all = this.content().photos;
    return {
      all: all.length,
      mito: all.filter(item => item.category === 'mito').length,
      rio: all.filter(item => item.category === 'rio').length,
      patrimonio: all.filter(item => item.category === 'patrimonio').length
    };
  });

  readonly selectedIndex = computed(() => {
    const id = this.selectedPhotoId();
    if (!id) {
      return -1;
    }
    return this.filteredPhotos().findIndex(item => item.id === id);
  });

  readonly selectedPhoto = computed<CulturaPhotoItem | null>(() => {
    const idx = this.selectedIndex();
    const list = this.filteredPhotos();
    return idx >= 0 && idx < list.length ? list[idx] : null;
  });

  setCategory(category: CulturaCategoryId): void {
    this.activeCategory.set(category);
  }

  openLightbox(photoId: string): void {
    this.selectedPhotoId.set(photoId);
  }

  closeLightbox(): void {
    this.selectedPhotoId.set(null);
  }

  prevPhoto(): void {
    const list = this.filteredPhotos();
    const idx = this.selectedIndex();
    if (list.length === 0 || idx === -1) {
      return;
    }
    const prevIdx = (idx - 1 + list.length) % list.length;
    this.selectedPhotoId.set(list[prevIdx].id);
  }

  nextPhoto(): void {
    const list = this.filteredPhotos();
    const idx = this.selectedIndex();
    if (list.length === 0 || idx === -1) {
      return;
    }
    const nextIdx = (idx + 1) % list.length;
    this.selectedPhotoId.set(list[nextIdx].id);
  }

  @HostListener('window:keydown', ['$event'])
  onWindowKeydown(event: KeyboardEvent): void {
    if (!this.selectedPhotoId()) {
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeLightbox();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prevPhoto();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.nextPhoto();
    }
  }
}
