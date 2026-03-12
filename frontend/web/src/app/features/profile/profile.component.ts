import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <main class="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
      <section class="card w-full max-w-2xl p-8">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Perfil</p>
            <h1 class="mt-2 text-3xl font-bold text-slate-900">Atualize sua conta</h1>
            <p class="mt-2 text-sm text-slate-600">Altere nome, e-mail e senha sem sair do fluxo.</p>
          </div>
          <div class="flex gap-2">
            <a routerLink="/" class="btn-ghost !border-slate-300 !text-slate-700 hover:!bg-slate-100">Home</a>
            <a routerLink="/dashboard" class="btn-primary">Dashboard</a>
          </div>
        </div>

        <form class="mt-8 space-y-5" [formGroup]="form" (ngSubmit)="submit()">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Nome</label>
            <input class="input" formControlName="name" type="text" placeholder="Seu nome" />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
            <input class="input" formControlName="email" type="email" placeholder="nome@empresa.com" />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Nova senha</label>
            <input class="input" formControlName="password" type="password" placeholder="Deixe em branco para manter" />
            <p class="mt-1 text-xs text-slate-500">Opcional. Preencha apenas se quiser alterar a senha.</p>
          </div>

          <p *ngIf="success" class="text-sm font-medium text-emerald-700">{{ success }}</p>
          <p *ngIf="error" class="text-sm font-medium text-red-600">{{ error }}</p>

          <div class="flex flex-wrap gap-3">
            <button class="btn-primary" [disabled]="form.invalid || loading" type="submit">
              {{ loading ? 'Salvando...' : 'Salvar alterações' }}
            </button>
            <button class="btn-secondary" type="button" (click)="logout()" [disabled]="loading">Sair</button>
          </div>
        </form>
      </section>
    </main>
  `
})
export class ProfileComponent implements OnInit {
  loading = false;
  error = '';
  success = '';

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(3)]]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      this.form.patchValue({ name: currentUser.name, email: currentUser.email, password: '' });
      return;
    }

    this.auth.checkSession().subscribe(() => {
      const user = this.auth.currentUser;
      if (user) {
        this.form.patchValue({ name: user.name, email: user.email, password: '' });
      }
    });
  }

  submit(): void {
    if (this.form.invalid || this.loading) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const value = this.form.getRawValue();
    const payload = {
      name: value.name.trim(),
      email: value.email.trim(),
      ...(value.password.trim() ? { password: value.password.trim() } : {})
    };

    this.auth.updateProfile(payload).subscribe({
      next: (user) => {
        this.loading = false;
        this.success = 'Perfil atualizado com sucesso.';
        this.form.patchValue({ name: user.name, email: user.email, password: '' });
      },
      error: () => {
        this.loading = false;
        this.error = 'Não foi possível atualizar o perfil.';
      }
    });
  }

  logout(): void {
    this.auth.logout().subscribe();
  }
}
