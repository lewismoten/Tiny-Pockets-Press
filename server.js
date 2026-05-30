const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 3000);
const rootDir = __dirname;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function safePathname(urlString) {
  const requestUrl = new URL(urlString, `http://${host}:${port}`);
  const decodedPath = decodeURIComponent(requestUrl.pathname);
  const normalizedPath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
  const relativePath = normalizedPath.replace(/^[/\\]+/, "");
  const requestedPath = path.join(rootDir, relativePath);
  if (!requestedPath.startsWith(rootDir)) return null;
  return requestedPath;
}

const server = http.createServer((req, res) => {
  const filePath = safePathname(req.url || "/");
  if (!filePath) {
    send(res, 403, "Forbidden");
    return;
  }

  let resolvedPath = filePath;
  if (resolvedPath.endsWith(path.sep)) resolvedPath = path.join(resolvedPath, "index.html");

  fs.stat(resolvedPath, (statError, stats) => {
    if (statError) {
      const fallbackPath = path.join(rootDir, "index.html");
      fs.readFile(fallbackPath, (fallbackError, html) => {
        if (fallbackError) {
          send(res, 404, "Not found");
          return;
        }
        send(res, 200, html, {
          "Content-Type": contentTypes[".html"],
          "Cache-Control": "no-cache",
        });
      });
      return;
    }

    const finalPath = stats.isDirectory()
      ? path.join(resolvedPath, "index.html")
      : resolvedPath;

    fs.readFile(finalPath, (readError, file) => {
      if (readError) {
        send(res, 500, "Unable to read file");
        return;
      }

      const ext = path.extname(finalPath).toLowerCase();
      send(res, 200, file, {
        "Content-Type": contentTypes[ext] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
    });
  });
});

server.listen(port, host, () => {
  console.log(`Tiny Pockets Press running at http://${host}:${port}`);
});
