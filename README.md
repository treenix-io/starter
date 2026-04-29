# Treenix Starter

A typed tree runtime where AI agents operate safely.

## Quick Start

```bash
git clone https://github.com/treenix-io/starter.git
cd starter
npm install
npm run dev
```

Open http://localhost:3210

Single process: Vite 8 frontend + Treenix server on :3211.

## Structure

```
starter/
├── tree/seed/      seed tree (checked in)
├── tree/work/      runtime overlay (gitignored, commit for snapshot)
├── mods/            local mods
├── src/main.tsx     frontend entry
├── root.json        server config
├── vite.config.ts   Vite + Treenix plugin
└── package.json     npm deps: @treenx/core, react, mods
```

## Adding Mods

Create a mod in `mods/your-mod/` with `types.ts`, `service.ts`, `client.ts`. Server auto-discovers mods on boot.

## License

FSL-1.1-MIT
