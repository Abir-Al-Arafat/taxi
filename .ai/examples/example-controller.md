# Example Controller Pattern

Reference standard: `src/modules/auth/auth.controller.ts`.

## Controller Shape

```typescript
export class AuthController {
  private readonly jwtService = new JwtService();

  constructor(private readonly authService = new AuthService()) {}

  signup = asyncHandler(
    async (
      req: Request<unknown, unknown, SignupRequest>,
      res: Response,
    ): Promise<void> => {
      const user = await this.authService.signup(req.body);

      res
        .status(201)
        .json(
          ResponseBuilder.success(
            "Account created successfully. Verification code sent to email.",
            user,
          ),
        );
    },
  );
}
```

## What the controller does

- Accepts typed Express requests.
- Reads `req.body`, `req.params`, `req.query`, or cookies only when needed.
- Calls the service layer for business logic.
- Formats the response with `ResponseBuilder.success()` or lets `AppError` reach the error middleware.
- Stays thin and avoids direct Mongoose access.

## Actual request handling in the codebase

- `signup`, `login`, `forgotPassword`, `resendOtp`, `verifyOtp`, and `resetPassword` all delegate to `AuthService`.
- `login` also uses `JwtService` to issue tokens and sets the `refreshToken` cookie.
- `refresh` reads the access-token identity from `req.user` and the refresh token from `req.cookies.refreshToken`.
- `logout` clears the refresh cookie and calls the service to clear the stored token hash.

## Validation and error flow

- Validation happens before the controller in the route layer.
- Controllers assume validated input and only guard request-specific concerns if needed.
- Failures are surfaced by throwing `AppError` from the service or by middleware.
- `asyncHandler` catches rejected promises and forwards them to `errorMiddleware`.

## Response pattern

- Message-only success: `ResponseBuilder.success("Password reset successfully")`
- Success with payload: `ResponseBuilder.success("Login successful", { user, accessToken })`
- Verify OTP response: `ResponseBuilder.success(result.message, result.user)`
