# Welcome to Treenix

A composable typed tree platform — nodes, components, contexts.
## Where to go from here

- **[Open the editor](/t)** — browse your tree, edit nodes, run actions
- **[Read the full docs](https://treenix.io/docs)** — concepts, guides, API reference

## Three primitives

```
Component = { $type: string } & Data
Node      = { $path, $type, ...components }
Context   = Map<type+context, handler>
```

Compose components on a node, render via context. That's the whole platform.

## Next steps

- Edit `docs/welcome.md` (this file) and reload — content syncs to the tree
- [Add a custom mod](https://treenix.io/docs/guides/create-a-mod.md) under `./mods/your-mod/` with a `types.ts` and `client.ts`


