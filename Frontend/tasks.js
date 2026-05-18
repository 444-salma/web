let tasks = [];
let editIndex = null;

const form = document.getElementById("taskForm");
const table = document.getElementById("tasksTable");
const courseSelect = document.getElementById("course");

// Load static courses
async function loadCoursesIntoSelect() {
  courseSelect.innerHTML = "";

  try {
    const response = await fetch("https://web-2-ftdn.onrender.com/courses");
    const courses = await response.json();

    if (courses.length === 0) {
      const option = document.createElement("option");
      option.text = "No courses found";
      option.value = "";
      courseSelect.appendChild(option);
    } else {
      courses.forEach((course) => {
        const option = document.createElement("option");

        option.value = course.courseName;
        option.text = course.courseName;

        courseSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.log(error);
  }
}

// Init
window.onload = function () {
  loadCoursesIntoSelect();
  loadTasks();

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
};

// Handle submit
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const task = {
    title: document.getElementById("title").value,
    course: document.getElementById("course").value,
    type: document.getElementById("type").value,
    dueDate: document.getElementById("date").value,
    priority: document.getElementById("priority").value,
    status: "pending",
  };

  try {
    const response = await fetch("https://web-2-ftdn.onrender.com/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(task),
    });

    const result = await response.json();

    task._id = result.insertedId;
    tasks.push(task);

    displayTasks();
    form.reset();

    showNotification("Task added successfully ✅");
  } catch (error) {
    console.log(error);
    showNotification("Error adding task", "error");
  }
});

// Render table
function displayTasks() {
  table.innerHTML = "";

  tasks.forEach((task, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
            <td><input type="checkbox"></td>
            <td>${task.title}</td>
            <td>${task.course}</td>
            <td>${task.type}</td>
            <td>${task.dueDate || ""}</td>
            <td>${task.priority}</td>
            <td>
              <button class="delete-btn" onclick="deleteTask(${index})">Delete</button>
            </td>
        `;

    // Checkbox behavior (green highlight)
    const checkbox = row.querySelector("input[type='checkbox']");
    checkbox.addEventListener("change", function () {
      if (this.checked) {
        row.classList.add("completed-row");
      } else {
        row.classList.remove("completed-row");
      }
    });

    table.appendChild(row);
  });
}

async function loadTasks() {
  try {
    const response = await fetch("https://web-2-ftdn.onrender.com/tasks");
    tasks = await response.json();
    displayTasks();
  } catch (error) {
    console.log(error);
  }
}

// Delete
function deleteTask(index) {
  tasks.splice(index, 1);
  displayTasks();
  showNotification("Task deleted 🗑️", "error");
}

// Edit
function editTask(index) {
  const task = tasks[index];

  document.getElementById("title").value = task.title;
  document.getElementById("course").value = task.course;
  document.getElementById("type").value = task.type;
  document.getElementById("date").value = task.date;
  document.getElementById("priority").value = task.priority;

  editIndex = index;
}

// Notification
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.textContent = message;

  notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === "success" ? "#10b981" : "#ef4444"};
        color: white;
        padding: 12px 20px;
        border-radius: 10px;
        z-index: 1000;
        font-weight: bold;
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 2500);
}
