import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <main class="mx-auto max-w-6xl px-4 py-8">
      <header class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-3xl font-bold">TaskForge Dashboard</h1>
          <p class="text-slate-600">Crie tarefas e adicione blocos no mesmo fluxo.</p>
        </div>
        <button class="btn-secondary" type="button" (click)="logout()">Sair</button>
      </header>

      <section class="grid gap-6 md:grid-cols-2">
        <article class="card p-6">
          <h2 class="text-xl font-semibold">Nova tarefa</h2>
          <form class="mt-4 space-y-3" [formGroup]="taskForm" (ngSubmit)="createTask()">
            <div>
              <label class="mb-1 block text-sm font-medium">Título</label>
              <input class="input" formControlName="title" type="text" />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium">Descrição</label>
              <textarea class="input min-h-24" formControlName="description"></textarea>
            </div>

            <button class="btn-primary" [disabled]="taskForm.invalid || taskLoading" type="submit">
              {{ taskLoading ? 'Criando...' : 'Criar tarefa' }}
            </button>
          </form>
          <p *ngIf="taskStatus" class="mt-3 text-sm text-slate-700">{{ taskStatus }}</p>
          <p *ngIf="taskId" class="mt-2 text-xs text-slate-500">Task ID: {{ taskId }}</p>
        </article>

        <article class="card p-6">
          <h2 class="text-xl font-semibold">Adicionar bloco</h2>
          <form class="mt-4 space-y-3" [formGroup]="blockForm" (ngSubmit)="createBlock()">
            <div>
              <label class="mb-1 block text-sm font-medium">Task ID</label>
              <input class="input" formControlName="taskId" type="text" placeholder="UUID da tarefa" />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium">Tipo</label>
              <select class="input" formControlName="type">
                <option value="TEXT">TEXT</option>
                <option value="DRAW">DRAW</option>
              </select>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium">Ordem</label>
              <input class="input" formControlName="orderIndex" type="number" min="0" />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium">Conteúdo texto</label>
              <textarea class="input min-h-24" formControlName="textContent"></textarea>
            </div>

            <button class="btn-primary" [disabled]="blockForm.invalid || blockLoading" type="submit">
              {{ blockLoading ? 'Adicionando...' : 'Adicionar bloco' }}
            </button>
          </form>
          <p *ngIf="blockStatus" class="mt-3 text-sm text-slate-700">{{ blockStatus }}</p>
        </article>
      </section>
    </main>
  `
})
export class DashboardComponent {
  taskLoading = false;
  blockLoading = false;
  taskId = '';
  taskStatus = '';
  blockStatus = '';

  taskForm = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required]]
  });

  blockForm = this.fb.nonNullable.group({
    taskId: ['', [Validators.required]],
    type: ['TEXT' as 'TEXT' | 'DRAW', [Validators.required]],
    orderIndex: [0, [Validators.required]],
    textContent: ['']
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly api: ApiService
  ) {}

  logout(): void {
    this.auth.logout().subscribe({
      error: () => {
        this.blockStatus = 'Não foi possível encerrar a sessão.';
      }
    });
  }

  createTask(): void {
    if (this.taskForm.invalid || this.taskLoading) {
      return;
    }

    this.taskLoading = true;
    this.taskStatus = '';

    const now = new Date().toISOString();
    this.api
      .createTask({
        title: this.taskForm.getRawValue().title,
        description: this.taskForm.getRawValue().description,
        createdAt: now,
        updatedAt: now
      })
      .subscribe({
        next: (task) => {
          this.taskLoading = false;
          this.taskId = task.id;
          this.blockForm.patchValue({ taskId: task.id });
          this.taskStatus = 'Tarefa criada com sucesso.';
        },
        error: () => {
          this.taskLoading = false;
          this.taskStatus = 'Erro ao criar tarefa.';
        }
      });
  }

  createBlock(): void {
    if (this.blockForm.invalid || this.blockLoading) {
      return;
    }

    this.blockLoading = true;
    this.blockStatus = '';
    const value = this.blockForm.getRawValue();
    const now = new Date().toISOString();

    this.api
      .createBlock(value.taskId, {
        type: value.type,
        orderIndex: Number(value.orderIndex),
        textContent: value.textContent,
        drawingData: value.type === 'DRAW' ? '{}' : '',
        createdAt: now,
        updatedAt: now
      })
      .subscribe({
        next: () => {
          this.blockLoading = false;
          this.blockStatus = 'Bloco adicionado com sucesso.';
        },
        error: () => {
          this.blockLoading = false;
          this.blockStatus = 'Erro ao adicionar bloco.';
        }
      });
  }
}
