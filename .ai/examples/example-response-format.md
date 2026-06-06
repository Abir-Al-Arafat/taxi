# Example Response Format

Reference standard: `src/core/utils/apiResponse.ts` and the auth controller responses.

## Response shape

```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}
```

## Success responses in the codebase

- Message only:

```json
{ "success": true, "message": "Server is running" }
```

- Message plus payload:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "..." },
    "accessToken": "..."
  }
}
```

- OTP flow message:

```json
{ "success": true, "message": "A verification code has been sent" }
```

## Error responses in the codebase

```json
{ "success": false, "message": "User not found" }
```

```json
{ "success": false, "message": "File size exceeds limit" }
```

## Where responses are produced

- Controllers use `ResponseBuilder.success()`.
- `errorMiddleware` uses `ResponseBuilder.failure()`.
- The root route in `src/app.ts` uses the success builder for the health check.

## Pagination response shape

The codebase does not yet expose a paginated endpoint, but the project standard is to return:

```json
{
  "success": true,
  "message": "Users retrieved",
  "data": {
    "items": [],
    "total": 0,
    "page": 1,
    "limit": 10,
    "totalPages": 0
  }
}
```
