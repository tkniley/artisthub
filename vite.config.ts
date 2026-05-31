import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'save-portfolio-data',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.method === 'POST' && req.url === '/api/save-portfolio') {
            let body = '';
            for await (const chunk of req) {
              body += chunk;
            }
            try {
              const data = JSON.parse(body);
              const dataDir = path.resolve(__dirname, 'data');
              
              if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir);
              }

              if (data.profile) {
                fs.writeFileSync(
                  path.join(dataDir, 'profile.json'),
                  JSON.stringify(data.profile, null, 2),
                  'utf-8'
                );
              }
              if (data.artworks) {
                fs.writeFileSync(
                  path.join(dataDir, 'artworks.json'),
                  JSON.stringify(data.artworks, null, 2),
                  'utf-8'
                );
              }
              if (data.collections) {
                fs.writeFileSync(
                  path.join(dataDir, 'collections.json'),
                  JSON.stringify(data.collections, null, 2),
                  'utf-8'
                );
              }

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Unknown error' }));
            }
          } else {
            next();
          }
        });
      }
    }
  ],
})

