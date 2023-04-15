"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canEditQuality = exports.canShowQuality = exports.setShowQuality = exports.setCanEditQuality = exports.addQualityPreferencesListener = exports.removeQualityPreferencesListener = void 0;
/**
 * Provides a uniform way of creating the Quality settings preferences
 * @param {Preferences} rootNode The root node to create the preferences node from.
 * @returns The Quality settings preferences node.
 */
function getQualityPrefs(rootNode) {
    return rootNode.node("Quality");
}
/**
 * Provides a uniform way of creating the quality color preferences node.
 * Please keep this for use later, it will be used once we start updating
 * the preferences for quality colors.
 * @param {Preferences} rootNode The root node to create the preferences node from.
 * @returns The quality color preferences node.
 */
function getQualityColorPrefs(rootNode) {
    return rootNode.node("Quality").node("color");
}
/**
 * Gets the application specific edit quality flag and returns that.  Make
 * sure you're not using the Preferences.userRoot or Preferences.systemRoot
 * because these are NOT application specific, this will be user or system
 * specific preferences.
 * @param {Preferences} appSpecificRootNode The application specific root node.
 * @returns A boolean indicating whether the quality flags are editable.
 */
function canEditQuality(appSpecificRootNode) {
    const qualNode = getQualityPrefs(appSpecificRootNode);
    const value = qualNode.getBoolean("QUALITY_FLAGS_EDITABLE", true);
    if (value) {
        localStorage.setItem("QUALITY_FLAGS_EDITABLE", "true");
    }
    else {
        localStorage.setItem("QUALITY_FLAGS_EDITABLE", "false");
    }
    return value;
}
exports.canEditQuality = canEditQuality;
/**
 * Gets the application specific show quality flag and returns that.  Make
 * sure you're not using the Preferences.userRoot or Preferences.systemRoot
 * because these are NOT application specific, this will be user or system
 * specific preferences.
 * @param {Preferences} appSpecificRootNode The application specific root node.
 * @returns A boolean indicating whether the quality flags are shown.
 */
function canShowQuality(appSpecificRootNode) {
    const qualNode = getQualityPrefs(appSpecificRootNode);
    const value = qualNode.getBoolean("SHOW_QUALITY_FLAGS", true);
    if (value) {
        localStorage.setItem("SHOW_QUALITY_FLAGS", "true");
    }
    else {
        localStorage.setItem("SHOW_QUALITY_FLAGS", "false");
    }
    return value;
}
exports.canShowQuality = canShowQuality;
/**
 * Sets the application specific show quality flag to the value provided.
 * @param {Preferences} appSpecificRootNode The application specific root node.
 * @param {boolean} showQuality A boolean indicating whether to show the quality flags.
 */
function setShowQuality(appSpecificRootNode, showQuality) {
    const qualNode = getQualityPrefs(appSpecificRootNode);
    qualNode.putBoolean("SHOW_QUALITY_FLAGS", showQuality);
    localStorage.setItem("SHOW_QUALITY_FLAGS", showQuality.toString());
}
exports.setShowQuality = setShowQuality;
/**
 * Sets the application specific edit quality flag to the value provided.
 * @param {Preferences} appSpecificRootNode The application specific root node.
 * @param {boolean} editQuality A boolean indicating whether to allow editing of the quality flags.
 */
function setCanEditQuality(appSpecificRootNode, editQuality) {
    const qualNode = getQualityPrefs(appSpecificRootNode);
    qualNode.putBoolean("QUALITY_FLAGS_EDITABLE", editQuality);
    localStorage.setItem("QUALITY_FLAGS_EDITABLE", editQuality.toString());
}
exports.setCanEditQuality = setCanEditQuality;
/**
 * Adds a Preference change listener to the node that contains the quality
 * settings.
 * @param {Preferences} appSpecificRootNode The application specific root node.
 * @param {PreferenceChangeListener} listener The listener to add.
 */
function addQualityPreferencesListener(appSpecificRootNode, listener) {
    const qualNode = getQualityPrefs(appSpecificRootNode);
    qualNode.removePreferenceChangeListener(listener);
    window.addEventListener("storage", listener);
}
exports.addQualityPreferencesListener = addQualityPreferencesListener;
/**
 * Removes a Preference change listener from the node that contains the quality settings.
 *
 * @param appSpecificRootNode The application specific root node of the preferences.
 * @param listener The PreferenceChangeListener to remove.
 */
function removeQualityPreferencesListener(appSpecificRootNode, listener) {
    const qualNode = getQualityPrefs(appSpecificRootNode);
    qualNode.removePreferenceChangeListener(listener);
    window.removeEventListener("storage", listener);
}
exports.removeQualityPreferencesListener = removeQualityPreferencesListener;
