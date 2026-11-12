import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import {
  ApiHotelDto,
  ApiLoginResponseDto,
  ApiUserDto,
  getApiBaseUrl,
  resolveMediaUrl
} from './api.config';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { DashboardService } from './dashboard.service';
import { HotelesService } from './hoteles.service';

describe('Backend API sync, JWT auth, and HTTP interceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authService: AuthService;
  let hotelesService: HotelesService;
  let dashboardService: DashboardService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    authService = TestBed.inject(AuthService);
    hotelesService = TestBed.inject(HotelesService);
    dashboardService = TestBed.inject(DashboardService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('AuthService.loginRemoto authenticates against POST /api/auth/login, stores JWT, and syncs admin users', async () => {
    const mockLogin: ApiLoginResponseDto = {
      accessToken: 'jwt-real-token-123',
      tokenType: 'Bearer',
      expiresIn: '8h',
      user: {
        id: 'usr-1',
        correo: 'admin@turismo.magdalena.gov.co',
        nombreCompleto: 'Admin DB',
        rol: 'ADMIN',
        creadoEn: '2026-11-10T10:00:00.000Z'
      }
    };

    const loginPromise = authService.loginRemoto('admin', 'admin2026');

    const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      correo: 'admin@turismo.magdalena.gov.co',
      password: 'admin2026'
    });
    req.flush(mockLogin);

    const res = await loginPromise;
    expect(res.exito).toBe(true);
    expect(authService.accessToken()).toBe('jwt-real-token-123');
    expect(localStorage.getItem('plato400-jwt-token')).toBe('jwt-real-token-123');
    expect(authService.currentUser()?.name).toBe('Admin DB');
    expect(authService.isAdmin()).toBe(true);

    // Flush the automatic background GET /api/usuarios sync triggered for ADMIN logins
    const syncReq = httpMock.expectOne('http://localhost:3000/api/usuarios');
    expect(syncReq.request.method).toBe('GET');
    expect(syncReq.request.headers.get('Authorization')).toBe('Bearer jwt-real-token-123');
    syncReq.flush([
      mockLogin.user,
      {
        id: 'usr-2',
        correo: 'gestor@turismo.magdalena.gov.co',
        nombreCompleto: 'Gestor DB',
        rol: 'GESTOR',
        activo: true,
        creadoEn: '2026-11-11T10:00:00.000Z'
      }
    ]);

    await Promise.resolve();
    expect(authService.usuarios().map(u => u.correo)).toContain('gestor@turismo.magdalena.gov.co');
  });

  it('AuthService.loginRemoto rejects 401 server errors without falling back offline', async () => {
    const loginPromise = authService.loginRemoto('admin@turismo.magdalena.gov.co', 'clave-incorrecta');

    const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
    req.flush({ message: 'Credenciales inválidas' }, { status: 401, statusText: 'Unauthorized' });

    const res = await loginPromise;
    expect(res.exito).toBe(false);
    expect(res.error).toBe('Credenciales inválidas');
    expect(authService.currentUser()).toBeNull();
    expect(authService.accessToken()).toBeNull();
  });

  it('AuthService.loginRemoto falls back to offline credentials only when the backend is unreachable', async () => {
    const loginPromise = authService.loginRemoto('gestor@turismo.magdalena.gov.co', 'gestor2026');

    const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    const res = await loginPromise;
    expect(res.exito).toBe(true);
    expect(authService.currentUser()?.role).toBe('gestor');
    expect(authService.accessToken()).toBeNull();
  });

  it('authInterceptor attaches Bearer token only on backend API/dashboard URLs', async () => {
    localStorage.setItem('plato400-jwt-token', 'token-abc');

    const apiPromise = firstValueFrom(httpClient.get('http://localhost:3000/api/hoteles'));
    const apiReq = httpMock.expectOne('http://localhost:3000/api/hoteles');
    expect(apiReq.request.headers.get('Authorization')).toBe('Bearer token-abc');
    apiReq.flush([]);
    await apiPromise;

    const dashPromise = firstValueFrom(httpClient.get('http://localhost:3000/dashboard/resumen'));
    const dashReq = httpMock.expectOne('http://localhost:3000/dashboard/resumen');
    expect(dashReq.request.headers.get('Authorization')).toBe('Bearer token-abc');
    dashReq.flush({});
    await dashPromise;

    const extPromise = firstValueFrom(httpClient.get('https://external.example.com/data.json'));
    const extReq = httpMock.expectOne('https://external.example.com/data.json');
    expect(extReq.request.headers.has('Authorization')).toBe(false);
    extReq.flush({});
    await extPromise;
  });

  it('HotelesService syncs, creates, toggles availability, and deletes cards against NestJS API', async () => {
    authService.accessToken.set('jwt-editor-token');
    localStorage.setItem('plato400-jwt-token', 'jwt-editor-token');

    const remoteCatalog: ApiHotelDto[] = [
      {
        id: 'db-h1',
        tipo: 'HOTEL',
        nombre: 'Hotel Real Magdalena',
        estrellas: 5,
        resena: 'Vista al río',
        resenaEn: 'River view',
        whatsapp: '3001112233',
        disponible: true,
        municipio: { id: 'm1', nombre: 'Plato', departamento: 'Magdalena' },
        servicios: [{ id: 's1', nombre: 'Wifi', nombreEn: 'Wi-Fi' }],
        fotos: ['/foto1.jpg']
      },
      {
        id: 'db-r1',
        tipo: 'RESTAURANTE',
        nombre: 'Restaurante Puerto Rico',
        estrellas: 4,
        resena: 'Gastronomía ribereña',
        whatsapp: '3002223344',
        disponible: true,
        municipio: { id: 'm1', nombre: 'Plato', departamento: 'Magdalena' },
        servicios: [{ id: 's2', nombre: 'Restaurante', nombreEn: 'Restaurant' }],
        fotos: ['/foto2.jpg']
      },
      {
        id: 'db-c1',
        tipo: 'CABANA',
        nombre: 'Cabañas La Ribera',
        estrellas: 4,
        resena: 'Entorno natural',
        whatsapp: '3003334455',
        disponible: false,
        municipio: { id: 'm1', nombre: 'Plato', departamento: 'Magdalena' },
        servicios: [],
        fotos: []
      }
    ];

    const syncPromise = hotelesService.sincronizarDesdeApi();
    const getReq = httpMock.expectOne('http://localhost:3000/api/hoteles');
    expect(getReq.request.method).toBe('GET');
    getReq.flush(remoteCatalog);
    expect(await syncPromise).toBe(true);

    expect(hotelesService.hoteles.map(h => [h.id, h.tipo])).toEqual([
      ['db-h1', 'hotel'],
      ['db-r1', 'restaurante'],
      ['db-c1', 'cabana']
    ]);

    // Create cabin card remotely
    const createPromise = hotelesService.crearTarjetaRemota({
      tipo: 'cabana',
      nombre: 'Cabaña Nueva del Río',
      municipio: 'Plato',
      estrellas: 5,
      disponible: true,
      whatsapp: '573009998877',
      es: { desc: 'Nueva cabaña', serv: ['Piscina'] },
      en: { desc: 'New cabin', serv: ['Pool'] }
    });

    const postReq = httpMock.expectOne('http://localhost:3000/api/hoteles');
    expect(postReq.request.method).toBe('POST');
    expect(postReq.request.headers.get('Authorization')).toBe('Bearer jwt-editor-token');
    expect(postReq.request.body.tipo).toBe('CABANA');
    postReq.flush({
      id: 'db-c2',
      tipo: 'CABANA',
      nombre: 'Cabaña Nueva del Río',
      estrellas: 5,
      resena: 'Nueva cabaña',
      resenaEn: 'New cabin',
      whatsapp: '573009998877',
      disponible: true,
      municipio: { id: 'm1', nombre: 'Plato', departamento: 'Magdalena' },
      servicios: [{ id: 's3', nombre: 'Piscina', nombreEn: 'Pool' }],
      fotos: []
    } satisfies ApiHotelDto);

    const createdRes = await createPromise;
    expect(createdRes.exito).toBe(true);
    expect(createdRes.hotel?.id).toBe('db-c2');
    expect(hotelesService.hoteles[0].nombre).toBe('Cabaña Nueva del Río');

    // Toggle availability remotely
    const togglePromise = hotelesService.toggleDisponibleRemoto('db-c2');
    const toggleReq = httpMock.expectOne('http://localhost:3000/api/hoteles/db-c2/disponibilidad');
    expect(toggleReq.request.method).toBe('PATCH');
    expect(toggleReq.request.body).toEqual({ disponible: false });
    toggleReq.flush({
      id: 'db-c2',
      tipo: 'CABANA',
      nombre: 'Cabaña Nueva del Río',
      estrellas: 5,
      resena: 'Nueva cabaña',
      disponible: false,
      municipio: { id: 'm1', nombre: 'Plato', departamento: 'Magdalena' },
      servicios: [],
      fotos: []
    } satisfies ApiHotelDto);

    expect((await togglePromise).exito).toBe(true);
    expect(hotelesService.hoteles.find(h => h.id === 'db-c2')?.disponible).toBe(false);

    // Delete remotely
    const deletePromise = hotelesService.eliminarTarjetaRemota('db-c2');
    const delReq = httpMock.expectOne('http://localhost:3000/api/hoteles/db-c2');
    expect(delReq.request.method).toBe('DELETE');
    delReq.flush({ deleted: true, id: 'db-c2' });

    expect((await deletePromise).exito).toBe(true);
    expect(hotelesService.hoteles.some(h => h.id === 'db-c2')).toBe(false);
  });

  it('AuthService.crearUsuarioRemoto sends POST /api/usuarios with JWT and updates signal', async () => {
    authService.accessToken.set('jwt-admin-token');

    const createPromise = authService.crearUsuarioRemoto({
      nombreCompleto: 'Nuevo Gestor Territorial',
      correo: 'nuevo.gestor@plato.gov.co',
      password: 'Password2026',
      role: 'gestor'
    });

    const req = httpMock.expectOne('http://localhost:3000/api/usuarios');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      nombreCompleto: 'Nuevo Gestor Territorial',
      correo: 'nuevo.gestor@plato.gov.co',
      password: 'Password2026',
      rol: 'GESTOR'
    });
    req.flush({
      id: 'usr-nuevo',
      correo: 'nuevo.gestor@plato.gov.co',
      nombreCompleto: 'Nuevo Gestor Territorial',
      rol: 'GESTOR',
      activo: true,
      creadoEn: '2026-11-12T00:00:00.000Z'
    } satisfies ApiUserDto);

    const res = await createPromise;
    expect(res.exito).toBe(true);
    expect(res.usuario?.id).toBe('usr-nuevo');
    expect(authService.usuarios().some(u => u.id === 'usr-nuevo')).toBe(true);
  });

  it('DashboardService sends real Bearer JWT to /dashboard/resumen', async () => {
    authService.accessToken.set('jwt-dash-token');
    authService.currentUser.set({
      id: 'usr-1',
      email: 'admin@turismo.magdalena.gov.co',
      name: 'Admin',
      role: 'admin',
      roleLabel: 'Administrador'
    });

    const promise = dashboardService.cargarResumen();
    const req = httpMock.expectOne('http://localhost:3000/dashboard/resumen');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-dash-token');
    req.flush({
      totalHoteles: 9,
      hotelesDisponibles: 9,
      hotelesNoDisponibles: 0,
      hotelesPorMunicipio: [{ municipio: 'Plato', total: 9 }],
      usuarios: { total: 2, administradores: 1, gestores: 1 }
    });

    await promise;
    expect(dashboardService.resumen()?.totalHoteles).toBe(9);
  });

  it('HotelesService.setStarsRemoto, agregarFotosRemotas, and eliminarFotoRemota persist Portada edits via PATCH /api/hoteles/:id', async () => {
    authService.accessToken.set('jwt-portada-token');
    localStorage.setItem('plato400-jwt-token', 'jwt-portada-token');

    const starPromise = hotelesService.setStarsRemoto('h1', 5);
    const starReq = httpMock.expectOne('http://localhost:3000/api/hoteles/h1');
    expect(starReq.request.method).toBe('PATCH');
    expect(starReq.request.body.estrellas).toBe(5);
    starReq.flush({
      id: 'h1',
      tipo: 'HOTEL',
      nombre: 'Hotel Los Recuerdos',
      estrellas: 5,
      disponible: true,
      fotos: ['cultura-plato.jpg']
    } satisfies ApiHotelDto);

    expect((await starPromise).exito).toBe(true);
    expect(hotelesService.hoteles.find(h => h.id === 'h1')?.estrellas).toBe(5);

    const addPhotoPromise = hotelesService.agregarFotosRemotas('h1', ['data:image/jpeg;base64,abc']);
    const addPhotoReq = httpMock.expectOne('http://localhost:3000/api/hoteles/h1');
    expect(addPhotoReq.request.method).toBe('PATCH');
    expect(addPhotoReq.request.body.fotos).toEqual(['cultura-plato.jpg', 'data:image/jpeg;base64,abc']);
    addPhotoReq.flush({
      id: 'h1',
      tipo: 'HOTEL',
      nombre: 'Hotel Los Recuerdos',
      estrellas: 5,
      disponible: true,
      fotos: ['cultura-plato.jpg', 'data:image/jpeg;base64,abc']
    } satisfies ApiHotelDto);

    expect((await addPhotoPromise).exito).toBe(true);

    const delPhotoPromise = hotelesService.eliminarFotoRemota('h1', 1);
    const delPhotoReq = httpMock.expectOne('http://localhost:3000/api/hoteles/h1');
    expect(delPhotoReq.request.body.fotos).toEqual(['cultura-plato.jpg']);
    delPhotoReq.flush({
      id: 'h1',
      tipo: 'HOTEL',
      nombre: 'Hotel Los Recuerdos',
      estrellas: 5,
      disponible: true,
      fotos: ['cultura-plato.jpg']
    } satisfies ApiHotelDto);

    expect((await delPhotoPromise).exito).toBe(true);
    expect(hotelesService.hoteles.find(h => h.id === 'h1')?.fotos).toEqual(['cultura-plato.jpg']);
  });

  it('HotelesService loads dynamic municipios and servicios from /api/municipios and /api/servicios', async () => {
    const munPromise = hotelesService.cargarMunicipiosRemotos();
    const munReq = httpMock.expectOne('http://localhost:3000/api/municipios');
    munReq.flush([
      { id: 'm1', nombre: 'Plato', departamento: 'Magdalena' },
      { id: 'm2', nombre: 'Santa Marta', departamento: 'Magdalena' }
    ]);

    const servPromise = hotelesService.cargarServiciosRemotos();
    const servReq = httpMock.expectOne('http://localhost:3000/api/servicios');
    servReq.flush([
      { id: 's1', nombre: 'Piscina' },
      { id: 's2', nombre: 'Kayak' }
    ]);

    expect(await munPromise).toEqual(['Plato', 'Santa Marta']);
    expect(await servPromise).toEqual(['Piscina', 'Kayak']);
  });

  it('AuthService.cambiarMiPasswordRemoto sends PATCH /api/auth/change-password with JWT', async () => {
    localStorage.setItem('plato400-jwt-token', 'jwt-gestor-token');
    authService.accessToken.set('jwt-gestor-token');

    const promise = authService.cambiarMiPasswordRemoto('gestor2026', 'NuevaClave2026');
    const req = httpMock.expectOne('http://localhost:3000/api/auth/change-password');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-gestor-token');
    expect(req.request.body).toEqual({
      currentPassword: 'gestor2026',
      newPassword: 'NuevaClave2026'
    });
    req.flush({ message: 'Contraseña actualizada correctamente' });

    const res = await promise;
    expect(res.exito).toBe(true);
    expect(res.message).toBe('Contraseña actualizada correctamente');
  });

  it('HotelesService.subirImagenesRemotas uploads multipart files to POST /api/uploads/imagenes', async () => {
    authService.accessToken.set('jwt-upload-token');
    localStorage.setItem('plato400-jwt-token', 'jwt-upload-token');

    const fakeFile = new File([new Uint8Array([137, 80, 78, 71])], 'foto.png', {
      type: 'image/png'
    });
    const uploadPromise = hotelesService.subirImagenesRemotas([fakeFile]);

    const req = httpMock.expectOne('http://localhost:3000/api/uploads/imagenes');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    expect((req.request.body as FormData).getAll('files')).toHaveLength(1);
    req.flush({
      urls: ['http://localhost:3000/uploads/uuid-foto.png'],
      files: []
    });

    const result = await uploadPromise;
    expect(result.exito).toBe(true);
    expect(result.urls).toEqual(['http://localhost:3000/uploads/uuid-foto.png']);
  });

  it('getApiBaseUrl and resolveMediaUrl support same-origin "/" and custom API origins', () => {
    const scope = globalThis as { __PLATO_API_URL__?: string };
    const prev = scope.__PLATO_API_URL__;
    try {
      delete scope.__PLATO_API_URL__;
      expect(getApiBaseUrl()).toBe('http://localhost:3000');
      expect(resolveMediaUrl('/uploads/test.png')).toBe('http://localhost:3000/uploads/test.png');

      scope.__PLATO_API_URL__ = '/';
      expect(getApiBaseUrl()).toBe('');
      expect(resolveMediaUrl('/uploads/test.png')).toBe('/uploads/test.png');

      scope.__PLATO_API_URL__ = 'https://api.plato400.co/';
      expect(getApiBaseUrl()).toBe('https://api.plato400.co');
      expect(resolveMediaUrl('/uploads/test.png')).toBe('https://api.plato400.co/uploads/test.png');
    } finally {
      if (prev === undefined) {
        delete scope.__PLATO_API_URL__;
      } else {
        scope.__PLATO_API_URL__ = prev;
      }
    }
  });

  it('HotelesService performs CRUD on /api/municipios and /api/servicios', async () => {
    authService.accessToken.set('jwt-admin-cat');
    localStorage.setItem('plato400-jwt-token', 'jwt-admin-cat');

    const createMun = hotelesService.crearMunicipioRemoto({ nombre: 'Zapayán' });
    const reqCreateMun = httpMock.expectOne('http://localhost:3000/api/municipios');
    expect(reqCreateMun.request.method).toBe('POST');
    expect(reqCreateMun.request.body).toEqual({
      nombre: 'Zapayán',
      ciudad: undefined,
      departamento: 'Magdalena'
    });
    reqCreateMun.flush({
      id: 'mun-z',
      nombre: 'Zapayán',
      departamento: 'Magdalena'
    });
    expect((await createMun).exito).toBe(true);
    expect(hotelesService.municipiosCatalogo().some(m => m.id === 'mun-z')).toBe(true);

    const updMun = hotelesService.actualizarMunicipioRemoto('mun-z', { nombre: 'Zapayán Norte' });
    const reqUpdMun = httpMock.expectOne('http://localhost:3000/api/municipios/mun-z');
    expect(reqUpdMun.request.method).toBe('PATCH');
    reqUpdMun.flush({
      id: 'mun-z',
      nombre: 'Zapayán Norte',
      departamento: 'Magdalena'
    });
    expect((await updMun).exito).toBe(true);
    expect(hotelesService.municipiosCatalogo().find(m => m.id === 'mun-z')?.nombre).toBe(
      'Zapayán Norte'
    );

    const delMun = hotelesService.eliminarMunicipioRemoto('mun-z');
    const reqDelMun = httpMock.expectOne('http://localhost:3000/api/municipios/mun-z');
    expect(reqDelMun.request.method).toBe('DELETE');
    reqDelMun.flush({ deleted: true, id: 'mun-z' });
    expect((await delMun).exito).toBe(true);
    expect(hotelesService.municipiosCatalogo().some(m => m.id === 'mun-z')).toBe(false);

    const createSrv = hotelesService.crearServicioRemoto({
      nombre: 'Tour Fluvial',
      nombreEn: 'River Tour'
    });
    const reqCreateSrv = httpMock.expectOne('http://localhost:3000/api/servicios');
    expect(reqCreateSrv.request.method).toBe('POST');
    reqCreateSrv.flush({ id: 'srv-1', nombre: 'Tour Fluvial', nombreEn: 'River Tour' });
    expect((await createSrv).exito).toBe(true);

    const delSrv = hotelesService.eliminarServicioRemoto('srv-1');
    const reqDelSrv = httpMock.expectOne('http://localhost:3000/api/servicios/srv-1');
    expect(reqDelSrv.request.method).toBe('DELETE');
    reqDelSrv.flush({ deleted: true, id: 'srv-1' });
    expect((await delSrv).exito).toBe(true);
    expect(hotelesService.serviciosCatalogo().some(s => s.id === 'srv-1')).toBe(false);
  });
});

