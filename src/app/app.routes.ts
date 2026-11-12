import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent)
  },
  {
    path: 'historia',
    loadComponent: () => import('./pages/historia/historia').then(m => m.HistoriaComponent)
  },
  {
    path: 'cultura',
    loadComponent: () => import('./pages/cultura/cultura').then(m => m.CulturaComponent)
  },
  {
    path: 'programacion',
    loadComponent: () => import('./pages/programacion/programacion').then(m => m.ProgramacionComponent)
  },
  {
    path: 'lugares',
    loadComponent: () => import('./pages/lugares/lugares').then(m => m.LugaresComponent)
  },
  {
    path: 'administrador',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'admini',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'administracion',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'panel',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/panel/panel').then(m => m.PanelComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
