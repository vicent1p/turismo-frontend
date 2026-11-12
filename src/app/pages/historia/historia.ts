import { AfterViewInit, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { EditorialShellComponent } from '../../components/editorial-shell/editorial-shell';
import { LanguageService } from '../../services/language.service';

export interface HistoriaChapter {
  id: string;
  roman: string;
  shortLabel: string;
  era: string;
  title: string;
  body: string;
  dropcap?: boolean;
}

interface HistoriaLocaleContent {
  breadcrumbHome: string;
  breadcrumbCurrent: string;
  readTimeLabel: string;
  eyebrow: string;
  pageTitle: string;
  subtitle: string;
  facts: ReadonlyArray<{ label: string; value: string }>;
  tocLabel: string;
  readMoreLabel: string;
  readLessLabel: string;
  chapters: ReadonlyArray<HistoriaChapter>;
  closingTag: string;
  closingTitle: string;
  closingDesc: string;
  ctaCulture: string;
  ctaHotels: string;
  ctaBackHome: string;
}

const HISTORIA_CONTENT: Record<'es' | 'en', HistoriaLocaleContent> = {
  es: {
    breadcrumbHome: 'Inicio',
    breadcrumbCurrent: 'Historia',
    readTimeLabel: 'Lectura · 4 min · Crónica de 400 años',
    eyebrow: 'CRÓNICA Y MEMORIA · PLATO 400 AÑOS',
    pageTitle: 'Historia',
    subtitle: 'Del País Chimila y el cacique Plato Viejo a la tierra de río, música y leyenda',
    facts: [
      { label: 'Año de fundación', value: '1626 · Villa Concepción' },
      { label: 'Territorio', value: 'Río Magdalena y Ciénagas' },
      { label: 'Patrimonio vivo', value: 'Cumbia y Hombre Caimán' }
    ],
    tocLabel: 'Capítulos del relato',
    readMoreLabel: 'Leer más',
    readLessLabel: 'Leer menos',
    chapters: [
      {
        id: 'cap-chimilas',
        roman: 'I',
        shortLabel: 'Los Chimilas',
        era: 'Orígenes Ancestrales',
        title: 'El País Chimila y su maestría alfarera',
        dropcap: true,
        body: 'En el País Chimila que comienza en el Río Ariguaní, abarcando las zonas del Valle de Ariguaní, la Depresión Momposina y parte de los Montes de María, fue habitada por una de las razas aborígenes más pacíficas que hubo en Colombia: Los Chimilas. Estos eran buenos agricultores, cazadores, pescadores y artesanos, apasionados por la escultura de figuras humanoides con rasgos monstruosos, elaboraban collares, jarrones y tinacos en arcilla, con la técnica y maestría de verdaderos artistas de la alfarería.'
      },
      {
        id: 'cap-zarate',
        roman: 'II',
        shortLabel: 'Zárate y Plato Viejo',
        era: 'Primer Asentamiento',
        title: 'El pueblo de Zárate y el cacique “Plato Viejo”',
        body: 'Fue el pueblo de Zárate, el más antiguo asentamiento humano de esta parte del país Chimila, un bello paraje rodeado de un rico conjunto cenagoso con gran variedad de especies piscícolas, que irrigan a más de setenta mil hectáreas de fértiles tierras de playón. De allí llegaron los primeros pobladores ubicándose sobre el Caño de Las Mujeres, en la orilla contraria de donde hoy se levanta el pueblo de Plato. A ese primer asentamiento le dieron el nombre del cacique indígena que lo fundó, a quien le llamaban “Plato Viejo” y era uno de los tantos hijos del Indio Zárate, fundador y jefe supremo de las tribus que habitaban esta región.'
      },
      {
        id: 'cap-fundacion',
        roman: 'III',
        shortLabel: 'Fundación 1626',
        era: 'Siglo XVII · 1626',
        title: 'De Villa Concepción de la Plata a Plato Viejo',
        body: 'Quiso la casualidad, que quien fuera el primer fundador de Plato, en el lugar donde está hoy, el religioso español Fray Nicomedes de Fonseca y Meza en el año de 1626, le bautizara con el nombre de Villa Concepción de la Plata, en honor a la virgen cuya fiesta se celebra en ese día, y el mismo nombre que conservó en su refundación por el conquistador español, Fernando de Mier y Guerra. Lo de la casualidad es porque hoy, por economía se le ha llamado simplemente Plato, y pensando que ya sobrepasó los tres siglos de existencia, se le puede agregar “viejo”, como lo llamaron sus primeros habitantes, “Plato Viejo”.'
      },
      {
        id: 'cap-geografia',
        roman: 'IV',
        shortLabel: 'Río y Geografía',
        era: 'Encrucijada Caribe',
        title: 'Privilegiada posición junto al Río Magdalena',
        body: 'Plato posee una privilegiada posición geográfica: a orillas del Río Magdalena, en la cabecera derecha del puente “Antonio Escobar Camargo”, el más largo del país, que une a los departamentos de Magdalena y Bolívar. Porque por su territorio pasa la carretera "Transversal del Caribe o Vía de los Contenedores", porque además posee el segundo más importante complejo cenagoso del país y que por el espíritu pacifista y hospitalario de su gente, se ha convertido en el centro neurálgico del acontecer regional.'
      },
      {
        id: 'cap-personajes',
        roman: 'V',
        shortLabel: 'Hitos Históricos',
        era: 'Campaña Libertadora',
        title: 'Hitos y próceres en la memoria plateña',
        body: 'La historia dice que en Plato han vivido y nacido personajes que han marcado hitos, aquí pernoctó y dejó una familia el general español Francisco Vilches y Domínguez, quien fuera amanuense del Libertador Simón Bolívar durante la campaña libertadora, y su acompañante en los amores del Libertador con Elenita Lenua en Tenerife, que además ocupó los cargos de senador de la Gran Colombia y Gobernador de la Provincia de Santa Marta.'
      },
      {
        id: 'cap-maestros',
        roman: 'VI',
        shortLabel: 'Hijos Ilustres',
        era: 'Legado y Música',
        title: 'Cuna de juristas y maestros de la música',
        body: 'Plato es la cuna donde nacieron hombres como: Antonio Escobar Camargo, quien da nombre al majestuoso Puente sobre el Río Magdalena, destacado en la obra “Tres Grandes Hombres Caribes”, al lado de Rafael Núñez, por sus dotes de gran jurista y hombre de estado, que ocupó las más altas dignidades del País; Antonio María Peñaloza, uno de los más grandes músicos de Colombia, autor del himno del carnaval de Barranquilla, “Te Olvidé o la Danza Del Garabato”; Wilson Choperena, autor e intérprete del musical colombiano más difundido en el mundo “La Pollera Colorá”; Alvaro Lemus, músico, cantante y actor, conocido como el hombre “Caimán”, entre otros.'
      },
      {
        id: 'cap-oral',
        roman: 'VII',
        shortLabel: 'Tradición Oral',
        era: 'Siglo XX · Oralidad',
        title: 'Fábulas nocturnas de pescadores y oralidad popular',
        body: 'En las primeras décadas del siglo pasado, los nativos de Plato comenzaron a mostrar gran destreza para crear y narrar hechos fabulosos e historietas completas de seres con poderes sobre naturales, como la historia de la “Zorra Pelá” de El Difícil; La de “Chilolo” Torres, “El Hombre de los Secretos”; la historia del “Tigre de la Granada”, entre otras fábulas que se transmitían de una generación a otra de forma oral, aprovechando acontecimientos que motivaban largas reuniones nocturnas como los velorios, o las noches en que los pescadores hacían largas esperas en las islas y ciénagas que rodean al Río Magdalena, para lanzarse a la pesca en el momento oportuno.'
      },
      {
        id: 'cap-caiman',
        roman: 'VIII',
        shortLabel: 'El Hombre Caimán',
        era: 'Memoria Escrita',
        title: 'Virgilio Difilippo y la leyenda llevada a la imprenta',
        body: 'Transcurrido algún tiempo los intelectuales que vivían para la época en Plato, comenzaron a interesarse por llevar al escrito estas narraciones mitológicas, y uno de ellos, Don Virgilio Difilippo, quien había llegado desde su natal Mompox para ocupar el cargo de secretario del Juzgado Único de Plato, maravillado por la trama surrealista que encerraba la historia que contaban en el puerto sobre un pescador que se había convertido en “Caimán”; ante lo cual decidió escucharla con detenimiento y llevarla a la imprenta de su máquina de escribir.'
      }
    ],
    closingTag: 'CONTINÚA EL RECORRIDO',
    closingTitle: 'Vive hoy la historia y hospitalidad plateña',
    closingDesc: 'Explora nuestras tradiciones vivas, lugares emblemáticos y los hospedajes que reciben al viajero a orillas del Magdalena.',
    ctaCulture: 'Explorar Cultura y Pueblo',
    ctaHotels: 'Ver Hoteles en Plato',
    ctaBackHome: 'Volver al Inicio'
  },
  en: {
    breadcrumbHome: 'Home',
    breadcrumbCurrent: 'History',
    readTimeLabel: 'Reading · 4 min · 400-Year Chronicle',
    eyebrow: 'HISTORICAL CHRONICLE · PLATO 400 YEARS',
    pageTitle: 'History',
    subtitle: 'From the Chimila Country and Chief Plato Viejo to a land of river, music, and legend',
    facts: [
      { label: 'Founded', value: '1626 · Villa Concepción' },
      { label: 'Territory', value: 'Magdalena River & Wetlands' },
      { label: 'Living Heritage', value: 'Cumbia & Alligator Man' }
    ],
    tocLabel: 'Chronicle chapters',
    readMoreLabel: 'Read more',
    readLessLabel: 'Read less',
    chapters: [
      {
        id: 'cap-chimilas',
        roman: 'I',
        shortLabel: 'The Chimilas',
        era: 'Ancestral Origins',
        title: 'Chimila Country and its pottery mastery',
        dropcap: true,
        body: 'In the Chimila Country that begins at the Ariguaní River, spanning the Ariguaní Valley, the Momposina Depression, and part of the Montes de María, lived one of the most peaceful indigenous peoples in Colombia: the Chimilas. Skilled farmers, hunters, fishermen, and artisans passionate about sculpting humanoid figures with mythical features, they crafted necklaces, vessels, and large clay jars with the mastery of true pottery artists.'
      },
      {
        id: 'cap-zarate',
        roman: 'II',
        shortLabel: 'Zárate & Plato Viejo',
        era: 'First Settlement',
        title: 'The village of Zárate and Chief “Plato Viejo”',
        body: 'Zárate was the oldest human settlement in this part of Chimila territory—a scenic enclave surrounded by rich wetlands teeming with fish that irrigate over seventy thousand hectares of fertile floodplains. From there came the first settlers, establishing themselves along Caño de Las Mujeres on the opposite bank from where the town of Plato stands today. They named this first settlement after the indigenous chief who founded it, known as “Plato Viejo,” one of the sons of Chief Zárate, founder and supreme leader of the region’s tribes.'
      },
      {
        id: 'cap-fundacion',
        roman: 'III',
        shortLabel: 'Founded 1626',
        era: '17th Century · 1626',
        title: 'From Villa Concepción de la Plata to Plato Viejo',
        body: 'In 1626, Plato’s first founder on its current site, the Spanish friar Nicomedes de Fonseca y Meza, christened the settlement Villa Concepción de la Plata in honor of the Virgin whose feast day was celebrated on that date—a name preserved upon its refounding by Spanish conquistador Fernando de Mier y Guerra. By linguistic economy over time, people simply called it Plato, and having surpassed three centuries of existence, “Viejo” may fittingly be added, just as its first inhabitants named it: “Plato Viejo.”'
      },
      {
        id: 'cap-geografia',
        roman: 'IV',
        shortLabel: 'River & Geography',
        era: 'Caribbean Crossroads',
        title: 'Privileged location on the Magdalena River',
        body: 'Plato holds a privileged geographic position on the banks of the Magdalena River, right beside the Antonio Escobar Camargo Bridge—the longest bridge in Colombia, linking the departments of Magdalena and Bolívar. Crossed by the Transversal del Caribe (“Container Highway”) and home to the country’s second most important wetland complex, the peaceful and hospitable spirit of its people has made Plato a vital regional hub.'
      },
      {
        id: 'cap-personajes',
        roman: 'V',
        shortLabel: 'Historical Milestones',
        era: 'Liberation Campaign',
        title: 'Landmarks & statesmen of Independence',
        body: 'History tells of landmark figures who lived and were born in Plato. Spanish general Francisco Vilches y Domínguez—scribe to Liberator Simón Bolívar during the independence campaign, later senator of Gran Colombia and Governor of Santa Marta—stayed and left a family here.'
      },
      {
        id: 'cap-maestros',
        roman: 'VI',
        shortLabel: 'Illustrious Sons',
        era: 'Legacy & Music',
        title: 'Jurists & masters of Caribbean music',
        body: 'Plato is the birthplace of jurist and statesman Antonio Escobar Camargo (after whom the majestic Magdalena River bridge is named, honored alongside Rafael Núñez in “Three Great Caribbean Men”); Antonio María Peñaloza, one of Colombia’s greatest musicians and composer of the Barranquilla Carnival anthem “Te Olvidé o la Danza del Garabato”; Wilson Choperena, author and performer of Colombia’s most famous musical export “La Pollera Colorá”; and Álvaro Lemus, musician, singer, and actor known as “El Hombre Caimán,” among others.'
      },
      {
        id: 'cap-oral',
        roman: 'VII',
        shortLabel: 'Oral Tradition',
        era: 'Early 20th Century',
        title: 'Fishermen’s night tales and folk mythology',
        body: 'During the early decades of the last century, natives of Plato showed remarkable skill in creating and telling fabulous stories of beings with supernatural powers—such as the “Zorra Pelá” of El Difícil, “Chilolo” Torres (“The Man of Secrets”), and the “Tiger of La Granada”—fables passed orally from generation to generation during long night gatherings like wakes or fishermen’s long waits among the islands and wetlands of the Magdalena River.'
      },
      {
        id: 'cap-caiman',
        roman: 'VIII',
        shortLabel: 'The Alligator Man',
        era: 'Written Memory',
        title: 'Virgilio Difilippo brings the legend to print',
        body: 'In time, local intellectuals grew eager to preserve these mythological tales in writing. Among them was Don Virgilio Difilippo, who had arrived from his native Mompox to serve as secretary of Plato’s Single Court. Captivated by the surreal harbor tale of a fisherman transformed into an alligator (“Caimán”), he listened attentively and carried the legend into print on his typewriter.'
      }
    ],
    closingTag: 'CONTINUE EXPLORING',
    closingTitle: 'Experience Plato’s living history and hospitality today',
    closingDesc: 'Discover our living cultural traditions, landmarks, and the hotels welcoming travelers along the Magdalena River.',
    ctaCulture: 'Explore Culture & Town',
    ctaHotels: 'Browse Hotels in Plato',
    ctaBackHome: 'Back to Home'
  }
};

@Component({
  selector: 'app-historia',
  standalone: true,
  imports: [EditorialShellComponent],
  templateUrl: './historia.html',
  styleUrl: './historia.css'
})
export class HistoriaComponent implements AfterViewInit, OnDestroy {
  readonly languageService = inject(LanguageService);
  readonly lang = this.languageService.lang;
  readonly content = computed(() => HISTORIA_CONTENT[this.lang()]);
  readonly activeChapterId = signal<string>('cap-chimilas');
  readonly expandedChapters = signal<Set<string>>(new Set());

  private observer: IntersectionObserver | null = null;

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver(
        entries => {
          const visible = entries.find(entry => entry.isIntersecting);
          if (visible?.target?.id) {
            this.activeChapterId.set(visible.target.id);
          }
        },
        { rootMargin: '-22% 0px -60% 0px', threshold: 0.05 }
      );
      document.querySelectorAll('.historia-chapter').forEach(el => this.observer?.observe(el));
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  isExpanded(chapterId: string): boolean {
    return this.expandedChapters().has(chapterId);
  }

  toggleChapter(chapterId: string): void {
    this.expandedChapters.update(current => {
      const next = new Set(current);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  }

  scrollToChapter(chapterId: string, event: Event): void {
    event.preventDefault();
    this.activeChapterId.set(chapterId);
    this.expandedChapters.update(current => {
      if (current.has(chapterId)) {
        return current;
      }
      const next = new Set(current);
      next.add(chapterId);
      return next;
    });
    if (typeof document !== 'undefined') {
      document.getElementById(chapterId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

