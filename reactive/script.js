// =====================================================
// CONFIGURATION
// =====================================================
const DEFAULT_WISP = "wss://wisp.rhw.one/wisp/";
const WISP_SERVERS = [
    { name: "Anura's Wisp", url: "wss://anura.pro/" },
    { name: "Rhw's Wisp", url: "wss://wisp.rhw.one/wisp/" } // broken now i think
];

if (!localStorage.getItem("proxServer")) {
    localStorage.setItem("proxServer", DEFAULT_WISP);
}

// =====================================================
// BROWSER STATE
// =====================================================
if (typeof BareMux === 'undefined') {
    BareMux = { BareMuxConnection: class { constructor() { } setTransport() { } } };
}

let scramjet;
let tabs = [];
let activeTabId = null;
let nextTabId = 1;

// =====================================================
// INITIALIZATION
// =====================================================
document.addEventListener('DOMContentLoaded', async function () {
    let basePath = location.pathname.replace(/[^/]*$/, '');
    if (!basePath.endsWith('/')) basePath += '/';
    const { ScramjetController } = $scramjetLoadController();

    scramjet = new ScramjetController({
        prefix: basePath + "scramjet/",
        files: {
            wasm: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.wasm.wasm",
            all: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.all.js",
            sync: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.sync.js"
        }
    });

    await scramjet.init();

    if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.register(basePath + 'sw.js', { scope: basePath });
        await navigator.serviceWorker.ready;
        const wispUrl = localStorage.getItem("proxServer") || DEFAULT_WISP;

        // Try to send to both active registration and controller to be safe
        const sw = reg.active || navigator.serviceWorker.controller;
        if (sw) {
            console.log("Sending config to SW:", wispUrl);
            sw.postMessage({ type: "config", wispurl: wispUrl });
        }

        // Ensure controller also gets it if different
        if (navigator.serviceWorker.controller && navigator.serviceWorker.controller !== sw) {
            navigator.serviceWorker.controller.postMessage({ type: "config", wispurl: wispUrl });
        }

        // Force update to get new SW code if available
        reg.update();

        const connection = new BareMux.BareMuxConnection(basePath + "bareworker.js");
        await connection.setTransport("https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport@2.1.28/dist/index.mjs", [{ wisp: wispUrl }]);
    }

    await initializeBrowser();
});

// =====================================================
// BROWSER UI
// =====================================================
async function initializeBrowser() {
    const root = document.getElementById("app");
    root.innerHTML = `
        <div class="browser-container">
            <div class="flex tabs" id="tabs-container"></div>
            <div class="flex nav">
                <button id="back-btn" title="Back"><i class="fa-solid fa-chevron-left"></i></button>
                <button id="fwd-btn" title="Forward"><i class="fa-solid fa-chevron-right"></i></button>
                <button id="reload-btn" title="Reload"><i class="fa-solid fa-rotate-right"></i></button>
                <div class="address-wrapper">
                    <input class="bar" id="address-bar" autocomplete="off" placeholder="Search or enter URL">
                    <button id="home-btn-nav" title="Home"><i class="fa-solid fa-house"></i></button>
                </div>
                <button id="devtools-btn" title="DevTools"><i class="fa-solid fa-code"></i></button>
                <button id="wisp-settings-btn" title="Proxy Settings"><i class="fa-solid fa-gear"></i></button>
            </div>
            <div class="loading-bar-container"><div class="loading-bar" id="loading-bar"></div></div>
            <div class="iframe-container" id="iframe-container">
                <div id="loading" class="message-container" style="display: none;">
                    <div class="message-content">
                        <div class="spinner"></div>
                        <h1 id="loading-title">Connecting</h1>
                        <p id="loading-url">Initializing proxy...</p>
                        <button id="skip-btn">Skip</button>
                    </div>
                </div>
                <div id="error" class="message-container" style="display: none;">
                    <div class="message-content">
                        <h1>Connection Error</h1>
                        <p id="error-message">An error occurred.</p>
                    </div>
                </div>
            </div>
        </div>`;

    document.getElementById('back-btn').onclick = () => getActiveTab()?.frame.back();
    document.getElementById('fwd-btn').onclick = () => getActiveTab()?.frame.forward();
    document.getElementById('reload-btn').onclick = () => getActiveTab()?.frame.reload();
    document.getElementById('home-btn-nav').onclick = () => window.location.href = '../index.html';
    document.getElementById('devtools-btn').onclick = toggleDevTools;
    document.getElementById('wisp-settings-btn').onclick = openSettings;

    // Skip button logic
    const skipBtn = document.getElementById('skip-btn');
    if (skipBtn) {
        skipBtn.onclick = () => {
            const tab = getActiveTab();
            if (tab) {
                tab.loading = false;
                showIframeLoading(false);
            }
        };
    }

    const addrBar = document.getElementById('address-bar');
    addrBar.onkeyup = (e) => { if (e.key === 'Enter') handleSubmit(); };
    addrBar.onfocus = () => addrBar.select();

    window.addEventListener('message', (e) => {
        if (e.data?.type === 'navigate') handleSubmit(e.data.url);
    });

    createTab(true);
    checkHashParameters();
}

// =====================================================
// TAB MANAGEMENT
// =====================================================
function createTab(makeActive = true) {
    const frame = scramjet.createFrame();
    const tab = {
        id: nextTabId++,
        title: "New Tab",
        url: "NT.html",
        frame: frame,
        loading: false,
        favicon: null,
        skipTimeout: null
    };

    frame.frame.src = "NT.html";

    frame.addEventListener("urlchange", (e) => {
        tab.url = e.url;
        tab.loading = true;

        // Show loading screen immediately if this is the active tab
        if (tab.id === activeTabId) {
            showIframeLoading(true, tab.url);
        }

        try {
            const urlObj = new URL(e.url);
            tab.title = urlObj.hostname;
            tab.favicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
        } catch {
            tab.title = "Browsing";
            tab.favicon = null;
        }
        updateTabsUI();
        updateAddressBar();
        updateLoadingBar(tab, 10);

        // Set timeout to show skip button
        if (tab.skipTimeout) clearTimeout(tab.skipTimeout);
        tab.skipTimeout = setTimeout(() => {
            if (tab.loading && tab.id === activeTabId) {
                const skipBtn = document.getElementById('skip-btn');
                if (skipBtn) skipBtn.style.display = 'inline-block';
            }
        }, 1000); // 1 second before skip button appears
    });

    frame.frame.addEventListener('load', () => {
        tab.loading = false;
        if (tab.skipTimeout) clearTimeout(tab.skipTimeout);

        if (tab.id === activeTabId) {
            showIframeLoading(false);
        }

        try {
            const title = frame.frame.contentWindow.document.title;
            if (title) tab.title = title;
        } catch { }

        if (frame.frame.contentWindow.location.href.includes('NT.html')) {
            tab.title = "New Tab";
            tab.url = "";
            tab.favicon = null;
        }

        updateTabsUI();
        updateAddressBar();
        updateLoadingBar(tab, 100);
    });

    tabs.push(tab);
    document.getElementById("iframe-container").appendChild(frame.frame);
    if (makeActive) switchTab(tab.id);
    return tab;
}

function showIframeLoading(show, url = '') {
    const loader = document.getElementById("loading");
    const title = document.getElementById("loading-title");
    const urlText = document.getElementById("loading-url");
    const skipBtn = document.getElementById("skip-btn");

    if (loader) {
        loader.style.display = show ? "flex" : "none";
        const tab = getActiveTab();
        if (tab) {
            tab.frame.frame.classList.toggle('loading', show);
        }
        if (show) {
            title.textContent = "Connecting";
            urlText.textContent = url || "Loading content...";
            skipBtn.style.display = 'none'; // Reset skip button visibility
        }
    }
}

function switchTab(tabId) {
    activeTabId = tabId;
    const tab = getActiveTab();

    tabs.forEach(t => t.frame.frame.classList.toggle("hidden", t.id !== tabId));

    // Update loading state for accessibiltiy
    if (tab) {
        showIframeLoading(tab.loading, tab.url);
        // If this tab has been loading for > 5s, show skip button immediately
        // Note: simplified logic, ideally we track start time
        const skipBtn = document.getElementById('skip-btn');
        if (tab.loading && skipBtn) {
            // If we switched to a loading tab, we might want to check if the timeout passed, 
            // but for now we'll just rely on the existing timeout or hide it initially.
            // A better approach would be to track 'showSkip' state on the tab.
            // For this implementation, we reset it to hidden to avoid immediate pop-in unless timeout fires.
            // If timeout already fired for this tab, it might be tricky without storing state.
            // Let's stick to the timeout firing or re-firing.
        }
    }

    updateTabsUI();
    updateAddressBar();
}

function closeTab(tabId) {
    const idx = tabs.findIndex(t => t.id === tabId);
    if (idx === -1) return;

    if (tabs[idx].skipTimeout) clearTimeout(tabs[idx].skipTimeout);
    tabs[idx].frame.frame.remove();
    tabs.splice(idx, 1);

    if (activeTabId === tabId) {
        if (tabs.length > 0) switchTab(tabs[Math.max(0, idx - 1)].id);
        else createTab(true);
    } else {
        updateTabsUI();
    }
}

function updateTabsUI() {
    const container = document.getElementById("tabs-container");
    container.innerHTML = "";

    tabs.forEach(tab => {
        const el = document.createElement("div");
        el.className = `tab ${tab.id === activeTabId ? "active" : ""}`;

        let iconHtml;
        if (tab.loading) {
            iconHtml = `<div class="tab-spinner"></div>`;
        } else if (tab.favicon) {
            iconHtml = `<img src="${tab.favicon}" class="tab-favicon" onerror="this.style.display='none'">`;
        } else {
            iconHtml = ``;
        }

        el.innerHTML = `
            ${iconHtml}
            <span class="tab-title">${tab.title}</span>
            <span class="tab-close">&times;</span>
        `;

        el.onclick = () => switchTab(tab.id);
        el.querySelector(".tab-close").onclick = (e) => { e.stopPropagation(); closeTab(tab.id); };
        container.appendChild(el);
    });

    const newBtn = document.createElement("button");
    newBtn.className = "new-tab";
    newBtn.innerHTML = "<i class='fa-solid fa-plus'></i>";
    newBtn.onclick = () => createTab(true);
    container.appendChild(newBtn);
}

function updateAddressBar() {
    const bar = document.getElementById("address-bar");
    const tab = getActiveTab();
    if (bar && tab) {
        bar.value = (tab.url && !tab.url.includes("NT.html")) ? tab.url : "";
    }
}

function getActiveTab() { return tabs.find(t => t.id === activeTabId); }

function handleSubmit(url) {
    const tab = getActiveTab();
    let input = url || document.getElementById("address-bar").value.trim();
    if (!input) return;

    if (!input.startsWith('http')) {
        if (input.includes('.') && !input.includes(' ')) input = 'https://' + input;
        else input = 'https://search.brave.com/search?q=' + encodeURIComponent(input);
    }
    tab.frame.go(input);
}

function updateLoadingBar(tab, percent) {
    if (tab.id !== activeTabId) return;
    const bar = document.getElementById("loading-bar");
    bar.style.width = percent + "%";
    bar.style.opacity = percent === 100 ? "0" : "1";
    if (percent === 100) setTimeout(() => { bar.style.width = "0%"; }, 200);
}

// =====================================================
// SETTINGS & WISP
// =====================================================
function openSettings() {
    window.location.href = '/s/settings.html#wisp';
}

function getStoredWisps() {
    try { return JSON.parse(localStorage.getItem('customWisps') || '[]'); }
    catch { return []; }
}

function renderServerList() {
    const list = document.getElementById('server-list');
    list.innerHTML = '';

    const currentUrl = localStorage.getItem('proxServer') || DEFAULT_WISP;
    const allWisps = [...WISP_SERVERS, ...getStoredWisps()];

    allWisps.forEach((server, index) => {
        const isActive = server.url === currentUrl;
        const isCustom = index >= WISP_SERVERS.length;

        const item = document.createElement('div');
        item.className = `wisp-option ${isActive ? 'active' : ''}`;

        const deleteBtn = isCustom
            ? `<button class="delete-wisp-btn" onclick="event.stopPropagation(); deleteCustomWisp('${server.url}')"><i class="fa-solid fa-trash"></i></button>`
            : '';

        item.innerHTML = `
            <div class="wisp-option-header">
                <div class="wisp-option-name">
                    ${server.name}
                    ${isActive ? '<i class="fa-solid fa-check" style="margin-left:8px; font-size: 0.7em; color: var(--accent);"></i>' : ''}
                </div>
                <div class="server-status">
                    <span class="ping-text">...</span>
                    <div class="status-indicator"></div>
                    ${deleteBtn}
                </div>
            </div>
            <div class="wisp-option-url">${server.url}</div>
        `;

        item.onclick = () => setWisp(server.url);
        list.appendChild(item);

        checkServerHealth(server.url, item);
    });
}

function saveCustomWisp() {
    const input = document.getElementById('custom-wisp-input');
    const url = input.value.trim();

    if (!url) return;
    if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
        if (typeof Notify !== 'undefined') Notify.error('Invalid URL', 'URL must start with wss:// or ws://');
        else alert("URL must start with wss:// or ws://");
        return;
    }

    const customWisps = getStoredWisps();
    if (customWisps.some(w => w.url === url) || WISP_SERVERS.some(w => w.url === url)) {
        if (typeof Notify !== 'undefined') Notify.warning('Already Exists', 'This server is already in the list.');
        else alert("This server is already in the list.");
        return;
    }

    customWisps.push({ name: `Custom ${customWisps.length + 1}`, url });
    localStorage.setItem('customWisps', JSON.stringify(customWisps));

    if (typeof Notify !== 'undefined') Notify.success('Server Added', 'Custom server has been added.');

    input.value = '';
    renderServerList();
}

window.deleteCustomWisp = function (urlToDelete) {
    if (!confirm("Remove this server?")) return;

    let customWisps = getStoredWisps().filter(w => w.url !== urlToDelete);
    localStorage.setItem('customWisps', JSON.stringify(customWisps));

    if (localStorage.getItem('proxServer') === urlToDelete) {
        setWisp(DEFAULT_WISP);
    } else {
        renderServerList();
    }
};

async function checkServerHealth(url, element) {
    const dot = element.querySelector('.status-indicator');
    const text = element.querySelector('.ping-text');
    const start = Date.now();

    try {
        const socket = new WebSocket(url);

        const timeout = setTimeout(() => {
            if (socket.readyState !== WebSocket.OPEN) {
                socket.close();
                markOffline();
            }
        }, 3000);

        socket.onopen = () => {
            clearTimeout(timeout);
            const latency = Date.now() - start;
            socket.close();

            dot.classList.add('status-success');
            text.textContent = `${latency}ms`;
        };

        socket.onerror = () => { clearTimeout(timeout); markOffline(); };

    } catch { markOffline(); }

    function markOffline() {
        dot.classList.add('status-error');
        text.textContent = "Offline";

        // Notify if this is the currently selected wisp
        const currentWisp = localStorage.getItem('proxServer') || DEFAULT_WISP;
        if (url === currentWisp && typeof Notify !== 'undefined') {
            Notify.error('Connection Failed', 'Current proxy server is offline. Try switching servers.');
        }
    }
}

function setWisp(url) {
    const oldUrl = localStorage.getItem('proxServer');
    localStorage.setItem('proxServer', url);

    // Show notification before reload
    if (typeof Notify !== 'undefined' && oldUrl !== url) {
        const serverName = [...WISP_SERVERS, ...getStoredWisps()].find(s => s.url === url)?.name || 'Custom Server';
        Notify.success('Proxy Changed', `Switching to ${serverName}...`);
    }

    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'config', wispurl: url });
    }

    // Small delay to show notification
    setTimeout(() => location.reload(), 600);
}

// =====================================================
// UTILITIES
// =====================================================
function toggleDevTools() {
    const win = getActiveTab()?.frame.frame.contentWindow;
    if (!win) return;
    if (win.eruda) {
        win.eruda.show();
        return;
    }
    const script = win.document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/eruda";
    script.onload = () => { win.eruda.init(); win.eruda.show(); };
    win.document.body.appendChild(script);
}

async function checkHashParameters() {
    if (window.location.hash) {
        const hash = decodeURIComponent(window.location.hash.substring(1));
        if (hash) handleSubmit(hash);
        history.replaceState(null, null, location.pathname);
    }
}
