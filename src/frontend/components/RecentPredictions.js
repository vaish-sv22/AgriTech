import { getPredictions, clearPredictions } from "../js/predictionStorage.js";

export default function RecentPredictions() {
  const history = getPredictions();

  const container = document.createElement("div");
  container.className = "recent-predictions";

  const title = document.createElement("h3");
  title.textContent = "Recent Predictions";
  container.appendChild(title);

  history.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "prediction-item";
    div.innerHTML = `
      <p><strong>${item.timestamp}</strong></p>
      <p>Input: ${item.input}</p>
      <p>Output: ${item.output}</p>
    `;
    container.appendChild(div);
  });

  if (history.length > 0) {
    const clearBtn = document.createElement("button");
    clearBtn.textContent = "Clear History";
    clearBtn.onclick = () => {
      clearPredictions();
      container.innerHTML = "<p>No predictions yet.</p>";
    };
    container.appendChild(clearBtn);
  }

  return container;
}
