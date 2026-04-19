import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RagChatWidgetComponent } from './features/rag/rag-chat-widget.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RagChatWidgetComponent],
  template: `
    <router-outlet></router-outlet>
    <app-rag-chat-widget></app-rag-chat-widget>
  `
})
export class AppComponent {}
