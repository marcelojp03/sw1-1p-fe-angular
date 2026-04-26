import { Component, OnInit, OnDestroy, Input, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DividerModule } from 'primeng/divider';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../../environments/environment';
import { ChatMessageResponse, SendMessageRequest } from '../../models/chat.model';

@Component({
    selector: 'app-chat-panel',
    standalone: true,
    templateUrl: './chat-panel.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, DividerModule, ScrollPanelModule, DatePipe],
})
export class ChatPanelComponent implements OnInit, OnDestroy {
    @Input({ required: true }) procedureId!: string;

    private http = inject(HttpClient);

    messages = signal<ChatMessageResponse[]>([]);
    newMessage = signal('');
    loading = signal(false);

    private stompClient?: Client;
    private apiUrl = environment.api.baseUrl;
    private wsUrl = environment.api.baseUrl.replace('/api', '') + '/ws';

    ngOnInit(): void {
        this.cargarHistorial();
        this.conectarWebSocket();
    }

    ngOnDestroy(): void {
        this.stompClient?.deactivate();
    }

    private cargarHistorial(): void {
        this.loading.set(true);
        this.http.get<ChatMessageResponse[]>(`${this.apiUrl}/chat/${this.procedureId}`)
            .subscribe({
                next: (msgs) => { this.messages.set(msgs); this.loading.set(false); },
                error: () => this.loading.set(false),
            });
    }

    private conectarWebSocket(): void {
        this.stompClient = new Client({
            webSocketFactory: () => new SockJS(this.wsUrl) as any,
            reconnectDelay: 5000,
            onConnect: () => {
                this.stompClient!.subscribe(`/topic/chat/${this.procedureId}`, (frame) => {
                    const msg: ChatMessageResponse = JSON.parse(frame.body);
                    this.messages.update(current =>
                        current.some(m => m.id === msg.id) ? current : [...current, msg]
                    );
                });
            },
        });
        this.stompClient.activate();
    }

    enviar(): void {
        const text = this.newMessage().trim();
        if (!text) return;
        const body: SendMessageRequest = { message: text };
        this.http.post<ChatMessageResponse>(`${this.apiUrl}/chat/${this.procedureId}`, body)
            .subscribe({
                next: (msg) => {
                    this.messages.update(current =>
                        current.some(m => m.id === msg.id) ? current : [...current, msg]
                    );
                    this.newMessage.set('');
                },
            });
    }

    setNewMessage(value: string): void {
        this.newMessage.set(value);
    }
}
