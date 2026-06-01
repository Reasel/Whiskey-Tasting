/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  // lib/scoring.ts is pure data logic with no RN imports, so the
  // jest-expo transform is sufficient. No setup files are needed.
};
