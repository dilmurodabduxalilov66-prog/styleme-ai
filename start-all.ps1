# Start PostgreSQL, MongoDB, Redis in docker
docker-compose up -d

# Start NestJS microservices
$AuthProc = Start-Process cmd.exe -ArgumentList "/c npm run start" -WorkingDirectory "$((Get-Location).Path)\services\auth-service" -PassThru -WindowStyle Hidden -RedirectStandardOutput "..\..\logs-auth.txt" -RedirectStandardError "..\..\logs-auth-err.txt"
$BookingProc = Start-Process cmd.exe -ArgumentList "/c npm run start" -WorkingDirectory "$((Get-Location).Path)\services\booking-service" -PassThru -WindowStyle Hidden -RedirectStandardOutput "..\..\logs-booking.txt" -RedirectStandardError "..\..\logs-booking-err.txt"
$PaymentProc = Start-Process cmd.exe -ArgumentList "/c npm run start" -WorkingDirectory "$((Get-Location).Path)\services\payment-service" -PassThru -WindowStyle Hidden -RedirectStandardOutput "..\..\logs-payment.txt" -RedirectStandardError "..\..\logs-payment-err.txt"
$ReputationProc = Start-Process cmd.exe -ArgumentList "/c npm run start" -WorkingDirectory "$((Get-Location).Path)\services\reputation-service" -PassThru -WindowStyle Hidden -RedirectStandardOutput "..\..\logs-reputation.txt" -RedirectStandardError "..\..\logs-reputation-err.txt"

# Start Python AI service
$AiProc = Start-Process python -ArgumentList "main.py" -WorkingDirectory "$((Get-Location).Path)\services\ai-service" -PassThru -WindowStyle Hidden -RedirectStandardOutput "..\..\logs-ai.txt" -RedirectStandardError "..\..\logs-ai-err.txt"

# Start Frontend service
$FrontendProc = Start-Process cmd.exe -ArgumentList "/c npm run start" -WorkingDirectory "$((Get-Location).Path)\services\frontend" -PassThru -WindowStyle Hidden -RedirectStandardOutput "..\..\logs-frontend.txt" -RedirectStandardError "..\..\logs-frontend-err.txt"

Write-Host "Services started. Auth PID: $($AuthProc.Id), Booking PID: $($BookingProc.Id), Payment PID: $($PaymentProc.Id), Reputation PID: $($ReputationProc.Id), AI PID: $($AiProc.Id), Frontend PID: $($FrontendProc.Id)"

# Save PIDs to file for easy cleanup
"auth=$($AuthProc.Id)`nbooking=$($BookingProc.Id)`npayment=$($PaymentProc.Id)`nreputation=$($ReputationProc.Id)`nai=$($AiProc.Id)`nfrontend=$($FrontendProc.Id)" | Out-File -FilePath "services.pids" -Encoding utf8
