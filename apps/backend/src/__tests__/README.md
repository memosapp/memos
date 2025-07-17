# Backend Unit Tests

This directory previously contained unit tests for the Memos backend API endpoints. The tests were removed during project cleanup as they were outdated and referenced the old PostgreSQL-based architecture.

## Future Testing

New tests should be written to work with the current Supabase-based architecture:

## Running Tests

### Simple Tests (No Dependencies Required)

Run the basic test suite that doesn't require external dependencies:

```bash
npx ts-node src/__tests__/simple-test.ts
```

### Full Jest Tests (Requires Setup)

To run the full Jest test suite, you'll need to install test dependencies first:

```bash
# Install test dependencies
npm install --save-dev jest@29.7.0 supertest@6.3.3 @types/jest@29.5.8 @types/supertest@2.0.16 ts-jest@29.1.1

# Run tests
npm test
```

## Test Coverage

The tests cover the following core functionality:

### Essential Success Paths:

- Health endpoint returns status
- Create memo with valid data
- Retrieve memo by ID
- Search memos with query

### Essential Failure Paths:

- Create memo with missing required fields
- Search without query parameter
- Retrieve non-existent memo

## Test Structure

The tests use mocked database connections and services to isolate the API logic. Each test focuses on:

1. **Input validation** - Ensuring required fields are present
2. **Response format** - Checking correct JSON structure
3. **Status codes** - Verifying appropriate HTTP responses
4. **Core business logic** - Testing the essential functionality

## Adding New Tests

To add new tests:

1. For simple tests: Add to `simple-test.ts` using the `runner.test()` method
2. For Jest tests: Create new `.test.ts` files following the existing pattern

## Notes

- These are minimal tests focused on core functionality
- Edge cases are intentionally skipped for MVP
- Database operations are mocked to avoid external dependencies
- Tests focus on API contracts rather than implementation details
