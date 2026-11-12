import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { LoginComponent } from '../pages/login/login';
import { routes } from '../app.routes';
import { authInterceptor } from '../services/auth.interceptor';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('Security Hardening: authGuard and LoginComponent', () => {
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let router: Router;
  const dummyRoute = {} as ActivatedRouteSnapshot;
  const dummyState = { url: '/panel' } as RouterStateSnapshot;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter(routes),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('redirects to /administrador when user is unauthenticated and has no token', async () => {
    authService.logout();

    const result = await TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));
    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/administrador');
  });

  it('clears session and redirects to /administrador when JWT fails GET /api/auth/me (401)', async () => {
    localStorage.setItem('plato400-jwt-token', 'expired-jwt-token');
    authService.accessToken.set('expired-jwt-token');
    authService.currentUser.set({
      id: 'usr-1',
      email: 'admin@turismo.magdalena.gov.co',
      name: 'Admin',
      role: 'admin',
      roleLabel: 'Administrador'
    });

    const guardPromise = TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));

    const req = httpMock.expectOne('http://localhost:3000/api/auth/me');
    expect(req.request.headers.get('Authorization')).toBe('Bearer expired-jwt-token');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    const result = await guardPromise;
    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/administrador');
    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.accessToken()).toBeNull();
  });

  it('allows activation when JWT passes GET /api/auth/me (200)', async () => {
    authService.accessToken.set('valid-jwt-token');
    authService.currentUser.set({
      id: 'usr-1',
      email: 'admin@turismo.magdalena.gov.co',
      name: 'Admin',
      role: 'admin',
      roleLabel: 'Administrador'
    });

    const guardPromise = TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));

    const req = httpMock.expectOne('http://localhost:3000/api/auth/me');
    req.flush({
      id: 'usr-1',
      correo: 'admin@turismo.magdalena.gov.co',
      nombreCompleto: 'Admin DB',
      rol: 'ADMIN',
      activo: true
    });

    const result = await guardPromise;
    expect(result).toBe(true);
    expect(authService.currentUser()?.name).toBe('Admin DB');
  });

  it('LoginComponent initializes with empty credentials, renders no Google bypass, and requires non-empty inputs', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const compiled = fixture.nativeElement as HTMLElement;

    expect(component.email()).toBe('');
    expect(component.password()).toBe('');
    expect(compiled.querySelector('.btn-google')).toBeNull();

    await component.onSubmit(new Event('submit'));
    fixture.detectChanges();

    expect(component.errorMensaje()).toBe('Por favor ingresa tu correo y contraseña.');
    expect(authService.isAuthenticated()).toBe(false);

    const enlace = compiled.querySelector<HTMLButtonElement>('.btn-enlace');
    expect(enlace).toBeTruthy();
    enlace?.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.ayuda-clave')?.textContent).toContain('Administrador');
  });
});

