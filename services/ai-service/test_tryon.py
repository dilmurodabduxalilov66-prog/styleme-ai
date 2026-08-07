import os
import time
import requests
import json
from jose import jwt

SECRET = os.getenv("JWT_ACCESS_SECRET", "test_secret_for_jwt")

def generate_mock_jwt(sub="test_user", role="USER"):
    payload = {"sub": sub, "email": "test@example.com", "role": role}
    return jwt.encode(payload, SECRET, algorithm="HS256")

token = generate_mock_jwt()

# Test hitting the tryon endpoint
response = requests.post(
    "http://127.0.0.1:8000/api/v1/ai/tryon",
    json={"analysis_id": "test_analysis_id", "hairstyle_id": 4},
    headers={"Authorization": f"Bearer {token}"}
)

print("Status Code:", response.status_code)
print("Response Body:", response.text)
