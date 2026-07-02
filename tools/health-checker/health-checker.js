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
    let missingCss = 0;
    let missingJs = 0;

    for (const tool of tools) {
      try {
        const pageResponse = await fetch(`../../${tool.path}`);

        const html = await pageResponse.text();

        const pageStatus = pageResponse.ok ? "PASS" : "FAIL";

        const hasThemeCss = html.includes("theme.css");
        const hasThemeJs = html.includes("theme.js");

        if (!hasThemeCss) {
            missingCss++;
        }

        if (!hasThemeJs) {
            missingJs++;
        }

        const cssStatus = hasThemeCss ? "PASS" : "FAIL";

        const jsStatus = hasThemeJs ? "PASS" : "FAIL";

        if (pageResponse.ok) {
        passed++;
        } else {
        failed++;
        }

        reportData.push({
        tool: tool.name,
        path: tool.path,
        pageStatus,
        cssStatus,
        jsStatus,
        });

        addRow(
        tool.name,
        pageStatus,
        cssStatus,
        jsStatus
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

    summary.innerHTML = `
        <strong>Tools Scanned:</strong> ${tools.length}<br>
        <strong>Pages Missing:</strong> ${failed}<br>
        <strong>Missing Theme CSS:</strong> ${missingCss}<br>
        <strong>Missing Theme JS:</strong> ${missingJs}
    `;

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

function addRow(
  name,
  pageStatus,
  cssStatus,
  jsStatus
) {
  const row = document.createElement("tr");

  row.innerHTML = `
    <td>${name}</td>
    <td>${pageStatus}</td>
    <td>${cssStatus}</td>
    <td>${jsStatus}</td>
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