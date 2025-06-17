import { io } from "socket.io-client";

const socket = io(BACK_URL);
const GRAFIC_LENGTH = 25;

const zipFileSvg = `
<svg class="zipFile" xmlns="http://www.w3.org/2000/svg">
  <use href="#zipFile" />
</svg>
`;

document.addEventListener("DOMContentLoaded", () => {
  const ctx = document.getElementById("grafic").getContext("2d");

  const grafic = new Chart(ctx, {
    type: "bar",
    data: {
      labels: new Array(GRAFIC_LENGTH).fill(""),
      datasets: [
        {
          label: "",
          data: new Array(GRAFIC_LENGTH).fill(0),
          backgroundColor: (ctx) => {
            const value = ctx.dataset.data[ctx.dataIndex];
            return value >= 35
              ? "rgba(0, 255, 0, 0.5)"
              : value >= 20
              ? "rgba(255, 255, 0, 1)"
              : "rgba(255, 0, 0, 0.5)";
          },
          borderColor: (ctx) => {
            const value = ctx.dataset.data[ctx.dataIndex];
            return value >= 35
              ? "rgba(0, 255, 0, 1)"
              : value >= 20
              ? "rgba(255, 255, 0, 1)"
              : "rgba(255, 0, 0, 1)";
          },
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          position: "bottom", // top | bottom
          text: "",
          color: "rgb(0, 255, 0)",
          font: {
            family: "Arial",
            size: 16,
            weight: "bold",
          },
        },
      },
      scales: {
        x: {
          display: false,
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: "white",
            font: {
              size: 12,
              family: "Arial",
            },
          },
          grid: {
            color: "rgba(255, 255, 255, 0.3)",
            lineWidth: 1,
            borderDash: [],
            drawOnChartArea: true,
            drawTicks: true,
          },
        },
      },
    },
  });

  const allBtnDownload = Array.from(document.querySelectorAll(".btnDownload"));
  const allBtnRename = Array.from(document.querySelectorAll(".btnRename"));
  const allBtnDelete = Array.from(document.querySelectorAll(".btnDelete"));

  const btnPower = document.querySelector("#powerOff");

  const log = document.getElementById("log");

  const btnRecord = document.querySelector("#btnRecord");
  const icon = document.querySelector("#icon");
  const label = document.querySelector("#label");
  const tbody = document.querySelector("tbody");

  // Rename
  const renameContainer = document.querySelector("#renameContainer");
  const inputRename = document.querySelector("#rename");
  const btnCancelRename = renameContainer.querySelector("button#cancelRename");
  const btnConfirmRename = renameContainer.querySelector(
    "button#confirmRename"
  );

  // Delete
  const deleteContainer = document.querySelector("#deleteContainer");
  const itemToDel = document.querySelector("#itemToDel");
  const btnCancelDelete = deleteContainer.querySelector("button#cancelDelete");
  const btnConfirmDelete = deleteContainer.querySelector(
    "button#confirmDelete"
  );

  // Name
  const nameContainer = document.querySelector("#nameContainer");
  const inputName = document.querySelector("#name");
  const btnCancelName = nameContainer.querySelector("button#cancelName");
  const btnConfirmName = nameContainer.querySelector("button#confirmName");
  let name = null;

  // Alert
  const alertContainer = document.querySelector("#alertContainer");
  const btnCancel = alertContainer.querySelector("button#cancel");
  const btnContinue = alertContainer.querySelector("button#continue");

  const containerRecord = document.querySelector("div#recordContainer");
  const divTime = document.createElement("div");
  const time = document.createElement("p");

  time.innerText = "00:00";
  divTime.appendChild(time);

  let intervalID;
  let startTimestamp = 0;
  let recording = false;
  let tdToRename;
  let fileName;
  let debounceTimeout = null;

  const getAncestor = (el, n) => {
    while (el && n > 0) {
      el = el.parentElement;
      n--;
    }
    return el;
  };

  const setTable = (list) => {
    const xmlns = "http://www.w3.org/2000/svg";

    list.forEach((it) => {
      const extension = getExtension(it.name);

      const tr = document.createElement("tr");
      const name = document.createElement("td");
      const MB = document.createElement("td");
      const actions = document.createElement("td");
      const divActions = document.createElement("div");

      const btnDownload = document.createElement("button");
      const btnRename = document.createElement("button");
      const btnDelete = document.createElement("button");

      btnDownload.classList.add("btnDownload");
      btnRename.classList.add("btnRename");
      btnDelete.classList.add("btnDelete");

      btnDownload.addEventListener("click", downloadFile);
      btnRename.addEventListener("click", renameFile);
      btnDelete.addEventListener("click", deleteFile);

      const svgDownload = document.createElementNS(xmlns, "svg");
      const svgRename = document.createElementNS(xmlns, "svg");
      const svgDelete = document.createElementNS(xmlns, "svg");

      const iconDownload = document.createElementNS(xmlns, "use");
      iconDownload.setAttribute("href", "#downloadIcon");
      svgDownload.appendChild(iconDownload);
      btnDownload.appendChild(svgDownload);

      const iconRename = document.createElementNS(xmlns, "use");
      iconRename.setAttribute("href", "#pencilIcon");
      svgRename.appendChild(iconRename);
      btnRename.appendChild(svgRename);

      const iconTrash = document.createElementNS(xmlns, "use");
      iconTrash.setAttribute("href", "#trashIcon");
      svgDelete.appendChild(iconTrash);
      btnDelete.appendChild(svgDelete);

      divActions.appendChild(btnDownload);
      divActions.appendChild(btnRename);
      divActions.appendChild(btnDelete);

      actions.appendChild(divActions);

      tr.setAttribute("data-name", it.name);
      tr.appendChild(name);
      tr.appendChild(MB);
      tr.appendChild(actions);

      name.innerHTML =
        extension === ".zip" ? `${zipFileSvg} ${it.name}` : it.name;

      MB.classList.add("size");
      MB.innerText = it.size || "0.00";

      cleanTable();
      tbody.insertBefore(tr, tbody.firstChild);
    });
  };

  const updateItemTable = (item) => {
    const firstChild = tbody.querySelector("tr");

    firstChild.querySelector(".size").innerText = item.size;
  };

  const cleanTable = () => {
    const firstChild = tbody.querySelector("td");

    if (firstChild.innerText.toLowerCase() === "sem registros")
      firstChild.parentNode.remove();
  };

  const setNotRegister = () => {
    if (!tbody.childElementCount) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");

      td.setAttribute("colSpan", "2");
      td.innerText = "Sem Registros";

      tr.appendChild(td);

      tbody.appendChild(tr);
    }
  };

  const getExtension = (name) => {
    const idx = name.lastIndexOf(".");
    return idx !== -1 ? name.slice(idx) : "";
  };

  const genZip = async () => {
    try {
      const response = await axios.post(BACK_URL + `/genZip`);

      if (response.data) setTable([response.data.file[0]]);
    } catch (err) {
      console.log(err);
    }
  };

  const downloadFile = async (e) => {
    try {
      const file = getAncestor(e.target, 3);

      const response = await axios.get(
        BACK_URL + `/download/${file.getAttribute("data-name")}`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.getAttribute("data-name"));
      document.body.appendChild(link);
      link.click();

      // Limpeza
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.log(err);
    }
  };

  const renameFile = (e) => {
    fileName = getAncestor(e.target, 3);
    tdToRename = fileName.querySelector("td");

    const name = fileName.getAttribute("data-name");
    const idx = name.lastIndexOf(".");

    inputRename.value = idx !== -1 ? name.slice(11, idx) : name;
    renameContainer.style.display = "flex";
  };

  const deleteFile = async (e) => {
    fileName = getAncestor(e.target, 3);
    tdToRename = fileName.querySelector("td");

    itemToDel.innerText = fileName.getAttribute("data-name");
    deleteContainer.style.display = "flex";
  };

  allBtnDownload.forEach((it) => {
    it.addEventListener("click", downloadFile);
  });

  allBtnRename.forEach((it) => {
    it.addEventListener("click", renameFile);
  });

  allBtnDelete.forEach((it) => {
    it.addEventListener("click", deleteFile);
  });

  btnPower.addEventListener("click", async () => {
    if (recording) return addMessage("Você esta gravando ponto!", true);

    try {
      const response = await axios.post(BACK_URL + `/powerOff`);

      if (response.data && response.data.offline) {
        document.querySelector("main").innerHTML = `
          <pre style="color: var(--main-color)" >GeoPPP Desligado!</pre>
        `;
      } else {
        addMessage("Erro ao desligar o sistema!", true);
      }
    } catch (error) {
      addMessage("Erro ao desligar o sistema!", true);
    }
  });

  document.querySelector("#genZip").addEventListener("click", genZip);

  btnRecord.addEventListener("click", async () => {
    if (debounceTimeout) return;

    if (recording) {
      icon.setAttribute("href", "#playIcon");
      label.textContent = "GRAVAR";
      btnRecord.classList.remove("playing");

      containerRecord.removeChild(divTime);
      time.innerText = "00:00";
      intervalID = clearInterval(intervalID);

      try {
        const response = await axios.post(BACK_URL + "/stopRecord");

        if (response.data) recording = false;
      } catch (error) {
        console.error("Erro ao parar a gravação", error);
      }
    } else nameContainer.style.display = "flex";
  });

  // Rename
  btnCancelRename.addEventListener("click", () => {
    renameContainer.style.display = "none";
    tdToRename = null;
    fileName = null;
  });

  btnConfirmRename.addEventListener("click", async () => {
    try {
      const name = fileName.getAttribute("data-name");
      const extension = getExtension(name);
      const newFileName = inputRename.value + extension;

      if (name === newFileName) return;

      const response = await axios.post(BACK_URL + "/renameFile", {
        file: name,
        newName: newFileName,
      });

      if (response.data) {
        Array.from(tdToRename.childNodes).map((node) => {
          console.log(node.textContent.trim());

          if (node.textContent.trim() === name)
            node.textContent = response.data.newName;
        });

        fileName.setAttribute("data-name", response.data.newName);
      }
    } catch (err) {
      console.log(err);
    } finally {
      tdToRename = null;
      fileName = null;
      renameContainer.style.display = "none";
    }
  });

  // Delete
  btnCancelDelete.addEventListener("click", () => {
    deleteContainer.style.display = "none";
    tdToRename = null;
    fileName = null;
  });

  btnConfirmDelete.addEventListener("click", async () => {
    try {
      const response = await axios.post(BACK_URL + "/deleteFile", {
        file: fileName.getAttribute("data-name"),
      });

      if (response.data) fileName.remove();
      setNotRegister();
    } catch (err) {
      console.log(err);
    } finally {
      deleteContainer.style.display = "none";
      tdToRename = null;
      fileName = null;
    }
  });

  // Name
  btnCancelName.addEventListener("click", () => {
    nameContainer.style.display = "none";
  });

  btnConfirmName.addEventListener("click", async () => {
    if (!inputName.value.trim() || debounceTimeout) return;

    nameContainer.style.display = "none";

    if (log.innerText.trim().toLowerCase() === "buscando...")
      return addMessage("Esta Buscando GPS. Aguarde!", true);
    else if (
      log.innerText.trim() == "0" ||
      log.innerText.trim().toLowerCase() === "erro"
    )
      return addMessage("Sem Acesso ao GPS!", true);

    debounceTimeout = setTimeout(async () => {
      startTimestamp = Date.now();
      icon.setAttribute("href", "#stopIcon");
      label.textContent = "PARAR";
      btnRecord.classList.add("playing");

      try {
        const response = await axios.post(BACK_URL + "/record", {
          name: inputName.value.trim(),
        });

        if (
          response.data &&
          response.data.msg.toLowerCase() === "gravando..."
        ) {
          name = response.data.name;

          containerRecord.appendChild(divTime);

          intervalID = setInterval(() => {
            const elapsedMs = Date.now() - startTimestamp;
            const elapsedSec = Math.floor(elapsedMs / 1000);
            const minutes = Math.floor(elapsedSec / 60);
            const seconds = elapsedSec % 60;
            time.innerText =
              `${String(minutes).padStart(2, "0")}:` +
              `${String(seconds).padStart(2, "0")}`;
          }, 1000);
        }
      } catch (error) {
        console.error("Erro interno do servidor");
      }

      recording = !recording;
      debounceTimeout = null;
    }, 1000);
  });

  // Alert
  btnCancel.addEventListener("click", () => {
    alertContainer.style.display = "none";
  });

  btnContinue.addEventListener("click", () => {
    window.location.replace("/gpsd");
  });

  const es = new EventSource("/gpsdStream");

  es.onmessage = (e) => {
    log.textContent = e.data;
  };

  es.addEventListener("error", (e) => {
    log.textContent = "ERRO";
  });
  es.addEventListener("end", (e) => {
    log.textContent = "[END] " + e.data;
    es.close();
  });

  socket.on("recording", (msg) => {
    if (!msg) return;

    if (tbody.querySelector("td").innerText === msg[0].name)
      updateItemTable(msg[0]);
    else setTable([msg][0]);
  });

  socket.on("datasets", (msg) => {
    const { pdop } = msg;
    if (pdop <= 2) {
      grafic.options.plugins.title.text = "FIXO 3D";
      grafic.options.plugins.title.color = "rgb(0, 255, 0)";
    } else if (pdop <= 5) {
      grafic.options.plugins.title.text = "FLUTUANTE";
      grafic.options.plugins.title.color = "rgb(255, 255, 0)";
    } else {
      grafic.options.plugins.title.text = "SINGLE";
      grafic.options.plugins.title.color = "rgb(255, 0, 0)";
    }

    if (msg.datasets) grafic.data.datasets[0].data = msg.datasets;
    else grafic.data.datasets[0].data = new Array(GRAFIC_LENGTH).fill(0);
    grafic.update();
  });
});

window.addEventListener("pagehide", async () => {
  try {
    const response = await axios.post(BACK_URL + "/stopRecord");

    if (response.data) recording = false;
  } catch (error) {
    console.error("Erro ao parar a gravação", error);
  }
});
