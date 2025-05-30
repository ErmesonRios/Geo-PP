document.addEventListener("DOMContentLoaded", () => {
  const log = document.getElementById("log");
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
});
