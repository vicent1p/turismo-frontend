import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly email = signal<string>('');
  readonly password = signal<string>('');
  readonly errorMensaje = signal<string | null>(null);
  readonly loading = signal<boolean>(false);
  readonly mostrarAyudaClave = signal<boolean>(false);

  toggleAyudaClave(event: Event): void {
    event.preventDefault();
    this.mostrarAyudaClave.update(v => !v);
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.loading()) return;

    const mail = this.email().trim();
    const pass = this.password().trim();

    if (!mail || !pass) {
      this.errorMensaje.set('Por favor ingresa tu correo y contraseña.');
      return;
    }

    this.loading.set(true);
    this.errorMensaje.set(null);

    try {
      const res = await this.authService.loginRemoto(mail, pass);
      if (res.exito) {
        this.errorMensaje.set(null);
        await this.router.navigate(['/panel']);
      } else {
        this.errorMensaje.set(res.error || 'Credenciales no válidas.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}

