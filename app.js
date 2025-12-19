pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js";

const input = document.getElementById("pdfInput");
const results = document.getElementById("results");

input.addEventListener("change", () => {
  results.innerHTML = "";
  [...input.files].forEach(convertPDF);
});

async function convertPDF(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(buffer).promise;

  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    content.items.forEach(t => text += t.str + " ");
  }

  const json = extractCERTIN(text);
  render(json, file.name);
}

function extractCERTIN(raw) {
  const clean = raw.replace(/\s+/g, " ");

  const sections = [
    "Software Affected",
    "Overview",
    "Target Audience",
    "Risk Assessment",
    "Impact Assessment",
    "Description",
    "Solution",
    "Vendor Information",
    "References",
    "CVE Name",
    "Disclaimer",
    "Contact Information"
  ];

  const data = {
    Document_ID: grab(clean, /CIVN-\d{4}-\d+/),
    Title: grab(clean, /CIVN-\d{4}-\d+\s+(.*?)\s+Original Issue Date/),
    Original_Issue_Date: grab(clean, /Original Issue Date:\s*(.*?)\s+Severity/),
    Severity_Rating: grab(clean, /Severity Rating:\s*(\w+)/)
  };

  sections.forEach((sec, i) => {
    const start = clean.indexOf(sec);
    if (start === -1) return;

    const end =
      i + 1 < sections.length
        ? clean.indexOf(sections[i + 1], start)
        : clean.length;

    data[sec.replace(/ /g, "_")] =
      clean.substring(start + sec.length, end).trim();
  });

  data.CVE =
    clean.match(/CVE-\d{4}-\d+/g) || [];

  return data;
}

function grab(text, regex) {
  const m = text.match(regex);
  return m ? m[1].trim() : "";
}

function render(json, filename) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `<h2>${filename}</h2>`;

  Object.entries(json).forEach(([k, v]) => {
    const sec = document.createElement("div");
    sec.className = "section";
    sec.innerHTML = `<h4>${k.replace(/_/g, " ")}</h4>
                     <p>${Array.isArray(v) ? v.join(", ") : v}</p>`;
    card.appendChild(sec);
  });

  const btn = document.createElement("button");
  btn.textContent = "Download JSON";
  btn.onclick = () => download(json, filename.replace(".pdf", ".json"));

  card.appendChild(btn);
  results.appendChild(card);
}

function download(data, name) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
}
