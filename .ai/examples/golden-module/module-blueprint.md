# Golden Module Blueprint

Use the auth module as the blueprint for every future backend module.

## When building a new module

### 1. Create Model

- Add a `*.schema.ts` file.
- Define the document interface.
- Add required fields, enums, indexes, timestamps, and hidden secrets.

### 2. Create Validation

- Add a `*.validators.ts` file.
- Validate request shape in middleware.
- Normalize awkward payload shapes before validation when needed.

### 3. Create Service

- Add a `*.service.ts` file.
- Put business logic, normalization, orchestration, and state transitions there.

### 4. Create Controller

- Add a `*.controller.ts` file.
- Keep it thin.
- Use `asyncHandler`.
- Delegate to the service.

### 5. Create Route

- Add a `*.route.ts` file.
- Mount middleware, validation, and controller handlers in the correct order.

### 6. Register Module

- Mount the router in `src/routes/index.ts`.
- Let `src/app.ts` keep the API version prefix.

### 7. Apply Middleware

- Use body parsing only when required.
- Normalize request bodies before validation when the client format requires it.

### 8. Apply Authorization

- Use `authenticate` for protected routes.
- Use the request identity populated by middleware.

### 9. Apply Response Standards

- Return all responses through `ResponseBuilder`.
- Set the HTTP response code and body `status` from the same `HTTP_STATUS` constant.
- Include `success`, `status`, `message`, and `data` when applicable.
- Use message-only responses when no payload is required.

### 10. Apply Error Handling Standards

- Throw `AppError` for operational failures.
- Let `asyncHandler` and `error.middleware.ts` handle propagation and formatting.

## Required file structure

```text
src/modules/<feature>/
├── <feature>.controller.ts
├── <feature>.repository.ts
├── <feature>.route.ts
├── <feature>.service.ts
├── <feature>.templates.ts   # only if the feature sends templated messages
├── <feature>.types.ts
├── <feature>.validators.ts
└── <feature>.schema.ts
```

## Naming conventions

- routes: `*.route.ts`
- controllers: `*.controller.ts`
- services: `*.service.ts`
- repositories: `*.repository.ts`
- schemas: `*.schema.ts`
- validators: `*.validators.ts`
- templates: `*.templates.ts`
- types: `*.types.ts`

## Dependency flow

```text
route -> controller -> service -> repository -> model
```

- Controllers should not query MongoDB.
- Services should not know Express details.
- Repositories should not contain business logic.

## Layer responsibilities

- Model: schema, indexes, and field visibility.
- Validation: request-shape checks and normalization.
- Service: business rules and orchestration.
- Controller: HTTP request and response handling.
- Route: middleware wiring and endpoint registration.

## Common mistakes to avoid

- Putting business logic in controllers.
- Querying MongoDB directly from controllers or services.
- Returning raw Mongoose documents when a response DTO exists.
- Storing raw OTPs or tokens.
- Skipping validation before the controller.
- Exposing internal error details to clients.
- Adding list endpoints without a stable response shape.
