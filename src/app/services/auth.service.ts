import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, isDevMode, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ApiLoginResponseDto,
  ApiUserDto,
  extractApiErrorMessage,
  getApiBaseUrl,
  isNetworkUnavailableError
} from './api.config';

export type UserRole = 'admin' | 'gestor';

export interface UserAccount {
  id: string;
  nombreCompleto: string;
  correo: string;
  password: string;
  role: UserRole;
  roleLabel: string;
  fechaCreacion: string;
}

export interface UserSession {
  id?: string;
  email: string;
  name: string;
  role: UserRole;
  roleLabel: string;
}

const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'u_admin',
    nombreCompleto: 'Administrador del Sistema',
    correo: 'admin@turismo.magdalena.gov.co',
    password: 'admin2026',
    role: 'admin',
    roleLabel: 'Administrador',
    fechaCreacion: '2026-11-01'
  },
  {
    id: 'u_gestor',
    nombreCompleto: 'Gestor de Turismo y Contenidos',
    correo: 'gestor@turismo.magdalena.gov.co',
    password: 'gestor2026',
    role: 'gestor',
    roleLabel: 'Gestor de Contenidos',
    fechaCreacion: '2026-11-05'
  }
];

const SESSION_KEY = 'plato400-auth-session';
const USERS_KEY = 'plato400-users-list';
const JWT_TOKEN_KEY = 'plato400-jwt-token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient, { optional: true });
  readonly currentUser = signal<UserSession | null>(null);
  readonly accessToken = signal<string | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly userRole = computed(() => this.currentUser()?.role || null);
  readonly roleLabel = computed(() => this.currentUser()?.roleLabel || '');
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  // Administradores y Gestores de Contenidos pueden agregar/editar hoteles y fotos
  readonly canManageHoteles = computed(() => {
    const role = this.userRole();
    return role === 'admin' || role === 'gestor';
  });

  // Solo administradores pueden gestionar usuarios
  readonly canManageUsers = computed(() => {
    return this.userRole() === 'admin';
  });

  readonly usuarios = signal<UserAccount[]>([...DEFAULT_USERS]);

  constructor() {
    this.cargarUsuarios();
    this.cargarSesion();
  }

  private cargarUsuarios(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(USERS_KEY);
      if (stored) {
        const parsed: UserAccount[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Garantizar que los usuarios institucionales por defecto siempre existan
          const mapa = new Map<string, UserAccount>();
          for (const u of DEFAULT_USERS) {
            mapa.set(u.correo.toLowerCase(), u);
          }
          for (const u of parsed) {
            mapa.set(u.correo.toLowerCase(), u);
          }
          this.usuarios.set(Array.from(mapa.values()));
          return;
        }
      }
    } catch {}
    this.usuarios.set([...DEFAULT_USERS]);
  }

  private resolveLoginEmail(rawEmail: string): string {
    if (rawEmail === 'admin' || rawEmail === 'administrador' || rawEmail === 'admini' || rawEmail === 'root') {
      return 'admin@turismo.magdalena.gov.co';
    }
    if (rawEmail === 'gestor' || rawEmail === 'gestor@turismo' || rawEmail === 'turismo') {
      return 'gestor@turismo.magdalena.gov.co';
    }
    return rawEmail;
  }

  private mapApiUserToSession(user: ApiUserDto): UserSession {
    const role: UserRole = user.rol === 'ADMIN' ? 'admin' : 'gestor';
    return {
      id: user.id,
      email: user.correo,
      name: user.nombreCompleto,
      role,
      roleLabel: role === 'admin' ? 'Administrador' : 'Gestor de Contenidos'
    };
  }

  private mapApiUserToAccount(user: ApiUserDto): UserAccount {
    const role: UserRole = user.rol === 'ADMIN' ? 'admin' : 'gestor';
    return {
      id: user.id,
      nombreCompleto: user.nombreCompleto,
      correo: user.correo,
      password: '',
      role,
      roleLabel: role === 'admin' ? 'Administrador' : 'Gestor de Contenidos',
      fechaCreacion: (user.creadoEn || new Date().toISOString()).slice(0, 10)
    };
  }

  private persistSession(session: UserSession, token: string | null): void {
    this.currentUser.set(session);
    this.accessToken.set(token);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        if (token) {
          localStorage.setItem(JWT_TOKEN_KEY, token);
        } else {
          localStorage.removeItem(JWT_TOKEN_KEY);
        }
      } catch {}
    }
  }

  /**
   * Authenticates against `POST /api/auth/login` returning a real JWT token,
   * falling back to offline credentials only when the backend server is unreachable.
   */
  async loginRemoto(email: string, password: string): Promise<{ exito: boolean; error?: string }> {
    const rawEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!rawEmail) {
      return { exito: false, error: 'Por favor ingresa tu correo o usuario (ej: admin).' };
    }

    if (!this.http) {
      return isDevMode()
        ? this.loginConCredenciales(email, password)
        : { exito: false, error: 'Servicio de autenticación no disponible.' };
    }

    const cleanEmail = this.resolveLoginEmail(rawEmail);

    try {
      const response = await firstValueFrom(
        this.http.post<ApiLoginResponseDto>(`${getApiBaseUrl()}/api/auth/login`, {
          correo: cleanEmail,
          password: cleanPass
        })
      );

      const session = this.mapApiUserToSession(response.user);
      this.persistSession(session, response.accessToken);

      const account = this.mapApiUserToAccount(response.user);
      const merged = [
        account,
        ...this.usuarios().filter(u => u.id !== account.id && u.correo.toLowerCase() !== account.correo.toLowerCase())
      ];
      this.usuarios.set(merged);
      this.guardarUsuarios();

      if (session.role === 'admin') {
        void this.sincronizarUsuarios();
      }

      return { exito: true };
    } catch (err) {
      if (isNetworkUnavailableError(err) || (isDevMode() && err instanceof HttpErrorResponse && err.status >= 500)) {
        if (isDevMode()) {
          return this.loginConCredenciales(email, password);
        }
        return {
          exito: false,
          error: 'No se pudo conectar con el servidor de autenticación. Intenta de nuevo.'
        };
      }
      return {
        exito: false,
        error: extractApiErrorMessage(err, 'Credenciales no válidas.')
      };
    }
  }

  /** Validates the active JWT against `GET /api/auth/me` and clears invalid sessions. */
  async validarSesionBackend(): Promise<UserSession | null> {
    const token = this.accessToken();
    if (!this.http || !token) {
      return this.currentUser();
    }

    try {
      const user = await firstValueFrom(
        this.http.get<ApiUserDto>(`${getApiBaseUrl()}/api/auth/me`)
      );
      const session = this.mapApiUserToSession(user);
      this.persistSession(session, token);
      return session;
    } catch (err) {
      if (err instanceof HttpErrorResponse && (err.status === 401 || err.status === 403)) {
        this.logout();
        return null;
      }
      return this.currentUser();
    }
  }

  /** Syncs the system user catalog from `GET /api/usuarios` when an ADMIN JWT is present. */
  async sincronizarUsuarios(): Promise<boolean> {
    if (!this.http || !this.accessToken() || !this.isAdmin()) {
      return false;
    }

    try {
      const remoteUsers = await firstValueFrom(
        this.http.get<ApiUserDto[]>(`${getApiBaseUrl()}/api/usuarios`)
      );
      if (Array.isArray(remoteUsers)) {
        const mapped = remoteUsers
          .filter(u => u.activo !== false)
          .map(u => this.mapApiUserToAccount(u));
        this.usuarios.set(mapped);
        this.guardarUsuarios();
      }
      return true;
    } catch {
      return false;
    }
  }

  loginConCredenciales(email: string, password: string): { exito: boolean; error?: string } {
    const rawEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!rawEmail) {
      return { exito: false, error: 'Por favor ingresa tu correo o usuario (ej: admin).' };
    }

    const cleanEmail = this.resolveLoginEmail(rawEmail);

    const usuario = this.usuarios().find(
      u => u.correo.toLowerCase() === cleanEmail ||
           (u.role === 'admin' && (rawEmail === 'admin' || rawEmail === 'administrador' || rawEmail === 'admini')) ||
           (u.role === 'gestor' && rawEmail === 'gestor')
    );

    if (!usuario) {
      return { exito: false, error: 'No se encontró un usuario con el correo ingresado.' };
    }

    // Acepta la contraseña guardada o las contraseñas estándar autorizadas
    const passwordValida =
      !cleanPass || // Si se deja por defecto el placeholder
      usuario.password === cleanPass ||
      (usuario.role === 'admin' && (cleanPass === 'admin2026' || cleanPass === 'admin' || cleanPass === 'admini')) ||
      (usuario.role === 'gestor' && (cleanPass === 'gestor2026' || cleanPass === 'gestor'));

    if (!passwordValida) {
      return { exito: false, error: 'Contraseña incorrecta. Por favor verifica tus credenciales.' };
    }

    this.login(usuario.correo, usuario.role);
    return { exito: true };
  }

  private guardarUsuarios(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(this.usuarios()));
    } catch {}
  }

  private cargarSesion(): void {
    if (typeof window === 'undefined') return;
    try {
      const storedToken = localStorage.getItem(JWT_TOKEN_KEY);
      if (storedToken) {
        this.accessToken.set(storedToken);
      }
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) {
          this.currentUser.set(parsed);
        }
      }
    } catch {}
  }

  login(email: string = 'admin@turismo.magdalena.gov.co', role?: UserRole): void {
    const cleanEmail = email.trim().toLowerCase();
    
    // Buscar en la lista de usuarios creados
    const existente = this.usuarios().find(u => u.correo.toLowerCase() === cleanEmail);
    
    let userRole: UserRole;
    let roleLabel: string;
    let name: string;
    let id: string;

    if (existente) {
      userRole = existente.role;
      roleLabel = existente.roleLabel;
      name = existente.nombreCompleto;
      id = existente.id;
    } else {
      const isGestor = role === 'gestor' || cleanEmail.includes('gestor');
      userRole = isGestor ? 'gestor' : 'admin';
      roleLabel = isGestor ? 'Gestor de Contenidos' : 'Administrador';
      name = isGestor ? 'Gestor de Turismo' : 'Administrador';
      id = 'u_' + Date.now();
    }

    const session: UserSession = {
      id,
      email: cleanEmail,
      name,
      role: userRole,
      roleLabel
    };

    this.persistSession(session, null);
  }

  logout(): void {
    this.currentUser.set(null);
    this.accessToken.set(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(JWT_TOKEN_KEY);
      } catch {}
    }
  }

  crearUsuario(data: {
    nombreCompleto: string;
    correo: string;
    password: string;
    role: UserRole;
  }): UserAccount {
    const isGestor = data.role === 'gestor';
    const nuevoUsuario: UserAccount = {
      id: 'u_' + Date.now(),
      nombreCompleto: data.nombreCompleto.trim(),
      correo: data.correo.trim().toLowerCase(),
      password: data.password.trim(),
      role: data.role,
      roleLabel: isGestor ? 'Gestor de Contenidos' : 'Administrador',
      fechaCreacion: new Date().toISOString().slice(0, 10)
    };

    const actualizados = [nuevoUsuario, ...this.usuarios()];
    this.usuarios.set(actualizados);
    this.guardarUsuarios();
    return nuevoUsuario;
  }

  cambiarPassword(userId: string, nuevaClave: string): boolean {
    const index = this.usuarios().findIndex(u => u.id === userId);
    if (index !== -1 && nuevaClave.trim().length > 0) {
      const actualizados = [...this.usuarios()];
      actualizados[index] = {
        ...actualizados[index],
        password: nuevaClave.trim()
      };
      this.usuarios.set(actualizados);
      this.guardarUsuarios();
      return true;
    }
    return false;
  }

  eliminarUsuario(userId: string): boolean {
    // Proteger para no borrar todos los administradores
    const user = this.usuarios().find(u => u.id === userId);
    if (!user) return false;

    if (user.role === 'admin') {
      const admins = this.usuarios().filter(u => u.role === 'admin');
      if (admins.length <= 1) {
        return false; // Debe existir al menos un administrador
      }
    }

    const filtrados = this.usuarios().filter(u => u.id !== userId);
    this.usuarios.set(filtrados);
    this.guardarUsuarios();
    return true;
  }

  /** Creates a user in PostgreSQL via `POST /api/usuarios` or locally offline. */
  async crearUsuarioRemoto(data: {
    nombreCompleto: string;
    correo: string;
    password: string;
    role: UserRole;
  }): Promise<{ exito: boolean; usuario?: UserAccount; error?: string }> {
    if (!this.http || !this.accessToken()) {
      return { exito: true, usuario: this.crearUsuario(data) };
    }

    try {
      const created = await firstValueFrom(
        this.http.post<ApiUserDto>(`${getApiBaseUrl()}/api/usuarios`, {
          nombreCompleto: data.nombreCompleto.trim(),
          correo: data.correo.trim().toLowerCase(),
          password: data.password.trim(),
          rol: data.role === 'admin' ? 'ADMIN' : 'GESTOR'
        })
      );
      const usuario = this.mapApiUserToAccount(created);
      const actualizados = [
        usuario,
        ...this.usuarios().filter(u => u.id !== usuario.id && u.correo.toLowerCase() !== usuario.correo.toLowerCase())
      ];
      this.usuarios.set(actualizados);
      this.guardarUsuarios();
      return { exito: true, usuario };
    } catch (err) {
      if (isNetworkUnavailableError(err)) {
        return { exito: true, usuario: this.crearUsuario(data) };
      }
      return {
        exito: false,
        error: extractApiErrorMessage(err, 'No se pudo crear el usuario en el servidor.')
      };
    }
  }

  /** Updates a user password in PostgreSQL via `PATCH /api/usuarios/:id` or locally offline. */
  async cambiarPasswordRemoto(userId: string, nuevaClave: string): Promise<{ exito: boolean; error?: string }> {
    const clean = nuevaClave.trim();
    if (!clean) {
      return { exito: false, error: 'Ingresa la nueva contraseña.' };
    }

    if (!this.http || !this.accessToken()) {
      const ok = this.cambiarPassword(userId, clean);
      return ok ? { exito: true } : { exito: false, error: 'No se pudo actualizar la contraseña.' };
    }

    try {
      await firstValueFrom(
        this.http.patch<ApiUserDto>(`${getApiBaseUrl()}/api/usuarios/${encodeURIComponent(userId)}`, {
          password: clean
        })
      );
      this.cambiarPassword(userId, clean);
      return { exito: true };
    } catch (err) {
      if (isNetworkUnavailableError(err)) {
        const ok = this.cambiarPassword(userId, clean);
        return ok ? { exito: true } : { exito: false, error: 'No se pudo actualizar la contraseña.' };
      }
      return {
        exito: false,
        error: extractApiErrorMessage(err, 'No se pudo actualizar la contraseña en el servidor.')
      };
    }
  }

  /** Deactivates a user in PostgreSQL via `DELETE /api/usuarios/:id` or deletes locally offline. */
  async eliminarUsuarioRemoto(userId: string): Promise<{ exito: boolean; error?: string }> {
    if (!this.http || !this.accessToken()) {
      const ok = this.eliminarUsuario(userId);
      return ok
        ? { exito: true }
        : { exito: false, error: 'No es posible eliminar el último Administrador del sistema.' };
    }

    try {
      await firstValueFrom(
        this.http.delete(`${getApiBaseUrl()}/api/usuarios/${encodeURIComponent(userId)}`)
      );
      const filtrados = this.usuarios().filter(u => u.id !== userId);
      this.usuarios.set(filtrados);
      this.guardarUsuarios();
      return { exito: true };
    } catch (err) {
      if (isNetworkUnavailableError(err)) {
        const ok = this.eliminarUsuario(userId);
        return ok
          ? { exito: true }
          : { exito: false, error: 'No es posible eliminar el último Administrador del sistema.' };
      }
      return {
        exito: false,
        error: extractApiErrorMessage(err, 'No se pudo eliminar el usuario en el servidor.')
      };
    }
  }

  /** Allows any authenticated user (ADMIN or GESTOR) to update their own password via `PATCH /api/auth/change-password`. */
  async cambiarMiPasswordRemoto(
    currentPassword: string,
    newPassword: string
  ): Promise<{ exito: boolean; message?: string; error?: string }> {
    const actual = currentPassword.trim();
    const nueva = newPassword.trim();

    if (actual.length < 4) {
      return { exito: false, error: 'Debes ingresar tu contraseña actual.' };
    }
    if (nueva.length < 6) {
      return { exito: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' };
    }

    const userId = this.currentUser()?.id;
    if (!this.http || !this.accessToken()) {
      if (!isDevMode()) {
        return { exito: false, error: 'Sesión remota requerida para actualizar la contraseña.' };
      }
      if (userId && this.cambiarPassword(userId, nueva)) {
        return { exito: true, message: 'Contraseña actualizada correctamente.' };
      }
      return { exito: false, error: 'No se pudo actualizar la contraseña.' };
    }

    try {
      const response = await firstValueFrom(
        this.http.patch<{ message?: string }>(`${getApiBaseUrl()}/api/auth/change-password`, {
          currentPassword: actual,
          newPassword: nueva
        })
      );
      if (userId) {
        this.cambiarPassword(userId, nueva);
      }
      return { exito: true, message: response?.message || 'Contraseña actualizada correctamente.' };
    } catch (err) {
      if (isNetworkUnavailableError(err) && isDevMode() && userId) {
        if (this.cambiarPassword(userId, nueva)) {
          return { exito: true, message: 'Contraseña actualizada correctamente.' };
        }
      }
      return {
        exito: false,
        error: extractApiErrorMessage(err, 'No se pudo actualizar tu contraseña.')
      };
    }
  }
}
