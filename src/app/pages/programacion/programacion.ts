import { Component, computed, inject, signal } from '@angular/core';
import { EditorialShellComponent } from '../../components/editorial-shell/editorial-shell';
import { AppLang, LanguageService } from '../../services/language.service';

export type ProgramacionFilterId =
  | 'all'
  | '29nov-7dic'
  | '5dic'
  | '8dic'
  | '10dic'
  | '11dic'
  | '12dic'
  | '13dic';

export interface FilterPill {
  id: ProgramacionFilterId;
  label: string;
  count: number | null;
}

export interface MetricPill {
  label: string;
  value: string;
  icon: 'calendar' | 'agenda' | 'music';
}

export interface ArtistItem {
  name: string;
  photo: string;
  tag?: string;
}

export interface ProgramacionLocaleContent {
  breadcrumbHome: string;
  breadcrumbCurrent: string;
  metaPill: string;
  eyebrow: string;
  pageTitle: string;
  subtitle: string;
  metrics: ReadonlyArray<MetricPill>;
  filters: ReadonlyArray<FilterPill>;
  sectionAperturaTitle: string;
  novenaDate: string;
  novenaTitle: string;
  novenaDesc: string;
  misaDate: string;
  misaItem1: string;
  misaItem2: string;
  misaNote: string;
  sectionTradicionTitle: string;
  cabalgataDate: string;
  cabalgataTitle: string;
  cabalgataDesc: string;
  nocheBlancaDate: string;
  nocheBlancaTitle: string;
  nocheBlancaQuote: string;
  nocheBlancaLocation: string;
  nocheBlancaArtistRole: string;
  desfileDate: string;
  desfileTitle: string;
  desfileDesc: string;
  desfileBullets: ReadonlyArray<string>;
  desfileArtistRole: string;
  desfileArtistName: string;
  desfileArtistPhoto: string;
  sectionFestivalesTitle: string;
  day12Date: string;
  day12GastroTitle: string;
  day12GastroDesc: string;
  day12FestTitle: string;
  day12FestWinnersKicker: string;
  day12Winners: ReadonlyArray<string>;
  day12MusicLabel: string;
  day12Artists: ReadonlyArray<ArtistItem>;
  day13Date: string;
  day13FestTitle: string;
  day13FestWinnersKicker: string;
  day13Winners: ReadonlyArray<string>;
  day13MusicLabel: string;
  day13Artists: ReadonlyArray<ArtistItem>;
  closingTag: string;
  closingTitle: string;
  closingDesc: string;
  ctaHotels: string;
  ctaCulture: string;
  ctaBackHome: string;
  magazineSrOnly: string;
  metricsAria: string;
  filtersAria: string;
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
    metrics: [
      { label: 'Temporada festiva', value: 'Octubre – Diciembre', icon: 'calendar' },
      { label: 'Agenda oficial', value: '7 Grandes Jornadas', icon: 'agenda' },
      { label: 'Cartel musical y folclor', value: '11 Festivales y Estelares', icon: 'music' }
    ],
    filters: [
      { id: 'all', label: 'Todos', count: null },
      { id: '29nov-7dic', label: '29 Nov - 7 Dic', count: 3 },
      { id: '5dic', label: '5 Dic', count: 1 },
      { id: '8dic', label: '8 Dic', count: 2 },
      { id: '10dic', label: '10 Dic', count: 1 },
      { id: '11dic', label: '11 Dic', count: 3 },
      { id: '12dic', label: '12 Dic', count: 5 },
      { id: '13dic', label: '13 Dic', count: 6 }
    ],
    sectionAperturaTitle: 'Apertura y Memoria',
    novenaDate: '29 Nov. - 7 Dic',
    novenaTitle: 'Novena en honor a\nLa Virgen Inmaculada\nConcepción',
    novenaDesc: 'Recorrido tradicional por las calles de Plato',
    misaDate: '8 Dic.',
    misaItem1: 'Misa Solemne',
    misaItem2: 'Celebración de\nCumpleaños de Plato',
    misaNote: '(Cantemos a Plato)',
    sectionTradicionTitle: 'Tradición y cultura',
    cabalgataDate: '5 Dic.',
    cabalgataTitle: 'Gran Cabalgata 400 Años',
    cabalgataDesc: 'Recorrido tradicional por las calles de Plato, salida desde la Espinoza',
    nocheBlancaDate: '10 Dic.',
    nocheBlancaTitle: 'Noche Blanca Plato 400 Años',
    nocheBlancaQuote: '“Legado y honor Plateño”',
    nocheBlancaLocation: 'Parque Simón Bolívar (Frente a la iglesia Inmaculada Concepción)',
    nocheBlancaArtistRole: 'Artista invitado',
    desfileDate: '11 Dic.',
    desfileTitle: 'Segundo desfile de tradición\ndel hombre caimán',
    desfileDesc: 'Recorrido tradicional por\nlas calles de Plato',
    desfileBullets: [
      'Taller de intercambio del saber cultural.',
      'Noche de artistas locales.',
      'Presentaciones de artistas invitados.'
    ],
    desfileArtistRole: 'Artista invitado',
    desfileArtistName: 'Luister\n“La Voz”',
    desfileArtistPhoto: 'artistas/luister-la-voz.webp',
    sectionFestivalesTitle: 'Festivales y conciertos',
    day12Date: '12 Dic.',
    day12GastroTitle: 'Festival Gastronómico',
    day12GastroDesc: 'Show 400 Años de nuestra Historia e Identidad',
    day12FestTitle: 'Festival de Festivales',
    day12FestWinnersKicker: '5 ganadores de festivales del Magdalena:',
    day12Winners: [
      'Festival de la Cumbia.',
      'Festival de la Décima.',
      'Festival Son de Pajarito.',
      'Festival de la Guacherna Samaria.',
      'Festival Guillermo Buitrago.'
    ],
    day12MusicLabel: 'Presentaciones Musicales',
    day12Artists: [
      { name: 'Wilfrido Vargas', photo: 'artistas/wilfrido-vargas.webp' },
      { name: 'Diego Daza', photo: 'artistas/diego-daza.webp' },
      { name: 'Juglares Vallenatos', photo: '' }
    ],
    day13Date: '13 Dic.',
    day13FestTitle: 'Festival de Festivales',
    day13FestWinnersKicker: '6 ganadores de festivales del Magdalena:',
    day13Winners: [
      'Festival de la Trova.',
      'Festival de la Piqueria.',
      'Festival de Contrapunteo.',
      'Festival de la Décima.',
      'Festival de la Leyenda Vallenata.',
      'Festival Rey del Arpa.'
    ],
    day13MusicLabel: 'Presentaciones Musicales',
    day13Artists: [
      { name: 'Carlos Vives', photo: 'artistas/carlos-vives.webp' },
      { name: 'Peter Manjarrés', photo: 'artistas/peter-manjarres.webp' }
    ],
    closingTag: 'VIVE LA FIESTA EN PLATO',
    closingTitle: 'Reserva tu estadía para los 400 años',
    closingDesc:
      'Explora hoteles, cabañas y restaurantes disponibles en el municipio y no te pierdas ninguno de los días de programación.',
    ctaHotels: 'Ver hoteles y hospedajes',
    ctaCulture: 'Nuestra historia y cultura',
    ctaBackHome: 'Volver al inicio',
    magazineSrOnly: 'Lanzamiento revista 400 años: Publicación conmemorativa oficial de cuatro siglos',
    metricsAria: 'Métricas oficiales de la celebración',
    filtersAria: 'Filtrar programación por fecha'
  },
  en: {
    breadcrumbHome: 'Home',
    breadcrumbCurrent: 'Schedule',
    metaPill: 'Official Calendar · October – December',
    eyebrow: 'COMMEMORATIVE CELEBRATION · PLATO 400 YEARS',
    pageTitle: 'Schedule',
    subtitle:
      'Official calendar of Plato’s 400th anniversary: literature, faith, Alligator Man tradition, gastronomy, and live concerts on the Magdalena.',
    metrics: [
      { label: 'Festive season', value: 'October – December', icon: 'calendar' },
      { label: 'Official events', value: '7 Major Days', icon: 'agenda' },
      { label: 'Music & folklore line-up', value: '11 Festivals & Headliners', icon: 'music' }
    ],
    filters: [
      { id: 'all', label: 'All', count: null },
      { id: '29nov-7dic', label: 'Nov 29 - Dec 7', count: 3 },
      { id: '5dic', label: 'Dec 5', count: 1 },
      { id: '8dic', label: 'Dec 8', count: 2 },
      { id: '10dic', label: 'Dec 10', count: 1 },
      { id: '11dic', label: 'Dec 11', count: 3 },
      { id: '12dic', label: 'Dec 12', count: 5 },
      { id: '13dic', label: 'Dec 13', count: 6 }
    ],
    sectionAperturaTitle: 'Opening and Memory',
    novenaDate: 'Nov 29 - Dec 7',
    novenaTitle: 'Novena in honor of Our Lady of the Immaculate Conception',
    novenaDesc: 'Traditional procession through the streets of Plato',
    misaDate: 'Dec 8',
    misaItem1: 'Solemn Mass',
    misaItem2: 'Plato Birthday Celebration',
    misaNote: '(Singing to Plato)',
    sectionTradicionTitle: 'Tradition and Culture',
    cabalgataDate: 'Dec 5',
    cabalgataTitle: '400 Years Grand Horse Parade',
    cabalgataDesc: 'Traditional route through the streets of Plato',
    nocheBlancaDate: 'Dec 10',
    nocheBlancaTitle: 'Plato 400 Years White Night',
    nocheBlancaQuote: '“Plateño Legacy and Honor”',
    nocheBlancaLocation: 'Simón Bolívar Park (In front of the Immaculate Conception Church)',
    nocheBlancaArtistRole: 'Guest artist',
    desfileDate: 'Dec 11',
    desfileTitle: '2nd Alligator Man Tradition Parade',
    desfileDesc: 'Traditional parade through the streets of Plato',
    desfileBullets: [
      'Cultural knowledge exchange workshop.',
      'Night of local artists.',
      'Performances by guest artists.'
    ],
    desfileArtistRole: 'Guest artist',
    desfileArtistName: 'Luister “La Voz”',
    desfileArtistPhoto: 'artistas/luister-la-voz.webp',
    sectionFestivalesTitle: 'Festivals and Concerts',
    day12Date: 'Dec 12',
    day12GastroTitle: 'Gastronomy Festival',
    day12GastroDesc: '400 Years of Our History and Identity Live Show',
    day12FestTitle: 'Festival of Festivals',
    day12FestWinnersKicker: '5 Winners from Magdalena Regional Festivals:',
    day12Winners: [
      'Cumbia Festival.',
      'Décima Poetry Festival.',
      'Son de Pajarito Festival.',
      'Guacherna Samaria Festival.',
      'Guillermo Buitrago Festival.'
    ],
    day12MusicLabel: 'Musical Performances',
    day12Artists: [
      { name: 'Wilfrido Vargas', photo: 'artistas/wilfrido-vargas.webp' },
      { name: 'Diego Daza', photo: 'artistas/diego-daza.webp' },
      { name: 'Juglares Vallenatos', photo: '' }
    ],
    day13Date: 'Dec 13',
    day13FestTitle: 'Festival of Festivals',
    day13FestWinnersKicker: '6 Winners from Magdalena Regional Festivals:',
    day13Winners: [
      'Trova Festival.',
      'Piquería Verse Festival.',
      'Contrapunteo Festival.',
      'Décima Poetry Festival.',
      'Vallenato Legend Festival.',
      'King of the Harp Festival.'
    ],
    day13MusicLabel: 'Musical Performances',
    day13Artists: [
      { name: 'Carlos Vives', photo: 'artistas/carlos-vives.webp' },
      { name: 'Peter Manjarrés', photo: 'artistas/peter-manjarres.webp' }
    ],
    closingTag: 'EXPERIENCE THE CELEBRATION IN PLATO',
    closingTitle: 'Book your stay for the 400th anniversary',
    closingDesc:
      'Explore hotels, country lodges, and typical restaurants available in the municipality so you do not miss any event on the schedule.',
    ctaHotels: 'See hotels and accommodations',
    ctaCulture: 'Our history and culture',
    ctaBackHome: 'Back to home',
    magazineSrOnly: '400 Years Magazine Launch: Official commemorative four-century publication',
    metricsAria: 'Official celebration key metrics',
    filtersAria: 'Filter schedule by date'
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

  // Filter conditions for each event/block
  readonly showNovena = computed(() => {
    const f = this.activeFilter();
    return f === 'all' || f === '29nov-7dic';
  });

  readonly showMisa = computed(() => {
    const f = this.activeFilter();
    return f === 'all' || f === '8dic';
  });

  readonly showCabalgata = computed(() => {
    const f = this.activeFilter();
    return f === 'all' || f === '5dic';
  });

  readonly showNocheBlanca = computed(() => {
    const f = this.activeFilter();
    return f === 'all' || f === '10dic';
  });

  readonly showDesfile = computed(() => {
    const f = this.activeFilter();
    return f === 'all' || f === '11dic';
  });

  readonly showDay12 = computed(() => {
    const f = this.activeFilter();
    return f === 'all' || f === '12dic';
  });

  readonly showDay13 = computed(() => {
    const f = this.activeFilter();
    return f === 'all' || f === '13dic';
  });

  readonly showAperturaSection = computed(() => this.showNovena() || this.showMisa());
  readonly showTradicionSection = computed(
    () => this.showCabalgata() || this.showNocheBlanca() || this.showDesfile()
  );
  readonly showFestivalesSection = computed(() => this.showDay12() || this.showDay13());

  setFilter(filter: ProgramacionFilterId): void {
    this.activeFilter.set(filter);
  }
}
