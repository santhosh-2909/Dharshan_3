const API_BASE = `${globalThis.location.origin}/api/v1`;

// Quick Actions Widget logic
document.addEventListener('DOMContentLoaded', () => {
    const widget = document.getElementById('quickActionsWidget');
    const btn = document.getElementById('quickActionsBtn');
    if (widget && btn) {
        btn.addEventListener('click', () => {
            widget.classList.toggle('open');
        });
        // Optional: Drag to move (mobile-friendly)
        let isDragging = false, startX, startY;
        btn.addEventListener('touchstart', e => {
            isDragging = true;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        btn.addEventListener('touchmove', e => {
            if (!isDragging) return;
            const dx = startX - e.touches[0].clientX;
            const dy = startY - e.touches[0].clientY;
            widget.style.right = `${32 + dx}px`;
            widget.style.bottom = `${32 + dy}px`;
        });
        btn.addEventListener('touchend', () => { isDragging = false; });
    }
});
const SETTINGS_KEY = "smartdarshan-settings";
const FEEDBACK_KEY = "smartdarshan-feedback";
const DEFAULT_PAGE = "dashboard";

const state = {
    payload: null,
    page: DEFAULT_PAGE,
    selectedGate: 0,
    selectedLanguage: "English",
    selectedBookingStatus: "All Status",
    bookingQuery: "",
    globalQuery: "",
    parkingDirectionsOpen: false,
    broadcastHistory: [],
    feedbackHistory: loadFeedbackHistory(),
    settings: loadSettings(),
};

const statusText = document.getElementById("status-text");
const dateRange = document.getElementById("date-range");
const metricImages = document.getElementById("metric-images");
const metricAverage = document.getElementById("metric-average");
const metricPeakHour = document.getElementById("metric-peak-hour");
const metricBusiestDay = document.getElementById("metric-busiest-day");
const paceCopy = document.getElementById("pace-copy");
const gateProgressBar = document.getElementById("gate-progress-bar");
const activeCameras = document.getElementById("active-cameras");
const alertCount = document.getElementById("alert-count");
const currentVisitors = document.getElementById("current-visitors");
const visitorDelta = document.getElementById("visitor-delta");
const templeSelect = document.getElementById("temple-select");
const daysRange = document.getElementById("days-range");
const daysRangeValue = document.getElementById("days-range-value");
const gateGrid = document.getElementById("gate-grid");
const mainGateId = document.getElementById("main-gate-id");
const mainGateName = document.getElementById("main-gate-name");
const mainGateStatus = document.getElementById("main-gate-status");
const mainGateSlot = document.getElementById("main-gate-slot");
const mainGateCapacity = document.getElementById("main-gate-capacity");
const mainGateOccupancy = document.getElementById("main-gate-occupancy");
const liveImage = document.getElementById("live-image");
const liveScore = document.getElementById("live-score");
const liveCaption = document.getElementById("live-caption");
const liveNow = document.getElementById("live-now");
const liveAverage = document.getElementById("live-average");
const livePeak = document.getElementById("live-peak");
const liveChart = document.getElementById("live-chart");
const entryLogList = document.getElementById("entry-log-list");
const timelineChart = document.getElementById("timeline-chart");
const forecastSummary = document.getElementById("forecast-summary");
const forecastGrid = document.getElementById("forecast-grid");
const surgeAlert = document.getElementById("surge-alert");
const historyForecastChart = document.getElementById("history-forecast-chart");
const hourlySummary = document.getElementById("hourly-summary");
const forecastHeatmap = document.getElementById("forecast-heatmap");
const tomorrowProfile = document.getElementById("tomorrow-profile");
const tomorrowProfileCaption = document.getElementById("tomorrow-profile-caption");
const comparisonSummary = document.getElementById("comparison-summary");
const comparisonCopy = document.getElementById("comparison-copy");
const comparisonWeekdays = document.getElementById("comparison-weekdays");
const galleryGrid = document.getElementById("gallery-grid");
const monitoringZones = document.getElementById("monitoring-zones");
const cctvNetworkList = document.getElementById("cctv-network-list");
const paZoneList = document.getElementById("pa-zone-list");
const parkingMetrics = document.getElementById("parking-metrics");
const parkingGrid = document.getElementById("parking-grid");
const shuttleStatus = document.getElementById("shuttle-status");
const bookingSlotGrid = document.getElementById("booking-slot-grid");
const bookingList = document.getElementById("booking-list");
const securityNetworkList = document.getElementById("security-network-list");
const securityModelList = document.getElementById("security-model-list");
const quickMessages = document.getElementById("quick-messages");
const highContrastToggle = document.getElementById("high-contrast-toggle");
const largeTextToggle = document.getElementById("large-text-toggle");
const reduceMotionToggle = document.getElementById("reduce-motion-toggle");
const compactToggle = document.getElementById("compact-toggle");
const showGalleryToggle = document.getElementById("show-gallery-toggle");
const showImageLabelsToggle = document.getElementById("show-image-labels-toggle");
const announcementMessage = document.getElementById("announcement-message");
const broadcastButton = document.getElementById("broadcast-button");
const broadcastStatus = document.getElementById("broadcast-status");
const masterVolume = document.getElementById("master-volume");
const parkingDirectionsButton = document.getElementById("parking-directions-button");
const bookingSearch = document.getElementById("booking-search");
const bookingStatusFilter = document.getElementById("booking-status-filter");
const themeSelect = document.getElementById("theme-select");
const globalSearch = document.getElementById("global-search");
const notificationButton = document.getElementById("notification-button");
const dashboardIntro = document.getElementById("dashboard-intro");
const dashboardCards = document.getElementById("dashboard-cards");
const dashboardHeroImage = document.getElementById("dashboard-hero-image");
const dashboardHeroTitle = document.getElementById("dashboard-hero-title");
const dashboardHeroCopy = document.getElementById("dashboard-hero-copy");
const dashboardFrameList = document.getElementById("dashboard-frame-list");
const dashboardHighlights = document.getElementById("dashboard-highlights");
const dashboardLinks = document.getElementById("dashboard-links");
const feedbackName = document.getElementById("feedback-name");
const feedbackEmail = document.getElementById("feedback-email");
const feedbackMessage = document.getElementById("feedback-message");
const feedbackSubmit = document.getElementById("feedback-submit");
const feedbackStatus = document.getElementById("feedback-status");
const feedbackHistory = document.getElementById("feedback-history");
const faqList = document.getElementById("faq-list");
const aboutList = document.getElementById("about-list");
const profileList = document.getElementById("profile-list");
const profileStatus = document.getElementById("profile-status");
const logoutButton = document.getElementById("logout-button");
const menuItems = Array.from(document.querySelectorAll(".menu-item"));
const screens = Array.from(document.querySelectorAll(".screen"));
const forecastCardTemplate = document.getElementById("forecast-card-template");
const menuShortcuts = Array.from(document.querySelectorAll(".menu-shortcut"));

initializeControls();
await initialize();

async function initialize() {
    restorePageFromHash();
    await fetchDashboard();
    applySettings();
    applyPage();
    globalThis.addEventListener("hashchange", () => {
        restorePageFromHash();
        applyPage();
    });
}

function initializeControls() {
    highContrastToggle.checked = state.settings.highContrast;
    largeTextToggle.checked = state.settings.largeText;
    reduceMotionToggle.checked = state.settings.reduceMotion;
    compactToggle.checked = state.settings.compact;
    showGalleryToggle.checked = state.settings.showGallery;
    showImageLabelsToggle.checked = state.settings.showImageLabels;
    themeSelect.value = state.settings.theme;
    daysRange.value = state.settings.days;
    updateDaysLabel();

    menuItems.forEach((item) => {
        item.addEventListener("click", () => {
            state.page = item.dataset.page;
            globalThis.location.hash = state.page;
            applyPage();
        });
    });

    menuShortcuts.forEach((item) => {
        item.addEventListener("click", () => {
            state.page = item.dataset.pageTarget;
            globalThis.location.hash = state.page;
            applyPage();
            item.closest("details")?.removeAttribute("open");
        });
    });

    templeSelect.addEventListener("change", async () => {
        state.settings.temple = templeSelect.value;
        persistSettings();
        await fetchDashboard();
    });

    daysRange.addEventListener("input", async () => {
        state.settings.days = Number(daysRange.value);
        updateDaysLabel();
        persistSettings();
        await fetchDashboard();
    });

    [
        [highContrastToggle, "highContrast"],
        [largeTextToggle, "largeText"],
        [reduceMotionToggle, "reduceMotion"],
        [compactToggle, "compact"],
        [showGalleryToggle, "showGallery"],
        [showImageLabelsToggle, "showImageLabels"],
    ].forEach(([toggle, key]) => {
        toggle.addEventListener("change", () => {
            state.settings[key] = toggle.checked;
            persistSettings();
            applySettings();
            if (state.payload) {
                renderDashboard(state.payload);
            }
        });
    });

    themeSelect.addEventListener("change", () => {
        state.settings.theme = themeSelect.value;
        persistSettings();
        applySettings();
    });

    globalSearch.addEventListener("input", () => {
        state.globalQuery = globalSearch.value.trim().toLowerCase();
        if (!state.globalQuery) {
            return;
        }
        const match = [
            ["dashboard", ["dashboard", "home", "overview"]],
            ["live-monitoring", ["live", "monitor", "camera"]],
            ["cctv-feeds", ["cctv", "feed", "frames"]],
            ["ai-predictions", ["ai", "prediction", "forecast", "comparison"]],
            ["controls", ["control", "announcement", "pa"]],
            ["parking", ["parking", "shuttle", "direction"]],
            ["smart-gates", ["gate", "entry"]],
            ["darshan-bookings", ["booking", "reservation", "darshan"]],
            ["security", ["security", "model", "alert"]],
            ["feedback", ["feedback", "bug", "feature"]],
            ["faq", ["faq", "help", "question"]],
            ["about", ["about", "version", "purpose"]],
            ["profile", ["profile", "account", "logout"]],
        ].find(([, keywords]) => keywords.some((keyword) => keyword.includes(state.globalQuery) || state.globalQuery.includes(keyword)));
        if (match) {
            state.page = match[0];
            globalThis.location.hash = state.page;
            applyPage();
        }
    });

    notificationButton.addEventListener("click", () => {
        state.page = "security";
        globalThis.location.hash = state.page;
        surgeAlert.classList.remove("hidden");
        surgeAlert.textContent = "3 active operational alerts are available in the security and forecast views.";
        applyPage();
    });

    document.querySelectorAll(".lang-button").forEach((button) => {
        button.addEventListener("click", () => {
            state.selectedLanguage = button.dataset.language || "English";
            document.querySelectorAll(".lang-button").forEach((item) => item.classList.toggle("active", item === button));
            broadcastStatus.textContent = `Language set to ${state.selectedLanguage}.`;
        });
    });

    broadcastButton.addEventListener("click", () => {
        const message = announcementMessage.value.trim();
        if (!message) {
            broadcastStatus.textContent = "Enter an announcement message before broadcasting.";
            return;
        }
        const volume = masterVolume.value;
        const stamp = new Intl.DateTimeFormat("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date());
        state.broadcastHistory.unshift(`${stamp} • ${state.selectedLanguage} • ${volume}% volume`);
        broadcastStatus.textContent = `Broadcast queued in ${state.selectedLanguage} at ${volume}% volume.`;
        renderControls();
    });

    parkingDirectionsButton.addEventListener("click", () => {
        state.parkingDirectionsOpen = !state.parkingDirectionsOpen;
        parkingDirectionsButton.textContent = state.parkingDirectionsOpen ? "Hide Directions" : "Directions";
        if (state.payload) {
            renderParking(state.payload.live_monitor, state.payload.footfall);
        }
    });

    bookingSearch.addEventListener("input", () => {
        state.bookingQuery = bookingSearch.value.trim().toLowerCase();
        if (state.payload) {
            renderBookings(state.payload.footfall);
        }
    });

    bookingStatusFilter.addEventListener("change", () => {
        state.selectedBookingStatus = bookingStatusFilter.value;
        if (state.payload) {
            renderBookings(state.payload.footfall);
        }
    });

    feedbackSubmit.addEventListener("click", async () => {
        const message = feedbackMessage.value.trim();
        if (!message) {
            feedbackStatus.textContent = "Write a short message before submitting feedback.";
            return;
        }
        feedbackStatus.textContent = "Submitting feedback...";
        await new Promise((resolve) => globalThis.setTimeout(resolve, 450));
        state.feedbackHistory.unshift({
            name: feedbackName.value.trim(),
            email: feedbackEmail.value.trim(),
            message,
            createdAt: new Date().toISOString(),
        });
        persistFeedbackHistory();
        feedbackName.value = "";
        feedbackEmail.value = "";
        feedbackMessage.value = "";
        feedbackStatus.textContent = "Feedback submitted successfully.";
        renderFeedback();
    });

    logoutButton.addEventListener("click", () => {
        profileStatus.textContent = "Signed out from the local demo session.";
        state.page = "dashboard";
        globalThis.location.hash = state.page;
        applyPage();
    });
}

function restorePageFromHash() {
    const hash = globalThis.location.hash.replace("#", "");
    const allowed = new Set(menuItems.map((item) => item.dataset.page));
    state.page = allowed.has(hash) ? hash : DEFAULT_PAGE;
}

function applyPage() {
    menuItems.forEach((item) => item.classList.toggle("active", item.dataset.page === state.page));
    screens.forEach((screen) => screen.classList.toggle("active", screen.dataset.screen === state.page));
}

async function fetchDashboard() {
    try {
        const params = new URLSearchParams({
            temple_id: state.settings.temple || "",
            days: String(state.settings.days || 7),
        });
        const response = await fetch(`${API_BASE}/dashboard?${params.toString()}`);
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
            throw new Error(error.detail || "Unable to load dashboard data");
        }
        state.payload = await response.json();
        renderDashboard(state.payload);
        statusText.textContent = "Online";
    } catch (error) {
        console.error(error);
        statusText.textContent = error.message;
    }
}

function renderDashboard(payload) {
    const { summary, timeline, top_frames: topFrames, footfall, live_monitor: liveMonitor, attendance, traffic } = payload;

    populateTempleOptions(footfall.temples, footfall.selected_temple);
    metricImages.textContent = formatNumber(liveMonitor.latest_people_index);
    metricAverage.textContent = summary.average_score.toFixed(1);
    metricPeakHour.textContent = `${String(summary.peak_hour).padStart(2, "0")}:00`;
    metricBusiestDay.textContent = formatDate(summary.busiest_day, { month: "short", day: "numeric" });
    dateRange.textContent = `${formatDate(summary.start_date)} to ${formatDate(summary.end_date)}`;
    paceCopy.textContent = `${Math.round((liveMonitor.latest_people_index / Math.max(liveMonitor.rolling_average, 1) - 1) * 100)}% vs recent average`;
    gateProgressBar.style.width = `${Math.min(100, Math.max(18, (summary.average_score / Math.max(summary.peak_score, 1)) * 100))}%`;
    activeCameras.textContent = `7/${Math.min(8, topFrames.length)}`;
    alertCount.textContent = String(footfall.forecast_summary.surge_days || 0);
    notificationButton.textContent = `${Math.max(1, footfall.forecast_summary.surge_days || 0)} Alerts`;
    currentVisitors.textContent = formatNumber(liveMonitor.latest_people_index * 27);
    visitorDelta.textContent = `${Math.round((liveMonitor.latest_people_index / Math.max(liveMonitor.rolling_average, 1)) * 100 - 100)}% from recent average`;

    renderDashboardHome(summary, liveMonitor, footfall, attendance, traffic, topFrames);
    renderGateGrid(liveMonitor, footfall);
    renderLiveMonitoring(liveMonitor, topFrames);
    renderEntryLog(liveMonitor);
    renderAIPredictions(timeline, footfall);
    renderGallery(topFrames);
    renderCCTV(topFrames);
    renderControls();
    renderParking(liveMonitor, footfall, traffic);
    renderBookings(footfall, attendance);
    renderSecurity(topFrames);
    renderFeedback();
    renderFAQ(summary, footfall, attendance, traffic);
    renderAbout(summary, footfall, attendance, traffic);
    renderProfile(summary, footfall, attendance, traffic);
}

function renderDashboardHome(summary, liveMonitor, footfall, attendance, traffic, topFrames) {
    dashboardIntro.textContent = `Basic view for ${footfall.selected_temple.replaceAll("_", " ")} using archive images, event attendance, and traffic flow datasets.`;
    dashboardCards.innerHTML = "";
    [
        ["Live people index", formatNumber(liveMonitor.latest_people_index)],
        ["Event attendees", formatNumber(attendance.total_attendees)],
        ["Avg. crowd score", summary.average_score.toFixed(1)],
        ["Traffic volume", formatNumber(traffic.total_vehicles)],
    ].forEach(([label, value]) => {
        const card = document.createElement("article");
        card.className = "summary-card";
        card.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
        dashboardCards.appendChild(card);
    });

    const heroFrame = topFrames[0];
    if (heroFrame) {
        dashboardHeroImage.src = `${API_BASE}/images/${heroFrame.id}`;
        dashboardHeroTitle.textContent = attendance.busiest_event
            ? `${attendance.busiest_event.event_name}`
            : "Live crowd snapshot";
        dashboardHeroCopy.textContent = `${heroFrame.crowd_label} scene • score ${heroFrame.crowd_score.toFixed(1)} • busiest traffic node ${traffic.busiest_junction || "not available"}`;
    }

    dashboardFrameList.innerHTML = "";
    topFrames.slice(0, 3).forEach((frame) => {
        const item = document.createElement("article");
        item.className = "stack-item";
        item.innerHTML = `
            <div>
                <strong>${frame.filename}</strong>
                <p>${frame.crowd_label} • People index ${frame.estimated_people_index}</p>
            </div>
            <span class="pill success">${String(frame.hour).padStart(2, "0")}:00</span>
        `;
        item.addEventListener("click", () => {
            state.page = "live-monitoring";
            globalThis.location.hash = state.page;
            liveImage.src = `${API_BASE}/images/${frame.id}`;
            liveScore.textContent = `${frame.crowd_score.toFixed(1)} score`;
            liveCaption.textContent = `${frame.filename} • people index ${frame.estimated_people_index}`;
            applyPage();
        });
        dashboardFrameList.appendChild(item);
    });

    dashboardHighlights.innerHTML = "";
    const peakTrafficHour = traffic.peak_hour === null
        ? "N/A"
        : `${String(traffic.peak_hour).padStart(2, "0")}:00`;
    const busiestEventText = attendance.busiest_event
        ? `${attendance.busiest_event.event_name} (${formatNumber(attendance.busiest_event.attendees)})`
        : "No event data";
    [
        `Dataset window: ${formatDate(summary.start_date)} to ${formatDate(summary.end_date)}`,
        `Peak monitoring hour: ${String(summary.peak_hour).padStart(2, "0")}:00 • Peak traffic hour: ${peakTrafficHour}`,
        `Busiest event: ${busiestEventText}`,
        `Current archive vs historical ratio: ${footfall.comparison.ratio_to_historical.toFixed(2)}x`,
    ].forEach((message) => {
        const item = document.createElement("article");
        item.className = "stack-item";
        item.innerHTML = `<div><strong>${message}</strong><p>Basic operational insight</p></div><span class="pill success">live</span>`;
        dashboardHighlights.appendChild(item);
    });

    dashboardLinks.innerHTML = "";
    [
        ["Live Monitoring", "Open the live frame and zone monitor", "live-monitoring"],
        ["AI Predictions", "Check comparisons and forecasts", "ai-predictions"],
        ["Smart Gates", "View gate occupancy and entry logs", "smart-gates"],
        ["Feedback", "Share missing features or issues", "feedback"],
    ].forEach(([label, description, page]) => {
        const item = document.createElement("button");
        item.className = "stack-item nav-card";
        item.type = "button";
        item.innerHTML = `<div><strong>${label}</strong><p>${description}</p></div><span class="pill">open</span>`;
        item.addEventListener("click", () => {
            state.page = page;
            globalThis.location.hash = page;
            applyPage();
        });
        dashboardLinks.appendChild(item);
    });
}

function populateTempleOptions(temples, selected) {
    const currentOptions = Array.from(templeSelect.options).map((option) => option.value);
    if (JSON.stringify(currentOptions) !== JSON.stringify(temples)) {
        templeSelect.innerHTML = "";
        temples.forEach((temple) => {
            const option = document.createElement("option");
            option.value = temple;
            option.textContent = temple.replaceAll("_", " ");
            templeSelect.appendChild(option);
        });
    }
    templeSelect.value = selected;
    state.settings.temple = selected;
    persistSettings();
}

function buildGateCards(liveMonitor, footfall) {
    const summary = footfall.forecast_summary;
    return [
        {
            name: "Main Entrance",
            code: "GATE-01",
            value: Math.round(liveMonitor.latest_people_index),
            capacity: 200,
            label: "Open",
            tone: "open",
            slot: "08:00 - 10:00",
        },
        {
            name: "North Gate",
            code: "GATE-02",
            value: Math.max(35, Math.round(summary.peak_p50 / 180)),
            capacity: 200,
            label: summary.surge_days > 0 ? "Almost Full" : "Open",
            tone: summary.surge_days > 0 ? "warning" : "open",
            slot: "10:00 - 12:00",
        },
        {
            name: "South Gate",
            code: "GATE-03",
            value: Math.max(24, Math.round(summary.baseline / 220)),
            capacity: 150,
            label: "Open",
            tone: "open",
            slot: "12:00 - 02:00",
        },
        {
            name: "VIP Entrance",
            code: "GATE-04",
            value: Math.max(12, Math.round(liveMonitor.rolling_average / 2.5)),
            capacity: 50,
            label: "Open",
            tone: "open",
            slot: "04:00 - 06:00",
        },
        {
            name: "East Gate",
            code: "GATE-05",
            value: 150,
            capacity: 150,
            label: "Blocked",
            tone: "blocked",
            slot: "06:00 - 08:00",
        },
    ];
}

function renderGateGrid(liveMonitor, footfall) {
    const cards = buildGateCards(liveMonitor, footfall);
    if (state.selectedGate >= cards.length) {
        state.selectedGate = 0;
    }

    gateGrid.innerHTML = "";
    cards.forEach((card, index) => {
        const ratio = Math.min(100, Math.round((card.value / card.capacity) * 100));
        const el = document.createElement("article");
        el.className = `gate-card${state.selectedGate === index ? " active" : ""}`;
        el.tabIndex = 0;
        el.innerHTML = `
            <h3>${card.name}</h3>
            <p class="gate-code">${card.code}</p>
            <div class="gate-count"><span>Occupancy</span><strong>${card.value}/${card.capacity}</strong></div>
            <div class="progress-track"><span class="progress-fill" style="width:${ratio}%"></span></div>
            <div class="gate-footer"><span class="status-pill ${card.tone}">${card.label}</span><span>${ratio}%</span></div>
        `;
        el.addEventListener("click", () => {
            state.selectedGate = index;
            renderGateGrid(liveMonitor, footfall);
        });
        el.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                state.selectedGate = index;
                renderGateGrid(liveMonitor, footfall);
            }
        });
        gateGrid.appendChild(el);
    });

    const selectedCard = cards[state.selectedGate];
    mainGateId.textContent = selectedCard.code;
    mainGateName.textContent = selectedCard.name;
    mainGateStatus.textContent = selectedCard.label.toLowerCase();
    mainGateSlot.textContent = selectedCard.slot;
    mainGateCapacity.textContent = `${selectedCard.capacity} persons`;
    mainGateOccupancy.textContent = `${selectedCard.value} / ${selectedCard.capacity}`;
}

function renderLiveMonitoring(liveMonitor, topFrames) {
    liveImage.src = `${API_BASE}/images/${liveMonitor.latest_image_id}`;
    liveScore.textContent = `${liveMonitor.latest_score.toFixed(1)} score`;
    liveCaption.textContent = `Latest people index ${liveMonitor.latest_people_index}`;
    liveNow.textContent = liveMonitor.latest_people_index;
    liveAverage.textContent = liveMonitor.rolling_average.toFixed(1);
    livePeak.textContent = liveMonitor.session_peak;

    const max = Math.max(...liveMonitor.series.map((item) => item.people_index), 1);
    liveChart.innerHTML = "";
    liveMonitor.series.forEach((point) => {
        const bar = document.createElement("div");
        bar.className = "line-bar";
        bar.style.height = `${Math.max(16, (point.people_index / max) * 180)}px`;
        bar.title = `${point.time} • index ${point.people_index}`;
        bar.dataset.label = point.time.slice(-5);
        liveChart.appendChild(bar);
    });

    monitoringZones.innerHTML = "";
    [
        ["Main Hall", "8 cameras", "active"],
        ["Entry Gate", "4 cameras", "active"],
        ["Parking Area", "6 cameras", "active"],
        ["Sacred Pathway", "5 cameras", "maintenance"],
        ["Exit Area", "3 cameras", "active"],
    ].forEach(([name, detail, status], index) => {
        const item = document.createElement("article");
        item.className = "stack-item";
        item.innerHTML = `
            <div>
                <strong>${name}</strong>
                <p>${detail}</p>
            </div>
            <span class="pill ${status === "maintenance" ? "warning" : "success"}">${status}</span>
        `;
        if (topFrames[index]) {
            item.insertAdjacentHTML("beforeend", `<span class="stack-meta">${topFrames[index].crowd_score.toFixed(1)} score</span>`);
        }
        monitoringZones.appendChild(item);
    });
}

function renderEntryLog(liveMonitor) {
    entryLogList.innerHTML = "";
    liveMonitor.series.slice(-6).reverse().forEach((point, index) => {
        const item = document.createElement("article");
        item.className = "entry-item";
        item.innerHTML = `
            <div>
                <span class="entry-badge">Entry Allowed</span>
                <strong>${Math.max(1, Math.round(point.people_index / 18) - index)} persons</strong>
            </div>
            <span class="entry-meta">${point.time.slice(-5)}:23</span>
        `;
        entryLogList.appendChild(item);
    });
}

function renderAIPredictions(timeline, footfall) {
    renderTimeline(timeline);
    renderForecast21(footfall);
    renderHourlyForecast(footfall.hourly_forecast);
    renderComparison(footfall.comparison);
}

function renderTimeline(timeline) {
    if (!timeline.length) {
        return;
    }
    const max = Math.max(...timeline.map((item) => item.avg_score), 1);
    timelineChart.innerHTML = "";
    timeline.forEach((item) => {
        const bar = document.createElement("div");
        bar.className = "chart-bar";
        bar.style.height = `${Math.max(18, (item.avg_score / max) * 220)}px`;
        bar.dataset.label = formatDate(item.date, { month: "short", day: "numeric" });
        bar.title = `${item.date}: ${item.avg_score.toFixed(1)}`;
        timelineChart.appendChild(bar);
    });
}

function renderForecast21(footfall) {
    const { forecast_summary: summary, history_last_60: history, forecast_21d: forecast } = footfall;
    forecastSummary.innerHTML = "";
    [
        ["Baseline", formatNumber(summary.baseline)],
        ["Peak p50", formatNumber(summary.peak_p50)],
        ["Peak p90", formatNumber(summary.peak_p90)],
        ["Surge days", summary.surge_days],
    ].forEach(([label, value]) => {
        const item = document.createElement("article");
        item.className = "summary-card";
        item.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
        forecastSummary.appendChild(item);
    });

    surgeAlert.classList.toggle("hidden", summary.surge_days === 0);
    if (summary.surge_days > 0) {
        surgeAlert.textContent = `Crowd surge alert: ${summary.surge_days} day(s) exceed the ${formatNumber(summary.surge_threshold)} threshold.`;
    }

    historyForecastChart.innerHTML = "";
    const combined = [
        ...history.slice(-21).map((item) => ({
            label: formatDate(item.date, { month: "short", day: "numeric" }),
            value: item.footfall,
            tone: "history",
        })),
        ...forecast.slice(0, 21).map((item) => ({
            label: formatDate(item.date, { month: "short", day: "numeric" }),
            value: item.pred_p50,
            tone: item.is_surge ? "surge" : "forecast",
        })),
    ];
    const max = Math.max(...combined.map((item) => item.value), 1);
    combined.forEach((item) => {
        const bar = document.createElement("div");
        bar.className = `wide-bar ${item.tone}`;
        bar.style.height = `${Math.max(20, (item.value / max) * 200)}px`;
        bar.title = `${item.label}: ${formatNumber(item.value)}`;
        bar.dataset.label = item.label;
        historyForecastChart.appendChild(bar);
    });

    forecastGrid.innerHTML = "";
    forecast.forEach((item) => {
        const card = forecastCardTemplate.content.firstElementChild.cloneNode(true);
        card.querySelector(".forecast-day").textContent = formatDate(item.date, { weekday: "short", day: "numeric", month: "short" });
        card.querySelector(".forecast-score").textContent = formatNumber(item.pred_p50);
        card.querySelector(".forecast-meta").textContent = `p10 ${formatNumber(item.pred_p10)} • p90 ${formatNumber(item.pred_p90)}`;
        const badge = card.querySelector(".forecast-badge");
        badge.textContent = item.is_surge ? "Surge" : "Stable";
        if (item.is_surge) {
            badge.classList.add("surge");
        }
        forecastGrid.appendChild(card);
    });
}

function renderHourlyForecast(hourlyForecast) {
    hourlySummary.innerHTML = "";
    [
        ["Days shown", hourlyForecast.days_shown],
        ["Tomorrow peak", hourlyForecast.peak_hour === null ? "--" : `${String(hourlyForecast.peak_hour).padStart(2, "0")}:00`],
        ["Peak count", formatNumber(hourlyForecast.peak_value)],
        ["Tomorrow total", formatNumber(hourlyForecast.tomorrow_total)],
    ].forEach(([label, value]) => {
        const item = document.createElement("article");
        item.className = "summary-card";
        item.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
        hourlySummary.appendChild(item);
    });

    forecastHeatmap.innerHTML = "";
    hourlyForecast.heatmap.forEach((row) => {
        const rowEl = document.createElement("div");
        rowEl.className = "heatmap-row";
        const label = document.createElement("div");
        label.className = "heatmap-label";
        label.textContent = row.label;
        rowEl.appendChild(label);
        const max = Math.max(...row.values, 1);
        row.values.forEach((value, hour) => {
            const cell = document.createElement("div");
            cell.className = "heatmap-cell";
            const opacity = Math.min(0.98, Math.max(0.08, value / max));
            cell.style.background = `linear-gradient(180deg, rgba(17,24,39,${opacity}), rgba(45,108,255,${opacity * 0.72}))`;
            cell.dataset.score = `${hour}:00 • ${formatNumber(value)}`;
            rowEl.appendChild(cell);
        });
        forecastHeatmap.appendChild(rowEl);
    });

    tomorrowProfile.innerHTML = "";
    if (!hourlyForecast.tomorrow_profile.length) {
        return;
    }
    tomorrowProfileCaption.textContent = "Tomorrow p50 hourly distribution";
    const max = Math.max(...hourlyForecast.tomorrow_profile.map((item) => item.pred_p90), 1);
    hourlyForecast.tomorrow_profile.forEach((item) => {
        const bar = document.createElement("div");
        bar.className = "profile-bar";
        bar.style.height = `${Math.max(12, (item.pred_p50 / max) * 180)}px`;
        bar.title = `${String(item.hour).padStart(2, "0")}:00 • ${formatNumber(item.pred_p50)}`;
        bar.dataset.label = `${String(item.hour).padStart(2, "0")}`;
        tomorrowProfile.appendChild(bar);
    });
}

function renderComparison(comparison) {
    if (!comparison) {
        return;
    }

    comparisonSummary.innerHTML = "";
    [
        ["Current avg index", formatNumber(comparison.current_avg_daily_index)],
        ["Historical avg visits", formatNumber(comparison.historical_avg_daily_visits)],
        ["Index ratio", `${comparison.ratio_to_historical.toFixed(2)}x`],
        ["Current peak hour", `${String(comparison.current_peak_hour).padStart(2, "0")}:00`],
    ].forEach(([label, value]) => {
        const item = document.createElement("article");
        item.className = "summary-card";
        item.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
        comparisonSummary.appendChild(item);
    });

    comparisonCopy.textContent = `${comparison.insight} ${comparison.note}`;
    comparisonWeekdays.innerHTML = "";
    comparison.weekday_comparison.forEach((item) => {
        const deltaTone = item.delta_percent >= 0 ? "success" : "warning";
        const row = document.createElement("article");
        row.className = "stack-item";
        row.innerHTML = `
            <div>
                <strong>${item.weekday}</strong>
                <p>Current index ${formatNumber(item.current_index)} • Historical ${formatNumber(item.historical_visits)}</p>
            </div>
            <span class="pill ${deltaTone}">${item.delta_percent >= 0 ? "+" : ""}${item.delta_percent.toFixed(1)}%</span>
        `;
        comparisonWeekdays.appendChild(row);
    });
}

function renderGallery(items) {
    galleryGrid.innerHTML = "";
    if (!state.settings.showGallery) {
        return;
    }
    items.forEach((item) => {
        const card = document.createElement("article");
        card.className = "gallery-card";
        card.innerHTML = `
            <img src="${API_BASE}/images/${item.id}" alt="${item.filename}">
            <div class="gallery-body">
                <h4>${item.crowd_label} density scene</h4>
                <p>${formatDate(item.date, { month: "short", day: "numeric" })} • ${String(item.hour).padStart(2, "0")}:00</p>
                ${state.settings.showImageLabels ? `<p>Score ${item.crowd_score.toFixed(1)} • People index ${item.estimated_people_index}</p><p>${item.width}x${item.height}</p>` : ""}
            </div>
        `;
        card.addEventListener("click", () => {
            state.page = "live-monitoring";
            globalThis.location.hash = state.page;
            liveImage.src = `${API_BASE}/images/${item.id}`;
            liveScore.textContent = `${item.crowd_score.toFixed(1)} score`;
            liveCaption.textContent = `${item.filename} • people index ${item.estimated_people_index}`;
            applyPage();
        });
        galleryGrid.appendChild(card);
    });
}

function renderCCTV(topFrames) {
    cctvNetworkList.innerHTML = "";
    [["Main Hall", "3 Cameras Active"], ["Entry Gate", "4 Cameras Active"], ["Parking Area", "5 Cameras Active"], ["Sacred Pathway", "6 Cameras Active"], ["Exit Area", "7 Cameras Active"]].forEach(([name, detail], index) => {
        const item = document.createElement("article");
        item.className = "stack-item";
        item.innerHTML = `<div><strong>${name}</strong><p>${detail}</p></div><span class="pill success">online</span>`;
        item.addEventListener("click", () => {
            const frame = topFrames[index] || topFrames[0];
            if (!frame) {
                return;
            }
            state.page = "live-monitoring";
            globalThis.location.hash = state.page;
            liveImage.src = `${API_BASE}/images/${frame.id}`;
            liveScore.textContent = `${frame.crowd_score.toFixed(1)} score`;
            liveCaption.textContent = `${name} linked frame • people index ${frame.estimated_people_index}`;
            applyPage();
        });
        cctvNetworkList.appendChild(item);
    });
}

function renderControls() {
    const messages = [
        "Temple queue is currently 15 minutes. Please be patient.",
        "Parking Zone B is now full. Please proceed to Zone C.",
        "Special darshan timing today: 6 PM to 8 PM.",
        "Lost and found counter is near the main entrance.",
        "Emergency assembly point is at the main parking area.",
    ];

    quickMessages.innerHTML = "";
    messages.forEach((message) => {
        const item = document.createElement("button");
        item.className = "quick-message";
        item.type = "button";
        item.textContent = message;
        item.addEventListener("click", () => {
            announcementMessage.value = message;
            broadcastStatus.textContent = `Quick message loaded in ${state.selectedLanguage}.`;
        });
        quickMessages.appendChild(item);
    });

    if (state.broadcastHistory.length) {
        state.broadcastHistory.slice(0, 2).forEach((entry) => {
            const info = document.createElement("article");
            info.className = "stack-item";
            info.innerHTML = `<div><strong>Recent broadcast</strong><p>${entry}</p></div><span class="pill success">sent</span>`;
            quickMessages.appendChild(info);
        });
    }

    paZoneList.innerHTML = "";
    [["Main Hall", "8 speakers", "active"], ["Entry Gate", "4 speakers", "active"], ["Parking Area", "6 speakers", "active"], ["Sacred Pathway", "5 speakers", "maintenance"], ["Exit Area", "3 speakers", "active"]].forEach(([name, detail, status]) => {
        const item = document.createElement("article");
        item.className = "stack-item";
        item.innerHTML = `<div><strong>${name}</strong><p>${detail}</p></div><span class="pill ${status === "maintenance" ? "warning" : "success"}">${status}</span>`;
        item.addEventListener("click", () => {
            broadcastStatus.textContent = `${name} selected for the next announcement.`;
        });
        paZoneList.appendChild(item);
    });
}

function renderParking(liveMonitor, footfall, traffic) {
    const totalCapacity = traffic.junctions.reduce((sum, item) => sum + item.capacity, 0);
    const occupied = traffic.junctions.reduce((sum, item) => sum + item.vehicles, 0);
    const available = Math.max(0, totalCapacity - occupied);
    parkingMetrics.innerHTML = "";
    [
        ["Available Spots", available],
        ["Occupied", occupied],
        ["Avg. Search Time", `${Math.max(4, Math.round((traffic.peak_hour_volume || 0) / 800))} min`],
        ["Hourly Rate", "Rs 50"],
    ].forEach(([label, value]) => {
        const item = document.createElement("article");
        item.className = "summary-card";
        item.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
        parkingMetrics.appendChild(item);
    });

    parkingGrid.innerHTML = "";
    traffic.junctions.forEach(({ zone, junction, vehicles, capacity }) => {
        const ratio = Math.round((vehicles / capacity) * 100);
        const item = document.createElement("article");
        item.className = "gate-card";
        item.innerHTML = `
            <h3>${zone}</h3>
            <p class="gate-code">${junction}</p>
            <div class="gate-count"><span>${capacity - vehicles} available</span><strong>${vehicles}/${capacity}</strong></div>
            <div class="progress-track"><span class="progress-fill parking" style="width:${ratio}%"></span></div>
        `;
        item.addEventListener("click", () => {
            state.parkingDirectionsOpen = true;
            parkingDirectionsButton.textContent = "Hide Directions";
            shuttleStatus.innerHTML = "";
            [
                `${zone} selected for navigation.`,
                `Walk to shuttle bay ${Math.max(1, capacity - vehicles > 20 ? 2 : 4)} and follow lane markers.`,
                `Traffic sync uses live archive index ${formatNumber(liveMonitor.latest_people_index)}.`,
            ].forEach((message) => {
                const card = document.createElement("article");
                card.className = "stack-item";
                card.innerHTML = `<div><strong>${message}</strong><p>${junction}</p></div><span class="pill success">route</span>`;
                shuttleStatus.appendChild(card);
            });
        });
        parkingGrid.appendChild(item);
    });

    shuttleStatus.innerHTML = "";
    const peakTrafficLabel = traffic.peak_hour === null
        ? "N/A"
        : `${String(traffic.peak_hour).padStart(2, "0")}:00`;
    const parkingMessages = state.parkingDirectionsOpen
        ? [
            "Route guidance enabled for incoming vehicles.",
            "Use Zone C overflow lane if Zone B crosses 85%.",
            `Queue pressure synced with ${footfall.selected_temple.replaceAll("_", " ")}.`,
        ]
        : [
            "Shuttle en route to Zone B",
            `Peak traffic hour: ${peakTrafficLabel}`,
            `Queue pressure synced with ${footfall.selected_temple.replaceAll("_", " ")}`,
        ];

    parkingMessages.forEach((message) => {
        const item = document.createElement("article");
        item.className = "stack-item";
        item.innerHTML = `<div><strong>${message}</strong><p>Temple shuttle service</p></div><span class="pill success">ok</span>`;
        shuttleStatus.appendChild(item);
    });
}

function renderBookings(footfall, attendance) {
    bookingSlotGrid.innerHTML = "";
    const slots = attendance.time_slots.length
        ? attendance.time_slots
        : footfall.forecast_21d.slice(0, 6).map((item, index) => {
            const capacity = [200, 200, 200, 150, 200, 200][index];
            const booked = Math.min(capacity, Math.max(20, Math.round(item.pred_p50 / 160)));
            return {
                label: ["06:00 - 08:00", "08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "16:00 - 18:00", "18:00 - 20:00"][index],
                booked,
                capacity,
            };
        });

    slots.forEach((slot) => {
        const ratio = Math.round((slot.booked / slot.capacity) * 100);
        const item = document.createElement("article");
        item.className = "gate-card";
        item.innerHTML = `
            <h3>${slot.label}</h3>
            <div class="gate-count"><span>Booked</span><strong>${slot.booked}/${slot.capacity}</strong></div>
            <div class="progress-track"><span class="progress-fill booking" style="width:${ratio}%"></span></div>
            <div class="gate-footer"><span class="status-pill ${ratio > 90 ? "warning" : ""}">${ratio > 90 ? "Almost Full" : "Available"}</span><span>${slot.capacity - slot.booked} slots remaining</span></div>
        `;
        item.addEventListener("click", () => {
            bookingSearch.value = slot.label;
            state.bookingQuery = slot.label.toLowerCase();
            renderBookings(footfall);
        });
        bookingSlotGrid.appendChild(item);
    });

    const bookings = attendance.recent_attendees.map((item, index) => {
        const eventDate = new Date(item.date_time.replace(" ", "T"));
        const slot = `${String(eventDate.getHours()).padStart(2, "0")}:00 - ${String((eventDate.getHours() + 2) % 24).padStart(2, "0")}:00`;
        return {
            name: item.attendee_name,
            id: `EV${item.event_id}-${index + 1}`,
            slot,
            people: "1 person",
            gate: `GATE-0${(index % 5) + 1}`,
            status: ["Confirmed", "Pending", "Priority"][index % 3],
            phone: item.attendee_phone_number,
            eventName: item.event_name,
        };
    });

    const filtered = bookings.filter((item) => {
        const queryMatch = !state.bookingQuery || [item.name, item.id, item.phone, item.slot].join(" ").toLowerCase().includes(state.bookingQuery);
        const statusMatch = state.selectedBookingStatus === "All Status" || item.status === state.selectedBookingStatus;
        return queryMatch && statusMatch;
    });

    bookingList.innerHTML = "";
    filtered.forEach((item) => {
        const card = document.createElement("article");
        card.className = "booking-item";
        card.innerHTML = `
            <div><strong>${item.name}</strong><p>ID: ${item.id} • ${item.phone}</p></div>
            <div><strong>${item.slot}</strong><p>${item.people}</p></div>
            <div><strong>${item.status}</strong><p>${item.gate} • ${item.eventName}</p></div>
        `;
        card.addEventListener("click", () => {
            bookingSearch.value = item.name;
            state.bookingQuery = item.name.toLowerCase();
            renderBookings(footfall);
        });
        bookingList.appendChild(card);
    });

    if (!filtered.length) {
        const empty = document.createElement("article");
        empty.className = "booking-item";
        empty.innerHTML = "<div><strong>No matching bookings</strong><p>Adjust search or status filter</p></div>";
        bookingList.appendChild(empty);
    }
}

function renderSecurity(topFrames) {
    securityNetworkList.innerHTML = "";
    [["Main Hall", "3 Cameras Active"], ["Entry Gate", "4 Cameras Active"], ["Parking Area", "5 Cameras Active"], ["Sacred Pathway", "6 Cameras Active"], ["Exit Area", "7 Cameras Active"]].forEach(([name, detail], index) => {
        const item = document.createElement("article");
        item.className = "stack-item";
        item.innerHTML = `<div><strong>${name}</strong><p>${detail}</p></div><span class="pill success">active</span>`;
        item.addEventListener("click", () => {
            const frame = topFrames[index] || topFrames[0];
            if (!frame) {
                return;
            }
            state.page = "cctv-feeds";
            globalThis.location.hash = state.page;
            applyPage();
            if (state.settings.showGallery) {
                liveCaption.textContent = `${name} security checkpoint selected`;
            }
        });
        securityNetworkList.appendChild(item);
    });

    securityModelList.innerHTML = "";
    [["People Counting", "Accuracy: 98.2%", "Active"], ["Baggage Detection", "Accuracy: 95.7%", "Active"], ["Crowd Analysis", "Accuracy: 97.1%", "Active"], ["Behavior Analytics", "Accuracy: 89.3%", "Training"]].forEach(([name, detail, status]) => {
        const item = document.createElement("article");
        item.className = "stack-item";
        item.innerHTML = `<div><strong>${name}</strong><p>${detail}</p></div><span class="pill ${status === "Training" ? "warning" : "success"}">${status}</span>`;
        item.addEventListener("click", () => {
            surgeAlert.classList.remove("hidden");
            surgeAlert.textContent = `${name} selected. ${detail}.`;
            state.page = "ai-predictions";
            globalThis.location.hash = state.page;
            applyPage();
        });
        securityModelList.appendChild(item);
    });
}

function renderFeedback() {
    feedbackHistory.innerHTML = "";
    if (!state.feedbackHistory.length) {
        feedbackStatus.textContent = "Feedback center ready.";
        return;
    }
    const latest = state.feedbackHistory[0];
    feedbackStatus.textContent = `${state.feedbackHistory.length} feedback item(s) recorded. Latest received ${formatDate(latest.createdAt, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}.`;
    state.feedbackHistory.slice(0, 3).forEach((entry) => {
        const item = document.createElement("article");
        item.className = "stack-item";
        item.innerHTML = `
            <div>
                <strong>${entry.name || "Anonymous visitor"}</strong>
                <p>${entry.email || "No email provided"} • ${entry.message}</p>
            </div>
            <span class="pill success">${formatDate(entry.createdAt, { day: "numeric", month: "short" })}</span>
        `;
        feedbackHistory.appendChild(item);
    });
}

function renderFAQ(summary, footfall, attendance, traffic) {
    faqList.innerHTML = "";
    [
        ["What is the current dataset?", `The app reads image frames from ${summary.start_date} to ${summary.end_date} and converts them into a people index.`],
        ["Which extra datasets are used?", `Event attendance contributes ${formatNumber(attendance.total_attendees)} registrations, and traffic contributes ${formatNumber(traffic.total_vehicles)} vehicle observations.`],
        ["How is comparison shown?", "Historical visits come from the reference footfall tables, while the current archive is estimated from image crowd intensity."],
        ["How do I change theme?", "Use the top-right Settings menu and switch between Light, Dark, or System theme."],
        ["How do I filter bookings?", "Open Darshan Bookings and use the search box or status dropdown."],
        ["What is the basic dashboard for?", `It gives a simple summary view before moving into detailed screens like AI Predictions or Smart Gates for ${footfall.selected_temple.replaceAll("_", " ")}.`],
        ["Where are global tools located?", "Feedback, FAQ, About, Profile, theme controls, and display options are all available from the top-right menu."],
        ["Does the feedback form save submissions?", "Yes. This demo stores feedback in local storage so the entries remain available on refresh."],
    ].forEach(([question, answer], index) => {
        const item = document.createElement("article");
        item.className = `faq-entry${index === 0 ? " open" : ""}`;
        item.innerHTML = `
            <button class="faq-question" type="button" aria-expanded="${index === 0 ? "true" : "false"}">${question}</button>
            <div class="faq-answer">${answer}</div>
        `;
        item.querySelector(".faq-question").addEventListener("click", () => {
            const isOpen = item.classList.toggle("open");
            item.querySelector(".faq-question").setAttribute("aria-expanded", String(isOpen));
        });
        faqList.appendChild(item);
    });
}

function renderAbout(summary, footfall, attendance, traffic) {
    aboutList.innerHTML = "";
    [
        ["Platform", "SmartDarshan operational dashboard for temple crowd, gate, booking, and parking views."],
        ["Current source", `archive(1).zip image dataset with ${summary.total_images} processed frames.`],
        ["Attendance source", `${attendance.source_path || "Not available"} with ${formatNumber(attendance.unique_events)} events and ${formatNumber(attendance.total_attendees)} attendees.`],
        ["Traffic source", `${traffic.source_path || "Not available"} with busiest node ${traffic.busiest_junction || "N/A"} and ${formatNumber(traffic.total_vehicles)} vehicles.`],
        ["Historical source", `Reference footfall tables for ${footfall.selected_temple.replaceAll("_", " ")} used for comparison and prediction.`],
        ["Core features", "Dashboard, Live Monitoring, CCTV, AI Predictions, Controls, Parking, Smart Gates, Bookings, Security, Feedback, FAQ, and About."],
    ].forEach(([label, value]) => {
        const item = document.createElement("article");
        item.className = "stack-item";
        item.innerHTML = `<div><strong>${label}</strong><p>${value}</p></div><span class="pill success">active</span>`;
        aboutList.appendChild(item);
    });
}

function renderProfile(summary, footfall, attendance, traffic) {
    profileList.innerHTML = "";
    [
        ["Account", "Temple Operations Admin"],
        ["Preferred theme", state.settings.theme.charAt(0).toUpperCase() + state.settings.theme.slice(1)],
        ["Active dataset", `${summary.total_images} archive frames processed`],
        ["Attendance scope", `${formatNumber(attendance.total_attendees)} attendees across ${formatNumber(attendance.unique_events)} events`],
        ["Traffic scope", `${formatNumber(traffic.total_vehicles)} vehicles across ${traffic.junctions.length} zones`],
        ["Primary site", footfall.selected_temple.replaceAll("_", " ")],
    ].forEach(([label, value]) => {
        const item = document.createElement("article");
        item.className = "stack-item";
        item.innerHTML = `<div><strong>${label}</strong><p>${value}</p></div><span class="pill success">ok</span>`;
        profileList.appendChild(item);
    });
}

function applySettings() {
    let resolvedTheme = state.settings.theme;
    if (resolvedTheme === "system") {
        resolvedTheme = globalThis.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.body.classList.toggle("dark-theme", resolvedTheme === "dark");
    document.body.classList.toggle("high-contrast", state.settings.highContrast);
    document.body.classList.toggle("large-text", state.settings.largeText);
    document.body.classList.toggle("reduce-motion", state.settings.reduceMotion);
    document.body.classList.toggle("compact-layout", state.settings.compact);
}

function updateDaysLabel() {
    daysRangeValue.textContent = `${daysRange.value} days`;
}

function loadSettings() {
    try {
        return {
            temple: "",
            days: 7,
            highContrast: false,
            largeText: false,
            reduceMotion: false,
            compact: false,
            showGallery: true,
            showImageLabels: true,
            theme: "system",
            ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"),
        };
    } catch {
        return {
            temple: "",
            days: 7,
            highContrast: false,
            largeText: false,
            reduceMotion: false,
            compact: false,
            showGallery: true,
            showImageLabels: true,
            theme: "system",
        };
    }
}

function loadFeedbackHistory() {
    try {
        return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "[]");
    } catch {
        return [];
    }
}

function persistFeedbackHistory() {
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(state.feedbackHistory));
}

function persistSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

const DEFAULT_DATE_OPTIONS = { year: "numeric", month: "short", day: "numeric" };

function formatDate(value, options = DEFAULT_DATE_OPTIONS) {
    return new Intl.DateTimeFormat("en-IN", options).format(new Date(value));
}

function formatNumber(value) {
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);
}
