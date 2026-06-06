# Example Authentication Flow

Reference standard: `src/modules/auth/auth.service.ts`, `src/modules/auth/auth.controller.ts`, `src/middlewares/auth.middleware.ts`, and `src/shared/services/jwt.service.ts`.

## Current auth flow in the codebase

### 1. Signup

- `AuthService.signup()` normalizes email and phone number.
- It checks for duplicate email or phone number.
- It hashes the password.
- It creates a verification OTP challenge.
- It stores the OTP hash and expiry on the user record.
- It sends the verification message using the email templates.

### 2. Verify signup OTP

- `verifyOtp()` is called with `purpose: "signup"`.
- The service validates the stored verification token hash and expiry.
- The user is marked `isVerified: true`.
- `verifiedAt` is set.
- The verification token is removed from the document.

### 3. Login

- `login()` checks the phone number and password.
- It refuses access if the account is not verified.
- The controller signs an access token and a refresh token using `JwtService`.
- The refresh token is hashed and stored via `saveRefreshToken()`.
- The refresh token is also sent to the client in an HTTP-only cookie.

### 4. Refresh token flow

- `authenticate` verifies the access token from the `Authorization: Bearer ...` header.
- `refresh()` reads the refresh token from `req.cookies.refreshToken`.
- `refresh()` verifies the stored hashed refresh token and expiry.
- A new access token is issued.

### 5. Logout

- `logout()` clears the stored refresh token on the user document.
- The controller clears the `refreshToken` cookie.

### 6. Forgot password / reset password

- `forgotPassword()` writes a password reset OTP challenge.
- `verifyOtp()` with `purpose: "forgot-password"` marks the reset code as verified.
- `resetPassword()` checks that the reset code was verified before changing the password.
- After a successful reset, the reset token fields are cleared.

## JWT handling

- Access tokens use `env.jwtAccessSecret` and `env.jwtAccessExpiresIn`.
- Refresh tokens use `env.jwtRefreshSecret` and `env.jwtRefreshExpiresIn`.
- Cookie max-age is derived with `jwtExpiresInToMs()`.
- The codebase stores the refresh token hash, not the raw token.

## Middleware usage

- `authenticate` is used on protected routes.
- It sets `req.user` after verifying the access token.
- `cookieParser()` is enabled in `src/app.ts` so refresh token cookies are available.

## Template usage

- `auth.templates.ts` builds email and SMS content for verification and password-reset codes.
- Templates are specific to the current auth flows and are not generic notification placeholders.
