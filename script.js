const API = "https://api.github.com/users/";
const form = document.getElementById("form");
const input = document.getElementById("username");
const btn = document.getElementById("btn");
const statusEl = document.getElementById("status");
const profileEl = document.getElementById("profile");
const reposSection = document.getElementById("reposSection");
const reposEl = document.getElementById("repos");

const fmt = (n) => Number(n ?? 0).toLocaleString("en-US");

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.className = "status" + (isError ? " error" : "");
}

function clearResults() {
  profileEl.className = "hidden";
  reposSection.classList.add("hidden");
  profileEl.innerHTML = "";
  reposEl.innerHTML = "";
}

async function search(username) {
  username = username.trim();
  if (!username) return;
  clearResults();
  setStatus("Loading...");
  btn.disabled = true;

  try {
    const [userRes, repoRes] = await Promise.all([
      fetch(API + encodeURIComponent(username)),
      fetch(API + encodeURIComponent(username) + "/repos?sort=updated&per_page=6"),
    ]);

    if (userRes.status === 404) throw new Error("User not found.");
    if (userRes.status === 403) throw new Error("API rate limit reached. Try again later.");
    if (!userRes.ok || !repoRes.ok) throw new Error("Something went wrong. Try again.");

    const user = await userRes.json();
    const repos = await repoRes.json();

    renderProfile(user);
    renderRepos(repos);
    statusEl.className = "status hidden";
  } catch (err) {
    setStatus(err.message || "Network error.", true);
  } finally {
    btn.disabled = false;
  }
}

function renderProfile(u) {
  profileEl.className = "profile";
  profileEl.innerHTML = `
    <img src="${esc(u.avatar_url)}" alt="${esc(u.login)} avatar" />
    <div class="info">
      <h2>${esc(u.name || u.login)}</h2>
      <a class="login" href="${esc(u.html_url)}" target="_blank" rel="noopener">@${esc(u.login)}</a>
      <p class="bio">${esc(u.bio || "No bio yet.")}</p>
      <div class="stats">
        <div class="stat"><span class="num">${fmt(u.public_repos)}</span> repos</div>
        <div class="stat"><span class="num">${fmt(u.followers)}</span> followers</div>
        <div class="stat"><span class="num">${fmt(u.following)}</span> following</div>
      </div>
    </div>`;
}

function renderRepos(repos) {
  reposSection.classList.remove("hidden");
  if (!repos.length) {
    reposEl.innerHTML = `<div class="status">No public repositories.</div>`;
    return;
  }
  reposEl.innerHTML = repos.map((r) => `
    <a class="repo" href="${esc(r.html_url)}" target="_blank" rel="noopener">
      <h4>${esc(r.name)}</h4>
      <p>${esc(r.description || "No description")}</p>
      <div class="row">
        <span>⭐ ${fmt(r.stargazers_count)}</span>
        ${r.language ? `<span>${esc(r.language)}</span>` : ""}
      </div>
    </a>`).join("");
}

form.addEventListener("submit", (e) => { e.preventDefault(); search(input.value); });
document.querySelectorAll(".chip").forEach((chip) =>
  chip.addEventListener("click", () => {
    input.value = chip.dataset.user;
    search(chip.dataset.user);
  })
);
