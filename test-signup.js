fetch('http://localhost:3000/api/v1/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'testuser2026@styleme.ai',
    phone_number: '+998901234567',
    password: 'SecurePassword123!',
    role: 'USER'
  })
})
.then(r => r.json().then(data => ({status: r.status, data})))
.then(res => {
  console.log("=== SAYT ORQALI RO'YXATDAN O'TISH NATIJASI ===");
  console.log("HTTP Status:", res.status);
  console.log("Javob:", JSON.stringify(res.data, null, 2));
})
.catch(console.error);
