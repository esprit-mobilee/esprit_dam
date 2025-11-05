// src/auth/constants.ts

export const jwtConstants = {
  // ✅ Load secret key from environment variable (.env)
  secret: process.env.JWT_SECRET || 'default_fallback_secret',

  // 🧠 Note:
  // Never hard-code your production secret.
  // In production, define JWT_SECRET in your environment (e.g. Docker, Render, or .env file)
  //
  // Example:
  // JWT_SECRET=mySuperSecretKey123
};

/*
───────────────────────────────────────────────────────────────
💡 Purpose:
This file centralizes the JWT configuration.
By referencing `process.env.JWT_SECRET`, you can easily
change the secret without editing multiple files.
───────────────────────────────────────────────────────────────
*/
