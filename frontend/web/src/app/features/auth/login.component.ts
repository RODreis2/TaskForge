import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <main class="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4">
      <section class="card w-full max-w-md p-8">
        <h1 class="text-2xl font-bold">Entrar no TaskForge</h1>
        <p class="mt-2 text-sm text-slate-600">Use seu e-mail e senha para acessar o dashboard.</p>

        <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="submit()">
          <div>
            <label class="mb-1 block text-sm font-medium">E-mail</label>
            <input class="input" formControlName="email" type="email" placeholder="nome@empresa.com" />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium">Senha</label>
            <input class="input" formControlName="password" type="password" placeholder="********" />
          </div>

          <p *ngIf="error" class="text-sm text-red-600">{{ error }}</p>

          <button class="btn-primary w-full" [disabled]="form.invalid || loading" type="submit">
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>

        <p class="mt-4 text-sm text-slate-600">
          Não possui conta?
          <a routerLink="/register" class="font-semibold text-accent">Criar conta</a>
        </p>
      </section>
    </main>
  `
})
export class LoginComponent {
  loading = false;
  error = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(3)]]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  submit(): void {
    if (this.form.invalid || this.loading) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.auth
      .login({ name: '', email: this.form.getRawValue().email, password: this.form.getRawValue().password })
      .subscribe({
        next: () => {
          this.loading = false;
          void this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.loading = false;
          this.error = 'Usuário ou senha inválidos.';
        }
      });
  }
}
