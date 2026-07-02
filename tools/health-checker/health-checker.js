let reportData = [];

const runScanBtn = document.getElementById("runScanBtn");
const resultsBody = document.getElementById("resultsBody");
const summary = document.getElementById("summary");
const downloadBtn = document.getElementById("downloadJsonBtn");

runScanBtn.addEventListener("click", runHealthScan);

async function runHealthScan() {
  resultsBody.innerHTML = "";
  reportData = [];

  try {
    const response = await fetch("../../index.html");
    const html = await response.text();

    const tools = extractTools(html);

    let passed = 0;
    let failed = 0;

    for (const tool of tools) {
      try {
        const toolResponse = await fetch(`../../${tool.path}`, {
          method: "HEAD",
        });

        const status = toolResponse.ok ? "PASS" : "FAIL";

        if (toolResponse.ok) {
          passed++;
        } else {
          failed++;
        }

        reportData.push({
          tool: tool.name,
          path: tool.path,
          status,
          message: toolResponse.ok
            ? "Tool page found"
            : `HTTP ${toolResponse.status}`,
        });

        addRow(
          tool.name,
          status,
          toolResponse.ok
            ? "Tool page found"
            : `HTTP ${toolResponse.status}`
        );
      } catch (error) {
        failed++;

        reportData.push({
          tool: tool.name,
          path: tool.path,
          status: "FAIL",
          message: "Unable to reach tool page",
        });

        addRow(
          tool.name,
          "FAIL",
          "Unable to reach tool page"
        );
      }
    }

    summary.textContent =
      `Scan Complete — ${passed} Passed, ${failed} Failed`;

    downloadBtn.disabled = false;

  } catch (error) {
    summary.textContent =
      "Failed to load tool registry from index.html";

    console.error(error);
  }
}

function extractTools(html) {
  const tools = [];

  const regex =
    /name:\s*"([^"]+)"[\s\S]*?path:\s*"([^"]+)"/g;

  let match;

  while ((match = regex.exec(html)) !== null) {
    tools.push({
      name: match[1],
      path: match[2],
    });
  }

  return tools;
}

function addRow(name, status, message) {
  const row = document.createElement("tr");

  row.innerHTML = `
    <td>${name}</td>
    <td>${status}</td>
    <td>${message}</td>
  `;

  resultsBody.appendChild(row);
}

downloadBtn.addEventListener("click", () => {
  const blob = new Blob(
    [JSON.stringify(reportData, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "health-report.json";
  a.click();

  URL.revokeObjectURL(url);
});