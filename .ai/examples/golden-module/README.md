# Golden Module

The auth module is the Golden Module for this backend.

## Why this module was selected

This is the most complete, clean, and production-oriented module currently in the project. It is the only feature module with a full end-to-end implementation covering:

- request validation
- controller orchestration
- service-layer business rules
- repository-based data access
- schema definitions and indexes
- OTP generation and verification
- password hashing and reset flow
- JWT issuance and refresh token persistence
- email/SMS template generation
- authorization middleware usage

It demonstrates the actual architecture the backend should follow when new modules are added.

## Architectural strengths

- Thin controllers that delegate work to services.
- Service-layer business logic with reusable private helpers.
- Repository abstraction for all MongoDB access.
- Explicit DTOs and response mapping.
- OTP state is stored as hashes, not raw values.
- Password reset requires verified reset-code state before mutation.
- Refresh tokens are hashed before persistence.
- Response format is consistent through `ResponseBuilder`.
- Every API response body includes `success`, `status`, and `message`, with `data` when applicable.
- Errors are thrown as `AppError` and centralized in middleware.
- Route-layer validation keeps controllers clean.

## Folder structure demonstrated by the Golden Module

```text
src/modules/auth/
├── auth.controller.ts
├── auth.repository.ts
├── auth.route.ts
├── auth.service.ts
├── auth.templates.ts
├── auth.types.ts
├── auth.validators.ts
└── user.schema.ts
```

## Development standards demonstrated

- `*.route.ts` wires middleware, validation, and controller methods.
- `*.controller.ts` stays focused on HTTP concerns only.
- `*.service.ts` owns business logic, state transitions, and normalization.
- `*.repository.ts` owns all model reads and writes.
- `*.validators.ts` handles request-shape validation and body normalization.
- `*.schema.ts` defines document shape, indexes, and field visibility.
- `*.templates.ts` owns email/SMS content.
- `AppError`, `ResponseBuilder`, and `asyncHandler` are used consistently.

## Patterns future modules should follow

1. Create the schema first.
2. Add request/response types.
3. Add a repository with query helpers.
4. Add a service with private helpers for repeated logic.
5. Add a thin controller wrapped with `asyncHandler`.
6. Add route-level validation before the controller.
7. Mount the router in `src/routes/index.ts`.
8. Use `AppError` for all operational failures.
9. Return responses through `ResponseBuilder`.
10. Keep secrets hashed and never store raw OTPs or tokens.

## Files in this Golden Module reference set

- `controller.example.ts`
- `service.example.ts`
- `route.example.ts`
- `validator.example.ts`
- `model.example.ts`
- `error-handling.example.ts`
- `response-pattern.example.ts`
- `module-blueprint.md`
- `module-checklist.md`

## How future sessions should use this module

1. Read `/.ai` for the project-wide rules.
2. Read `/.ai/examples/golden-module`.
3. Use the auth module as the template for structure and behavior.
4. Build the new feature with the same architecture boundaries.
5. Keep new code consistent with the existing backend patterns.
