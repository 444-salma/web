async function generateResponse() {
  const question = document.getElementById("studentQuestion").value.trim();
  const responseBox = document.getElementById("aiResponse");

  if (question === "") {
    responseBox.textContent = "Please write your question first.";
    return;
  }

  responseBox.textContent = "Thinking...";

  try {
    const response = await fetch("https://web-1-vou2.onrender.com/ai-helper", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Request failed");
    }

    responseBox.textContent = data.answer;
  } catch (error) {
    responseBox.textContent =
      "AI integration error. Please check the API key or internet connection.";
  }
}

function goBack() {
  window.location.href = "dashboard.html";
}
