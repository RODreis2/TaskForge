import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ApiService, RagChatMessage, RagChatResponse, RagChatSource } from '../../core/api.service';

type WidgetMessage = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  sources?: RagChatSource[];
  muted?: string;
};

@Component({
  selector: 'app-rag-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="rag-shell" [class.rag-shell-open]="open">
      <button type="button" class="rag-launcher" (click)="toggleOpen()" [attr.aria-expanded]="open">
        <span class="rag-launcher-orb" aria-hidden="true"></span>
        <span>{{ open ? 'Fechar assistente' : 'Assistente TaskForge' }}</span>
      </button>

      <div *ngIf="open" class="rag-panel">
        <header class="rag-head">
          <div>
            <p class="rag-kicker">RAG + Llama3</p>
            <h2>Assistente TaskForge</h2>
          </div>
          <button type="button" class="rag-close" (click)="open = false" aria-label="Fechar">×</button>
        </header>

        <p class="rag-context">Contexto atual: {{ currentRouteLabel }}</p>

        <div class="rag-history">
          <article *ngFor="let message of messages" class="rag-message" [class.rag-message-user]="message.role === 'user'">
            <p class="rag-message-role">{{ message.role === 'user' ? 'Você' : 'Assistente' }}</p>
            <p class="rag-message-body">{{ message.content }}</p>
            <p *ngIf="message.muted" class="rag-message-muted">{{ message.muted }}</p>
            <div *ngIf="message.sources?.length" class="rag-sources">
              <strong>Fontes</strong>
              <div *ngFor="let source of message.sources" class="rag-source">
                <span class="rag-source-title">{{ source.title }}</span>
                <span class="rag-source-kind">{{ source.kind }}</span>
                <p>{{ source.snippet }}</p>
              </div>
            </div>
          </article>

          <article *ngIf="loading" class="rag-message">
            <p class="rag-message-role">Assistente</p>
            <p class="rag-message-body">Consultando contexto e gerando resposta…</p>
          </article>
        </div>

        <form class="rag-form" (ngSubmit)="submit()">
          <textarea
            name="ragPrompt"
            class="rag-input"
            [(ngModel)]="draft"
            placeholder="Pergunte sobre suas tasks, documentos ou sobre o produto…"
            [disabled]="loading"
            rows="3"
          ></textarea>

          <div class="rag-actions">
            <p class="rag-error" *ngIf="errorMessage">{{ errorMessage }}</p>
            <button type="submit" class="rag-send" [disabled]="loading || !draft.trim()">Perguntar</button>
          </div>
        </form>
      </div>
    </section>
  `,
  styles: [
    `
      .rag-shell {
        position: fixed;
        right: 1rem;
        bottom: 1rem;
        z-index: 40;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.75rem;
      }

      .rag-launcher {
        border: 1px solid rgba(87, 129, 193, 0.7);
        border-radius: 999px;
        background: linear-gradient(135deg, rgba(17, 29, 46, 0.96), rgba(18, 36, 58, 0.96));
        color: #e7efff;
        padding: 0.8rem 1rem;
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        box-shadow: 0 16px 34px rgba(3, 9, 17, 0.34);
      }

      .rag-launcher-orb {
        width: 0.7rem;
        height: 0.7rem;
        border-radius: 999px;
        background: linear-gradient(135deg, #f4ceab, #7eb0ff);
        box-shadow: 0 0 0 0.35rem rgba(126, 176, 255, 0.16);
      }

      .rag-panel {
        width: min(24rem, calc(100vw - 2rem));
        max-height: min(40rem, calc(100vh - 6.5rem));
        display: flex;
        flex-direction: column;
        border: 1px solid rgba(71, 104, 151, 0.82);
        border-radius: 1.15rem;
        background:
          radial-gradient(circle at top right, rgba(244, 206, 171, 0.14), transparent 24%),
          linear-gradient(180deg, rgba(13, 22, 35, 0.98), rgba(10, 18, 31, 0.98));
        color: #e6eefb;
        box-shadow: 0 22px 46px rgba(3, 9, 17, 0.42);
        overflow: hidden;
      }

      .rag-head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem 1rem 0.65rem;
        border-bottom: 1px solid rgba(55, 78, 111, 0.72);
      }

      .rag-kicker {
        font-size: 0.68rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #f4ceab;
      }

      .rag-head h2 {
        font-size: 1rem;
        margin-top: 0.2rem;
      }

      .rag-close {
        border: 0;
        background: transparent;
        color: #cbdcfb;
        font-size: 1.4rem;
        line-height: 1;
      }

      .rag-context {
        padding: 0.6rem 1rem 0;
        font-size: 0.75rem;
        color: #9db1d5;
      }

      .rag-history {
        padding: 0.85rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        overflow-y: auto;
      }

      .rag-message {
        align-self: stretch;
        border: 1px solid rgba(61, 91, 132, 0.76);
        border-radius: 0.95rem;
        background: rgba(16, 28, 45, 0.92);
        padding: 0.8rem;
      }

      .rag-message-user {
        background: rgba(20, 39, 64, 0.96);
        border-color: rgba(99, 139, 204, 0.82);
      }

      .rag-message-role {
        font-size: 0.68rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #f4ceab;
      }

      .rag-message-body {
        margin-top: 0.35rem;
        font-size: 0.88rem;
        line-height: 1.55;
        white-space: pre-wrap;
      }

      .rag-message-muted {
        margin-top: 0.45rem;
        color: #97abcf;
        font-size: 0.74rem;
      }

      .rag-sources {
        margin-top: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
      }

      .rag-sources strong {
        font-size: 0.72rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #9cb6e3;
      }

      .rag-source {
        border: 1px solid rgba(51, 76, 110, 0.7);
        border-radius: 0.75rem;
        background: rgba(10, 19, 31, 0.82);
        padding: 0.55rem 0.6rem;
      }

      .rag-source-title,
      .rag-source-kind {
        display: inline-flex;
        font-size: 0.68rem;
        text-transform: uppercase;
      }

      .rag-source-title {
        color: #d9e6ff;
        font-weight: 700;
        margin-right: 0.4rem;
      }

      .rag-source-kind {
        color: #8ca8d5;
      }

      .rag-source p {
        margin-top: 0.3rem;
        color: #becde8;
        font-size: 0.77rem;
        line-height: 1.45;
      }

      .rag-form {
        padding: 0.9rem 1rem 1rem;
        border-top: 1px solid rgba(55, 78, 111, 0.72);
        display: flex;
        flex-direction: column;
        gap: 0.7rem;
      }

      .rag-input {
        width: 100%;
        border: 1px solid rgba(77, 110, 161, 0.76);
        border-radius: 0.9rem;
        background: rgba(10, 18, 31, 0.94);
        color: #edf3ff;
        padding: 0.8rem 0.9rem;
        resize: vertical;
        min-height: 5.5rem;
      }

      .rag-actions {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        align-items: center;
      }

      .rag-error {
        color: #ffb5b5;
        font-size: 0.75rem;
        line-height: 1.4;
      }

      .rag-send {
        border: 1px solid rgba(95, 136, 201, 0.8);
        border-radius: 999px;
        background: linear-gradient(135deg, rgba(31, 57, 92, 0.98), rgba(18, 36, 58, 0.98));
        color: #edf3ff;
        padding: 0.65rem 1rem;
        font-weight: 700;
      }

      .rag-send:disabled {
        opacity: 0.55;
      }

      @media (max-width: 640px) {
        .rag-shell {
          right: 0.75rem;
          left: 0.75rem;
          align-items: stretch;
        }

        .rag-launcher {
          justify-content: center;
        }

        .rag-panel {
          width: 100%;
        }
      }
    `
  ]
})
export class RagChatWidgetComponent implements OnInit {
  open = false;
  loading = false;
  draft = '';
  errorMessage = '';
  currentRoute = '/';
  currentRouteLabel = 'landing';
  messages: WidgetMessage[] = [
    {
      id: 1,
      role: 'assistant',
      content:
        'Posso responder perguntas sobre o produto e, quando você estiver autenticado, também usar contexto das suas tasks e documentos.',
      muted: 'Na v1 eu só respondo perguntas; não executo ações.'
    }
  ];

  private nextMessageId = 2;

  constructor(private readonly api: ApiService, private readonly router: Router) {}

  ngOnInit(): void {
    this.captureRoute(this.router.url);
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe((event) => {
      this.captureRoute(event.urlAfterRedirects);
    });
  }

  toggleOpen(): void {
    this.open = !this.open;
  }

  submit(): void {
    const question = this.draft.trim();
    if (!question || this.loading) {
      return;
    }

    this.errorMessage = '';
    this.messages = [...this.messages, { id: this.nextMessageId++, role: 'user', content: question }];
    this.loading = true;
    this.draft = '';

    this.api
      .askRag({
        question,
        route: this.currentRoute,
        history: this.messages
          .filter((message) => message.role === 'user' || message.role === 'assistant')
          .map<RagChatMessage>((message) => ({ role: message.role, content: message.content }))
      })
      .subscribe({
        next: (response) => this.appendAssistantResponse(response),
        error: (error) => {
          this.loading = false;
          this.errorMessage = error?.error?.detail || 'Não foi possível consultar o assistente agora.';
        }
      });
  }

  private appendAssistantResponse(response: RagChatResponse): void {
    this.loading = false;
    this.messages = [
      ...this.messages,
      {
        id: this.nextMessageId++,
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        muted: response.usedUserData ? 'Resposta com contexto do produto e dos seus dados.' : 'Resposta baseada apenas na documentação do produto.'
      }
    ];
  }

  private captureRoute(url: string): void {
    this.currentRoute = url;
    if (url === '/') {
      this.currentRouteLabel = 'landing';
      return;
    }
    this.currentRouteLabel = url.replace(/^\//, '');
  }
}
