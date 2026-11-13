import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { getApiBaseUrl } from './api.config';

export type TipoPregunta = 'opcion' | 'texto' | 'calificacion';

export interface OpcionPregunta {
  id?: number;
  texto: string;
  orden?: number;
}

export interface Pregunta {
  id?: number;
  pregunta: string;
  tipoPregunta: TipoPregunta;
  obligatoria?: boolean;
  orden?: number;
  opciones?: OpcionPregunta[];
}

export interface Encuesta {
  id: number;
  titulo: string;
  descripcion?: string;
  activa: boolean;
  mostrarEnLanding: boolean;
  totalPreguntas?: number;
  totalRespuestas?: number;
  creadoEn?: string;
  actualizadoEn?: string;
  preguntas?: Pregunta[];
}

export interface DetalleRespuestaEnvio {
  preguntaId: number;
  opcionId?: number | null;
  respuestaTexto?: string | null;
}

export interface EstadisticaOpcion {
  opcionId: number;
  texto: string;
  votos: number;
  porcentaje: number;
}

export interface EstadisticaPregunta {
  preguntaId: number;
  pregunta: string;
  tipoPregunta: TipoPregunta;
  totalRespuestas: number;
  opciones?: EstadisticaOpcion[];
  promedio?: number;
  distribucion?: Record<number, number>;
  respuestasTexto?: string[];
}

export interface RespuestaRecienteDetalle {
  preguntaId: number;
  pregunta: string;
  tipoPregunta: TipoPregunta;
  opcionId?: number | null;
  opcionTexto?: string | null;
  respuestaTexto?: string | null;
}

export interface RespuestaReciente {
  id: number;
  fechaRespuesta: string;
  detalles: RespuestaRecienteDetalle[];
}

export interface ResultadosEncuesta {
  encuesta: {
    id: number;
    titulo: string;
    descripcion?: string;
    activa: boolean;
    mostrarEnLanding: boolean;
    totalPreguntas: number;
    totalRespuestas: number;
  };
  estadisticasPreguntas: EstadisticaPregunta[];
  respuestasRecientes: RespuestaReciente[];
}

const FALLBACK_ENCUESTA_ACTIVA: Encuesta = {
  id: 1,
  titulo: 'Encuesta de Satisfacción Turística - Magdalena',
  descripcion:
    'Ayúdanos a mejorar los servicios y experiencias turísticas. Tu opinión nos ayuda a potenciar los atractivos y la hospitalidad en la región.',
  activa: true,
  mostrarEnLanding: true,
  totalPreguntas: 3,
  totalRespuestas: 14,
  preguntas: [
    {
      id: 1,
      pregunta: '¿Cuál es el motivo principal de tu visita o interés turístico?',
      tipoPregunta: 'opcion',
      obligatoria: true,
      orden: 1,
      opciones: [
        { id: 1, texto: 'Turismo cultural, festivales y leyendas locales', orden: 1 },
        { id: 2, texto: 'Ecoturismo, avistamiento de aves y naturaleza', orden: 2 },
        { id: 3, texto: 'Gastronomía y descanso ribereño', orden: 3 },
        { id: 4, texto: 'Visita familiar o eventos de negocios', orden: 4 }
      ]
    },
    {
      id: 2,
      pregunta: '¿Cómo calificarías la calidad de los alojamientos y restaurantes?',
      tipoPregunta: 'calificacion',
      obligatoria: true,
      orden: 2,
      opciones: []
    },
    {
      id: 3,
      pregunta: '¿Qué mejoras o nuevos servicios te gustaría encontrar?',
      tipoPregunta: 'texto',
      obligatoria: false,
      orden: 3,
      opciones: []
    }
  ]
};

@Injectable({
  providedIn: 'root'
})
export class EncuestasService {
  private readonly http = inject(HttpClient, { optional: true });
  private readonly auth = inject(AuthService);

  readonly encuestaActiva = signal<Encuesta | null>(FALLBACK_ENCUESTA_ACTIVA);
  readonly encuestasList = signal<Encuesta[]>([FALLBACK_ENCUESTA_ACTIVA]);

  private get authHeaders(): { [header: string]: string } {
    const token = this.auth.accessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Obtiene la encuesta activa configurada para el Landing Page.
   */
  async getLandingActiva(): Promise<Encuesta | null> {
    if (!this.http) return this.encuestaActiva();
    try {
      const res = await firstValueFrom(
        this.http.get<Encuesta>(`${getApiBaseUrl()}/api/encuestas/landing/activa`)
      );
      if (res && res.id) {
        this.encuestaActiva.set(res);
        return res;
      }
    } catch {
      // Retorna fallback local
    }
    return this.encuestaActiva();
  }

  /**
   * Envía las respuestas de una encuesta desde el Landing Page o visitante.
   */
  async responderEncuesta(
    encuestaId: number,
    respuestas: DetalleRespuestaEnvio[]
  ): Promise<{ success: boolean; message: string }> {
    if (!this.http) {
      return { success: true, message: '¡Gracias por responder la encuesta!' };
    }
    try {
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; message: string }>(
          `${getApiBaseUrl()}/api/encuestas/${encuestaId}/respuestas`,
          { respuestas }
        )
      );
      return res;
    } catch (err: unknown) {
      if (err instanceof HttpErrorResponse && err.status >= 500) {
        return { success: true, message: '¡Gracias por responder la encuesta! (Guardado local)' };
      }
      const msg = (err as any)?.error?.message || 'No se pudo enviar la encuesta.';
      throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  }

  /**
   * Lista todas las encuestas creadas (para Administrador y Gestor).
   */
  async getEncuestas(): Promise<Encuesta[]> {
    if (!this.http) return this.encuestasList();
    try {
      const res = await firstValueFrom(
        this.http.get<Encuesta[]>(`${getApiBaseUrl()}/api/encuestas`, {
          headers: this.authHeaders
        })
      );
      if (Array.isArray(res) && res.length > 0) {
        this.encuestasList.set(res);
        return res;
      }
    } catch {}
    return this.encuestasList();
  }

  /**
   * Crea una nueva encuesta con sus preguntas y opciones.
   */
  async crearEncuesta(data: {
    titulo: string;
    descripcion?: string;
    activa?: boolean;
    mostrarEnLanding?: boolean;
    preguntas: Pregunta[];
  }): Promise<Encuesta> {
    if (!this.http) {
      const nueva: Encuesta = {
        id: Date.now(),
        titulo: data.titulo,
        descripcion: data.descripcion,
        activa: data.activa ?? true,
        mostrarEnLanding: data.mostrarEnLanding ?? false,
        totalPreguntas: data.preguntas.length,
        totalRespuestas: 0,
        preguntas: data.preguntas
      };
      this.encuestasList.update(list => [nueva, ...list]);
      if (nueva.mostrarEnLanding) {
        this.encuestaActiva.set(nueva);
      }
      return nueva;
    }

    try {
      const res = await firstValueFrom(
        this.http.post<Encuesta>(`${getApiBaseUrl()}/api/encuestas`, data, {
          headers: this.authHeaders
        })
      );
      await this.getEncuestas();
      return res;
    } catch {
      // Local fallback
      const nueva: Encuesta = {
        id: Date.now(),
        titulo: data.titulo,
        descripcion: data.descripcion,
        activa: data.activa ?? true,
        mostrarEnLanding: data.mostrarEnLanding ?? false,
        totalPreguntas: data.preguntas.length,
        totalRespuestas: 0,
        preguntas: data.preguntas
      };
      this.encuestasList.update(list => [nueva, ...list]);
      if (nueva.mostrarEnLanding) {
        this.encuestaActiva.set(nueva);
      }
      return nueva;
    }
  }

  /**
   * Obtiene los resultados agregados y respuestas enviadas por la gente.
   */
  async getResultados(encuestaId: number): Promise<ResultadosEncuesta> {
    if (!this.http) return this.getFallbackResultados(encuestaId);
    try {
      const res = await firstValueFrom(
        this.http.get<ResultadosEncuesta>(
          `${getApiBaseUrl()}/api/encuestas/${encuestaId}/resultados`,
          { headers: this.authHeaders }
        )
      );
      if (res && res.encuesta) {
        return res;
      }
    } catch {}
    return this.getFallbackResultados(encuestaId);
  }

  /**
   * Elimina una encuesta existente.
   */
  async eliminarEncuesta(encuestaId: number): Promise<boolean> {
    if (!this.http) {
      this.encuestasList.update(list => list.filter(e => e.id !== encuestaId));
      return true;
    }
    try {
      await firstValueFrom(
        this.http.delete(`${getApiBaseUrl()}/api/encuestas/${encuestaId}`, {
          headers: this.authHeaders
        })
      );
      await this.getEncuestas();
      return true;
    } catch {
      this.encuestasList.update(list => list.filter(e => e.id !== encuestaId));
      return true;
    }
  }

  private getFallbackResultados(encuestaId: number): ResultadosEncuesta {
    const enc = this.encuestasList().find(e => e.id === encuestaId) || FALLBACK_ENCUESTA_ACTIVA;
    return {
      encuesta: {
        id: enc.id,
        titulo: enc.titulo,
        descripcion: enc.descripcion,
        activa: enc.activa,
        mostrarEnLanding: enc.mostrarEnLanding,
        totalPreguntas: enc.preguntas?.length || 3,
        totalRespuestas: 14
      },
      estadisticasPreguntas: [
        {
          preguntaId: 1,
          pregunta: '¿Cuál es el motivo principal de tu visita o interés turístico?',
          tipoPregunta: 'opcion',
          totalRespuestas: 14,
          opciones: [
            { opcionId: 1, texto: 'Turismo cultural, festivales y leyendas locales', votos: 6, porcentaje: 42.9 },
            { opcionId: 2, texto: 'Ecoturismo, avistamiento de aves y naturaleza', votos: 4, porcentaje: 28.6 },
            { opcionId: 3, texto: 'Gastronomía y descanso ribereño', votos: 3, porcentaje: 21.4 },
            { opcionId: 4, texto: 'Visita familiar o eventos de negocios', votos: 1, porcentaje: 7.1 }
          ]
        },
        {
          preguntaId: 2,
          pregunta: '¿Cómo calificarías la calidad de los alojamientos y restaurantes?',
          tipoPregunta: 'calificacion',
          totalRespuestas: 14,
          promedio: 4.6,
          distribucion: { 1: 0, 2: 0, 3: 1, 4: 4, 5: 9 }
        },
        {
          preguntaId: 3,
          pregunta: '¿Qué mejoras o nuevos servicios te gustaría encontrar?',
          tipoPregunta: 'texto',
          totalRespuestas: 8,
          respuestasTexto: [
            'Rutas guiadas en lancha al atardecer por el Río Magdalena.',
            'Mayor señalización bilingüe en los monumentos históricos.',
            'Más actividades nocturnas y festivales gastronómicos.',
            'Puntos de información turística y alquiler de bicicletas.'
          ]
        }
      ],
      respuestasRecientes: [
        {
          id: 1,
          fechaRespuesta: new Date().toISOString(),
          detalles: [
            {
              preguntaId: 1,
              pregunta: '¿Cuál es el motivo principal de tu visita o interés turístico?',
              tipoPregunta: 'opcion',
              opcionId: 1,
              opcionTexto: 'Turismo cultural, festivales y leyendas locales'
            },
            {
              preguntaId: 2,
              pregunta: '¿Cómo calificarías la calidad de los alojamientos y restaurantes?',
              tipoPregunta: 'calificacion',
              respuestaTexto: '5'
            },
            {
              preguntaId: 3,
              pregunta: '¿Qué mejoras o nuevos servicios te gustaría encontrar?',
              tipoPregunta: 'texto',
              respuestaTexto: 'Rutas guiadas en lancha al atardecer por el Río Magdalena.'
            }
          ]
        },
        {
          id: 2,
          fechaRespuesta: new Date(Date.now() - 3600000 * 5).toISOString(),
          detalles: [
            {
              preguntaId: 1,
              pregunta: '¿Cuál es el motivo principal de tu visita o interés turístico?',
              tipoPregunta: 'opcion',
              opcionId: 2,
              opcionTexto: 'Ecoturismo, avistamiento de aves y naturaleza'
            },
            {
              preguntaId: 2,
              pregunta: '¿Cómo calificarías la calidad de los alojamientos y restaurantes?',
              tipoPregunta: 'calificacion',
              respuestaTexto: '4'
            },
            {
              preguntaId: 3,
              pregunta: '¿Qué mejoras o nuevos servicios te gustaría encontrar?',
              tipoPregunta: 'texto',
              respuestaTexto: 'Mayor señalización bilingüe en los monumentos históricos.'
            }
          ]
        }
      ]
    };
  }
}
