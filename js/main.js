import QualityTx from "./index.min.mjs"
import "./labels.js"
import { saveSettings, loadSettings } from "./settings.js"
import { bin2dec, dec2bin, $ } from "./utils.js"

// TODO: Run checks for rules
// TODO: Check to see if any unused bits are set


const bitMapOptions = {
    "SCREENED_ID": ["SCREENED", "UNSCREENED"],
    "VALIDITY_ID": ["UNKNOWN", "OKAY", "MISSING", "QUESTIONABLE", "REJECTED"],
    "RANGE_ID": ["NO_RANGE", "RANGE_1", "RANGE_2", "RANGE_3"],
    "CHANGED_ID": ["MODIFIED", "ORIGINAL"],
    "REPL_CAUSE_ID": ["NONE", "AUTOMATIC", "INTERACTIVE", "MANUAL", "RESTORED"],
    "REPL_METHOD_ID": ["NONE", "LIN_INTERP", "EXPLICIT", "MISSING", "GRAPHICAL"],
    "TEST_FAILED_ID": [
        "ABSOLUTE_VALUE", "CONSTANT_VALUE", "RATE_OF_CHANGE",
        "RELATIVE_VALUE", "DURATION_VALUE", "NEG_INCREMENT",
        "SKIP_LIST", "USER_DEFINED", "DISTRIBUTION",
    ],
    "UNUSED": [],
    "PROTECTION_ID": ["PROTECTED", "UNPROTECTED"]
}
// TODO: Replace this with clear all bits method
const CLEAR_BITS = "00000000000000000000000000000000"
const qualityCodeInput = $("#qualityCode"),
    checkCodeElem = $("#checkCode"),
    qualityTableBodyElem = $("#qualityTable").querySelector("tbody"),
    createTableBodyElem = $("#createTable").querySelector("tbody"),
    clearCodeElem = $("#clearCode"),
    bitBinMapInput = $("#bitBinMap"),
    bitDecMapInput = $("#bitDecMap"),
    inputGroupSizingElem = $("#inputGroup-sizing-default"),
    inputBitCountElem = $("#inputBitCount")

let screened_message_count = 0;

const qtx = new QualityTx()
// Load default settings
let settings = loadSettings()
// Find Tab Functions
function clearTable() {
    qualityTableBodyElem.innerHTML = `<tr name="temp-msg"><td colspan="9" class="h5 text-center">Table Cleared - Enter an integer from ${qualityCodeInput.min} to ${qualityCodeInput.max}</td></tr>`
}
function addRow(qualityData) {
    // Clear any temp messages
    document.getElementsByName("temp-msg").forEach(e => e.remove())
    // Add a row to the quality table with the provided quality data
    const tr = document.createElement("tr")
    tr.innerHTML = `<td class="col">${qualityData.QUALITY_CODE}</td>
        <td>${qualityData.SCREENED_ID}</td>
        <td>${qualityData.VALIDITY_ID}</td>
        <td>${qualityData.RANGE_ID}</td>
        <td>${qualityData.CHANGED_ID}</td>
        <td>${qualityData.REPL_CAUSE_ID}</td>
        <td>${qualityData.REPL_METHOD_ID}</td>
        <td>${qualityData.PROTECTION_ID}</td>
        <td>${qualityData.TEST_FAILED_ID}</td>`
    qualityTableBodyElem.appendChild(tr)
}
checkCodeElem.addEventListener("click", (e) => {
    if (!qualityCodeInput.value) {
        alert(`Enter a value from ${qualityCodeInput.min} to ${qualityCodeInput.max}`)
        return
    }
    if (!isBitMapValid(dec2bin(qualityCode.value))) {
        console.log("checkcode click")
        qualityCode.value = 0
        return
    }
    let existing_columns = document.querySelectorAll("tr td:first-of-type")
    // Prevent adding duplicate rows
    for (const elem of existing_columns)
        if (elem.innerText == qualityCodeInput.value) {
            alert(`Row Exists for Quality Code ${qualityCodeInput.value}`)
            qualityCodeInput.value = ""
            return
        }
    addRow(qtx.getStringDescription(qualityCodeInput.value, true))
})
clearCodeElem.addEventListener("click", clearTable)

// Add example rows
addRow(qtx.getStringDescription(0, true))
addRow(qtx.getStringDescription(1, true))
addRow(qtx.getStringDescription(3, true))
addRow(qtx.getStringDescription(5, true))
addRow(qtx.getStringDescription(9, true))
addRow(qtx.getStringDescription(Math.floor(Math.random() * qualityCodeInput.max), true))


function isBitMapValid(bits) {
    // This method is really only needed if you are making bitmaps dynamically in the browser like you see here

    // Certain bits should not be set, return if the bits are valid or not
    // False - invalid, True - valid

    // This is a bit confusing, because charAt reads left to right, but the bit order is right to left
    // Subtracting 31 to reverse the charAt order

    if (!bits) bits = bitBinMapInput.value
    let invalid_bits = ""
    // Enforces Rule #1
    // Check if the screened bit is NOT set, but other bits ARE set 
    // Deliberate 0 to show this is bit 0
    if (bits.charAt(31 - 0) == '0') {
        for (const b in bits) {
            if (b == '1') {
                invalid_bits = "RULE 1"
            }
        }
    }
    // Enforces RULE #2
    if (bits.charAt(31-14) == '1') invalid_bits = "Rule 2, bit 14"
    if (bits.charAt(31-22) == '1') invalid_bits = "Rule 2, bit 22"
    if (bits.charAt(31-24) == '1') invalid_bits = "Rule 2, bit 24"
    if (bits.charAt(31-26) == '1') invalid_bits = "Rule 2, bit 26"
    if (bits.charAt(31-27) == '1') invalid_bits = "Rule 2, bit 27"
    if (bits.charAt(31-28) == '1') invalid_bits = "Rule 2, bit 28"
    if (bits.charAt(31-29) == '1') invalid_bits = "Rule 2, bit 29"
    if (bits.charAt(31-30) == '1') invalid_bits = "Rule 2, bit 30"
    // Enforce Rule # 3 - exclusive bits only, no more than 1 bit should be set between bits 1 and 4
    let b_count = 0
    console.log('bits', bits)
    // let temp_bits = String(structuredClone(bits))
    for (let b of bits.slice(31-5, 31)) {
        console.log(b)
        if (b=='1') b_count +=1
    }
    if (b_count > 1) invalid_bits = "Rule 3"
    // Rules 5 and 6 mean that we need 3 bits to get to 5 values. 2 bits or 11 gets you 0-3 (4 bits)
    // However, needing a range from 0..4 or 5 bits requires 3 bits where 5 is 100
    // Make sure Replacement Cause bits 8-10 can NOT be 111 or 101 or 110
    if ((bits.charAt(31 - 8) == '1' && bits.charAt(31 - 10) == '1') || 
        (bits.charAt(31 - 9) == '1' && bits.charAt(31 - 10) == '1'))  invalid_bits = "Rule 5"
    // Make sure Replacement Method bits 11-13 can NOT be 111 or 101 or 110
    if ((bits.charAt(31 - 11) == '1' && bits.charAt(31 - 13) == '1') ||
        (bits.charAt(31 - 22) == '1' && bits.charAt(31 - 13) == '1')) invalid_bits = "Rule 6"
    if (invalid_bits) {
        alert(`You have invalid bits set with this value, per ${invalid_bits}. Clearing bits.`)
        return false
    }
    return true

}
function onBinaryChange(e) {
    // Let the user cut/paste
    if (e.key == "Control" || e.ctrlKey) return
    if (!isBitMapValid()) {
        // Set all the bits back to 0
        console.log("binary change")
        resetBits()
        e.preventDefault()
        return
    }
    // Just 1's and 0's!
    if (!["0", "1", "Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        bitBinMapInput.classList.remove("border-dark")
        bitBinMapInput.classList.add("border-warning")
        inputGroupSizingElem.classList.add("bg-warning")
        inputGroupSizingElem.innerText = "Use 1 or 0"
        setTimeout(() => {
            bitBinMapInput.classList.remove("border-warning")
            bitBinMapInput.classList.add("border-dark")
            inputGroupSizingElem.classList.remove("bg-warning")
            inputGroupSizingElem.innerText = "Bit Map"
        }, 1000)
        e.preventDefault()
    }
}

// Create Tab Functions
bitBinMapInput.addEventListener("keyup", onBinaryChange)
// bitBinMapInput.addEventListener("change", onBinaryChange)
bitBinMapInput.addEventListener("keyup", () => {
    inputBitCountElem.innerText = bitBinMapInput.value.length + " / 32"
    // Auto set the selection when the user reaches 32 bits
    if (bitBinMapInput.value.length == 32) {
        let dec_val = bin2dec(bitBinMapInput.value)
        bitDecMapInput.value = dec_val
        setCreateTabDropdowns(dec_val)
        // Feedback if correct bit length is reached
        inputBitCountElem.classList.replace("border-danger", "border-success")
    } else
        inputBitCountElem.classList.replace("border-success", "border-danger")
})

bitDecMapInput.addEventListener("keydown", (e) => {
    // TODO: Enforce quality rules
    if (!e.target.value) return
    if (!isBitMapValid()) {
        console.log("decimal change")
        e.preventDefault()
        resetBits() 
        return
    }
    // Keep the input within the max range for quality values
    setTimeout(() => {
        if (parseInt(e.target.value) > parseInt(e.target.max))
            e.target.value = e.target.max
        if (parseInt(e.target.value) < parseInt(e.target.min))
            e.target.value = e.target.min
        bitBinMapInput.value = dec2bin(e.target.value)
        setCreateTabDropdowns(e.target.value)
    }, 300)
})

function resetBits() {
    // Sets all bits back to 0
    bitBinMapInput.value = CLEAR_BITS
    bitDecMapInput.value = bin2dec(CLEAR_BITS)
    setCreateTabDropdowns(bitDecMapInput.value)
}

function setCreateTabDropdowns(qualityInt) {
    let is_screened = qtx.isScreened_int(qualityInt)
    let current_quality_map = qtx.getStringDescription(qualityInt, true)
    delete current_quality_map["QUALITY_CODE"]
    for (const key in current_quality_map) {
        const BIT_MAP_SELECT = document.getElementById(key)
        const BIT_MAP_VALUES = current_quality_map[key]
        BIT_MAP_SELECT.value = current_quality_map[key]
        // Always keep the screening dropdown enabled
        if (key != "SCREENED_ID")
            BIT_MAP_SELECT.disabled = !is_screened
        // TEST_FAILED_ID selections
        if (BIT_MAP_SELECT?.multiple) {
            for (const item of BIT_MAP_VALUES.split("+")) {
                for (const optionElem of BIT_MAP_SELECT.options)
                    if (optionElem.innerText == item) optionElem.selected = true
            }
        }
    }
}
// Add listeners to tabs, apply defaults
document.querySelectorAll('[role="tab"]').forEach(elem => {
    elem.addEventListener('click', (evt) => {
        // Save tab choice
        settings["tab"] = evt.target.id
        saveSettings(settings)
    })
    // Click the saved tab on page load
    if (elem.id == settings?.tab) elem.click()
})


createTableBodyElem.querySelectorAll("tr").forEach(elem => {
    const selectElem = document.createElement("select")
    const bitMap = elem.children[1].innerText
    if (bitMap == "TEST_FAILED_ID") selectElem.multiple = true
    selectElem.innerHTML = ``
    selectElem.id = bitMap
    selectElem.title = "Hold Ctrl or Shift to select multiple"
    selectElem.name = 'bit-map-select'
    let options_html = ''
    let value_options = bitMapOptions[bitMap]
    // Leave it blank if there is nothing to populate
    if (value_options.length == 0) return
    for (const option of value_options) {
        options_html += `<option>${option}</option>`
    }
    selectElem.innerHTML = options_html
    selectElem.classList.add("w-100")
    selectElem.classList.add("text-center")
    elem.children[2].appendChild(selectElem)
})

function determineNewQuality(evt, qualityInt) {
    if (evt.target.multiple) {
        let selected = Array.from(evt.target.selectedOptions).map(({ value }) => value);
        // Clear all bits before setting them
        qualityInt = qtx.clearAllTest_int(qualityInt)
        if (selected.includes("ABSOLUTE_VALUE"))
            qualityInt = qtx.setAbsoluteMagnitude_int(qualityInt)
        if (selected.includes("CONSTANT_VALUE"))
            qualityInt = qtx.setConstantValue_int(qualityInt)
        if (selected.includes("RATE_OF_CHANGE"))
            qualityInt = qtx.setRateOfChange_int(qualityInt)
        if (selected.includes("RELATIVE_VALUE"))
            qualityInt = qtx.setRelativeMagnitude_int(qualityInt)
        if (selected.includes("DURATION_VALUE"))
            qualityInt = qtx.setDurationMagnitude_int(qualityInt)
        if (selected.includes("NEG_INCREMENT"))
            qualityInt = qtx.setNegativeIncremental_int(qualityInt)
        if (selected.includes("SKIP_LIST"))
            qualityInt = qtx.setGageList_int(qualityInt)
        if (selected.includes("USER_DEFINED"))
            qualityInt = qtx.setUserDefinedTest_int(qualityInt)
        if (selected.includes("DISTRIBUTION"))
            qualityInt = qtx.setDistributionTest_int(qualityInt)
        return qualityInt
    } else {
        switch (evt.target.id) {
            case "SCREENED_ID":
                if (evt.target.value == "SCREENED")
                    return qtx.setScreened_int(qualityInt)
                else
                    return qtx.clearBit_int(qualityInt)
            case "VALIDITY_ID":
                switch (evt.target.value) {
                    case "REJECTED":
                        return qtx.setReject_int(qualityInt)
                    case "OKAY":
                        return qtx.setOkay_int(qualityInt)
                    case "MISSING":
                        return qtx.setMissing_int(qualityInt)
                    case "QUESTIONABLE":
                        return qtx.setQuestion_int(qualityInt)
                    case "UNKNOWN":
                        qualityInt = qtx.clearReject_int(qualityInt)
                        qualityInt = qtx.clearOkay_int(qualityInt)
                        qualityInt = qtx.clearMissing_int(qualityInt)
                        return qtx.clearQuestion_int(qualityInt)
                }
            case "RANGE_ID":
                switch (evt.target.value) {
                    case "NO_RANGE":
                        return qtx.clearRange_int(qualityInt)
                    case "RANGE_0":
                        return qtx.setRange0_int(qualityInt)
                    case "RANGE_1":
                        return qtx.setRange1_int(qualityInt)
                    case "RANGE_2":
                        return qtx.setRange2_int(qualityInt)
                    case "RANGE_3":
                        return qtx.setRange3_int(qualityInt)
                }
            case "CHANGED_ID":
                switch (evt.target.value) {
                    case "ORIGINAL":
                        return qtx.clearDifferentValue_int(qualityInt)
                    case "MODIFIED":
                        return qtx.setDifferentValue_int(qualityInt)
                }
            case "REPL_CAUSE_ID":
                switch (evt.target.value) {
                    case "NONE":
                        return qtx.clearAllRevised_int(qualityInt)
                    case "AUTOMATIC":
                        return qtx.setRevisedAutomatically_int(qualityInt)
                    case "INTERACTIVE":
                        return qtx.setRevisedInteractively_int(qualityInt)
                    case "MANUAL":
                        return qtx.setRevisedManually_int(qualityInt)
                    case "RESTORED":
                        return qtx.setRevisedToOriginalAccepted_int(qualityInt)
                }
            case "REPL_METHOD_ID":
                switch (evt.target.value) {
                    case "NONE":
                        return qtx.clearReplaceMethod_int(qualityInt)
                    case "LIN_INTERP":
                        return qtx.setReplaceLinearInterpolation_int(qualityInt)
                    case "EXPLICIT":
                        return qtx.setReplaceManualChange_int(qualityInt)
                    case "MISSING":
                        return qtx.setReplaceWithMissing_int(qualityInt)
                    case "GRAPHICAL":
                        return qtx.setReplaceGraphicalChange_int(qualityInt)
                }
            case "PROTECTION_ID":
                switch (evt.target.value) {
                    case "UNPROTECTED":
                        return qtx.clearProtected_int(qualityInt)
                    case "PROTECTED":
                        return qtx.setProtected_int(qualityInt)
                }
        }
    }
}

// Load the default value 
setCreateTabDropdowns(bin2dec(bitBinMapInput.value))

// Table Event Listeners
document.querySelectorAll('[name="bit-map-select"]').forEach(elem => {
    elem.addEventListener("change", (evt) => {
        let qualityInt = bin2dec(bitBinMapInput.value)
        let new_val = determineNewQuality(evt, qualityInt)
        if (new_val === null) return
        // Update binary value
        bitBinMapInput.value = dec2bin(new_val)
        // Update decimal value
        bitDecMapInput.value = new_val
        setCreateTabDropdowns(bitDecMapInput.value)
    })
})