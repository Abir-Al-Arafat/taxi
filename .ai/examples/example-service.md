# Example Service Pattern

Reference standard: `src/modules/auth/auth.service.ts`.

## Service Shape

```typescript
export class AuthService {
  private readonly emailService = new EmailService();

  constructor(private readonly authRepository = new AuthRepository()) {}

  async signup(request: SignupRequest): Promise<AuthUserResponse> {
    // normalize input
    // check duplicates
    // hash password
    // create OTP challenge
    // persist user
    // send verification message
    // return mapped response
  }
}
```

## What belongs in the service

- Business rules and state transitions.
- Input normalization such as `normalizeEmail()` and `normalizePhoneNumber()`.
- OTP generation, hashing, and expiry handling.
- Password hashing and password verification.
- Cross-step orchestration such as create-user + send-code + return mapped output.
- Guard clauses that turn invalid business state into `AppError`.

## Real implementation patterns used here

- `signup()` checks for existing email or phone number before creating a user.
- `forgotPassword()` writes password-reset OTP state, sends the reset code, and returns a generic response.
- `resendOtp()` reissues the verification OTP without exposing sensitive internals.
- `verifyOtp()` handles two different purposes: `signup` and `forgot-password`.
- `resetPassword()` requires that reset-code verification has already happened before changing the password.

## Reusable service practices

- Keep side effects behind private helper methods like `sendVerificationMessage()` and `sendPasswordResetMessage()`.
- Use `storeOtpChallengeAndNotify()` to remove duplicated OTP persistence logic.
- Keep Mongoose document mapping in one place with `mapUserToView()` and `mapUserToResponse()`.
- Avoid returning raw database documents when a response DTO exists.
- Use `AppError` for expected failures and let the global error middleware format the response.
