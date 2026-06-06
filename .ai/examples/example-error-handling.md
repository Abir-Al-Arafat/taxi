# Example Error Handling Pattern

Reference standard: `src/core/errors/AppError.ts` and `src/middlewares/error.middleware.ts`.

## Custom error class

```typescript
throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
```

## How errors flow in the codebase

1. Service or repository throws `AppError` for expected failures.
2. Controller is wrapped in `asyncHandler`.
3. `asyncHandler` forwards rejections to the Express error middleware.
4. `errorMiddleware` formats the final response.

## What the current middleware handles

- `AppError` responses map to the stored HTTP status code.
- `multer.MulterError` is converted into a clean `400` response.
- Unhandled errors fall back to `500 Internal server error`.

## Real status code usage in the codebase

- `400`: invalid request shape or code format.
- `401`: missing or invalid token.
- `403`: authenticated but not allowed, or a flow is not ready.
- `404`: resource not found.
- `409`: conflict such as already verified or duplicate identity.
- `422`: validation or semantic failure.
- `500`: unexpected internal failure.

## Pattern to copy

- Throw `AppError` from services and repositories when the failure is expected.
- Do not return raw stack traces to clients.
- Use `ResponseBuilder.failure(err.message)` in the error middleware.
- Keep logging inside the middleware or service-side side-effect handlers.
