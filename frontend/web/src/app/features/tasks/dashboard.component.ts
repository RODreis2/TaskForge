import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ApiService, TaskDetailResponse, TaskSummaryResponse } from '../../core/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <main class="forge-shell">
      <header class="forge-topbar">
        <div>
          <p class="forge-kicker">Task "FORGE"</p>
          <h1 class="forge-title">Forge Workspace</h1>
        </div>

        <div class="flex items-center gap-2">
          <button class="btn-ghost md:hidden" type="button" (click)="toggleSidebar()">Tasks</button>
          <button class="btn-secondary" type="button" (click)="logout()">Sair</button>
        </div>
      </header>

      <div class="forge-layout">
        <aside class="forge-sidebar" [class.forge-sidebar-open]="sidebarOpen">
          <div class="forge-sidebar-head">
            <h2>Tasks</h2>
            <p>{{ tasks.length }} total</p>
          </div>

          <div class="space-y-2">
            <input
              class="input forge-input"
              type="text"
              placeholder="Buscar task"
              [value]="searchTerm"
              (input)="onSearch($any($event.target).value)"
            />

            <select class="input forge-input" [value]="filter" (change)="onFilterChange($any($event.target).value)">
              <option value="ALL">Todas</option>
              <option value="WITH_BLOCKS">Com blocos</option>
              <option value="EMPTY">Sem blocos</option>
            </select>
          </div>

          <div class="mt-4 space-y-2 overflow-y-auto pr-1">
            <button
              *ngFor="let task of filteredTasks"
              type="button"
              class="forge-task-item"
              [class.forge-task-item-active]="task.id === activeTaskId"
              (click)="selectTask(task.id)"
            >
              <div class="flex items-center justify-between gap-2">
                <p class="truncate text-sm font-semibold">{{ task.title }}</p>
                <span class="forge-chip">{{ task.blockCount }}</span>
              </div>
              <p class="mt-1 line-clamp-2 text-xs text-zinc-300">{{ task.description }}</p>
            </button>

            <p *ngIf="!tasksLoading && filteredTasks.length === 0" class="px-1 text-sm text-zinc-400">
              Nenhuma task encontrada.
            </p>
            <p *ngIf="tasksLoading" class="px-1 text-sm text-zinc-400">Carregando tasks...</p>
          </div>
        </aside>

        <button *ngIf="sidebarOpen" type="button" class="forge-overlay md:hidden" (click)="toggleSidebar()"></button>

        <section class="forge-workspace">
          <article class="card forge-panel p-5">
            <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 class="text-2xl font-semibold">Nova task</h2>
                <p class="text-sm text-zinc-400">Crie e selecione automaticamente na barra lateral.</p>
              </div>
              <p *ngIf="taskStatus" class="text-sm text-amber-300">{{ taskStatus }}</p>
            </div>

            <form class="grid gap-3 md:grid-cols-2" [formGroup]="taskForm" (ngSubmit)="createTask()">
              <div>
                <label class="mb-1 block text-sm font-medium">Título</label>
                <input class="input forge-input" formControlName="title" type="text" />
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium">Descrição</label>
                <input class="input forge-input" formControlName="description" type="text" />
              </div>

              <div class="md:col-span-2">
                <button class="btn-primary" [disabled]="taskForm.invalid || taskLoading" type="submit">
                  {{ taskLoading ? 'Forjando...' : 'Criar task' }}
                </button>
              </div>
            </form>
          </article>

          <article class="card forge-panel p-5" *ngIf="activeTask as task">
            <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 class="text-2xl font-semibold">{{ task.title }}</h2>
                <p class="text-sm text-zinc-400">{{ task.description }}</p>
              </div>
              <p class="text-xs text-zinc-500">{{ task.blocks.length }} blocos</p>
            </div>

            <form class="grid gap-3 md:grid-cols-3" [formGroup]="blockForm" (ngSubmit)="createBlock()">
              <div>
                <label class="mb-1 block text-sm font-medium">Tipo</label>
                <select class="input forge-input" formControlName="type" (change)="onBlockTypeChange()">
                  <option value="TEXT">TEXT</option>
                  <option value="DRAW">DRAW</option>
                </select>
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium">Ordem</label>
                <input class="input forge-input" formControlName="orderIndex" type="number" min="0" />
              </div>

              <div class="md:col-span-3" *ngIf="blockForm.getRawValue().type === 'TEXT'">
                <label class="mb-1 block text-sm font-medium">Conteúdo texto</label>
                <textarea class="input forge-input min-h-24" formControlName="textContent"></textarea>
              </div>

              <div class="md:col-span-3" *ngIf="blockForm.getRawValue().type === 'DRAW'">
                <label class="mb-2 block text-sm font-medium">Área de desenho (stub)</label>
                <div class="forge-draw-stub">
                  <div class="forge-draw-toolbar">
                    <span>Lápis</span>
                    <span>Retângulo</span>
                    <span>Seta</span>
                  </div>
                  <div class="forge-grid"></div>
                </div>
              </div>

              <div class="md:col-span-3 flex items-center gap-3">
                <button class="btn-primary" [disabled]="blockForm.invalid || blockLoading" type="submit">
                  {{ blockLoading ? 'Fundindo...' : 'Adicionar bloco' }}
                </button>
                <p *ngIf="blockStatus" class="text-sm text-amber-300">{{ blockStatus }}</p>
              </div>
            </form>

            <div class="mt-6 space-y-2">
              <h3 class="text-lg font-semibold">Blocos da task</h3>
              <div *ngIf="task.blocks.length === 0" class="forge-empty">Sem blocos ainda.</div>
              <div *ngFor="let block of task.blocks" class="forge-block-item">
                <div class="flex items-center justify-between gap-2 text-xs text-zinc-400">
                  <span>{{ block.type }}</span>
                  <span>#{{ block.orderIndex }}</span>
                </div>
                <p *ngIf="block.type === 'TEXT'" class="mt-2 text-sm text-zinc-200">{{ block.textContent }}</p>
                <p *ngIf="block.type === 'DRAW'" class="mt-2 text-sm text-zinc-300">Bloco DRAW pronto para editor completo.</p>
              </div>
            </div>
          </article>

          <article *ngIf="!activeTask && !tasksLoading" class="card forge-panel p-8 text-center text-zinc-400">
            Selecione uma task na barra lateral para abrir o workspace.
          </article>
        </section>
      </div>
    </main>
  `
})
export class DashboardComponent implements OnInit {
  tasks: TaskSummaryResponse[] = [];
  filteredTasks: TaskSummaryResponse[] = [];
  activeTask: TaskDetailResponse | null = null;
  activeTaskId = '';

  searchTerm = '';
  filter: 'ALL' | 'WITH_BLOCKS' | 'EMPTY' = 'ALL';
  sidebarOpen = false;

  tasksLoading = false;
  taskLoading = false;
  blockLoading = false;
  taskStatus = '';
  blockStatus = '';

  taskForm = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required]]
  });

  blockForm = this.fb.nonNullable.group({
    type: ['TEXT' as 'TEXT' | 'DRAW', [Validators.required]],
    orderIndex: [0, [Validators.required]],
    textContent: ['']
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly api: ApiService
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  onSearch(value: string): void {
    this.searchTerm = value;
    this.applyFilters();
  }

  onFilterChange(value: 'ALL' | 'WITH_BLOCKS' | 'EMPTY'): void {
    this.filter = value;
    this.applyFilters();
  }

  onBlockTypeChange(): void {
    if (this.blockForm.getRawValue().type === 'DRAW') {
      this.blockForm.patchValue({ textContent: '' });
    }
  }

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
          this.taskStatus = 'Task criada com sucesso.';
          this.taskForm.reset({ title: '', description: '' });
          this.loadTasks(task.id);
        },
        error: () => {
          this.taskLoading = false;
          this.taskStatus = 'Erro ao criar task.';
        }
      });
  }

  createBlock(): void {
    if (!this.activeTaskId || this.blockForm.invalid || this.blockLoading) {
      return;
    }

    const value = this.blockForm.getRawValue();
    if (value.type === 'TEXT' && !value.textContent?.trim()) {
      this.blockStatus = 'Preencha o conteúdo do bloco TEXT.';
      return;
    }

    this.blockLoading = true;
    this.blockStatus = '';
    const now = new Date().toISOString();

    this.api
      .createBlock(this.activeTaskId, {
        type: value.type,
        orderIndex: Number(value.orderIndex),
        textContent: value.type === 'TEXT' ? value.textContent : '',
        drawingData: value.type === 'DRAW' ? '{}' : '',
        createdAt: now,
        updatedAt: now
      })
      .subscribe({
        next: () => {
          this.blockLoading = false;
          this.blockStatus = 'Bloco adicionado com sucesso.';
          this.loadTaskDetail(this.activeTaskId);
        },
        error: () => {
          this.blockLoading = false;
          this.blockStatus = 'Erro ao adicionar bloco.';
        }
      });
  }

  selectTask(taskId: string): void {
    if (!taskId || this.activeTaskId === taskId) {
      this.sidebarOpen = false;
      return;
    }

    this.activeTaskId = taskId;
    this.loadTaskDetail(taskId);
    this.sidebarOpen = false;
  }

  private loadTasks(preferredTaskId?: string): void {
    this.tasksLoading = true;

    this.api.listTasks().subscribe({
      next: (tasks) => {
        this.tasksLoading = false;
        this.tasks = tasks;
        this.applyFilters();

        const selectedTaskId = preferredTaskId ?? this.activeTaskId ?? tasks[0]?.id ?? '';
        if (selectedTaskId) {
          this.activeTaskId = selectedTaskId;
          this.loadTaskDetail(selectedTaskId);
        } else {
          this.activeTask = null;
        }
      },
      error: () => {
        this.tasksLoading = false;
        this.tasks = [];
        this.filteredTasks = [];
      }
    });
  }

  private loadTaskDetail(taskId: string): void {
    this.api.getTask(taskId).subscribe({
      next: (task) => {
        this.activeTask = task;
        this.blockForm.patchValue({ orderIndex: task.blocks.length });
      },
      error: () => {
        this.activeTask = null;
      }
    });
  }

  private applyFilters(): void {
    const normalizedSearch = this.searchTerm.toLowerCase().trim();

    this.filteredTasks = this.tasks.filter((task) => {
      const matchesSearch =
        (task.title ?? '').toLowerCase().includes(normalizedSearch) ||
        (task.description ?? '').toLowerCase().includes(normalizedSearch);

      if (this.filter === 'WITH_BLOCKS') {
        return matchesSearch && task.blockCount > 0;
      }

      if (this.filter === 'EMPTY') {
        return matchesSearch && task.blockCount === 0;
      }

      return matchesSearch;
    });
  }
}
