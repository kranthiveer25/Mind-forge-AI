let files = [];

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const fileList = document.getElementById("fileList");
const genBtn = document.getElementById("genBtn");
const svgWrap = document.getElementById("svgWrap");
const emptyState = document.getElementById("emptyState");


/* Upload */

dropZone.onclick = () => fileInput.click();

fileInput.onchange = e => addFiles(e.target.files);

dropZone.ondragover = e => {
  e.preventDefault();
  dropZone.style.borderColor = "#7c5cfc";
};

dropZone.ondragleave = () => {
  dropZone.style.borderColor = "#444";
};

dropZone.ondrop = e => {
  e.preventDefault();
  dropZone.style.borderColor = "#444";
  addFiles(e.dataTransfer.files);
};


function addFiles(list) {

  for (let f of list) {

    if (!files.find(x => x.name === f.name)) {
      files.push(f);
    }

  }

  renderFiles();

  genBtn.disabled = files.length === 0;
}


/* Render files */

function renderFiles() {

  fileList.innerHTML = "";

  files.forEach((f, i) => {

    const div = document.createElement("div");

    div.textContent = f.name;

    fileList.appendChild(div);

  });
}


/* Read files */

async function readFile(f) {

  const ext = f.name.split(".").pop().toLowerCase();

  // Text
  if (["txt","md","csv"].includes(ext)) {

    return new Promise(res => {

      const r = new FileReader();

      r.onload = e => res(e.target.result);

      r.readAsText(f);

    });
  }


  // PDF
  if (ext === "pdf") {

    const buf = await f.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {

      const page = await pdf.getPage(i);

      const c = await page.getTextContent();

      c.items.forEach(x => text += x.str + " ");

    }

    return text;
  }

  return "";
}


/* Generate */

genBtn.onclick = async () => {

  emptyState.style.display = "none";

  svgWrap.innerHTML = "Generating...";

  let content = "";

  for (let f of files) {

    content += await readFile(f);

  }

  const res = await fetch("http://localhost:11434/api/generate", {

    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      model: "llama3",
      prompt: "Create a mind map JSON:\n" + content,
      stream: false
    })

  });


  const data = await res.json();

  renderResult(data.response);

};


/* Render Result */

function renderResult(txt) {

  svgWrap.innerHTML = "";

  const pre = document.createElement("pre");

  pre.textContent = txt;

  svgWrap.appendChild(pre);

}
