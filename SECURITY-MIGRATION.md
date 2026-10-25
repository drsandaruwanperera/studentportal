# Student login security migration

## Current behavior and risk

The legacy browser login reads `students/{studentId}` and compares `data.password` in client-side JavaScript. The Firestore rules currently allow public reads/writes for several collections. This means a browser-only check is not an authorization boundary.

## Compatibility requirement

Students continue to use **Student ID + password**. Do not require student email addresses or ask students to change to email/password login.

## Staged migration

1. Deploy the callable `studentIdLogin` function only after Firebase App Check is initialized in the frontend. App Check is enforced by the function.
2. Update the login page to call the function and then call Firebase Auth `signInWithCustomToken(auth, customToken)`. Keep the current grade detection, first-login/password-change routing, and registration routing intact.
3. Update dashboard and all student data access to rely on `auth.currentUser.uid` and verified Firestore rules, not `sessionStorage.loggedIn` as proof of identity.
4. Migrate admin login separately. Do not treat a client-side `sessionStorage` role as authorization.
5. Test Grade 10, Grade 11, A/L 2027 and A/L 2028, including first-login password changes, registration, paper viewing, results, and admin workflows.
6. Only after the application paths are migrated, publish restrictive Firestore rules in a separate reviewed change.

## Important caveats

- The function currently verifies the legacy password field to preserve compatibility; this is a transitional step, not the final password-storage design. Move to salted password hashes and a controlled migration.
- Enable Firebase App Check for the web app before deploying this callable function, otherwise login requests will be rejected.
- Configure Firestore TTL for `_loginRateLimits.expiresAt` to clean up rate-limit documents.
- Do not deploy restrictive Firestore rules before all client reads/writes and the admin system are migrated and tested.
- Do not commit service-account keys or other server credentials. Cloud Functions uses its managed service identity.
