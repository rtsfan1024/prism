"""Blake3 hash utility for content addressing."""

import blake3


def compute_blake3(content: str) -> str:
    """Compute a blake3 hash of the given content string.

    Returns the first 16 hex characters of the hash, providing
    sufficient uniqueness for content addressing while remaining
    human-readable.

    Args:
        content: The string content to hash.

    Returns:
        A 16-character hex string.
    """
    return blake3.blake3(content.encode("utf-8")).hexdigest()[:16]
