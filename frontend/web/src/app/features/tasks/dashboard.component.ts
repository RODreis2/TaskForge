import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ApiService, BlockResponse, FolderResponse, TaskDetailResponse, TaskTreeItemResponse } from '../../core/api.service';

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

type Stroke = {
  color: string;
  width: number;
  points: Array<[number, number]>;
};

type WorkspaceBlock = {
  id: string;
  type: 'TEXT' | 'DRAW';
  orderIndex: number;
  textContent: string;
  drawingData: string;
  x: number;
  y: number;
};

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
            placeholder="Nova task nesta pasta"
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

      <section class="obs-work" (click)="closeContextMenu()">
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

        <article *ngIf="activeTaskId; else emptyState" class="obs-workspace-wrap">
          <div class="obs-doc-head">
            <p class="obs-meta">Task: {{ activeTaskId }}</p>
            <p class="obs-meta">Botão direito no quadro para criar bloco</p>
          </div>

          <div
            #workspaceBoard
            class="obs-workspace-board"
            (contextmenu)="onWorkspaceContextMenu($event)"
            (pointerdown)="startWorkspaceDrawing($event)"
            (pointermove)="drawWorkspace($event)"
            (pointerup)="stopWorkspaceDrawing()"
            (pointerleave)="stopWorkspaceDrawing()"
          >
            <canvas #workspaceCanvas class="obs-workspace-canvas"></canvas>

            <article
              *ngFor="let block of blocks; trackBy: trackBlockById"
              class="obs-workspace-block"
              [class.obs-workspace-block-draw]="block.type === 'DRAW'"
              [style.left.px]="block.x"
              [style.top.px]="block.y"
              (pointerdown)="startBlockDrag($event, block)"
            >
              <header class="obs-workspace-block-head">
                <strong>{{ block.type === 'TEXT' ? 'Texto' : 'Desenho' }}</strong>
                <span>#{{ block.orderIndex }}</span>
              </header>
              <textarea
                *ngIf="block.type === 'TEXT'"
                class="obs-workspace-block-input"
                [value]="block.textContent"
                placeholder="Escreva aqui..."
                (pointerdown)="$event.stopPropagation()"
                (input)="onBlockTextInput(block.id, $any($event.target).value)"
              ></textarea>
              <p *ngIf="block.type === 'DRAW'" class="obs-workspace-block-body">
                {{ block.drawingData ? 'Bloco de desenho criado' : 'Bloco de desenho vazio' }}
              </p>
            </article>

            <div
              *ngIf="contextMenu.open"
              class="obs-context-menu"
              [style.left.px]="contextMenu.x"
              [style.top.px]="contextMenu.y"
              (click)="$event.stopPropagation()"
            >
              <button type="button" (click)="createBlockAtCursor('TEXT')">Criar bloco de texto</button>
              <button type="button" (click)="createBlockAtCursor('DRAW')">Criar bloco de desenho</button>
            </div>
          </div>
        </article>

        <ng-template #emptyState>
          <article class="obs-empty">Escolha ou crie uma task para abrir o quadro.</article>
        </ng-template>
      </section>
    </main>
  `
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private static readonly EXPANDED_KEY = 'taskforge.tree.expanded';
  private static readonly INBOX_ID = '__inbox__';

  @ViewChild('workspaceBoard') workspaceBoardRef?: ElementRef<HTMLDivElement>;
  @ViewChild('workspaceCanvas') workspaceCanvasRef?: ElementRef<HTMLCanvasElement>;

  folders: FolderResponse[] = [];
  tasks: TaskTreeItemResponse[] = [];
  treeRows: TreeRow[] = [];
  blocks: WorkspaceBlock[] = [];

  expandedFolderIds = new Set<string>([DashboardComponent.INBOX_ID]);

  selectedFolderId: string | null = null;
  activeTaskId = '';
  newTaskTitle = '';
  searchTerm = '';

  sidebarOpen = false;
  sidebarCollapsed = false;

  contextMenu = { open: false, x: 0, y: 0, blockX: 60, blockY: 80 };

  private boardStrokes: Stroke[] = [];
  private isDrawing = false;
  private currentStroke: Stroke | null = null;
  private draggingBlockId: string | null = null;
  private draggingOffset: { x: number; y: number } | null = null;

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadExpandedState();
    this.loadTree();
  }

  ngAfterViewInit(): void {
    this.resizeCanvas();
    this.renderBoardCanvas();
  }

  ngOnDestroy(): void {
    this.isDrawing = false;
    this.currentStroke = null;
  }

  @HostListener('window:resize')
  onResize(): void {
    this.resizeCanvas();
    this.renderBoardCanvas();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeContextMenu();
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
          this.selectedFolderId = folder.id;
          this.expandFolderPath(folder);
          this.expandedFolderIds.add(folder.id);
          this.persistExpandedState();
          this.rebuildTreeRows();
        },
        error: (error) => {
          window.alert(this.extractErrorMessage(error, 'Nao foi possivel criar a pasta.'));
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
        },
        error: (error) => {
          window.alert(this.extractErrorMessage(error, 'Nao foi possivel criar a tarefa.'));
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

  onWorkspaceContextMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.activeTaskId || !this.workspaceBoardRef) {
      return;
    }

    const rect = this.workspaceBoardRef.nativeElement.getBoundingClientRect();
    this.contextMenu = {
      open: true,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      blockX: Math.max(12, event.clientX - rect.left - 30),
      blockY: Math.max(12, event.clientY - rect.top - 20)
    };
  }

  closeContextMenu(): void {
    if (!this.contextMenu.open) {
      return;
    }
    this.contextMenu = { ...this.contextMenu, open: false };
  }

  createBlockAtCursor(type: 'TEXT' | 'DRAW'): void {
    if (!this.activeTaskId) {
      return;
    }

    const now = new Date().toISOString();
    this.api
      .createBlock(this.activeTaskId, {
        type,
        orderIndex: this.blocks.length,
        textContent: type === 'TEXT' ? '' : undefined,
        drawingData: type === 'DRAW' ? JSON.stringify({ strokes: [] }) : undefined,
        createdAt: now,
        updatedAt: now
      })
      .subscribe({
        next: (created) => {
          this.blocks = [
            ...this.blocks,
            this.toWorkspaceBlock(created, this.contextMenu.blockX, this.contextMenu.blockY)
          ].sort((a, b) => a.orderIndex - b.orderIndex);
          this.closeContextMenu();
        },
        error: (error) => {
          this.closeContextMenu();
          window.alert(this.extractErrorMessage(error, 'Nao foi possivel criar o bloco.'));
        }
      });
  }

  startWorkspaceDrawing(event: PointerEvent): void {
    if (event.button !== 0 || !this.workspaceCanvasRef || this.draggingBlockId) {
      return;
    }

    const point = this.pointerToCanvas(event, this.workspaceCanvasRef.nativeElement);
    this.currentStroke = {
      color: '#8fb3ff',
      width: 2,
      points: [point]
    };
    this.isDrawing = true;
  }

  drawWorkspace(event: PointerEvent): void {
    if (this.draggingBlockId && this.workspaceBoardRef) {
      const board = this.workspaceBoardRef.nativeElement;
      const rect = board.getBoundingClientRect();
      const blockIndex = this.blocks.findIndex((item) => item.id === this.draggingBlockId);
      if (blockIndex === -1 || !this.draggingOffset) {
        return;
      }

      const nextX = Math.max(0, Math.min(event.clientX - rect.left - this.draggingOffset.x, board.clientWidth - 260));
      const nextY = Math.max(0, Math.min(event.clientY - rect.top - this.draggingOffset.y, board.clientHeight - 120));
      const updated = [...this.blocks];
      updated[blockIndex] = { ...updated[blockIndex], x: nextX, y: nextY };
      this.blocks = updated;
      return;
    }

    if (!this.isDrawing || !this.currentStroke || !this.workspaceCanvasRef) {
      return;
    }

    const point = this.pointerToCanvas(event, this.workspaceCanvasRef.nativeElement);
    this.currentStroke.points.push(point);
    this.renderBoardCanvas();
    this.drawStroke(this.currentStroke);
  }

  stopWorkspaceDrawing(): void {
    if (this.draggingBlockId) {
      this.draggingBlockId = null;
      this.draggingOffset = null;
      return;
    }

    if (!this.isDrawing || !this.currentStroke) {
      return;
    }

    if (this.currentStroke.points.length > 1) {
      this.boardStrokes = [...this.boardStrokes, this.currentStroke];
    }

    this.currentStroke = null;
    this.isDrawing = false;
    this.renderBoardCanvas();
  }

  startBlockDrag(event: PointerEvent, block: WorkspaceBlock): void {
    if (event.button !== 0) {
      return;
    }

    if (!this.workspaceBoardRef) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const rect = this.workspaceBoardRef.nativeElement.getBoundingClientRect();
    this.draggingBlockId = block.id;
    this.draggingOffset = {
      x: event.clientX - rect.left - block.x,
      y: event.clientY - rect.top - block.y
    };
  }

  onBlockTextInput(blockId: string, text: string): void {
    const block = this.blocks.find((item) => item.id === blockId);
    if (!block) {
      return;
    }
    block.textContent = text;
  }

  trackBlockById(index: number, block: WorkspaceBlock): string {
    return block.id;
  }

  private selectTask(taskId: string): void {
    this.activeTaskId = taskId;
    this.sidebarOpen = false;
    this.closeContextMenu();

    this.api.getTask(taskId).subscribe({
      next: (task) => {
        this.applyTaskDetail(task);
      },
      error: (error) => {
        window.alert(this.extractErrorMessage(error, 'Nao foi possivel abrir a task.'));
      }
    });
  }

  private applyTaskDetail(task: TaskDetailResponse): void {
    const sortedBlocks = [...(task.blocks ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
    this.blocks = sortedBlocks.map((block, index) => {
      const x = 24 + (index % 3) * 280;
      const y = 24 + Math.floor(index / 3) * 150;
      return this.toWorkspaceBlock(block, x, y);
    });
    this.boardStrokes = [];
    this.resizeCanvas();
    this.renderBoardCanvas();
  }

  private toWorkspaceBlock(block: BlockResponse, x: number, y: number): WorkspaceBlock {
    return {
      id: block.id,
      type: block.type,
      orderIndex: block.orderIndex,
      textContent: block.textContent ?? '',
      drawingData: block.drawingData ?? '',
      x,
      y
    };
  }

  private loadTree(): void {
    this.api.getTree().subscribe({
      next: (tree) => {
        this.folders = tree.folders ?? [];
        this.tasks = tree.tasks ?? [];
        this.rebuildTreeRows();
      },
      error: (error) => {
        window.alert(this.extractErrorMessage(error, 'Nao foi possivel carregar as pastas e tarefas.'));
      }
    });
  }

  private extractErrorMessage(error: any, fallback: string): string {
    const payload = error?.error;
    const payloadMessage = payload?.message ?? payload?.error_description ?? payload?.detail ?? payload?.error;

    if (typeof payloadMessage === 'string' && payloadMessage.trim()) {
      return payloadMessage;
    }

    if (typeof payload === 'string' && payload.trim()) {
      return payload;
    }

    const status = error?.status;
    if (typeof status === 'number' && status > 0) {
      return `${fallback} (HTTP ${status})`;
    }

    return fallback;
  }

  private expandFolderPath(folder: FolderResponse): void {
    this.expandedFolderIds.add(DashboardComponent.INBOX_ID);
    let parentId = folder.parentId ?? null;
    while (parentId) {
      this.expandedFolderIds.add(parentId);
      parentId = this.folders.find((item) => item.id === parentId)?.parentId ?? null;
    }
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

  private resizeCanvas(): void {
    if (!this.workspaceBoardRef || !this.workspaceCanvasRef) {
      return;
    }

    const board = this.workspaceBoardRef.nativeElement;
    const canvas = this.workspaceCanvasRef.nativeElement;
    canvas.width = Math.max(1, Math.floor(board.clientWidth));
    canvas.height = Math.max(1, Math.floor(board.clientHeight));
  }

  private pointerToCanvas(event: PointerEvent, canvas: HTMLCanvasElement): [number, number] {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return [(event.clientX - rect.left) * scaleX, (event.clientY - rect.top) * scaleY];
  }

  private renderBoardCanvas(): void {
    if (!this.workspaceCanvasRef) {
      return;
    }

    const canvas = this.workspaceCanvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f1521';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.boardStrokes.forEach((stroke) => this.drawStroke(stroke, ctx));
  }

  private drawStroke(stroke: Stroke, providedCtx?: CanvasRenderingContext2D): void {
    if (!this.workspaceCanvasRef && !providedCtx) {
      return;
    }

    const ctx = providedCtx ?? this.workspaceCanvasRef!.nativeElement.getContext('2d');
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
