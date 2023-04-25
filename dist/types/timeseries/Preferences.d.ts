interface Preferences {
    node(name: string): Preferences;
    getBoolean(key: string, defaultValue: boolean): boolean;
    putBoolean(key: string, value: boolean): void;
    removePreferenceChangeListener(listener: (event: StorageEvent) => void): void;
    addPreferenceChangeListener(listener: (event: StorageEvent) => void): void;
}
/**
 * Gets the application specific edit quality flag and returns that.  Make
 * sure you're not using the Preferences.userRoot or Preferences.systemRoot
 * because these are NOT application specific, this will be user or system
 * specific preferences.
 * @param {Preferences} appSpecificRootNode The application specific root node.
 * @returns A boolean indicating whether the quality flags are editable.
 */
declare function canEditQuality(appSpecificRootNode: Preferences): boolean;
/**
 * Gets the application specific show quality flag and returns that.  Make
 * sure you're not using the Preferences.userRoot or Preferences.systemRoot
 * because these are NOT application specific, this will be user or system
 * specific preferences.
 * @param {Preferences} appSpecificRootNode The application specific root node.
 * @returns A boolean indicating whether the quality flags are shown.
 */
declare function canShowQuality(appSpecificRootNode: Preferences): boolean;
/**
 * Sets the application specific show quality flag to the value provided.
 * @param {Preferences} appSpecificRootNode The application specific root node.
 * @param {boolean} showQuality A boolean indicating whether to show the quality flags.
 */
declare function setShowQuality(appSpecificRootNode: Preferences, showQuality: boolean): void;
/**
 * Sets the application specific edit quality flag to the value provided.
 * @param {Preferences} appSpecificRootNode The application specific root node.
 * @param {boolean} editQuality A boolean indicating whether to allow editing of the quality flags.
 */
declare function setCanEditQuality(appSpecificRootNode: Preferences, editQuality: boolean): void;
/**
 * Adds a Preference change listener to the node that contains the quality
 * settings.
 * @param {Preferences} appSpecificRootNode The application specific root node.
 * @param {PreferenceChangeListener} listener The listener to add.
 */
declare function addQualityPreferencesListener(appSpecificRootNode: Preferences, listener: (event: StorageEvent) => void): void;
/**
 * Removes a Preference change listener from the node that contains the quality settings.
 *
 * @param appSpecificRootNode The application specific root node of the preferences.
 * @param listener The PreferenceChangeListener to remove.
 */
declare function removeQualityPreferencesListener(appSpecificRootNode: Preferences, listener: (event: StorageEvent) => void): void;
export { removeQualityPreferencesListener, addQualityPreferencesListener, setCanEditQuality, setShowQuality, canShowQuality, canEditQuality };
//# sourceMappingURL=Preferences.d.ts.map