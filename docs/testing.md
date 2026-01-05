# Testing Documentation

This project uses a comprehensive test suite with unit, integration, and end-to-end tests.

## Test Structure

- **Unit Tests**: `test/unit/` - Component, hook, and utility tests (Vitest)
- **Integration Tests**: `test/integration/` - Workflow and data flow tests (Vitest)
- **E2E Tests**: `test/e2e/` - End-to-end UI tests (Playwright)

## Documentation

### Unit & Integration Tests
- **[Renderer Tests](renderer-tests.md)** - Comprehensive coverage of the renderer module

### End-to-End Tests
- **[E2E Test Guide](../test/e2e/README.md)** - Complete guide to writing and running E2E tests
  - How to run tests
  - Using shared helpers
  - Test patterns and best practices
  - Screenshot baselines
  - Troubleshooting

## Quick Start

### Run All Tests
```bash
# Unit and integration tests
pnpm test

# E2E tests
pnpm test:e2e
```

### Run Specific Test Suites
```bash
# Unit tests only
pnpm test -- test/unit

# Integration tests only
pnpm test -- test/integration

# E2E tests with specific tag
pnpm test:e2e --grep @smoke
```

## Test Coverage

- **Unit Tests**: 241 tests across 19 files
- **Integration Tests**: 25 tests across 3 files
- **E2E Tests**: ~88 unique tests (440 total executions across 5 browsers)

See the [test pyramid analysis](../.local/test-pyramid-reanalysis.md) for detailed breakdown.

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
