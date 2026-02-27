import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Subject, EMPTY, debounceTime, switchMap, tap, catchError } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import {
  ApiService,
  FolderResponse,
  TaskDocumentContent,
  TaskDocumentResponse,
  TaskTreeItemResponse
} from '../../core/api.service';

type TreeRow =
  | {
      kind: 'folder';
      id: string;
      name: string;
      prefix: string;
      expanded: boolean;
      selected: boolean;
      matched: boolean;
    }
  | {
      kind: 'task';
      id: string;
      title: string;
      folderId: string | null;
      prefix: string;
      active: boolean;
      matched: boolean;
    };

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <main class="obs-shell" [class.obs-shell-collapsed]="sidebarCollapsed">
      <aside class="obs-tree" [class.obs-tree-open]="sidebarOpen">
        <div class="obs-tree-head">
          <h1>TaskForge</h1>
          <div class="flex items-center gap-2">
            <button class="btn-ghost !px-2 !py-1" type="button" (click)="createFolder()">+ pasta</button>
            <button class="btn-ghost !px-2 !py-1" type="button" (click)="logout()">Sair</button>
          </div>
        </div>

        <div class="obs-tree-create">
          <input
            class="input obs-input !py-1 !text-sm"
            type="text"
            placeholder="Novo arquivo nesta pasta"
            [value]="newTaskTitle"
            (input)="newTaskTitle = $any($event.target).value"
            (keydown.enter)="createTask()"
          />
          <button class="btn-primary !px-2 !py-1 !text-xs" type="button" (click)="createTask()">Criar</button>
        </div>

        <div class="obs-tree-scroll">
          <button
            *ngFor="let row of treeRows"
            type="button"
            class="obs-tree-row"
            [class.obs-tree-row-folder]="row.kind === 'folder'"
            [class.obs-tree-row-active]="row.kind === 'task' ? row.active : row.selected"
            [class.obs-tree-row-match]="row.matched && !!searchTerm"
            (click)="onRowClick(row)"
          >
            <span class="obs-tree-prefix">{{ row.prefix }}</span>
            <span *ngIf="row.kind === 'folder'" class="obs-tree-label">{{ row.expanded ? '▾ ' : '▸ ' }}{{ row.name }}</span>
            <span *ngIf="row.kind === 'task'" class="obs-tree-label">{{ row.title || '(sem título)' }}</span>
          </button>
        </div>
      </aside>

      <button *ngIf="sidebarOpen" type="button" class="forge-overlay md:hidden" (click)="toggleSidebarMobile()"></button>

      <section class="obs-work">
        <header class="obs-work-head">
          <div class="flex items-center gap-2">
            <button class="btn-ghost md:hidden" type="button" (click)="toggleSidebarMobile()">Pastas</button>
            <button class="btn-ghost hidden md:inline-flex" type="button" (click)="sidebarCollapsed = !sidebarCollapsed">
              {{ sidebarCollapsed ? 'Mostrar árvore' : 'Ocultar árvore' }}
            </button>
          </div>
          <input
            class="input obs-input obs-search"
            type="text"
            placeholder="Buscar (não oculta a árvore)"
            [value]="searchTerm"
            (input)="onSearch($any($event.target).value)"
          />
        </header>

        <article *ngIf="activeTaskId; else emptyState" class="obs-doc">
          <div class="obs-doc-head">
            <p class="obs-meta">Task: {{ activeTaskId }}</p>
            <p class="obs-meta">
              {{ saveState === 'saving' ? 'Salvando...' : saveState === 'saved' ? 'Salvo' : saveState === 'error' ? 'Erro ao salvar' : '' }}
            </p>
          </div>

          <div class="obs-editor-grid">
            <section class="obs-panel">
              <h3>Texto</h3>
              <textarea
                class="input obs-input min-h-40"
                [value]="documentDraft.text"
                placeholder="Escreva aqui..."
                (input)="onTextChange($any($event.target).value)"
              ></textarea>
            </section>

            <section class="obs-panel">
              <h3>Desenho</h3>
              <canvas
                #drawCanvas
                class="obs-canvas"
                width="1200"
                height="520"
                (pointerdown)="startDrawing($event)"
                (pointermove)="draw($event)"
                (pointerup)="stopDrawing()"
                (pointerleave)="stopDrawing()"
              ></canvas>
              <div class="flex items-center gap-2">
                <button class="btn-secondary" type="button" (click)="clearCanvas()">Limpar</button>
              </div>
            </section>
          </div>
        </article>

        <ng-template #emptyState>
          <article class="obs-empty">Escolha um arquivo na árvore à esquerda ou crie um novo.</article>
        </ng-template>
      </section>
    </main>
  `
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private static readonly EXPANDED_KEY = 'taskforge.tree.expanded';
  private static readonly INBOX_ID = '__inbox__';

  @ViewChild('drawCanvas') drawCanvasRef?: ElementRef<HTMLCanvasElement>;

  folders: FolderResponse[] = [];
  tasks: TaskTreeItemResponse[] = [];
  treeRows: TreeRow[] = [];
  expandedFolderIds = new Set<string>([DashboardComponent.INBOX_ID]);

  selectedFolderId: string | null = null;
  activeTaskId = '';
  newTaskTitle = '';
  searchTerm = '';
  saveState: SaveState = 'idle';

  sidebarOpen = false;
  sidebarCollapsed = false;

  documentDraft: TaskDocumentContent = { text: '', drawing: { strokes: [] } };
  private documentVersion: number | null = null;
  private saveQueue$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  private isDrawing = false;
  private currentStroke: { color: string; width: number; points: Array<[number, number]> } | null = null;

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadExpandedState();
    this.setupAutosave();
    this.loadTree();
  }

  ngAfterViewInit(): void {
    this.renderCanvas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebarMobile(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  onSearch(value: string): void {
    this.searchTerm = value.toLowerCase().trim();
    this.rebuildTreeRows();
  }

  logout(): void {
    this.auth.logout().subscribe();
  }

  createFolder(): void {
    const name = window.prompt('Nome da pasta');
    if (!name || !name.trim()) {
      return;
    }

    this.api
      .createFolder({
        name: name.trim(),
        parentId: this.selectedFolderId
      })
      .subscribe({
        next: (folder) => {
          this.folders = [...this.folders, folder];
          this.expandedFolderIds.add(folder.id);
          this.persistExpandedState();
          this.rebuildTreeRows();
        }
      });
  }

  createTask(): void {
    const title = this.newTaskTitle.trim();
    if (!title) {
      return;
    }

    const now = new Date().toISOString();
    this.api
      .createTask({
        title,
        description: '',
        folderId: this.selectedFolderId,
        createdAt: now,
        updatedAt: now
      })
      .subscribe({
        next: (task) => {
          this.newTaskTitle = '';
          this.tasks = [
            {
              id: task.id,
              title: task.title,
              description: task.description,
              folderId: this.selectedFolderId,
              updatedAt: now
            },
            ...this.tasks
          ];
          this.rebuildTreeRows();
          this.selectTask(task.id);
        }
      });
  }

  onRowClick(row: TreeRow): void {
    if (row.kind === 'folder') {
      const folderId = row.id === DashboardComponent.INBOX_ID ? null : row.id;
      this.selectedFolderId = folderId;
      if (this.expandedFolderIds.has(row.id)) {
        this.expandedFolderIds.delete(row.id);
      } else {
        this.expandedFolderIds.add(row.id);
      }
      this.persistExpandedState();
      this.rebuildTreeRows();
      return;
    }

    this.selectTask(row.id);
  }

  private selectTask(taskId: string): void {
    this.activeTaskId = taskId;
    this.sidebarOpen = false;
    this.api.getTaskDocument(taskId).subscribe({
      next: (doc) => {
        this.applyDocument(doc);
      }
    });
  }

  private applyDocument(doc: TaskDocumentResponse): void {
    this.documentVersion = doc.version;
    this.documentDraft = doc.content ?? { text: '', drawing: { strokes: [] } };
    if (!this.documentDraft.drawing) {
      this.documentDraft.drawing = { strokes: [] };
    }
    if (!this.documentDraft.drawing.strokes) {
      this.documentDraft.drawing.strokes = [];
    }
    this.saveState = 'idle';
    this.renderCanvas();
  }

  private setupAutosave(): void {
    this.saveQueue$
      .pipe(
        debounceTime(800),
        tap(() => (this.saveState = 'saving')),
        switchMap(() => {
          if (!this.activeTaskId) {
            this.saveState = 'idle';
            return EMPTY;
          }

          return this.api
            .upsertTaskDocument(this.activeTaskId, {
              content: this.documentDraft,
              version: this.documentVersion
            })
            .pipe(
              tap((response) => {
                this.documentVersion = response.version;
                this.saveState = 'saved';
              }),
              catchError(() => {
                this.saveState = 'error';
                return EMPTY;
              })
            );
        })
      )
      .subscribe();
  }

  onTextChange(value: string): void {
    this.documentDraft = {
      ...this.documentDraft,
      text: value
    };
    this.queueSave();
  }

  startDrawing(event: PointerEvent): void {
    if (!this.drawCanvasRef) {
      return;
    }

    const point = this.pointerToCanvas(event, this.drawCanvasRef.nativeElement);
    this.currentStroke = {
      color: '#d6deed',
      width: 2,
      points: [point]
    };
    this.isDrawing = true;
  }

  draw(event: PointerEvent): void {
    if (!this.isDrawing || !this.currentStroke || !this.drawCanvasRef) {
      return;
    }

    const point = this.pointerToCanvas(event, this.drawCanvasRef.nativeElement);
    this.currentStroke.points.push(point);
    this.renderCanvas();
    this.drawStroke(this.currentStroke);
  }

  stopDrawing(): void {
    if (!this.isDrawing || !this.currentStroke) {
      return;
    }

    if (this.currentStroke.points.length > 1) {
      this.documentDraft = {
        ...this.documentDraft,
        drawing: {
          strokes: [...this.documentDraft.drawing.strokes, this.currentStroke]
        }
      };
      this.queueSave();
    }

    this.currentStroke = null;
    this.isDrawing = false;
    this.renderCanvas();
  }

  clearCanvas(): void {
    this.documentDraft = {
      ...this.documentDraft,
      drawing: {
        strokes: []
      }
    };
    this.queueSave();
    this.renderCanvas();
  }

  private queueSave(): void {
    this.saveQueue$.next();
  }

  private loadTree(): void {
    this.api.getTree().subscribe({
      next: (tree) => {
        this.folders = tree.folders ?? [];
        this.tasks = tree.tasks ?? [];
        this.rebuildTreeRows();
      }
    });
  }

  private rebuildTreeRows(): void {
    const rows: TreeRow[] = [];
    rows.push({
      kind: 'folder',
      id: DashboardComponent.INBOX_ID,
      name: 'Inbox',
      prefix: '',
      expanded: this.expandedFolderIds.has(DashboardComponent.INBOX_ID),
      selected: this.selectedFolderId === null,
      matched: this.matchesSearch('Inbox')
    });

    if (this.expandedFolderIds.has(DashboardComponent.INBOX_ID)) {
      const inboxTasks = this.tasks.filter((task) => !task.folderId);
      inboxTasks.forEach((task, index) => {
        rows.push({
          kind: 'task',
          id: task.id,
          title: task.title,
          folderId: null,
          prefix: index === inboxTasks.length - 1 ? '└─ ' : '├─ ',
          active: task.id === this.activeTaskId,
          matched: this.matchesSearch(task.title) || this.matchesSearch(task.description)
        });
      });
    }

    this.buildFolderRows(rows, null, []);
    this.treeRows = rows;
  }

  private buildFolderRows(rows: TreeRow[], parentId: string | null, ancestorsHasNext: boolean[]): void {
    const folders = this.folders
      .filter((folder) => (folder.parentId ?? null) === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));

    folders.forEach((folder, index) => {
      const isLastFolder = index === folders.length - 1;
      const prefix = this.buildPrefix(ancestorsHasNext, isLastFolder);
      const expanded = this.expandedFolderIds.has(folder.id);

      rows.push({
        kind: 'folder',
        id: folder.id,
        name: folder.name,
        prefix,
        expanded,
        selected: this.selectedFolderId === folder.id,
        matched: this.matchesSearch(folder.name)
      });

      if (!expanded) {
        return;
      }

      const childTasks = this.tasks.filter((task) => (task.folderId ?? null) === folder.id);
      childTasks.forEach((task, taskIndex) => {
        const isLastTask = taskIndex === childTasks.length - 1;
        const taskPrefix = this.buildPrefix([...ancestorsHasNext, !isLastFolder], isLastTask);
        rows.push({
          kind: 'task',
          id: task.id,
          title: task.title,
          folderId: folder.id,
          prefix: taskPrefix,
          active: task.id === this.activeTaskId,
          matched: this.matchesSearch(task.title) || this.matchesSearch(task.description)
        });
      });

      this.buildFolderRows(rows, folder.id, [...ancestorsHasNext, !isLastFolder]);
    });
  }

  private buildPrefix(ancestorsHasNext: boolean[], isLast: boolean): string {
    const chain = ancestorsHasNext.map((hasNext) => (hasNext ? '│  ' : '   ')).join('');
    return `${chain}${isLast ? '└─ ' : '├─ '}`;
  }

  private matchesSearch(value?: string): boolean {
    if (!this.searchTerm) {
      return false;
    }
    return (value ?? '').toLowerCase().includes(this.searchTerm);
  }

  private pointerToCanvas(event: PointerEvent, canvas: HTMLCanvasElement): [number, number] {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return [(event.clientX - rect.left) * scaleX, (event.clientY - rect.top) * scaleY];
  }

  private renderCanvas(): void {
    if (!this.drawCanvasRef) {
      return;
    }

    const canvas = this.drawCanvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#101319';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.documentDraft.drawing.strokes.forEach((stroke) => this.drawStroke(stroke, ctx));
  }

  private drawStroke(
    stroke: { color: string; width: number; points: Array<[number, number]> },
    providedCtx?: CanvasRenderingContext2D
  ): void {
    if (!this.drawCanvasRef && !providedCtx) {
      return;
    }

    const ctx = providedCtx ?? this.drawCanvasRef!.nativeElement.getContext('2d');
    if (!ctx || stroke.points.length < 2) {
      return;
    }

    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(stroke.points[0][0], stroke.points[0][1]);
    for (let i = 1; i < stroke.points.length; i += 1) {
      ctx.lineTo(stroke.points[i][0], stroke.points[i][1]);
    }
    ctx.stroke();
  }

  private persistExpandedState(): void {
    localStorage.setItem(DashboardComponent.EXPANDED_KEY, JSON.stringify(Array.from(this.expandedFolderIds)));
  }

  private loadExpandedState(): void {
    const raw = localStorage.getItem(DashboardComponent.EXPANDED_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed)) {
        this.expandedFolderIds = new Set(parsed);
        if (!this.expandedFolderIds.has(DashboardComponent.INBOX_ID)) {
          this.expandedFolderIds.add(DashboardComponent.INBOX_ID);
        }
      }
    } catch {
      this.expandedFolderIds = new Set([DashboardComponent.INBOX_ID]);
    }
  }
}
