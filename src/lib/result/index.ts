/**
 * Result Type - Rust-Inspired Error Handling
 *
 * Phase 1, Week 1, Day 1
 * Based on EXECUTIVE-ROADMAP-BCG.md Section 2.113
 *
 * Implements a Result type for explicit error handling without exceptions.
 */

import { AppError, wrapError } from '../errors';

// ================================================================
// RESULT TYPE
// ================================================================

/**
 * Success result containing a value
 */
export interface Ok<T> {
  ok: true;
  value: T;
}

/**
 * Error result containing an error
 */
export interface Err<E> {
  ok: false;
  error: E;
}

/**
 * Result type - either success with value T or error with type E
 */
export type Result<T, E = AppError> = Ok<T> | Err<E>;

// ================================================================
// CONSTRUCTORS
// ================================================================

/**
 * Create a success result
 */
export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Create an error result
 */
export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// ================================================================
// TYPE GUARDS
// ================================================================

/**
 * Check if result is Ok
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok === true;
}

/**
 * Check if result is Err
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result.ok === false;
}

// ================================================================
// UNWRAPPING
// ================================================================

/**
 * Unwrap a result, throwing if it's an error
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value;
  }
  throw result.error;
}

/**
 * Unwrap a result with a default value
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.ok) {
    return result.value;
  }
  return defaultValue;
}

/**
 * Unwrap a result with a default value factory
 */
export function unwrapOrElse<T, E>(result: Result<T, E>, fn: (error: E) => T): T {
  if (result.ok) {
    return result.value;
  }
  return fn(result.error);
}

/**
 * Unwrap error, throwing if it's Ok
 */
export function unwrapErr<T, E>(result: Result<T, E>): E {
  if (!result.ok) {
    return result.error;
  }
  throw new Error('Called unwrapErr on Ok value');
}

// ================================================================
// TRANSFORMATIONS
// ================================================================

/**
 * Map the success value
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (result.ok) {
    return Ok(fn(result.value));
  }
  return result;
}

/**
 * Map the error value
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  if (!result.ok) {
    return Err(fn(result.error));
  }
  return result;
}

/**
 * FlatMap (chain) the success value
 */
export function andThen<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (result.ok) {
    return fn(result.value);
  }
  return result;
}

/**
 * FlatMap on error
 */
export function orElse<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => Result<T, F>
): Result<T, F> {
  if (!result.ok) {
    return fn(result.error);
  }
  return result;
}

// ================================================================
// ASYNC UTILITIES
// ================================================================

/**
 * Wrap a promise that may throw into a Result
 */
export async function fromPromise<T>(promise: Promise<T>): Promise<Result<T, AppError>> {
  try {
    const value = await promise;
    return Ok(value);
  } catch (error) {
    return Err(wrapError(error));
  }
}

/**
 * Wrap a function that may throw into a Result
 */
export function fromThrowable<T>(fn: () => T): Result<T, AppError> {
  try {
    const value = fn();
    return Ok(value);
  } catch (error) {
    return Err(wrapError(error));
  }
}

/**
 * Wrap an async function that may throw into a Result
 */
export async function fromThrowableAsync<T>(
  fn: () => Promise<T>
): Promise<Result<T, AppError>> {
  try {
    const value = await fn();
    return Ok(value);
  } catch (error) {
    return Err(wrapError(error));
  }
}

// ================================================================
// COLLECTION UTILITIES
// ================================================================

/**
 * Collect an array of Results into a Result of array
 * Returns first error encountered, or Ok with all values
 */
export function all<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];

  for (const result of results) {
    if (!result.ok) {
      return result;
    }
    values.push(result.value);
  }

  return Ok(values);
}

/**
 * Collect Results, accumulating all errors
 */
export function allSettled<T, E>(
  results: Result<T, E>[]
): { values: T[]; errors: E[] } {
  const values: T[] = [];
  const errors: E[] = [];

  for (const result of results) {
    if (result.ok) {
      values.push(result.value);
    } else {
      errors.push(result.error);
    }
  }

  return { values, errors };
}

/**
 * Return first Ok result, or last error
 */
export function firstOk<T, E>(results: Result<T, E>[]): Result<T, E> {
  let lastError: Err<E> | undefined;

  for (const result of results) {
    if (result.ok) {
      return result;
    }
    lastError = result;
  }

  if (lastError) {
    return lastError;
  }

  throw new Error('firstOk called with empty array');
}

// ================================================================
// PIPELINE HELPERS
// ================================================================

/**
 * Create a pipeline of Result-returning functions
 */
export function pipe<T, E>(
  initial: Result<T, E>,
  ...fns: Array<(value: T) => Result<T, E>>
): Result<T, E> {
  let result = initial;

  for (const fn of fns) {
    if (!result.ok) {
      return result;
    }
    result = fn(result.value);
  }

  return result;
}

/**
 * Create an async pipeline of Result-returning functions
 */
export async function pipeAsync<T, E>(
  initial: Result<T, E>,
  ...fns: Array<(value: T) => Promise<Result<T, E>>>
): Promise<Result<T, E>> {
  let result = initial;

  for (const fn of fns) {
    if (!result.ok) {
      return result;
    }
    result = await fn(result.value);
  }

  return result;
}

// ================================================================
// MATCH PATTERN
// ================================================================

/**
 * Pattern match on a Result
 */
export function match<T, E, U>(
  result: Result<T, E>,
  handlers: {
    ok: (value: T) => U;
    err: (error: E) => U;
  }
): U {
  if (result.ok) {
    return handlers.ok(result.value);
  }
  return handlers.err(result.error);
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  Ok,
  Err,
  isOk,
  isErr,
  unwrap,
  unwrapOr,
  unwrapOrElse,
  unwrapErr,
  map,
  mapErr,
  andThen,
  orElse,
  fromPromise,
  fromThrowable,
  fromThrowableAsync,
  all,
  allSettled,
  firstOk,
  pipe,
  pipeAsync,
  match,
};
