import { Component, computed, inject, OnInit, AfterViewInit, OnDestroy, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UserAccount, UserRole } from '../../services/auth.service';
import { ApiMunicipioDto, ApiServicioDto } from '../../services/api.config';
import { HotelesService, Hotel, CardType, buildXLink, getServiceIconAsset } from '../../services/hoteles.service';
import { DashboardService } from '../../services/dashboard.service';
import { EncuestasService, Encuesta, ResultadosEncuesta, TipoPregunta } from '../../services/encuestas.service';
import { MapaHotelesComponent } from '../../components/mapa-hoteles/mapa-hoteles';
import Chart from 'chart.js/auto';

type PanelTab = 'dashboard' | 'usuarios' | 'hoteles' | 'catalogos' | 'encuestas';
type UserSubTab = 'crear' | 'lista';
type HotelSubTab = 'crear' | 'catalogo';
type EncuestaSubTab = 'crear' | 'resultados';

export interface CardTypeMeta {
  id: CardType;
  optionLabel: string;
  optionHint: string;
  formHeadingCreate: string;
  formHeadingEdit: string;
  pageDescCreate: string;
  pageDescEdit: string;
  labelNombre: string;
  placeholderNombre: string;
  labelEstrellas: string;
  labelServicios: string;
  placeholderOtroServicio: string;
  labelDesc: string;
  placeholderDesc: string;
  labelFotos: string;
  placeholderInstagram: string;
  placeholderX: string;
  previewTitleFallback: string;
  previewAltFallback: string;
  previewServEmpty: string;
  previewDescFallback: string;
  emptyNameAlert: string;
}

const CARD_TYPE_CONFIG: Record<CardType, CardTypeMeta> = {
  hotel: {
    id: 'hotel',
    optionLabel: 'Hotel',
    optionHint: 'Alojamiento y hospedaje',
    formHeadingCreate: '+ Crear Nueva Tarjeta de Hotel',
    formHeadingEdit: '✎ Editar Tarjeta de Hotel',
    pageDescCreate: 'Complete los campos para registrar un nuevo hotel y publicar su tarjeta en el catálogo turístico.',
    pageDescEdit: 'Modifique la información de la tarjeta del hotel y guarde los cambios.',
    labelNombre: 'NOMBRE DEL HOTEL *',
    placeholderNombre: 'ej.: Hotel Cabañas del Río',
    labelEstrellas: 'CATEGORÍA DEL HOTEL (NÚMERO DE ESTRELLAS) *',
    labelServicios: 'SERVICIOS CON LOS QUE CUENTA EL HOTEL *',
    placeholderOtroServicio: 'Otro servicio del hotel (ej.: Bar en la terraza)',
    labelDesc: 'BREVE RESEÑA DEL HOTEL *',
    placeholderDesc: 'Describe las instalaciones, ambiente, habitaciones y recomendaciones para turistas...',
    labelFotos: 'FOTOS E IMÁGENES DEL HOTEL *',
    placeholderInstagram: 'https://instagram.com/nombrehotel',
    placeholderX: 'https://x.com/nombrehotel',
    previewTitleFallback: 'Nombre del Hotel',
    previewAltFallback: 'Foto del hotel',
    previewServEmpty: 'Seleccione servicios del hotel en el formulario',
    previewDescFallback: 'Reseña y descripción del hotel...',
    emptyNameAlert: 'Ingresa el nombre del hotel.'
  },
  cabana: {
    id: 'cabana',
    optionLabel: 'Cabaña',
    optionHint: 'Descanso y naturaleza',
    formHeadingCreate: '+ Crear Nueva Tarjeta de Cabaña',
    formHeadingEdit: '✎ Editar Tarjeta de Cabaña',
    pageDescCreate: 'Complete los campos para registrar una nueva cabaña y publicar su tarjeta en el catálogo turístico.',
    pageDescEdit: 'Modifique la información de la tarjeta de la cabaña y guarde los cambios.',
    labelNombre: 'NOMBRE DE LA CABAÑA *',
    placeholderNombre: 'ej.: Cabaña Brisas del Magdalena',
    labelEstrellas: 'CATEGORÍA DE LA CABAÑA (NÚMERO DE ESTRELLAS) *',
    labelServicios: 'SERVICIOS CON LOS QUE CUENTA LA CABAÑA *',
    placeholderOtroServicio: 'Otro servicio de la cabaña (ej.: Fogata y hamacas)',
    labelDesc: 'BREVE RESEÑA DE LA CABAÑA *',
    placeholderDesc: 'Describe el entorno natural, comodidades, capacidad y experiencias de la cabaña...',
    labelFotos: 'FOTOS E IMÁGENES DE LA CABAÑA *',
    placeholderInstagram: 'https://instagram.com/nombrecabana',
    placeholderX: 'https://x.com/nombrecabana',
    previewTitleFallback: 'Nombre de la Cabaña',
    previewAltFallback: 'Foto de la cabaña',
    previewServEmpty: 'Seleccione servicios de la cabaña en el formulario',
    previewDescFallback: 'Reseña y descripción de la cabaña...',
    emptyNameAlert: 'Ingresa el nombre de la cabaña.'
  },
  restaurante: {
    id: 'restaurante',
    optionLabel: 'Restaurante',
    optionHint: 'Gastronomía y sabor local',
    formHeadingCreate: '+ Crear Nueva Tarjeta de Restaurante',
    formHeadingEdit: '✎ Editar Tarjeta de Restaurante',
    pageDescCreate: 'Complete los campos para registrar un nuevo restaurante y publicar su tarjeta en el catálogo turístico.',
    pageDescEdit: 'Modifique la información de la tarjeta del restaurante y guarde los cambios.',
    labelNombre: 'NOMBRE DEL RESTAURANTE *',
    placeholderNombre: 'ej.: Restaurante Sabores del Río',
    labelEstrellas: 'CATEGORÍA DEL RESTAURANTE (NÚMERO DE ESTRELLAS) *',
    labelServicios: 'SERVICIOS CON LOS QUE CUENTA EL RESTAURANTE *',
    placeholderOtroServicio: 'Otro servicio del restaurante (ej.: Música en vivo)',
    labelDesc: 'BREVE RESEÑA DEL RESTAURANTE *',
    placeholderDesc: 'Describe la propuesta gastronómica, platos típicos, horario y ambiente del restaurante...',
    labelFotos: 'FOTOS E IMÁGENES DEL RESTAURANTE *',
    placeholderInstagram: 'https://instagram.com/nombrerestaurante',
    placeholderX: 'https://x.com/nombrerestaurante',
    previewTitleFallback: 'Nombre del Restaurante',
    previewAltFallback: 'Foto del restaurante',
    previewServEmpty: 'Seleccione servicios del restaurante en el formulario',
    previewDescFallback: 'Reseña y descripción del restaurante...',
    emptyNameAlert: 'Ingresa el nombre del restaurante.'
  }
};

const CARD_TYPE_OPTIONS: ReadonlyArray<CardTypeMeta> = [
  CARD_TYPE_CONFIG.hotel,
  CARD_TYPE_CONFIG.cabana,
  CARD_TYPE_CONFIG.restaurante
];

@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MapaHotelesComponent],
  templateUrl: './panel.html',
  styleUrl: './panel.css'
})
export class PanelComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly authService = inject(AuthService);
  readonly hotelesService = inject(HotelesService);
  readonly dashboardService = inject(DashboardService);
  readonly encuestasService = inject(EncuestasService);
  private readonly router = inject(Router);

  // Referencias a los canvas de las 3 gráficas
  @ViewChild('donaCanvas') donaCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('estrellasCanvas') estrellasCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('municipiosCanvas') municipiosCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild(MapaHotelesComponent) mapaHotelesComponent?: MapaHotelesComponent;

  private donaChart: any = null;
  private estrellasChart: any = null;
  private municipiosChart: any = null;
  private graficasTimer: ReturnType<typeof setTimeout> | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private isDestroyed = false;

  // Pestaña activa del menú lateral
  readonly seccion = signal<PanelTab>('dashboard');

  // Estado de repliegue/expansión del panel lateral (sidebar)
  readonly sidebarCollapsed = signal<boolean>(false);

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  // Métricas reactivas del catálogo para las tarjetas superiores de resumen
  readonly totalHotelesCount = computed(() => {
    return this.hotelesService.dataset().hoteles.filter(h => !h.tipo || h.tipo === 'hotel').length;
  });

  readonly totalCabanasCount = computed(() => {
    return this.hotelesService.dataset().hoteles.filter(h => h.tipo === 'cabana').length;
  });

  readonly totalRestaurantesCount = computed(() => {
    return this.hotelesService.dataset().hoteles.filter(h => h.tipo === 'restaurante').length;
  });

  readonly totalCatalogosCount = computed(() => {
    return this.hotelesService.dataset().hoteles.length;
  });

  readonly totalDisponiblesCount = computed(() => {
    return this.hotelesService.dataset().hoteles.filter(h => h.disponible).length;
  });

  readonly totalNoDisponiblesCount = computed(() => {
    return this.hotelesService.dataset().hoteles.filter(h => !h.disponible).length;
  });

  // Muestra exactamente 4 catálogos modificados recientemente
  readonly ultimosModificados = computed(() => {
    return this.hotelesService.dataset().hoteles.slice(0, 4);
  });

  // Filtros interactivos con preguntas selectivas para el Catálogo de Servicios Turísticos
  readonly filtroTipoServicio = signal<string>('todos'); // 'todos' | 'hotel' | 'cabana' | 'restaurante'
  readonly filtroServicioAmenidad = signal<string>('todos'); // 'todos' | nombre de amenidad/servicio

  readonly listaServiciosDisponibles = computed(() => {
    const set = new Set<string>();
    for (const h of this.hotelesService.dataset().hoteles) {
      for (const s of (h.es?.serv || [])) {
        if (s && s.trim()) set.add(s.trim());
      }
    }
    return Array.from(set).sort();
  });

  countPorTipo(tipo: 'hotel' | 'cabana' | 'restaurante'): number {
    return this.hotelesService.dataset().hoteles.filter(h => (!h.tipo && tipo === 'hotel') || h.tipo === tipo).length;
  }

  limpiarFiltrosServicios(): void {
    this.filtroTipoServicio.set('todos');
    this.filtroServicioAmenidad.set('todos');
  }

  getTipoLabel(tipo?: string): string {
    switch (tipo) {
      case 'cabana': return 'Cabaña';
      case 'restaurante': return 'Restaurante';
      default: return 'Hotel';
    }
  }

  getTipoIcon(tipo?: string): string {
    switch (tipo) {
      case 'cabana': return '🏡';
      case 'restaurante': return '🍽️';
      default: return '🏨';
    }
  }

  readonly serviciosTuristicosFiltrados = computed(() => {
    let list = this.hotelesService.dataset().hoteles;
    const tipo = this.filtroTipoServicio();
    if (tipo !== 'todos') {
      list = list.filter(h => (!h.tipo && tipo === 'hotel') || h.tipo === tipo);
    }
    const amenidad = this.filtroServicioAmenidad();
    if (amenidad !== 'todos') {
      list = list.filter(h => {
        const servList = h.es?.serv || [];
        return servList.some(s => s.toLowerCase() === amenidad.toLowerCase());
      });
    }
    return list;
  });

  // Sub-pestaña dentro de hoteles: 'crear' o 'catalogo'
  readonly subTabHoteles = signal<HotelSubTab>('catalogo');

  // Sub-pestaña dentro de usuarios: 'crear' o 'lista'
  readonly subTabUsuarios = signal<UserSubTab>('crear');

  // Sub-pestaña dentro de encuestas: 'crear' o 'resultados'
  readonly subTabEncuestas = signal<EncuestaSubTab>('crear');

  // FORMULARIO CREAR ENCUESTA
  encuestaTitulo = 'Encuesta de Satisfacción Turística';
  encuestaDescripcion = 'Ayúdanos a evaluar la experiencia y los atractivos turísticos del Magdalena.';
  encuestaMostrarLanding = true;
  encuestaActiva = true;
  cantidadPreguntas = 3;

  preguntasForm: Array<{
    pregunta: string;
    tipoPregunta: TipoPregunta;
    obligatoria: boolean;
    opciones: string[];
    nuevaOpcion: string;
  }> = [
    {
      pregunta: '¿Cuál es el motivo principal de tu visita o interés turístico?',
      tipoPregunta: 'opcion',
      obligatoria: true,
      opciones: [
        'Turismo cultural y fiestas patronales',
        'Ecoturismo y naturaleza',
        'Gastronomía y descanso ribereño',
        'Visita familiar o negocios'
      ],
      nuevaOpcion: ''
    },
    {
      pregunta: '¿Cómo calificarías la oferta hotelera y gastronómica en la región?',
      tipoPregunta: 'calificacion',
      obligatoria: true,
      opciones: [],
      nuevaOpcion: ''
    },
    {
      pregunta: '¿Qué aspectos consideras prioritarios para impulsar el turismo?',
      tipoPregunta: 'texto',
      obligatoria: false,
      opciones: [],
      nuevaOpcion: ''
    }
  ];

  readonly guardandoEncuesta = signal<boolean>(false);
  readonly mensajeExitoEncuesta = signal<string | null>(null);
  readonly mensajeErrorEncuesta = signal<string | null>(null);

  // RESULTADOS ENCUESTA
  readonly encuestaSeleccionadaId = signal<number | null>(null);
  readonly resultadosActuales = signal<ResultadosEncuesta | null>(null);
  readonly cargandoResultados = signal<boolean>(false);
  readonly encuestasCreadas = computed(() => this.encuestasService.encuestasList());

  // Mensajes de notificación
  readonly toastMessage = signal<string | null>(null);

  // FORMULARIO CREAR USUARIO
  userNombre = '';
  userCorreo = '';
  userPassword = '';
  userRol: UserRole = 'gestor';

  // Modal / Edición de Contraseña (Administrador hacia usuarios y perfil propio)
  editingUserId = signal<string | null>(null);
  newPasswordInput = '';

  readonly showOwnPasswordModal = signal<boolean>(false);
  ownCurrentPassword = '';
  ownNewPassword = '';
  ownConfirmPassword = '';
  readonly ownPasswordError = signal<string | null>(null);
  readonly ownPasswordSaving = signal<boolean>(false);

  // GESTIÓN DE CATÁLOGOS (Municipios y Servicios - solo Admin)
  catalogoMunicipioEditId: string | null = null;
  catalogoMunicipioNombre = '';
  catalogoMunicipioCiudad = '';
  catalogoMunicipioDepto = 'Magdalena';
  catalogoServicioNombre = '';
  catalogoServicioNombreEn = '';
  readonly catalogoSaving = signal<boolean>(false);

  readonly catalogoMunicipiosLista = computed<ApiMunicipioDto[]>(() => {
    const remote = this.hotelesService.municipiosCatalogo();
    if (remote.length > 0) return remote;
    return this.municipiosMagdalena.map((nombre, idx) => ({
      id: `local-m-${idx}`,
      nombre,
      departamento: 'Magdalena',
      totalTarjetas: 0
    }));
  });

  readonly catalogoServiciosLista = computed<ApiServicioDto[]>(() => {
    const remote = this.hotelesService.serviciosCatalogo();
    if (remote.length > 0) return remote;
    return this.serviciosDisponibles.map((nombre, idx) => ({
      id: `local-s-${idx}`,
      nombre
    }));
  });

  // FORMULARIO CREAR TARJETA (Hotel / Cabaña / Restaurante)
  readonly cardType = signal<CardType>('hotel');
  readonly cardTypeOptions = CARD_TYPE_OPTIONS;
  readonly cardMeta = computed(() => CARD_TYPE_CONFIG[this.cardType()]);

  hotelEditId: string | null = null;
  hotelNombre = '';
  hotelMunicipio = 'Plato';
  hotelEstrellas = 3;
  hotelDesc = '';
  hotelDescEn = '';
  hotelWhatsapp = '';
  hotelInstagram = '';
  hotelFacebook = '';
  hotelX = '';
  hotelTikTok = '';
  hotelPaginaWeb = '';
  hotelUbicacion = '';
  hotelLatitud: number | null = null;
  hotelLongitud: number | null = null;
  hotelFotos: string[] = [];

  municipiosMagdalena: string[] = [
    'Plato',
    'Santa Marta',
    'Ciénaga',
    'Aracataca',
    'El Banco',
    'Fundación',
    'Pivijay',
    'Zona Bananera',
    'Salamina',
    'Sitio Nuevo',
    'Guamal',
    'San Sebastián de Buenavista',
    'Chibolo',
    'Tenerife',
    'Nueva Granada',
    'Remolino',
    'Concordia'
  ];

  // Servicios disponibles para selección rápida
  serviciosDisponibles = [
    'Piscina',
    'Aire acondicionado',
    'Parqueadero privado',
    'Wifi de alta velocidad',
    'Restaurante',
    'Vista al río',
    'Zona campestre',
    'TV Cable',
    'Centro',
    'Desayuno incluido',
    'Recepción 24h',
    'Suites ejecutivas',
    'Bar y terraza',
    'Pet friendly'
  ];
  serviciosSeleccionados: string[] = [];
  nuevoServicioInput = '';
  nuevaFotoUrlInput = '';

  constructor() {
    if (!this.authService.isAuthenticated()) {
      void this.router.navigate(['/administrador']);
    }

    // Abrir por defecto en Panel de Control (Dashboard)
    this.seccion.set('dashboard');
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }
    void this.hotelesService.sincronizarDesdeApi();
    void this.sincronizarCatalogos();
    if (this.authService.isAdmin()) {
      void this.authService.sincronizarUsuarios();
    }
    this.dashboardService.cargarTodo();
  }

  private async sincronizarCatalogos(): Promise<void> {
    const [municipiosApi, serviciosApi] = await Promise.all([
      this.hotelesService.cargarMunicipiosRemotos(),
      this.hotelesService.cargarServiciosRemotos()
    ]);

    if (municipiosApi && municipiosApi.length > 0) {
      const merged = new Set([...municipiosApi, ...this.municipiosMagdalena]);
      this.municipiosMagdalena = Array.from(merged);
    }

    if (serviciosApi && serviciosApi.length > 0) {
      const merged = new Set([...serviciosApi, ...this.serviciosDisponibles]);
      this.serviciosDisponibles = Array.from(merged);
    }
  }

  private programarGraficas(): void {
    if (this.graficasTimer) {
      clearTimeout(this.graficasTimer);
    }
    this.graficasTimer = setTimeout(() => {
      this.graficasTimer = null;
      if (!this.isDestroyed && this.seccion() === 'dashboard') {
        this.renderGraficas();
      }
    }, 80);
  }

  ngAfterViewInit(): void {
    if (this.seccion() === 'dashboard') {
      this.programarGraficas();
    }
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    if (this.graficasTimer) {
      clearTimeout(this.graficasTimer);
      this.graficasTimer = null;
    }
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    this.destruirGraficas();
    this.mapaHotelesComponent?.destruirMapa();
  }

  destruirGraficas(): void {
    if (this.donaChart) {
      this.donaChart.destroy();
      this.donaChart = null;
    }
    if (this.estrellasChart) {
      this.estrellasChart.destroy();
      this.estrellasChart = null;
    }
    if (this.municipiosChart) {
      this.municipiosChart.destroy();
      this.municipiosChart = null;
    }
  }

  renderGraficas(): void {
    if (typeof window === 'undefined') return;
    const graficasData = this.dashboardService.graficas();
    if (!graficasData) return;

    // 1. Gráfica de Dona: Disponibles vs No Disponibles (Verde y Rojo)
    if (this.donaCanvas?.nativeElement) {
      const ctx = this.donaCanvas.nativeElement.getContext('2d');
      if (ctx) {
        if (this.donaChart) this.donaChart.destroy();
        this.donaChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Disponibles', 'No disponibles'],
            datasets: [{
              data: [
                graficasData.disponibilidad.disponibles,
                graficasData.disponibilidad.noDisponibles
              ],
              backgroundColor: ['#10b981', '#ef4444'], // Verde para disponible, rojo para no disponible
              borderWidth: 2,
              borderColor: '#ffffff',
              hoverOffset: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  boxWidth: 14,
                  padding: 16,
                  font: { size: 12, family: "'Spectral', Georgia, serif", weight: 'bold' }
                }
              }
            },
            cutout: '68%'
          }
        });
      }
    }

    // 2. Gráfica de Barras: Hoteles por Estrellas (1 a 5)
    if (this.estrellasCanvas?.nativeElement) {
      const ctx = this.estrellasCanvas.nativeElement.getContext('2d');
      if (ctx) {
        if (this.estrellasChart) this.estrellasChart.destroy();
        this.estrellasChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['1 ⭐', '2 ⭐⭐', '3 ⭐⭐⭐', '4 ⭐⭐⭐⭐', '5 ⭐⭐⭐⭐⭐'],
            datasets: [{
              label: 'Cantidad de hoteles',
              data: graficasData.porEstrellas.map(e => e.total),
              backgroundColor: '#0284c7',
              borderRadius: 8,
              borderSkipped: false
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { stepSize: 1, precision: 0 }
              },
              x: {
                grid: { display: false }
              }
            }
          }
        });
      }
    }

    // 3. Gráfica de Barras Horizontales: Hoteles por Municipio
    if (this.municipiosCanvas?.nativeElement) {
      const ctx = this.municipiosCanvas.nativeElement.getContext('2d');
      if (ctx) {
        if (this.municipiosChart) this.municipiosChart.destroy();
        this.municipiosChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: graficasData.porMunicipio.map(m => m.municipio),
            datasets: [{
              label: 'Hoteles registrados',
              data: graficasData.porMunicipio.map(m => m.total),
              backgroundColor: '#f59e0b',
              borderRadius: 8,
              borderSkipped: false
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              x: {
                beginAtZero: true,
                ticks: { stepSize: 1, precision: 0 }
              },
              y: {
                grid: { display: false }
              }
            }
          }
        });
      }
    }
  }

  editarHotelPorId(hotelId: string): void {
    const hotel = this.hotelesService.dataset().hoteles.find(h => h.id === hotelId);
    if (hotel) {
      this.editarHotel(hotel);
    }
  }

  mostrarNotificacion(msg: string): void {
    this.toastMessage.set(msg);
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastTimer = null;
      if (!this.isDestroyed) {
        this.toastMessage.set(null);
      }
    }, 4000);
  }

  setSeccion(tab: PanelTab, hotelSub?: HotelSubTab): void {
    if ((tab === 'usuarios' || tab === 'catalogos') && !this.authService.isAdmin()) {
      return;
    }
    this.seccion.set(tab);
    if (tab === 'catalogos') {
      void this.sincronizarCatalogos();
    }
    if (tab === 'encuestas') {
      void this.cargarEncuestasYResultados();
    }
    if (tab === 'dashboard') {
      this.dashboardService.refrescarResumen();
      this.programarGraficas();
    } else {
      this.destruirGraficas();
      this.mapaHotelesComponent?.destruirMapa();
    }
    if (hotelSub) {
      if (hotelSub === 'crear' && !this.hotelEditId) {
        this.limpiarFormularioHotel();
      }
      this.subTabHoteles.set(hotelSub);
    }
  }

  setSubTabHoteles(sub: HotelSubTab): void {
    this.subTabHoteles.set(sub);
  }

  iniciarNuevaTarjeta(): void {
    this.limpiarFormularioHotel();
    this.subTabHoteles.set('crear');
  }

  setSubTabUsuarios(sub: UserSubTab): void {
    this.subTabUsuarios.set(sub);
  }

  setSubTabEncuestas(sub: EncuestaSubTab): void {
    this.subTabEncuestas.set(sub);
    if (sub === 'resultados') {
      void this.cargarEncuestasYResultados();
    }
  }

  cambiarCantidadPreguntas(cant: number): void {
    const num = Math.max(1, Math.min(20, cant || 1));
    this.cantidadPreguntas = num;
    while (this.preguntasForm.length < num) {
      this.preguntasForm.push({
        pregunta: '',
        tipoPregunta: 'opcion',
        obligatoria: true,
        opciones: ['Opción 1', 'Opción 2'],
        nuevaOpcion: ''
      });
    }
    if (this.preguntasForm.length > num) {
      this.preguntasForm = this.preguntasForm.slice(0, num);
    }
  }

  agregarPregunta(): void {
    this.preguntasForm.push({
      pregunta: '',
      tipoPregunta: 'opcion',
      obligatoria: true,
      opciones: ['Opción 1', 'Opción 2'],
      nuevaOpcion: ''
    });
    this.cantidadPreguntas = this.preguntasForm.length;
  }

  eliminarPregunta(index: number): void {
    if (this.preguntasForm.length <= 1) return;
    this.preguntasForm.splice(index, 1);
    this.cantidadPreguntas = this.preguntasForm.length;
  }

  agregarOpcionPregunta(preguntaIndex: number): void {
    const p = this.preguntasForm[preguntaIndex];
    const text = (p.nuevaOpcion || '').trim();
    if (text) {
      p.opciones.push(text);
      p.nuevaOpcion = '';
    }
  }

  eliminarOpcionPregunta(preguntaIndex: number, opcionIndex: number): void {
    this.preguntasForm[preguntaIndex].opciones.splice(opcionIndex, 1);
  }

  async guardarEncuesta(): Promise<void> {
    if (!this.encuestaTitulo.trim()) {
      this.mensajeErrorEncuesta.set('Por favor ingresa un título para la encuesta.');
      return;
    }

    const preguntasValidas = this.preguntasForm.filter(p => p.pregunta.trim().length > 0);
    if (preguntasValidas.length === 0) {
      this.mensajeErrorEncuesta.set('Debes ingresar al menos una pregunta válida.');
      return;
    }

    this.guardandoEncuesta.set(true);
    this.mensajeErrorEncuesta.set(null);
    this.mensajeExitoEncuesta.set(null);

    try {
      await this.encuestasService.crearEncuesta({
        titulo: this.encuestaTitulo.trim(),
        descripcion: this.encuestaDescripcion.trim(),
        activa: this.encuestaActiva,
        mostrarEnLanding: this.encuestaMostrarLanding,
        preguntas: preguntasValidas.map((p, idx) => ({
          pregunta: p.pregunta.trim(),
          tipoPregunta: p.tipoPregunta,
          obligatoria: p.obligatoria,
          orden: idx + 1,
          opciones: p.tipoPregunta === 'opcion'
            ? p.opciones.filter(o => o.trim().length > 0).map((texto, opIdx) => ({ texto: texto.trim(), orden: opIdx + 1 }))
            : []
        }))
      });

      this.mensajeExitoEncuesta.set('¡Encuesta guardada y configurada exitosamente!');
      await this.cargarEncuestasYResultados();
      setTimeout(() => {
        this.mensajeExitoEncuesta.set(null);
        this.setSubTabEncuestas('resultados');
      }, 1200);
    } catch (err: any) {
      this.mensajeErrorEncuesta.set(err?.message || 'Error al guardar la encuesta.');
    } finally {
      this.guardandoEncuesta.set(false);
    }
  }

  async cargarEncuestasYResultados(): Promise<void> {
    const list = await this.encuestasService.getEncuestas();
    if (list.length > 0) {
      const selectedId = this.encuestaSeleccionadaId() || list[0].id;
      await this.verResultados(selectedId);
    }
  }

  async verResultados(encuestaId: number): Promise<void> {
    this.encuestaSeleccionadaId.set(encuestaId);
    this.cargandoResultados.set(true);
    try {
      const res = await this.encuestasService.getResultados(encuestaId);
      this.resultadosActuales.set(res);
    } finally {
      this.cargandoResultados.set(false);
    }
  }

  async eliminarEncuesta(encuestaId: number): Promise<void> {
    if (!confirm('¿Estás seguro de que deseas eliminar esta encuesta?')) return;
    await this.encuestasService.eliminarEncuesta(encuestaId);
    await this.cargarEncuestasYResultados();
  }

  // GESTIÓN DE USUARIOS
  async crearUsuario(): Promise<void> {
    if (!this.userNombre.trim() || !this.userCorreo.trim() || !this.userPassword.trim()) {
      alert('Por favor completa todos los campos del usuario (Nombre, Correo y Contraseña).');
      return;
    }

    const res = await this.authService.crearUsuarioRemoto({
      nombreCompleto: this.userNombre,
      correo: this.userCorreo,
      password: this.userPassword,
      role: this.userRol
    });

    if (!res.exito || !res.usuario) {
      alert(res.error || 'No se pudo crear el usuario.');
      return;
    }

    // Limpiar formulario
    this.userNombre = '';
    this.userCorreo = '';
    this.userPassword = '';
    this.userRol = 'gestor';

    // Mostrar inmediatamente los usuarios creados
    this.subTabUsuarios.set('lista');
    this.dashboardService.refrescarResumen();
    this.mostrarNotificacion(`✓ Usuario «${res.usuario.nombreCompleto}» creado con éxito.`);
  }

  iniciarCambioPassword(userId: string): void {
    this.editingUserId.set(userId);
    this.newPasswordInput = '';
  }

  cancelarCambioPassword(): void {
    this.editingUserId.set(null);
    this.newPasswordInput = '';
  }

  async guardarPassword(userId: string): Promise<void> {
    if (!this.newPasswordInput.trim()) {
      alert('Ingresa la nueva contraseña.');
      return;
    }
    const res = await this.authService.cambiarPasswordRemoto(userId, this.newPasswordInput);
    if (res.exito) {
      this.editingUserId.set(null);
      this.newPasswordInput = '';
      this.mostrarNotificacion('✓ Contraseña actualizada correctamente.');
    } else {
      alert(res.error || 'No se pudo actualizar la contraseña.');
    }
  }

  openOwnPasswordModal(): void {
    this.ownCurrentPassword = '';
    this.ownNewPassword = '';
    this.ownConfirmPassword = '';
    this.ownPasswordError.set(null);
    this.showOwnPasswordModal.set(true);
  }

  closeOwnPasswordModal(): void {
    this.showOwnPasswordModal.set(false);
    this.ownPasswordError.set(null);
  }

  async submitOwnPassword(): Promise<void> {
    if (this.ownPasswordSaving()) return;

    const current = this.ownCurrentPassword.trim();
    const next = this.ownNewPassword.trim();
    const confirm = this.ownConfirmPassword.trim();

    if (!current || !next || !confirm) {
      this.ownPasswordError.set('Completa todos los campos.');
      return;
    }
    if (next.length < 6) {
      this.ownPasswordError.set('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (next !== confirm) {
      this.ownPasswordError.set('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    this.ownPasswordSaving.set(true);
    this.ownPasswordError.set(null);
    try {
      const res = await this.authService.cambiarMiPasswordRemoto(current, next);
      if (!res.exito) {
        this.ownPasswordError.set(res.error || 'No se pudo actualizar la contraseña.');
        return;
      }
      this.showOwnPasswordModal.set(false);
      this.mostrarNotificacion('✓ Tu contraseña ha sido actualizada correctamente.');
    } finally {
      this.ownPasswordSaving.set(false);
    }
  }

  async eliminarUsuario(user: UserAccount): Promise<void> {
    if (confirm(`¿Estás seguro de eliminar el usuario «${user.nombreCompleto}»?`)) {
      const res = await this.authService.eliminarUsuarioRemoto(user.id);
      if (res.exito) {
        this.dashboardService.refrescarResumen();
        this.mostrarNotificacion(`✓ Usuario «${user.nombreCompleto}» eliminado.`);
      } else {
        alert(res.error || 'No es posible eliminar el último Administrador del sistema.');
      }
    }
  }

  // GESTIÓN ADMINISTRATIVA DE CATÁLOGOS (MUNICIPIOS Y SERVICIOS)
  private refrescarListasLocalesDesdeCatalogo(): void {
    const muns = this.hotelesService.municipiosCatalogo().map(m => m.nombre.trim()).filter(Boolean);
    if (muns.length > 0) {
      this.municipiosMagdalena = Array.from(new Set([...muns, ...this.municipiosMagdalena]));
    }
    const servs = this.hotelesService.serviciosCatalogo().map(s => s.nombre.trim()).filter(Boolean);
    if (servs.length > 0) {
      this.serviciosDisponibles = Array.from(new Set([...servs, ...this.serviciosDisponibles]));
    }
  }

  editarCatalogoMunicipio(m: ApiMunicipioDto): void {
    this.catalogoMunicipioEditId = m.id;
    this.catalogoMunicipioNombre = m.nombre;
    this.catalogoMunicipioCiudad = m.ciudad ?? '';
    this.catalogoMunicipioDepto = m.departamento || 'Magdalena';
  }

  cancelarEdicionMunicipio(): void {
    this.catalogoMunicipioEditId = null;
    this.catalogoMunicipioNombre = '';
    this.catalogoMunicipioCiudad = '';
    this.catalogoMunicipioDepto = 'Magdalena';
  }

  async guardarCatalogoMunicipio(): Promise<void> {
    const nombre = this.catalogoMunicipioNombre.trim();
    if (!nombre) {
      this.mostrarNotificacion('Ingresa el nombre del municipio.');
      return;
    }

    this.catalogoSaving.set(true);
    try {
      if (this.catalogoMunicipioEditId) {
        const res = await this.hotelesService.actualizarMunicipioRemoto(
          this.catalogoMunicipioEditId,
          {
            nombre,
            ciudad: this.catalogoMunicipioCiudad.trim() || undefined,
            departamento: this.catalogoMunicipioDepto.trim() || 'Magdalena'
          }
        );
        if (!res.exito) {
          this.mostrarNotificacion(res.error || 'No se pudo actualizar el municipio.');
          return;
        }
        this.mostrarNotificacion(`✓ Municipio «${nombre}» actualizado.`);
      } else {
        const res = await this.hotelesService.crearMunicipioRemoto({
          nombre,
          ciudad: this.catalogoMunicipioCiudad.trim() || undefined,
          departamento: this.catalogoMunicipioDepto.trim() || 'Magdalena'
        });
        if (!res.exito) {
          this.mostrarNotificacion(res.error || 'No se pudo crear el municipio.');
          return;
        }
        this.mostrarNotificacion(`✓ Municipio «${nombre}» agregado.`);
      }

      this.refrescarListasLocalesDesdeCatalogo();
      this.cancelarEdicionMunicipio();
    } finally {
      this.catalogoSaving.set(false);
    }
  }

  async eliminarCatalogoMunicipio(m: ApiMunicipioDto): Promise<void> {
    if (!confirm(`¿Eliminar el municipio «${m.nombre}»?`)) return;
    const res = await this.hotelesService.eliminarMunicipioRemoto(m.id);
    if (!res.exito) {
      this.mostrarNotificacion(res.error || 'No se pudo eliminar el municipio.');
      return;
    }
    this.municipiosMagdalena = this.municipiosMagdalena.filter(item => item !== m.nombre);
    this.mostrarNotificacion(`✓ Municipio «${m.nombre}» eliminado.`);
  }

  async guardarCatalogoServicio(): Promise<void> {
    const nombre = this.catalogoServicioNombre.trim();
    if (!nombre) {
      this.mostrarNotificacion('Ingresa el nombre del servicio.');
      return;
    }

    this.catalogoSaving.set(true);
    try {
      const res = await this.hotelesService.crearServicioRemoto({
        nombre,
        nombreEn: this.catalogoServicioNombreEn.trim() || undefined
      });
      if (!res.exito) {
        this.mostrarNotificacion(res.error || 'No se pudo crear el servicio.');
        return;
      }
      this.catalogoServicioNombre = '';
      this.catalogoServicioNombreEn = '';
      this.refrescarListasLocalesDesdeCatalogo();
      this.mostrarNotificacion(`✓ Servicio «${nombre}» agregado.`);
    } finally {
      this.catalogoSaving.set(false);
    }
  }

  async eliminarCatalogoServicio(s: ApiServicioDto): Promise<void> {
    if (!confirm(`¿Eliminar el servicio «${s.nombre}»?`)) return;
    const res = await this.hotelesService.eliminarServicioRemoto(s.id);
    if (!res.exito) {
      this.mostrarNotificacion(res.error || 'No se pudo eliminar el servicio.');
      return;
    }
    this.serviciosDisponibles = this.serviciosDisponibles.filter(item => item !== s.nombre);
    this.mostrarNotificacion(`✓ Servicio «${s.nombre}» eliminado.`);
  }

  // GESTIÓN DE SERVICIOS EN EL FORMULARIO DE HOTEL
  getServIconAsset(serv: string): string | null {
    return getServiceIconAsset(serv);
  }

  toggleServicio(serv: string): void {
    const idx = this.serviciosSeleccionados.indexOf(serv);
    if (idx !== -1) {
      this.serviciosSeleccionados.splice(idx, 1);
    } else {
      this.serviciosSeleccionados.push(serv);
    }
  }

  agregarServicioPersonalizado(): void {
    const val = this.nuevoServicioInput.trim();
    if (val && !this.serviciosSeleccionados.includes(val)) {
      this.serviciosDisponibles.push(val);
      this.serviciosSeleccionados.push(val);
      this.nuevoServicioInput = '';
    }
  }

  // GESTIÓN DE FOTOS EN EL FORMULARIO DE HOTEL
  async subirFotosArchivo(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    input.value = '';

    const uploadResult = await this.hotelesService.subirImagenesRemotas(files, () =>
      Promise.all(
        files.map(
          file =>
            new Promise<string>(resolve => {
              const reader = new FileReader();
              reader.onload = e => resolve((e.target?.result as string) || '');
              reader.onerror = () => resolve('');
              reader.readAsDataURL(file);
            })
        )
      ).then(urls => urls.filter(Boolean))
    );

    if (!uploadResult.exito) {
      this.mostrarNotificacion(uploadResult.error || 'No se pudieron subir las fotos.');
      return;
    }

    this.hotelFotos.push(...uploadResult.urls);
  }

  agregarFotoPorUrl(): void {
    const url = this.nuevaFotoUrlInput.trim();
    if (url) {
      this.hotelFotos.push(url);
      this.nuevaFotoUrlInput = '';
    }
  }

  eliminarFotoHotel(index: number): void {
    this.hotelFotos.splice(index, 1);
  }

  seleccionarTipoTarjeta(tipo: CardType): void {
    this.cardType.set(tipo);
  }

  // GUARDAR O ACTUALIZAR TARJETA
  async guardarHotel(): Promise<void> {
    if (!this.hotelNombre.trim()) {
      alert(this.cardMeta().emptyNameAlert);
      return;
    }

    const latVal = this.hotelLatitud !== null && String(this.hotelLatitud).trim() !== ''
      ? Number(this.hotelLatitud)
      : undefined;
    const lngVal = this.hotelLongitud !== null && String(this.hotelLongitud).trim() !== ''
      ? Number(this.hotelLongitud)
      : undefined;

    const hotelData = {
      tipo: this.cardType(),
      nombre: this.hotelNombre.trim(),
      municipio: this.hotelMunicipio.trim() || 'Plato',
      estrellas: this.hotelEstrellas,
      disponible: true,
      whatsapp: this.hotelWhatsapp.trim(),
      facebook: this.hotelFacebook.trim(),
      instagram: this.hotelInstagram.trim(),
      x: this.hotelX.trim(),
      tiktok: this.hotelTikTok.trim(),
      paginaWeb: this.hotelPaginaWeb.trim(),
      ubicacion: this.hotelUbicacion.trim(),
      latitud: latVal !== undefined && Number.isFinite(latVal) ? latVal : undefined,
      longitud: lngVal !== undefined && Number.isFinite(lngVal) ? lngVal : undefined,
      fotos: [...this.hotelFotos],
      es: {
        desc: this.hotelDesc.trim(),
        serv: [...this.serviciosSeleccionados]
      },
      en: {
        desc: this.hotelDescEn.trim() || this.hotelDesc.trim(),
        serv: this.serviciosSeleccionados.map(s => this.traducirServicio(s))
      }
    };

    if (this.hotelEditId) {
      // Actualizar hotel existente
      const res = await this.hotelesService.actualizarTarjetaRemota({
        ...hotelData,
        id: this.hotelEditId
      });
      if (!res.exito) {
        alert(res.error || 'No se pudo actualizar la tarjeta.');
        return;
      }
      this.mostrarNotificacion(`✓ Tarjeta «${this.hotelNombre}» actualizada y sincronizada en el catálogo y portada.`);
      this.hotelEditId = null;
    } else {
      // Crear nuevo hotel
      const res = await this.hotelesService.crearTarjetaRemota(hotelData);
      if (!res.exito || !res.hotel) {
        alert(res.error || 'No se pudo crear la tarjeta.');
        return;
      }
      this.mostrarNotificacion(`✓ Tarjeta «${res.hotel.nombre}» creada y publicada con éxito en el catálogo y portada.`);
      this.limpiarFormularioHotel();
    }

    await this.hotelesService.sincronizarDesdeApi();
    this.dashboardService.refrescarResumen();
    this.subTabHoteles.set('catalogo');
  }

  editarHotel(hotel: Hotel): void {
    this.cardType.set(hotel.tipo || 'hotel');
    this.hotelEditId = hotel.id;
    this.hotelNombre = hotel.nombre;
    this.hotelMunicipio = hotel.municipio || 'Plato';
    this.hotelEstrellas = hotel.estrellas;
    this.hotelDesc = hotel.es.desc;
    this.hotelDescEn = hotel.en?.desc || hotel.es.desc;
    this.hotelWhatsapp = hotel.whatsapp;
    this.hotelFacebook = hotel.facebook || '';
    this.hotelInstagram = hotel.instagram || '';
    this.hotelX = hotel.x || '';
    this.hotelTikTok = hotel.tiktok || '';
    this.hotelPaginaWeb = hotel.paginaWeb || '';
    this.hotelUbicacion = hotel.ubicacion || '';
    this.hotelLatitud = hotel.latitud ?? null;
    this.hotelLongitud = hotel.longitud ?? null;
    this.hotelFotos = hotel.fotos ? [...hotel.fotos] : [];
    this.serviciosSeleccionados = hotel.es.serv ? [...hotel.es.serv] : [];

    this.seccion.set('hoteles');
    this.subTabHoteles.set('crear');
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        // Entornos de prueba jsdom
      }
    }
    this.mostrarNotificacion(`Editando «${hotel.nombre}». Modifica los campos y haz clic en Guardar Cambios.`);
  }

  limpiarFormularioHotel(): void {
    this.cardType.set('hotel');
    this.hotelEditId = null;
    this.hotelNombre = '';
    this.hotelMunicipio = 'Plato';
    this.hotelEstrellas = 3;
    this.hotelDesc = '';
    this.hotelDescEn = '';
    this.hotelWhatsapp = '';
    this.hotelFacebook = '';
    this.hotelInstagram = '';
    this.hotelX = '';
    this.hotelTikTok = '';
    this.hotelPaginaWeb = '';
    this.hotelUbicacion = '';
    this.hotelLatitud = null;
    this.hotelLongitud = null;
    this.hotelFotos = [];
    this.serviciosSeleccionados = [];
  }

  formatTelefono(tel: string | undefined): string {
    if (!tel) return 'No registrado';
    const digits = tel.replace(/\D/g, '');
    if (digits.startsWith('57') && digits.length === 12) {
      return digits.slice(2);
    }
    return digits || tel;
  }

  traducirServicio(s: string): string {
    const key = (s || '').toLowerCase().trim();
    const map: Record<string, string> = {
      'piscina': 'Pool',
      'aire acondicionado': 'Air Conditioning',
      'a/c': 'A/C',
      'parqueadero': 'Parking',
      'parqueadero privado': 'Private Parking',
      'wifi': 'Wi-Fi',
      'wifi de alta velocidad': 'High-Speed Wi-Fi',
      'restaurante': 'Restaurant',
      'restaurante de autor': 'Signature Restaurant',
      'vista al río': 'River View',
      'desayuno incluido': 'Breakfast Included',
      'desayuno típico': 'Traditional Breakfast',
      'recepción 24h': '24/7 Front Desk',
      'suites ejecutivas': 'Executive Suites',
      'bar y terraza': 'Bar & Terrace',
      'pet friendly': 'Pet Friendly',
      'centro': 'Downtown',
      'tv cable': 'Cable TV',
      'zona campestre': 'Countryside Area',
      'suites': 'Suites'
    };
    return map[key] || s;
  }

  async toggleHotelDisponible(hotel: Hotel): Promise<void> {
    const res = await this.hotelesService.toggleDisponibleRemoto(hotel.id);
    if (!res.exito) {
      alert(res.error || 'No se pudo cambiar el estado.');
      return;
    }
    await this.hotelesService.sincronizarDesdeApi();
    this.dashboardService.refrescarResumen();
  }

  async eliminarHotel(hotel: Hotel): Promise<void> {
    if (confirm(`¿Eliminar «${hotel.nombre}» de la portada y del sistema?`)) {
      const res = await this.hotelesService.eliminarTarjetaRemota(hotel.id);
      if (!res.exito) {
        alert(res.error || 'No se pudo eliminar la tarjeta.');
        return;
      }
      await this.hotelesService.sincronizarDesdeApi();
      this.dashboardService.refrescarResumen();
      this.mostrarNotificacion(`✓ Tarjeta de «${hotel.nombre}» eliminada.`);
      if (this.hotelEditId === hotel.id) {
        this.limpiarFormularioHotel();
      }
    }
  }

  getWhatsAppLink(hotel: Hotel): string {
    const num = (hotel.whatsapp || '').replace(/\D/g, '');
    const cleanNum = num.startsWith('57') ? num : '57' + num;
    const msg = encodeURIComponent(`Hola, vi el hotel ${hotel.nombre} en la página de Turismo y me gustaría consultar disponibilidad.`);
    return `https://wa.me/${cleanNum}?text=${msg}`;
  }

  getInstagramLink(hotel: Hotel): string {
    const raw = (hotel.instagram || '').trim();
    if (!raw) return 'https://instagram.com';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return `https://instagram.com/${raw.replace(/^@/, '')}`;
  }

  getFacebookLink(hotel: Hotel): string {
    const raw = (hotel.facebook || '').trim();
    if (!raw) return 'https://facebook.com';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return `https://facebook.com/${raw}`;
  }

  getXLink(hotel: Hotel): string {
    return buildXLink(hotel.x);
  }

  getTikTokLink(hotel: Hotel): string {
    const raw = (hotel.tiktok || '').trim();
    if (!raw) return 'https://tiktok.com';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return `https://tiktok.com/${raw.startsWith('@') ? raw : '@' + raw}`;
  }

  getPaginaWebLink(hotel: Hotel): string {
    const raw = (hotel.paginaWeb || '').trim();
    if (!raw) return '#';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return `https://${raw}`;
  }

  getUbicacionLink(hotel: Hotel): string {
    const raw = (hotel.ubicacion || '').trim();
    if (!raw) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.nombre + ' Plato Magdalena')}`;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(raw)}`;
  }

  getLiveWhatsAppLink(): string {
    const num = (this.hotelWhatsapp || '').replace(/\D/g, '');
    const cleanNum = num.startsWith('57') ? num : '57' + num;
    const msg = encodeURIComponent(`Hola, vi el hotel ${this.hotelNombre || 'Hotel'} en la página de Turismo y me gustaría consultar disponibilidad.`);
    return `https://wa.me/${cleanNum}?text=${msg}`;
  }

  getLiveInstagramLink(): string {
    const raw = (this.hotelInstagram || '').trim();
    if (!raw) return 'https://instagram.com';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return `https://instagram.com/${raw.replace(/^@/, '')}`;
  }

  getLiveFacebookLink(): string {
    const raw = (this.hotelFacebook || '').trim();
    if (!raw) return 'https://facebook.com';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return `https://facebook.com/${raw}`;
  }

  getLiveXLink(): string {
    return buildXLink(this.hotelX);
  }

  getLiveTikTokLink(): string {
    const raw = (this.hotelTikTok || '').trim();
    if (!raw) return 'https://tiktok.com';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return `https://tiktok.com/${raw.startsWith('@') ? raw : '@' + raw}`;
  }

  getLivePaginaWebLink(): string {
    const raw = (this.hotelPaginaWeb || '').trim();
    if (!raw) return '#';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return `https://${raw}`;
  }

  getLiveUbicacionLink(): string {
    const raw = (this.hotelUbicacion || '').trim();
    if (!raw) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((this.hotelNombre || 'Hotel') + ' Plato Magdalena')}`;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(raw)}`;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}

