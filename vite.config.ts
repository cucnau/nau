import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'save-stories-json-api',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const isMatch = req.url && req.url.includes('save-stories-json') && req.method === 'POST';
            
            // Debug logging to a file to assist troubleshooting
            try {
              fs.appendFileSync(
                path.join(process.cwd(), 'debug_requests.log'),
                `[${new Date().toISOString()}] URL: ${req.url}, Method: ${req.method}, isMatch: ${isMatch}\n`
              );
            } catch (e) {}

            if (isMatch) {
              let body = '';
              req.on('data', chunk => {
                body += chunk;
              });
              req.on('end', () => {
                try {
                  if (!body) {
                    throw new Error('Empty request body received by Vite dev server.');
                  }
                  const { stories, chapters } = JSON.parse(body);
                  if (!stories || !chapters) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Missing stories or chapters' }));
                    return;
                  }

                  const payload = JSON.stringify({ stories, chapters }, null, 2);

                  // 1. Write to public/data/stories_data.json
                  const publicDataDir = path.join(process.cwd(), 'public', 'data');
                  if (!fs.existsSync(publicDataDir)) {
                    fs.mkdirSync(publicDataDir, { recursive: true });
                  }
                  const publicFilePath = path.join(publicDataDir, 'stories_data.json');
                  fs.writeFileSync(publicFilePath, payload, 'utf8');

                  // 2. Also write to dist/data/stories_data.json if dist directory exists
                  const distDataDir = path.join(process.cwd(), 'dist', 'data');
                  if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
                    if (!fs.existsSync(distDataDir)) {
                      fs.mkdirSync(distDataDir, { recursive: true });
                    }
                    const distFilePath = path.join(distDataDir, 'stories_data.json');
                    fs.writeFileSync(distFilePath, payload, 'utf8');
                  }

                  console.log(`🎉 [Vite Plugin] Automatically synced ${stories.length} stories to static JSON!`);
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, message: 'Successfully saved stories & chapters statically!' }));
                } catch (err: any) {
                  console.error('Error saving stories static JSON in Vite plugin:', err);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
