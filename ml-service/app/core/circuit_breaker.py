"""
Thread-safe circuit breaker implementation.

States:
  CLOSED    — normal operation; failures are counted.
  OPEN      — service is considered unavailable; all calls rejected immediately.
              Transitions to HALF_OPEN after `timeout` seconds.
  HALF_OPEN — one probe call is allowed through.
              Success  → CLOSED (counter reset).
              Failure  → OPEN again (timer reset).

Usage:
    # Create one instance per protected dependency
    clip_circuit    = CircuitBreaker(name="clip")
    pinecone_circuit = CircuitBreaker(name="pinecone")

    # In an endpoint:
    clip_circuit.check()                               # raises 503 if OPEN
    result = clip_circuit.call(some_sync_fn, *args)    # records success/failure

    # Or as a decorator on a sync function:
    @clip_circuit.protect
    def do_work(): ...
"""

import logging
import threading
import time
from enum import Enum
from typing import Any, Callable, TypeVar

from fastapi import HTTPException, status

from app.core.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T")


class State(str, Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"


class CircuitBreaker:
    """
    A thread-safe circuit breaker.

    Parameters
    ----------
    name:      Human-readable label used in logs and error messages.
    threshold: Consecutive failures before opening the circuit.
    timeout:   Seconds to stay OPEN before transitioning to HALF_OPEN.
    """

    def __init__(
        self,
        name: str,
        threshold: int | None = None,
        timeout: int | None = None,
    ) -> None:
        self.name = name
        self.threshold = threshold or settings.CIRCUIT_BREAKER_THRESHOLD
        self.timeout = timeout or settings.CIRCUIT_BREAKER_TIMEOUT

        self._state = State.CLOSED
        self._failure_count = 0
        self._opened_at: float | None = None
        self._lock = threading.Lock()

    # ── Public API ────────────────────────────────────────────────────

    @property
    def state(self) -> State:
        with self._lock:
            return self._get_state()

    def check(self) -> None:
        """
        Raise HTTP 503 immediately if the circuit is OPEN.
        Call this at the top of an endpoint before doing real work.
        """
        with self._lock:
            current = self._get_state()
        if current == State.OPEN:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Circuit open for '{self.name}'. Try again in a moment.",
            )

    def call(self, fn: Callable[..., T], *args: Any, **kwargs: Any) -> T:
        """
        Call `fn(*args, **kwargs)` and record success or failure.
        Raises the original exception on failure (after recording it).
        """
        self.check()
        try:
            result = fn(*args, **kwargs)
            self._record_success()
            return result
        except (HTTPException, RuntimeError):
            raise  # don't double-wrap FastAPI exceptions
        except Exception as exc:
            self._record_failure()
            raise exc

    def protect(self, fn: Callable[..., T]) -> Callable[..., T]:
        """Decorator version of call()."""
        def wrapper(*args: Any, **kwargs: Any) -> T:
            return self.call(fn, *args, **kwargs)
        wrapper.__name__ = fn.__name__
        return wrapper

    def reset(self) -> None:
        """Manually reset the circuit to CLOSED (useful in tests)."""
        with self._lock:
            self._state = State.CLOSED
            self._failure_count = 0
            self._opened_at = None

    # ── Internal ──────────────────────────────────────────────────────

    def _get_state(self) -> State:
        """
        Evaluate time-based transition OPEN → HALF_OPEN.
        Must be called while holding self._lock.
        """
        if self._state == State.OPEN:
            assert self._opened_at is not None
            if time.monotonic() - self._opened_at >= self.timeout:
                logger.info(
                    "CircuitBreaker '%s': OPEN → HALF_OPEN after %ss timeout.",
                    self.name,
                    self.timeout,
                )
                self._state = State.HALF_OPEN
        return self._state

    def _record_success(self) -> None:
        with self._lock:
            if self._state in (State.HALF_OPEN, State.OPEN):
                logger.info(
                    "CircuitBreaker '%s': probe succeeded — resetting to CLOSED.",
                    self.name,
                )
            self._state = State.CLOSED
            self._failure_count = 0
            self._opened_at = None

    def _record_failure(self) -> None:
        with self._lock:
            self._failure_count += 1
            logger.warning(
                "CircuitBreaker '%s': failure %d/%d.",
                self.name,
                self._failure_count,
                self.threshold,
            )
            if self._failure_count >= self.threshold or self._state == State.HALF_OPEN:
                self._state = State.OPEN
                self._opened_at = time.monotonic()
                logger.error(
                    "CircuitBreaker '%s': circuit OPENED after %d failures.",
                    self.name,
                    self._failure_count,
                )


# ── Shared instances ──────────────────────────────────────────────────────
# One breaker per protected dependency so CLIP failures don't block Pinecone.
clip_circuit = CircuitBreaker(name="clip")
pinecone_circuit = CircuitBreaker(name="pinecone")
gemini_circuit = CircuitBreaker(name="gemini")
