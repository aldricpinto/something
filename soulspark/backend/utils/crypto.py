from __future__ import annotations

import base64
import os
from typing import Optional

try:
    from cryptography.fernet import Fernet  # type: ignore
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM  # type: ignore
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC  # type: ignore
    from cryptography.hazmat.primitives import hashes  # type: ignore
except Exception:  # pragma: no cover - optional in dev
    Fernet = None  # type: ignore
    AESGCM = None  # type: ignore
    PBKDF2HMAC = None  # type: ignore
    hashes = None  # type: ignore


_FERNET: Optional["Fernet"] = None
_AESGCM: Optional["AESGCM"] = None
_KDF_DONE: bool = False


def _derive_key_from_passphrase(passphrase: str, salt: bytes) -> Optional[bytes]:
    if PBKDF2HMAC is None or hashes is None:
        return None
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=390000)
    return kdf.derive(passphrase.encode("utf-8"))


def _load_aesgcm() -> Optional["AESGCM"]:
    global _AESGCM, _KDF_DONE
    if _AESGCM is not None:
        return _AESGCM
    if AESGCM is None:
        return None

    # Preferred configuration: JOURNAL_KEY (base64 or passphrase) + JOURNAL_SALT
    key_env = os.getenv("JOURNAL_KEY") or os.getenv("JOURNAL_ENC_KEY")
    salt_env = os.getenv("JOURNAL_SALT")
    key_bytes: Optional[bytes] = None

    if key_env:
        # Try base64 first
        try:
            key_bytes = base64.urlsafe_b64decode(key_env)
            if len(key_bytes) != 32:
                key_bytes = None
        except Exception:
            key_bytes = None
        if key_bytes is None:
            # Derive from passphrase if salt is provided
            if salt_env:
                try:
                    salt = base64.urlsafe_b64decode(salt_env)
                except Exception:
                    salt = salt_env.encode("utf-8")
            else:
                # Fallback salt from JWT_SECRET to avoid accidental no-encryption
                fallback = os.getenv("JWT_SECRET", "manna-default-salt")
                salt = fallback.encode("utf-8")
            key_bytes = _derive_key_from_passphrase(key_env, salt)
            _KDF_DONE = True

    if key_bytes is None:
        return None

    try:
        _AESGCM = AESGCM(key_bytes)
    except Exception:
        _AESGCM = None
    return _AESGCM


def _load_fernet() -> Optional["Fernet"]:
    global _FERNET
    if _FERNET is not None:
        return _FERNET
    if Fernet is None:
        return None

    key = os.getenv("JOURNAL_ENC_KEY") or os.getenv("JWT_SECRET")
    if not key:
        return None
    try:
        # Accept raw 32-byte urlsafe base64 key or any passphrase; if not base64, derive from sha256
        if len(key) < 43:  # likely passphrase
            import hashlib

            digest = hashlib.sha256(key.encode("utf-8")).digest()
            b64 = base64.urlsafe_b64encode(digest)
            _FERNET = Fernet(b64)
        else:
            # assume urlsafe base64 key
            _FERNET = Fernet(key.encode("utf-8"))
    except Exception:
        _FERNET = None
    return _FERNET


def encrypt_text(plaintext: str) -> str:
    if plaintext is None or plaintext == "":
        return ""

    # Prefer AES-GCM with random nonce; token format: enc1:<base64(nonce|ciphertext)>
    aes = _load_aesgcm()
    if aes is not None:
        try:
            import os as _os

            nonce = _os.urandom(12)
            ct = aes.encrypt(nonce, plaintext.encode("utf-8"), associated_data=None)
            token = base64.urlsafe_b64encode(nonce + ct).decode("utf-8").rstrip("=")
            return f"enc1:{token}"
        except Exception:
            pass

    # Fallback to Fernet
    f = _load_fernet()
    if f is not None:
        try:
            return f.encrypt(plaintext.encode("utf-8")).decode("utf-8")
        except Exception:
            pass

    # Last resort: plaintext (not recommended)
    return plaintext


def decrypt_text(ciphertext: str) -> str:
    if ciphertext is None or ciphertext == "":
        return ""

    # AES-GCM token
    if ciphertext.startswith("enc1:"):
        aes = _load_aesgcm()
        if aes is not None:
            try:
                raw = ciphertext.split(":", 1)[1]
                padded = raw + "=" * (-len(raw) % 4)
                blob = base64.urlsafe_b64decode(padded)
                nonce, ct = blob[:12], blob[12:]
                pt = aes.decrypt(nonce, ct, associated_data=None)
                return pt.decode("utf-8")
            except Exception:
                return ciphertext
        return ciphertext

    # Fernet token
    if ciphertext.startswith("gAAAA"):
        f = _load_fernet()
        if f is not None:
            try:
                return f.decrypt(ciphertext.encode("utf-8")).decode("utf-8")
            except Exception:
                return ciphertext
        return ciphertext

    # Not encrypted / legacy plaintext
    return ciphertext


def has_encryption() -> bool:
    return _load_aesgcm() is not None or _load_fernet() is not None


def is_probably_encrypted(value: str) -> bool:
    if not value or len(value) < 8:
        return False
    if value.startswith("enc1:") or value.startswith("gAAAA"):
        return True
    return False
