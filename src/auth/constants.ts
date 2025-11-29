// src/auth/constants.ts

export const jwtConstants = {
  /**
   * 🔐 Secret key used for signing JWT tokens.
   * Loaded from the environment (.env) for security.
   * Fallback is provided for local/dev use only.
   */
  secret: process.env.JWT_SECRET ?? 'default_fallback_secret',

  /**
   * ⏰ Token expiration duration.
   * Default: 24h (adjustable via .env)
   */
  expiresIn: process.env.JWT_EXPIRES_IN ?? '24h',
};

/*
───────────────────────────────────────────────────────────────
💡 PURPOSE:
This file centralizes all JWT-related configuration.
It ensures consistency and easy environment-based overrides.

🧠 GOOD PRACTICE:
- Never hard-code secrets in source code for production.
- Define `JWT_SECRET` and `JWT_EXPIRES_IN` inside `.env`.

🌱 Example (.env):
JWT_SECRET=mySuperSecretKey
JWT_EXPIRES_IN=24h
───────────────────────────────────────────────────────────────
*/
