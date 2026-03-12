import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, EMPTY, debounceTime, switchMap, tap, catchError, takeUntil } from 'rxjs';
import { AuthService } from '../../../../core/auth.service';
import {
  ApiService,
  BlockResponse,
  FolderResponse,
  TaskDetailResponse,
  TaskDocumentContent,
  TaskDocumentResponse,
  TaskResponse,
  TaskSummaryResponse,
  TaskTreeItemResponse,
  TaskTreeResponse
} from '../../../../core/api.service';
import { SaveState, Stroke, TreeContextMenuState, TreeRow, WorkspaceBlock, WorkspaceDocumentBlock, WorkspaceImage } from '../../models/dashboard.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <main class="obs-shell" [class.obs-shell-collapsed]="sidebarCollapsed">
      <aside class="obs-tree" [class.obs-tree-open]="sidebarOpen" (contextmenu)="onTreeAreaContextMenu($event)">
        <div class="obs-tree-head">
          <h1>TaskForge</h1>
          <div class="flex items-center gap-1">
            <button class="obs-icon-btn" type="button" aria-label="Criar pasta" (click)="createFolder()">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 6.5h7l2 2H21v9.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6.5Z" />
                <path d="M12 11v6m-3-3h6" />
              </svg>
            </button>
            <button class="obs-icon-btn" type="button" aria-label="Criar task" (click)="createTask()">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 4h11l3 3v13H5z" />
                <path d="M16 4v4h4" />
                <path d="M12 11v6m-3-3h6" />
              </svg>
            </button>
            <a class="btn-ghost !px-2 !py-1" routerLink="/profile">Perfil</a>
            <button class="btn-ghost !px-2 !py-1" type="button" (click)="logout()">Sair</button>
          </div>
        </div>

        <div class="obs-tree-scroll" (click)="onTreeAreaClick($event)">
          <button
            *ngFor="let row of treeRows"
            type="button"
            class="obs-tree-row"
            [attr.data-kind]="row.kind"
            [attr.data-id]="row.id"
            [attr.data-folder-id]="row.kind === 'task' ? (row.folderId ?? '') : ''"
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

        <div
          *ngIf="treeContextMenu.open"
          class="obs-context-menu obs-context-menu-fixed"
          [style.left.px]="treeContextMenu.x"
          [style.top.px]="treeContextMenu.y"
          (click)="$event.stopPropagation()"
        >
          <button type="button" *ngIf="treeContextMenu.target !== 'task'" (click)="onTreeMenuCreateFolder()">Criar pasta</button>
          <button type="button" (click)="onTreeMenuCreateTask()">Criar task</button>
          <button type="button" *ngIf="treeContextMenu.target === 'folder'" (click)="onTreeMenuRenameFolder()">Renomear pasta</button>
          <button type="button" *ngIf="treeContextMenu.target === 'task'" (click)="onTreeMenuRenameTask()">Renomear task</button>
          <button type="button" *ngIf="treeContextMenu.target === 'task'" (click)="onTreeMenuMoveTaskToRoot()">Mover task para raiz</button>
          <button type="button" *ngIf="treeContextMenu.target === 'folder'" (click)="onTreeMenuDeleteFolder()">Deletar pasta</button>
          <button type="button" *ngIf="treeContextMenu.target === 'task'" (click)="onTreeMenuDeleteTask()">Deletar task</button>
        </div>
      </aside>

      <button *ngIf="sidebarOpen" type="button" class="forge-overlay md:hidden" (click)="toggleSidebarMobile()"></button>

      <section class="obs-work" (click)="closeMenus()">
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
            <div class="obs-doc-identity">
              <span class="obs-meta-label">Task</span>
              <code class="obs-task-id">{{ activeTaskId }}</code>
            </div>
            <p
              class="obs-save-pill"
              [class.obs-save-pill-saving]="saveState === 'saving'"
              [class.obs-save-pill-saved]="saveState === 'saved'"
              [class.obs-save-pill-error]="saveState === 'error'"
            >
              {{ saveState === 'saving' ? 'Salvando...' : saveState === 'saved' ? 'Salvo' : saveState === 'error' ? 'Erro ao salvar' : 'Ctrl+Z desfaz desenho / Ctrl+V cola imagem' }}
            </p>
          </div>

          <div class="obs-workspace-tools" (pointerdown)="$event.stopPropagation()">
            <div class="obs-tool-group">
              <label class="obs-tool-label">
                <span>Tamanho</span>
                <input type="range" min="1" max="12" [value]="brushSize" (input)="onBrushSize($any($event.target).value)" />
              </label>
              <label class="obs-tool-label">
                <span>Cor</span>
                <input type="color" [value]="brushColor" (input)="onBrushColor($any($event.target).value)" />
              </label>
            </div>

            <div class="obs-tool-group">
              <button class="btn-ghost obs-tool-btn" type="button" (click)="undoLastStroke()">Desfazer</button>
              <button class="btn-ghost obs-tool-btn" type="button" (click)="clearBoardDrawings()">Limpar desenho</button>
            </div>

            <div class="obs-tool-group obs-tool-group-zoom">
              <button class="btn-ghost obs-zoom-btn" type="button" (click)="zoomOut()">-</button>
              <span class="obs-zoom-label">{{ (zoomLevel * 100) | number: '1.0-0' }}%</span>
              <button class="btn-ghost obs-zoom-btn" type="button" (click)="zoomIn()">+</button>
              <button class="btn-ghost obs-tool-btn" type="button" (click)="resetZoom()">100%</button>
            </div>
          </div>

          <div #workspaceViewport class="obs-workspace-viewport">
            <div #workspaceScale class="obs-workspace-scale" [style.width.px]="boardWidth * zoomLevel" [style.height.px]="boardHeight * zoomLevel">
              <div
                #workspaceBoard
                class="obs-workspace-board"
                [style.width.px]="boardWidth"
                [style.height.px]="boardHeight"
                [style.transform]="'scale(' + zoomLevel + ')'"
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
                [style.width.px]="block.width"
                [style.height.px]="block.height"
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
                <button class="obs-resize-handle" type="button" (pointerdown)="startBlockResize($event, block)" aria-label="resize block"></button>
              </article>

              <article
                *ngFor="let image of images; trackBy: trackImageById"
                class="obs-workspace-image"
                [style.left.px]="image.x"
                [style.top.px]="image.y"
                [style.width.px]="image.width"
                [style.height.px]="image.height"
                (pointerdown)="startImageDrag($event, image)"
              >
                <img [src]="image.dataUrl" alt="pasted" draggable="false" />
                <button class="obs-resize-handle obs-resize-handle-image" type="button" (pointerdown)="startImageResize($event, image)" aria-label="resize image"></button>
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
            </div>
          </div>
        </article>

        <ng-template #emptyState>
          <article class="obs-empty">Escolha ou crie uma task para abrir o quadro.</article>
        </ng-template>
      </section>

      <div *ngIf="dialog.open" class="obs-dialog-backdrop" (click)="onDialogCancel()">
        <div class="obs-dialog" (click)="$event.stopPropagation()">
          <h3 class="obs-dialog-title">{{ dialog.title }}</h3>
          <label *ngIf="dialog.mode === 'text'" class="obs-dialog-label">
            {{ dialog.label }}
            <input
              class="input obs-input"
              type="text"
              [placeholder]="dialog.placeholder"
              [value]="dialog.value"
              (input)="dialog.value = $any($event.target).value"
              (keydown.enter)="onDialogConfirm()"
            />
          </label>
          <p *ngIf="dialog.mode === 'confirm'" class="obs-dialog-message">{{ dialog.label }}</p>
          <div class="obs-dialog-actions">
            <button type="button" class="btn-ghost" (click)="onDialogCancel()">Cancelar</button>
            <button type="button" class="btn-primary" (click)="onDialogConfirm()">{{ dialog.confirmText }}</button>
          </div>
        </div>
      </div>
    </main>
  `
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private static readonly EXPANDED_KEY = 'taskforge.tree.expanded';
  private static readonly BOARD_WIDTH = 4000;
  private static readonly BOARD_HEIGHT = 3000;
  private static readonly BLOCK_MIN_WIDTH = 180;
  private static readonly BLOCK_MIN_HEIGHT = 100;
  private static readonly IMAGE_MIN_WIDTH = 120;
  private static readonly ZOOM_MIN = 0.5;
  private static readonly ZOOM_MAX = 2;
  private static readonly ZOOM_STEP = 0.1;

  @ViewChild('workspaceViewport') workspaceViewportRef?: ElementRef<HTMLDivElement>;
  @ViewChild('workspaceScale') workspaceScaleRef?: ElementRef<HTMLDivElement>;
  @ViewChild('workspaceBoard') workspaceBoardRef?: ElementRef<HTMLDivElement>;
  @ViewChild('workspaceCanvas') workspaceCanvasRef?: ElementRef<HTMLCanvasElement>;

  folders: FolderResponse[] = [];
  tasks: TaskTreeItemResponse[] = [];
  treeRows: TreeRow[] = [];
  blocks: WorkspaceBlock[] = [];
  images: WorkspaceImage[] = [];

  expandedFolderIds = new Set<string>();

  selectedFolderId: string | null = null;
  activeTaskId = '';
  searchTerm = '';
  saveState: SaveState = 'idle';

  sidebarOpen = false;
  sidebarCollapsed = false;

  contextMenu = { open: false, x: 0, y: 0, blockX: 60, blockY: 80 };
  treeContextMenu: TreeContextMenuState = { open: false, x: 0, y: 0, target: null, targetId: null, targetFolderId: null };
  dialog = {
    open: false,
    mode: 'text' as 'text' | 'confirm',
    title: '',
    label: '',
    placeholder: '',
    value: '',
    confirmText: 'OK'
  };
  brushColor = '#8fb3ff';
  brushSize = 2;
  boardWidth = DashboardComponent.BOARD_WIDTH;
  boardHeight = DashboardComponent.BOARD_HEIGHT;
  zoomLevel = 1;

  private boardStrokes: Stroke[] = [];
  private isDrawing = false;
  private currentStroke: Stroke | null = null;

  private draggingBlockId: string | null = null;
  private draggingImageId: string | null = null;
  private draggingOffset: { x: number; y: number } | null = null;
  private resizingBlockId: string | null = null;
  private resizingImageId: string | null = null;
  private resizeStart:
    | {
        x: number;
        y: number;
        width: number;
        height: number;
      }
    | null = null;

  private documentVersion: number | null = null;
  private saveQueue$ = new Subject<void>();
  private destroy$ = new Subject<void>();
  private dialogResolver: ((result: string | boolean | null) => void) | null = null;

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadExpandedState();
    this.loadTree();
    this.setupWorkspaceAutosave();
  }

  ngAfterViewInit(): void {
    this.resizeCanvas();
    this.renderBoardCanvas();
  }

  ngOnDestroy(): void {
    this.isDrawing = false;
    this.currentStroke = null;
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.resizeCanvas();
    this.renderBoardCanvas();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (event.button === 2) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest('.obs-tree-scroll') || target?.closest('.obs-context-menu')) {
      return;
    }
    this.closeMenus();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const isUndo = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z';
    if (isUndo && this.activeTaskId && !this.isTypingTarget(event.target as HTMLElement | null)) {
      event.preventDefault();
      this.undoLastStroke();
    }
  }

  @HostListener('document:paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    if (!this.activeTaskId || !event.clipboardData || !this.workspaceBoardRef) {
      return;
    }

    const imageItem = Array.from(event.clipboardData.items).find((item) => item.type.startsWith('image/'));
    if (!imageItem) {
      return;
    }

    const file = imageItem.getAsFile();
    if (!file) {
      return;
    }

    event.preventDefault();
    void this.addPastedImage(file);
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

  onBrushSize(value: string): void {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      this.brushSize = Math.min(12, Math.max(1, parsed));
      this.queueWorkspaceSave();
    }
  }

  onBrushColor(value: string): void {
    this.brushColor = value || '#8fb3ff';
    this.queueWorkspaceSave();
  }

  zoomIn(): void {
    this.zoomLevel = Math.min(DashboardComponent.ZOOM_MAX, +(this.zoomLevel + DashboardComponent.ZOOM_STEP).toFixed(2));
  }

  zoomOut(): void {
    this.zoomLevel = Math.max(DashboardComponent.ZOOM_MIN, +(this.zoomLevel - DashboardComponent.ZOOM_STEP).toFixed(2));
  }

  resetZoom(): void {
    this.zoomLevel = 1;
  }

  async createFolder(parentId: string | null = this.selectedFolderId): Promise<void> {
    const name = await this.openTextDialog('Criar pasta', 'Nome da pasta', '');
    if (!name || !name.trim()) {
      return;
    }

    this.api
      .createFolder({
        name: name.trim(),
        parentId
      })
      .subscribe({
        next: (folder: FolderResponse) => {
          this.folders = [...this.folders, folder];
          this.selectedFolderId = folder.id;
          this.expandFolderPath(folder);
          this.expandedFolderIds.add(folder.id);
          this.persistExpandedState();
          this.rebuildTreeRows();
        },
        error: (error: unknown) => {
          window.alert(this.extractErrorMessage(error, 'Nao foi possivel criar a pasta.'));
        }
      });
  }

  async createTask(targetFolderId: string | null = this.selectedFolderId, providedTitle?: string): Promise<void> {
    const titleCandidate = providedTitle ?? await this.openTextDialog('Criar task', 'Título da task', '');
    const title = (titleCandidate ?? '').trim();
    if (!title) {
      return;
    }

    const now = new Date().toISOString();
    this.api
      .createTask({
        title,
        description: '',
        folderId: targetFolderId,
        createdAt: now,
        updatedAt: now
      })
      .subscribe({
        next: (task: TaskResponse) => {
          this.tasks = [
            {
              id: task.id,
              title: task.title,
              description: task.description,
              folderId: targetFolderId,
              updatedAt: now
            },
            ...this.tasks
          ];
          this.rebuildTreeRows();
          this.selectTask(task.id);
        },
        error: (error: unknown) => {
          window.alert(this.extractErrorMessage(error, 'Nao foi possivel criar a tarefa.'));
        }
      });
  }

  onRowClick(row: TreeRow): void {
    this.closeTreeContextMenu();

    if (row.kind === 'folder') {
      this.selectedFolderId = row.id;
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

  onTreeAreaClick(event: MouseEvent): void {
    this.openTreeMenuFromEvent(event);
  }

  onTreeAreaContextMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.openTreeMenuFromEvent(event);
  }

  private openTreeMenuFromEvent(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    const rowButton = target?.closest('.obs-tree-row') as HTMLButtonElement | null;

    if (!rowButton) {
      this.treeContextMenu = {
        open: true,
        x: event.clientX,
        y: event.clientY,
        target: 'blank',
        targetId: null,
        targetFolderId: this.selectedFolderId
      };
      return;
    }

    const kind = rowButton.dataset['kind'];
    const id = rowButton.dataset['id'] ?? null;
    if (kind === 'folder' && id) {
      this.selectedFolderId = id;
      this.treeContextMenu = {
        open: true,
        x: event.clientX,
        y: event.clientY,
        target: 'folder',
        targetId: id,
        targetFolderId: id
      };
      this.rebuildTreeRows();
      return;
    }

    if (kind === 'task' && id) {
      const folderId = rowButton.dataset['folderId']?.trim() || null;
      this.treeContextMenu = {
        open: true,
        x: event.clientX,
        y: event.clientY,
        target: 'task',
        targetId: id,
        targetFolderId: folderId
      };
      return;
    }

    this.treeContextMenu = {
      open: true,
      x: event.clientX,
      y: event.clientY,
      target: 'blank',
      targetId: null,
      targetFolderId: this.selectedFolderId
    };
  }

  async onTreeMenuCreateFolder(): Promise<void> {
    const parentId = this.treeContextMenu.target === 'folder' ? this.treeContextMenu.targetId : this.selectedFolderId;
    this.closeTreeContextMenu();
    await this.createFolder(parentId);
  }

  async onTreeMenuCreateTask(): Promise<void> {
    const folderId = this.treeContextMenu.target === 'folder'
      ? this.treeContextMenu.targetId
      : this.treeContextMenu.target === 'task'
        ? this.treeContextMenu.targetFolderId
        : this.selectedFolderId;
    this.closeTreeContextMenu();
    await this.createTask(folderId ?? null);
  }

  async onTreeMenuRenameFolder(): Promise<void> {
    const folderId = this.treeContextMenu.targetId;
    if (!folderId) {
      this.closeTreeContextMenu();
      return;
    }

    const current = this.folders.find((item) => item.id === folderId);
    const name = await this.openTextDialog('Renomear pasta', 'Novo nome da pasta', current?.name ?? '');
    if (!name || !name.trim()) {
      this.closeTreeContextMenu();
      return;
    }

    this.api.updateFolder(folderId, { name: name.trim() }).subscribe({
      next: (updated: FolderResponse) => {
        this.folders = this.folders.map((folder) => (folder.id === folderId ? updated : folder));
        this.rebuildTreeRows();
        this.closeTreeContextMenu();
      },
      error: (error: unknown) => {
        this.closeTreeContextMenu();
        window.alert(this.extractErrorMessage(error, 'Nao foi possivel renomear a pasta.'));
      }
    });
  }

  async onTreeMenuRenameTask(): Promise<void> {
    const taskId = this.treeContextMenu.targetId;
    if (!taskId) {
      this.closeTreeContextMenu();
      return;
    }

    const current = this.tasks.find((item) => item.id === taskId);
    const title = await this.openTextDialog('Renomear task', 'Novo título da task', current?.title ?? '');
    if (!title || !title.trim()) {
      this.closeTreeContextMenu();
      return;
    }

    this.api.updateTask(taskId, { title: title.trim() }).subscribe({
      next: (updated: TaskSummaryResponse) => {
        this.tasks = this.tasks.map((task) => (task.id === taskId ? { ...task, title: updated.title } : task));
        this.rebuildTreeRows();
        this.closeTreeContextMenu();
      },
      error: (error: unknown) => {
        this.closeTreeContextMenu();
        window.alert(this.extractErrorMessage(error, 'Nao foi possivel renomear a task.'));
      }
    });
  }

  onTreeMenuMoveTaskToRoot(): void {
    const taskId = this.treeContextMenu.targetId;
    if (!taskId) {
      this.closeTreeContextMenu();
      return;
    }

    this.api.moveTask(taskId, { folderId: null }).subscribe({
      next: (updated: TaskSummaryResponse) => {
        this.tasks = this.tasks.map((task) => (task.id === taskId ? { ...task, folderId: updated.folderId ?? null } : task));
        this.rebuildTreeRows();
        this.closeTreeContextMenu();
      },
      error: (error: unknown) => {
        this.closeTreeContextMenu();
        window.alert(this.extractErrorMessage(error, 'Nao foi possivel mover a task.'));
      }
    });
  }

  async onTreeMenuDeleteFolder(): Promise<void> {
    const folderId = this.treeContextMenu.targetId;
    if (!folderId) {
      this.closeTreeContextMenu();
      return;
    }

    const confirmed = await this.openConfirmDialog('Deletar pasta', 'Deseja deletar todos os itens dentro dessa pasta?', 'Deletar');
    if (!confirmed) {
      this.closeTreeContextMenu();
      return;
    }

    this.api.deleteFolder(folderId).subscribe({
      next: () => {
        if (this.selectedFolderId === folderId) {
          this.selectedFolderId = null;
        }
        this.closeTreeContextMenu();
        this.loadTree();
      },
      error: (error: unknown) => {
        this.closeTreeContextMenu();
        window.alert(this.extractErrorMessage(error, 'Nao foi possivel deletar a pasta.'));
      }
    });
  }

  async onTreeMenuDeleteTask(): Promise<void> {
    const taskId = this.treeContextMenu.targetId;
    if (!taskId) {
      this.closeTreeContextMenu();
      return;
    }

    const confirmed = await this.openConfirmDialog('Deletar task', 'Deseja deletar esta task?', 'Deletar');
    if (!confirmed) {
      this.closeTreeContextMenu();
      return;
    }

    this.api.deleteTask(taskId).subscribe({
      next: () => {
        this.tasks = this.tasks.filter((task) => task.id !== taskId);
        if (this.activeTaskId === taskId) {
          this.activeTaskId = '';
          this.blocks = [];
          this.images = [];
          this.boardStrokes = [];
          this.renderBoardCanvas();
        }
        this.rebuildTreeRows();
        this.closeTreeContextMenu();
      },
      error: (error: unknown) => {
        this.closeTreeContextMenu();
        window.alert(this.extractErrorMessage(error, 'Nao foi possivel deletar a task.'));
      }
    });
  }

  onWorkspaceContextMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.activeTaskId || !this.workspaceBoardRef) {
      return;
    }

    const point = this.pointerToBoard(event.clientX, event.clientY);
    this.contextMenu = {
      open: true,
      x: point.x,
      y: point.y,
      blockX: Math.max(12, point.x - 30),
      blockY: Math.max(12, point.y - 20)
    };
    this.closeTreeContextMenu();
  }

  closeMenus(): void {
    this.closeContextMenu();
    this.closeTreeContextMenu();
  }

  closeContextMenu(): void {
    this.contextMenu = { ...this.contextMenu, open: false };
  }

  closeTreeContextMenu(): void {
    this.treeContextMenu = { open: false, x: 0, y: 0, target: null, targetId: null, targetFolderId: null };
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
        next: (created: BlockResponse) => {
          this.blocks = [
            ...this.blocks,
            this.toWorkspaceBlock(created, this.contextMenu.blockX, this.contextMenu.blockY)
          ].sort((a, b) => a.orderIndex - b.orderIndex);
          this.closeMenus();
          this.queueWorkspaceSave();
        },
        error: (error: unknown) => {
          this.closeMenus();
          window.alert(this.extractErrorMessage(error, 'Nao foi possivel criar o bloco.'));
        }
      });
  }

  startWorkspaceDrawing(event: PointerEvent): void {
    if (
      event.button !== 0 ||
      !this.workspaceCanvasRef ||
      this.draggingBlockId ||
      this.draggingImageId ||
      this.resizingBlockId ||
      this.resizingImageId
    ) {
      return;
    }

    const point = this.pointerToCanvas(event, this.workspaceCanvasRef.nativeElement);
    this.currentStroke = {
      color: this.brushColor,
      width: this.brushSize,
      points: [point]
    };
    this.isDrawing = true;
  }

  drawWorkspace(event: PointerEvent): void {
    if (this.resizingBlockId && this.resizeStart) {
      const blockIndex = this.blocks.findIndex((item) => item.id === this.resizingBlockId);
      if (blockIndex === -1) {
        return;
      }

      const point = this.pointerToBoard(event.clientX, event.clientY);
      const deltaX = point.x - this.resizeStart.x;
      const deltaY = point.y - this.resizeStart.y;
      const updated = [...this.blocks];
      const block = updated[blockIndex];
      const maxWidth = Math.max(DashboardComponent.BLOCK_MIN_WIDTH, this.boardWidth - block.x);
      const maxHeight = Math.max(DashboardComponent.BLOCK_MIN_HEIGHT, this.boardHeight - block.y);
      updated[blockIndex] = {
        ...block,
        width: Math.max(DashboardComponent.BLOCK_MIN_WIDTH, Math.min(maxWidth, this.resizeStart.width + deltaX)),
        height: Math.max(DashboardComponent.BLOCK_MIN_HEIGHT, Math.min(maxHeight, this.resizeStart.height + deltaY))
      };
      this.blocks = updated;
      return;
    }

    if (this.resizingImageId && this.resizeStart) {
      const imageIndex = this.images.findIndex((item) => item.id === this.resizingImageId);
      if (imageIndex === -1) {
        return;
      }

      const point = this.pointerToBoard(event.clientX, event.clientY);
      const deltaX = point.x - this.resizeStart.x;
      const updated = [...this.images];
      const image = updated[imageIndex];
      const ratio = this.resizeStart.width / Math.max(1, this.resizeStart.height);
      const maxWidth = Math.max(DashboardComponent.IMAGE_MIN_WIDTH, this.boardWidth - image.x);
      const nextWidth = Math.max(DashboardComponent.IMAGE_MIN_WIDTH, Math.min(maxWidth, this.resizeStart.width + deltaX));
      const nextHeight = Math.max(70, Math.min(this.boardHeight - image.y, Math.floor(nextWidth / ratio)));
      updated[imageIndex] = { ...image, width: nextWidth, height: nextHeight };
      this.images = updated;
      return;
    }

    if (this.draggingBlockId && this.workspaceBoardRef) {
      const blockIndex = this.blocks.findIndex((item) => item.id === this.draggingBlockId);
      if (blockIndex === -1 || !this.draggingOffset) {
        return;
      }

      const block = this.blocks[blockIndex];
      const point = this.pointerToBoard(event.clientX, event.clientY);
      const nextX = Math.max(0, Math.min(point.x - this.draggingOffset.x, this.boardWidth - block.width));
      const nextY = Math.max(0, Math.min(point.y - this.draggingOffset.y, this.boardHeight - block.height));
      const updated = [...this.blocks];
      updated[blockIndex] = { ...block, x: nextX, y: nextY };
      this.blocks = updated;
      return;
    }

    if (this.draggingImageId && this.workspaceBoardRef) {
      const imageIndex = this.images.findIndex((item) => item.id === this.draggingImageId);
      if (imageIndex === -1 || !this.draggingOffset) {
        return;
      }

      const image = this.images[imageIndex];
      const point = this.pointerToBoard(event.clientX, event.clientY);
      const nextX = Math.max(0, Math.min(point.x - this.draggingOffset.x, this.boardWidth - image.width));
      const nextY = Math.max(0, Math.min(point.y - this.draggingOffset.y, this.boardHeight - image.height));
      const updated = [...this.images];
      updated[imageIndex] = { ...updated[imageIndex], x: nextX, y: nextY };
      this.images = updated;
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
    if (this.resizingBlockId) {
      this.resizingBlockId = null;
      this.resizeStart = null;
      this.queueWorkspaceSave();
      return;
    }

    if (this.resizingImageId) {
      this.resizingImageId = null;
      this.resizeStart = null;
      this.queueWorkspaceSave();
      return;
    }

    if (this.draggingBlockId) {
      this.draggingBlockId = null;
      this.draggingOffset = null;
      this.queueWorkspaceSave();
      return;
    }

    if (this.draggingImageId) {
      this.draggingImageId = null;
      this.draggingOffset = null;
      this.queueWorkspaceSave();
      return;
    }

    if (!this.isDrawing || !this.currentStroke) {
      return;
    }

    if (this.currentStroke.points.length > 1) {
      this.boardStrokes = [...this.boardStrokes, this.currentStroke];
      this.queueWorkspaceSave();
    }

    this.currentStroke = null;
    this.isDrawing = false;
    this.renderBoardCanvas();
  }

  startBlockDrag(event: PointerEvent, block: WorkspaceBlock): void {
    if (event.button !== 0 || !this.workspaceBoardRef) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const point = this.pointerToBoard(event.clientX, event.clientY);
    this.draggingBlockId = block.id;
    this.draggingOffset = {
      x: point.x - block.x,
      y: point.y - block.y
    };
  }

  startImageDrag(event: PointerEvent, image: WorkspaceImage): void {
    if (event.button !== 0 || !this.workspaceBoardRef) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const point = this.pointerToBoard(event.clientX, event.clientY);
    this.draggingImageId = image.id;
    this.draggingOffset = {
      x: point.x - image.x,
      y: point.y - image.y
    };
  }

  startBlockResize(event: PointerEvent, block: WorkspaceBlock): void {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const point = this.pointerToBoard(event.clientX, event.clientY);
    this.resizingBlockId = block.id;
    this.resizeStart = { x: point.x, y: point.y, width: block.width, height: block.height };
  }

  startImageResize(event: PointerEvent, image: WorkspaceImage): void {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const point = this.pointerToBoard(event.clientX, event.clientY);
    this.resizingImageId = image.id;
    this.resizeStart = { x: point.x, y: point.y, width: image.width, height: image.height };
  }

  onBlockTextInput(blockId: string, text: string): void {
    const blockExists = this.blocks.some((item) => item.id === blockId);
    if (!blockExists) {
      return;
    }
    this.blocks = this.blocks.map((block) => (block.id === blockId ? { ...block, textContent: text } : block));
    this.queueWorkspaceSave();
  }

  undoLastStroke(): void {
    if (!this.boardStrokes.length) {
      return;
    }
    this.boardStrokes = this.boardStrokes.slice(0, -1);
    this.renderBoardCanvas();
    this.queueWorkspaceSave();
  }

  clearBoardDrawings(): void {
    this.boardStrokes = [];
    this.renderBoardCanvas();
    this.queueWorkspaceSave();
  }

  trackBlockById(index: number, block: WorkspaceBlock): string {
    return block.id;
  }

  trackImageById(index: number, image: WorkspaceImage): string {
    return image.id;
  }

  private selectTask(taskId: string): void {
    this.activeTaskId = taskId;
    this.sidebarOpen = false;
    this.closeMenus();
    this.documentVersion = null;

    this.api.getTask(taskId).subscribe({
      next: (task: TaskDetailResponse) => {
        this.applyTaskDetail(task);
        this.api.getTaskDocument(taskId).subscribe({
          next: (doc: TaskDocumentResponse) => {
            this.applyWorkspaceDocument(doc);
          },
          error: () => {
            this.images = [];
            this.boardStrokes = [];
            this.renderBoardCanvas();
          }
        });
      },
      error: (error: unknown) => {
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
    this.images = [];
    this.boardStrokes = [];
    this.resizeCanvas();
    this.renderBoardCanvas();
  }

  private applyWorkspaceDocument(doc: TaskDocumentResponse): void {
    this.documentVersion = doc.version;

    const workspace = doc.content?.workspace;
    if (!workspace || typeof workspace !== 'object') {
      this.renderBoardCanvas();
      return;
    }

    const positions = workspace.blocks && typeof workspace.blocks === 'object'
      ? workspace.blocks
      : workspace.blockPositions && typeof workspace.blockPositions === 'object'
        ? workspace.blockPositions
        : {};
    this.blocks = this.blocks.map((block) => {
      const saved = positions[block.id];
      if (!saved || typeof saved.x !== 'number' || typeof saved.y !== 'number') {
        return block;
      }
      return {
        ...block,
        x: saved.x,
        y: saved.y,
        width: typeof saved.width === 'number' ? saved.width : block.width,
        height: typeof saved.height === 'number' ? saved.height : block.height,
        textContent: typeof saved.textContent === 'string' ? saved.textContent : block.textContent,
        drawingData: typeof saved.drawingData === 'string' ? saved.drawingData : block.drawingData
      };
    });

    this.images = Array.isArray(workspace.images)
      ? workspace.images
          .filter((item) => typeof item?.id === 'string' && typeof item?.dataUrl === 'string')
          .map((item) => ({
            id: item.id,
            dataUrl: item.dataUrl,
            x: typeof item.x === 'number' ? item.x : 60,
            y: typeof item.y === 'number' ? item.y : 80,
            width: typeof item.width === 'number' ? item.width : 260,
            height: typeof item.height === 'number' ? item.height : 180
          }))
      : [];

    this.boardStrokes = Array.isArray(workspace.strokes)
      ? workspace.strokes
          .filter((stroke) => Array.isArray(stroke?.points) && stroke.points.length > 1)
          .map((stroke) => ({
            color: typeof stroke.color === 'string' ? stroke.color : '#8fb3ff',
            width: typeof stroke.width === 'number' ? stroke.width : 2,
            points: stroke.points
          }))
      : [];

    if (typeof workspace.brushColor === 'string') {
      this.brushColor = workspace.brushColor;
    }

    if (typeof workspace.brushSize === 'number') {
      this.brushSize = Math.max(1, Math.min(12, workspace.brushSize));
    }

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
      y,
      width: 260,
      height: 140
    };
  }

  private loadTree(): void {
    this.api.getTree().subscribe({
      next: (tree: TaskTreeResponse) => {
        this.folders = tree.folders ?? [];
        this.tasks = tree.tasks ?? [];
        this.rebuildTreeRows();
      },
      error: (error: unknown) => {
        window.alert(this.extractErrorMessage(error, 'Nao foi possivel carregar as pastas e tarefas.'));
      }
    });
  }

  private setupWorkspaceAutosave(): void {
    this.saveQueue$
      .pipe(
        debounceTime(600),
        tap(() => (this.saveState = 'saving')),
        switchMap(() => {
          if (!this.activeTaskId) {
            this.saveState = 'idle';
            return EMPTY;
          }

          return this.api
            .upsertTaskDocument(this.activeTaskId, {
              content: this.buildWorkspaceDocument(),
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
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  private queueWorkspaceSave(): void {
    if (!this.activeTaskId) {
      return;
    }
    this.saveQueue$.next();
  }

  private buildWorkspaceDocument(): TaskDocumentContent {
    const blocks: Record<string, WorkspaceDocumentBlock> = {};
    this.blocks.forEach((block) => {
      blocks[block.id] = {
        x: block.x,
        y: block.y,
        width: block.width,
        height: block.height,
        textContent: block.type === 'TEXT' ? block.textContent : undefined,
        drawingData: block.type === 'DRAW' ? block.drawingData : undefined
      };
    });

    return {
      text: '',
      drawing: {
        strokes: []
      },
      workspace: {
        blocks,
        images: this.images,
        strokes: this.boardStrokes,
        brushColor: this.brushColor,
        brushSize: this.brushSize
      }
    };
  }

  private async addPastedImage(file: File): Promise<void> {
    const dataUrl = await this.readFileAsDataUrl(file);
    if (!this.workspaceViewportRef) {
      return;
    }

    const viewport = this.workspaceViewportRef.nativeElement;
    const width = Math.min(320, Math.max(140, Math.floor(viewport.clientWidth * 0.28)));
    const height = Math.floor(width * 0.62);

    const image: WorkspaceImage = {
      id: crypto.randomUUID(),
      dataUrl,
      x: Math.max(10, Math.floor(viewport.scrollLeft + viewport.clientWidth / 2 - width / 2)),
      y: Math.max(10, Math.floor(viewport.scrollTop + viewport.clientHeight / 2 - height / 2)),
      width,
      height
    };

    this.images = [...this.images, image];
    this.queueWorkspaceSave();
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('Falha ao ler imagem colada'));
      reader.readAsDataURL(file);
    });
  }

  private isTypingTarget(target: HTMLElement | null): boolean {
    if (!target) {
      return false;
    }

    const tag = target.tagName.toLowerCase();
    return tag === 'textarea' || tag === 'input' || target.isContentEditable;
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
    let parentId = folder.parentId ?? null;
    while (parentId) {
      this.expandedFolderIds.add(parentId);
      parentId = this.folders.find((item) => item.id === parentId)?.parentId ?? null;
    }
  }

  private rebuildTreeRows(): void {
    const rows: TreeRow[] = [];
    const rootTasks = this.tasks.filter((task) => !task.folderId);
    rootTasks.forEach((task) => {
      rows.push({
        kind: 'task',
        id: task.id,
        title: task.title,
        folderId: null,
        prefix: '',
        active: task.id === this.activeTaskId,
        matched: this.matchesSearch(task.title) || this.matchesSearch(task.description)
      });
    });

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

    const canvas = this.workspaceCanvasRef.nativeElement;
    canvas.width = this.boardWidth;
    canvas.height = this.boardHeight;
  }

  private pointerToBoard(clientX: number, clientY: number): { x: number; y: number } {
    if (!this.workspaceScaleRef || !this.workspaceViewportRef) {
      return { x: 0, y: 0 };
    }

    const rect = this.workspaceScaleRef.nativeElement.getBoundingClientRect();
    const viewport = this.workspaceViewportRef.nativeElement;
    return {
      x: Math.max(
        0,
        Math.min(this.boardWidth, (clientX - rect.left + viewport.scrollLeft) / this.zoomLevel)
      ),
      y: Math.max(
        0,
        Math.min(this.boardHeight, (clientY - rect.top + viewport.scrollTop) / this.zoomLevel)
      )
    };
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
      }
    } catch {
      this.expandedFolderIds = new Set();
    }
  }

  private openTextDialog(title: string, label: string, initialValue: string): Promise<string | null> {
    this.dialog = {
      open: true,
      mode: 'text',
      title,
      label,
      placeholder: '',
      value: initialValue,
      confirmText: 'OK'
    };
    return new Promise((resolve) => {
      this.dialogResolver = (result) => resolve(typeof result === 'string' ? result : null);
    });
  }

  private openConfirmDialog(title: string, label: string, confirmText: string): Promise<boolean> {
    this.dialog = {
      open: true,
      mode: 'confirm',
      title,
      label,
      placeholder: '',
      value: '',
      confirmText
    };
    return new Promise((resolve) => {
      this.dialogResolver = (result) => resolve(result === true);
    });
  }

  onDialogCancel(): void {
    const resolver = this.dialogResolver;
    this.dialogResolver = null;
    this.dialog.open = false;
    resolver?.(null);
  }

  onDialogConfirm(): void {
    const resolver = this.dialogResolver;
    this.dialogResolver = null;
    const payload = this.dialog.mode === 'confirm' ? true : this.dialog.value;
    this.dialog.open = false;
    resolver?.(payload);
  }
}
