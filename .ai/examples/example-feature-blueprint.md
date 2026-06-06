# Example Feature Blueprint

Reference standard: the current auth module implementation.

## Add a new feature the same way this codebase does

### 1. Define the module boundary

- Create `src/modules/<feature>/`.
- Keep controller, service, repository, validators, schema, and types together.
- Add templates or module constants only if the feature actually needs them.

### 2. Create the schema first

- Define the Mongoose document interface.
- Add `timestamps: true`.
- Index the fields that will be queried.
- Mark secrets with `select: false`.
- Use enums for finite states.

### 3. Add request and response types

- Keep request DTOs small and explicit.
- Add a response DTO when the service returns a mapped view instead of the raw document.
- If the feature has multiple states, encode them in the type instead of using loose strings.

### 4. Implement the repository

- Extend `BaseRepository<TSchema>`.
- Put all model access here.
- Add feature-specific finder methods.
- Select only the fields the service actually needs.

### 5. Implement the service

- Put all business logic here.
- Normalize input here.
- Throw `AppError` for expected failures.
- Use private helpers for repeated logic.
- Map database documents to response objects here.

### 6. Implement the controller

- Keep it thin.
- Use `asyncHandler`.
- Delegate to the service.
- Return data with `ResponseBuilder.success()`.

### 7. Implement validation

- Put request validation in `*.validators.ts`.
- Use `express-validator` chains and a shared `handleValidationErrors` step.
- Normalize request shapes before validation when the transport format requires it.

### 8. Wire the route

- Mount validators first.
- Mount authorization middleware where needed.
- Keep route wiring in `*.route.ts`.

### 9. Mount the router

- Add the feature router in `src/routes/index.ts`.
- Keep the top-level path under `/api/v1` from `src/app.ts`.

## Architecture rules to preserve

- Controllers do HTTP only.
- Services do business logic only.
- Repositories do data access only.
- Errors are `AppError`.
- Responses are always built with `ResponseBuilder`.
- Async handlers are always wrapped with `asyncHandler`.

## What to copy from the auth module

- The OTP challenge pattern for short-lived codes.
- The repository `select()` pattern for secrets.
- The route validation order.
- The JWT + cookie handling for session-like auth.
- The document-to-response mapping helpers.
