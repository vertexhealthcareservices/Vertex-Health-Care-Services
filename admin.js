// ==========================
// ADMIN LOGIN (admin_login.html)
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("adminLoginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();

      try {
        const res = await fetch("/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        if (res.ok) {
          window.location.href = "/admin.html";
        } else {
          alert("Invalid admin credentials");
        }
      } catch (err) {
        alert("Server error. Try again.");
        console.error(err);
      }
    });
  }
});

// ==========================
// LOAD APPOINTMENTS (admin.html)
// ==========================
document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.querySelector("#appointmentsTable tbody");
  if (!tableBody) return; // not on admin.html

  try {
    const response = await fetch("/api/appointments");

    if (response.status === 401) {
      // Not logged in
      window.location.href = "/admin_login.html";
      return;
    }

    const appointments = await response.json();
    tableBody.innerHTML = "";

    appointments.forEach((app) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${app.fullName}</td>
        <td>${app.mobileNumber}</td>
        <td>${app.emailAddress || "-"}</td>
        <td>${app.department || "-"}</td>
        <td>${app.doctorName || "-"}</td>
        <td>${app.reasonForVisit || "-"}</td>
        <td>
          <select onchange="updateStatus('${app._id}', this.value)">
            <option value="Pending" ${app.status === "Pending" ? "selected" : ""}>Pending</option>
            <option value="Confirmed" ${app.status === "Confirmed" ? "selected" : ""}>Confirmed</option>
            <option value="Completed" ${app.status === "Completed" ? "selected" : ""}>Completed</option>
          </select>
        </td>
        <td>${new Date(app.createdAt).toLocaleString()}</td>
        <td>
          <button onclick="deleteAppointment('${app._id}')">Delete</button>
        </td>
      `;

      tableBody.appendChild(row);
    });
  } catch (err) {
    alert("Failed to load appointments");
    console.error(err);
  }
});

// ==========================
// UPDATE APPOINTMENT STATUS
// ==========================
async function updateStatus(id, status) {
  try {
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  } catch (err) {
    alert("Failed to update status");
    console.error(err);
  }
}

// ==========================
// DELETE APPOINTMENT
// ==========================
async function deleteAppointment(id) {
  if (!confirm("Delete this appointment?")) return;

  try {
    await fetch(`/api/appointments/${id}`, {
      method: "DELETE",
    });
    location.reload();
  } catch (err) {
    alert("Failed to delete appointment");
    console.error(err);
  }
}

// ==========================
// FILTER TABLE
// ==========================
function filterTable() {
  const searchInput = document.getElementById("search");
  if (!searchInput) return;

  const value = searchInput.value.toLowerCase();
  document.querySelectorAll("#appointmentsTable tbody tr").forEach((row) => {
    row.style.display = row.innerText.toLowerCase().includes(value)
      ? ""
      : "none";
  });
}

// ==========================
// LOGOUT
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await fetch("/admin/logout", { method: "POST" });
      window.location.href = "/admin_login.html";
    });
  }
});
