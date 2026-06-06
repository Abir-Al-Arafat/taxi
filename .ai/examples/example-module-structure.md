# Example Module Structure

Reference standard: the current `src/modules/auth` module and the shared core layout in `src/`.

## Recommended Structure

```text
src/modules/<feature>/
├── <feature>.route.ts
├── <feature>.controller.ts
├── <feature>.service.ts
├── <feature>.repository.ts
├── <feature>.validators.ts
├── <feature>.types.ts
├── <feature>.schema.ts
├── <feature>.templates.ts   # only when the feature sends templated email/SMS content
└── <feature>.constants.ts   # only when the feature needs domain constants
```

## Responsibilities

- `*.route.ts`: wires Express middleware, validation, auth, and controller handlers.
- `*.controller.ts`: handles HTTP request/response details only.
- `*.service.ts`: contains business logic, orchestration, normalization, and state transitions.
- `*.repository.ts`: contains data access methods and Mongoose query composition.
- `*.validators.ts`: contains request validation chains and normalization middleware.
- `*.types.ts`: contains request, response, DTO, and helper types.
- `*.schema.ts`: contains the Mongoose document interface, schema definition, indexes, and model export.
- `*.templates.ts`: contains user-facing email/SMS templates when the module sends OTPs or notifications.

## What the current codebase actually does

The auth module follows this shape already:

- `src/modules/auth/auth.route.ts` mounts validation and middleware in the route layer.
- `src/modules/auth/auth.controller.ts` keeps HTTP behavior thin and delegates to `AuthService`.
- `src/modules/auth/auth.service.ts` owns OTP generation, password hashing, token handling, and state transitions.
- `src/modules/auth/auth.repository.ts` owns all model queries and write operations.
- `src/modules/auth/user.schema.ts` defines the persisted user document and indexes.
- `src/modules/auth/auth.validators.ts` handles request validation and body normalization.
- `src/modules/auth/auth.templates.ts` owns templated verification and password-reset messages.

## File Creation Rule

When a new feature is added, create the module as a complete unit and then mount it from `src/routes/index.ts`. Do not place controller logic, service logic, or schema fields in unrelated folders.
