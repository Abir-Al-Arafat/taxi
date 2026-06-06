# Golden Module Checklist

Every future module should satisfy this checklist before it is considered complete.

## Architecture

- [ ] Thin controller
- [ ] Business logic in service
- [ ] Reusable code extracted when repeated
- [ ] Proper request validation
- [ ] Proper authorization where needed
- [ ] Proper error handling
- [ ] Proper response structure
- [ ] HTTP status and response body status are synchronized
- [ ] No hardcoded status codes

## Code Quality

- [ ] KISS
- [ ] DRY
- [ ] SOLID
- [ ] Readability
- [ ] Scalability
- [ ] Maintainability
- [ ] Security

## Auth-module standards to mirror

- [ ] Hash passwords before persistence
- [ ] Hash refresh tokens before persistence
- [ ] Never store raw OTP values
- [ ] Use purpose-aware OTP verification when multiple flows share the same endpoint
- [ ] Require verified reset-code state before resetting a password
- [ ] Use `ResponseBuilder` for every response
- [ ] Include `status` in every response body
- [ ] Throw `AppError` for operational failures
- [ ] Keep route validation separate from business logic
- [ ] Keep templates separate from service logic

## Required deliverables for a new module

- [ ] `*.schema.ts`
- [ ] `*.types.ts`
- [ ] `*.repository.ts`
- [ ] `*.service.ts`
- [ ] `*.controller.ts`
- [ ] `*.validators.ts`
- [ ] `*.route.ts`
- [ ] route registration in `src/routes/index.ts`
