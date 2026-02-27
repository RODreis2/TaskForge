import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <main class="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4">
      <section class="card w-full max-w-md p-8">
        <h1 class="text-2xl font-bold">Criar conta</h1>
        <p class="mt-2 text-sm text-slate-600">Cadastre-se para gerenciar tarefas e blocos.</p>

        <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="submit()">
          <div>
            <label class="mb-1 block text-sm font-medium">Nome</label>
            <input class="input" formControlName="name" type="text" placeholder="Seu nome" />
          </div>

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
            {{ loading ? 'Criando...' : 'Criar conta' }}
          </button>
        </form>

        <p class="mt-4 text-sm text-slate-600">
          Já possui conta?
          <a routerLink="/login" class="font-semibold text-accent">Fazer login</a>
        </p>
      </section>
    </main>
  `
})
export class RegisterComponent {
  loading = false;
  error = '';

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
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

    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading = false;
        void this.router.navigate(['/login']);
      },
      error: () => {
        this.loading = false;
        this.error = 'Falha ao criar conta. Verifique os dados.';
      }
    });
  }
}
