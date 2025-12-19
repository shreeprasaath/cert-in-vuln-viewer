const pdfInput = document.getElementById("pdfInput");
const output = document.getElementById("output");

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js";

pdfInput.addEventListener("change", () => {
  Array.from(pdfInput.files).forEach(parsePDF);
});

async function parsePDF(file) {
  const reader = new FileReader();
  reader.onload = async () => {
    const pdf = await pdfjsLib.getDocument(new Uint8Array(reader.result)).promise;
    let content = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();

      text.items.forEach(item => {
        content.push({
          text: item.str.trim(),
          size: item.transform[0]
        });
      });
    }

    const json = extractSections(content);
    render(json, file.name);
  };
  reader.readAsArrayBuffer(file);
}

function extractSections(items) {
  const result = {};
  let currentHeader = "General";

  items.forEach(i => {
    if (i.size > 14 && i.text.length < 80) {
      currentHeader = i.text;
      result[currentHeader] = "";
    } else if (i.text) {
      result[currentHeader] += i.text + " ";
    }
  });

  return result;
}

function render(json, filename) {
  const div = document.createElement("div");
  div.className = "document";

  div.innerHTML = `<h2>${filename}</h2>`;

  Object.entries(json).forEach(([k, v]) => {
    div.innerHTML += `<h4>${k}</h4><p>${v}</p>`;
  });

  const btn = document.createElement("button");
  btn.textContent = "Download JSON";
  btn.onclick = () => download(json, filename.replace(".pdf", ".json"));

  div.appendChild(btn);
  output.appendChild(div);
}

function download(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
