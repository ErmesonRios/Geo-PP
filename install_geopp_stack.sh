#!/bin/bash

echo "🔧 Atualizando o sistema..."
sudo apt update && sudo apt upgrade -y

echo "📦 Instalando pacotes essenciais..."
sudo apt install -y gpsd gpsd-clients hostapd dnsmasq git build-essential cmake

echo "🟢 Instalando Node.js (versão LTS)..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

echo "📁 Clonando e compilando RTKLIB..."
cd ~
git clone https://github.com/tomojitakasu/RTKLIB.git
cd RTKLIB/app/str2str/gcc
make

# Verificando se o str2str foi criado
if [[ -f ./str2str ]]; then
    echo "✅ str2str compilado com sucesso!"
    sudo cp str2str /usr/local/bin/
else
    echo "❌ Erro ao compilar str2str!"
    exit 1
fi

echo "✅ Instalação concluída!"
echo "✔️ gpsd, node, hostapd, dnsmasq e str2str estão prontos."
