import requests
import json
import time

BASE_URL = "http://localhost:9001/api/v1/auth"
PHONE = "998901234567"

print("--- Step 1: Sending OTP ---")
res = requests.post(f"{BASE_URL}/send-otp", json={"phone_number": PHONE})
if res.status_code == 200:
    print("SUCCESS: OTP requested successfully.", res.json())
else:
    print("FAILED:", res.status_code, res.text)
    exit(1)

# In real world we get the OTP via SMS. For test, we check redis or guess if dev environment.
# Let's check redis directly
import redis
r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
otp_code = r.get(f"otp:{PHONE}")

print("--- Step 2: Retrieved OTP from Redis ---")
print("OTP Code:", otp_code)

if not otp_code:
    print("FAILED: No OTP found in Redis")
    exit(1)

print("--- Step 3: Verifying OTP ---")
res = requests.post(f"{BASE_URL}/verify-otp", json={
    "phone_number": PHONE,
    "otp": otp_code
})

if res.status_code == 200:
    print("SUCCESS: OTP verified successfully.", res.json())
else:
    print("FAILED:", res.status_code, res.text)
    exit(1)

print("--- Step 4: Signup (with Verified Phone) ---")
res = requests.post(f"{BASE_URL}/signup", json={
    "email": "testeskiz@example.com",
    "phone_number": PHONE,
    "password": "Password123!",
    "role": "USER"
})

if res.status_code in [200, 201]:
    print("SUCCESS: Signup with verified OTP.", res.json())
else:
    print("FAILED:", res.status_code, res.text)
    exit(1)

print("ALL E2E TESTS PASSED.")
