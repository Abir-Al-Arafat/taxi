# Example Pagination, Filtering, Sorting, and Search Pattern

Reference standard: the repository layer in `src/repositories/base.repository.ts` and the query optimization guidance in `/.ai/database-patterns.md`.

## Current state of the codebase

- There is no shipped list endpoint yet that implements pagination.
- The repository already exposes the basic building blocks: `findMany(filter)`, `findOne(filter)`, and `updateOne(...)`.
- The project docs already require limiting list results, sorting deterministically, and using `.lean()` for read-only queries.

## Project standard to follow when adding the first list endpoint

```typescript
async listUsers({ page = 1, limit = 10, sort = "-createdAt", search }: PaginationQuery) {
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { deletedAt: null };

  if (search) {
    filter.$or = [
      { firstName: new RegExp(search, "i") },
      { lastName: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
    ];
  }

  const [items, total] = await Promise.all([
    this.model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    this.model.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
```

## Filtering rules

- Build the filter object in the repository or service before querying.
- Use explicit filters, not ad hoc query strings in controllers.
- Keep soft-delete filters consistent when a module uses them.

## Sorting rules

- Default to a stable sort such as `-createdAt`.
- Only expose a limited set of safe sort fields.
- Keep sorting in the repository layer, not the controller.

## Search rules

- Use search only on fields that are actually indexed or intentionally searchable.
- Start with simple text matching when the module is small.
- Promote to more advanced search only when the data model requires it.

## Why this belongs in the repository layer

- Pagination and filtering are query concerns.
- The service should ask for the page of data; the repository should build the query.
- This keeps controllers thin and keeps MongoDB access centralized.
