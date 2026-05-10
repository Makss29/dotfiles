import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface SessionEvent {
  type?: string;
  [key: string]: any;
}

interface Session {
  sessionId: string;
  isActive: boolean;
  events: SessionEvent[];
  lockFiles: string[];
}

interface StreamData {
  sessions: Session[];
  logs: string[];
  timestamp: string;
  error?: string;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  sessions = signal<Session[]>([]);
  logs = signal<string[]>([]);
  timestamp = signal<string>('');
  connected = signal(false);
  private eventSource?: EventSource;

  ngOnInit() {
    this.connect();
  }

  connect() {
    this.eventSource = new EventSource('http://localhost:3232/stream');
    this.eventSource.onopen = () => this.connected.set(true);
    this.eventSource.onmessage = (e) => {
      const data: StreamData = JSON.parse(e.data);
      if (data.error) return;
      this.sessions.set(data.sessions);
      this.logs.set(data.logs);
      this.timestamp.set(data.timestamp);
    };
    this.eventSource.onerror = () => {
      this.connected.set(false);
      setTimeout(() => this.connect(), 3000);
    };
  }

  ngOnDestroy() {
    this.eventSource?.close();
  }

  shortId(id: string) {
    return id.substring(0, 8) + '...';
  }

  lastEvent(session: Session): string {
    const ev = session.events.at(-1);
    if (!ev) return '—';
    return ev['type'] || ev['content']?.substring?.(0, 80) || JSON.stringify(ev).substring(0, 80);
  }
}

