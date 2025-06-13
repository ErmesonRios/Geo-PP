#!/bin/bash

USER=$(whoami)
USER_HOME="/home/$USER"
APP_DIR="$USER_HOME/Geo-PP"
APP_FILE="index.mjs"

echo "🔧 Atualizando o sistema..."
sudo apt update && sudo apt upgrade -y

echo "📦 Instalando pacotes essenciais..."
sudo apt install -y gpsd gpsd-clients hostapd dnsmasq git build-essential cmake jq curl

echo "🟢 Instalando Node.js (versão LTS)..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

echo "📁 Clonando e compilando RTKLIB..."
cd ~
git clone https://github.com/tomojitakasu/RTKLIB.git
cd RTKLIB/app/str2str/gcc
make

if [[ -f ./str2str ]]; then
    echo "✅ str2str compilado com sucesso!"
    sudo cp str2str /usr/local/bin/
else
    echo "❌ Erro ao compilar str2str!"
    exit 1
fi

echo "📁 Clonando seu projeto Geo-PP..."
cd "$USER_HOME"
git clone https://github.com/ErmesonRios/Geo-PP.git

echo "🛠️ Configurando GPSD para iniciar com o sistema..."
sudo systemctl stop gpsd.socket
sudo systemctl disable gpsd.socket

echo 'START_DAEMON="true"
GPSD_OPTIONS="-n"
DEVICES="/dev/ttyACM0"
USBAUTO="false"
GPSD_SOCKET="/var/run/gpsd.sock"' | sudo tee /etc/default/gpsd > /dev/null

sudo systemctl enable gpsd
sudo systemctl restart gpsd

echo "🕒 Criando script para sincronizar hora com o GPS..."
cat << 'EOF' > "$USER_HOME/set-gps-time.sh"
#!/bin/bash
# Script para sincronizar o relógio do sistema com o tempo do GPS via gpsd
for i in {1..30}; do
  timestr=$(gpspipe -w -n 10 | grep -m 1 TPV | jq -r 'select(.class=="TPV" and .mode>=2) | .time')
  if [[ "$timestr" != "null" && "$timestr" != "" ]]; then
    echo "Data/hora do GPS: $timestr"
    sudo date -u -s "$timestr"
    break
  fi
  sleep 2
done
EOF

chmod +x "$USER_HOME/set-gps-time.sh"

echo "🛠️ Criando serviço systemd para sincronizar hora no boot..."
sudo bash -c "cat > /etc/systemd/system/gps-time-sync.service <<EOF
[Unit]
Description=Sincronizar horário do sistema com GPS
After=gpsd.service

[Service]
Type=oneshot
ExecStart=$USER_HOME/set-gps-time.sh
User=$USER

[Install]
WantedBy=multi-user.target
EOF"

sudo systemctl daemon-reexec
sudo systemctl daemon-reload
sudo systemctl enable gps-time-sync.service

echo "🛠️ Criando serviço systemd para iniciar index.mjs no boot..."
sudo bash -c "cat > /etc/systemd/system/nodeapp.service <<EOF
[Unit]
Description=Aplicação Node.js Geo-PP
After=network.target

[Service]
ExecStart=/usr/bin/node $APP_DIR/$APP_FILE
WorkingDirectory=$APP_DIR
Restart=always
User=$USER
Environment=NODE_ENV=production
StandardOutput=inherit
StandardError=inherit

[Install]
WantedBy=multi-user.target
EOF"

sudo systemctl enable nodeapp.service
sudo systemctl start nodeapp.service

echo "✅ Tudo pronto!"
echo "✔️ gpsd inicia com o sistema"
echo "✔️ index.mjs será executado automaticamente"
echo "✔️ Hora do sistema será sincronizada com o GPS no boot"
