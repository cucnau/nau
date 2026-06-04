import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';

async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(express.json());

  // In-memory Database
  const state = {
    chatMessages: [] as { id: string, uid: string, displayName: string, content: string, createdAt: number }[],
    users: {} as Record<string, { uid: string, displayName: string, choco: number, goldenChoco: number, checkInStreak: number, lastCheckInDate: string }>,
  };

  const usersClients = new Set<WebSocket>();

  // Initialize generic Express Server
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    usersClients.add(ws);
    
    // Send initial state upon connection
    ws.send(JSON.stringify({ type: 'init', payload: state.chatMessages }));

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'chat_message') {
          const newMsg = {
            id: Math.random().toString(36).substring(7),
            uid: data.payload.uid,
            displayName: data.payload.displayName,
            content: data.payload.content,
            createdAt: Date.now(),
            activeTitle: data.payload.activeTitle || null
          };
          state.chatMessages.push(newMsg);
          if (state.chatMessages.length > 100) state.chatMessages.shift(); // keep last 100
          
          const broadcastMsg = JSON.stringify({ type: 'chat_message', payload: newMsg });
          usersClients.forEach(c => {
            if (c.readyState === WebSocket.OPEN) {
              c.send(broadcastMsg);
            }
          });
        }
      } catch (err) {
        console.error('Invalid WS message', err);
      }
    });

    ws.on('close', () => {
      usersClients.delete(ws);
    });
  });

  // Basic API for user syncing
  app.post('/api/syncUser', (req, res) => {
    const { uid, displayName, choco, goldenChoco, checkInStreak, lastCheckInDate } = req.body;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });
    
    // Merge state (client is truth source for this assignment if no auth is implemented, 
    // but ideally sever is truth. Let's let the client manage choco for now)
    state.users[uid] = { uid, displayName, choco, goldenChoco, checkInStreak, lastCheckInDate };
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

startServer().catch(console.error);
