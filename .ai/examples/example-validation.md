# Example Validation Pattern

Reference standard: `src/modules/auth/auth.validators.ts`.

## Validation style used in the codebase

- Validation is implemented as Express middleware, not inside services.
- The project uses `express-validator` for request checks.
- Custom middleware is used for body normalization when the transport format is awkward.
- Validation failures are converted to `AppError` with a `400` status.

## Real validation helpers

```typescript
const trimAndRequire = (fieldName: string, message: string) =>
  body(fieldName).trim().notEmpty().withMessage(message);

const validateOtpFormat = (fieldName: string) =>
  body(fieldName)
    .trim()
    .matches(/^\d{4}$/)
    .withMessage("OTP must be a 4 digit code");
```

## Actual module validations

- `signupValidation` checks names, phone, email, location, gender, role, password, and confirm password.
- `verifyOtpValidation` checks `phoneNumber`, `purpose`, and OTP format.
- `resetPasswordValidation` checks `phoneNumber`, `password`, and `confirmPassword`.
- `forgotPasswordValidation` and `resendOtpValidation` only require `phoneNumber`.

## Body normalization

- `normalizeSignupLocationFields` converts stringified location input into an object.
- It also supports `location[lat]`, `location[lng]`, and `location[address]` form keys.
- The normalizer deletes the flattened keys after it rebuilds `req.body.location`.

## Verification purpose pattern

- `VerifyOtpRequest` includes a `purpose` field.
- Allowed values are `signup` and `forgot-password`.
- The service uses that value to decide which OTP state to verify.

## Validation rule for future modules

- Keep request shape validation in middleware.
- Keep business-rule validation in the service.
- Return the first validation error through `handleValidationErrors`.
