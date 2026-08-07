import os
import json
import unittest
from fastapi.testclient import TestClient
from jose import jwt
from main import app, get_db_connection
from unittest.mock import patch, MagicMock, AsyncMock

client = TestClient(app)

SECRET = "test_secret_for_jwt"
os.environ["JWT_ACCESS_SECRET"] = SECRET

def generate_mock_jwt(sub="test_user", role="USER"):
    payload = {"sub": sub, "email": "test@example.com", "role": role}
    return jwt.encode(payload, SECRET, algorithm="HS256")

# Mock the database connection
def mock_db_connection(is_pro):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.fetchone.return_value = (is_pro,)
    return mock_conn

class TestSecurity(unittest.TestCase):
    def test_missing_jwt(self):
        response = client.post("/api/v1/ai/tryon", json={"analysis_id": "test", "hairstyle_id": 1})
        self.assertIn(response.status_code, [401, 403])

    def test_invalid_jwt(self):
        response = client.post(
            "/api/v1/ai/tryon",
            json={"analysis_id": "test", "hairstyle_id": 1},
            headers={"Authorization": "Bearer invalid_token"}
        )
        self.assertEqual(response.status_code, 401)

    @patch("main.get_db_connection")
    @patch("main.redis.from_url")
    def test_valid_free_user_free_hairstyle(self, mock_redis, mock_get_db):
        mock_get_db.return_value = mock_db_connection(is_pro=False)
        mock_redis_client = MagicMock()
        mock_redis_client.get = AsyncMock(return_value="0")
        mock_redis_client.incr = AsyncMock()
        mock_redis_client.expire = AsyncMock()
        mock_redis_client.close = AsyncMock()
        mock_redis.return_value = mock_redis_client
        
        token = generate_mock_jwt()
        response = client.post(
            "/api/v1/ai/tryon",
            json={"analysis_id": "fake_id", "hairstyle_id": 1},
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(response.status_code, 404)

    @patch("main.get_db_connection")
    @patch("main.redis.from_url")
    def test_valid_free_user_pro_hairstyle(self, mock_redis, mock_get_db):
        mock_get_db.return_value = mock_db_connection(is_pro=False)
        mock_redis_client = MagicMock()
        mock_redis_client.get = AsyncMock(return_value="0")
        mock_redis_client.incr = AsyncMock()
        mock_redis_client.expire = AsyncMock()
        mock_redis_client.close = AsyncMock()
        mock_redis.return_value = mock_redis_client
        
        token = generate_mock_jwt()
        response = client.post(
            "/api/v1/ai/tryon",
            json={"analysis_id": "fake_id", "hairstyle_id": 4},
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(response.status_code, 403)

    @patch("main.get_db_connection")
    @patch("main.redis.from_url")
    def test_valid_pro_user_pro_hairstyle(self, mock_redis, mock_get_db):
        mock_get_db.return_value = mock_db_connection(is_pro=True)
        mock_redis_client = MagicMock()
        mock_redis_client.get = AsyncMock(return_value="0")
        mock_redis_client.incr = AsyncMock()
        mock_redis_client.expire = AsyncMock()
        mock_redis_client.close = AsyncMock()
        mock_redis.return_value = mock_redis_client
        
        token = generate_mock_jwt()
        response = client.post(
            "/api/v1/ai/tryon",
            json={"analysis_id": "fake_id", "hairstyle_id": 4},
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(response.status_code, 404)

    @patch("main.get_db_connection")
    @patch("main.redis.from_url")
    def test_invalid_hairstyle_id(self, mock_redis, mock_get_db):
        mock_get_db.return_value = mock_db_connection(is_pro=True)
        mock_redis_client = MagicMock()
        mock_redis_client.get = AsyncMock(return_value="0")
        mock_redis_client.incr = AsyncMock()
        mock_redis_client.expire = AsyncMock()
        mock_redis_client.close = AsyncMock()
        mock_redis.return_value = mock_redis_client
        
        token = generate_mock_jwt()
        response = client.post(
            "/api/v1/ai/tryon",
            json={"analysis_id": "fake_id", "hairstyle_id": 9999},
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(response.status_code, 404)

if __name__ == "__main__":
    unittest.main()
