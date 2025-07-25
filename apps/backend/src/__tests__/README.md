# Tests Directory

This directory contains test files for the backend application using Jest and TypeScript.

## Test Setup

The testing environment is now properly configured with:

- **Jest v29** - Testing framework
- **ts-jest v29** - TypeScript support for Jest
- **supertest v6** - HTTP testing library
- **@types/jest** - TypeScript definitions

## Running Tests

After installing dependencies with `pnpm install`, you can run:

```bash
# Run all tests
pnpm test

# Run tests in watch mode (re-run on file changes)
pnpm run test:watch

# Run tests with coverage report
pnpm run test:coverage
```

## Test Files

Test files should follow the naming convention:

- `*.test.ts` for test files
- Place tests in the same directory structure as the source code

## Current Tests

- `health.test.ts` - Tests the health check endpoint

## Example Test Structure

```typescript
import request from "supertest";
import app from "../app";

describe("API Endpoint", () => {
  it("should return expected response", async () => {
    const response = await request(app).get("/api/endpoint").expect(200);

    expect(response.body).toHaveProperty("data");
  });
});
```

## Test Environment

Tests run with the current Supabase-based architecture. For integration tests that require external services, consider:

1. Using test environment variables
2. Mocking external service calls
3. Setting up test data fixtures

## Mocking External Services

Example of mocking Supabase client:

```typescript
jest.mock("../config/supabase", () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  },
}));
```

## Guidelines

1. Write descriptive test names
2. Follow the AAA pattern (Arrange, Act, Assert)
3. Mock external dependencies when appropriate
4. Test both success and error cases
5. Focus on API contracts and business logic
