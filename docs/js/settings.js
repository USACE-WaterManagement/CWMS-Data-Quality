// Enables storing settings to the browser's local storage

const STORAGE_ID = "cwms-quality-codes"

export function loadSettings() {
    // Attempt to load page settings, use sane defaults if none exist
    return JSON.parse(window.localStorage.getItem(STORAGE_ID)) || {
        "tab": "nav-create-tab",
        "bitmap": null,
        "finds": []
    }
}

export function saveSettings(settings) {
    window.localStorage.setItem(STORAGE_ID, JSON.stringify(settings))
}
