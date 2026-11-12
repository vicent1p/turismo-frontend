import { Component, computed, inject, signal } from '@angular/core';
import { EditorialShellComponent } from '../../components/editorial-shell/editorial-shell';
import { AppLang, LanguageService } from '../../services/language.service';

export type ProgramacionFilterId = 'all' | 'previa' | 'tradicion' | 'festivales';
export type EventIconType = 'book' | 'calendar' | 'pray' | 'music' | 'horse' | 'moon' | 'caiman';

export interface AgendaSubEvent {
  dateLabel: string;
  title: string;
  subtitle?: string;
  icon: EventIconType;
}

export interface AgendaBlock {
  id: string;
  phase: Exclude<ProgramacionFilterId, 'all'>;
  ribbonDate: string;
  layoutSpan: 'compact' | 'wide' | 'third';
  variant: 'parchment' | 'noche-blanca' | 'desfile';
  eyebrow?: string;
  headline?: string;
  quote?: string;
  events?: ReadonlyArray<AgendaSubEvent>;
  bullets?: ReadonlyArray<string>;
  featuredArtist?: {
    roleLabel: string;
    name: string;
  };
}

export interface FestivalDayCard {
  id: string;
  ribbonDate: string;
  gastronomiaLabel: string;
  specialShow?: {
    kicker: string;
    title: string;
  };
  festivalHeading: string;
  festivalSubheading: string;
  winners: ReadonlyArray<string>;
  artistsLabel: string;
  artists: ReadonlyArray<{
    name: string;
    tag?: string;
    isHeadliner?: boolean;
  }>;
}

interface FilterTab {
  id: ProgramacionFilterId;
  label: string;
  count: number;
}

interface ProgramacionLocaleContent {
  breadcrumbHome: string;
  breadcrumbCurrent: string;
  metaPill: string;
  eyebrow: string;
  pageTitle: string;
  subtitle: string;
  institutionalBannerLabel: string;
  institutionalPartners: string;
  metrics: ReadonlyArray<{ label: string; value: string }>;
  filterAriaLabel: string;
  filters: ReadonlyArray<FilterTab>;
  sectionPreludioEyebrow: string;
  sectionPreludioTitle: string;
  sectionTradicionEyebrow: string;
  sectionTradicionTitle: string;
  sectionFestivalesEyebrow: string;
  sectionFestivalesTitle: string;
  agendaBlocks: ReadonlyArray<AgendaBlock>;
  festivalDays: ReadonlyArray<FestivalDayCard>;
  closingTag: string;
  closingTitle: string;
  closingDesc: string;
  ctaHotels: string;
  ctaCulture: string;
  ctaBackHome: string;
}

const PROGRAMACION_CONTENT: Record<AppLang, ProgramacionLocaleContent> = {
  es: {
    breadcrumbHome: 'Inicio',
    breadcrumbCurrent: 'Programación',
    metaPill: 'Agenda Oficial · Octubre – Diciembre',
    eyebrow: 'CELEBRACIÓN CONMEMORATIVA · PLATO 400 AÑOS',
    pageTitle: 'Programación',
    subtitle:
      'Calendario oficial de los 400 años de Plato: literatura, fe, tradición del Hombre Caimán, gastronomía y grandes conciertos en el Magdalena.',
    institutionalBannerLabel: 'Respaldo Institucional Oficial',
    institutionalPartners: 'Alcaldía de Plato · Plato 400 Años · Gobernación del Magdalena',
    metrics: [
      { label: 'Temporada festiva', value: 'Octubre – Diciembre' },
      { label: 'Agenda oficial', value: '7 Grandes Jornadas' },
      { label: 'Cartel musical y folclor', value: '11 Festivales y Estelares' }
    ],
    filterAriaLabel: 'Filtrar programación conmemorativa por etapa',
    filters: [
      { id: 'all', label: 'Toda la agenda', count: 7 },
      { id: 'previa', label: 'Octubre – 8 Dic · Apertura y Fe', count: 2 },
      { id: 'tradicion', label: '5 – 11 Dic · Cabalgata y Desfile', count: 3 },
      { id: 'festivales', label: '12 – 13 Dic · Grandes Festivales', count: 2 }
    ],
    sectionPreludioEyebrow: 'APERTURA Y DEVOCIÓN PLATEÑA',
    sectionPreludioTitle: 'Lanzamiento editorial, novena y cumpleaños de Plato',
    sectionTradicionEyebrow: 'IDENTIDAD, TRADICIÓN Y FOLCLOR',
    sectionTradicionTitle: 'Cabalgata, Noche Blanca y Desfile del Hombre Caimán',
    sectionFestivalesEyebrow: 'GRAN FIN DE SEMANA CUATRICENTENARIO',
    sectionFestivalesTitle: 'Festival Gastronómico, Festival de Festivales y Conciertos',
    agendaBlocks: [
      {
        id: 'octubre',
        phase: 'previa',
        ribbonDate: 'OCTUBRE',
        layoutSpan: 'compact',
        variant: 'parchment',
        eyebrow: 'Apertura Literaria y Memoria',
        events: [
          {
            dateLabel: 'Edición Especial',
            title: 'Lanzamiento revista 400 años',
            subtitle: 'Publicación conmemorativa de cuatro siglos de historia plateña.',
            icon: 'book'
          }
        ]
      },
      {
        id: 'noviembre-diciembre',
        phase: 'previa',
        ribbonDate: 'NOVIEMBRE - DICIEMBRE',
        layoutSpan: 'wide',
        variant: 'parchment',
        eyebrow: 'Fe, Tradición y Cumpleaños Municipal',
        events: [
          {
            dateLabel: '29 de noviembre al 7 de diciembre',
            title: 'Novena en honor a la Virgen Inmaculada Concepción.',
            icon: 'calendar'
          },
          {
            dateLabel: '8 de diciembre',
            title: 'Misa solemne',
            icon: 'pray'
          },
          {
            dateLabel: '8 de diciembre',
            title: 'Celebración cumpleaños Plato',
            subtitle: '(Cantemos a Plato)',
            icon: 'music'
          }
        ]
      },
      {
        id: '5-diciembre',
        phase: 'tradicion',
        ribbonDate: '5 DE DICIEMBRE',
        layoutSpan: 'third',
        variant: 'parchment',
        eyebrow: 'Encuentro Ecuestre',
        events: [
          {
            dateLabel: '5 de diciembre',
            title: 'Gran Cabalgata 400 Años',
            subtitle: 'Recorrido tradicional por las calles de Plato.',
            icon: 'horse'
          }
        ]
      },
      {
        id: '10-diciembre',
        phase: 'tradicion',
        ribbonDate: '10 DE DICIEMBRE',
        layoutSpan: 'third',
        variant: 'noche-blanca',
        eyebrow: 'Gala Conmemorativa',
        headline: 'Noche Blanca Plato 400 años',
        quote: '“Legado y honor plateño”',
        events: [
          {
            dateLabel: '10 de diciembre',
            title: 'Encuentro cívico y cultural vestido de blanco',
            icon: 'moon'
          }
        ]
      },
      {
        id: '11-diciembre',
        phase: 'tradicion',
        ribbonDate: '11 DE DICIEMBRE',
        layoutSpan: 'third',
        variant: 'desfile',
        eyebrow: 'Folclor del Río Grande',
        headline: 'Segundo Desfile de Tradición Hombre Caimán',
        bullets: [
          'Taller intercambio del saber cultural',
          'Noche de artistas locales',
          'Artistas invitados'
        ],
        featuredArtist: {
          roleLabel: 'Artista invitado',
          name: 'Luister La Voz'
        }
      }
    ],
    festivalDays: [
      {
        id: '12-diciembre',
        ribbonDate: '12 DE DICIEMBRE',
        gastronomiaLabel: 'Festival Gastronómico',
        specialShow: {
          kicker: 'Puesta en escena especial',
          title: 'Show 400 Años de nuestra Historia e Identidad'
        },
        festivalHeading: 'Festival de Festivales',
        festivalSubheading: '5 Ganadores de Festivales del Magdalena',
        winners: [
          'Festival de la Cumbia',
          'Festival de la Décima',
          'Festival Son de Pajarito',
          'Festival de la Guacherna Samaria',
          'Festival Guillermo Buitrago'
        ],
        artistsLabel: 'Presentaciones musicales',
        artists: [
          { name: 'Juglares Vallenatos', tag: 'Tradición Vallenata' },
          { name: 'Diego Daza', isHeadliner: true },
          { name: 'Wilfrido Vargas', isHeadliner: true }
        ]
      },
      {
        id: '13-diciembre',
        ribbonDate: '13 DE DICIEMBRE',
        gastronomiaLabel: 'Festival Gastronómico',
        festivalHeading: 'Festival de Festivales',
        festivalSubheading: '6 Ganadores de Festivales del Magdalena',
        winners: [
          'Festival de la Trova',
          'Festival de la Piquería',
          'Festival de Contrapunteo',
          'Festival de la Décima',
          'Festival de la Leyenda Vallenata',
          'Festival Rey del Arpa'
        ],
        artistsLabel: 'Gran cierre estelar',
        artists: [
          { name: 'Carlos Vives', tag: 'Invitado Estelar', isHeadliner: true },
          { name: 'Peter Manjarrés', tag: 'Invitado Estelar', isHeadliner: true }
        ]
      }
    ],
    closingTag: 'VIVE LA FIESTA EN PLATO',
    closingTitle: 'Reserva tu estadía para los 400 años',
    closingDesc:
      'Explora hoteles, cabañas y restaurantes disponibles en el municipio y no te pierdas ninguno de los días de programación.',
    ctaHotels: 'Ver hoteles y hospedajes',
    ctaCulture: 'Explorar Cultura',
    ctaBackHome: 'Volver al inicio'
  },
  en: {
    breadcrumbHome: 'Home',
    breadcrumbCurrent: 'Schedule',
    metaPill: 'Official Schedule · October – December',
    eyebrow: 'COMMEMORATIVE CELEBRATION · PLATO 400 YEARS',
    pageTitle: 'Schedule',
    subtitle:
      'Official 400th anniversary calendar of Plato: heritage, devotion, Alligator Man parade, regional gastronomy, and flagship concerts in Magdalena.',
    institutionalBannerLabel: 'Official Institutional Backing',
    institutionalPartners: 'Municipality of Plato · Plato 400 Years · Government of Magdalena',
    metrics: [
      { label: 'Festival Season', value: 'October – December' },
      { label: 'Official Calendar', value: '7 Featured Dates' },
      { label: 'Lineup & Folklore', value: '11 Festivals & Headliners' }
    ],
    filterAriaLabel: 'Filter commemorative schedule by stage',
    filters: [
      { id: 'all', label: 'Full Schedule', count: 7 },
      { id: 'previa', label: 'Oct – Dec 8 · Launch & Devotion', count: 2 },
      { id: 'tradicion', label: 'Dec 5 – 11 · Parade & Gala', count: 3 },
      { id: 'festivales', label: 'Dec 12 – 13 · Grand Festivals', count: 2 }
    ],
    sectionPreludioEyebrow: 'OPENING & FAITH TRADITIONS',
    sectionPreludioTitle: 'Magazine launch, Novena and Plato’s Anniversary',
    sectionTradicionEyebrow: 'HERITAGE, IDENTITY & PARADES',
    sectionTradicionTitle: 'Grand Cabalgata, White Night & Alligator Man Parade',
    sectionFestivalesEyebrow: 'QUATERCENTENARY FINALE WEEKEND',
    sectionFestivalesTitle: 'Gastronomic Fair, Festival of Festivals & Concerts',
    agendaBlocks: [
      {
        id: 'octubre',
        phase: 'previa',
        ribbonDate: 'OCTOBER',
        layoutSpan: 'compact',
        variant: 'parchment',
        eyebrow: 'Editorial Opening',
        events: [
          {
            dateLabel: 'Special Issue',
            title: '400 Years Commemorative Magazine Launch',
            subtitle: 'Editorial tribute celebrating four centuries of local heritage.',
            icon: 'book'
          }
        ]
      },
      {
        id: 'noviembre-diciembre',
        phase: 'previa',
        ribbonDate: 'NOVEMBER - DECEMBER',
        layoutSpan: 'wide',
        variant: 'parchment',
        eyebrow: 'Devotion & Municipal Birthday',
        events: [
          {
            dateLabel: 'November 29 to December 7',
            title: 'Novena in honor of the Immaculate Conception.',
            icon: 'calendar'
          },
          {
            dateLabel: 'December 8',
            title: 'Solemn Mass',
            icon: 'pray'
          },
          {
            dateLabel: 'December 8',
            title: 'Plato Birthday Celebration',
            subtitle: '(Let Us Sing to Plato)',
            icon: 'music'
          }
        ]
      },
      {
        id: '5-diciembre',
        phase: 'tradicion',
        ribbonDate: 'DECEMBER 5',
        layoutSpan: 'third',
        variant: 'parchment',
        eyebrow: 'Equestrian Parade',
        events: [
          {
            dateLabel: 'December 5',
            title: 'Grand 400 Years Cabalgata',
            subtitle: 'Traditional horseback gathering across Plato.',
            icon: 'horse'
          }
        ]
      },
      {
        id: '10-diciembre',
        phase: 'tradicion',
        ribbonDate: 'DECEMBER 10',
        layoutSpan: 'third',
        variant: 'noche-blanca',
        eyebrow: 'Civic Gala',
        headline: 'White Night · Plato 400 Years',
        quote: '“Legacy and pride of Plato”',
        events: [
          {
            dateLabel: 'December 10',
            title: 'Evening cultural gathering dressed in white',
            icon: 'moon'
          }
        ]
      },
      {
        id: '11-diciembre',
        phase: 'tradicion',
        ribbonDate: 'DECEMBER 11',
        layoutSpan: 'third',
        variant: 'desfile',
        eyebrow: 'River Folklore',
        headline: 'Second Alligator Man Heritage Parade',
        bullets: [
          'Cultural knowledge exchange workshop',
          'Local artists showcase night',
          'Guest performers'
        ],
        featuredArtist: {
          roleLabel: 'Guest Artist',
          name: 'Luister La Voz'
        }
      }
    ],
    festivalDays: [
      {
        id: '12-diciembre',
        ribbonDate: 'DECEMBER 12',
        gastronomiaLabel: 'Gastronomic Festival',
        specialShow: {
          kicker: 'Featured Stage Production',
          title: 'Show: 400 Years of Our History & Identity'
        },
        festivalHeading: 'Festival of Festivals',
        festivalSubheading: '5 Magdalena Festival Champions',
        winners: [
          'Festival de la Cumbia',
          'Festival de la Décima',
          'Festival Son de Pajarito',
          'Festival de la Guacherna Samaria',
          'Festival Guillermo Buitrago'
        ],
        artistsLabel: 'Live Music Lineup',
        artists: [
          { name: 'Juglares Vallenatos', tag: 'Traditional Vallenato' },
          { name: 'Diego Daza', isHeadliner: true },
          { name: 'Wilfrido Vargas', isHeadliner: true }
        ]
      },
      {
        id: '13-diciembre',
        ribbonDate: 'DECEMBER 13',
        gastronomiaLabel: 'Gastronomic Festival',
        festivalHeading: 'Festival of Festivals',
        festivalSubheading: '6 Magdalena Festival Champions',
        winners: [
          'Festival de la Trova',
          'Festival de la Piquería',
          'Festival de Contrapunteo',
          'Festival de la Décima',
          'Festival de la Leyenda Vallenata',
          'Festival Rey del Arpa'
        ],
        artistsLabel: 'Grand Finale Headliners',
        artists: [
          { name: 'Carlos Vives', tag: 'Main Headliner', isHeadliner: true },
          { name: 'Peter Manjarrés', tag: 'Main Headliner', isHeadliner: true }
        ]
      }
    ],
    closingTag: 'JOIN THE CELEBRATION IN PLATO',
    closingTitle: 'Book your stay for the 400th anniversary',
    closingDesc:
      'Browse available hotels, cabins, and restaurants in town so you do not miss any day of the official schedule.',
    ctaHotels: 'Browse hotels & stays',
    ctaCulture: 'Explore Culture',
    ctaBackHome: 'Back to Home'
  }
};

@Component({
  selector: 'app-programacion',
  standalone: true,
  imports: [EditorialShellComponent],
  templateUrl: './programacion.html',
  styleUrl: './programacion.css'
})
export class ProgramacionComponent {
  readonly languageService = inject(LanguageService);
  readonly lang = this.languageService.lang;
  readonly content = computed(() => PROGRAMACION_CONTENT[this.lang()]);
  readonly activeFilter = signal<ProgramacionFilterId>('all');

  readonly previaBlocks = computed(() => {
    const filter = this.activeFilter();
    if (filter !== 'all' && filter !== 'previa') {
      return [];
    }
    return this.content().agendaBlocks.filter(block => block.phase === 'previa');
  });

  readonly tradicionBlocks = computed(() => {
    const filter = this.activeFilter();
    if (filter !== 'all' && filter !== 'tradicion') {
      return [];
    }
    return this.content().agendaBlocks.filter(block => block.phase === 'tradicion');
  });

  readonly showFestivales = computed(() => {
    const filter = this.activeFilter();
    return filter === 'all' || filter === 'festivales';
  });

  setFilter(filter: ProgramacionFilterId): void {
    this.activeFilter.set(filter);
  }
}

