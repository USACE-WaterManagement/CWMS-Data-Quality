import { QualityStringRenderer } from "./QualityStringRenderer.js";
class DataSetTxQualityFlagException extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, DataSetTxQualityFlagException.prototype);
    }
}
class DataFormatException extends Error {
    constructor(arg = "") {
        super(typeof arg === "string" ? arg : arg.message);
        Object.setPrototypeOf(this, DataFormatException.prototype);
    }
}
class Quality {
    constructor(arg) {
        this._elementDataCompressed = null;
        this._isCompressed = false;
        if (arg instanceof Int32Array) {
            const elementData = arg;
            this._size = elementData.length / Quality.ELEMENT_SIZE_IN_BYTES;
            this._sizeInBytes = this._size * Quality.ELEMENT_SIZE_IN_BYTES;
            this._elementData = new Int32Array(this._sizeInBytes);
            this._elementData.set(elementData);
            // enforce valid quality data
            for (let i = 0; i < this._size; ++i) {
                this.setElementAt(this.getElementAt(i), i);
            }
        }
        else if (arg instanceof Quality) {
            const quality = arg;
            this._size = quality._size;
            this._sizeInBytes = quality._sizeInBytes;
            this._elementData = new Int32Array(this._sizeInBytes);
            this._elementData.set(quality._elementData);
            // enforce valid quality data
            for (let i = 0; i < this._size; ++i) {
                this.setElementAt(this.getElementAt(i), i);
            }
        }
        else if (Array.isArray(arg)) {
            const intQuality = arg;
            this._size = intQuality.length;
            this._sizeInBytes = this._size * Quality.ELEMENT_SIZE_IN_BYTES;
            this._elementData = new Int32Array(this._sizeInBytes);
            for (let i = 0; i < this._size; i++) {
                this.setIntegerAt(intQuality[i], i);
            }
        }
        else {
            const size = arg;
            this._size = size;
            this._sizeInBytes = size * Quality.ELEMENT_SIZE_IN_BYTES;
            this._elementData = new Int32Array(this._sizeInBytes);
            for (let i = 0; i < this._sizeInBytes; i++) {
                this._elementData[i] = Quality.NULL_VALUE;
            }
        }
    }
    static cleanQualityInteger(qualityInt) {
        let tmp = qualityInt;
        // -------------------------------------------//
        // clear all bits if screened bit is not set //
        // -------------------------------------------//
        if ((tmp & Quality.SCREENED_VALUE) == 0) {
            tmp = 0;
        }
        else {
            // -----------------------------------------------------------------//
            // ensure only used bits are set (also counteracts sign-extension)
            // -----------------------------------------------------------------//
            tmp &= Quality.USED_BITS_MASK;
            // -------------------------------------//
            // ensure only one validity bit is set //
            // -------------------------------------//
            if ((tmp & Quality.MISSING_VALUE) != 0) {
                tmp &= Quality.MISSING_MASK;
            }
            else if ((tmp & Quality.REJECTED_VALUE) != 0) {
                tmp &= Quality.REJECTED_MASK;
            }
            else if ((tmp & Quality.QUESTIONED_VALUE) != 0) {
                tmp &= Quality.QUESTIONED_MASK;
            }
            else if ((tmp & Quality.OK_VALUE) != 0) {
                tmp &= Quality.OK_MASK;
            }
            // ----------------------------------------------------//
            // ensure the replacement cause is not greater than 4 //
            // ----------------------------------------------------//
            let repl_cause = (tmp & Quality.REPL_CAUSE_MASK) >>> Quality.REPL_CAUSE_SHIFT;
            if (repl_cause > 4) {
                repl_cause = 4;
                tmp |= repl_cause << Quality.REPL_CAUSE_SHIFT;
            }
            // -----------------------------------------------------//
            // ensure the replacement method is not greater than 4 //
            // -----------------------------------------------------//
            let repl_method = (tmp & Quality.REPL_METHOD_MASK) >>> Quality.REPL_METHOD_SHIFT;
            if (repl_method > 4) {
                repl_method = 4;
                tmp |= repl_method << Quality.REPL_METHOD_SHIFT;
            }
            // ----------------------------------------------------------------------------------------------------------//
            // ensure that if 2 of replacement cause, replacement method, and
            // different are 0, the remaining one is too //
            // ----------------------------------------------------------------------------------------------------------//
            let different = (tmp & Quality.DIFFERENT_MASK) != 0;
            if (repl_cause == 0) {
                if (repl_method == 0 && different) {
                    tmp &= Quality.NOT_DIFFERENT_MASK;
                    different = false;
                }
                else if (repl_method != 0 && !different) {
                    tmp &= Quality.NO_REPL_METHOD_MASK;
                    repl_method = 0;
                }
            }
            else if (repl_method == 0 && !different) {
                tmp &= Quality.NO_REPL_CAUSE_MASK;
                repl_cause = 0;
            }
            // --------------------------------------------------------------------------------------------------------------------------//
            // ensure that if 2 of replacement cause, replacement method, and
            // different are NOT 0, the remaining one is set accordingly //
            // --------------------------------------------------------------------------------------------------------------------------//
            if (repl_cause != 0) {
                if (repl_method != 0 && !different) {
                    tmp |= Quality.DIFFERENT_MASK;
                    different = true;
                }
                else if (different && repl_method == 0) {
                    repl_method = 2; // EXPLICIT
                    tmp |= repl_method << Quality.REPL_METHOD_SHIFT;
                }
            }
            else if (different && repl_method != 0) {
                repl_cause = 3; // MANUAL
                tmp &= repl_cause << Quality.REPL_CAUSE_SHIFT;
            }
        }
        return tmp;
    }
    /*
      public static compressQuality(tmp: Quality): void {
        if (tmp._isCompressed || tmp._size < 10) {
          return;
        }
        const output = new Int32Array(pako.deflate(tmp._elementData.buffer));
        tmp._elementDataCompressed = output;
        tmp._isCompressed = true;
      }
    */
    /**
     * Uncompresses the data in a Quality object.
     * @param tmp The Quality object to uncompress.
     * @throws {Error} If tmp is null or undefined.
     * @throws {DataFormatException} If the compressed data in tmp is malformed.
     */
    /*
    public static uncompressQuality(tmp: Quality): void {
      // If the data is already uncompressed, there's nothing to do.
      if (!tmp._isCompressed) {
        return;
      }
      // If the compressed data is null or undefined, we can't uncompress it.
      const compressedData = tmp._elementDataCompressed;
      if (compressedData) {
        try {
          // Use pako to inflate the compressed data and create a Uint8Array from the result.
          const inflated = pako.inflate(compressedData.buffer);
          // Convert the Uint8Array to an Int32Array
          const intArray = new Int32Array(inflated.buffer);
          tmp._elementData = intArray;
          // Clean up by nulling out the compressed data and updating the isCompressed flag.
          tmp._elementDataCompressed = null;
          tmp._isCompressed = false;
        } catch (err) {
          throw new DataFormatException(
            "Failed to compress Data Quality. Error: " + err
          );
        }
      } else {
        throw new Error(
          "Quality data is null or undefined. Failed to uncompress Quality."
        );
      }
    }
  */
    /**
      Returns the empty quality value.
      @returns {number} - The empty quality value.
      */
    static emptyQualityValue() {
        return Quality.NULL_VALUE;
    }
    /**
     * Returns an Int32Array with empty bytes.
     *
     * @returns {Int32Array} - An Int32Array with empty bytes.
     */
    static emptyBytes() {
        return new Int32Array([
            Quality.NULL_VALUE,
            Quality.NULL_VALUE,
            Quality.NULL_VALUE,
            Quality.NULL_VALUE,
        ]);
    }
    /**
     * Returns the Int32Array containing the quality data.
     *
     * @returns {Int32Array} - The Int32Array containing the quality data.
     */
    getQuality() {
        return this._elementData;
    }
    /**
     * Returns the size of the element data.
     *
     * @returns {number} - The size of the element data.
     */
    getSize() {
        return this._size;
    }
    /**
     * Returns the size of the element data in bytes.
     *
     * @returns {number} - The size of the element data in bytes.
     */
    getSizeInBytes() {
        return this._sizeInBytes;
    }
    /**
     * Checks if the element data has quality.
     *
     * @returns {boolean} - True if the element data has quality, false otherwise.
     */
    hasQuality() {
        return this._size > 0;
    }
    /**
     * Gets the Bitmap of the element at the specified index.
     *
     * @param {number} elementIndex - The index of the element.
     *
     * @returns {Int32Array} - The Bitmap of the element at the specified index.
     *
     * @throws {RangeError} - If the specified index is out of range.
     */
    getElementAt(elementIndex) {
        if (elementIndex > this._size || elementIndex < 0) {
            throw new RangeError(`Index of: ${elementIndex} Out of range[0 - ${this._size}]`);
        }
        const byteIndex = elementIndex * Quality.ELEMENT_SIZE_IN_BYTES;
        const bytes = new Int32Array(Quality.ELEMENT_SIZE_IN_BYTES);
        bytes.set(this._elementData.subarray(byteIndex, byteIndex + Quality.ELEMENT_SIZE_IN_BYTES));
        return bytes;
    }
    /**
     * Gets the integer value of the bitmap at the specified index.
     *
     * @param {number} elementIndex - The index of the element.
     *
     * @returns {number} - The integer value of the element at the specified index.
     */
    getIntegerAt(elementIndex) {
        const bytes = this.getElementAt(elementIndex);
        const i0 = bytes[0] & Quality.MASK_BYTE;
        const i1 = bytes[1] & Quality.MASK_BYTE;
        const i2 = bytes[2] & Quality.MASK_BYTE;
        const i3 = bytes[3] & Quality.MASK_BYTE;
        const result = i3 | (i2 << 8) | (i1 << 16) | (i0 << 24);
        return result;
    }
    /**
     * Gets the integer value from the specified bitmap.
     *
     * @param {Int32Array} bytes - The bitmap to get the integer value from.
     *
     * @returns {number} - The integer value obtained from the bitmap.
     */
    static getInteger(bytes) {
        const i0 = bytes[0] & Quality.MASK_BYTE;
        const i1 = bytes[1] & Quality.MASK_BYTE;
        const i2 = bytes[2] & Quality.MASK_BYTE;
        const i3 = bytes[3] & Quality.MASK_BYTE;
        const result = i3 | (i2 << 8) | (i1 << 16) | (i0 << 24);
        return result;
    }
    /**
     * Sets the integer value of the element at the specified index.
     *
     * @param {number} intQuality - The integer value to set.
     * @param {number} elementIndex - The index of the element to set.
     *
     * @returns {void}
     */
    setIntegerAt(intQuality, elementIndex) {
        const bytes = new Int32Array(4);
        bytes[3] = intQuality & Quality.MASK_BYTE;
        bytes[2] = (intQuality >> 8) & Quality.MASK_BYTE;
        bytes[1] = (intQuality >> 16) & Quality.MASK_BYTE;
        bytes[0] = (intQuality >> 24) & Quality.MASK_BYTE;
        this.setElementAt(bytes, elementIndex);
    }
    /**
     * Fills the byte array with the 4 8-bit slices of an integer. The HI bytes
     * of the integer are in slot 0 and the LOW bytes are in slot 3. The byte
     * array must be of size 4 before being passed to the array.
     *
     * @param intQuality the integer to parse
     * @param bytes      the byte array to fill from Hi to Lo (0-4)
     */
    static getBytes(intQuality, bytes) {
        if (!bytes) {
            let bytes = new Int32Array(4);
            Quality.getBytes(intQuality, bytes);
            return bytes;
        }
        if (bytes.length !== 4) {
            throw new Error("<ERROR> QualityTx.getBytes(int,byte[]) : Byte array must be of size 4 before passed to this method");
        }
        bytes[3] = intQuality & Quality.MASK_BYTE;
        bytes[2] = (intQuality >> 8) & Quality.MASK_BYTE;
        bytes[1] = (intQuality >> 16) & Quality.MASK_BYTE;
        bytes[0] = (intQuality >> 24) & Quality.MASK_BYTE;
        return;
    }
    /**
     * Sets the element at the specified index to the given bytes.
     *
     * @param {bitmap} bytes - The bytes to set.
     * @param {number} elementIndex - The index of the element to set.
     *
     * @returns {void}
     *
     * @throws {Error} If the element index is out of range [0 - size].
     */
    setElementAt(bytes, elementIndex) {
        if (elementIndex > this._size || elementIndex < 0) {
            throw new Error(`Index of: ${elementIndex} Out of range[0 - ${this._size}]`);
        }
        const qualityInt = ((bytes[0] & Quality.MASK_BYTE) << 24) |
            ((bytes[1] & Quality.MASK_BYTE) << 16) |
            ((bytes[2] & Quality.MASK_BYTE) << 8) |
            (bytes[3] & Quality.MASK_BYTE);
        const cleanedInt = Quality.cleanQualityInteger(qualityInt);
        const cleanedBytes = new Int32Array([
            (cleanedInt >>> 24) & Quality.MASK_BYTE,
            (cleanedInt >>> 16) & Quality.MASK_BYTE,
            (cleanedInt >>> 8) & Quality.MASK_BYTE,
            cleanedInt & Quality.MASK_BYTE,
        ]);
        const byteIndex = elementIndex * Quality.ELEMENT_SIZE_IN_BYTES;
        for (let i = 0; i < Quality.ELEMENT_SIZE_IN_BYTES; i++) {
            this._elementData[byteIndex + i] = cleanedBytes[i];
        }
    }
    /**
     * Returns true if the given 32-bit integer array represents an accepted quality value.
     *
     * A quality value is accepted if:
     * - The screened bit is set.
     * - The okay bit is set.
     * - The missing bit is clear.
     * - The question bit is clear.
     * - The reject bit is clear.
     * - The how-revised bit 0 and bit 1 are clear.
     * - The how-revised bit 2 is set.
     * - The replace-method bits 0, 1, 2, and 3 are clear.
     *
     * @param bytes - The 32-bit integer array to check.
     * @returns True if the quality value is accepted, false otherwise.
     */
    static isAccepted(bytes) {
        // No Revision Replacement Method set 0 = 0000
        // "A" for Original Value is Accepted
        return (Quality.isBitSet(bytes, Quality.SCREENED_BIT) &&
            Quality.isBitSet(bytes, Quality.OKAY_BIT) &&
            Quality.isBitClear(bytes, Quality.MISSING_BIT) &&
            Quality.isBitClear(bytes, Quality.QUESTION_BIT) &&
            Quality.isBitClear(bytes, Quality.REJECT_BIT) &&
            Quality.isBitClear(bytes, Quality.HOW_REVISED_BIT0) &&
            Quality.isBitClear(bytes, Quality.HOW_REVISED_BIT1) &&
            Quality.isBitSet(bytes, Quality.HOW_REVISED_BIT2) &&
            Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT0) &&
            Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT1) &&
            Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT2) &&
            Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT3));
    }
    static getReplaceMethod_int(intQuality) {
        if (Quality.isReplaceLinearInterpolation_int(intQuality))
            return "LIN_INTERP";
        if (Quality.isReplaceManualChange_int(intQuality))
            return "EXPLICIT";
        if (Quality.isReplaceWithMissing_int(intQuality))
            return "MISSING";
        if (Quality.isReplaceGraphicalChange_int(intQuality))
            return "GRAPHICAL";
        return "NONE";
    }
    static getValidity_int(intQuality) {
        if (Quality.isBitSet_int(intQuality, 2))
            return "OKAY";
        if (Quality.isBitSet_int(intQuality, 3))
            return "MISSING";
        if (Quality.isBitSet_int(intQuality, 4))
            return "QUESTIONABLE";
        if (Quality.isBitSet_int(intQuality, 5))
            return "REJECTED";
        return "UNKNOWN";
    }
    static getRange_int(intQuality) {
        if (Quality.isRange1_int(intQuality))
            return "RANGE_1";
        if (Quality.isRange2_int(intQuality))
            return "RANGE_2";
        if (Quality.isRange3_int(intQuality))
            return "RANGE_3";
        return "NO_RANGE";
    }
    static getReplaceCause_int(intQuality) {
        if (Quality.isRevisedAutomatically_int(intQuality))
            return "AUTOMATIC";
        if (Quality.isRevisedInteractively_int(intQuality))
            return "INTERACTIVE";
        if (Quality.isRevisedManually_int(intQuality))
            return "MANUAL";
        if (Quality.isRevisedToOriginalAccepted_int(intQuality))
            return "RESTORED";
        return "NONE";
    }
    /**
     * Determines if the given quality integer value represents an accepted data point.
     *  Linear Interpolation Replacement Method set 1 = 0001
     *   "I" for Interpolated Value
     *
     * @param intQuality - The quality integer value to check.
     * @returns Whether the quality integer value represents an accepted data point or not.
     */
    static isAccepted_int(intQuality) {
        return (Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT) &&
            Quality.isBitSet_int(intQuality, Quality.OKAY_BIT) &&
            Quality.isBitClear_int(intQuality, Quality.MISSING_BIT) &&
            Quality.isBitClear_int(intQuality, Quality.QUESTION_BIT) &&
            Quality.isBitClear_int(intQuality, Quality.REJECT_BIT) &&
            Quality.isBitClear_int(intQuality, Quality.HOW_REVISED_BIT0) &&
            Quality.isBitClear_int(intQuality, Quality.HOW_REVISED_BIT1) &&
            Quality.isBitSet_int(intQuality, Quality.HOW_REVISED_BIT2) &&
            Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT0) &&
            Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT1) &&
            Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT2) &&
            Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT3));
    }
    /**
     *  Determines if a given integer represents an interpolated value based on its quality bits.
     *
     *  Linear Interpolation Replacement Method set 1 = 0001.
     *  "I" for Interpolated Value.
     *
     *  @param intQuality - The integer value representing the quality of a data element.
     *  @returns A boolean value indicating whether the quality represents an interpolated value.
     */
    static isInterpolated(bytes) {
        return (Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT0) &&
            Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT1) &&
            Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT2) &&
            Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT3));
    }
    /**
     * Determines if the given integer value represents an interpolated quality.
     * @param intQuality - The integer value to check.
     * @returns A boolean value indicating whether the given integer value represents an interpolated quality.
     */
    static isInterpolated_int(intQuality) {
        return (Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT0) &&
            Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT1) &&
            Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT2) &&
            Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT3));
    }
    /**
     * Determines if the given Int32Array represents keyboard input based on the replace method bits.
     * Replace method bit 0 should be cleared, bit 1 should be set, and bits 2 and 3 should be cleared.
     * @param bytes - The Int32Array to check.
     * @returns A boolean value indicating whether the given Int32Array represents keyboard input.
     */
    static isKeyboardInput(bytes) {
        // Manual Change Replacement Method set 2 = 0010
        // "K" for Keyboard Input
        return (Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT0) &&
            Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT1) &&
            Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT2) &&
            Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT3));
    }
    /**
     * Determines if the given integer value represents keyboard input based on the replace method bits.
     * Replace method bit 0 should be cleared, bit 1 should be set, and bits 2 and 3 should be cleared.
     *
     *
     * Manual Change Replacement Method set 2 = 0010
     * "K" for Keyboard Input
     *
     * @param intQuality - The integer value to check.
     */
    static isKeyboardInput_int(intQuality) {
        return (Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT0) &&
            Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT1) &&
            Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT2) &&
            Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT3));
    }
    /**
     * Determines if the given Int32Array represents a graphical estimate based on the replace method bits.
     *
     * Manual Change Replacement Method set 4 = 0100
     * "E" for Graphical Estimate
     *
     * Replace method bit 0 and bit 1 should be cleared, bit 2 should be set, and bit 3 should be cleared.
     *
     * @param bytes - The Int32Array to check.
     * @returns A boolean value indicating whether the given Int32Array represents a graphical estimate.
     */
    static isGraphicalEstimate(bytes) {
        return (Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT0) &&
            Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT1) &&
            Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT2) &&
            Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT3));
    }
    /**
      Checks if the quality value represents a graphical estimate based on its manual change replacement method bits.
      @param intQuality - The integer value of the quality to be checked.
      @returns A boolean indicating whether the quality value represents a graphical estimate or not.
      */
    static isGraphicalEstimate_int(intQuality) {
        // Manual Change Replacement Method set 4 = 0100
        // "E" for Graphical Estimate
        return (Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT0) &&
            Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT1) &&
            Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT2) &&
            Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT3));
    }
    /**
     * Checks whether an element is missing based on its index.
     *
     * @param elementIndex - The index of the element to be checked.
     * @throws {DataSetTxQualityFlagException} If the element is not screened.
     * @returns A boolean indicating whether the element is missing or not.
     */
    isMissing(elementIndex) {
        if (!this.isBitSet(elementIndex, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isMissing> Element not screened: " + elementIndex);
        }
        return this.isBitSet(elementIndex, Quality.MISSING_BIT);
    }
    /**
     * Checks whether an element is not missing based on its index.
     *
     * @param elementIndex - The index of the element to be checked.
     * @returns A boolean indicating whether the element is not missing or not.
     */
    isNotMissing(elementIndex) {
        return Quality.isBitClear_int(elementIndex, Quality.MISSING_BIT);
    }
    /**
     * Clears the missing bit of an element based on its index and sets the screened bit.
     *
     * @param elementIndex - The index of the element whose missing bit is to be cleared.
     */
    clearMissing(elementIndex) {
        Quality.clearBit_int(elementIndex, Quality.MISSING_BIT);
        Quality.setBit_int(elementIndex, Quality.SCREENED_BIT);
    }
    /**
     * Sets the missing bit of an element based on its index, and clears other quality bits except for screened bit.
     *
     * @param elementIndex - The index of the element whose missing bit is to be set.
     */
    setMissing(elementIndex) {
        Quality.setBit_int(elementIndex, Quality.MISSING_BIT);
        Quality.clearBit_int(elementIndex, Quality.OKAY_BIT);
        Quality.clearBit_int(elementIndex, Quality.QUESTION_BIT);
        Quality.clearBit_int(elementIndex, Quality.REJECT_BIT);
        Quality.setBit_int(elementIndex, Quality.SCREENED_BIT);
    }
    /**
     * Checks whether an element is missing based on its integer array representation.
     *
     * @param bytes - The integer array representation of the element to be checked.
     * @throws {DataSetTxQualityFlagException} If the element is not screened.
     * @returns A boolean indicating whether the element is missing or not.
     */
    static isMissing(bytes) {
        if (!Quality.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isMissing> Element not screened: " + bytes);
        }
        return Quality.isBitSet(bytes, Quality.MISSING_BIT);
    }
    /**
     * Checks whether an element is missing based on its integer representation.
     *
     * @param intQuality - The integer representation of the element to be checked.
     * @returns A boolean indicating whether the element is missing or not.
     */
    static isMissing_int(intQuality) {
        return (Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT) &&
            Quality.isBitSet_int(intQuality, Quality.MISSING_BIT));
    }
    /**
     * Checks whether an element is not missing based on its integer array representation.
     *
     * @param bytes - The integer array representation of the element to be checked.
     * @throws {DataSetTxQualityFlagException} If the element is not screened.
     * @returns A boolean indicating whether the element is not missing or not.
     */
    static isNotMissing(bytes) {
        if (!Quality.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotMissing> Element not screened: " + bytes);
        }
        return !Quality.isMissing(bytes);
    }
    /**
     * Checks whether an element is not missing based on its integer representation.
     *
     * @param intQuality - The integer representation of the element to be checked.
     * @throws {DataSetTxQualityFlagException} If the element is not screened.
     * @returns A boolean indicating whether the element is not missing or not.
     */
    static isNotMissing_int(intQuality) {
        if (!Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotMissing_int> Element not screened: " + intQuality);
        }
        return !Quality.isMissing_int(intQuality);
    }
    /**
     * Clears the missing bit of an element based on its integer array representation, and sets the screened bit.
     *
     * @param bytes - The integer array representation of the element whose missing bit is to be cleared.
     * @returns A new integer array with the updated quality bits.
     */
    static clearMissing(bytes) {
        const tmp = Quality.clearBit(bytes, Quality.MISSING_BIT);
        return Quality.setBit(tmp, Quality.SCREENED_BIT);
    }
    /**
     * Clears the missing bit of an element based on its integer representation, and sets the screened bit.
     *
     * @param intQuality - The integer representation of the element whose missing bit is to be cleared.
     * @returns A new integer with the updated quality bits.
     */
    static clearMissing_int(intQuality) {
        return Quality.setBit_int(Quality.clearBit_int(intQuality, Quality.MISSING_BIT), Quality.SCREENED_BIT);
    }
    /**
     * Sets the missing bit of an element based on its integer array representation, and clears other quality bits except for screened bit.
     *
     * @param bytes - The integer array representation of the element whose missing bit is to be set.
     * @returns A new integer array with the updated quality bits.
     */
    static setMissing(bytes) {
        let tmp = Quality.setBit(bytes, Quality.MISSING_BIT);
        tmp = Quality.clearBit(tmp, Quality.OKAY_BIT);
        tmp = Quality.clearBit(tmp, Quality.QUESTION_BIT);
        tmp = Quality.clearBit(tmp, Quality.REJECT_BIT);
        return Quality.setBit(tmp, Quality.SCREENED_BIT);
    }
    /**
     * Sets the MISSING_BIT flag on an integer quality value and clears OKAY_BIT, QUESTION_BIT, and REJECT_BIT flags. Then, sets the SCREENED_BIT flag and returns the resulting integer quality value.
     * @param intQuality - An integer representing the quality value to modify.
     * @returns The modified integer quality value with the MISSING_BIT, SCREENED_BIT flags set and the OKAY_BIT, QUESTION_BIT, and REJECT_BIT flags cleared.
     */
    static setMissing_int(intQuality) {
        let tmp = Quality.setBit_int(intQuality, Quality.MISSING_BIT);
        tmp = Quality.clearBit_int(tmp, Quality.OKAY_BIT);
        tmp = Quality.clearBit_int(tmp, Quality.QUESTION_BIT);
        tmp = Quality.clearBit_int(tmp, Quality.REJECT_BIT);
        return Quality.setBit_int(tmp, Quality.SCREENED_BIT);
    }
    /**
     * Determines if an element is protected by checking if the SCREENED_BIT and PROTECTED_BIT flags are set on an integer quality value.
     * @param elementIndex - An integer representing the index of the element to check.
     * @returns True if the element is protected (SCREENED_BIT and PROTECTED_BIT flags are set), false otherwise.
     */
    isProtected(elementIndex) {
        return (Quality.isScreened_int(elementIndex) &&
            Quality.isBitSet_int(elementIndex, Quality.PROTECTED_BIT));
    }
    /**
     * Determines if an element is not protected by checking if the SCREENED_BIT flag is set and the PROTECTED_BIT flag is not set on an integer quality value.
     * @param elementIndex - An integer representing the index of the element to check.
     * @returns True if the element is not protected (SCREENED_BIT flag is set and PROTECTED_BIT flag is not set), false otherwise.
     */
    isNotProtected(elementIndex) {
        return !Quality.isProtected_int(elementIndex);
    }
    /**
     * Clears the PROTECTED_BIT flag and sets the SCREENED_BIT flag on an integer quality value for the specified element index.
     * @param elementIndex - An integer representing the index of the element to modify.
     */
    clearProtected(elementIndex) {
        Quality.clearBit_int(elementIndex, Quality.PROTECTED_BIT);
        Quality.setBit_int(elementIndex, Quality.SCREENED_BIT);
    }
    /**
     * Sets the PROTECTED_BIT flag and the SCREENED_BIT flag on an integer quality value for the specified element index.
     * @param elementIndex - An integer representing the index of the element to modify.
     */
    setProtected(elementIndex) {
        Quality.setBit_int(elementIndex, Quality.PROTECTED_BIT);
        Quality.setBit_int(elementIndex, Quality.SCREENED_BIT);
    }
    /**
     * Determines if an element is protected by checking if the SCREENED_BIT and PROTECTED_BIT flags are set in an Int32Array.
     * @param bytes - An Int32Array containing the quality values to check.
     * @throws {DataSetTxQualityFlagException} If the SCREENED_BIT flag is not set in the Int32Array.
     * @returns True if the element is protected (SCREENED_BIT and PROTECTED_BIT flags are set), false otherwise.
     */
    static isProtected(bytes) {
        if (!Quality.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isProtected> Element not screened: " + bytes);
        }
        return Quality.isBitSet(bytes, Quality.PROTECTED_BIT);
    }
    /**
     * Determines if an integer quality value is protected by checking if the SCREENED_BIT and PROTECTED_BIT flags are set.
     * @param intQuality - An integer representing the quality value to check.
     * @throws {DataSetTxQualityFlagException} If the SCREENED_BIT flag is not set on the integer quality value.
     * @returns True if the integer quality value is protected (SCREENED_BIT and PROTECTED_BIT flags are set), false otherwise.
     */
    static isProtected_int(intQuality) {
        if (!Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isProtected_int> Element not screened: " + intQuality);
        }
        return Quality.isBitSet_int(intQuality, Quality.PROTECTED_BIT);
    }
    /**
     * Determines if an element is not protected by checking if the SCREENED_BIT flag is set and the PROTECTED_BIT flag is not set in an Int32Array.
     * @param bytes - An Int32Array containing the quality values to check.
     * @throws {DataSetTxQualityFlagException} If the SCREENED_BIT flag is not set in the Int32Array.
     * @returns True if the element is not protected (SCREENED_BIT flag is set and PROTECTED_BIT flag is not set), false otherwise.
     */
    static isNotProtected(bytes) {
        if (!Quality.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotProtected> Element not screened: " + bytes);
        }
        return !Quality.isProtected(bytes);
    }
    /**
     * Determines if an integer quality value is not protected by checking if the SCREENED_BIT flag is set and the PROTECTED_BIT flag is not set.
     * @param intQuality - An integer representing the quality value to check.
     * @throws {DataSetTxQualityFlagException} If the SCREENED_BIT flag is not set on the integer quality value.
     * @returns True if the integer quality value is not protected (SCREENED_BIT flag is set and PROTECTED_BIT flag is not set), false otherwise.
     */
    static isNotProtected_int(intQuality) {
        if (!Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotProtected_int> Element not screened: " + intQuality);
        }
        return !Quality.isProtected_int(intQuality);
    }
    /**
     * Clears the PROTECTED_BIT flag and sets the SCREENED_BIT flag on each integer quality value in an Int32Array.
     * @param bytes - An Int32Array containing the quality values to modify.
     * @returns A new Int32Array with the modified integer quality values.
     */
    static clearProtected(bytes) {
        const tmp = Quality.clearBit(bytes, Quality.PROTECTED_BIT);
        return Quality.setBit(tmp, Quality.SCREENED_BIT);
    }
    /**
      Sets the SCREENED and clears the PROTECTED bit in the input intQuality.
      @param intQuality - The input integer representing the quality.
      @returns The modified quality integer.
      */
    static clearProtected_int(intQuality) {
        return Quality.setBit_int(Quality.clearBit_int(intQuality, Quality.PROTECTED_BIT), Quality.SCREENED_BIT);
    }
    /**
      Sets the PROTECTED and SCREENED bits in the input bytes.
      @param bytes - The input Int32Array to modify.
      @returns A new Int32Array with the modified bits.
      */
    static setProtected(bytes) {
        return Quality.setBit(Quality.setBit(bytes, Quality.PROTECTED_BIT), Quality.SCREENED_BIT);
    }
    /**
      Sets the PROTECTED and SCREENED bits in the input intQuality.
      @param intQuality - The input integer representing the quality.
      @returns The modified quality integer.
      */
    static setProtected_int(intQuality) {
        return Quality.setBit_int(Quality.setBit_int(intQuality, Quality.PROTECTED_BIT), Quality.SCREENED_BIT);
    }
    /**
    
    Checks whether the bit at the specified bitPosition is clear (not set) in the input bytes.
    @param bytes - The input Int32Array to check.
    @param bitPosition - The position of the bit to check (0-indexed).
    @returns true if the bit is not set, otherwise false.
    */
    static isBitClear(bytes, bitPosition) {
        return !Quality.isBitSet(bytes, bitPosition);
    }
    /**
  
  Checks whether all bits in the input bytes are clear (not set).
  @param bytes - The input Int32Array to check.
  @returns true if all bits are not set, otherwise false.
  */
    static isQualityClear(bytes) {
        return Quality.getInteger(bytes) == 0;
    }
    /**
  
  Checks whether the input intQuality is equal to 0.
  @param intQuality - The input integer representing the quality.
  @returns true if the input is 0, otherwise false.
  */
    static isQualityClear_int(intQuality) {
        return intQuality == 0;
    }
    /**
  
  Checks whether the bit at the specified bitPosition is set in the input intQuality.
  @param intQuality - The input integer representing the quality.
  @param bitPosition - The position of the bit to check (1-indexed).
  @returns true if the bit is set, otherwise false.
  */
    static isBitSet_int(intQuality, bitPosition) {
        return (intQuality & (1 << (bitPosition - 1))) != 0;
    }
    /**
  
  Checks whether the bit at the specified bitPosition is clear (not set) in the input intQuality.
  @param intQuality - The input integer representing the quality.
  @param bitPosition - The position of the bit to check (1-indexed).
  @returns true if the bit is not set, otherwise false.
  */
    static isBitClear_int(intQuality, bitPosition) {
        return (intQuality & (1 << (bitPosition - 1))) == 0;
    }
    /**
    Sets the bit at the specified bitPosition in the input intQuality.
    @param intQuality - The input integer representing the quality.
    @param bitPosition - The position of the bit to set (1-indexed).
    @returns The modified quality integer.
    */
    static setBit_int(intQuality, bitPosition) {
        return intQuality | (1 << (bitPosition - 1));
    }
    /**
    Clears (resets) the bit at the specified bitPosition in the input intQuality.
    @param intQuality - The input integer representing the quality.
    @param bitPosition - The position of the bit to clear (1-indexed).
    @returns The modified quality integer.
    */
    static clearBit_int(intQuality, bitPosition) {
        return intQuality & ~(1 << (bitPosition - 1));
    }
    /**
       Checks whether the bit at the specified bitPosition is set in the element at the specified elementIndex.
      @param elementIndex - The index of the element to check.
      @param bitPosition - The position of the bit to check (1-indexed).
      @returns true if the bit is set, otherwise false.
      @throws {RangeError} If the elementIndex is out of range.
    */
    isBitSet(elementIndex, bitPosition) {
        if (elementIndex > this._size || elementIndex < 0) {
            throw new RangeError("Index of: " + elementIndex + " Out of range[0 - " + this._size + "]");
        }
        const bytes = this.getElementAt(elementIndex);
        return Quality.isBitSet(bytes, bitPosition);
    }
    /**
   * Sets the specified bit position as 'screened' and clears the 'protected' bit
   * in the provided integer.
   *
   * @param intQuality The integer representing the quality with the bits to modify.
   * @returns The modified integer with the 'screened' bit set and 'protected' bit cleared.
   */
    static isBitSet(bytes, bitPosition) {
        const targetByte = Math.floor((32 - bitPosition) / 8);
        const targetBit = (bitPosition - 1) % 8;
        const base = bytes[targetByte];
        return (base & Quality.MASK[targetBit]) != 0;
    }
    /**
   * Checks if a specific bit is clear or not.
   * @param elementIndex - The index of the element to check.
   * @param bitPosition - The bit position to check.
   * @returns A boolean indicating whether the bit is clear or not.
   */
    isBitClear(elementIndex, bitPosition) {
        return !this.isBitSet(elementIndex, bitPosition);
    }
    /**
   * Returns a boolean indicating whether all bits in the provided Int32Array are clear (0).
   *
   * @param bytes The Int32Array representing the quality to check.
   * @returns True if all bits are clear, false otherwise.
   */
    isQualityClear(elementIndex) {
        return this.getIntegerAt(elementIndex) == 0;
    }
    /**
   * Sets a specific bit at the given position in an element.
   * @param elementIndex - The index of the element where the bit will be set.
   * @param bitPosition - The bit position to set.
   * @throws {RangeError} If the given element index is out of range.
   */
    setBit(elementIndex, bitPosition) {
        if (elementIndex > this._size || elementIndex < 0) {
            throw new RangeError("Index of: " + elementIndex + " Out of range[0 - " + this._size);
        }
        let bytes = this.getElementAt(elementIndex);
        bytes = Quality.setBit(bytes, bitPosition);
        this.setElementAt(bytes, elementIndex);
        return;
    }
    /**
   * Sets a specific bit at the given position in a byte array.
   * @param bytes - The byte array to set the bit in.
   * @param bitPosition - The bit position to set.
   * @returns The modified byte array.
   */
    static setBit(bytes, bitPosition) {
        const targetByte = Math.floor((32 - bitPosition) / 8);
        const base = bytes[targetByte];
        const targetBit = (bitPosition - 1) % 8;
        bytes[targetByte] = base | Quality.MASK[targetBit];
        return bytes;
    }
    /**
   * Clears a specific bit at the given position in an element.
   * @param elementIndex - The index of the element where the bit will be cleared.
   * @param bitPosition - The bit position to clear.
   * @throws {RangeError} If the given element index is out of range.
   */
    clearBit(elementIndex, bitPosition) {
        if (elementIndex > this._size || elementIndex < 0) {
            throw new RangeError("Index of: " + elementIndex + " Out of range[0 - " + this._size);
        }
        let bytes = this.getElementAt(elementIndex);
        bytes = Quality.clearBit(bytes, bitPosition);
        this.setElementAt(bytes, elementIndex);
        return;
    }
    /**
   * Clears a specific bit at the given position in a byte array.
   * @param bytes - The byte array to clear the bit in.
   * @param bitPosition - The bit position to clear.
   * @returns The modified byte array.
   */
    static clearBit(bytes, bitPosition) {
        const targetByte = Math.floor((32 - bitPosition) / 8);
        const base = bytes[targetByte];
        const targetBit = (bitPosition - 1) % 8;
        let result = base & Quality.MASK[targetBit];
        if (result != 0) {
            bytes[targetByte] = base ^ Quality.MASK[targetBit];
        }
        return bytes;
    }
    /**
    Checks if the element at the given index has been screened.
    @param elementIndex - Index of the element to check.
    @returns A boolean indicating whether the element has been screened.
    */
    isScreened(elementIndex) {
        return this.isBitSet(elementIndex, Quality.SCREENED_BIT);
    }
    /**
  
  Checks if the element at the given index has not been screened.
  @param elementIndex - Index of the element to check.
  @returns A boolean indicating whether the element has not been screened.
  */
    isNotScreened(elementIndex) {
        return this.isBitClear(elementIndex, Quality.SCREENED_BIT);
    }
    /**
  
  Clears all quality bits for the element at the given index.
  @param elementIndex - Index of the element to clear quality bits for.
  @returns void
  */
    clearQuality(elementIndex) {
        // Clear all quality bits
        let tmpBytes = this.getElementAt(elementIndex);
        let sizeInBytes = tmpBytes.length;
        if (sizeInBytes > 0) {
            const tmpByte = 0 & Quality.MASK_BYTE;
            for (let i = 0; i < sizeInBytes; i++) {
                tmpBytes[i] = tmpByte;
            }
            this.setElementAt(tmpBytes, elementIndex);
        }
    }
    /**
    Clears the screened bit for the element at the given index.
    @param elementIndex - Index of the element to clear the screened bit for.
    @returns void
    */
    clearScreened(elementIndex) {
        this.clearBit(elementIndex, Quality.SCREENED_BIT);
    }
    /**
    Sets the screened bit for the element at the given index.
    @param elementIndex - Index of the element to set the screened bit for.
    @returns void
    */
    setScreened(elementIndex) {
        this.setBit(elementIndex, Quality.SCREENED_BIT);
    }
    static isScreened(bytes) {
        return Quality.isBitSet(bytes, Quality.SCREENED_BIT);
    }
    static isScreened_int(intQuality) {
        return Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT);
    }
    static isNotScreened(bytes) {
        return Quality.isBitClear(bytes, Quality.SCREENED_BIT);
    }
    static isNotScreened_int(intQuality) {
        return Quality.isBitClear_int(intQuality, Quality.SCREENED_BIT);
    }
    static clearQuality(bytes) {
        // Clear all quality bits
        if (bytes === null) {
            return null;
        }
        const sizeInBytes = bytes.length;
        const tmpBytes = new Int32Array(sizeInBytes);
        if (sizeInBytes > 0) {
            const tmpByte = 0 & Quality.MASK_BYTE;
            for (let i = 0; i < sizeInBytes; i++) {
                tmpBytes[i] = tmpByte;
            }
        }
        return tmpBytes;
    }
    static clearQuality_int(qualityAsIntegers) {
        if (typeof qualityAsIntegers === "number") {
            return 0;
        }
        if (qualityAsIntegers === null) {
            return null;
        }
        for (let i = 0; i < qualityAsIntegers.length; ++i) {
            qualityAsIntegers[i] = 0;
        }
        return qualityAsIntegers;
    }
    static clearScreened(bytes) {
        return Quality.clearBit(bytes, Quality.SCREENED_BIT);
    }
    static clearScreened_int(intQuality) {
        return this.clearBit_int(intQuality, Quality.SCREENED_BIT);
    }
    static setScreened(bytes) {
        return Quality.setBit(bytes, Quality.SCREENED_BIT);
    }
    static setScreened_int(intQuality) {
        return Quality.setBit_int(intQuality, Quality.SCREENED_BIT);
    }
    isQuestion(elementIndex) {
        return (this.isScreened(elementIndex) &&
            this.isBitSet(elementIndex, Quality.QUESTION_BIT));
    }
    isNotQuestion(elementIndex) {
        return !this.isQuestion(elementIndex);
    }
    clearQuestion(elementIndex) {
        this.clearBit(elementIndex, Quality.QUESTION_BIT);
        this.setBit(elementIndex, Quality.SCREENED_BIT);
    }
    setQuestion(elementIndex) {
        this.setBit(elementIndex, Quality.QUESTION_BIT);
        this.clearBit(elementIndex, Quality.OKAY_BIT);
        this.clearBit(elementIndex, Quality.REJECT_BIT);
        this.clearBit(elementIndex, Quality.MISSING_BIT);
        this.setBit(elementIndex, Quality.SCREENED_BIT);
    }
    static isQuestion(bytes) {
        return this.isScreened(bytes) && this.isBitSet(bytes, Quality.QUESTION_BIT);
    }
    static isQuestion_int(intQuality) {
        return (Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT) &&
            Quality.isBitSet_int(intQuality, Quality.QUESTION_BIT));
    }
    static isNotQuestion(bytes) {
        if (!Quality.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotQuestion> Element not screened: " + bytes);
        }
        return !Quality.isQuestion(bytes);
    }
    static isNotQuestion_int(intQuality) {
        if (!Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotQuestion_int> Element not screened: " + intQuality);
        }
        return !Quality.isQuestion_int(intQuality);
    }
    static clearQuestion(bytes) {
        let tmp = Quality.clearBit(bytes, Quality.QUESTION_BIT);
        return Quality.setBit(tmp, Quality.SCREENED_BIT);
    }
    static clearQuestion_int(intQuality) {
        return this.setBit_int(this.clearBit_int(intQuality, Quality.QUESTION_BIT), Quality.SCREENED_BIT);
    }
    static setQuestion(bytes) {
        let tmp = this.setBit(bytes, Quality.QUESTION_BIT);
        tmp = this.clearBit(tmp, Quality.OKAY_BIT);
        tmp = this.clearBit(tmp, Quality.MISSING_BIT);
        tmp = this.clearBit(tmp, Quality.REJECT_BIT);
        return this.setBit(tmp, Quality.SCREENED_BIT);
    }
    static setQuestion_int(intQuality) {
        let tmp = this.setBit_int(intQuality, Quality.QUESTION_BIT);
        tmp = this.clearBit_int(tmp, Quality.OKAY_BIT);
        tmp = this.clearBit_int(tmp, Quality.MISSING_BIT);
        tmp = this.clearBit_int(tmp, Quality.REJECT_BIT);
        return this.setBit_int(tmp, Quality.SCREENED_BIT);
    }
    isReject(elementIndex) {
        return (this.isScreened(elementIndex) &&
            this.isBitSet(elementIndex, Quality.REJECT_BIT));
    }
    isNotReject(elementIndex) {
        return !this.isReject(elementIndex);
    }
    clearReject(elementIndex) {
        this.clearBit(elementIndex, Quality.REJECT_BIT);
        this.setBit(elementIndex, Quality.SCREENED_BIT);
    }
    setReject(elementIndex) {
        this.setBit(elementIndex, Quality.REJECT_BIT);
        this.clearBit(elementIndex, Quality.OKAY_BIT);
        this.clearBit(elementIndex, Quality.QUESTION_BIT);
        this.clearBit(elementIndex, Quality.MISSING_BIT);
        this.setBit(elementIndex, Quality.SCREENED_BIT);
    }
    clearRange(elementIndex) {
        this.clearBit(elementIndex, Quality.RANGE_OF_VALUE_BIT0);
        this.clearBit(elementIndex, Quality.RANGE_OF_VALUE_BIT1);
    }
    setRange0(elementIndex) {
        // Range of value is below first limit
        // Set value = 0 as bit pattern 00
        this.clearBit(elementIndex, Quality.RANGE_OF_VALUE_BIT0);
        this.clearBit(elementIndex, Quality.RANGE_OF_VALUE_BIT1);
    }
    setRange1(elementIndex) {
        // Range of value is between first and second limits
        // Set value = 1 as bit pattern 01
        this.setBit(elementIndex, Quality.RANGE_OF_VALUE_BIT0);
        this.clearBit(elementIndex, Quality.RANGE_OF_VALUE_BIT1);
    }
    setRange2(elementIndex) {
        // Range of value is between second and third limits
        // Set value = 2 as bit pattern 10
        this.clearBit(elementIndex, Quality.RANGE_OF_VALUE_BIT0);
        this.setBit(elementIndex, Quality.RANGE_OF_VALUE_BIT1);
    }
    setRange3(elementIndex) {
        // Range of value is greater than the third limit
        // Set value = 3 as bit pattern 11
        this.setBit(elementIndex, Quality.RANGE_OF_VALUE_BIT0);
        this.setBit(elementIndex, Quality.RANGE_OF_VALUE_BIT1);
    }
    isDifferentValue(elementIndex) {
        return this.isBitSet(elementIndex, Quality.VALUE_DIFFERS_BIT);
    }
    isNotDifferentValue(elementIndex) {
        return !this.isDifferentValue(elementIndex);
    }
    clearDifferentValue(elementIndex) {
        // Value same as original value
        this.clearBit(elementIndex, Quality.VALUE_DIFFERS_BIT);
    }
    setDifferentValue(elementIndex) {
        // Value differs from original value
        // Once set cannot be cleared, except by clearQuality
        this.setBit(elementIndex, Quality.VALUE_DIFFERS_BIT);
    }
    isRevised(elementIndex) {
        // Is Revised if
        // differs from original value,
        // is manually entered, or
        // has a replacement method set
        if (!this.isBitSet(elementIndex, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isRevised> Attempted to determine if a value was revised when the screened bit was not set. Index: " +
                elementIndex);
        }
        return (this.isDifferentValue(elementIndex) ||
            (this.isBitSet(elementIndex, Quality.HOW_REVISED_BIT0) &&
                this.isBitSet(elementIndex, Quality.HOW_REVISED_BIT1) &&
                !this.isBitSet(elementIndex, Quality.HOW_REVISED_BIT2)) ||
            this.isBitSet(elementIndex, Quality.REPLACE_METHOD_BIT0) ||
            this.isBitSet(elementIndex, Quality.REPLACE_METHOD_BIT1) ||
            this.isBitSet(elementIndex, Quality.REPLACE_METHOD_BIT2) ||
            this.isBitSet(elementIndex, Quality.REPLACE_METHOD_BIT3));
    }
    isNotRevised(elementIndex) {
        return !this.isRevised(elementIndex);
    }
    clearHowRevised(elementIndex) {
        this.clearBit(elementIndex, Quality.HOW_REVISED_BIT0);
        this.clearBit(elementIndex, Quality.HOW_REVISED_BIT1);
        this.clearBit(elementIndex, Quality.HOW_REVISED_BIT2);
    }
    clearReplaceMethod(elementIndex) {
        this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT0);
        this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT1);
        this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT2);
        this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT3);
    }
    setRevisedNoRevision(elementIndex) {
        this.clearHowRevised(elementIndex);
    }
    setReplaceNoRevision(elementIndex) {
        this.clearReplaceMethod(elementIndex);
    }
    setNoRevision(elementIndex) {
        this.setRevisedNoRevision(elementIndex);
        this.setReplaceNoRevision(elementIndex);
    }
    setRevisedAutomatically(elementIndex) {
        // DATCHK or Automatic Process has performed revision
        // Set value = 1 as bit pattern 001
        this.setOkay(elementIndex);
        this.setDifferentValue(elementIndex);
        this.setBit(elementIndex, Quality.HOW_REVISED_BIT0);
        this.clearBit(elementIndex, Quality.HOW_REVISED_BIT1);
        this.clearBit(elementIndex, Quality.HOW_REVISED_BIT2);
    }
    static isRevisedInteractivelyCheckAllBits(bytes) {
        return (Quality.isBitSet(bytes, Quality.SCREENED_BIT) &&
            Quality.isBitSet(bytes, Quality.OKAY_BIT) &&
            Quality.isBitClear(bytes, Quality.MISSING_BIT) &&
            Quality.isBitClear(bytes, Quality.QUESTION_BIT) &&
            Quality.isBitClear(bytes, Quality.REJECT_BIT) &&
            Quality.isBitSet(bytes, Quality.VALUE_DIFFERS_BIT) &&
            Quality.isRevisedInteractively(bytes));
    }
    static isRevisedInteractivelyCheckAllBits_int(intQuality) {
        return (Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT) &&
            Quality.isBitSet_int(intQuality, Quality.OKAY_BIT) &&
            Quality.isBitClear_int(intQuality, Quality.MISSING_BIT) &&
            Quality.isBitClear_int(intQuality, Quality.QUESTION_BIT) &&
            Quality.isBitClear_int(intQuality, Quality.REJECT_BIT) &&
            Quality.isBitSet_int(intQuality, Quality.VALUE_DIFFERS_BIT) &&
            Quality.isRevisedInteractively_int(intQuality));
    }
    static isRevisedInteractively(bytes) {
        // DATVUE or Interactive Process has performed revision
        // Value = 2 as bit pattern 010
        return (Quality.isBitClear(bytes, Quality.HOW_REVISED_BIT0) &&
            Quality.isBitSet(bytes, Quality.HOW_REVISED_BIT1) &&
            Quality.isBitClear(bytes, Quality.HOW_REVISED_BIT2));
    }
    static isRevisedInteractively_int(intQuality) {
        // DATVUE or Interactive Process has performed revision
        // Value = 2 as bit pattern 010
        return (Quality.isBitClear_int(intQuality, Quality.HOW_REVISED_BIT0) &&
            Quality.isBitSet_int(intQuality, Quality.HOW_REVISED_BIT1) &&
            Quality.isBitClear_int(intQuality, Quality.HOW_REVISED_BIT2));
    }
    setRevisedInteractively(elementIndex) {
        // DATVUE or Interactive Process has performed revision
        // Set value = 2 as bit pattern 010
        this.setOkay(elementIndex);
        this.setDifferentValue(elementIndex);
        this.clearBit(elementIndex, Quality.HOW_REVISED_BIT0);
        this.setBit(elementIndex, Quality.HOW_REVISED_BIT1);
        this.clearBit(elementIndex, Quality.HOW_REVISED_BIT2);
    }
    setRevisedManually(elementIndex) {
        // DATVUE or Interactive Process has performed manual revision
        // Set value = 3 as bit pattern 011
        this.setOkay(elementIndex);
        this.setDifferentValue(elementIndex);
        this.setBit(elementIndex, Quality.HOW_REVISED_BIT0);
        this.setBit(elementIndex, Quality.HOW_REVISED_BIT1);
        this.clearBit(elementIndex, Quality.HOW_REVISED_BIT2);
    }
    /**
     * setRevisedToOriginalAccepted Function Sets Quality Bits to: Screened Bit
     * on Okay Bit on How Revised Bits to "Original Value Accepted in DATVUE or
     * Interactive Process Replace Bits to "No Revision" Does not change status
     * of other bits
     */
    setRevisedToOriginalAccepted(elementIndex) {
        // DATVUE or Interactive Process has accepted original value
        // Set value = 4 as bit pattern 100
        this.setOkay(elementIndex);
        this.clearBit(elementIndex, Quality.HOW_REVISED_BIT0);
        this.clearBit(elementIndex, Quality.HOW_REVISED_BIT1);
        this.setBit(elementIndex, Quality.HOW_REVISED_BIT2);
        this.clearReplaceMethod(elementIndex);
    }
    setReplaceLinearInterpolation(elementIndex) {
        // Replacement method is linear interpolation
        // Set value = 1 as bit pattern 0001
        this.setOkay(elementIndex);
        this.setDifferentValue(elementIndex);
        this.setBit(elementIndex, Quality.REPLACE_METHOD_BIT0);
        this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT1);
        this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT2);
        this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT3);
    }
    setReplaceManualChange(elementIndex) {
        // Replacement method is manual Change
        // Set value = 2 as bit pattern 0010
        this.setOkay(elementIndex);
        this.setDifferentValue(elementIndex);
        this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT0);
        this.setBit(elementIndex, Quality.REPLACE_METHOD_BIT1);
        this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT2);
        this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT3);
    }
    setReplaceGraphicalChange(elementIndex) {
        // Replacement method is graphical Change
        // Set value = 4 as bit pattern 0100
        this.setOkay(elementIndex);
        this.setDifferentValue(elementIndex);
        this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT0);
        this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT1);
        this.setBit(elementIndex, Quality.REPLACE_METHOD_BIT2);
        this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT3);
    }
    setReplaceWithMissing(elementIndex) {
        // Replacement method is replace with missing
        // Set value = 3 as bit pattern 0011
        this.setMissing(elementIndex);
        this.setDifferentValue(elementIndex);
        this.setBit(elementIndex, Quality.REPLACE_METHOD_BIT0);
        this.setBit(elementIndex, Quality.REPLACE_METHOD_BIT1);
        this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT2);
        this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT3);
    }
    static isReject(bytes) {
        return (Quality.isScreened(bytes) && Quality.isBitSet(bytes, Quality.REJECT_BIT));
    }
    static isReject_int(intQuality) {
        return (Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT) &&
            Quality.isBitSet_int(intQuality, Quality.REJECT_BIT));
    }
    static isNotReject(bytes) {
        return !Quality.isReject(bytes);
    }
    static isNotReject_int(intQuality) {
        if (!this.isBitSet_int(intQuality, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotReject_int> Element not screened: " + intQuality);
        }
        return !Quality.isReject_int(intQuality);
    }
    static clearReject(bytes) {
        let tmp = Quality.clearBit(bytes, Quality.REJECT_BIT);
        return Quality.setBit(tmp, Quality.SCREENED_BIT);
    }
    static clearReject_int(intQuality) {
        return Quality.setBit_int(Quality.clearBit_int(intQuality, Quality.REJECT_BIT), Quality.SCREENED_BIT);
    }
    static setReject(bytes) {
        let tmp = Quality.setBit(bytes, Quality.REJECT_BIT);
        tmp = Quality.clearBit(tmp, Quality.OKAY_BIT);
        tmp = Quality.clearBit(tmp, Quality.QUESTION_BIT);
        tmp = Quality.clearBit(tmp, Quality.MISSING_BIT);
        return Quality.setBit(tmp, Quality.SCREENED_BIT);
    }
    static setReject_int(intQuality) {
        let tmp = Quality.setBit_int(intQuality, Quality.REJECT_BIT);
        tmp = Quality.clearBit_int(tmp, Quality.OKAY_BIT);
        tmp = Quality.clearBit_int(tmp, Quality.QUESTION_BIT);
        tmp = Quality.clearBit_int(tmp, Quality.MISSING_BIT);
        return Quality.setBit_int(tmp, Quality.SCREENED_BIT);
    }
    static clearRange(bytes) {
        const tmp = Quality.clearBit(bytes, Quality.RANGE_OF_VALUE_BIT0);
        return Quality.clearBit(tmp, Quality.RANGE_OF_VALUE_BIT1);
    }
    static clearRange_int(intQuality) {
        return Quality.clearBit_int(Quality.clearBit_int(intQuality, Quality.RANGE_OF_VALUE_BIT0), Quality.RANGE_OF_VALUE_BIT1);
    }
    static setRange0(bytes) {
        // Range of value is below first limit
        // Set value = 0 as bit pattern 00
        const tmp = Quality.clearBit(bytes, Quality.RANGE_OF_VALUE_BIT0);
        return Quality.clearBit(tmp, Quality.RANGE_OF_VALUE_BIT1);
    }
    static setRange0_int(intQuality) {
        // Range of value is below first limit
        // Set value = 0 as bit pattern 00
        return Quality.clearBit_int(Quality.clearBit_int(intQuality, Quality.RANGE_OF_VALUE_BIT0), Quality.RANGE_OF_VALUE_BIT1);
    }
    static isRange1(bytes) {
        // Range of value is between first and second limits
        // Value = 1 as bit pattern 01
        return (Quality.isBitSet(bytes, Quality.RANGE_OF_VALUE_BIT0) &&
            Quality.isBitClear(bytes, Quality.RANGE_OF_VALUE_BIT1));
    }
    static isRange1_int(intQuality) {
        // Range of value is between first and second limits
        // Value = 1 as bit pattern 01
        return (Quality.isBitSet_int(intQuality, Quality.RANGE_OF_VALUE_BIT0) &&
            Quality.isBitClear_int(intQuality, Quality.RANGE_OF_VALUE_BIT1));
    }
    static setRange1(bytes) {
        // Range of value is between first and second limits
        // Set value = 1 as bit pattern 01
        const tmp = Quality.setBit(bytes, Quality.RANGE_OF_VALUE_BIT0);
        return Quality.clearBit(tmp, Quality.RANGE_OF_VALUE_BIT1);
    }
    static setRange1_int(intQuality) {
        // Range of value is between first and second limits
        // Set value = 1 as bit pattern 01
        return Quality.clearBit_int(Quality.setBit_int(intQuality, Quality.RANGE_OF_VALUE_BIT0), Quality.RANGE_OF_VALUE_BIT1);
    }
    static isRange2(bytes) {
        // Range of value is between second and third limits
        // Value = 2 as bit pattern 10
        return (Quality.isBitClear(bytes, Quality.RANGE_OF_VALUE_BIT0) &&
            Quality.isBitSet(bytes, Quality.RANGE_OF_VALUE_BIT1));
    }
    static isRange2_int(intQuality) {
        // Range of value is between second and third limits
        // Value = 2 as bit pattern 10
        return (Quality.isBitClear_int(intQuality, Quality.RANGE_OF_VALUE_BIT0) &&
            Quality.isBitSet_int(intQuality, Quality.RANGE_OF_VALUE_BIT1));
    }
    static setRange2(bytes) {
        // Range of value is between second and third limits
        // Set value = 2 as bit pattern 10
        const tmp = Quality.clearBit(bytes, Quality.RANGE_OF_VALUE_BIT0);
        return Quality.setBit(tmp, Quality.RANGE_OF_VALUE_BIT1);
    }
    static setRange2_int(intQuality) {
        // Range of value is between second and third limits
        // Set value = 2 as bit pattern 10
        return Quality.setBit_int(Quality.clearBit_int(intQuality, Quality.RANGE_OF_VALUE_BIT0), Quality.RANGE_OF_VALUE_BIT1);
    }
    static isRange3(bytes) {
        // Range of value is between second and third limits
        // Value = 3 as bit pattern 11
        return (Quality.isBitSet(bytes, Quality.RANGE_OF_VALUE_BIT0) &&
            Quality.isBitSet(bytes, Quality.RANGE_OF_VALUE_BIT1));
    }
    static isRange3_int(intQuality) {
        // Range of value is between second and third limits
        // Value = 3 as bit pattern 11
        return (Quality.isBitSet_int(intQuality, Quality.RANGE_OF_VALUE_BIT0) &&
            Quality.isBitSet_int(intQuality, Quality.RANGE_OF_VALUE_BIT1));
    }
    static setRange3(bytes) {
        // Range of value is between second and third limits
        // Set value = 3 as bit pattern 11
        const tmp = Quality.setBit(bytes, Quality.RANGE_OF_VALUE_BIT0);
        return Quality.setBit(tmp, Quality.RANGE_OF_VALUE_BIT1);
    }
    static setRange3_int(intQuality) {
        // Range of value is between second and third limits
        // Set value = 3 as bit pattern 11
        return Quality.setBit_int(Quality.setBit_int(intQuality, Quality.RANGE_OF_VALUE_BIT0), Quality.RANGE_OF_VALUE_BIT1);
    }
    static isDifferentValue(bytes) {
        return Quality.isBitSet(bytes, Quality.VALUE_DIFFERS_BIT);
    }
    static isDifferentValue_int(intQuality) {
        return Quality.isBitSet_int(intQuality, Quality.VALUE_DIFFERS_BIT);
    }
    static isNotDifferentValue(bytes) {
        return !Quality.isDifferentValue(bytes);
    }
    static isNotDifferentValue_int(intQuality) {
        return !Quality.isDifferentValue_int(intQuality);
    }
    static clearDifferentValue(bytes) {
        // Value same as original value
        return Quality.clearBit(bytes, Quality.VALUE_DIFFERS_BIT);
    }
    static clearDifferentValue_int(intQuality) {
        // Value same as original value
        return Quality.clearBit_int(intQuality, Quality.VALUE_DIFFERS_BIT);
    }
    static setDifferentValue(bytes) {
        // Value differs from original value
        // Once set cannot be cleared, except by clearQuality
        return Quality.setBit(bytes, Quality.VALUE_DIFFERS_BIT);
    }
    static setDifferentValue_int(intQuality) {
        // Value differs from original value
        // Once set cannot be cleared, except by clearQuality
        return Quality.setBit_int(intQuality, Quality.VALUE_DIFFERS_BIT);
    }
    static isRevised(bytes) {
        if (!this.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isRevised> Element not screened: " + bytes);
        }
        // Is Revised if
        // differs from original value,
        // is manually entered, or
        // has a replacement method set
        return (Quality.isDifferentValue(bytes) ||
            (Quality.isBitSet(bytes, Quality.HOW_REVISED_BIT0) &&
                Quality.isBitSet(bytes, Quality.HOW_REVISED_BIT1) &&
                !Quality.isBitSet(bytes, Quality.HOW_REVISED_BIT2)) ||
            Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT0) ||
            Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT1) ||
            Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT2) ||
            Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT3));
    }
    static isRevised_int(intQuality) {
        if (!Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotRelativeMagnitude_int> Element not screened: " +
                intQuality);
        }
        // Is Revised if
        // differs from original value,
        // is manually entered, or
        // has a replacement method set
        return (Quality.isDifferentValue_int(intQuality) ||
            (Quality.isBitSet_int(intQuality, Quality.HOW_REVISED_BIT0) &&
                Quality.isBitSet_int(intQuality, Quality.HOW_REVISED_BIT1) &&
                !Quality.isBitSet_int(intQuality, Quality.HOW_REVISED_BIT2)) ||
            Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT0) ||
            Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT1) ||
            Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT2) ||
            Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT3));
    }
    static isNotRevised(bytes) {
        if (!this.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotRevised> Element not screened: " + bytes);
        }
        return !Quality.isRevised(bytes);
    }
    static isNotRevised_int(intQuality) {
        if (!Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotRevised> Element not screened: " + intQuality);
        }
        return !Quality.isRevised_int(intQuality);
    }
    static clearHowRevised(bytes) {
        let tmp = Quality.clearBit(bytes, Quality.HOW_REVISED_BIT0);
        tmp = Quality.clearBit(tmp, Quality.HOW_REVISED_BIT1);
        return Quality.clearBit(tmp, Quality.HOW_REVISED_BIT2);
    }
    static clearHowRevised_int(intQuality) {
        let tmp = Quality.clearBit_int(intQuality, Quality.HOW_REVISED_BIT0);
        tmp = Quality.clearBit_int(tmp, Quality.HOW_REVISED_BIT1);
        return Quality.clearBit_int(tmp, Quality.HOW_REVISED_BIT2);
    }
    static clearReplaceMethod(bytes) {
        let tmp = Quality.clearBit(bytes, Quality.REPLACE_METHOD_BIT0);
        tmp = Quality.clearBit(tmp, Quality.REPLACE_METHOD_BIT1);
        tmp = Quality.clearBit(tmp, Quality.REPLACE_METHOD_BIT2);
        return Quality.clearBit(tmp, Quality.REPLACE_METHOD_BIT3);
    }
    static clearReplaceMethod_int(intQuality) {
        let tmp = Quality.clearBit_int(intQuality, Quality.REPLACE_METHOD_BIT0);
        tmp = Quality.clearBit_int(tmp, Quality.REPLACE_METHOD_BIT1);
        tmp = Quality.clearBit_int(tmp, Quality.REPLACE_METHOD_BIT2);
        return Quality.clearBit_int(tmp, Quality.REPLACE_METHOD_BIT3);
    }
    static setReplaceNoRevision(bytes) {
        return Quality.clearReplaceMethod(bytes);
    }
    static setReplaceNoRevision_int(intQuality) {
        return Quality.clearReplaceMethod_int(intQuality);
    }
    static setNoRevision(bytes) {
        const tmp = Quality.clearHowRevised(bytes);
        return Quality.clearReplaceMethod(tmp);
    }
    static setNoRevision_int(intQuality) {
        const tmp = Quality.clearHowRevised_int(intQuality);
        return Quality.clearReplaceMethod_int(tmp);
    }
    static setRevisedAutomatically(bytes) {
        // DATCHK or Automatic Process has performed revision
        // Set value = 1 as bit pattern 001
        Quality.setOkay(bytes);
        Quality.setDifferentValue(bytes);
        let tmp = Quality.setBit(bytes, Quality.HOW_REVISED_BIT0);
        tmp = Quality.clearBit(tmp, Quality.HOW_REVISED_BIT1);
        return Quality.clearBit(tmp, Quality.HOW_REVISED_BIT2);
    }
    static setRevisedAutomatically_int(intQuality) {
        // DATCHK or Automatic Process has performed revision
        // Set value = 1 as bit pattern 001
        let tmp = Quality.setOkay_int(intQuality);
        tmp = Quality.setDifferentValue_int(tmp);
        tmp = Quality.setBit_int(intQuality, Quality.HOW_REVISED_BIT0);
        tmp = Quality.clearBit_int(tmp, Quality.HOW_REVISED_BIT1);
        return Quality.clearBit_int(tmp, Quality.HOW_REVISED_BIT2);
    }
    static isRevisedAutomaticallyCheckAllBits(bytes) {
        return (Quality.isBitSet(bytes, Quality.SCREENED_BIT) &&
            Quality.isBitSet(bytes, Quality.OKAY_BIT) &&
            Quality.isBitClear(bytes, Quality.MISSING_BIT) &&
            Quality.isBitClear(bytes, Quality.QUESTION_BIT) &&
            Quality.isBitClear(bytes, Quality.REJECT_BIT) &&
            Quality.isBitSet(bytes, Quality.VALUE_DIFFERS_BIT) &&
            Quality.isRevisedAutomatically(bytes));
    }
    static isRevisedAutomaticallyCheckAllBits_int(intQuality) {
        return (Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT) &&
            Quality.isBitSet_int(intQuality, Quality.OKAY_BIT) &&
            Quality.isBitClear_int(intQuality, Quality.MISSING_BIT) &&
            Quality.isBitClear_int(intQuality, Quality.QUESTION_BIT) &&
            Quality.isBitClear_int(intQuality, Quality.REJECT_BIT) &&
            Quality.isBitSet_int(intQuality, Quality.VALUE_DIFFERS_BIT) &&
            Quality.isRevisedAutomatically_int(intQuality));
    }
    static isRevisedAutomatically(bytes) {
        // DATCHK or Automatic Process has performed revision
        // value = 1 as bit pattern 001
        return (Quality.isBitSet(bytes, Quality.HOW_REVISED_BIT0) &&
            Quality.isBitClear(bytes, Quality.HOW_REVISED_BIT1) &&
            Quality.isBitClear(bytes, Quality.HOW_REVISED_BIT2));
    }
    static isRevisedAutomatically_int(intQuality) {
        // DATCHK or Automatic Process has performed revision
        // value = 1 as bit pattern 001
        return (Quality.isBitSet_int(intQuality, Quality.HOW_REVISED_BIT0) &&
            Quality.isBitClear_int(intQuality, Quality.HOW_REVISED_BIT1) &&
            Quality.isBitClear_int(intQuality, Quality.HOW_REVISED_BIT2));
    }
    static setRevisedInteractively(bytes) {
        // DATVUE or Interactive Process has performed revision
        // Set value = 2 as bit pattern 010
        Quality.setOkay(bytes);
        Quality.setDifferentValue(bytes);
        let tmp = Quality.clearBit(bytes, Quality.HOW_REVISED_BIT0);
        tmp = Quality.setBit(tmp, Quality.HOW_REVISED_BIT1);
        return Quality.clearBit(tmp, Quality.HOW_REVISED_BIT2);
    }
    static setRevisedInteractively_int(intQuality) {
        // DATVUE or Interactive Process has performed revision
        // Set value = 2 as bit pattern 010
        let tmp = Quality.setOkay_int(intQuality);
        tmp = Quality.setDifferentValue_int(intQuality);
        tmp = Quality.clearBit_int(intQuality, Quality.HOW_REVISED_BIT0);
        tmp = Quality.setBit_int(tmp, Quality.HOW_REVISED_BIT1);
        return Quality.clearBit_int(tmp, Quality.HOW_REVISED_BIT2);
    }
    static isRevisedManuallyCheckAllBits(bytes) {
        return (Quality.isBitSet(bytes, Quality.SCREENED_BIT) &&
            Quality.isBitSet(bytes, Quality.OKAY_BIT) &&
            Quality.isBitClear(bytes, Quality.MISSING_BIT) &&
            Quality.isBitClear(bytes, Quality.QUESTION_BIT) &&
            Quality.isBitClear(bytes, Quality.REJECT_BIT) &&
            Quality.isBitSet(bytes, Quality.VALUE_DIFFERS_BIT) &&
            Quality.isRevisedManually(bytes));
    }
    static isRevisedManually(bytes) {
        // DATVUE or Interactive Process has performed revision
        // Value = 3 as bit pattern 011
        return (Quality.isBitSet(bytes, Quality.HOW_REVISED_BIT0) &&
            Quality.isBitSet(bytes, Quality.HOW_REVISED_BIT1) &&
            Quality.isBitClear(bytes, Quality.HOW_REVISED_BIT2));
    }
    static isRevisedManuallyCheckAllBits_int(intQuality) {
        return (Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT) &&
            Quality.isBitSet_int(intQuality, Quality.OKAY_BIT) &&
            Quality.isBitClear_int(intQuality, Quality.MISSING_BIT) &&
            Quality.isBitClear_int(intQuality, Quality.QUESTION_BIT) &&
            Quality.isBitClear_int(intQuality, Quality.REJECT_BIT) &&
            Quality.isBitSet_int(intQuality, Quality.VALUE_DIFFERS_BIT) &&
            Quality.isRevisedManually_int(intQuality));
    }
    static isRevisedManually_int(intQuality) {
        // DATVUE or Interactive Process has performed revision
        // Value = 3 as bit pattern 011
        return (Quality.isBitSet_int(intQuality, Quality.HOW_REVISED_BIT0) &&
            Quality.isBitSet_int(intQuality, Quality.HOW_REVISED_BIT1) &&
            Quality.isBitClear_int(intQuality, Quality.HOW_REVISED_BIT2));
    }
    static setRevisedManually(bytes) {
        // DATVUE or Interactive Process has performed revision
        // Set value = 3 as bit pattern 011
        Quality.setOkay(bytes);
        Quality.setDifferentValue(bytes);
        let tmp = Quality.setBit(bytes, Quality.HOW_REVISED_BIT0);
        tmp = Quality.setBit(tmp, Quality.HOW_REVISED_BIT1);
        return Quality.clearBit(tmp, Quality.HOW_REVISED_BIT2);
    }
    static setRevisedManually_int(intQuality) {
        // DATVUE or Interactive Process has performed revision
        // Set value = 3 as bit pattern 011
        let tmp = Quality.setOkay_int(intQuality);
        tmp = Quality.setDifferentValue_int(intQuality);
        tmp = Quality.setBit_int(intQuality, Quality.HOW_REVISED_BIT0);
        tmp = Quality.setBit_int(tmp, Quality.HOW_REVISED_BIT1);
        return Quality.clearBit_int(tmp, Quality.HOW_REVISED_BIT2);
    }
    /**
     * setUsingQualityFlags (For use by Validation Editor) Method Sets Quality
     * Bits based on a string of quality flags The incoming original quality
     * bytes are first copied into this quality object, then any quality flag
     * letters will be used to overlay the original quality Quality Flag Letters
     * A = Okay bit is set, clears M, Q, and R bits. If value differs bit is not
     * set, sets revised bits to decimal 4 (original value accepted) and replace
     * method bits to decimal 0 (No Revision) M = Missing bit is set, clears A,
     * Q, and R bits. Q = Questioned bit is set, clears A, M, and R bits. R =
     * Reject bit is set, clears A, M, and Q bits. E = Sets how revised bits to
     * decimal 3 (manual entry in CWMS Editor), replace method bits to decimal 4
     * (replaced with graphical edit), and and value differs bit (current value
     * differs from original). I = Sets how revised bits to decimal 2 (revised
     * by CWMS Editor), replace method bits to decimal 1 (replaced with linear
     * interpolation), and and value differs bit (current value differs from
     * original). K = Sets how revised bits to decimal 2 (revised by CWMS
     * Editor), replace method bits to decimal 3 (replaced with manual change),
     * and and value differs bit (current value differs from original). P = Sets
     * protection bit on. U = Sets protection bit off.
     */
    setUsingQualityFlags(originalBytes, elementIndex, qualFlag, isValueRevised) {
        const qual = Quality.getQualUsingFlags(originalBytes, qualFlag, isValueRevised);
        this.setElementAt(qual, elementIndex);
    }
    static getQualUsingFlags(originalBytes, qualFlag, isValueRevised) {
        // Set Data Quality Bits
        const newbytes = new Int32Array(4);
        newbytes.set(originalBytes.slice(0, 4));
        if (qualFlag.indexOf("A") > -1) {
            if (isValueRevised) {
                Quality.setRevisedManually(newbytes);
            }
            if (!Quality.isDifferentValue(newbytes)) {
                Quality.setRevisedToOriginalAccepted(newbytes);
            }
            Quality.setOkay(newbytes);
        }
        else if (qualFlag.indexOf("M") > -1) {
            if (isValueRevised) {
                Quality.setRevisedManually(newbytes);
            }
            Quality.setMissing(newbytes);
            // QualityTx.setReplaceWithMissing(newbytes);
        }
        else if (qualFlag.indexOf("Q") > -1) {
            if (isValueRevised) {
                Quality.setRevisedManually(newbytes);
            }
            Quality.setQuestion(newbytes);
        }
        else if (qualFlag.indexOf("R") > -1) {
            if (isValueRevised) {
                Quality.setRevisedManually(newbytes);
            }
            Quality.setReject(newbytes);
        }
        // Set How Revised, Replacement Method, and Protection bits
        return Quality.getQualUsingReviseReplaceFlags(newbytes, qualFlag, isValueRevised);
    }
    /**
     * setUsingReviseReplaceFlags (For use by Time Series Editor) Method Sets
     * Quality Revision/Replacement Method Bits based on a string of quality
     * flags (K, E, I,or P). Ignors any data quality flag letters (A,M,Q,R). The
     * incomming original quality bytes are first copied into this quality
     * object, then any quality flag letters will be used to overlay the
     * original quality
     * <p>
     * Quality Flag Letters E = Sets how revised bits to decimal 3 (manual entry
     * in CWMS Editor), replace method bits to decimal 4 (replaced with
     * graphical edit), and and value differs bit (current value differs from
     * original). I = Sets how revised bits to decimal 2 (revised by CWMS
     * Editor), replace method bits to decimal 1 (replaced with linear
     * interpolation), and and value differs bit (current value differs from
     * original). K = Sets how revised bits to decimal 2 (revised by CWMS
     * Editor), replace method bits to decimal 3 (replaced with manual change),
     * and and value differs bit (current value differs from original). P = Sets
     * protection bit on. U = Sets protection bit off.
     */
    setUsingReviseReplaceFlags(originalBytes, elementIndex, qualFlag, isValueRevised) {
        const newbytes = Quality.getQualUsingReviseReplaceFlags(originalBytes, qualFlag, isValueRevised);
        this.setElementAt(newbytes, elementIndex);
    }
    static getQualUsingReviseReplaceFlags(originalBytes, qualFlag, isValueRevised) {
        const newBytes = new Int32Array(4);
        newBytes.set(originalBytes.slice(0, 4));
        // Set How Revised/Replacement Method Bits
        if (qualFlag.indexOf("E") > -1) {
            Quality.setRevisedManually(newBytes);
            Quality.setReplaceGraphicalChange(newBytes);
        }
        else if (qualFlag.indexOf("I") > -1) {
            Quality.setRevisedInteractively(newBytes);
            Quality.setReplaceLinearInterpolation(newBytes);
        }
        else if (qualFlag.indexOf("K") > -1) {
            Quality.setRevisedManually(newBytes);
            Quality.setReplaceManualChange(newBytes);
        }
        // Set Protection Bit
        if (qualFlag.indexOf("P") > -1) {
            Quality.setProtected(newBytes);
        }
        else if (qualFlag.indexOf("U") > -1) {
            Quality.clearProtected(newBytes);
        }
        return newBytes;
    }
    /**
     * setRevisedToOriginalAccepted Function Sets Quality Bits to: Screened Bit
     * on Quality Bits to Okay How Revised Bits to "Original Value Accepted in
     * DATVUE or Interactive Process Replace Bits to "No Revision" Does not
     * change status of other bits
     */
    static setRevisedToOriginalAccepted(bytes) {
        // DATVUE or Interactive Process has accepted original value
        // Set value = 4 as bit pattern 100
        Quality.setOkay(bytes);
        let tmp = Quality.clearBit(bytes, Quality.HOW_REVISED_BIT0);
        tmp = Quality.clearBit(tmp, Quality.HOW_REVISED_BIT1);
        tmp = Quality.setBit(tmp, Quality.HOW_REVISED_BIT2);
        return Quality.setReplaceNoRevision(tmp);
    }
    static setRevisedToOriginalAccepted_int(intQuality) {
        // DATVUE or Interactive Process has accepted original value
        // Set value = 4 as bit pattern 100
        let tmp = Quality.setOkay_int(intQuality);
        tmp = Quality.clearBit_int(intQuality, Quality.HOW_REVISED_BIT0);
        tmp = Quality.clearBit_int(tmp, Quality.HOW_REVISED_BIT1);
        tmp = Quality.setBit_int(tmp, Quality.HOW_REVISED_BIT2);
        return Quality.setReplaceNoRevision_int(tmp);
    }
    static isRevisedToOriginalAccepted(bytes) {
        // DATVUE or Interactive Process has accepted original value
        // Value = 4 as bit pattern 100
        return (Quality.isBitClear(bytes, Quality.HOW_REVISED_BIT0) &&
            Quality.isBitClear(bytes, Quality.HOW_REVISED_BIT1) &&
            Quality.isBitSet(bytes, Quality.HOW_REVISED_BIT2));
    }
    static isRevisedToOriginalAccepted_int(intQuality) {
        // DATVUE or Interactive Process has accepted original value
        // Value = 4 as bit pattern 100
        return (Quality.isBitClear_int(intQuality, Quality.HOW_REVISED_BIT0) &&
            Quality.isBitClear_int(intQuality, Quality.HOW_REVISED_BIT1) &&
            Quality.isBitSet_int(intQuality, Quality.HOW_REVISED_BIT2));
    }
    static isReplaceLinearInterpolation(bytes) {
        // Replacement method is linear interpolation
        // Value = 1 as bit pattern 0001
        return (Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT0) &&
            Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT1) &&
            Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT2) &&
            Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT3));
    }
    static isReplaceLinearInterpolation_int(intQuality) {
        // Replacement method is linear interpolation
        // Value = 1 as bit pattern 0001
        return (Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT0) &&
            Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT1) &&
            Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT2) &&
            Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT3));
    }
    static setReplaceLinearInterpolation(bytes) {
        // Replacement method is linear interpolation
        // Set value = 1 as bit pattern 0001
        Quality.setOkay(bytes);
        Quality.setDifferentValue(bytes);
        let tmp = Quality.setBit(bytes, Quality.REPLACE_METHOD_BIT0);
        tmp = Quality.clearBit(tmp, Quality.REPLACE_METHOD_BIT1);
        tmp = Quality.clearBit(tmp, Quality.REPLACE_METHOD_BIT2);
        return Quality.clearBit(tmp, Quality.REPLACE_METHOD_BIT3);
    }
    static setReplaceLinearInterpolation_int(intQuality) {
        // Replacement method is linear interpolation
        // Set value = 1 as bit pattern 0001
        let tmp = Quality.setOkay_int(intQuality);
        tmp = Quality.setDifferentValue_int(intQuality);
        tmp = Quality.setBit_int(intQuality, Quality.REPLACE_METHOD_BIT0);
        tmp = Quality.clearBit_int(tmp, Quality.REPLACE_METHOD_BIT1);
        tmp = Quality.clearBit_int(tmp, Quality.REPLACE_METHOD_BIT2);
        return Quality.clearBit_int(tmp, Quality.REPLACE_METHOD_BIT3);
    }
    static isReplaceManualChange(bytes) {
        // Replacement method is manual Change
        // Value = 2 as bit pattern 0010
        return (Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT0) &&
            Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT1) &&
            Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT2) &&
            Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT3));
    }
    static isReplaceManualChange_int(intQuality) {
        // Replacement method is manual Change
        // Value = 2 as bit pattern 0010
        return (Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT0) &&
            Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT1) &&
            Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT2) &&
            Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT3));
    }
    static setReplaceManualChange(bytes) {
        // Replacement method is manual Change
        // Set value = 2 as bit pattern 0010
        Quality.setOkay(bytes);
        Quality.setDifferentValue(bytes);
        let tmp = Quality.clearBit(bytes, Quality.REPLACE_METHOD_BIT0);
        tmp = Quality.setBit(tmp, Quality.REPLACE_METHOD_BIT1);
        tmp = Quality.clearBit(tmp, Quality.REPLACE_METHOD_BIT2);
        return Quality.clearBit(tmp, Quality.REPLACE_METHOD_BIT3);
    }
    static setReplaceManualChange_int(intQuality) {
        // Replacement method is manual Change
        // Set value = 2 as bit pattern 0010
        let tmp = Quality.setOkay_int(intQuality);
        tmp = Quality.setDifferentValue_int(intQuality);
        tmp = Quality.clearBit_int(intQuality, Quality.REPLACE_METHOD_BIT0);
        tmp = Quality.setBit_int(tmp, Quality.REPLACE_METHOD_BIT1);
        tmp = Quality.clearBit_int(tmp, Quality.REPLACE_METHOD_BIT2);
        return Quality.clearBit_int(tmp, Quality.REPLACE_METHOD_BIT3);
    }
    static isReplaceGraphicalChange(bytes) {
        // Replacement method is graphical Change
        // Value = 4 as bit pattern 0100
        return (Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT0) &&
            Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT1) &&
            Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT2) &&
            Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT3));
    }
    static isReplaceGraphicalChange_int(intQuality) {
        // Replacement method is graphical Change
        // Value = 4 as bit pattern 0100
        return (Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT0) &&
            Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT1) &&
            Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT2) &&
            Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT3));
    }
    static setReplaceGraphicalChange(bytes) {
        // Replacement method is graphical Change
        // Set value = 4 as bit pattern 0100
        Quality.setOkay(bytes);
        Quality.setDifferentValue(bytes);
        let tmp = Quality.clearBit(bytes, Quality.REPLACE_METHOD_BIT0);
        tmp = Quality.clearBit(tmp, Quality.REPLACE_METHOD_BIT1);
        tmp = Quality.setBit(tmp, Quality.REPLACE_METHOD_BIT2);
        return Quality.clearBit(tmp, Quality.REPLACE_METHOD_BIT3);
    }
    static setReplaceGraphicalChange_int(intQuality) {
        // Replacement method is graphical Change
        // Set value = 4 as bit pattern 0100
        let tmp = Quality.setOkay_int(intQuality);
        tmp = Quality.setDifferentValue_int(intQuality);
        tmp = Quality.clearBit_int(intQuality, Quality.REPLACE_METHOD_BIT0);
        tmp = Quality.clearBit_int(tmp, Quality.REPLACE_METHOD_BIT1);
        tmp = Quality.setBit_int(tmp, Quality.REPLACE_METHOD_BIT2);
        return Quality.clearBit_int(tmp, Quality.REPLACE_METHOD_BIT3);
    }
    static isReplaceWithMissing(bytes) {
        // Replacement method is replace with missing
        // Value = 3 as bit pattern 0011
        return (Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT0) &&
            Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT1) &&
            Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT2) &&
            Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT3));
    }
    static isReplaceWithMissing_int(intQuality) {
        // Replacement method is replace with missing
        // Value = 3 as bit pattern 0011
        return (Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT0) &&
            Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT1) &&
            Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT2) &&
            Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT3));
    }
    static setReplaceWithMissing(bytes) {
        // Replacement method is replace with missing
        // Set value = 3 as bit pattern 0011
        Quality.setMissing(bytes);
        Quality.setDifferentValue(bytes);
        let tmp = Quality.setBit(bytes, Quality.REPLACE_METHOD_BIT0);
        tmp = Quality.setBit(tmp, Quality.REPLACE_METHOD_BIT1);
        tmp = Quality.clearBit(tmp, Quality.REPLACE_METHOD_BIT2);
        return Quality.clearBit(tmp, Quality.REPLACE_METHOD_BIT3);
    }
    static setReplaceWithMissing_int(intQuality) {
        // Replacement method is replace with missing
        // Set value = 3 as bit pattern 0011
        let tmp = Quality.setMissing_int(intQuality);
        tmp = Quality.setDifferentValue_int(intQuality);
        tmp = Quality.setBit_int(intQuality, Quality.REPLACE_METHOD_BIT0);
        tmp = Quality.setBit_int(tmp, Quality.REPLACE_METHOD_BIT1);
        tmp = Quality.clearBit_int(tmp, Quality.REPLACE_METHOD_BIT2);
        return Quality.clearBit_int(tmp, Quality.REPLACE_METHOD_BIT3);
    }
    isOkay(elementIndex) {
        if (!Quality.isBitSet_int(elementIndex, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isOkay> Element not screened: " + elementIndex);
        }
        return this.isBitSet(elementIndex, Quality.OKAY_BIT);
    }
    isNotOkay(elementIndex) {
        if (!Quality.isBitSet_int(elementIndex, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isOkay> Element not screened: " + elementIndex);
        }
        return !this.isOkay(elementIndex);
    }
    clearOkay(elementIndex) {
        this.clearBit(elementIndex, Quality.OKAY_BIT);
        this.setBit(elementIndex, Quality.SCREENED_BIT);
    }
    setOkay(elementIndex) {
        this.setBit(elementIndex, Quality.OKAY_BIT);
        this.clearBit(elementIndex, Quality.REJECT_BIT);
        this.clearBit(elementIndex, Quality.QUESTION_BIT);
        this.clearBit(elementIndex, Quality.MISSING_BIT);
        this.setBit(elementIndex, Quality.SCREENED_BIT);
    }
    static isOkay(bytes) {
        if (!Quality.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isOkay> Element not screened: " + bytes);
        }
        return Quality.isBitSet(bytes, Quality.OKAY_BIT);
    }
    static isOkay_int(intQuality) {
        return (Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT) &&
            Quality.isBitSet_int(intQuality, Quality.OKAY_BIT));
    }
    static isNotOkay(bytes) {
        if (!Quality.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotOkay> Element not screened: " + bytes);
        }
        return !Quality.isOkay(bytes);
    }
    static isNotOkay_int(intQuality) {
        if (!Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotOkay> Element not screened: " + intQuality);
        }
        return !Quality.isOkay_int(intQuality);
    }
    static clearOkay(bytes) {
        const tmp = Quality.clearBit(bytes, Quality.OKAY_BIT);
        return Quality.setBit(tmp, Quality.SCREENED_BIT);
    }
    static clearOkay_int(intQuality) {
        return Quality.setBit_int(Quality.clearBit_int(intQuality, Quality.OKAY_BIT), Quality.SCREENED_BIT);
    }
    static setOkay(bytes) {
        let tmp = Quality.setBit(bytes, Quality.OKAY_BIT);
        tmp = Quality.clearBit(tmp, Quality.MISSING_BIT);
        tmp = Quality.clearBit(tmp, Quality.QUESTION_BIT);
        tmp = Quality.clearBit(tmp, Quality.REJECT_BIT);
        return Quality.setBit(tmp, Quality.SCREENED_BIT);
    }
    static setOkay_int(intQuality) {
        let tmp = Quality.setBit_int(intQuality, Quality.OKAY_BIT);
        tmp = Quality.clearBit_int(tmp, Quality.MISSING_BIT);
        tmp = Quality.clearBit_int(tmp, Quality.QUESTION_BIT);
        tmp = Quality.clearBit_int(tmp, Quality.REJECT_BIT);
        return Quality.setBit_int(tmp, Quality.SCREENED_BIT);
    }
    static clearAllBits(bytes) {
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = Quality.NULL_VALUE;
        }
        return bytes;
    }
    isAbsoluteMagnitude(elementIndex) {
        return this.isBitSet(elementIndex, Quality.ABSOLUTEMAGNITUDE_BIT);
    }
    isNotAbsoluteMagnitude(elementIndex) {
        return !this.isAbsoluteMagnitude(elementIndex);
    }
    clearAbsoluteMagnitude(elementIndex) {
        this.clearBit(elementIndex, Quality.ABSOLUTEMAGNITUDE_BIT);
    }
    setAbsoluteMagnitude(elementIndex) {
        this.setBit(elementIndex, Quality.ABSOLUTEMAGNITUDE_BIT);
    }
    static isAbsoluteMagnitude(bytes) {
        if (!Quality.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotOkay> Element not screened: " + bytes);
        }
        return Quality.isBitSet(bytes, Quality.ABSOLUTEMAGNITUDE_BIT);
    }
    static isAbsoluteMagnitude_int(intQuality) {
        if (!Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotOkay> Element not screened: " + intQuality);
        }
        return Quality.isBitSet_int(intQuality, Quality.ABSOLUTEMAGNITUDE_BIT);
    }
    static isNotAbsoluteMagnitude(bytes) {
        if (!Quality.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotOkay> Element not screened: " + bytes);
        }
        return !Quality.isAbsoluteMagnitude(bytes);
    }
    static isNotAbsoluteMagnitude_int(intQuality) {
        if (!Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotOkay> Element not screened: " + intQuality);
        }
        return !Quality.isAbsoluteMagnitude_int(intQuality);
    }
    static clearAbsoluteMagnitude(bytes) {
        return Quality.clearBit(bytes, Quality.ABSOLUTEMAGNITUDE_BIT);
    }
    static clearAbsoluteMagnitude_int(intQuality) {
        return Quality.clearBit_int(intQuality, Quality.ABSOLUTEMAGNITUDE_BIT);
    }
    static setAbsoluteMagnitude(bytes) {
        return Quality.setBit(bytes, Quality.ABSOLUTEMAGNITUDE_BIT);
    }
    static setAbsoluteMagnitude_int(intQuality) {
        return Quality.setBit_int(intQuality, Quality.ABSOLUTEMAGNITUDE_BIT);
    }
    isConstantValue(elementIndex) {
        return this.isBitSet(elementIndex, Quality.CONSTANTVALUE_BIT);
    }
    isNotConstantValue(elementIndex) {
        return !this.isConstantValue(elementIndex);
    }
    clearConstantValue(elementIndex) {
        this.clearBit(elementIndex, Quality.CONSTANTVALUE_BIT);
    }
    setConstantValue(elementIndex) {
        this.setBit(elementIndex, Quality.CONSTANTVALUE_BIT);
    }
    static isConstantValue(bytes) {
        if (!Quality.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotOkay> Element not screened: " + bytes);
        }
        return Quality.isBitSet(bytes, Quality.CONSTANTVALUE_BIT);
    }
    static isConstantValue_int(intQuality) {
        if (!Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotOkay> Element not screened: " + intQuality);
        }
        return Quality.isBitSet_int(intQuality, Quality.CONSTANTVALUE_BIT);
    }
    static isNotConstantValue(bytes) {
        if (!Quality.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotOkay> Element not screened: " + bytes);
        }
        return !Quality.isConstantValue(bytes);
    }
    static isNotConstantValue_int(intQuality) {
        if (!Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotOkay> Element not screened: " + intQuality);
        }
        return !Quality.isConstantValue_int(intQuality);
    }
    static clearConstantValue(bytes) {
        return Quality.clearBit(bytes, Quality.CONSTANTVALUE_BIT);
    }
    static clearConstantValue_int(intQuality) {
        return Quality.clearBit_int(intQuality, Quality.CONSTANTVALUE_BIT);
    }
    static setConstantValue(bytes) {
        return Quality.setBit(bytes, Quality.CONSTANTVALUE_BIT);
    }
    static setConstantValue_int(intQuality) {
        return Quality.setBit_int(intQuality, Quality.CONSTANTVALUE_BIT);
    }
    isRateOfChange(elementIndex) {
        return this.isBitSet(elementIndex, Quality.RATEOFCHANGE_BIT);
    }
    isNotRateOfChange(elementIndex) {
        return !this.isRateOfChange(elementIndex);
    }
    clearRateOfChange(elementIndex) {
        this.clearBit(elementIndex, Quality.RATEOFCHANGE_BIT);
    }
    setRateOfChange(elementIndex) {
        this.setBit(elementIndex, Quality.RATEOFCHANGE_BIT);
    }
    static isRateOfChange(bytes) {
        if (!Quality.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotOkay> Element not screened: " + bytes);
        }
        return Quality.isBitSet(bytes, Quality.RATEOFCHANGE_BIT);
    }
    static isRateOfChange_int(intQuality) {
        if (!Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotOkay> Element not screened: " + intQuality);
        }
        return Quality.isBitSet_int(intQuality, Quality.RATEOFCHANGE_BIT);
    }
    static isNotRateOfChange(bytes) {
        if (!Quality.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotRateOfChange> Element not screened: " + bytes);
        }
        return !Quality.isRateOfChange(bytes);
    }
    static isNotRateOfChange_int(intQuality) {
        if (!Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotOkay> Element not screened: " + intQuality);
        }
        return !Quality.isRateOfChange_int(intQuality);
    }
    static clearRateOfChange(bytes) {
        return Quality.clearBit(bytes, Quality.RATEOFCHANGE_BIT);
    }
    static clearRateOfChange_int(intQuality) {
        return Quality.clearBit_int(intQuality, Quality.RATEOFCHANGE_BIT);
    }
    static setRateOfChange(bytes) {
        return Quality.setBit(bytes, Quality.RATEOFCHANGE_BIT);
    }
    static setRateOfChange_int(intQuality) {
        return Quality.setBit_int(intQuality, Quality.RATEOFCHANGE_BIT);
    }
    isRelativeMagnitude(elementIndex) {
        return this.isBitSet(elementIndex, Quality.RELATIVEMAGNITUDE_BIT);
    }
    isNotRelativeMagnitude(elementIndex) {
        return !this.isRelativeMagnitude(elementIndex);
    }
    clearRelativeMagnitude(elementIndex) {
        this.clearBit(elementIndex, Quality.RELATIVEMAGNITUDE_BIT);
    }
    setRelativeMagnitude(elementIndex) {
        this.setBit(elementIndex, Quality.RELATIVEMAGNITUDE_BIT);
    }
    static isRelativeMagnitude(bytes) {
        if (!Quality.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isRelativeMagnitude> Element not screened: " + bytes);
        }
        return Quality.isBitSet(bytes, Quality.RELATIVEMAGNITUDE_BIT);
    }
    static isRelativeMagnitude_int(intQuality) {
        if (!Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isRelativeMagnitude> Element not screened: " + intQuality);
        }
        return Quality.isBitSet_int(intQuality, Quality.RELATIVEMAGNITUDE_BIT);
    }
    static isNotRelativeMagnitude(bytes) {
        if (!Quality.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotRelativeMagnitude> Element not screened: " + bytes);
        }
        return !Quality.isRelativeMagnitude(bytes);
    }
    static isNotRelativeMagnitude_int(intQuality) {
        if (!Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotRelativeMagnitude_int> Element not screened: " +
                intQuality);
        }
        return !Quality.isRelativeMagnitude_int(intQuality);
    }
    static clearRelativeMagnitude(bytes) {
        return Quality.clearBit(bytes, Quality.RELATIVEMAGNITUDE_BIT);
    }
    static clearRelativeMagnitude_int(intQuality) {
        return Quality.clearBit_int(intQuality, Quality.RELATIVEMAGNITUDE_BIT);
    }
    static setRelativeMagnitude(bytes) {
        return Quality.setBit(bytes, Quality.RELATIVEMAGNITUDE_BIT);
    }
    static setRelativeMagnitude_int(intQuality) {
        return Quality.setBit_int(intQuality, Quality.RELATIVEMAGNITUDE_BIT);
    }
    isDurationMagnitude(elementIndex) {
        return this.isBitSet(elementIndex, Quality.DURATIONMAGNITUDE_BIT);
    }
    isNotDurationMagnitude(elementIndex) {
        return !this.isDurationMagnitude(elementIndex);
    }
    clearDurationMagnitude(elementIndex) {
        this.clearBit(elementIndex, Quality.DURATIONMAGNITUDE_BIT);
    }
    setDurationMagnitude(elementIndex) {
        this.setBit(elementIndex, Quality.DURATIONMAGNITUDE_BIT);
    }
    static isDurationMagnitude(bytes) {
        if (!Quality.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotRelativeMagnitude_int> Element not screened: " + bytes);
        }
        return Quality.isBitSet(bytes, Quality.DURATIONMAGNITUDE_BIT);
    }
    static isDurationMagnitude_int(intQuality) {
        if (!Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotRelativeMagnitude_int> Element not screened: " +
                intQuality);
        }
        return Quality.isBitSet_int(intQuality, Quality.DURATIONMAGNITUDE_BIT);
    }
    static isNotDurationMagnitude(bytes) {
        if (!Quality.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotRelativeMagnitude_int> Element not screened: " + bytes);
        }
        return !Quality.isDurationMagnitude(bytes);
    }
    static isNotDurationMagnitude_int(intQuality) {
        if (!Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotRelativeMagnitude_int> Element not screened: " +
                intQuality);
        }
        return !Quality.isDurationMagnitude_int(intQuality);
    }
    static clearDurationMagnitude(bytes) {
        return Quality.clearBit(bytes, Quality.DURATIONMAGNITUDE_BIT);
    }
    static clearDurationMagnitude_int(intQuality) {
        return Quality.clearBit_int(intQuality, Quality.DURATIONMAGNITUDE_BIT);
    }
    static setDurationMagnitude(bytes) {
        return Quality.setBit(bytes, Quality.DURATIONMAGNITUDE_BIT);
    }
    static setDurationMagnitude_int(intQuality) {
        return Quality.setBit_int(intQuality, Quality.DURATIONMAGNITUDE_BIT);
    }
    isNegativeIncremental(elementIndex) {
        return this.isBitSet(elementIndex, Quality.NEGATIVEINCREMENTAL_BIT);
    }
    isNotNegativeIncremental(elementIndex) {
        return !this.isNegativeIncremental(elementIndex);
    }
    clearNegativeIncremental(elementIndex) {
        this.clearBit(elementIndex, Quality.NEGATIVEINCREMENTAL_BIT);
    }
    setNegativeIncremental(elementIndex) {
        this.setBit(elementIndex, Quality.NEGATIVEINCREMENTAL_BIT);
    }
    static isNegativeIncremental(bytes) {
        if (!Quality.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotRelativeMagnitude_int> Element not screened: " + bytes);
        }
        return Quality.isBitSet(bytes, Quality.NEGATIVEINCREMENTAL_BIT);
    }
    static isNegativeIncremental_int(intQuality) {
        if (!Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotRelativeMagnitude_int> Element not screened: " +
                intQuality);
        }
        return Quality.isBitSet_int(intQuality, Quality.NEGATIVEINCREMENTAL_BIT);
    }
    static isNotNegativeIncremental(bytes) {
        if (!Quality.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotRelativeMagnitude_int> Element not screened: " + bytes);
        }
        return !Quality.isNegativeIncremental(bytes);
    }
    static isNotNegativeIncremental_int(intQuality) {
        if (!Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotRelativeMagnitude_int> Element not screened: " +
                intQuality);
        }
        return !Quality.isNegativeIncremental_int(intQuality);
    }
    static clearNegativeIncremental(bytes) {
        return Quality.clearBit(bytes, Quality.NEGATIVEINCREMENTAL_BIT);
    }
    static clearNegativeIncremental_int(intQuality) {
        return Quality.clearBit_int(intQuality, Quality.NEGATIVEINCREMENTAL_BIT);
    }
    static setNegativeIncremental(bytes) {
        return Quality.setBit(bytes, Quality.NEGATIVEINCREMENTAL_BIT);
    }
    static setNegativeIncremental_int(intQuality) {
        return Quality.setBit_int(intQuality, Quality.NEGATIVEINCREMENTAL_BIT);
    }
    isUserDefinedTest(elementIndex) {
        return this.isBitSet(elementIndex, Quality.USER_DEFINED_TEST_BIT);
    }
    isNotUserDefinedTest(elementIndex) {
        return !this.isUserDefinedTest(elementIndex);
    }
    clearUserDefinedTest(elementIndex) {
        this.clearBit(elementIndex, Quality.USER_DEFINED_TEST_BIT);
    }
    setUserDefinedTest(elementIndex) {
        this.setBit(elementIndex, Quality.USER_DEFINED_TEST_BIT);
    }
    static isUserDefinedTest(bytes) {
        if (!Quality.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotRelativeMagnitude_int> Element not screened: " + bytes);
        }
        return Quality.isBitSet(bytes, Quality.USER_DEFINED_TEST_BIT);
    }
    static isUserDefinedTest_int(intQuality) {
        if (!Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotRelativeMagnitude_int> Element not screened: " +
                intQuality);
        }
        return Quality.isBitSet_int(intQuality, Quality.USER_DEFINED_TEST_BIT);
    }
    static isNotUserDefinedTest(bytes) {
        if (!Quality.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotRelativeMagnitude_int> Element not screened: " + bytes);
        }
        return !Quality.isUserDefinedTest(bytes);
    }
    static isNotUserDefinedTest_int(intQuality) {
        if (!Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotRelativeMagnitude_int> Element not screened: " +
                intQuality);
        }
        return !Quality.isUserDefinedTest_int(intQuality);
    }
    static clearUserDefinedTest(bytes) {
        return Quality.clearBit(bytes, Quality.USER_DEFINED_TEST_BIT);
    }
    static clearUserDefinedTest_int(intQuality) {
        return Quality.clearBit_int(intQuality, Quality.USER_DEFINED_TEST_BIT);
    }
    static setUserDefinedTest(bytes) {
        return Quality.setBit(bytes, Quality.USER_DEFINED_TEST_BIT);
    }
    static setUserDefinedTest_int(intQuality) {
        return Quality.setBit_int(intQuality, Quality.USER_DEFINED_TEST_BIT);
    }
    isDistributionTest(elementIndex) {
        return this.isBitSet(elementIndex, Quality.DISTRIBUTIONTEST_BIT);
    }
    isNotDistributionTest(elementIndex) {
        return !this.isDistributionTest(elementIndex);
    }
    clearDistributionTest(elementIndex) {
        this.clearBit(elementIndex, Quality.DISTRIBUTIONTEST_BIT);
    }
    setDistributionTest(elementIndex) {
        this.setBit(elementIndex, Quality.DISTRIBUTIONTEST_BIT);
    }
    static isDistributionTest(bytes) {
        if (!Quality.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotRelativeMagnitude_int> Element not screened: " + bytes);
        }
        return Quality.isBitSet(bytes, Quality.DISTRIBUTIONTEST_BIT);
    }
    static isDistributionTest_int(intQuality) {
        if (!Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotRelativeMagnitude_int> Element not screened: " +
                intQuality);
        }
        return Quality.isBitSet_int(intQuality, Quality.DISTRIBUTIONTEST_BIT);
    }
    static isNotDistributionTest(bytes) {
        if (!Quality.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotRelativeMagnitude_int> Element not screened: " + bytes);
        }
        return !Quality.isDistributionTest(bytes);
    }
    static isNotDistributionTest_int(intQuality) {
        if (!Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotRelativeMagnitude_int> Element not screened: " +
                intQuality);
        }
        return !Quality.isDistributionTest_int(intQuality);
    }
    static clearDistributionTest(bytes) {
        return Quality.clearBit(bytes, Quality.DISTRIBUTIONTEST_BIT);
    }
    static clearDistributionTest_int(intQuality) {
        return Quality.clearBit_int(intQuality, Quality.DISTRIBUTIONTEST_BIT);
    }
    static setDistributionTest(bytes) {
        return Quality.setBit(bytes, Quality.DISTRIBUTIONTEST_BIT);
    }
    static setDistributionTest_int(intQuality) {
        return Quality.setBit_int(intQuality, Quality.DISTRIBUTIONTEST_BIT);
    }
    static getTestFailed_int(intQuality) {
        let failed = [];
        if (Quality.isAbsoluteMagnitude_int(intQuality))
            failed.push("ABSOLUTE_VALUE");
        if (Quality.isConstantValue_int(intQuality))
            failed.push("CONSTANT_VALUE");
        if (Quality.isRateOfChange_int(intQuality))
            failed.push("RATE_OF_CHANGE");
        if (this.isRelativeMagnitude_int(intQuality))
            failed.push("RELATIVE_VALUE");
        if (this.isDurationMagnitude_int(intQuality))
            failed.push("DURATION_VALUE");
        if (this.isNegativeIncremental_int(intQuality))
            failed.push("NEG_INCREMENT");
        if (this.isGageList_int(intQuality))
            failed.push("SKIP_LIST");
        if (this.isUserDefinedTest_int(intQuality))
            failed.push("USER_DEFINED");
        if (this.isDistributionTest_int(intQuality))
            failed.push("DISTRIBUTION");
        return failed.length ? failed.join("+") : "NONE";
    }
    isGageList(elementIndex) {
        return this.isBitSet(elementIndex, Quality.GAGELIST_BIT);
    }
    isNotGageList(elementIndex) {
        return !this.isGageList(elementIndex);
    }
    clearGageList(elementIndex) {
        this.clearBit(elementIndex, Quality.GAGELIST_BIT);
    }
    setGageList(elementIndex) {
        this.setBit(elementIndex, Quality.GAGELIST_BIT);
    }
    static isGageList(bytes) {
        if (!Quality.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotRelativeMagnitude_int> Element not screened: " + bytes);
        }
        return this.isBitSet(bytes, Quality.GAGELIST_BIT);
    }
    static isGageList_int(intQuality) {
        if (!Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotRelativeMagnitude_int> Element not screened: " +
                intQuality);
        }
        return Quality.isBitSet_int(intQuality, Quality.GAGELIST_BIT);
    }
    static isNotGageList(bytes) {
        if (!Quality.isBitSet(bytes, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotRelativeMagnitude_int> Element not screened: " + bytes);
        }
        return !Quality.isGageList(bytes);
    }
    static isNotGageList_int(intQuality) {
        if (!Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)) {
            throw new DataSetTxQualityFlagException("Method: <isNotRelativeMagnitude_int> Element not screened: " +
                intQuality);
        }
        return !Quality.isGageList_int(intQuality);
    }
    static clearGageList(bytes) {
        return Quality.clearBit(bytes, Quality.GAGELIST_BIT);
    }
    static clearGageList_int(intQuality) {
        return Quality.clearBit_int(intQuality, Quality.GAGELIST_BIT);
    }
    static setGageList(bytes) {
        return Quality.setBit(bytes, Quality.GAGELIST_BIT);
    }
    static setGageList_int(intQuality) {
        return Quality.setBit_int(intQuality, Quality.GAGELIST_BIT);
    }
    getIntQuality() {
        let iqual = [];
        for (let i = 0; i < this._size; i++) {
            const byteIndex = i * Quality.ELEMENT_SIZE_IN_BYTES;
            const i0 = this._elementData[byteIndex + 0] & Quality.MASK_BYTE;
            const i1 = this._elementData[byteIndex + 1] & Quality.MASK_BYTE;
            const i2 = this._elementData[byteIndex + 2] & Quality.MASK_BYTE;
            const i3 = this._elementData[byteIndex + 3] & Quality.MASK_BYTE;
            iqual.push(i3 | (i2 << 8) | (i1 << 16) | (i0 << 24));
        }
        return iqual;
    }
    static isEmpty(bytes) {
        const iqual = Quality.getInteger(bytes);
        return iqual == 0;
    }
    /**
     * Method for transforming underlying QualityTx into an accessible Collections object. This method will perform the entire calculation for
     * the times array from the getTimes() method and uses the QualityTx methods to transform the symbolic String quality into integers.
     *
     * @return sorted map that is not thread safe of dates to quality. Values will not be null, but the collection will be empty if QualityTx is null.
     */
    getQualitySymbols(timesArray) {
        return this.getDateQualityMap((i) => QualityStringRenderer.getSymbolicString(this.getIntegerAt(i)), timesArray);
    }
    /**
     * Gets a sorted map of dates to quality values for the given times array, using the provided function to extract the quality values.
     * If a `zoneId` is provided, the map will use `ZonedDateTime` objects instead of `Date` objects.
     *
     * @param timesArray An array of timestamps in milliseconds since the Unix epoch.
     * @param zoneId Optional. A string representing the time zone to use for `ZonedDateTime` objects. If not provided, `Date` objects will be used instead.
     *
     * @returns A sorted map of dates or `ZonedDateTime` objects to quality values.
     */
    getQualityIntegers(timesArray, zoneId) {
        if (zoneId) {
            const zonedDateTimeMap = this.getZonedDateTimeQualityMap(this.getIntegerAt.bind(this), timesArray, zoneId);
            const dateMap = new Map();
            for (const [date, value] of zonedDateTimeMap.entries()) {
                dateMap.set(date, value);
            }
            return dateMap;
        }
        else {
            return this.getDateQualityMap(this.getIntegerAt.bind(this), timesArray);
        }
    }
    getZonedDateTimeQualityMap(qualityExtractor, timesArray, zoneId) {
        const retval = new Map();
        for (let i = 0; i < timesArray.length; i++) {
            const date = new Date(timesArray[i]);
            const zonedDateTime = new Date(date.toLocaleString("en-US", { timeZone: zoneId }));
            retval.set(zonedDateTime, qualityExtractor(i));
        }
        return retval;
    }
    getDateQualityMap(qualityExtractor, timesArray) {
        const retval = new Map();
        for (let i = 0; i < timesArray.length; i++) {
            const date = new Date(timesArray[i]);
            retval.set(date, qualityExtractor(i));
        }
        return retval;
    }
    toStringElement(elementIndex, stringType) {
        return QualityStringRenderer.getString(this.getIntegerAt(elementIndex), stringType);
    }
    toBinaryString() {
        return this.toString(QualityStringRenderer.BINARY_STRING);
    }
    toOctalString() {
        return this.toString(QualityStringRenderer.OCTAL_STRING);
    }
    toSymbolicString() {
        return this.toString(QualityStringRenderer.SYMBOLIC_STRING);
    }
    toSymbolicRevisedString() {
        return this.toString(QualityStringRenderer.SYMBOLIC_REVISED_STRING);
    }
    toSymbolicTestsString() {
        return this.toString(QualityStringRenderer.SYMBOLIC_TESTS_STRING);
    }
    toHexString() {
        return QualityStringRenderer.HEX_STRING.toString();
    }
    toIntegerString() {
        return QualityStringRenderer.INTEGER_STRING.toString();
    }
    toIntegerStringElementAt(elementIndex) {
        return this.getIntegerAt(elementIndex).toString();
    }
    toBinaryStringElementAt(elementIndex) {
        return QualityStringRenderer.pad(this.getIntegerAt(elementIndex).toString(2), QualityStringRenderer.BINARY_STRING);
    }
    toOctalStringElementAt(elementIndex) {
        return QualityStringRenderer.pad(this.getIntegerAt(elementIndex).toString(8), QualityStringRenderer.OCTAL_STRING);
    }
    toSymbolicStringElementAt(elementIndex) {
        return this.toStringElement(elementIndex, QualityStringRenderer.SYMBOLIC_STRING);
    }
    toSymbolicTestsStringElementAt(elementIndex) {
        return this.toStringElement(elementIndex, QualityStringRenderer.SYMBOLIC_TESTS_STRING);
    }
    toSymbolicRevisedStringElementAt(elementIndex) {
        return this.toStringElement(elementIndex, QualityStringRenderer.SYMBOLIC_REVISED_STRING);
    }
    toHexStringElementAt(elementIndex) {
        return QualityStringRenderer.pad(this.getIntegerAt(elementIndex).toString(16), QualityStringRenderer.HEX_STRING);
    }
    toString(stringType) {
        if (typeof stringType === "undefined") {
            return this.toString(QualityStringRenderer.HEX_STRING);
        }
        let result = "[";
        for (let i = 0; i < this._size; i++) {
            result += this.toStringElement(i, stringType);
            if (i < this._size - 1) {
                result += ", ";
            }
        }
        result += "]";
        return result;
    }
}
Quality.serialVersionUID = 5287976742565108510n;
Quality.QUALITY_FLAGS_EDITABLE = "quality_flags_editable";
Quality.SHOW_QUALITY_FLAGS = "show_quality_flags";
Quality.ELEMENT_SIZE_IN_BYTES = 4;
Quality.NULL_VALUE = 0x00;
// * Actual byte order is: 0[31-24] 1[23-16] 2[15-8] 3[7-0]
Quality.SCREENED_BIT = 1;
Quality.OKAY_BIT = 2;
Quality.MISSING_BIT = 3;
Quality.QUESTION_BIT = 4;
Quality.REJECT_BIT = 5;
Quality.RANGE_OF_VALUE_BIT0 = 6;
Quality.RANGE_OF_VALUE_BIT1 = 7;
Quality.VALUE_DIFFERS_BIT = 8;
Quality.HOW_REVISED_BIT0 = 9;
Quality.HOW_REVISED_BIT1 = 10;
Quality.HOW_REVISED_BIT2 = 11;
Quality.REPLACE_METHOD_BIT0 = 12;
Quality.REPLACE_METHOD_BIT1 = 13;
Quality.REPLACE_METHOD_BIT2 = 14;
Quality.REPLACE_METHOD_BIT3 = 15;
Quality.ABSOLUTEMAGNITUDE_BIT = 16;
Quality.CONSTANTVALUE_BIT = 17;
Quality.RATEOFCHANGE_BIT = 18;
Quality.RELATIVEMAGNITUDE_BIT = 19;
Quality.DURATIONMAGNITUDE_BIT = 20;
Quality.NEGATIVEINCREMENTAL_BIT = 21;
Quality.NOT_DEFINED_BIT0 = 22;
Quality.GAGELIST_BIT = 23;
Quality.NOT_DEFINED_BIT1 = 24;
Quality.USER_DEFINED_TEST_BIT = 25;
Quality.DISTRIBUTIONTEST_BIT = 26;
Quality.RESERVED_BIT0 = 27;
Quality.RESERVED_BIT1 = 28;
Quality.RESERVED_BIT2 = 29;
Quality.RESERVED_BIT3 = 30;
Quality.RESERVED_BIT4 = 31;
Quality.PROTECTED_BIT = 32;
Quality.MASK = [1, 2, 4, 8, 16, 32, 64, 128];
Quality.MASK_BYTE = 0xff;
Quality.USED_BITS_MASK = -2090860545; // 1000 0011 0101
// 1111 1111 1111
// 1111 1111
Quality.SCREENED_VALUE = 1; // 0000 0000 0000 0000 0000
// 0000 0000 0001
Quality.OK_VALUE = 2; // 0000 0000 0000 0000 0000 0000 0000
// 0010
Quality.OK_MASK = -29; // 1111 1111 1111 1111 1111 1111
// 1110 0011
Quality.MISSING_VALUE = 4; // 0000 0000 0000 0000 0000 0000
// 0000 0100
Quality.MISSING_MASK = -27; // 1111 1111 1111 1111 1111
// 1111 1110 0101
Quality.QUESTIONED_VALUE = 8; // 0000 0000 0000 0000 0000
// 0000 0000 1000
Quality.QUESTIONED_MASK = -23; // 1111 1111 1111 1111 1111
// 1111 1110 1001
Quality.REJECTED_VALUE = 16; // 0000 0000 0000 0000 0000
// 0000 0001 0000
Quality.REJECTED_MASK = -15; // 1111 1111 1111 1111 1111
// 1111 1111 0001
Quality.DIFFERENT_MASK = 128; // 0000 0000 0000 0000 0000
// 0000 1000 0000
Quality.NOT_DIFFERENT_MASK = -129; // 1111 1111 1111 1111
// 1111 1111 0111 1111
Quality.REPL_CAUSE_MASK = 1792; // 0000 0000 0000 0000 0000
// 0111 0000 0000
Quality.NO_REPL_CAUSE_MASK = -1793; // 1111 1111 1111 1111
// 1111 1000 1111 1111
Quality.REPL_METHOD_MASK = 30720; // 0000 0000 0000 0000
// 0111 1000 0000 0000
Quality.NO_REPL_METHOD_MASK = -30721; // 1111 1111 1111
// 1111 1000 0111
// 1111 1111
Quality.REPL_METHOD_SHIFT = 11;
Quality.REPL_CAUSE_SHIFT = 8;
Quality.PADDING = [
    "",
    "0",
    "00",
    "000",
    "0000",
    "00000",
    "000000",
    "0000000",
    "00000000",
    "000000000",
    "0000000000",
    "00000000000",
    "000000000000",
    "0000000000000",
    "00000000000000",
    "000000000000000",
    "0000000000000000",
    "00000000000000000",
    "000000000000000000",
    "0000000000000000000",
    "00000000000000000000",
    "000000000000000000000",
    "0000000000000000000000",
    "00000000000000000000000",
    "000000000000000000000000",
    "0000000000000000000000000",
    "00000000000000000000000000",
    "000000000000000000000000000",
    "0000000000000000000000000000",
    "00000000000000000000000000000",
    "000000000000000000000000000000",
    "0000000000000000000000000000000",
    "00000000000000000000000000000000",
];
export { Quality };
