scp 'c:\maxsus\services\frontend\src\components\layout\Sidebar.tsx' root@45.138.159.102:'/app/services/frontend/src/components/layout/Sidebar.tsx'
$sshCommand = 'cd /app/services/frontend && docker build -t styleme-frontend:latest . && docker stop styleme-frontend && docker rm styleme-frontend && docker run -d --name styleme-frontend --network app_default --network-alias frontend -e PORT=9001 --restart always styleme-frontend:latest'
ssh root@45.138.159.102 $sshCommand
