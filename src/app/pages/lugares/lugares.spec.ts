import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { routes } from '../../app.routes';
import { HomeComponent } from '../home/home';
import { HotelesService } from '../../services/hoteles.service';
import { LanguageService } from '../../services/language.service';
import { LugaresComponent } from './lugares';

describe('Category filtering on Home and LugaresComponent (/lugares)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(HotelesService.prototype, 'sincronizarDesdeApi').mockResolvedValue(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('HomeComponent filters rendered cards when clicking Hoteles, Restaurantes, and Cabañas tabs', async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter(routes)]
    }).compileComponents();

    const fixture = TestBed.createComponent(HomeComponent);
    const hotelesService = TestBed.inject(HotelesService);
    TestBed.inject(LanguageService).setLang('es');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const tabs = Array.from(compiled.querySelectorAll<HTMLButtonElement>('.category-tabs .tab-pill'));
    expect(tabs.map(t => t.textContent?.trim())).toEqual(['Hoteles', 'Restaurantes', 'Cabañas']);

    // Default tab: Hoteles
    const hotelTitles = Array.from(compiled.querySelectorAll('.hotel-card .hotel-nombre')).map(el =>
      el.textContent?.trim()
    );
    expect(hotelTitles).toContain('Hotel Los Recuerdos');
    expect(hotelTitles).not.toContain('Restaurante Fogón del Magdalena');
    expect(hotelTitles).not.toContain('Cabañas Brisas de la Ciénaga');

    // Click Restaurantes tab
    tabs[1].click();
    fixture.detectChanges();
    const restTitles = Array.from(compiled.querySelectorAll('.hotel-card .hotel-nombre')).map(el =>
      el.textContent?.trim()
    );
    expect(restTitles).toContain('Restaurante Fogón del Magdalena');
    expect(restTitles).not.toContain('Hotel Los Recuerdos');
    expect(restTitles).not.toContain('Cabañas Brisas de la Ciénaga');

    // Link in CTA updates queryParam to current category
    const ctaHref = compiled
      .querySelector<HTMLAnchorElement>('.btn-descubre-experiencias')
      ?.getAttribute('href');
    expect(ctaHref).toContain('/lugares');
    expect(ctaHref).toContain('categoria=restaurantes');

    // Newly added restaurant appears only in Restaurantes tab
    hotelesService.agregarHotel({
      tipo: 'restaurante',
      estrellas: 5,
      nombre: 'Sazón Plateña Test',
      municipio: 'Plato',
      disponible: true,
      whatsapp: '573001112233',
      fotos: [],
      es: { desc: 'Prueba', serv: ['Terraza'] },
      en: { desc: 'Test', serv: ['Terrace'] }
    });
    fixture.detectChanges();
    expect(compiled.textContent).toContain('Sazón Plateña Test');

    // Click Cabañas tab
    tabs[2].click();
    fixture.detectChanges();
    const cabanaTitles = Array.from(compiled.querySelectorAll('.hotel-card .hotel-nombre')).map(el =>
      el.textContent?.trim()
    );
    expect(cabanaTitles).toContain('Cabañas Brisas de la Ciénaga');
    expect(cabanaTitles).not.toContain('Hotel Los Recuerdos');
    expect(cabanaTitles).not.toContain('Sazón Plateña Test');
  });

  it('LugaresComponent displays the centered capsule switcher, compact cards, detail modal, and queryParam sync', async () => {
    const queryParam$ = new BehaviorSubject(convertToParamMap({ categoria: 'restaurantes' }));

    await TestBed.configureTestingModule({
      imports: [LugaresComponent],
      providers: [
        provideRouter(routes),
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: queryParam$.asObservable() }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(LugaresComponent);
    const component = fixture.componentInstance;
    const langService = TestBed.inject(LanguageService);
    langService.setLang('es');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    // Centered switcher capsule with 3 category pills
    const switcher = compiled.querySelector('.lugares-switcher-zone .category-tabs');
    expect(switcher).toBeTruthy();
    const pills = Array.from(switcher!.querySelectorAll<HTMLButtonElement>('.tab-pill'));
    expect(pills.map(p => p.textContent?.trim())).toEqual(['Hoteles', 'Restaurantes', 'Cabañas']);

    // Opens pre-filtered on ?categoria=restaurantes
    expect(component.categoriaActiva()).toBe('restaurantes');
    expect(pills[1].classList.contains('active')).toBe(true);
    const restCards = Array.from(compiled.querySelectorAll('.lugar-card .lugar-name')).map(el =>
      el.textContent?.trim()
    );
    expect(restCards).toContain('Restaurante Fogón del Magdalena');
    expect(restCards).not.toContain('Hotel Los Recuerdos');

    // Switch to Cabañas via centered pill
    pills[2].click();
    fixture.detectChanges();
    expect(component.categoriaActiva()).toBe('cabanas');
    const cabanaCards = Array.from(compiled.querySelectorAll('.lugar-card .lugar-name')).map(el =>
      el.textContent?.trim()
    );
    expect(cabanaCards).toContain('Cabañas Brisas de la Ciénaga');

    // Filter available only
    const availButtons = Array.from(
      compiled.querySelectorAll<HTMLButtonElement>('.availability-pills .avail-pill')
    );
    availButtons[1].click();
    fixture.detectChanges();
    expect(component.soloDisponibles()).toBe(true);
    const availCabanas = Array.from(compiled.querySelectorAll('.lugar-card .lugar-name')).map(el =>
      el.textContent?.trim()
    );
    expect(availCabanas).toContain('Cabañas Brisas de la Ciénaga');
    expect(availCabanas).not.toContain('Cabañas Mirador del Puente');

    // Open detail modal on compact card and close it
    const detailBtn = compiled.querySelector<HTMLButtonElement>('.lugar-card .btn-detail');
    expect(detailBtn).toBeTruthy();
    detailBtn!.click();
    fixture.detectChanges();

    const modal = compiled.querySelector('.lugar-modal');
    expect(modal).toBeTruthy();
    expect(modal?.textContent).toContain('Cabañas Brisas de la Ciénaga');

    // Step gallery photo inside modal
    const nextPhotoBtn = modal!.querySelector<HTMLButtonElement>('.gallery-nav.next');
    expect(nextPhotoBtn).toBeTruthy();
    nextPhotoBtn!.click();
    fixture.detectChanges();
    expect(component.modalPhotoIdx()).toBe(1);

    // Close modal
    modal!.querySelector<HTMLButtonElement>('.modal-close-btn')!.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.lugar-modal')).toBeNull();

    // Language switch ES <-> EN updates copy cleanly
    langService.setLang('en');
    fixture.detectChanges();
    expect(compiled.textContent).toContain('Places & Experiences');
    const enPills = Array.from(
      compiled.querySelectorAll<HTMLButtonElement>('.lugares-switcher-zone .tab-pill')
    );
    expect(enPills.map(p => p.textContent?.trim())).toEqual(['Hotels', 'Restaurants', 'Cabins']);
    langService.setLang('es');
  });

  it('HotelesService migrates legacy untyped localStorage snapshots without losing user hotels', () => {
    localStorage.setItem(
      'plato400-hotels-data',
      JSON.stringify({
        actualizado: '2026-01-01',
        hoteles: [
          {
            id: 'legacy-1',
            estrellas: 4,
            nombre: 'Hotel Legacy User',
            municipio: 'Plato',
            disponible: true,
            whatsapp: '573001234567',
            fotos: [],
            es: { desc: 'Hotel guardado anteriormente', serv: ['Wifi'] }
          }
        ]
      })
    );

    TestBed.configureTestingModule({});
    const service = TestBed.inject(HotelesService);
    const items = service.dataset().hoteles;

    expect(items.some(h => h.nombre === 'Hotel Legacy User')).toBe(true);
    expect(items.some(h => h.tipo === 'restaurante')).toBe(true);
    expect(items.some(h => h.tipo === 'cabana')).toBe(true);
  });
});
