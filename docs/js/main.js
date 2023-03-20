import QualityTx from "./index.min.mjs"
import {saveSettings, loadSettings} from "./settings.js"
import { bin2dec, dec2bin, $ } from "./utils.js"

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
    document.getElementsByName("temp-msg").forEach(e=>e.remove())
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
checkCodeElem.addEventListener("click", ()=>{
    if (!qualityCodeInput.value) {
        alert(`Enter a value from ${qualityCodeInput.min} to ${qualityCodeInput.max}`)
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


function onBinaryChange(e) {
    // Let the user cut/paste
    if (e.key == "Control" || e.ctrlKey) return
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
bitBinMapInput.addEventListener("change", onBinaryChange)
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

bitDecMapInput.addEventListener("keydown", (e) =>{
    // TODO: Enforce quality rules
    if (!e.target.value) return
    // Keep the input within the max range for quality values
    setTimeout(()=>{
        if (parseInt(e.target.value) > parseInt(e.target.max))
            e.target.value = e.target.max
        if (parseInt(e.target.value) < parseInt(e.target.min))
            e.target.value = e.target.min
        bitBinMapInput.value = dec2bin(e.target.value)
        setCreateTabDropdowns(e.target.value)
    }, 300)
})  

function setCreateTabDropdowns(qualityInt) {
    let is_screened = qtx.isScreened_int(qualityInt)
    if (!is_screened) {
        bitBinMapInput.value = CLEAR_BITS
        bitDecMapInput.value = bin2dec(CLEAR_BITS)
        qualityInt = bitDecMapInput.value
        // Only show the message once
        if (screened_message_count < 1) {
            alert('DATA QUALITY RULE 1 : Screened bit must be set to enable other bits')
            screened_message_count += 1
        }
    }
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
document.querySelectorAll('[role="tab"]').forEach(elem=>{
    elem.addEventListener('click', (evt)=> {
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

// Load the default value 
setCreateTabDropdowns(bin2dec(bitBinMapInput.value))

// Table Event Listeners
document.querySelectorAll('[name="bit-map-select"]').forEach(elem=>{
    elem.addEventListener("change", (evt) =>{
        let new_val = "";
        let qualityInt = bin2dec(bitBinMapInput.value)
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
            new_val = qualityInt
        } else {
            switch (evt.target.id) {
                case "SCREENED_ID":
                    if (evt.target.value == "SCREENED")
                        new_val = qtx.setScreened_int(qualityInt)
                    else
                        new_val = qtx.clearBit_int(qualityInt)
                    break;
                case "VALIDITY_ID": 
                    switch (evt.target.value) {
                        case "REJECTED":
                            new_val = qtx.setReject_int(qualityInt)
                            break;
                        case "OKAY":
                            new_val = qtx.setOkay_int(qualityInt)
                            break;
                        case "MISSING":
                            new_val = qtx.setMissing_int(qualityInt)
                            break;
                        case "QUESTIONABLE":
                            new_val = qtx.setQuestion_int(qualityInt)
                            break;
                        case "UNKNOWN":
                            new_val = qtx.clearReject_int(qualityInt)
                            new_val = qtx.clearOkay_int(new_val)
                            new_val = qtx.clearMissing_int(new_val)
                            new_val = qtx.clearQuestion_int(new_val)
                            break;
                        default:
                            break;
                    }
                case "RANGE_ID":
                    switch (evt.target.value) {
                        case "NO_RANGE":
                            new_val = qtx.clearRange_int(qualityInt)
                            break;
                        case "RANGE_0":
                            new_val = qtx.setRange0_int(qualityInt)
                            break;
                        case "RANGE_1":
                            new_val = qtx.setRange1_int(qualityInt)
                            break;
                        case "RANGE_2":
                            new_val = qtx.setRange2_int(qualityInt)
                            break;
                        case "RANGE_3":
                            new_val = qtx.setRange3_int(qualityInt)
                            break;
                    }
                    break;
                case "CHANGED_ID":
                    switch (evt.target.value) {
                        case "ORIGINAL":
                            new_val = qtx.clearDifferentValue_int(qualityInt)
                            break;
                        case "MODIFIED":
                            new_val = qtx.setDifferentValue_int(qualityInt)
                            break;
                    }
                case "REPL_CAUSE_ID":
                    switch (evt.target.value) {
                        case "NONE":
                            // I think this clears method too
                            new_val = qtx.setNoRevision_int(qualityInt)
                            break;
                        case "AUTOMATIC":
                            new_val = qtx.setRevisedAutomatically_int(qualityInt)
                            break;
                        case "INTERACTIVE":
                            new_val = qtx.setRevisedInteractively_int(qualityInt)
                            break;
                        case "MANUAL":
                            new_val = qtx.setRevisedManually_int(qualityInt)
                            break;
                        case "RESTORED":
                            // ????
                            new_val = qtx.setRevisedToOriginalAccepted_int(qualityInt)
                            break;
                    }
                case "REPL_METHOD_ID":
                    switch (evt.target.value) {
                        case "NONE":
                            new_val = qtx.clearReplaceMethod_int(qualityInt)
                            break;
                        case "LIN_INTERP":
                            new_val = qtx.setReplaceLinearInterpolation_int(qualityInt)
                            break;
                        case "EXPLICIT":
                            new_val = qtx.setReplaceManualChange_int(qualityInt)
                            break;
                        case "MISSING":
                            new_val = qtx.setReplaceWithMissing_int(qualityInt)
                            break;
                        case "GRAPHICAL":
                            new_val = qtx.setReplaceGraphicalChange_int(qualityInt)
                            break;
                    }
                case "PROTECTION_ID":
                    switch (evt.target.value) {
                        case "UNPROTECTED":
                            new_val = qtx.clearProtected_int(qualityInt)
                            break;
                        case "PROTECTED":
                            new_val = qtx.setProtected_int(qualityInt)
                            break;
                    }
            }
        }
        if (new_val === "") return
        // Update binary value
        bitBinMapInput.value = dec2bin(new_val)
        // Update decimal value
        bitDecMapInput.value = new_val
        // setCreateTabDropdowns(bitDecMapInput.value)
    })
})
// for (let index = 0; index < 32; index++) {
//     let new_val = dec2bin(qtx.clearBit_int(bin2dec(bitBinMapInput.value), index))
//     console.log(new_val)
//     bitBinMapInput.value = new_val

// }