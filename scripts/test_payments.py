import requests
import json
import hashlib
import base64

BASE_URL = "http://localhost:9003/api/v1/payments"
CLICK_SECRET_KEY = "click_secret_key_mock_123"
PAYME_SECRET_KEY = "payme_secret_key_mock_123"

def print_result(step, res):
    print(f"\n=== {step} ===")
    print(f"Status: {res.status_code}")
    print(res.json() if res.status_code == 200 else res.text)

def test_checkout():
    res = requests.post(f"{BASE_URL}/checkout", json={
        "booking_id": "test-booking-id",
        "amount": 50000,
        "provider": "CLICK"
    })
    print_result("Generate Click Checkout", res)

    res = requests.post(f"{BASE_URL}/checkout", json={
        "booking_id": "test-booking-id",
        "amount": 50000,
        "provider": "PAYME"
    })
    print_result("Generate Payme Checkout", res)

def test_click_webhook():
    # 1. Prepare
    click_trans_id = 9999
    service_id = 67890
    merchant_trans_id = "mock_booking_id_1"
    amount = 50000
    action = 0
    error = 0
    sign_time = "2026-06-18 12:00:00"
    
    sign_str = f"{click_trans_id}{service_id}{merchant_trans_id}{amount}{action}{error}{sign_time}{CLICK_SECRET_KEY}"
    md5_sign = hashlib.md5(sign_str.encode()).hexdigest()

    payload = {
        "click_trans_id": click_trans_id,
        "service_id": service_id,
        "click_paydoc_id": 1111,
        "merchant_trans_id": merchant_trans_id,
        "amount": amount,
        "action": action,
        "error": error,
        "sign_time": sign_time,
        "sign_string": md5_sign
    }
    
    res = requests.post(f"{BASE_URL}/webhooks/click", data=payload)
    print_result("Click Webhook (Prepare)", res)

    # 2. Complete
    payload["action"] = 1
    sign_str = f"{click_trans_id}{service_id}{merchant_trans_id}{amount}{1}{error}{sign_time}{CLICK_SECRET_KEY}"
    payload["sign_string"] = hashlib.md5(sign_str.encode()).hexdigest()
    
    # NOTE: The complete will fail if "mock_booking_id_1" doesn't exist in DB, 
    # but the routing and signature logic will work. Let's see the 400 Booking target not found.
    res = requests.post(f"{BASE_URL}/webhooks/click", data=payload)
    print_result("Click Webhook (Complete)", res)

def test_payme_webhook():
    auth_str = base64.b64encode(f"Paycom:{PAYME_SECRET_KEY}".encode()).decode()
    headers = {"Authorization": f"Basic {auth_str}"}

    payload = {
        "method": "CheckPerformTransaction",
        "params": {
            "amount": 5000000,
            "account": {
                "booking_id": "mock_booking_id_2"
            }
        },
        "id": 12345
    }
    
    res = requests.post(f"{BASE_URL}/webhooks/payme", json=payload, headers=headers)
    print_result("Payme Webhook (CheckPerformTransaction)", res)

    payload["method"] = "CancelTransaction"
    payload["params"] = {
        "id": "mock_transaction_id",
        "reason": 1,
        "account": {
            "booking_id": "mock_booking_id_2"
        }
    }
    # This will return 400 since booking doesn't exist, but routing is tested
    res = requests.post(f"{BASE_URL}/webhooks/payme", json=payload, headers=headers)
    print_result("Payme Webhook (CancelTransaction)", res)

if __name__ == "__main__":
    test_checkout()
    test_click_webhook()
    test_payme_webhook()
