# 📡 GeoPP – Gerenciador de Dados GNSS em Campo

**GeoPP** (Geospatial Pre-Processing) é uma aplicação desenvolvida para Raspberry Pi Zero 2w, voltada à gravação e gerenciamento de dados GNSS brutos no formato **UBX**. Com uma interface web local, o sistema permite o controle completo da coleta em campo, mesmo sem conexão com a internet.

---

## 🚀 Funcionalidades

- ✅ Gravação de dados GNSS no formato `.ubx` via porta serial
- ✅ Visualização em tempo real dos satélites via GPSD
- ✅ Renomear arquivos gravados diretamente pela interface
- ✅ Download dos arquivos `.ubx` através do navegador
- ✅ Compactação dos arquivos em `.zip` para facilitar o envio
- ✅ Interface web responsiva e acessível via rede Wi-Fi local

---

## 🧱 Tecnologias Utilizadas

- **Node.js** – backend leve e eficiente
- **HTML/CSS/JavaScript** – frontend web interativo
- **gpsd** – daemon para visualização e parsing de dados GNSS
- **RTKLIB (str2str)** – captura e streaming dos dados UBX
- **Raspberry Pi Zero 2w** – plataforma embarcada

