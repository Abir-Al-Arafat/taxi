# Example Route Pattern

Reference standard: `src/modules/auth/auth.route.ts` and `src/app.ts`.

## Route Organization

```typescript
const router = Router();
const upload = multer();
const authController = new AuthController();

router.post(
  "/signup",
  upload.none(),
  normalizeSignupLocationFields,
  signupValidation,
  handleValidationErrors,
  authController.signup,
);
```

## Middleware ordering

1. Parse form-data with `upload.none()` when the endpoint accepts multipart payloads.
2. Normalize request body fields when the client sends nested values as strings.
3. Run validation chains.
4. Run `handleValidationErrors`.
5. Call the controller.

## Actual route pattern in the codebase

- `POST /signup` uses `normalizeSignupLocationFields`, `signupValidation`, and `handleValidationErrors`.
- `POST /login` uses `loginValidation`.
- `POST /forgot-password` uses `forgotPasswordValidation`.
- `POST /resend-otp` uses `resendOtpValidation`.
- `POST /verify-otp` uses `verifyOtpValidation`.
- `POST /reset-password` uses `resetPasswordValidation`.
- `POST /refresh` and `POST /logout` are protected by `authenticate`.

## Authorization flow

- `authenticate` reads the `Authorization: Bearer <token>` header.
- The middleware verifies the access token with `JwtService`.
- Verified identity is attached to `req.user`.
- `refresh` uses `req.user.userId` plus the `refreshToken` cookie.
- `logout` uses `req.user.userId` and clears the refresh cookie.

## Application mounting

- `src/routes/index.ts` mounts the feature router at `/auth`.
- `src/app.ts` prefixes the router with `/api/v1`.
- The auth routes therefore live under `/api/v1/auth`.
