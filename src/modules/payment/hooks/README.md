# Payment hook conventions

- `hooks/queries/*Query.ts`: remote reads with stable query keys.
- `hooks/mutations/*Mutation.ts`: writes that encapsulate cache invalidation.
- Screens should compose domain hooks instead of calling `modulesApi` directly.
