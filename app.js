const fileInput = document.getElementById("fileInput");
const documentsDiv = document.getElementById("documents");

fileInput.addEventListener("change", () => {
  documentsDiv.innerHTML = "";
  Array.from(fileInput.files).forEach(handleFile);
});

function handleFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const json = JSON.parse(reader.result);
    renderDocument(json, file.name);
  };
  reader.readAsText(file);
}

function renderDocument(data, filename) {
  const doc = document.createElement("div");
  doc.className = "document";

  const title = document.createElement("h2");
  title.textContent = data.Title || filename;
  doc.appendChild(title);

  Object.entries(data).forEach(([key, value]) => {
    if (key === "Title") return;

    const section = document.createElement("div");
    section.className = "section";

    const h4 = document.createElement("h4");
    h4.textContent = key.replace(/_/g, " ");
    section.appendChild(h4);

    const p = document.createElement("p");
    p.textContent = Array.isArray(value)
      ? value.join(", ")
      : typeof value === "object"
      ? JSON.stringify(value, null, 2)
      : value;

    section.appendChild(p);
    doc.appendChild(section);
  });

  const downloadBtn = document.createElement("button");
  downloadBtn.className = "download-btn";
  downloadBtn.textContent = "Download JSON";
  downloadBtn.onclick = () => downloadJSON(data, filename);

  doc.appendChild(downloadBtn);
  documentsDiv.appendChild(doc);
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}
