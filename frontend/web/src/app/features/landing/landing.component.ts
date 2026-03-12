import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { UserResponse } from '../../core/api.service';

type LandingPreviewKey = 'onboarding' | 'signup' | 'journey' | 'priorities';

type LandingPreviewScene = {
  sprint: string;
  taskTitle: string;
  saveLabel: string;
  textTitle: string;
  textBody: string;
  drawTitle: string;
  noteTitle: string;
  noteBody: string;
};

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="tf-landing">
      <div class="tf-landing-glow tf-landing-glow-a" aria-hidden="true"></div>
      <div class="tf-landing-glow tf-landing-glow-b" aria-hidden="true"></div>

      <header class="tf-topbar">
        <div class="tf-brand-wrap">
          <span class="tf-brand-dot" aria-hidden="true"></span>
          <span class="tf-brand">TaskForge</span>
        </div>
        <nav class="tf-top-actions" aria-label="Acessos principais">
          <ng-container *ngIf="currentUser; else guestTopActions">
            <a routerLink="/profile" class="btn-ghost">Perfil</a>
            <a routerLink="/dashboard" class="btn-ghost">Dashboard</a>
            <button type="button" class="btn-primary" (click)="logout()">Sair</button>
          </ng-container>
        </nav>
      </header>

      <section class="tf-hero tf-container">
        <div class="tf-hero-grid">
          <div class="tf-hero-copy">
            <p class="tf-kicker">ORGANIZAÇÃO VISUAL + FLUXO CONTÍNUO</p>
            <h1>Planejamento visual para equipes que executam com clareza.</h1>
            <p class="tf-lead">
              O TaskForge conecta pastas, tarefas e workspace criativo em um único fluxo. Menos fricção para organizar,
              priorizar e entregar com previsibilidade.
            </p>
            <p *ngIf="currentUser" class="tf-user-pill">
              Sessão ativa como <strong>{{ currentUser.name }}</strong>
            </p>
            <div class="tf-hero-actions">
              <a routerLink="/dashboard" class="btn-primary">{{ currentUser ? 'Abrir dashboard' : 'Ir para dashboard' }}</a>
              <ng-container *ngIf="currentUser; else guestHeroActions">
                <a routerLink="/profile" class="btn-ghost">Perfil</a>
                <button type="button" class="btn-ghost" (click)="logout()">Sair</button>
              </ng-container>
            </div>
          </div>

          <aside class="tf-hero-visual" aria-label="Prévia visual do TaskForge">
            <div class="tf-surface">
              <div class="tf-app-shell">
                <aside class="tf-app-sidebar">
                  <div class="tf-app-sidebar-head">
                    <span class="tf-app-brand">TaskForge</span>
                    <span class="tf-app-badge">{{ currentPreview.sprint }}</span>
                  </div>

                  <div class="tf-app-tree">
                    <div class="tf-app-tree-group">
                      <span class="tf-app-tree-label">Produto</span>
                      <button
                        class="tf-app-tree-item"
                        [class.tf-app-tree-item-active]="selectedPreview === 'onboarding'"
                        type="button"
                        (click)="selectPreview('onboarding')"
                      >
                        Onboarding visual
                      </button>
                      <button
                        class="tf-app-tree-item"
                        [class.tf-app-tree-item-active]="selectedPreview === 'signup'"
                        type="button"
                        (click)="selectPreview('signup')"
                      >
                        Fluxo de cadastro
                      </button>
                    </div>

                    <div class="tf-app-tree-group">
                      <span class="tf-app-tree-label">Workspace</span>
                      <button
                        class="tf-app-tree-item"
                        [class.tf-app-tree-item-active]="selectedPreview === 'journey'"
                        type="button"
                        (click)="selectPreview('journey')"
                      >
                        Mapa de jornada
                      </button>
                      <button
                        class="tf-app-tree-item"
                        [class.tf-app-tree-item-active]="selectedPreview === 'priorities'"
                        type="button"
                        (click)="selectPreview('priorities')"
                      >
                        Prioridades
                      </button>
                    </div>
                  </div>
                </aside>

                <section class="tf-app-workspace">
                  <header class="tf-app-workspace-head">
                    <div>
                      <p class="tf-app-kicker">Task ativa</p>
                      <h3>{{ currentPreview.taskTitle }}</h3>
                    </div>
                    <span class="tf-app-save">{{ currentPreview.saveLabel }}</span>
                  </header>

                  <div class="tf-app-canvas">
                    <article class="tf-app-block tf-app-block-text">
                      <header>
                        <span>{{ currentPreview.textTitle }}</span>
                        <span>#01</span>
                      </header>
                      <p>{{ currentPreview.textBody }}</p>
                    </article>

                    <article class="tf-app-block tf-app-block-draw">
                      <header>
                        <span>{{ currentPreview.drawTitle }}</span>
                        <span>#02</span>
                      </header>
                      <div class="tf-app-sketch" aria-hidden="true">
                        <span class="tf-app-sketch-node tf-app-sketch-node-a"></span>
                        <span class="tf-app-sketch-node tf-app-sketch-node-b"></span>
                        <span class="tf-app-sketch-node tf-app-sketch-node-c"></span>
                        <svg viewBox="0 0 100 48" preserveAspectRatio="none">
                          <path d="M12 26 C28 8, 42 8, 56 20 S80 34, 90 14" />
                        </svg>
                      </div>
                    </article>

                    <article class="tf-app-note">
                      <strong>{{ currentPreview.noteTitle }}</strong>
                      <p>{{ currentPreview.noteBody }}</p>
                    </article>
                  </div>
                </section>
              </div>
            </div>
          </aside>
        </div>

        <div class="tf-metrics" aria-label="Resumo de capacidades">
          <article>
            <strong>Árvore viva</strong>
            <p>Estruture trabalho por contexto sem perder velocidade.</p>
          </article>
          <article>
            <strong>Workspace híbrido</strong>
            <p>Texto, desenho e imagem no mesmo espaço de execução.</p>
          </article>
          <article>
            <strong>Autosave nativo</strong>
            <p>Continuidade de fluxo sem interrupções e retrabalho.</p>
          </article>
        </div>
      </section>

      <section class="tf-section tf-container" aria-label="Principais benefícios">
        <header class="tf-section-head">
          <p class="tf-kicker tf-kicker-soft">BENEFÍCIOS</p>
          <h2>Feito para reduzir ruído e aumentar foco.</h2>
        </header>
        <div class="tf-benefits">
          <article class="tf-card">
            <h3>Estrutura clara</h3>
            <p>Pastas e tarefas com contexto imediato para facilitar priorização e navegação diária.</p>
          </article>
          <article class="tf-card">
            <h3>Execução visual</h3>
            <p>Converta ideias em blocos práticos usando texto, desenho e imagens no mesmo workspace.</p>
          </article>
          <article class="tf-card">
            <h3>Ritmo contínuo</h3>
            <p>Interações rápidas e salvamento automático para manter a equipe no fluxo de entrega.</p>
          </article>
        </div>
      </section>

      <section class="tf-section tf-container" aria-label="Como funciona">
        <header class="tf-section-head">
          <p class="tf-kicker tf-kicker-soft">FLUXO</p>
          <h2>Do planejamento à execução em três passos.</h2>
        </header>
        <div class="tf-steps">
          <article>
            <span>01</span>
            <h3>Organize</h3>
            <p>Crie pastas por área, cliente ou sprint e mantenha a árvore como mapa de trabalho.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Construa</h3>
            <p>Abra tarefas e monte o quadro com blocos de texto/desenho para registrar decisões.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Entregue</h3>
            <p>Revise, ajuste e compartilhe sem perder histórico, contexto e consistência operacional.</p>
          </article>
        </div>
      </section>

      <section class="tf-cta tf-container" aria-label="Ação final">
        <h2>Centralize a operação e execute com mais precisão.</h2>
        <p>Comece no TaskForge e transforme planejamento em progresso visível.</p>
        <div class="tf-hero-actions">
          <a routerLink="/dashboard" class="btn-primary">Acessar dashboard</a>
          <ng-container *ngIf="currentUser; else guestCtaActions">
            <a routerLink="/profile" class="btn-ghost">Perfil</a>
            <button type="button" class="btn-ghost" (click)="logout()">Sair</button>
          </ng-container>
        </div>
      </section>

      <footer class="tf-footer tf-container">
        <span>TaskForge</span>
        <small>Planejamento visual para execução profissional.</small>
      </footer>

      <ng-template #guestTopActions>
        <a routerLink="/login" class="btn-ghost">Login</a>
        <a routerLink="/register" class="btn-ghost">Criar conta</a>
        <a routerLink="/dashboard" class="btn-primary">Abrir dashboard</a>
      </ng-template>

      <ng-template #guestHeroActions>
        <a routerLink="/login" class="btn-ghost">Entrar</a>
        <a routerLink="/register" class="btn-ghost">Criar conta</a>
      </ng-template>

      <ng-template #guestCtaActions>
        <a routerLink="/register" class="btn-ghost">Começar agora</a>
        <a routerLink="/login" class="btn-ghost">Já tenho conta</a>
      </ng-template>
    </main>
  `,
  styles: [
    `
      .tf-landing {
        min-height: 100vh;
        position: relative;
        overflow-x: hidden;
        color: #e8ecf6;
        background:
          radial-gradient(circle at 20% 10%, rgba(42, 90, 157, 0.25), transparent 34%),
          radial-gradient(circle at 80% 20%, rgba(213, 109, 29, 0.24), transparent 35%),
          linear-gradient(180deg, #0d1018 0%, #0f1521 55%, #111925 100%);
        padding: 1.4rem 1.4rem 2.4rem;
      }

      .tf-container {
        max-width: 74rem;
        margin: 0 auto;
        position: relative;
        z-index: 1;
      }

      .tf-landing-glow {
        position: absolute;
        border-radius: 999px;
        filter: blur(42px);
        opacity: 0.3;
        pointer-events: none;
      }

      .tf-landing-glow-a {
        width: 20rem;
        height: 20rem;
        background: #6ea5ff;
        top: -7rem;
        left: -8rem;
      }

      .tf-landing-glow-b {
        width: 18rem;
        height: 18rem;
        background: #ff9c56;
        right: -7rem;
        top: 4rem;
      }

      .tf-topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin-bottom: 2.6rem;
        position: sticky;
        top: 0.75rem;
        z-index: 10;
        background: rgba(15, 21, 33, 0.68);
        backdrop-filter: blur(6px);
        border: 1px solid rgba(61, 82, 116, 0.65);
        border-radius: 0.9rem;
        padding: 0.75rem 0.8rem;
      }

      .tf-brand-wrap {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
      }

      .tf-brand-dot {
        width: 0.65rem;
        height: 0.65rem;
        border-radius: 999px;
        background: #d56d1d;
        box-shadow: 0 0 0 6px rgba(213, 109, 29, 0.18);
      }

      .tf-brand {
        font-family: "Teko", "IBM Plex Sans", sans-serif;
        font-size: 1.6rem;
        line-height: 1;
        letter-spacing: 0.05em;
      }

      .tf-top-actions {
        display: inline-flex;
        gap: 0.45rem;
        align-items: center;
      }

      .tf-top-actions button {
        border: 0;
      }

      .tf-hero {
        margin-bottom: 2.6rem;
      }

      .tf-hero-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
        align-items: center;
        gap: 1.1rem;
      }

      .tf-hero-copy {
        min-width: 0;
      }

      .tf-kicker {
        font-size: 0.74rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: #f6caa1;
      }

      .tf-kicker-soft {
        color: #9bb2d7;
      }

      .tf-hero h1 {
        margin-top: 0.65rem;
        font-family: "Teko", "IBM Plex Sans", sans-serif;
        font-size: clamp(2.2rem, 6vw, 4.4rem);
        line-height: 0.95;
        letter-spacing: 0.02em;
        max-width: 13ch;
      }

      .tf-lead {
        margin-top: 0.95rem;
        max-width: 62ch;
        color: #c2ccdf;
        font-size: 1.02rem;
        line-height: 1.55;
      }

      .tf-user-pill {
        margin-top: 1rem;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        border: 1px solid rgba(118, 150, 199, 0.55);
        background: rgba(16, 24, 38, 0.72);
        border-radius: 999px;
        padding: 0.4rem 0.75rem;
        color: #dce8ff;
        font-size: 0.88rem;
      }

      .tf-hero-actions {
        margin-top: 1.2rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.55rem;
      }

      .tf-hero-actions button {
        border: 0;
      }

      .tf-hero-visual {
        min-height: 21rem;
      }

      .tf-surface {
        position: relative;
        min-height: 21rem;
        border: 1px solid #35517e;
        border-radius: 1rem;
        background:
          radial-gradient(circle at 80% 18%, rgba(255, 158, 72, 0.22), transparent 38%),
          radial-gradient(circle at 14% 10%, rgba(107, 163, 255, 0.27), transparent 36%),
          linear-gradient(160deg, rgba(18, 31, 50, 0.95), rgba(15, 24, 36, 0.9));
        box-shadow: 0 16px 36px rgba(3, 8, 17, 0.45);
        overflow: hidden;
        padding: 0.85rem;
      }

      .tf-app-shell {
        position: relative;
        z-index: 1;
        min-height: 19.2rem;
        display: grid;
        grid-template-columns: 10.5rem minmax(0, 1fr);
        gap: 0.9rem;
      }

      .tf-app-sidebar {
        border: 1px solid rgba(73, 101, 145, 0.62);
        border-radius: 0.95rem;
        background: rgba(13, 22, 35, 0.86);
        padding: 0.8rem 0.7rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .tf-app-sidebar-head {
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
      }

      .tf-app-brand {
        font-size: 0.82rem;
        font-weight: 700;
        color: #f2f6ff;
      }

      .tf-app-badge {
        width: fit-content;
        border: 1px solid rgba(84, 126, 188, 0.72);
        border-radius: 999px;
        padding: 0.18rem 0.5rem;
        font-size: 0.68rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #a9c4f2;
      }

      .tf-app-tree {
        display: flex;
        flex-direction: column;
        gap: 0.95rem;
      }

      .tf-app-tree-group {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }

      .tf-app-tree-label {
        font-size: 0.66rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #89a0c2;
      }

      .tf-app-tree-item {
        border: 1px solid rgba(60, 86, 123, 0.72);
        border-radius: 0.68rem;
        background: rgba(22, 34, 52, 0.92);
        color: #dce7fb;
        font-size: 0.76rem;
        padding: 0.5rem 0.55rem;
        text-align: left;
      }

      .tf-app-tree-item-active {
        border-color: rgba(108, 149, 213, 0.95);
        box-shadow: inset 0 0 0 1px rgba(108, 149, 213, 0.2);
      }

      .tf-app-workspace {
        border: 1px solid rgba(74, 99, 139, 0.68);
        border-radius: 0.95rem;
        background: rgba(13, 22, 35, 0.78);
        padding: 0.8rem;
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
      }

      .tf-app-workspace-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.75rem;
      }

      .tf-app-kicker {
        font-size: 0.64rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #89a0c2;
      }

      .tf-app-workspace-head h3 {
        margin-top: 0.22rem;
        font-size: 1rem;
        line-height: 1.2;
        color: #f4f7fe;
      }

      .tf-app-save {
        border: 1px solid rgba(78, 119, 175, 0.72);
        border-radius: 999px;
        background: rgba(19, 35, 57, 0.9);
        color: #cde3ff;
        font-size: 0.68rem;
        font-weight: 700;
        padding: 0.28rem 0.55rem;
        white-space: nowrap;
      }

      .tf-app-canvas {
        position: relative;
        flex: 1;
        border: 1px solid rgba(51, 73, 104, 0.72);
        border-radius: 0.9rem;
        background:
          linear-gradient(rgba(133, 169, 228, 0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(133, 169, 228, 0.06) 1px, transparent 1px),
          radial-gradient(circle at 72% 18%, rgba(226, 147, 72, 0.12), transparent 34%),
          rgba(10, 18, 31, 0.92);
        background-size: 24px 24px, 24px 24px, auto, auto;
        overflow: hidden;
        min-height: 12rem;
      }

      .tf-app-block,
      .tf-app-note {
        position: absolute;
        border: 1px solid rgba(77, 107, 152, 0.76);
        border-radius: 0.82rem;
        background: rgba(13, 25, 40, 0.94);
        box-shadow: 0 10px 24px rgba(4, 10, 20, 0.24);
      }

      .tf-app-block {
        width: 10.2rem;
        padding: 0.55rem 0.6rem;
      }

      .tf-app-block header {
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
        font-size: 0.64rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #f4ceab;
      }

      .tf-app-block p {
        margin-top: 0.45rem;
        font-size: 0.76rem;
        line-height: 1.45;
        color: #d8e3f7;
      }

      .tf-app-block-text {
        left: 1rem;
        top: 1.05rem;
      }

      .tf-app-block-draw {
        right: 1rem;
        top: 2.9rem;
        width: 9.8rem;
      }

      .tf-app-sketch {
        position: relative;
        height: 4.2rem;
        margin-top: 0.55rem;
        border-radius: 0.7rem;
        background: rgba(18, 31, 48, 0.88);
      }

      .tf-app-sketch svg {
        position: absolute;
        inset: 0.55rem 0.6rem;
        width: calc(100% - 1.2rem);
        height: calc(100% - 1.1rem);
      }

      .tf-app-sketch path {
        fill: none;
        stroke: rgba(152, 196, 255, 0.92);
        stroke-width: 3;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-dasharray: 7 5;
      }

      .tf-app-sketch-node {
        position: absolute;
        width: 0.55rem;
        height: 0.55rem;
        border-radius: 999px;
        background: #a8cbff;
        box-shadow: 0 0 0 0.2rem rgba(145, 190, 255, 0.14);
      }

      .tf-app-sketch-node-a {
        left: 1rem;
        top: 2.2rem;
      }

      .tf-app-sketch-node-b {
        left: 4.6rem;
        top: 0.95rem;
      }

      .tf-app-sketch-node-c {
        right: 1rem;
        top: 1.45rem;
      }

      .tf-app-note {
        left: 3.1rem;
        bottom: 1rem;
        width: 10.8rem;
        padding: 0.6rem 0.7rem;
      }

      .tf-app-note strong {
        font-size: 0.66rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #f4ceab;
      }

      .tf-app-note p {
        margin-top: 0.38rem;
        font-size: 0.74rem;
        line-height: 1.4;
        color: #d5e0f2;
      }

      .tf-metrics {
        margin-top: 1.4rem;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.75rem;
      }

      .tf-metrics article {
        border: 1px solid #2f415f;
        border-radius: 0.85rem;
        background: rgba(16, 24, 38, 0.62);
        padding: 0.85rem;
      }

      .tf-metrics strong {
        display: block;
        font-size: 0.94rem;
      }

      .tf-metrics p {
        margin-top: 0.35rem;
        color: #b8c3d8;
        font-size: 0.85rem;
        line-height: 1.45;
      }

      .tf-section {
        margin-top: 3rem;
      }

      .tf-section-head h2 {
        margin-top: 0.45rem;
        font-family: "Teko", "IBM Plex Sans", sans-serif;
        letter-spacing: 0.03em;
        font-size: clamp(1.6rem, 4vw, 2.4rem);
      }

      .tf-benefits {
        margin-top: 1rem;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.75rem;
      }

      .tf-card {
        border: 1px solid #2f415f;
        border-radius: 0.85rem;
        background: rgba(16, 24, 38, 0.72);
        backdrop-filter: blur(2px);
        padding: 1rem;
      }

      .tf-card h3 {
        font-size: 1.05rem;
        font-weight: 700;
        color: #f2f6ff;
      }

      .tf-card p {
        margin-top: 0.5rem;
        color: #b7c3da;
        line-height: 1.5;
        font-size: 0.93rem;
      }

      .tf-steps {
        margin-top: 1rem;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.75rem;
      }

      .tf-steps article {
        border: 1px solid #304867;
        border-radius: 0.85rem;
        background: rgba(18, 29, 46, 0.72);
        padding: 1rem;
      }

      .tf-steps span {
        display: inline-flex;
        width: 1.9rem;
        height: 1.9rem;
        border-radius: 999px;
        align-items: center;
        justify-content: center;
        background: rgba(110, 165, 255, 0.2);
        color: #cde3ff;
        font-size: 0.82rem;
        font-weight: 700;
      }

      .tf-steps h3 {
        margin-top: 0.55rem;
        font-size: 1rem;
        font-weight: 700;
      }

      .tf-steps p {
        margin-top: 0.45rem;
        color: #b9c6df;
        font-size: 0.9rem;
        line-height: 1.5;
      }

      .tf-cta {
        margin-top: 3.2rem;
        border: 1px solid #3a5278;
        border-radius: 1rem;
        background: linear-gradient(160deg, rgba(20, 33, 52, 0.85), rgba(20, 28, 41, 0.75));
        padding: 1.1rem;
      }

      .tf-cta h2 {
        font-family: "Teko", "IBM Plex Sans", sans-serif;
        font-size: clamp(1.7rem, 4vw, 2.6rem);
        letter-spacing: 0.03em;
      }

      .tf-cta p {
        margin-top: 0.35rem;
        color: #becae0;
      }

      .tf-footer {
        margin-top: 2rem;
        border-top: 1px solid rgba(74, 98, 136, 0.5);
        padding-top: 0.85rem;
        display: flex;
        justify-content: space-between;
        gap: 0.8rem;
        align-items: center;
        color: #9fb1d1;
        font-size: 0.88rem;
      }

      .tf-footer span {
        font-weight: 700;
      }

      @media (max-width: 920px) {
        .tf-hero-grid,
        .tf-metrics,
        .tf-benefits,
        .tf-steps {
          grid-template-columns: 1fr;
        }

        .tf-hero-visual {
          min-height: 18rem;
        }

        .tf-surface {
          min-height: 18rem;
        }

        .tf-app-shell {
          grid-template-columns: 9rem minmax(0, 1fr);
        }

        .tf-app-note {
          left: 1rem;
          width: calc(100% - 2rem);
        }
      }

      @media (max-width: 620px) {
        .tf-landing {
          padding: 1rem 1rem 2rem;
        }

        .tf-topbar {
          flex-direction: column;
          align-items: flex-start;
          position: static;
        }

        .tf-top-actions {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .tf-top-actions a,
        .tf-top-actions button {
          text-align: center;
          justify-content: center;
          width: 100%;
        }

        .tf-app-shell {
          grid-template-columns: 1fr;
        }

        .tf-app-workspace-head {
          flex-direction: column;
          align-items: flex-start;
        }

        .tf-app-block {
          width: calc(100% - 2rem);
        }

        .tf-app-block-draw {
          left: 1rem;
          right: auto;
          top: 7.2rem;
        }

        .tf-app-note {
          left: 1rem;
          right: 1rem;
          width: auto;
          bottom: 1rem;
        }

        .tf-footer {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `
  ]
})
export class LandingComponent implements OnInit {
  private readonly previewScenes: Record<LandingPreviewKey, LandingPreviewScene> = {
    onboarding: {
      sprint: 'Sprint 12',
      taskTitle: 'Refinar onboarding visual',
      saveLabel: 'Salvo agora',
      textTitle: 'Texto',
      textBody: 'Reorganizar etapas, reduzir atrito e destacar CTA principal na primeira dobra.',
      drawTitle: 'Desenho',
      noteTitle: 'Próximo passo',
      noteBody: 'Validar nova hierarquia com métricas de conclusão do cadastro.'
    },
    signup: {
      sprint: 'Sprint 13',
      taskTitle: 'Ajustar fluxo de cadastro',
      saveLabel: 'Salvo há 1 min',
      textTitle: 'Checklist',
      textBody: 'Remover campos redundantes, simplificar senha e inserir validação progressiva.',
      drawTitle: 'Mapa',
      noteTitle: 'Risco',
      noteBody: 'Monitorar abandono na etapa de confirmação de e-mail após a mudança.'
    },
    journey: {
      sprint: 'Pesquisa',
      taskTitle: 'Montar mapa de jornada',
      saveLabel: 'Sincronizado',
      textTitle: 'Insights',
      textBody: 'Identificar pontos de atrito entre descoberta, primeira ação e retorno ao workspace.',
      drawTitle: 'Fluxo',
      noteTitle: 'Foco',
      noteBody: 'Cruzar feedback qualitativo com eventos da navegação para priorizar melhorias.'
    },
    priorities: {
      sprint: 'Planejamento',
      taskTitle: 'Reordenar prioridades',
      saveLabel: 'Salvo agora',
      textTitle: 'Resumo',
      textBody: 'Separar ganhos rápidos, dependências críticas e tarefas que liberam mais contexto.',
      drawTitle: 'Quadro',
      noteTitle: 'Decisão',
      noteBody: 'Subir primeiro os itens com alto impacto e baixa complexidade operacional.'
    }
  };

  currentUser: UserResponse | null = null;
  selectedPreview: LandingPreviewKey = 'onboarding';

  constructor(private readonly auth: AuthService) {}

  get currentPreview(): LandingPreviewScene {
    return this.previewScenes[this.selectedPreview];
  }

  ngOnInit(): void {
    this.currentUser = this.auth.currentUser;
    this.auth.checkSession().subscribe(() => {
      this.currentUser = this.auth.currentUser;
    });
  }

  logout(): void {
    this.auth.logout().subscribe(() => {
      this.currentUser = null;
    });
  }

  selectPreview(preview: LandingPreviewKey): void {
    this.selectedPreview = preview;
  }
}
