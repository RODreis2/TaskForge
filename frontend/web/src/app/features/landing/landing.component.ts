import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

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
          <a routerLink="/login" class="btn-ghost">Login</a>
          <a routerLink="/register" class="btn-ghost">Criar conta</a>
          <a routerLink="/dashboard" class="btn-primary">Abrir dashboard</a>
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
            <div class="tf-hero-actions">
              <a routerLink="/dashboard" class="btn-primary">Ir para dashboard</a>
              <a routerLink="/login" class="btn-ghost">Entrar</a>
              <a routerLink="/register" class="btn-ghost">Criar conta</a>
            </div>
          </div>

          <aside class="tf-hero-visual" aria-label="Prévia visual do TaskForge">
            <div class="tf-surface">
              <div class="tf-tree-chip tf-tree-chip-root">Projetos</div>
              <div class="tf-tree-chip tf-tree-chip-a">Produto</div>
              <div class="tf-tree-chip tf-tree-chip-b">Sprint 12</div>
              <div class="tf-note tf-note-a">
                <strong>Task</strong>
                <p>Refinar onboarding visual</p>
              </div>
              <div class="tf-note tf-note-b">
                <strong>Bloco</strong>
                <p>Desenho de fluxo e priorização</p>
              </div>
              <div class="tf-note tf-note-c">
                <strong>Status</strong>
                <p>Salvo automaticamente</p>
              </div>
              <svg class="tf-wire-map" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <path d="M17 24 C30 24, 39 18, 54 17" />
                <path d="M24 31 C34 37, 45 42, 56 42" />
                <path d="M92 58 C83 72, 67 64, 50 76" />
                <circle cx="17" cy="24" r="1.15" />
                <circle cx="54" cy="17" r="1.15" />
                <circle cx="24" cy="31" r="1.15" />
                <circle cx="56" cy="42" r="1.15" />
                <circle cx="92" cy="58" r="1.15" />
                <circle cx="50" cy="76" r="1.15" />
              </svg>
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
          <a routerLink="/register" class="btn-primary">Começar agora</a>
          <a routerLink="/login" class="btn-ghost">Já tenho conta</a>
          <a routerLink="/dashboard" class="btn-ghost">Acessar dashboard</a>
        </div>
      </section>

      <footer class="tf-footer tf-container">
        <span>TaskForge</span>
        <small>Planejamento visual para execução profissional.</small>
      </footer>
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

      .tf-hero-actions {
        margin-top: 1.2rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.55rem;
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

      .tf-tree-chip {
        position: absolute;
        border: 1px solid #436ca7;
        background: rgba(20, 37, 62, 0.92);
        color: #dce8ff;
        border-radius: 0.52rem;
        font-size: 0.8rem;
        padding: 0.3rem 0.5rem;
        white-space: nowrap;
      }

      .tf-tree-chip-root {
        top: 1rem;
        left: 0.8rem;
      }

      .tf-tree-chip-a {
        top: 3.3rem;
        left: 2rem;
      }

      .tf-tree-chip-b {
        top: 5.6rem;
        left: 3.25rem;
      }

      .tf-note {
        position: absolute;
        border: 1px solid #4a638a;
        border-radius: 0.72rem;
        background: rgba(16, 26, 40, 0.9);
        padding: 0.55rem 0.6rem;
        width: min(15.2rem, 66%);
      }

      .tf-note strong {
        font-size: 0.72rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #f4ceab;
      }

      .tf-note p {
        margin-top: 0.2rem;
        font-size: 0.84rem;
        line-height: 1.4;
        color: #d6e0f1;
      }

      .tf-note-a {
        top: 1.35rem;
        right: 0.85rem;
      }

      .tf-note-b {
        top: 8.6rem;
        right: 1.6rem;
      }

      .tf-note-c {
        left: 1.35rem;
        bottom: 1rem;
      }

      .tf-wire-map {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .tf-wire-map path {
        fill: none;
        stroke: rgba(154, 198, 255, 0.72);
        stroke-width: 0.62;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-dasharray: 1.8 1.8;
      }

      .tf-wire-map circle {
        fill: #97c0ff;
        opacity: 0.92;
        filter: drop-shadow(0 0 3px rgba(133, 185, 255, 0.64));
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

        .tf-top-actions a {
          text-align: center;
          justify-content: center;
        }

        .tf-footer {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `
  ]
})
export class LandingComponent {}
