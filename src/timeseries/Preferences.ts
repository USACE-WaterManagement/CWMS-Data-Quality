interface Preferences {
  node(name: string): Preferences;
  getBoolean(key: string, defaultValue: boolean): boolean;
  putBoolean(key: string, value: boolean): void;
  removePreferenceChangeListener(listener: (event: StorageEvent) => void): void;
  addPreferenceChangeListener(listener: (event: StorageEvent) => void): void;
}


function getQualityPrefs(rootNode: Preferences): Preferences {
  return rootNode.node("Quality");
}

function getQualityColorPrefs(rootNode: Preferences): Preferences {
  return rootNode.node("Quality").node("color");
}

function canEditQuality(appSpecificRootNode: Preferences): boolean {
  const qualNode = getQualityPrefs(appSpecificRootNode);
  const value = qualNode.getBoolean("QUALITY_FLAGS_EDITABLE", true);
  if (value) {
    localStorage.setItem("QUALITY_FLAGS_EDITABLE", "true");
  } else {
    localStorage.setItem("QUALITY_FLAGS_EDITABLE", "false");
  }
  return value;
}

function canShowQuality(appSpecificRootNode: Preferences): boolean {
  const qualNode = getQualityPrefs(appSpecificRootNode);
  const value = qualNode.getBoolean("SHOW_QUALITY_FLAGS", true);
  if (value) {
    localStorage.setItem("SHOW_QUALITY_FLAGS", "true");
  } else {
    localStorage.setItem("SHOW_QUALITY_FLAGS", "false");
  }
  return value;
}

function setShowQuality(
  appSpecificRootNode: Preferences,
  showQuality: boolean
): void {
  const qualNode = getQualityPrefs(appSpecificRootNode);
  qualNode.putBoolean("SHOW_QUALITY_FLAGS", showQuality);
  localStorage.setItem("SHOW_QUALITY_FLAGS", showQuality.toString());
}

function setCanEditQuality(
  appSpecificRootNode: Preferences,
  editQuality: boolean
): void {
  const qualNode = getQualityPrefs(appSpecificRootNode);
  qualNode.putBoolean("QUALITY_FLAGS_EDITABLE", editQuality);
  localStorage.setItem("QUALITY_FLAGS_EDITABLE", editQuality.toString());
}

function addQualityPreferencesListener(
  appSpecificRootNode: Preferences,
  listener: (event: StorageEvent) => void
): void {
  const qualNode = getQualityPrefs(appSpecificRootNode);
  qualNode.removePreferenceChangeListener(listener);
  window.addEventListener("storage", listener);
}

function removeQualityPreferencesListener(
  appSpecificRootNode: Preferences,
  listener: (event: StorageEvent) => void
): void {
  const qualNode = getQualityPrefs(appSpecificRootNode);
  qualNode.removePreferenceChangeListener(listener);
  window.removeEventListener("storage", listener);
}

export {
  removeQualityPreferencesListener,
  addQualityPreferencesListener,
  setCanEditQuality,
  setShowQuality,
  canShowQuality,
  canEditQuality
};
