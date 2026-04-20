# Decision Kill-Switch Test Suites

This document outlines the validation procedures for the surgical deployment of the Logic Engine.

## 1. Unit Components [MODULARITY]
| Component | Test Logic | Expected Outcome |
| :--- | :--- | :--- |
| `gemini.ts` | Invalid logic input | Catch and re-throw "Surgical error" |
| `gemini.ts` | Valid input | Return 100% compliant JSON schema |
| `tracking.ts` | Demo used | Set localStorage, `canProceed` = false |
| `tracking.ts` | Auth user (5/5) | `canProceed` = false |

## 2. Integration: Data Pipeline [KPI DRIVEN]
- **Latency Check**: P95 response must be < 2000ms.
- **Persistence Check**: Every success must write to `decisions` AND increment `users.usageCount` atomically.

## 3. Security: Auth Barrier [ROBUST]
- [x] Rule 1: No read/write to `users` if `uid` mismatch.
- [x] Rule 2: Force max 5 generations via `usageCount` validator.
- [x] Rule 3: Deny unauthenticated writes if `userId` is not "demo".

## 4. UI/UX: Frictionless Check
- [ ] Verify first-load under 500ms.
- [ ] Ensure "Sign In" is zero-redirect (Popup mode).
- [ ] Validation of result card animations.

## CI/CD Linkage
*This file is parsed by the deployment pipeline to verify assertions before promotion to production.*
