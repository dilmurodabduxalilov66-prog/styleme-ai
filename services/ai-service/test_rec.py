import requests
import json
import os
from jose import jwt

SECRET = os.getenv("JWT_ACCESS_SECRET", "test_secret_for_jwt")

def generate_mock_jwt(sub="test_user", role="USER"):
    payload = {"sub": sub, "email": "test@example.com", "role": role}
    return jwt.encode(payload, SECRET, algorithm="HS256")

token = generate_mock_jwt()

# Hit the recommendation API
response = requests.get(
    "http://127.0.0.1:8000/api/v1/ai/recommendations",
    headers={"Authorization": f"Bearer {token}"}
)

print(response.status_code)
print(response.text)
