import { TARGET_METRICS, SLIDE1_SECTIONS, SLIDE2_SECTIONS, FOCUS_COMMITMENTS_ROWS } from './targets.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// ==== CONFIG ====
// 1) Replace these with your Firebase project settings (README shows how to get them)
const firebaseConfig = {
 apiKey: "AIzaSyC_4UsGZ31cNMXhwbhjynzNXgIE7ssG-V4",
  authDomain: "wbr-app-d3807.firebaseapp.com",
  projectId: "wbr-app-d3807",
  storageBucket: "wbr-app-d3807.firebasestorage.app",
  messagingSenderId: "667501588300",
  appId: "1:667501588300:web:fd91640a1abf74cb5229e9",
  measurementId: "G-WYCWVWWXQ6"
};

// 2) Month key (YYYY-MM). Each month writes to a new collection (soft reset).
const now = new Date();
const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}`;
document.getElementById('monthKey').textContent = `Month: ${monthKey}`;

// Firebase init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collection name is entries_{monthKey} to auto-reset monthly without deleting history
const collectionName = `entries_${monthKey}`;

// --- UI build for metrics ---
function renderMetricInputs() {
  const metricsContainer = document.getElementById('metricsContainer');
  metricsContainer.innerHTML = '';
  TARGET_METRICS.forEach((m, idx) => {
    const row = document.createElement('div');
    row.className = "grid grid-cols-12 items-center gap-2";
    const label = document.createElement('div');
    label.className = "col-span-5";
    label.innerHTML = `<div class="font-medium">${m.name}</div>`;
    const target = document.createElement('div');
    target.className = "col-span-3 text-gray-700";
    target.innerHTML = `<div class="px-3 py-2 bg-yellow-50 border rounded-xl">${m.target || ""}</div>`;
    const inputWrap = document.createElement('div');
    inputWrap.className = "col-span-4";
    inputWrap.innerHTML = `<input data-m-index="${idx}" type="text" placeholder="Actual" class="w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">`;
    row.appendChild(label);
    row.appendChild(target);
    row.appendChild(inputWrap);
    metricsContainer.appendChild(row);
  });
}
renderMetricInputs();

// --- Helpers ---
function getFormValues() {
  const location = document.getElementById('locationInput').value.trim();
  const week = document.getElementById('weekSelect').value;
  const inputs = document.getElementById('metricsContainer').querySelectorAll('input[data-m-index]');
  const actuals = {};
  inputs.forEach((inp) => {
    const idx = inp.getAttribute('data-m-index');
    const metric = TARGET_METRICS[idx];
    const value = inp.value.trim();
    if (value !== '') {
      actuals[metric.name] = value;
    }
  });
  return { location, week, actuals };
}

function clearActualInputs() {
  const inputs = document.getElementById('metricsContainer').querySelectorAll('input[data-m-index]');
  inputs.forEach(i => i.value = '');
}

// --- Firestore doc structure ---
// One doc per location: { location, monthKey, weeks: { "Week 1": { metricName: actual } } }
async function saveWeek({ location, week, actuals }) {
  const id = location.toLowerCase();
  const ref = doc(db, collectionName, id);
  const snap = await getDoc(ref);
  let data = {};
  if (snap.exists()) {
    data = snap.data();
  } else {
    data = { location, monthKey, weeks: {} };
  }
  data.location = location;
  data.monthKey = monthKey;
  if (!data.weeks) data.weeks = {};
  if (!data.weeks[week]) data.weeks[week] = {};
  data.weeks[week] = { ...data.weeks[week], ...actuals };
  await setDoc(ref, data, { merge: true });
  return true;
}

async function saveFocusCommitments(location, formData) {
  const id = location.toLowerCase();
  const ref = doc(db, collectionName, id);
  const snap = await getDoc(ref);
  let data = snap.exists() ? snap.data() : { location, monthKey, weeks: {} };
  data.focusCommitments = formData;
  await setDoc(ref, data, { merge: true });
  return true;
}

async function loadProgress(location) {
  const id = location.toLowerCase();
  const ref = doc(db, collectionName, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { weeks: {} };
  return snap.data();
}

// --- Table rendering helpers ---
function th(content, cls = "") {
  const th = document.createElement('th');
  th.className = "px-3 py-2 border align-top " + cls;
  th.textContent = content;
  return th;
}
function td(content, cls = "") {
  const td = document.createElement('td');
  td.className = "px-3 py-2 border align-top " + cls;
  td.textContent = content ?? '';
  return td;
}
function trHeader(content, colSpan) {
  const tr = document.createElement('tr');
  tr.innerHTML = `<td colspan="${colSpan}" class="bg-pink-600 text-white font-bold px-3 py-2 border">${content}</td>`;
  return tr;
}
function renderTable(container, groupedSections, weeks, data) {
  container.innerHTML = '';
  let table = document.createElement('table');
  table.className = "min-w-full text-sm border";
  // Header
  let thead = document.createElement('thead');
  let trh = document.createElement('tr');
  trh.appendChild(th('Metric', "bg-black text-yellow-300 font-bold"));
  trh.appendChild(th('Target', "bg-yellow-300 font-bold"));
  weeks.forEach(w => trh.appendChild(th(w, "bg-gray-100 font-bold")));
  thead.appendChild(trh);
  table.appendChild(thead);
  // Body
  let tbody = document.createElement('tbody');
  groupedSections.forEach(section => {
    tbody.appendChild(trHeader(section.header, weeks.length + 2));
    section.metrics.forEach(m => {
      const tr = document.createElement('tr');
      tr.appendChild(td(m.name, "font-medium"));
      tr.appendChild(td(m.target || "", "bg-yellow-200 font-bold"));
      weeks.forEach(w => {
        tr.appendChild(td(data?.weeks?.[w]?.[m.name] ?? "—"));
      });
      tbody.appendChild(tr);
    });
  });
  table.appendChild(tbody);
  container.appendChild(table);
}

// --- Focus & Commitments Form Rendering ---
function renderFocusCommitmentsForm(formEl, data) {
  const tbody = formEl.querySelector('tbody');
  tbody.innerHTML = '';
  FOCUS_COMMITMENTS_ROWS.forEach(row => {
    const values = (data && data[row]) || {};
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="border font-medium">${row}</td>
      <td><input name="current" class="w-full border rounded px-1 py-1" value="${values.current || ''}" /></td>
      <td><input name="commitment" class="w-full border rounded px-1 py-1" value="${values.commitment || ''}" /></td>
      <td><input name="outlier1" class="w-full border rounded px-1 py-1" value="${values.outlier1 || ''}" /></td>
      <td><input name="outlier2" class="w-full border rounded px-1 py-1" value="${values.outlier2 || ''}" /></td>
      <td><input name="outlier3" class="w-full border rounded px-1 py-1" value="${values.outlier3 || ''}" /></td>
    `;
    tr.setAttribute('data-metric', row);
    tbody.appendChild(tr);
  });
}

// --- Event Handlers ---
document.getElementById('entryForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { location, week, actuals } = getFormValues();
  const saveStatus = document.getElementById('saveStatus');
  if (!location || !week) {
    saveStatus.textContent = "Please enter a location and select a week.";
    return;
  }
  saveStatus.textContent = "Saving…";
  try {
    await saveWeek({ location, week, actuals });
    saveStatus.textContent = "Saved!";
    clearActualInputs();
  } catch (err) {
    console.error(err);
    saveStatus.textContent = "Error saving data (check Firebase config/rules).";
  }
});

// Slide 1 Progress
document.getElementById('loadProgress1').addEventListener('click', async () => {
  const loc = document.getElementById('progressLocation1').value.trim() || document.getElementById('locationInput').value.trim();
  if (!loc) return;
  const data = await loadProgress(loc);
  renderTable(
    document.getElementById('progressBody1'),
    groupMetricsBySection(SLIDE1_SECTIONS),
    ["Week 1", "Week 2", "Week 3", "Week 4"],
    data
  );
  // Load focus & commitments if present
  renderFocusCommitmentsForm(document.getElementById('focusCommitmentsForm'), data.focusCommitments);
});

// Slide 2 Progress
document.getElementById('loadProgress2').addEventListener('click', async () => {
  const loc = document.getElementById('progressLocation2').value.trim() || document.getElementById('locationInput').value.trim();
  if (!loc) return;
  const data = await loadProgress(loc);
  renderTable(
    document.getElementById('progressBody2'),
    groupMetricsBySection(SLIDE2_SECTIONS),
    ["Week 1", "Week 2", "Week 3", "Week 4"],
    data
  );
});

// Focus & Commitments Save
document.getElementById('focusCommitmentsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const location = document.getElementById('progressLocation1').value.trim() || document.getElementById('locationInput').value.trim();
  if (!location) {
    document.getElementById('commitmentStatus').textContent = "Enter location above and load progress first.";
    return;
  }
  const tbody = e.target.querySelector('tbody');
  const rows = tbody.querySelectorAll('tr[data-metric]');
  const data = {};
  rows.forEach(tr => {
    const metric = tr.getAttribute('data-metric');
    const [current, commitment, outlier1, outlier2, outlier3] = tr.querySelectorAll('input');
    data[metric] = {
      current: current.value,
      commitment: commitment.value,
      outlier1: outlier1.value,
      outlier2: outlier2.value,
      outlier3: outlier3.value,
    };
  });
  try {
    await saveFocusCommitments(location, data);
    document.getElementById('commitmentStatus').textContent = "Commitments saved!";
  } catch (err) {
    document.getElementById('commitmentStatus').textContent = "Error saving commitments.";
  }
});

// Initial blank rendering
renderTable(
  document.getElementById('progressBody1'),
  groupMetricsBySection(SLIDE1_SECTIONS),
  ["Week 1", "Week 2", "Week 3", "Week 4"],
  {}
);
renderTable(
  document.getElementById('progressBody2'),
  groupMetricsBySection(SLIDE2_SECTIONS),
  ["Week 1", "Week 2", "Week 3", "Week 4"],
  {}
);
renderFocusCommitmentsForm(document.getElementById('focusCommitmentsForm'), {});
