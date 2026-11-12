import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { getApiBaseUrl } from './api.config';
import { HotelesService } from './hoteles.service';

export interface MunicipioCount {
  municipio: string;
  total: number;
}

export interface UsuariosResumen {
  total: number;
  administradores: number;
  gestores: number;
}

export interface ResumenResponse {
  totalHoteles: number;
  hotelesDisponibles: number;
  hotelesNoDisponibles: number;
  hotelesPorMunicipio: MunicipioCount[];
  usuarios?: UsuariosResumen;
}

export interface DisponibilidadGrafica {
  disponibles: number;
  noDisponibles: number;
}

export interface EstrellasGrafica {
  estrellas: number;
  total: number;
}

export interface GraficasResponse {
  disponibilidad: DisponibilidadGrafica;
  porEstrellas: EstrellasGrafica[];
  porMunicipio: MunicipioCount[];
}

export interface MapaHotel {
  id: string;
  nombre: string;
  estrellas: number;
  municipio: string;
  whatsapp: string | null;
  disponible: boolean;
  latitud: number;
  longitud: number;
}

export interface HotelReciente {
  id: string;
  nombre: string;
  fecha: string | Date;
  quien: string;
}

export interface HotelIncompleto {
  id: string;
  nombre: string;
  faltantes: string[];
}

export interface HotelSinActualizar {
  id: string;
  nombre: string;
  diasSinActualizar: number;
  actualizadoEn: string | Date;
}

export interface ListasResponse {
  recientes: HotelReciente[];
  incompletos: HotelIncompleto[];
  sinActualizar: HotelSinActualizar[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient, { optional: true });
  private readonly authService = inject(AuthService);
  private readonly hotelesService = inject(HotelesService);

  private get API_URL(): string {
    return `${getApiBaseUrl()}/dashboard`;
  }

  // Estados de datos
  readonly resumen = signal<ResumenResponse | null>(null);
  readonly graficas = signal<GraficasResponse | null>(null);
  readonly mapaHoteles = signal<MapaHotel[]>([]);
  readonly listas = signal<ListasResponse | null>(null);

  // Estados de carga (Skeleton)
  readonly loadingResumen = signal<boolean>(false);
  readonly loadingGraficas = signal<boolean>(false);
  readonly loadingMapa = signal<boolean>(false);
  readonly loadingListas = signal<boolean>(false);

  // Estados de error
  readonly errorResumen = signal<string | null>(null);
  readonly errorGraficas = signal<string | null>(null);
  readonly errorMapa = signal<string | null>(null);
  readonly errorListas = signal<string | null>(null);

  constructor() {
    // Inicializar inmediatamente con el cálculo local sincronizado
    this.resumen.set(this.calcularResumenLocal());
    this.graficas.set(this.calcularGraficasLocal());
    this.listas.set(this.calcularListasLocal());
    this.mapaHoteles.set(this.calcularMapaLocal());
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.accessToken();
    if (!token) {
      return new HttpHeaders();
    }
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  private async cargarEndpoint<T>(
    path: string,
    loadingSignal: { set: (val: boolean) => void },
    errorSignal: { set: (val: string | null) => void },
    targetSignal: { set: (val: T) => void },
    fallbackFn: () => T,
    transformFn?: (data: T) => T
  ): Promise<void> {
    loadingSignal.set(true);
    errorSignal.set(null);

    if (!this.http || !this.authService.accessToken()) {
      targetSignal.set(fallbackFn());
      loadingSignal.set(false);
      return;
    }

    try {
      const raw = await firstValueFrom(
        this.http.get<T>(`${this.API_URL}/${path}`, {
          headers: this.getAuthHeaders()
        })
      );
      targetSignal.set(transformFn ? transformFn(raw) : raw);
    } catch {
      // Fallback reactivo que sincroniza exactamente con los hoteles y usuarios actuales
      targetSignal.set(fallbackFn());
    } finally {
      loadingSignal.set(false);
    }
  }

  /**
   * Carga el resumen de métricas para las tarjetas superiores.
   */
  async cargarResumen(): Promise<void> {
    await this.cargarEndpoint<ResumenResponse>(
      'resumen',
      this.loadingResumen,
      this.errorResumen,
      this.resumen,
      () => this.calcularResumenLocal(),
      data => {
        if (!this.authService.isAdmin() && data.usuarios) {
          const { usuarios: _ignored, ...rest } = data;
          return rest;
        }
        return data;
      }
    );
  }

  /**
   * Carga los datos para las 3 gráficas (dona de disponibilidad, barras por estrellas, barras por municipio).
   */
  async cargarGraficas(): Promise<void> {
    await this.cargarEndpoint<GraficasResponse>(
      'graficas',
      this.loadingGraficas,
      this.errorGraficas,
      this.graficas,
      () => this.calcularGraficasLocal()
    );
  }

  /**
   * Carga las listas rápidas (recientes, incompletos, sin actualizar).
   */
  async cargarListas(): Promise<void> {
    await this.cargarEndpoint<ListasResponse>(
      'listas',
      this.loadingListas,
      this.errorListas,
      this.listas,
      () => this.calcularListasLocal()
    );
  }

  /**
   * Carga los datos para el mapa de hoteles con Leaflet.
   */
  async cargarMapa(): Promise<void> {
    await this.cargarEndpoint<MapaHotel[]>(
      'mapa',
      this.loadingMapa,
      this.errorMapa,
      this.mapaHoteles,
      () => this.calcularMapaLocal()
    );
  }

  /**
   * Carga todos los datos del dashboard.
   */
  async cargarTodo(): Promise<void> {
    await Promise.all([
      this.cargarResumen(),
      this.cargarGraficas(),
      this.cargarListas(),
      this.cargarMapa()
    ]);
  }

  /**
   * Calcula métricas locales sincronizadas en memoria con los datos de HotelesService y AuthService
   */
  calcularResumenLocal(): ResumenResponse {
    const dataset = this.hotelesService.dataset();
    const hoteles = dataset.hoteles;

    const totalHoteles = hoteles.length;
    const hotelesDisponibles = hoteles.filter(h => h.disponible).length;
    const hotelesNoDisponibles = hoteles.filter(h => !h.disponible).length;

    // Conteo por municipios
    const municipioMap = new Map<string, number>();
    for (const h of hoteles) {
      const mun = h.municipio || 'Plato';
      municipioMap.set(mun, (municipioMap.get(mun) || 0) + 1);
    }

    const hotelesPorMunicipio: MunicipioCount[] = Array.from(municipioMap.entries()).map(
      ([municipio, total]) => ({ municipio, total })
    );

    if (hotelesPorMunicipio.length === 0 && totalHoteles > 0) {
      hotelesPorMunicipio.push({ municipio: 'Plato', total: totalHoteles });
    }

    let usuarios: UsuariosResumen | undefined = undefined;

    // Solo para ADMIN se incluye el resumen de usuarios
    if (this.authService.isAdmin()) {
      const usuariosList = this.authService.usuarios();
      const adminCount = usuariosList.filter(u => u.role === 'admin').length;
      const gestorCount = usuariosList.filter(u => u.role === 'gestor').length;

      usuarios = {
        total: usuariosList.length,
        administradores: adminCount,
        gestores: gestorCount
      };
    }

    return {
      totalHoteles,
      hotelesDisponibles,
      hotelesNoDisponibles,
      hotelesPorMunicipio,
      usuarios
    };
  }

  /**
   * Calcula los datos de las gráficas sincronizados con el dataset actual.
   */
  calcularGraficasLocal(): GraficasResponse {
    const hoteles = this.hotelesService.dataset().hoteles;
    const disponibles = hoteles.filter(h => h.disponible).length;
    const noDisponibles = hoteles.filter(h => !h.disponible).length;

    // Estrellas del 1 al 5
    const porEstrellas: EstrellasGrafica[] = [1, 2, 3, 4, 5].map(estrellas => ({
      estrellas,
      total: hoteles.filter(h => Math.round(h.estrellas) === estrellas).length
    }));

    // Conteo por municipios
    const munMap = new Map<string, number>();
    for (const h of hoteles) {
      const mun = h.municipio || 'Plato';
      munMap.set(mun, (munMap.get(mun) || 0) + 1);
    }

    let porMunicipio: MunicipioCount[] = Array.from(munMap.entries()).map(
      ([municipio, total]) => ({ municipio, total })
    );

    if (porMunicipio.length === 0 && hoteles.length > 0) {
      porMunicipio = [{ municipio: 'Plato', total: hoteles.length }];
    }

    return {
      disponibilidad: {
        disponibles,
        noDisponibles
      },
      porEstrellas,
      porMunicipio
    };
  }

  /**
   * Calcula las tres listas rápidas sincronizadas con el dataset actual.
   */
  calcularListasLocal(): ListasResponse {
    const dataset = this.hotelesService.dataset();
    const hoteles = dataset.hoteles;
    const adminUser = this.authService.currentUser()?.name || 'Administración de Turismo';

    // 1. Recientes: últimos 5 hoteles
    const recientes: HotelReciente[] = hoteles.slice(0, 5).map(h => ({
      id: h.id,
      nombre: h.nombre,
      fecha: dataset.actualizado,
      quien: adminUser
    }));

    // 2. Incompletos: sin fotos, sin whatsapp, sin ubicación o sin reseña
    const incompletos: HotelIncompleto[] = [];
    for (const h of hoteles) {
      const faltantes: string[] = [];
      if (!h.fotos || h.fotos.length === 0) {
        faltantes.push('Sin fotos');
      }
      if (!h.whatsapp || h.whatsapp.trim() === '') {
        faltantes.push('Sin WhatsApp');
      }
      if (!h.ubicacion || h.ubicacion.trim() === '') {
        faltantes.push('Sin ubicación');
      }
      if (!h.es?.desc || h.es.desc.trim() === '') {
        faltantes.push('Sin reseña');
      }

      if (faltantes.length > 0) {
        incompletos.push({
          id: h.id,
          nombre: h.nombre,
          faltantes
        });
      }
    }

    // 3. Sin actualizar en más de 30 días
    const sinActualizar: HotelSinActualizar[] = [];
    const fechaDataset = new Date(dataset.actualizado + 'T12:00:00');
    const diffDias = Math.floor((Date.now() - fechaDataset.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDias > 30) {
      hoteles.forEach(h => {
        sinActualizar.push({
          id: h.id,
          nombre: h.nombre,
          diasSinActualizar: diffDias,
          actualizadoEn: dataset.actualizado
        });
      });
    }

    return {
      recientes,
      incompletos,
      sinActualizar
    };
  }

  /**
   * Calcula los hoteles para el mapa con coordenadas válidas.
   */
  calcularMapaLocal(): MapaHotel[] {
    const hoteles = this.hotelesService.dataset().hoteles;
    return hoteles
      .filter(h => typeof h.latitud === 'number' && typeof h.longitud === 'number' && !isNaN(h.latitud) && !isNaN(h.longitud))
      .map(h => ({
        id: h.id,
        nombre: h.nombre,
        estrellas: h.estrellas,
        municipio: h.municipio || 'Plato',
        whatsapp: h.whatsapp,
        disponible: h.disponible,
        latitud: h.latitud!,
        longitud: h.longitud!
      }));
  }

  /**
   * Refresca las métricas cuando cambie la información de hoteles o usuarios
   */
  refrescarResumen(): void {
    this.cargarResumen();
    this.cargarGraficas();
    this.cargarListas();
    this.cargarMapa();
  }

  /**
   * Sincroniza inmediatamente los datos locales en memoria sin estado de carga asíncrono
   */
  refrescarTodoLocal(): void {
    this.loadingResumen.set(false);
    this.loadingGraficas.set(false);
    this.loadingListas.set(false);
    this.loadingMapa.set(false);
    this.resumen.set(this.calcularResumenLocal());
    this.graficas.set(this.calcularGraficasLocal());
    this.listas.set(this.calcularListasLocal());
    this.mapaHoteles.set(this.calcularMapaLocal());
  }
}
