import hmac, hashlib, base64
from dotenv import load_dotenv
import os

load_dotenv()

env_key = os.environ.get("ESEWA_SECRET_KEY", "NOT FOUND")
print("Key from .env:", repr(env_key))
print("Key length:", len(env_key))
print()

# Test with hardcoded known key
hardcoded_key = b'8gBm/:&EnhH.1[LQ'
message = b'total_amount=110,transaction_uuid=241028,product_code=EPAYTEST'
sig_hardcoded = base64.b64encode(hmac.new(hardcoded_key, message, hashlib.sha256).digest()).decode('utf-8')
print("Sig (hardcoded key):", sig_hardcoded)

# Test with key from .env
env_key_bytes = env_key.encode('utf-8')
sig_env = base64.b64encode(hmac.new(env_key_bytes, message, hashlib.sha256).digest()).decode('utf-8')
print("Sig (env key):      ", sig_env)
print()
print("Keys match:", hardcoded_key == env_key_bytes)
