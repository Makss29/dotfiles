// server.js - reads Copilot CLI session events and streams to Angular via SSE
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const os = require('os');

const app = express();
app.use(cors());

const COPILOT_DIR = path.join(os.homedir(), '.copilot');
const SESSION_STATE_DIR = path.join(COPILOT_DIR, 'session-state');
const LOG_DIR = path.join(COPILOT_DIR, 'logs');

function getActiveSessions() {
  if (!fs.existsSync(SESSION_STATE_DIR)) return [];
  return fs.readdirSync(SESSION_STATE_DIR)
    .filter(f => fs.statSync(path.join(SESSION_STATE_DIR, f)).isDirectory())
    .map(sessionId => {
      const dir = path.join(SESSION_STATE_DIR, sessionId);
      const eventsFile = path.join(dir, 'events.jsonl');
      const lockFiles = fs.readdirSync(dir).filter(f => f.endsWith('.lock'));
      const isActive = lockFiles.length > 0;
      const events = [];

      if (fs.existsSync(eventsFile)) {
        const lines = fs.readFileSync(eventsFile, 'utf8').trim().split('\n').filter(Boolean);
        lines.slice(-50).forEach(line => {
          try { events.push(JSON.parse(line)); } catch {}
        });
      }

      return { sessionId, isActive, events, lockFiles };
    });
}

function getLatestLog() {
  if (!fs.existsSync(LOG_DIR)) return [];
  const logs = fs.readdirSync(LOG_DIR)
    .filter(f => f.endsWith('.log'))
    .map(f => ({ name: f, mtime: fs.statSync(path.join(LOG_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  if (!logs.length) return [];
  const latest = path.join(LOG_DIR, logs[0].name);
  const content = fs.readFileSync(latest, 'utf8');
  return content.trim().split('\n').slice(-100);
}

// SSE endpoint
app.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = () => {
    try {
      const data = {
        sessions: getActiveSessions(),
        logs: getLatestLog(),
        timestamp: new Date().toISOString()
      };
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (e) {
      res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
    }
  };

  send();
  const interval = setInterval(send, 1500);

  // Watch for file changes
  const watcher = chokidar.watch(COPILOT_DIR, {
    ignored: /session-store|\.db/,
    ignoreInitial: true,
    depth: 4
  });
  watcher.on('change', send).on('add', send);

  req.on('close', () => {
    clearInterval(interval);
    watcher.close();
  });
});

app.get('/status', (req, res) => {
  res.json({ sessions: getActiveSessions(), logs: getLatestLog() });
});

const PORT = 3232;
app.listen(PORT, () => console.log(`Agent Dashboard backend: http://localhost:${PORT}`));
