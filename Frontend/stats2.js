let allSessions = [];

async function loadStatistics() {
  const [coursesRes, tasksRes, sessionsRes] = await Promise.all([
    fetch("https://web-1-vou2.onrender.com/courses"),
    fetch("https://web-1-vou2.onrender.com/tasks"),
    fetch("https://web-1-vou2.onrender.com/studySchedule"),
  ]);

  const courses = await coursesRes.json();
  const tasks = await tasksRes.json();
  allSessions = await sessionsRes.json();
  allSessions.reverse();

  const completed = allSessions.filter((s) => s.status === "completed");
  const missed = allSessions.filter((s) => s.status === "missed");

  const totalHours = allSessions.reduce((sum, s) => {
    return sum + calculateHours(s.startTime, s.endTime);
  }, 0);

  const completionRate =
    allSessions.length === 0
      ? 0
      : Math.round((completed.length / allSessions.length) * 100);

  document.getElementById("totalHours").textContent = totalHours.toFixed(1);
  document.getElementById("completedSessions").textContent = completed.length;
  document.getElementById("totalSessionsCount").textContent =
    allSessions.length;
  document.getElementById("missedSessions").textContent = missed.length;
  document.getElementById("completionRate").textContent = completionRate + "%";
  document.getElementById("completionFill").style.width = completionRate + "%";

  renderSessions(allSessions);
  renderCourseTable(courses, allSessions);
  renderCharts(courses, allSessions);
}

function calculateHours(start, end) {
  if (!start || !end) return 0;

  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  let startMinutes = sh * 60 + sm;
  let endMinutes = eh * 60 + em;

  if (endMinutes < startMinutes) endMinutes += 24 * 60;

  return (endMinutes - startMinutes) / 60;
}

function renderSessions(sessions) {
  const sessionsList = document.getElementById("sessionsList");
  sessionsList.innerHTML = "";

  if (sessions.length === 0) {
    sessionsList.innerHTML =
      "<div class='session-item'>No study sessions available</div>";
    return;
  }

  sessions.forEach((session) => {
    const div = document.createElement("div");
    div.className = "session-item";

    div.innerHTML = `
      <div class="session-info">
        <div class="session-course">${session.course || "No course"}</div>
        <div class="session-details">
          📅 ${session.day || ""} | ⏰ ${session.startTime || ""} - ${session.endTime || ""}
        </div>
      </div>

      <div class="session-actions">
        <button class="btn-success" onclick="markSession('${session._id}', 'completed')">
          ✓ Complete
        </button>
        <button class="btn-fail" onclick="markSession('${session._id}', 'missed')">
          ✗ Missed
        </button>
      </div>
    `;

    sessionsList.appendChild(div);
  });
}

async function markSession(sessionId, status) {
  try {
    console.log("sessionId:", sessionId);
    console.log("status:", status);

    const response = await fetch(
      `https://web-1-vou2.onrender.com/studySchedule/${sessionId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      },
    );

    const data = await response.json();

    console.log("Response:", data);

    if (!response.ok) {
      alert(data.message || "Error updating session status");
      return;
    }

    await loadStatistics();
  } catch (error) {
    console.log(error);
    alert("Error updating session status");
  }
}
function renderCourseTable(courses, sessions) {
  const courseTable = document.getElementById("courseTable");
  courseTable.innerHTML = "";

  if (courses.length === 0) {
    courseTable.innerHTML =
      "<tr><td colspan='3'>No courses available</td></tr>";
    return;
  }

  courses.forEach((course) => {
    const courseName = course.courseName;
    const courseSessions = sessions.filter((s) => s.course === courseName);
    const completedSessions = courseSessions.filter(
      (s) => s.status === "completed",
    );

    const hours = courseSessions.reduce((sum, s) => {
      return sum + calculateHours(s.startTime, s.endTime);
    }, 0);

    const rate =
      courseSessions.length === 0
        ? 0
        : Math.round((completedSessions.length / courseSessions.length) * 100);

    courseTable.innerHTML += `
      <tr>
        <td>${courseName}</td>
        <td>${hours.toFixed(1)}</td>
        <td>
          <div class="mini-progress">
            <div class="mini-fill" style="width: ${rate}%"></div>
            <span>${rate}%</span>
          </div>
        </td>
      </tr>
    `;
  });
}

function renderCharts(courses, sessions) {
  const weeklyCtx = document.getElementById("weeklyChart").getContext("2d");
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const weeklyHours = days.map((day) => {
    return sessions
      .filter((s) => s.day === day)
      .reduce((sum, s) => sum + calculateHours(s.startTime, s.endTime), 0);
  });

  if (window.weeklyChart && typeof window.weeklyChart.destroy === "function") {
    window.weeklyChart.destroy();
  }

  window.weeklyChart = new Chart(weeklyCtx, {
    type: "bar",
    data: {
      labels: days,
      datasets: [
        {
          label: "Study Hours",
          data: weeklyHours,
          backgroundColor: "#ec6f09",
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });

  const distCtx = document.getElementById("distributionChart").getContext("2d");

  const courseHours = courses.map((course) => {
    return sessions
      .filter((s) => s.course === course.courseName)
      .reduce((sum, s) => sum + calculateHours(s.startTime, s.endTime), 0);
  });

  if (
    window.distributionChart &&
    typeof window.distributionChart.destroy === "function"
  ) {
    window.distributionChart.destroy();
  }

  window.distributionChart = new Chart(distCtx, {
    type: "doughnut",
    data: {
      labels: courses.map((course) => course.courseName),
      datasets: [
        {
          data: courseHours.length ? courseHours : [1],
          backgroundColor: [
            "#ec6f09",
            "#10b981",
            "#f59e0b",
            "#8b5cf6",
            "#ef4444",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

document.addEventListener("DOMContentLoaded", loadStatistics);
window.addEventListener("focus", loadStatistics);
