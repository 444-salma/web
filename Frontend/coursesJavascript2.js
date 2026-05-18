// const storageKey = "coursesPageDataV3";

let courses = [];

let editingCourseId = null;
let editingIndex = null;
// Salma update: fetching courses from the database and displaying them in the table
const form = document.querySelector("form");
const courseTableBody = document.querySelector("tbody");

async function loadCourses() {
  try {
    const response = await fetch("https://web-1-vou2.onrender.com/courses");

    courses = await response.json();

    displayCourses();
  } catch (error) {
    console.log(error);
  }
}

loadCourses();
//===========================================================================
// Salma update: adding the functionality to add courses to the database and then display them in the table
form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const course = {
    courseCode: document.querySelector("#courseCode").value,
    courseName: document.querySelector("#courseName").value,
    instructorName: document.querySelector("#instructor").value,
    creditHours: Number(document.querySelector("#creditHours").value),
    category: document.querySelector("#category").value,
    priority: getPriority(),
    notes: document.querySelector("#notes").value,
  };

  try {
    let response;

    if (editingCourseId) {
      response = await fetch(
        `https://web-1-vou2.onrender.com/courses/${editingCourseId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(course),
        },
      );

      await response.json();

      courses[editingIndex] = {
        ...course,
        _id: editingCourseId,
      };

      editingCourseId = null;
      editingIndex = null;

      alert("Course updated successfully!");
    } else {
      response = await fetch("https://web-1-vou2.onrender.com/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(course),
      });

      const result = await response.json();

      course._id = result.insertedId;
      courses.push(course);

      alert("Course added successfully!");
    }

    syncCoursesForPlanner();
    displayCourses();

    form.reset();
    document.querySelector("#medium").checked = true;
  } catch (error) {
    console.log(error);
    alert("Error saving course");
  }
});
//=================================================================
function getPriority() {
  if (document.querySelector("#high").checked) {
    return "High";
  } else if (document.querySelector("#medium").checked) {
    return "Medium";
  } else {
    return "Low";
  }
}
// salma update: we don't need this function anymore because we are saving the courses directly to the database and fetching them from there, but we will keep it here in case we want to use it later for some reason
//=====================================================
// function saveCourses() {
//   localStorage.setItem(storageKey, JSON.stringify(courses));
//   syncCoursesForPlanner(); //haifa updated the save course function to be able to save courses in planner
// }
//=====================================================
//here is the old one --
/*function saveCourses() {
  localStorage.setItem(storageKey, JSON.stringify(courses));
}*/

function displayCourses() {
  courseTableBody.innerHTML = "";

  for (let i = 0; i < courses.length; i++) {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${courses[i].courseCode}</td>
      <td>${courses[i].courseName}</td>
      <td>${courses[i].instructorName}</td>
      <td>${courses[i].creditHours}</td>
      <td>${courses[i].priority || ""}</td>
      <td>${courses[i].notes || ""}</td>
      <td>
        <button class="edit-btn table-btn edit-course" data-index="${i}">Edit</button>
        <button class="delete-btn table-btn remove-course" data-index="${i}">Remove</button>
      </td>
    `;

    courseTableBody.appendChild(row);
  }
}
courseTableBody.addEventListener("click", async function (event) {
  if (event.target.classList.contains("delete-btn")) {
    const index = event.target.getAttribute("data-index");

    const courseId = courses[index]._id;

    try {
      await fetch(`https://web-1-vou2.onrender.com/courses/${courseId}`, {
        method: "DELETE",
      });

      courses.splice(index, 1);

      displayCourses();

      alert("Course deleted successfully");
    } catch (error) {
      console.log(error);

      alert("Error deleting course");
    }
  }

  if (event.target.classList.contains("edit-btn")) {
    const index = event.target.getAttribute("data-index");
    const course = courses[index];

    document.querySelector("#courseCode").value = course.courseCode;
    document.querySelector("#courseName").value = course.courseName;
    document.querySelector("#instructor").value = course.instructorName;
    document.querySelector("#creditHours").value = course.creditHours;
    document.querySelector("#notes").value = course.notes || "";

    if (course.priority === "High") {
      document.querySelector("#high").checked = true;
    } else if (course.priority === "Medium") {
      document.querySelector("#medium").checked = true;
    } else {
      document.querySelector("#low").checked = true;
    }

    editingCourseId = course._id;
    editingIndex = index;
  }
});
// This function is used to sync the courses data with the planner page haifa update
function syncCoursesForPlanner() {
  const simpleList = courses.map((c) => ({
    id: Date.now() + Math.random(),
    name: c.courseName,
  }));

  localStorage.setItem("courses", JSON.stringify(simpleList));
}
//end of haifa update

lucide.createIcons();
