import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { HomeComponent } from './pages/home/home';
import { HistoriaComponent } from './pages/historia/historia';
import { CulturaComponent } from './pages/cultura/cultura';
import { ProgramacionComponent } from './pages/programacion/programacion';
import { LoginComponent } from './pages/login/login';
import { PanelComponent } from './pages/panel/panel';
import { MapaHotelesComponent } from './components/mapa-hoteles/mapa-hoteles';
import { AuthService } from './services/auth.service';
import { HotelesService, getServiceIconAsset } from './services/hoteles.service';
import { LanguageService } from './services/language.service';
import { routes } from './app.routes';

// Mock getContext for jsdom to avoid 'Not implemented: HTMLCanvasElement getContext' unhandled error
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = (() => null) as any;
}

describe('App', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.spyOn(HotelesService.prototype, 'sincronizarDesdeApi').mockResolvedValue(false);
    vi.spyOn(AuthService.prototype, 'sincronizarUsuarios').mockResolvedValue(false);

    await TestBed.configureTestingModule({
      imports: [App, HomeComponent, HistoriaComponent, CulturaComponent, ProgramacionComponent, LoginComponent, PanelComponent, MapaHotelesComponent],
      providers: [provideRouter(routes)]
    }).compileComponents();
  });

  it('should create the root app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the hero title with 400 in HomeComponent', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.hero h1')?.textContent).toContain('400');

    const prevLang = fixture.componentInstance.lang();
    const readNavTexts = () =>
      Array.from(compiled.querySelectorAll('.nav-links .nav-item')).map(el => el.textContent?.trim());

    fixture.componentInstance.lang.set('es');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(readNavTexts()).toEqual(['Inicio', 'Historia', 'Cultura', 'Nuestro Pueblo']);
    const navHrefs = Array.from(compiled.querySelectorAll('.nav-links .nav-item')).map(el => el.getAttribute('href'));
    expect(navHrefs[1]).toContain('/historia');
    expect(navHrefs[2]).toContain('/cultura');

    fixture.componentInstance.lang.set('en');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(readNavTexts()).toEqual(['Home', 'History', 'Culture', 'Our Town']);

    fixture.componentInstance.lang.set(prevLang);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should toggle language in HomeComponent and switch all content to English', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const home = fixture.componentInstance;
    home.setLang('en');
    fixture.detectChanges();

    expect(home.lang()).toBe('en');
    expect(home.t().cta).toBe('Browse hotels');
    expect(home.t().hotT).toBe('Where to Stay');
    expect(home.t().instalaciones).toBe('Amenities & Services:');
    expect(home.t().boxWaSub).toBe('Direct Chat');
    expect(home.t().boxIgSub).toBe('View Profile');
    expect(home.t().boxFbSub).toBe('Official Page');
    expect(home.t().boxUbiSub).toBe('Get Directions');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.hero .btn-primary')?.textContent).toContain('Browse hotels');
    expect(compiled.querySelector('#hoteles h2')?.textContent).toContain('Where to Stay');
    expect(compiled.querySelector('.instalaciones-label')?.textContent).toContain('Amenities & Services:');

    // Test service chips translated to English
    const firstHotel = home.data().hoteles[0];
    const serviciosEn = home.getHotelServicios(firstHotel);
    expect(serviciosEn).toContain('Pool');
    expect(serviciosEn).toContain('Restaurant');

    // Test description translated
    const descEn = home.getHotelDesc(firstHotel);
    expect(descEn).toContain('Tradition and comfort in the heart of Plato');
  });

  it('should display hotel cards with stars, name, facilities, the 4 action boxes (WhatsApp, Instagram, Facebook, Ubicación) and the photos section', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const cards = compiled.querySelectorAll('.hotel-card');
    expect(cards.length).toBeGreaterThan(0);

    const firstCard = cards[0];
    // 1. Stars
    expect(firstCard.querySelector('.card-stars-wrap')).toBeTruthy();
    // 2. Name
    expect(firstCard.querySelector('.hotel-nombre')?.textContent).toContain('Hotel Los Recuerdos');
    // 3. Facilities
    expect(firstCard.querySelector('.instalaciones-block')).toBeTruthy();
    expect(firstCard.querySelector('.chips')).toBeTruthy();
    expect(getServiceIconAsset('Vista al Río')).toBe('/icon-serv-vista-rio.png');
    expect(getServiceIconAsset('Aire acondicionado')).toBe('/icon-serv-aire.png');
    expect(getServiceIconAsset('Zona campestre')).toBe('/icon-serv-campestre.png');
    expect(getServiceIconAsset('TV cable')).toBe('/icon-serv-tv-cable.png');
    expect(getServiceIconAsset('Centro')).toBe('/icon-serv-centro.png');
    expect(getServiceIconAsset('Downtown')).toBe('/icon-serv-centro.png');
    const cardIconSrcs = Array.from(compiled.querySelectorAll('.hotel-card .chip-icon-img')).map(el => el.getAttribute('src'));
    expect(cardIconSrcs).toContain('/icon-serv-aire.png');
    expect(cardIconSrcs).toContain('/icon-serv-centro.png');
    expect(cardIconSrcs).toContain('/icon-serv-tv-cable.png');
    expect(cardIconSrcs).toContain('/icon-serv-vista-rio.png');
    expect(cardIconSrcs).toContain('/icon-serv-campestre.png');
    // 4. Large Photos hero section
    expect(firstCard.querySelector('.card-photo-hero')).toBeTruthy();
    expect(firstCard.querySelector('.photo-carousel')).toBeTruthy();
    expect(firstCard.querySelectorAll('.carousel-img').length).toBeGreaterThan(0);
    // Visitors should not see the add photo button
    expect(firstCard.querySelector('.btn-admin-addphoto')).toBeNull();

    // 5. Redes sociales (WhatsApp, Instagram, X, TikTok, Página Web) y botón Ver ubicación arriba
    const cuadros = firstCard.querySelectorAll('.cuadro');
    expect(cuadros.length).toBe(5);
    expect(firstCard.querySelector('.cuadro-wa')).toBeTruthy();
    expect(firstCard.querySelector('.cuadro-ig')).toBeTruthy();
    expect(firstCard.querySelector('.cuadro-x')).toBeTruthy();
    expect(firstCard.querySelector('.cuadro-tk')).toBeTruthy();
    expect(firstCard.querySelector('.cuadro-web')).toBeTruthy();
    expect(firstCard.querySelector('.cuadro-ubi')).toBeNull();

    // Verify Ver ubicación button holds Google Maps link
    const ubiLink = firstCard.querySelector('.btn-card-ubicacion') as HTMLAnchorElement;
    expect(ubiLink).toBeTruthy();
    expect(ubiLink.href).toContain('google.com/maps');
  });

  it('should not display the Iniciar sesión button on public HomeComponent hero and separate admin route /administrador', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    // Public visitors do not see the login button in hero actions
    expect(compiled.querySelector('.btn-login')).toBeNull();
    expect(compiled.querySelector('.hero-actions')?.textContent).not.toContain('Iniciar sesión');
    expect(compiled.querySelector('.hero-actions')?.textContent).not.toContain('Log in');

    // Only public actions are shown (Ver hoteles / Conoce Plato)
    expect(compiled.querySelector('.btn-primary')).toBeTruthy();
    expect(compiled.querySelector('.btn-secondary')).toBeTruthy();

    // Verify dedicated historia, cultura, programacion and administrator routes exist
    expect(routes.find(r => r.path === 'historia')).toBeTruthy();
    expect(routes.find(r => r.path === 'cultura')).toBeTruthy();
    expect(routes.find(r => r.path === 'programacion')).toBeTruthy();
    expect(compiled.querySelector('.btn-celebracion')?.getAttribute('href')).toContain('/programacion');
    const adminRoute = routes.find(r => r.path === 'administrador');
    expect(adminRoute).toBeTruthy();
    const shortAdminRoute = routes.find(r => r.path === 'admin');
    expect(shortAdminRoute).toBeTruthy();
    expect(routes.find(r => r.path === 'admini')).toBeTruthy();
  });

  it('should render dedicated HistoriaComponent with Historia title, illustrated backdrop, and 8 collapsible parchment cards (4 top, 4 bottom) in Spanish', async () => {
    const langService = TestBed.inject(LanguageService);
    const prevLang = langService.lang();
    langService.setLang('es');

    const fixture = TestBed.createComponent(HistoriaComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.historia-backdrop')).toBeTruthy();
    expect(compiled.querySelector('.historia-sheet.sheet-wide')).toBeTruthy();
    expect(compiled.querySelector('.historia-title')?.textContent?.trim()).toBe('Historia');

    const activeNavText = compiled.querySelector('.nav-links .nav-item.active')?.textContent?.trim();
    expect(activeNavText).toBe('Historia');

    const chapters = compiled.querySelectorAll('.historia-chapter.parchment-card');
    expect(chapters.length).toBe(8);

    // Verificar que todas las tarjetas inicien encogidas con botón "Leer más"
    const firstCollapse = chapters[0].querySelector('.chapter-text-collapse');
    const firstBtn = chapters[0].querySelector<HTMLButtonElement>('.chapter-read-more-btn');
    expect(chapters[0].querySelector('.parchment-inner-frame')).toBeTruthy();
    expect(firstCollapse?.classList.contains('expanded')).toBe(false);
    expect(firstBtn?.getAttribute('aria-expanded')).toBe('false');
    expect(firstBtn?.textContent).toContain('Leer más');

    // Al hacer clic en "Leer más", se despliega hacia abajo y cambia a "Leer menos"
    firstBtn?.click();
    fixture.detectChanges();
    expect(firstCollapse?.classList.contains('expanded')).toBe(true);
    expect(firstBtn?.getAttribute('aria-expanded')).toBe('true');
    expect(firstBtn?.textContent).toContain('Leer menos');

    // Volver a encogerla
    firstBtn?.click();
    fixture.detectChanges();
    expect(firstCollapse?.classList.contains('expanded')).toBe(false);
    expect(firstBtn?.getAttribute('aria-expanded')).toBe('false');

    const bodyText = compiled.querySelector('.historia-body')?.textContent ?? '';
    expect(bodyText).toContain('En el País Chimila que comienza en el Río Ariguaní');
    expect(bodyText).toContain('Caño de Las Mujeres');
    expect(bodyText).toContain('Fray Nicomedes de Fonseca y Meza en el año de 1626');
    expect(bodyText).toContain('Transversal del Caribe o Vía de los Contenedores');
    expect(bodyText).toContain('Francisco Vilches y Domínguez');
    expect(bodyText).toContain('Te Olvidé o la Danza Del Garabato');
    expect(bodyText).toContain('Zorra Pelá');
    expect(bodyText).toContain('Don Virgilio Difilippo');
    expect(compiled.querySelector('.institutional-footer')).toBeTruthy();

    langService.setLang(prevLang);
  });

  it('should render dedicated CulturaComponent with Cultura title, illustrated backdrop, 9 cultural cards, filtering, and lightbox', async () => {
    const langService = TestBed.inject(LanguageService);
    const prevLang = langService.lang();
    langService.setLang('es');

    const fixture = TestBed.createComponent(CulturaComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.historia-backdrop')).toBeTruthy();
    expect(compiled.querySelector('.historia-title')?.textContent?.trim()).toBe('Cultura');

    const activeNavText = compiled.querySelector('.nav-links .nav-item.active')?.textContent?.trim();
    expect(activeNavText).toBe('Cultura');

    const initialCards = compiled.querySelectorAll('.cultura-card');
    expect(initialCards.length).toBe(9);

    const filterBtns = Array.from(compiled.querySelectorAll<HTMLButtonElement>('.cultura-filter-pill'));
    expect(filterBtns.length).toBe(4);

    // Filter to Mito y Escultura (2 cards)
    filterBtns[1].click();
    fixture.detectChanges();
    expect(compiled.querySelectorAll('.cultura-card').length).toBe(2);

    // Back to Todas (9 cards)
    filterBtns[0].click();
    fixture.detectChanges();
    const allCards = compiled.querySelectorAll<HTMLButtonElement>('.cultura-card');
    expect(allCards.length).toBe(9);

    // Open Lightbox on first card
    allCards[0].click();
    fixture.detectChanges();
    expect(compiled.querySelector('.cultura-lightbox')).toBeTruthy();
    expect(compiled.querySelector('#cultura-lightbox-title')?.textContent?.trim()).toBe('Iglesia Inmaculada Concepción');

    // Close Lightbox
    compiled.querySelector<HTMLButtonElement>('.lightbox-close-btn')?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.cultura-lightbox')).toBeNull();

    expect(compiled.querySelector('.institutional-footer')).toBeTruthy();
    langService.setLang(prevLang);
  });

  it('should render dedicated ProgramacionComponent with full 400-year schedule from the PDF, active button, and stage filters', async () => {
    const langService = TestBed.inject(LanguageService);
    const prevLang = langService.lang();
    langService.setLang('es');

    const fixture = TestBed.createComponent(ProgramacionComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.historia-backdrop')).toBeTruthy();
    expect(compiled.querySelector('.historia-sheet.sheet-wide')).toBeTruthy();
    expect(compiled.querySelector('.historia-title')?.textContent?.trim()).toBe('Programación');
    expect(compiled.querySelector('.btn-celebracion')?.classList.contains('active')).toBe(true);

    const scheduleCards = compiled.querySelectorAll('.prog-card, .festival-mega-card');
    expect(scheduleCards.length).toBe(7);

    const text = compiled.textContent ?? '';
    expect(text).toContain('Lanzamiento revista 400 años');
    expect(text).toContain('Novena en honor a la Virgen Inmaculada Concepción');
    expect(text).toContain('Misa solemne');
    expect(text).toContain('Cantemos a Plato');
    expect(text).toContain('Gran Cabalgata 400 Años');
    expect(text).toContain('Noche Blanca Plato 400 años');
    expect(text).toContain('Legado y honor plateño');
    expect(text).toContain('Segundo Desfile de Tradición Hombre Caimán');
    expect(text).toContain('Luister La Voz');
    expect(text).toContain('Show 400 Años de nuestra Historia e Identidad');
    expect(text).toContain('Festival de la Cumbia');
    expect(text).toContain('Festival Guillermo Buitrago');
    expect(text).toContain('Juglares Vallenatos');
    expect(text).toContain('Diego Daza');
    expect(text).toContain('Wilfrido Vargas');
    expect(text).toContain('Festival de la Leyenda Vallenata');
    expect(text).toContain('Festival Rey del Arpa');
    expect(text).toContain('Carlos Vives');
    expect(text).toContain('Peter Manjarrés');

    // Filter to Grandes Festivales (2 mega cards)
    const filterBtns = Array.from(compiled.querySelectorAll<HTMLButtonElement>('.prog-filter-pill'));
    expect(filterBtns.length).toBe(4);
    filterBtns[3].click();
    fixture.detectChanges();
    expect(compiled.querySelectorAll('.prog-card, .festival-mega-card').length).toBe(2);

    // Back to Toda la agenda (7 cards)
    filterBtns[0].click();
    fixture.detectChanges();
    expect(compiled.querySelectorAll('.prog-card, .festival-mega-card').length).toBe(7);

    // Language switch ES -> EN
    langService.setLang('en');
    fixture.detectChanges();
    expect(compiled.querySelector('.historia-title')?.textContent?.trim()).toBe('Schedule');

    expect(compiled.querySelector('.institutional-footer')).toBeTruthy();
    langService.setLang(prevLang);
  });

  it('should create LoginComponent with Turismo title and subtitle', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.sigla')?.textContent?.trim()).toBe('Turismo');
    expect(compiled.querySelector('.nombre')?.textContent?.trim()).toBe('Descubres los Destinos del Magdalena, experiencias y hospedajes.');
    expect(compiled.querySelector('.lema')).toBeNull();

    // Verify flexible login support with alias 'admin', 'admini', 'gestor'
    const authService = TestBed.inject(AuthService);
    expect(authService.loginConCredenciales('admini', 'admin2026').exito).toBe(true);
    expect(authService.loginConCredenciales('gestor', 'gestor2026').exito).toBe(true);
    // Restore admin session for subsequent tests
    authService.loginConCredenciales('admin', 'admin2026');
  });

  it('should initialize PanelComponent with sidebar, navigation and user management tabs', async () => {
    const fixture = TestBed.createComponent(PanelComponent);
    await fixture.whenStable();
    const panel = fixture.componentInstance;
    const compiled = fixture.nativeElement as HTMLElement;

    // Sidebar
    expect(compiled.querySelector('.sidebar')).toBeTruthy();
    const logoImg = compiled.querySelector<HTMLImageElement>('.sidebar-logo-img');
    expect(logoImg).toBeTruthy();
    expect(logoImg?.getAttribute('src')).toBe('logo-horizontal-color.png');
    expect(compiled.querySelector('.menu-heading')?.textContent).toContain('MI ESPACIO');

    // Section title default is Panel de Control (Dashboard)
    expect(compiled.querySelector('.section-title-wrap h2')?.textContent).toContain('Panel de Control');

    // Sidebar navigation order
    const navItems = compiled.querySelectorAll('.sidebar .nav-item');
    expect(navItems.length).toBeGreaterThanOrEqual(5);
    expect(navItems[0].textContent).toContain('Panel de Control');
    expect(navItems[1].textContent).toContain('Catálogo de Hoteles');
    expect(navItems[2].textContent).toContain('Crear Tarjeta');
    expect(navItems[3].textContent).toContain('Crear Usuarios');
    expect(navItems[4].textContent).toContain('Catálogos');

    // Switch to 'catalogos' to verify Municipios & Servicios management UI
    panel.setSeccion('catalogos');
    fixture.detectChanges();
    expect(compiled.querySelector('.catalogos-section')).toBeTruthy();
    expect(compiled.querySelector('#cat_mun_nombre')).toBeTruthy();
    expect(compiled.querySelector('#cat_srv_nombre')).toBeTruthy();

    // Switch to 'usuarios' to test user management tabs
    panel.setSeccion('usuarios');
    fixture.detectChanges();

    // Subtabs: Crear & Usuarios Creados
    const subtabs = compiled.querySelectorAll('.subtab-btn');
    expect(subtabs.length).toBe(2);
    expect(subtabs[0].textContent).toContain('Crear');
    expect(subtabs[1].textContent).toContain('Usuarios Creados');
  });

  it('should allow creating a user, changing password and linking hotels between Panel and Portada', async () => {
    const auth = TestBed.inject(AuthService);
    const hoteles = TestBed.inject(HotelesService);

    // 1. Crear Usuario
    const totalUsersBefore = auth.usuarios().length;
    const nuevoUser = auth.crearUsuario({
      nombreCompleto: 'Laura Directora de Turismo',
      correo: 'laura.turismo@magdalena.gov.co',
      password: 'password123',
      role: 'gestor'
    });
    expect(auth.usuarios().length).toBe(totalUsersBefore + 1);
    expect(auth.usuarios()[0].nombreCompleto).toBe('Laura Directora de Turismo');

    // 2. Cambiar contraseña
    const cambiado = auth.cambiarPassword(nuevoUser.id, 'nuevaClaveSegura2026');
    expect(cambiado).toBe(true);
    const userActualizado = auth.usuarios().find(u => u.id === nuevoUser.id);
    expect(userActualizado?.password).toBe('nuevaClaveSegura2026');

    // 3. Crear Hotel y vincular con Portada
    const totalHotelesBefore = hoteles.hoteles.length;
    const nuevoHotel = hoteles.agregarHotel({
      nombre: 'Hotel Boutique El Caimán Dorado',
      estrellas: 5,
      disponible: true,
      whatsapp: '573111223344',
      facebook: 'https://facebook.com/elcaimandorado',
      instagram: 'https://instagram.com/elcaimandorado',
      ubicacion: 'https://google.com/maps',
      fotos: ['cultura-plato.jpg'],
      es: {
        desc: 'Hotel boutique temático con acabados en madera nativa, piscina sin fin y restaurante de autor.',
        serv: ['Piscina', 'Restaurante de autor', 'Suites']
      },
      en: {
        desc: 'Boutique hotel with an infinity pool and signature restaurant.',
        serv: ['Pool', 'Signature Restaurant', 'Suites']
      }
    });

    expect(hoteles.hoteles.length).toBe(totalHotelesBefore + 1);
    expect(hoteles.hoteles[0].nombre).toBe('Hotel Boutique El Caimán Dorado');

    // 4. Verificar que HomeComponent refleja inmediatamente el nuevo hotel
    const homeFixture = TestBed.createComponent(HomeComponent);
    await homeFixture.whenStable();
    const homeCompiled = homeFixture.nativeElement as HTMLElement;
    expect(homeCompiled.textContent).toContain('Hotel Boutique El Caimán Dorado');
  });

  it('should restrict Gestor de Turismo y Contenidos to only see Catálogo de Hoteles and Crear Tarjeta, with all changes reflected', async () => {
    const auth = TestBed.inject(AuthService);
    auth.login('gestor@turismo.magdalena.gov.co', 'gestor');

    const fixture = TestBed.createComponent(PanelComponent);
    await fixture.whenStable();
    const panel = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    // 1. Sidebar contains Panel de Control, Catalogo de Hoteles and Crear Tarjeta (no Crear Usuarios)
    const navItems = compiled.querySelectorAll('.sidebar .nav-item');
    expect(navItems.length).toBe(3);
    expect(navItems[0].textContent).toContain('Panel de Control');
    expect(navItems[1].textContent).toContain('Catálogo de Hoteles');
    expect(navItems[2].textContent).toContain('Crear Tarjeta');
    expect(compiled.querySelector('.sidebar')?.textContent).not.toContain('Crear Usuarios');
    expect(compiled.querySelector('.sidebar')?.textContent).not.toContain('Catálogos');
    panel.setSeccion('catalogos');
    expect(panel.seccion()).toBe('dashboard');

    // 2. User role badge reflects Gestor de Contenidos
    expect(compiled.querySelector('.user-role-badge')?.textContent).toContain('Gestor');

    // 3. Ayuda de esta pantalla is NOT present
    expect(compiled.textContent).not.toContain('Ayuda de esta pantalla');

    // 4. In Catalogo, Gestor sees the modern hotel table with all 5 columns
    panel.setSeccion('hoteles', 'catalogo');
    fixture.detectChanges();
    const table = compiled.querySelector('.hotels-admin-table');
    expect(table).toBeTruthy();
    const headers = compiled.querySelectorAll('.hotels-admin-table th');
    expect(headers.length).toBe(5);
    expect(headers[0].textContent).toContain('NOMBRE DEL HOTEL');
    expect(headers[1].textContent).toContain('MUNICIPIO');
    expect(headers[2].textContent).toContain('CONTACTO (WHATSAPP)');
    expect(headers[3].textContent).toContain('DISPONIBILIDAD');
    expect(headers[4].textContent).toContain('ACCIÓN');

    // 5. Button to create card is present in Catalogo
    expect(compiled.querySelector('.btn-create-card-action')?.textContent).toContain('Crear Tarjeta');

    // 6. Switch Gestor to Crear Tarjeta
    panel.setSeccion('hoteles', 'crear');
    fixture.detectChanges();

    // 7. Form starts clean
    expect(panel.hotelNombre).toBe('');
    expect(panel.hotelDesc).toBe('');
    expect(panel.hotelFotos.length).toBe(0);

    // 8. Only single + Crear Tarjeta action button exists in form
    const formActions = compiled.querySelectorAll('.card-hotel-form .form-actions button');
    expect(formActions.length).toBe(1);
    expect(formActions[0].textContent).toContain('Crear Tarjeta');
  });

  it('should render the modern hotel table in Catálogo de Hoteles with required columns', async () => {
    const fixture = TestBed.createComponent(PanelComponent);
    await fixture.whenStable();
    const panel = fixture.componentInstance;
    panel.setSeccion('hoteles', 'catalogo');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const table = compiled.querySelector('.hotels-admin-table');
    expect(table).toBeTruthy();

    const headers = compiled.querySelectorAll('.hotels-admin-table th');
    expect(headers.length).toBe(5);
    expect(headers[0].textContent).toContain('NOMBRE DEL HOTEL');
    expect(headers[1].textContent).toContain('MUNICIPIO');
    expect(headers[2].textContent).toContain('CONTACTO (WHATSAPP)');
    expect(headers[3].textContent).toContain('DISPONIBILIDAD');
    expect(headers[4].textContent).toContain('ACCIÓN');

    const rows = compiled.querySelectorAll('.hotels-admin-table tbody tr');
    expect(rows.length).toBeGreaterThan(0);
    const firstRow = rows[0];
    expect(firstRow.querySelector('.hotel-name-title')).toBeTruthy();
    expect(firstRow.querySelector('.td-municipio')?.textContent).toContain('Plato');
    expect(firstRow.querySelector('.td-contacto')).toBeTruthy();
    expect(firstRow.querySelector('.badge-estado')?.textContent).toContain('Activo');
    expect(firstRow.querySelector('.btn-edit-hotel')).toBeTruthy();

    const hotelNames = Array.from(rows).map(r => r.querySelector('.hotel-name-title')?.textContent || '');
    expect(hotelNames.some(n => n.includes('Hotel Los Recuerdos'))).toBe(true);
  }, 15000);

  it('should not display Ayuda link, should start Crear Tarjeta with clean form and only + Crear Tarjeta action button', async () => {
    const fixture = TestBed.createComponent(PanelComponent);
    await fixture.whenStable();
    const panel = fixture.componentInstance;
    panel.setSeccion('hoteles', 'catalogo');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    // 1. Ayuda link is removed
    expect(compiled.textContent).not.toContain('Ayuda de esta pantalla');

    // 2. Button in Catalogo de Hoteles to create card is present
    const btnCreateInCatalog = compiled.querySelector('.btn-create-card-action');
    expect(btnCreateInCatalog?.textContent).toContain('Crear Tarjeta');

    // 3. Navigate to Crear Tarjeta
    panel.setSeccion('hoteles', 'crear');
    fixture.detectChanges();

    // 4. Form starts clean / empty
    expect(panel.hotelNombre).toBe('');
    expect(panel.hotelDesc).toBe('');
    expect(panel.hotelFotos.length).toBe(0);
    expect(panel.serviciosSeleccionados.length).toBe(0);

    // 5. In Crear Tarjeta, only + Crear Tarjeta button is in form actions (no other buttons)
    const formActions = compiled.querySelectorAll('.card-hotel-form .form-actions button');
    expect(formActions.length).toBe(1);
    expect(formActions[0].textContent).toContain('Crear Tarjeta');
  }, 15000);

  it('should render Phase 2 Dashboard with KPI cards and quick actions, displaying user metrics only for Admin and hiding them for Gestor', async () => {
    const auth = TestBed.inject(AuthService);
    auth.login('admin@turismo.magdalena.gov.co', 'admin');

    const fixture = TestBed.createComponent(PanelComponent);
    await fixture.whenStable();
    const panel = fixture.componentInstance;
    panel.setSeccion('dashboard');

    const compiled = fixture.nativeElement as HTMLElement;

    // 1. Verify skeleton loading state
    panel.dashboardService.loadingResumen.set(true);
    fixture.detectChanges();
    expect(compiled.querySelectorAll('.skeleton-card').length).toBeGreaterThanOrEqual(3);

    // 2. Set loaded state
    panel.dashboardService.loadingResumen.set(false);
    panel.dashboardService.resumen.set(panel.dashboardService.calcularResumenLocal());
    fixture.detectChanges();

    // 3. Quick action buttons for ADMIN: Crear Tarjeta, Ver Catálogo, Crear Usuario
    expect(compiled.querySelector('.btn-quick-crear')).toBeTruthy();
    expect(compiled.querySelector('.btn-quick-catalogo')).toBeTruthy();
    expect(compiled.querySelector('.btn-quick-usuario')).toBeTruthy();

    // 4. 4 KPI Cards for ADMIN
    const cards = compiled.querySelectorAll('.kpi-card:not(.skeleton-card)');
    expect(cards.length).toBe(4);

    // Card 1: Total Hoteles
    const totalHoteles = panel.hotelesService.dataset().hoteles.length.toString();
    expect(compiled.querySelector('.card-total .kpi-num')?.textContent?.trim()).toBe(totalHoteles);

    // Card 2: Disponibilidad (Verde / Rojo)
    const disponibles = panel.hotelesService.dataset().hoteles.filter(h => h.disponible).length.toString();
    const noDisponibles = panel.hotelesService.dataset().hoteles.filter(h => !h.disponible).length.toString();
    expect(compiled.querySelector('.pill-disponible .pill-num')?.textContent?.trim()).toBe(disponibles);
    expect(compiled.querySelector('.pill-no-disponible .pill-num')?.textContent?.trim()).toBe(noDisponibles);

    // Card 3: Municipios
    expect(compiled.querySelector('.card-municipios .mun-chip')?.textContent).toContain('Plato');

    // Card 4: Usuarios (Admin only)
    const totalUsuarios = panel.authService.usuarios().length.toString();
    expect(compiled.querySelector('.card-usuarios')).toBeTruthy();
    expect(compiled.querySelector('.card-usuarios .kpi-num')?.textContent?.trim()).toBe(totalUsuarios);

    // 5. Test as GESTOR
    auth.login('gestor@turismo.magdalena.gov.co', 'gestor');
    panel.dashboardService.loadingResumen.set(false);
    panel.dashboardService.resumen.set(panel.dashboardService.calcularResumenLocal());
    fixture.detectChanges();

    // Gestor sees only 3 KPI cards (Usuarios card is completely hidden)
    const gestorCards = compiled.querySelectorAll('.kpi-card:not(.skeleton-card)');
    expect(gestorCards.length).toBe(3);
    expect(compiled.querySelector('.card-usuarios')).toBeNull();

    // Gestor does NOT see Crear Usuario quick action button
    expect(compiled.querySelector('.btn-quick-usuario')).toBeNull();
    expect(compiled.querySelector('.btn-quick-crear')).toBeTruthy();
    expect(compiled.querySelector('.btn-quick-catalogo')).toBeTruthy();

    // Restore admin
    auth.login('admin@turismo.magdalena.gov.co', 'admin');
  });

  it('should render Phase 3 interactive charts and quick lists for both Admin and Gestor', async () => {
    const auth = TestBed.inject(AuthService);
    auth.login('admin@turismo.magdalena.gov.co', 'admin');

    const fixture = TestBed.createComponent(PanelComponent);
    await fixture.whenStable();
    const panel = fixture.componentInstance;
    panel.setSeccion('dashboard');

    // Trigger local calculation for charts and lists
    panel.dashboardService.refrescarTodoLocal();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    // 1. Verificar las 3 gráficas (elementos canvas)
    const donaCanvas = compiled.querySelector('#donaChartCanvas');
    const estrellasCanvas = compiled.querySelector('#estrellasChartCanvas');
    const municipiosCanvas = compiled.querySelector('#municipiosChartCanvas');

    expect(donaCanvas).toBeTruthy();
    expect(estrellasCanvas).toBeTruthy();
    expect(municipiosCanvas).toBeTruthy();

    // 2. Verificar coherencia de colores en la dona (verde para disponibles, rojo para no disponibles)
    const legendGreen = compiled.querySelector('.legend-item .bg-green');
    const legendRed = compiled.querySelector('.legend-item .bg-red');
    expect(legendGreen).toBeTruthy();
    expect(legendRed).toBeTruthy();

    const graficas = panel.dashboardService.graficas();
    expect(graficas).toBeTruthy();
    expect(graficas?.disponibilidad.disponibles).toBeGreaterThanOrEqual(1);
    expect(graficas?.porEstrellas.length).toBe(5);
    expect(graficas?.porMunicipio.length).toBeGreaterThanOrEqual(1);

    // 3. Verificar las 3 listas rápidas
    const quicklists = compiled.querySelectorAll('.quicklist-card');
    expect(quicklists.length).toBe(3);

    // Lista 1: Recientes (Últimos modificados)
    expect(quicklists[0].querySelector('h4')?.textContent).toContain('Últimos Modificados');
    const listaRecientes = panel.dashboardService.listas()?.recientes;
    expect(listaRecientes).toBeDefined();
    if (listaRecientes && listaRecientes.length > 0) {
      expect(quicklists[0].querySelector('.ql-item-name')?.textContent).toContain(listaRecientes[0].nombre);
      expect(quicklists[0].querySelector('.btn-ql-action')).toBeTruthy();
    }

    // Lista 2: Incompletos
    expect(quicklists[1].querySelector('h4')?.textContent).toContain('Información Incompleta');
    const listaIncompletos = panel.dashboardService.listas()?.incompletos;
    expect(listaIncompletos).toBeDefined();

    // Lista 3: Sin actualizar en más de 30 días
    expect(quicklists[2].querySelector('h4')?.textContent).toContain('Sin Actualizar');
    const listaSinActualizar = panel.dashboardService.listas()?.sinActualizar;
    expect(listaSinActualizar).toBeDefined();

    // 4. Probar acción de editar hotel desde la lista rápida
    if (listaRecientes && listaRecientes.length > 0) {
      const firstHotelId = listaRecientes[0].id;
      panel.editarHotelPorId(firstHotelId);
      fixture.detectChanges();
      expect(panel.seccion()).toBe('hoteles');
      expect(panel.subTabHoteles()).toBe('crear');
      expect(panel.hotelEditId).toBe(firstHotelId);
    }

    // 5. Verificar que el rol GESTOR también tiene acceso a las gráficas y listas
    auth.login('gestor@turismo.magdalena.gov.co', 'gestor');
    panel.setSeccion('dashboard');
    panel.dashboardService.refrescarTodoLocal();
    fixture.detectChanges();

    expect(compiled.querySelector('#donaChartCanvas')).toBeTruthy();
    expect(compiled.querySelector('#estrellasChartCanvas')).toBeTruthy();
    expect(compiled.querySelector('#municipiosChartCanvas')).toBeTruthy();
    expect(compiled.querySelectorAll('.quicklist-card').length).toBe(3);

    // Restaurar admin
    auth.login('admin@turismo.magdalena.gov.co', 'admin');
  }, 15000);

  it('should render Phase 4 MapaHotelesComponent with Leaflet, markers, legend, empty state and clean destruction', async () => {
    const fixture = TestBed.createComponent(MapaHotelesComponent);
    const mapComponent = fixture.componentInstance;

    // 1. Caso sin coordenadas: debe mostrar mensaje claro y no mapa roto
    fixture.componentRef.setInput('hoteles', []);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.mapa-empty-card')).toBeTruthy();
    expect(compiled.querySelector('.empty-content h4')?.textContent).toContain('No hay hoteles con coordenadas');
    expect(compiled.querySelector('.leaflet-map-canvas')).toBeNull();

    // 2. Caso con hoteles geolocalizados
    fixture.componentRef.setInput('hoteles', [
      {
        id: 'h1',
        nombre: 'Hotel Los Recuerdos',
        estrellas: 4,
        municipio: 'Plato',
        whatsapp: '573000000001',
        disponible: true,
        latitud: 9.7925,
        longitud: -74.7812
      },
      {
        id: 'h3',
        nombre: 'Hotel Posada del Río',
        estrellas: 3,
        municipio: 'Plato',
        whatsapp: '573000000003',
        disponible: false,
        latitud: 9.794,
        longitud: -74.7865
      }
    ]);
    fixture.detectChanges();

    expect(compiled.querySelector('.mapa-empty-card')).toBeNull();
    expect(compiled.querySelector('.mapa-card-container')).toBeTruthy();
    expect(compiled.querySelector('#mapaHotelesCanvas')).toBeTruthy();

    // Leyendas verde (disponible) y roja (no disponible)
    expect(compiled.querySelector('.pill-disponible .dot-green')).toBeTruthy();
    expect(compiled.querySelector('.pill-no-disponible .dot-red')).toBeTruthy();
    expect(compiled.querySelector('.legend-count-info')?.textContent).toContain('2 hospedaje(s)');

    // 3. Probar emisión del evento editar
    let hotelIdEditado: string | null = null;
    mapComponent.editar.subscribe(id => {
      hotelIdEditado = id;
    });
    mapComponent.editar.emit('h1');
    expect(hotelIdEditado).toBe('h1');

    // 4. Probar destrucción limpia del mapa
    expect(() => mapComponent.destruirMapa()).not.toThrow();
    expect(mapComponent.map).toBeNull();
  });

  it('should integrate app-mapa-hoteles inside PanelComponent dashboard for both Admin and Gestor', async () => {
    const auth = TestBed.inject(AuthService);
    auth.login('admin@turismo.magdalena.gov.co', 'admin');

    const fixture = TestBed.createComponent(PanelComponent);
    await fixture.whenStable();
    const panel = fixture.componentInstance;
    panel.setSeccion('dashboard');
    panel.dashboardService.refrescarTodoLocal();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    // Verificar que app-mapa-hoteles está presente en el dashboard
    const mapaElement = compiled.querySelector('app-mapa-hoteles');
    expect(mapaElement).toBeTruthy();
    expect(compiled.querySelector('#mapaHotelesCanvas')).toBeTruthy();

    // Verificar para el rol GESTOR
    auth.login('gestor@turismo.magdalena.gov.co', 'gestor');
    panel.setSeccion('dashboard');
    panel.dashboardService.refrescarTodoLocal();
    fixture.detectChanges();

    expect(compiled.querySelector('app-mapa-hoteles')).toBeTruthy();

    // Restaurar admin
    auth.login('admin@turismo.magdalena.gov.co', 'admin');
  }, 15000);

  it('should render ¿Qué tarjeta vas a crear? first in Crear Tarjeta and adapt only field names for hotel, cabaña and restaurante', async () => {
    const auth = TestBed.inject(AuthService);
    auth.login('admin@turismo.magdalena.gov.co', 'admin');

    const fixture = TestBed.createComponent(PanelComponent);
    await fixture.whenStable();
    const panel = fixture.componentInstance;
    const compiled = fixture.nativeElement as HTMLElement;

    // 1. Verificar barra de accesos directos en Dashboard
    panel.setSeccion('dashboard');
    fixture.detectChanges();
    expect(compiled.querySelector('.quick-actions-bar .quick-actions-label')?.textContent).toContain('Accesos directos');

    // 2. Ir a Crear Tarjeta y comprobar que la pregunta inicial va primero en el formulario
    panel.setSeccion('hoteles', 'crear');
    fixture.detectChanges();

    const firstGroup = compiled.querySelector('.hotel-form .form-group');
    expect(firstGroup?.classList.contains('card-type-question-group')).toBe(true);
    expect(firstGroup?.textContent).toContain('¿Qué tarjeta vas a crear?');

    const options = Array.from(compiled.querySelectorAll<HTMLButtonElement>('.card-type-option'));
    expect(options.length).toBe(3);
    expect(options.map(o => o.querySelector('.card-type-name')?.textContent?.trim())).toEqual([
      'Hotel',
      'Cabaña',
      'Restaurante'
    ]);

    // Estado inicial: Hotel
    expect(panel.cardType()).toBe('hotel');
    expect(compiled.querySelector('label[for="h_nombre"]')?.textContent?.trim()).toBe('NOMBRE DEL HOTEL *');
    expect(compiled.querySelector('.card-heading')?.textContent).toContain('Crear Nueva Tarjeta de Hotel');

    // 3. Seleccionar Cabaña: solo cambian los nombres/etiquetas/placeholders
    options[1].click();
    fixture.detectChanges();
    expect(panel.cardType()).toBe('cabana');
    expect(compiled.querySelector('.card-heading')?.textContent).toContain('Crear Nueva Tarjeta de Cabaña');
    expect(compiled.querySelector('label[for="h_nombre"]')?.textContent?.trim()).toBe('NOMBRE DE LA CABAÑA *');
    expect(compiled.querySelector('label[for="h_desc"]')?.textContent?.trim()).toBe('BREVE RESEÑA DE LA CABAÑA *');
    expect(compiled.querySelector<HTMLInputElement>('#h_nombre')?.placeholder).toContain('Cabaña');
    expect(compiled.querySelector('.live-card .hotel-nombre')?.textContent?.trim()).toBe('Nombre de la Cabaña');

    // 4. Seleccionar Restaurante: solo cambian los nombres/etiquetas/placeholders
    options[2].click();
    fixture.detectChanges();
    expect(panel.cardType()).toBe('restaurante');
    expect(compiled.querySelector('.card-heading')?.textContent).toContain('Crear Nueva Tarjeta de Restaurante');
    expect(compiled.querySelector('label[for="h_nombre"]')?.textContent?.trim()).toBe('NOMBRE DEL RESTAURANTE *');
    expect(compiled.querySelector('label[for="h_desc"]')?.textContent?.trim()).toBe('BREVE RESEÑA DEL RESTAURANTE *');
    expect(compiled.querySelector<HTMLInputElement>('#h_nombre')?.placeholder).toContain('Restaurante');
    expect(compiled.querySelector('.live-card .hotel-nombre')?.textContent?.trim()).toBe('Nombre del Restaurante');

    // Mismos campos conservados + coordenadas GPS opcionales
    expect(compiled.querySelector('#h_nombre')).toBeTruthy();
    expect(compiled.querySelector('#h_muni')).toBeTruthy();
    expect(compiled.querySelector('#h_desc')).toBeTruthy();
    expect(compiled.querySelector('#h_wa')).toBeTruthy();
    expect(compiled.querySelector('#h_ig')).toBeTruthy();
    expect(compiled.querySelector('#h_x')).toBeTruthy();
    expect(compiled.querySelector('#h_tiktok')).toBeTruthy();
    expect(compiled.querySelector('#h_web')).toBeTruthy();
    expect(compiled.querySelector('#h_ubi')).toBeTruthy();
    expect(compiled.querySelector('#h_lat')).toBeTruthy();
    expect(compiled.querySelector('#h_lng')).toBeTruthy();

    // Modal de cambio de contraseña propio disponible en la barra lateral
    const btnPass = compiled.querySelector<HTMLButtonElement>('.btn-sidebar-password');
    expect(btnPass).toBeTruthy();
    btnPass?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('#modalPassTitle')?.textContent).toContain('Cambiar mi contraseña');
    panel.closeOwnPasswordModal();
    fixture.detectChanges();
    expect(compiled.querySelector('#modalPassTitle')).toBeNull();
  });
});
