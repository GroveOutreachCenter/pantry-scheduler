var defaultDays = [
  {
    id: "mon",
    label: "Monday",
    enabled: true,
    blocks: [
      { label: "Seniors (55+) Hour", start: "10:00", end: "11:00" },
      { label: "All Others", start: "11:00", end: "14:00" }
    ]
  },
  {
    id: "tue",
    label: "Tuesday",
    enabled: true,
    blocks: [{ label: "All Shoppers", start: "13:00", end: "18:00" }]
  },
  {
    id: "wed",
    label: "Wednesday",
    enabled: true,
    blocks: [{ label: "Fresh Food Only", start: "14:00", end: "17:00" }]
  },
  { id: "thu", label: "Thursday", enabled: false, blocks: [{ label: "Closed", start: "10:00", end: "14:00" }] },
  { id: "fri", label: "Friday", enabled: true, blocks: [{ label: "All Shoppers", start: "10:00", end: "14:00" }] },
  { id: "sat", label: "Saturday", enabled: false, blocks: [{ label: "Closed", start: "10:00", end: "14:00" }] },
  { id: "sun", label: "Sunday", enabled: false, blocks: [{ label: "Closed", start: "10:00", end: "14:00" }] }
];

var areas = ["Shopper 1", "Shopper 2", "Shopper 3", "Shopper 4"];
var bookingStorageKey = "community-pantry-bookings-v2";
var hoursStorageKey = "community-pantry-hours-v2";
var staffAccessStorageKey = "community-pantry-staff-access";
var staffAccessCodeValue = "TheLordIsMyShepherd";

var days = loadDays();
var activeDayId = getFirstEnabledDayId(days) || days[0].id;
var selectedSlot = null;
var bookings = loadBookings();

var dayTabs = document.getElementById("dayTabs");
var slotGrid = document.getElementById("slotGrid");
var bookingForm = document.getElementById("bookingForm");
var selectedSlotBox = document.getElementById("selectedSlotBox");
var confirmVisit = document.getElementById("confirmVisit");
var signupList = document.getElementById("signupList");
var bookedCount = document.getElementById("bookedCount");
var openCount = document.getElementById("openCount");
var closedDayCount = document.getElementById("closedDayCount");
var staffDateLabel = document.getElementById("staffDateLabel");
var clientSearch = document.getElementById("clientSearch");
var toast = document.getElementById("toast");
var exportCsv = document.getElementById("exportCsv");
var resetDemo = document.getElementById("resetDemo");
var staffToggle = document.getElementById("staffToggle");
var staffSettings = document.getElementById("staffSettings");
var hoursList = document.getElementById("hoursList");
var saveHours = document.getElementById("saveHours");
var resetHours = document.getElementById("resetHours");
var viewSubtitle = document.getElementById("viewSubtitle");
var scheduleHelp = document.getElementById("scheduleHelp");
var publicViewLink = document.getElementById("publicViewLink");
var staffAccessButton = document.getElementById("staffAccessButton");
var staffAccessModal = document.getElementById("staffAccessModal");
var staffAccessForm = document.getElementById("staffAccessForm");
var staffAccessCode = document.getElementById("staffAccessCode");
var staffAccessError = document.getElementById("staffAccessError");
var cancelStaffAccess = document.getElementById("cancelStaffAccess");
var appView = getRequestedView();

function clone(value) {
  var copy;
  var i;
  var key;

  if (value === null || typeof value !== "object") return value;

  if (Object.prototype.toString.call(value) === "[object Array]") {
    copy = [];
    for (i = 0; i < value.length; i += 1) {
      copy[i] = clone(value[i]);
    }
    return copy;
  }

  copy = {};
  for (key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      copy[key] = clone(value[key]);
    }
  }
  return copy;
}

function storageGet(key) {
  try {
    if (typeof window.localStorage !== "undefined") {
      return window.localStorage.getItem(key);
    }
  } catch (error) {
    return null;
  }
  return null;
}

function storageSet(key, value) {
  try {
    if (typeof window.localStorage !== "undefined") {
      window.localStorage.setItem(key, value);
    }
  } catch (error) {
    showStorageNotice();
  }
}

function showStorageNotice() {
  var notice = document.getElementById("storageNotice");
  if (notice) return;

  notice = document.createElement("div");
  notice.id = "storageNotice";
  notice.className = "storage-notice";
  notice.innerHTML = "This browser is blocking local saved data. The page will work, but bookings may not remain after closing it.";
  document.body.insertBefore(notice, document.body.firstChild);
}

function hasClass(element, className) {
  return (" " + element.className + " ").indexOf(" " + className + " ") > -1;
}

function addClass(element, className) {
  if (!hasClass(element, className)) {
    element.className = element.className ? element.className + " " + className : className;
  }
}

function removeClass(element, className) {
  element.className = (" " + element.className + " ").replace(" " + className + " ", " ").replace(/^\s+|\s+$/g, "");
}

function setClass(element, className, enabled) {
  if (enabled) addClass(element, className);
  else removeClass(element, className);
}

function getRequestedView() {
  var search = window.location.search || "";
  var hash = window.location.hash || "";
  if (search.indexOf("view=staff") > -1 || hash === "#staff") return "staff";
  return "public";
}

function hasStaffAccess() {
  return storageGet(staffAccessStorageKey) === "yes";
}

function grantStaffAccess() {
  storageSet(staffAccessStorageKey, "yes");
}

function showStaffAccessModal() {
  removeClass(staffAccessModal, "is-hidden");
  addClass(document.body, "modal-open");
  staffAccessError.className = "access-error is-hidden";
  staffAccessCode.value = "";
  window.setTimeout(function () {
    staffAccessCode.focus();
  }, 0);
}

function hideStaffAccessModal() {
  addClass(staffAccessModal, "is-hidden");
  removeClass(document.body, "modal-open");
}

function requireStaffAccess() {
  if (appView !== "staff" || hasStaffAccess()) return true;
  appView = "public";
  showStaffAccessModal();
  return false;
}

function setActiveView() {
  requireStaffAccess();
  var isStaff = appView === "staff";
  setClass(document.body, "staff-mode", isStaff);
  setClass(document.body, "public-mode", !isStaff);
  setClass(publicViewLink, "active", !isStaff);
  setClass(staffAccessButton, "active", isStaff);
  publicViewLink.setAttribute("aria-current", !isStaff ? "page" : "false");
  staffAccessButton.innerHTML = isStaff ? "Staff mode" : "Staff access";
  staffAccessButton.setAttribute("aria-current", isStaff ? "page" : "false");
  staffToggle.innerHTML = hasClass(staffSettings, "is-hidden") ? "Edit hours" : "Hide hours";
  viewSubtitle.innerHTML = isStaff ? "Review visits, export signups, and manage pantry hours." : "Reserve one 15-minute visit for grocery shopping.";
  scheduleHelp.innerHTML = isStaff ? "Review all shopper slots by time. Booked slots show the client name." : "Each time has four shopper slots. Filled slots are no longer selectable.";
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return "booking-" + new Date().getTime() + "-" + Math.random().toString(16).slice(2);
}

function findInList(list, matcher) {
  for (var i = 0; i < list.length; i += 1) {
    if (matcher(list[i], i)) return list[i];
  }
  return null;
}

function getFirstEnabledDayId(dayList) {
  var day = findInList(dayList, function (item) {
    return item.enabled;
  });
  return day ? day.id : "";
}

function mergeDay(day, defaultDay) {
  var merged = clone(defaultDay);
  var source = day || defaultDay;
  merged.id = source.id || defaultDay.id;
  merged.label = source.label || defaultDay.label;
  merged.enabled = typeof source.enabled === "boolean" ? source.enabled : defaultDay.enabled;
  merged.blocks = [];

  if (source.blocks && source.blocks.length) {
    for (var i = 0; i < source.blocks.length; i += 1) {
      merged.blocks.push({
        label: source.blocks[i].label || "Open Shopping",
        start: source.blocks[i].start || defaultDay.blocks[0].start,
        end: source.blocks[i].end || defaultDay.blocks[0].end
      });
    }
  } else {
    merged.blocks.push({
      label: "All Shoppers",
      start: source.start || defaultDay.blocks[0].start,
      end: source.end || defaultDay.blocks[0].end
    });
  }

  return merged;
}

function loadDays() {
  if (typeof JSON === "undefined") {
    showStorageNotice();
    return clone(defaultDays);
  }

  var stored = storageGet(hoursStorageKey);
  if (!stored) return clone(defaultDays);

  var savedDays = JSON.parse(stored);
  var normalized = [];
  for (var i = 0; i < defaultDays.length; i += 1) {
    var defaultDay = defaultDays[i];
    var savedDay = findInList(savedDays, function (item) {
      return item.id === defaultDay.id;
    });
    normalized.push(mergeDay(savedDay, defaultDay));
  }
  return normalized;
}

function saveDays() {
  if (typeof JSON === "undefined") {
    showStorageNotice();
    return;
  }
  storageSet(hoursStorageKey, JSON.stringify(days));
}

function loadBookings() {
  if (typeof JSON === "undefined") {
    showStorageNotice();
    return getDefaultBookings();
  }

  var stored = storageGet(bookingStorageKey) || storageGet("community-pantry-bookings-v1");
  if (stored) return normalizeBookings(JSON.parse(stored));

  return normalizeBookings(getDefaultBookings());
}

function normalizeAreaLabel(value) {
  return String(value || "").replace(/^Area /, "Shopper ");
}

function normalizeBookings(items) {
  for (var i = 0; i < items.length; i += 1) {
    items[i].area = normalizeAreaLabel(items[i].area);
  }
  return items;
}

function getDefaultBookings() {
  return [
    {
      id: createId(),
      dayId: "mon",
      time: "10:00 AM",
      area: "Shopper 1",
      name: "Maria Lopez",
      phone: "(555) 014-2201",
      household: "3",
      notes: "Spanish preferred",
      createdAt: new Date().toISOString()
    },
    {
      id: createId(),
      dayId: "mon",
      time: "11:15 AM",
      area: "Shopper 3",
      name: "James Carter",
      phone: "(555) 017-3320",
      household: "1",
      notes: "",
      createdAt: new Date().toISOString()
    }
  ];
}

function saveBookings() {
  if (typeof JSON === "undefined") {
    showStorageNotice();
    return;
  }
  storageSet(bookingStorageKey, JSON.stringify(bookings));
}

function getActiveDay() {
  return findInList(days, function (day) {
    return day.id === activeDayId;
  });
}

function getBooking(dayId, time, area) {
  return findInList(bookings, function (booking) {
    return booking.dayId === dayId && booking.time === time && booking.area === area;
  });
}

function timeToMinutes(time) {
  var pieces = time.split(":");
  return Number(pieces[0]) * 60 + Number(pieces[1]);
}

function pad2(value) {
  return value < 10 ? "0" + value : String(value);
}

function minutesToLabel(totalMinutes) {
  var hours24 = Math.floor(totalMinutes / 60);
  var minutes = totalMinutes % 60;
  var suffix = hours24 >= 12 ? "PM" : "AM";
  var hours12 = hours24 % 12 || 12;
  return hours12 + ":" + pad2(minutes) + " " + suffix;
}

function getDaySlots(day) {
  var allSlots = [];
  if (!day || !day.enabled) return allSlots;

  for (var blockIndex = 0; blockIndex < day.blocks.length; blockIndex += 1) {
    var block = day.blocks[blockIndex];
    var start = timeToMinutes(block.start);
    var end = timeToMinutes(block.end);
    if (end <= start) continue;

    for (var minute = start; minute < end; minute += 15) {
      allSlots.push({
        time: minutesToLabel(minute),
        blockLabel: block.label || "Open Shopping",
        blockIndex: blockIndex
      });
    }
  }

  return allSlots;
}

function listContains(list, value) {
  for (var i = 0; i < list.length; i += 1) {
    if (list[i] === value) return true;
  }
  return false;
}

function getDayOpenCount(day) {
  var slots = getDaySlots(day);
  var slotTimes = [];
  var visibleBookings = 0;

  for (var i = 0; i < slots.length; i += 1) {
    slotTimes.push(slots[i].time);
  }

  for (var j = 0; j < bookings.length; j += 1) {
    if (bookings[j].dayId === day.id && listContains(slotTimes, bookings[j].time)) {
      visibleBookings += 1;
    }
  }

  return slots.length * areas.length - visibleBookings;
}

function formatTimeRange(block) {
  return minutesToLabel(timeToMinutes(block.start)) + "-" + minutesToLabel(timeToMinutes(block.end));
}

function formatDaySchedule(day) {
  if (!day.enabled) return "Closed";
  var parts = [];
  for (var i = 0; i < day.blocks.length; i += 1) {
    parts.push(day.blocks[i].label + ": " + formatTimeRange(day.blocks[i]));
  }
  return parts.join(" / ");
}

function formatShortDayHours(day) {
  if (!day.enabled) return "Closed";
  var first = day.blocks[0];
  var last = day.blocks[day.blocks.length - 1];
  return minutesToLabel(timeToMinutes(first.start)) + "-" + minutesToLabel(timeToMinutes(last.end));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(message) {
  toast.innerHTML = escapeHtml(message);
  addClass(toast, "show");
  window.setTimeout(function () {
    removeClass(toast, "show");
  }, 2800);
}

function renderDayTabs() {
  dayTabs.innerHTML = "";

  for (var i = 0; i < days.length; i += 1) {
    (function (day) {
      var button = document.createElement("button");
      button.className = "day-tab" + (day.id === activeDayId ? " active" : "") + (!day.enabled ? " closed" : "");
      button.type = "button";
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", day.id === activeDayId ? "true" : "false");
      button.innerHTML =
        "<strong>" +
        escapeHtml(day.label) +
        "</strong><span>" +
        (day.enabled ? getDayOpenCount(day) + " open - " + formatShortDayHours(day) : "Closed") +
        "</span>";
      button.onclick = function () {
        activeDayId = day.id;
        selectedSlot = null;
        render();
      };
      dayTabs.appendChild(button);
    })(days[i]);
  }
}

function renderGrid() {
  var day = getActiveDay();
  var slots = getDaySlots(day);
  slotGrid.className = "schedule-grid";
  slotGrid.innerHTML = "";

  if (!day.enabled || !slots.length) {
    slotGrid.innerHTML =
      '<div class="empty-state wide">' +
      (day.enabled
        ? "Set an end time after the start time to create 15-minute signup rows."
        : escapeHtml(day.label) + " is closed. Turn it on in Weekly availability to accept signups.") +
      "</div>";
    return;
  }

  var header = document.createElement("div");
  var headerHtml = "<span>Time</span>";
  header.className = "grid-header";
  for (var h = 0; h < areas.length; h += 1) {
    headerHtml += "<span>" + escapeHtml(areas[h]) + "</span>";
  }
  header.innerHTML = headerHtml;
  slotGrid.appendChild(header);

  for (var i = 0; i < slots.length; i += 1) {
    var slot = slots[i];
    var previousSlot = slots[i - 1];
    var isNewBlock = !previousSlot || previousSlot.blockIndex !== slot.blockIndex;

    if (isNewBlock) {
      var blockHeader = document.createElement("div");
      blockHeader.className = "block-row";
      blockHeader.innerHTML = "<strong>" + escapeHtml(slot.blockLabel) + "</strong>";
      slotGrid.appendChild(blockHeader);
    }

    var row = document.createElement("div");
    row.className = "time-row";
    row.innerHTML = '<div class="time-label">' + escapeHtml(slot.time) + "</div>";

    for (var a = 0; a < areas.length; a += 1) {
      addAreaButton(row, day, slot, areas[a]);
    }

    slotGrid.appendChild(row);
  }
}

function addAreaButton(row, day, slot, area) {
  var existing = getBooking(day.id, slot.time, area);
  var isSelected = selectedSlot && selectedSlot.dayId === day.id && selectedSlot.time === slot.time && selectedSlot.area === area;
  var button = document.createElement("button");
  button.type = "button";
  button.className = "area-cell " + (existing ? "booked" : "open") + (isSelected ? " selected" : "");
  button.disabled = !!existing;
  button.innerHTML = existing
    ? "<strong>Booked</strong><span>" + escapeHtml(existing.name) + "</span>"
    : "<strong>Open</strong><span>Reserve " + escapeHtml(area) + "</span>";

  if (!existing) {
    button.onclick = function () {
      selectedSlot = {
        dayId: day.id,
        dayLabel: day.label,
        time: slot.time,
        area: area,
        blockLabel: slot.blockLabel
      };
      renderGrid();
      renderSelectedSlot();
    };
  }

  row.appendChild(button);
}

function renderSelectedSlot() {
  removeClass(selectedSlotBox, "confirmed");
  if (!selectedSlot) {
    selectedSlotBox.innerHTML = "<span>No slot selected</span><strong>Select an open shopper slot.</strong>";
    confirmVisit.disabled = true;
    return;
  }

  selectedSlotBox.innerHTML =
    "<span>Selected visit</span><strong>" +
    escapeHtml(selectedSlot.dayLabel) +
    " at " +
    escapeHtml(selectedSlot.time) +
    "<br>" +
    escapeHtml(selectedSlot.blockLabel) +
    "<br>" +
    escapeHtml(selectedSlot.area) +
    "</strong>";
  confirmVisit.disabled = false;
}

function renderConfirmedSlot(booking, slot) {
  addClass(selectedSlotBox, "confirmed");
  selectedSlotBox.innerHTML =
    "<span>Visit confirmed</span><strong>" +
    escapeHtml(slot.dayLabel) +
    " at " +
    escapeHtml(slot.time) +
    "<br>" +
    escapeHtml(slot.blockLabel) +
    "<br>" +
    escapeHtml(slot.area) +
    "</strong><small>We saved this visit for " +
    escapeHtml(booking.name) +
    ".</small>";
  confirmVisit.disabled = true;
}

function renderStaffPanel() {
  var day = getActiveDay();
  var slots = getDaySlots(day);
  var slotTimes = [];
  var search = clientSearch.value.replace(/^\s+|\s+$/g, "").toLowerCase();
  var dayBookings = [];
  var filtered = [];

  for (var i = 0; i < slots.length; i += 1) {
    slotTimes.push(slots[i].time);
  }

  for (var b = 0; b < bookings.length; b += 1) {
    if (bookings[b].dayId === day.id && listContains(slotTimes, bookings[b].time)) {
      dayBookings.push(bookings[b]);
    }
  }

  dayBookings.sort(function (a, b) {
    return slotTimes.indexOf(a.time) - slotTimes.indexOf(b.time) || areas.indexOf(a.area) - areas.indexOf(b.area);
  });

  for (var f = 0; f < dayBookings.length; f += 1) {
    var haystack = (dayBookings[f].name + " " + dayBookings[f].phone + " " + dayBookings[f].area + " " + dayBookings[f].time).toLowerCase();
    if (haystack.indexOf(search) > -1) filtered.push(dayBookings[f]);
  }

  bookedCount.innerHTML = String(dayBookings.length);
  openCount.innerHTML = String(Math.max(slots.length * areas.length - dayBookings.length, 0));
  closedDayCount.innerHTML = String(getClosedDayCount());
  staffDateLabel.innerHTML = escapeHtml(day.label + " - " + formatDaySchedule(day));

  if (!filtered.length) {
    signupList.innerHTML = '<div class="empty-state">' + (search ? "No matching clients found." : "No clients are signed up for this day yet.") + "</div>";
    return;
  }

  var html = "";
  for (var j = 0; j < filtered.length; j += 1) {
    var booking = filtered[j];
    var slot = findInList(slots, function (item) {
      return item.time === booking.time;
    });
    html +=
      '<article class="signup-card"><header><div><strong>' +
      escapeHtml(booking.name) +
      "</strong><span>" +
      escapeHtml(booking.time) +
      " - " +
      escapeHtml(slot ? slot.blockLabel : "Open Shopping") +
      " - " +
      escapeHtml(booking.area) +
      '</span></div><span class="status-tag">Booked</span></header><p>' +
      escapeHtml(booking.phone) +
      " - Household of " +
      escapeHtml(booking.household) +
      "</p>" +
      (booking.notes ? "<p>" + escapeHtml(booking.notes) + "</p>" : "") +
      "</article>";
  }
  signupList.innerHTML = html;
}

function getClosedDayCount() {
  var count = 0;
  for (var i = 0; i < days.length; i += 1) {
    if (!days[i].enabled) count += 1;
  }
  return count;
}

function renderHoursEditor() {
  var html = "";
  for (var i = 0; i < days.length; i += 1) {
    var day = days[i];
    html += '<div class="day-hours-group" data-day-id="' + escapeHtml(day.id) + '">';
    html += '<label class="open-toggle"><input type="checkbox" data-field="enabled"' + (day.enabled ? " checked" : "") + " />";
    html += "<span>" + escapeHtml(day.label) + "</span></label>";
    html += '<div class="block-editor-list">';

    for (var b = 0; b < day.blocks.length; b += 1) {
      var block = day.blocks[b];
      var disabled = day.enabled ? "" : " disabled";
      html += '<div class="hours-row" data-block-index="' + b + '">';
      html += '<label>Block<input type="text" data-field="label" value="' + escapeHtml(block.label) + '"' + disabled + " /></label>";
      html += '<label>Start<input type="time" data-field="start" step="900" value="' + escapeHtml(block.start) + '"' + disabled + " /></label>";
      html += '<label>End<input type="time" data-field="end" step="900" value="' + escapeHtml(block.end) + '"' + disabled + " /></label>";
      html += "</div>";
    }

    html += "</div></div>";
  }
  hoursList.innerHTML = html;
}

function applyHoursEditorChanges() {
  var updatedDays = [];

  for (var i = 0; i < days.length; i += 1) {
    var day = days[i];
    var group = hoursList.querySelector('[data-day-id="' + day.id + '"]');
    var enabled = group.querySelector('[data-field="enabled"]').checked;
    var rows = group.querySelectorAll(".hours-row");
    var blocks = [];

    for (var r = 0; r < rows.length; r += 1) {
      blocks.push({
        label: rows[r].querySelector('[data-field="label"]').value.replace(/^\s+|\s+$/g, "") || "Open Shopping",
        start: rows[r].querySelector('[data-field="start"]').value,
        end: rows[r].querySelector('[data-field="end"]').value
      });
    }

    updatedDays.push({
      id: day.id,
      label: day.label,
      enabled: enabled,
      blocks: blocks
    });
  }

  for (var d = 0; d < updatedDays.length; d += 1) {
    if (updatedDays[d].enabled) {
      for (var b = 0; b < updatedDays[d].blocks.length; b += 1) {
        var block = updatedDays[d].blocks[b];
        if (!block.start || !block.end || timeToMinutes(block.end) <= timeToMinutes(block.start)) {
          showToast(updatedDays[d].label + " needs each open block to end after it starts.");
          return;
        }
      }
    }
  }

  days = updatedDays;
  if (!findInList(days, function (day) { return day.id === activeDayId && day.enabled; })) {
    activeDayId = getFirstEnabledDayId(days) || days[0].id;
  }
  selectedSlot = null;
  saveDays();
  render();
  showToast("Weekly availability saved.");
}

function resetHoursToDefaults() {
  days = clone(defaultDays);
  activeDayId = getFirstEnabledDayId(days) || days[0].id;
  selectedSlot = null;
  saveDays();
  render();
  showToast("Default pantry hours restored.");
}

function toggleStaffSettings() {
  var willShow = hasClass(staffSettings, "is-hidden");
  setClass(staffSettings, "is-hidden", !willShow);
  staffToggle.innerHTML = willShow ? "Hide hours" : "Edit hours";
}

function bookingToCsv() {
  var rows = [["Day", "Time", "Shopping Block", "Shopper", "Client", "Phone", "Household", "Notes"]];
  for (var i = 0; i < bookings.length; i += 1) {
    var booking = bookings[i];
    var day = findInList(days, function (item) {
      return item.id === booking.dayId;
    });
    var slot = day
      ? findInList(getDaySlots(day), function (item) {
          return item.time === booking.time;
        })
      : null;
    rows.push([day ? day.label : booking.dayId, booking.time, slot ? slot.blockLabel : "", booking.area, booking.name, booking.phone, booking.household, booking.notes]);
  }

  var lines = [];
  for (var r = 0; r < rows.length; r += 1) {
    var cells = [];
    for (var c = 0; c < rows[r].length; c += 1) {
      cells.push('"' + String(rows[r][c]).replace(/"/g, '""') + '"');
    }
    lines.push(cells.join(","));
  }
  return lines.join("\n");
}

function render() {
  setActiveView();
  renderDayTabs();
  renderGrid();
  renderSelectedSlot();
  renderStaffPanel();
  renderHoursEditor();
}

bookingForm.onsubmit = function (event) {
  event.preventDefault();

  if (!selectedSlot) return;
  if (getBooking(selectedSlot.dayId, selectedSlot.time, selectedSlot.area)) {
    showToast("That shopper slot was just booked. Please choose another open slot.");
    selectedSlot = null;
    render();
    return;
  }

  var booking = {
    id: createId(),
    dayId: selectedSlot.dayId,
    time: selectedSlot.time,
    area: selectedSlot.area,
    name: document.getElementById("clientName").value.replace(/^\s+|\s+$/g, ""),
    phone: document.getElementById("clientPhone").value.replace(/^\s+|\s+$/g, ""),
    household: document.getElementById("householdSize").value,
    notes: document.getElementById("clientNotes").value.replace(/^\s+|\s+$/g, ""),
    createdAt: new Date().toISOString()
  };
  var confirmedSlot = clone(selectedSlot);
  bookings.push(booking);

  saveBookings();
  showToast("Visit confirmed for " + confirmedSlot.dayLabel + " at " + confirmedSlot.time + ", " + confirmedSlot.area + ".");
  selectedSlot = null;
  bookingForm.reset();
  document.getElementById("householdSize").value = "2";
  render();
  renderConfirmedSlot(booking, confirmedSlot);
};

clientSearch.oninput = renderStaffPanel;
staffToggle.onclick = toggleStaffSettings;
saveHours.onclick = applyHoursEditorChanges;
resetHours.onclick = resetHoursToDefaults;

staffAccessButton.onclick = function () {
  if (appView === "staff") return;
  showStaffAccessModal();
};

cancelStaffAccess.onclick = hideStaffAccessModal;

staffAccessModal.onclick = function (event) {
  if (event.target === staffAccessModal) hideStaffAccessModal();
};

staffAccessForm.onsubmit = function (event) {
  event.preventDefault();
  if (staffAccessCode.value === staffAccessCodeValue) {
    grantStaffAccess();
    appView = "staff";
    if (window.history && typeof window.history.replaceState === "function") {
      window.history.replaceState(null, "", "./index.html?view=staff");
    }
    hideStaffAccessModal();
    render();
    showToast("Staff page unlocked.");
    return;
  }
  staffAccessError.className = "access-error";
  staffAccessCode.select();
};

hoursList.onchange = function (event) {
  var target = event.target || event.srcElement;
  if (target && target.getAttribute("data-field") === "enabled") {
    var group = target.parentNode;
    while (group && group.className.indexOf("day-hours-group") === -1) {
      group = group.parentNode;
    }
    if (!group) return;
    var inputs = group.querySelectorAll(".hours-row input");
    for (var i = 0; i < inputs.length; i += 1) {
      inputs[i].disabled = !target.checked;
    }
  }
};

exportCsv.onclick = function () {
  if (typeof Blob === "undefined" || typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
    showToast("CSV export is not supported in this browser. Please open the app in Chrome, Edge, or Firefox to export.");
    return;
  }

  var blob = new Blob([bookingToCsv()], { type: "text/csv" });
  var url = URL.createObjectURL(blob);
  var link = document.createElement("a");
  link.href = url;
  link.download = "pantry-schedule.csv";
  link.click();
  URL.revokeObjectURL(url);
};

resetDemo.onclick = function () {
  bookings = [];
  selectedSlot = null;
  saveBookings();
  render();
  showToast("Demo bookings cleared.");
};

render();
