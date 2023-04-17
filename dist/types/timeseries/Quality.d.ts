interface ZonedDateTime {
    date: Date;
    timeZone: string;
}
export declare class Quality {
    static readonly serialVersionUID = 5287976742565108510n;
    static QUALITY_FLAGS_EDITABLE: string;
    static SHOW_QUALITY_FLAGS: string;
    private static readonly ELEMENT_SIZE_IN_BYTES;
    private static readonly NULL_VALUE;
    private static readonly SCREENED_BIT;
    private static readonly OKAY_BIT;
    private static readonly MISSING_BIT;
    private static readonly QUESTION_BIT;
    private static readonly REJECT_BIT;
    private static readonly RANGE_OF_VALUE_BIT0;
    private static readonly RANGE_OF_VALUE_BIT1;
    private static readonly VALUE_DIFFERS_BIT;
    private static readonly HOW_REVISED_BIT0;
    private static readonly HOW_REVISED_BIT1;
    private static readonly HOW_REVISED_BIT2;
    private static readonly REPLACE_METHOD_BIT0;
    private static readonly REPLACE_METHOD_BIT1;
    private static readonly REPLACE_METHOD_BIT2;
    private static readonly REPLACE_METHOD_BIT3;
    private static readonly ABSOLUTEMAGNITUDE_BIT;
    private static readonly CONSTANTVALUE_BIT;
    private static readonly RATEOFCHANGE_BIT;
    private static readonly RELATIVEMAGNITUDE_BIT;
    private static readonly DURATIONMAGNITUDE_BIT;
    private static readonly NEGATIVEINCREMENTAL_BIT;
    private static readonly NOT_DEFINED_BIT0;
    private static readonly GAGELIST_BIT;
    private static readonly NOT_DEFINED_BIT1;
    private static readonly USER_DEFINED_TEST_BIT;
    private static readonly DISTRIBUTIONTEST_BIT;
    private static readonly RESERVED_BIT0;
    private static readonly RESERVED_BIT1;
    private static readonly RESERVED_BIT2;
    private static readonly RESERVED_BIT3;
    private static readonly RESERVED_BIT4;
    private static readonly PROTECTED_BIT;
    private static MASK;
    static readonly MASK_BYTE: number;
    private static readonly USED_BITS_MASK;
    private static readonly SCREENED_VALUE;
    private static readonly OK_VALUE;
    private static readonly OK_MASK;
    private static readonly MISSING_VALUE;
    private static readonly MISSING_MASK;
    private static readonly QUESTIONED_VALUE;
    private static readonly QUESTIONED_MASK;
    private static readonly REJECTED_VALUE;
    private static readonly REJECTED_MASK;
    private static readonly DIFFERENT_MASK;
    private static readonly NOT_DIFFERENT_MASK;
    private static readonly REPL_CAUSE_MASK;
    private static readonly NO_REPL_CAUSE_MASK;
    private static readonly REPL_METHOD_MASK;
    private static readonly NO_REPL_METHOD_MASK;
    private static readonly REPL_METHOD_SHIFT;
    private static readonly REPL_CAUSE_SHIFT;
    private _elementData;
    private _elementDataCompressed;
    private readonly _size;
    private readonly _sizeInBytes;
    private _isCompressed;
    constructor(size: number);
    constructor(elementData: Int32Array);
    constructor(quality: Quality);
    constructor(intQuality: number[]);
    static cleanQualityInteger(qualityInt: number): number;
    /**
     * Uncompresses the data in a Quality object.
     * @param tmp The Quality object to uncompress.
     * @throws {Error} If tmp is null or undefined.
     * @throws {DataFormatException} If the compressed data in tmp is malformed.
     */
    /**
      Returns the empty quality value.
      @returns {number} - The empty quality value.
      */
    static emptyQualityValue(): number;
    /**
     * Returns an Int32Array with empty bytes.
     *
     * @returns {Int32Array} - An Int32Array with empty bytes.
     */
    static emptyBytes(): Int32Array;
    /**
     * Returns the Int32Array containing the quality data.
     *
     * @returns {Int32Array} - The Int32Array containing the quality data.
     */
    getQuality(): Int32Array;
    /**
     * Returns the size of the element data.
     *
     * @returns {number} - The size of the element data.
     */
    getSize(): number;
    /**
     * Returns the size of the element data in bytes.
     *
     * @returns {number} - The size of the element data in bytes.
     */
    getSizeInBytes(): number;
    /**
     * Checks if the element data has quality.
     *
     * @returns {boolean} - True if the element data has quality, false otherwise.
     */
    hasQuality(): boolean;
    /**
     * Gets the Bitmap of the element at the specified index.
     *
     * @param {number} elementIndex - The index of the element.
     *
     * @returns {Int32Array} - The Bitmap of the element at the specified index.
     *
     * @throws {RangeError} - If the specified index is out of range.
     */
    getElementAt(elementIndex: number): Int32Array;
    /**
     * Gets the integer value of the bitmap at the specified index.
     *
     * @param {number} elementIndex - The index of the element.
     *
     * @returns {number} - The integer value of the element at the specified index.
     */
    getIntegerAt(elementIndex: number): number;
    /**
     * Gets the integer value from the specified bitmap.
     *
     * @param {Int32Array} bytes - The bitmap to get the integer value from.
     *
     * @returns {number} - The integer value obtained from the bitmap.
     */
    static getInteger(bytes: Int32Array): number;
    /**
     * Sets the integer value of the element at the specified index.
     *
     * @param {number} intQuality - The integer value to set.
     * @param {number} elementIndex - The index of the element to set.
     *
     * @returns {void}
     */
    setIntegerAt(intQuality: number, elementIndex: number): void;
    /**
     * Fills the byte array with the 4 8-bit slices of an integer. The HI bytes
     * of the integer are in slot 0 and the LOW bytes are in slot 3. The byte
     * array must be of size 4 before being passed to the array.
     *
     * @param intQuality the integer to parse
     * @param bytes      the byte array to fill from Hi to Lo (0-4)
     */
    static getBytes(intQuality: number, bytes: Int32Array | undefined): Int32Array | undefined;
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
    setElementAt(bytes: Int32Array, elementIndex: number): void;
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
    static isAccepted(bytes: Int32Array): boolean;
    /**
     * Determines if the given quality integer value represents an accepted data point.
     *  Linear Interpolation Replacement Method set 1 = 0001
     *   "I" for Interpolated Value
     *
     * @param intQuality - The quality integer value to check.
     * @returns Whether the quality integer value represents an accepted data point or not.
     */
    static isAccepted_int(intQuality: number): boolean;
    /**
     *  Determines if a given integer represents an interpolated value based on its quality bits.
     *
     *  Linear Interpolation Replacement Method set 1 = 0001.
     *  "I" for Interpolated Value.
     *
     *  @param intQuality - The integer value representing the quality of a data element.
     *  @returns A boolean value indicating whether the quality represents an interpolated value.
     */
    static isInterpolated(bytes: Int32Array): boolean;
    /**
     * Determines if the given integer value represents an interpolated quality.
     * @param intQuality - The integer value to check.
     * @returns A boolean value indicating whether the given integer value represents an interpolated quality.
     */
    static isInterpolated_int(intQuality: number): boolean;
    /**
     * Determines if the given Int32Array represents keyboard input based on the replace method bits.
     * Replace method bit 0 should be cleared, bit 1 should be set, and bits 2 and 3 should be cleared.
     * @param bytes - The Int32Array to check.
     * @returns A boolean value indicating whether the given Int32Array represents keyboard input.
     */
    static isKeyboardInput(bytes: Int32Array): boolean;
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
    static isKeyboardInput_int(intQuality: number): boolean;
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
    static isGraphicalEstimate(bytes: Int32Array): boolean;
    /**
      Checks if the quality value represents a graphical estimate based on its manual change replacement method bits.
      @param intQuality - The integer value of the quality to be checked.
      @returns A boolean indicating whether the quality value represents a graphical estimate or not.
      */
    static isGraphicalEstimate_int(intQuality: number): boolean;
    /**
     * Checks whether an element is missing based on its index.
     *
     * @param elementIndex - The index of the element to be checked.
     * @throws {DataSetTxQualityFlagException} If the element is not screened.
     * @returns A boolean indicating whether the element is missing or not.
     */
    isMissing(elementIndex: number): boolean;
    /**
     * Checks whether an element is not missing based on its index.
     *
     * @param elementIndex - The index of the element to be checked.
     * @returns A boolean indicating whether the element is not missing or not.
     */
    isNotMissing(elementIndex: number): boolean;
    /**
     * Clears the missing bit of an element based on its index and sets the screened bit.
     *
     * @param elementIndex - The index of the element whose missing bit is to be cleared.
     */
    clearMissing(elementIndex: number): void;
    /**
     * Sets the missing bit of an element based on its index, and clears other quality bits except for screened bit.
     *
     * @param elementIndex - The index of the element whose missing bit is to be set.
     */
    setMissing(elementIndex: number): void;
    /**
     * Checks whether an element is missing based on its integer array representation.
     *
     * @param bytes - The integer array representation of the element to be checked.
     * @throws {DataSetTxQualityFlagException} If the element is not screened.
     * @returns A boolean indicating whether the element is missing or not.
     */
    static isMissing(bytes: Int32Array): boolean;
    /**
     * Checks whether an element is missing based on its integer representation.
     *
     * @param intQuality - The integer representation of the element to be checked.
     * @returns A boolean indicating whether the element is missing or not.
     */
    static isMissing_int(intQuality: number): boolean;
    /**
     * Checks whether an element is not missing based on its integer array representation.
     *
     * @param bytes - The integer array representation of the element to be checked.
     * @throws {DataSetTxQualityFlagException} If the element is not screened.
     * @returns A boolean indicating whether the element is not missing or not.
     */
    static isNotMissing(bytes: Int32Array): boolean;
    /**
     * Checks whether an element is not missing based on its integer representation.
     *
     * @param intQuality - The integer representation of the element to be checked.
     * @throws {DataSetTxQualityFlagException} If the element is not screened.
     * @returns A boolean indicating whether the element is not missing or not.
     */
    static isNotMissing_int(intQuality: number): boolean;
    /**
     * Clears the missing bit of an element based on its integer array representation, and sets the screened bit.
     *
     * @param bytes - The integer array representation of the element whose missing bit is to be cleared.
     * @returns A new integer array with the updated quality bits.
     */
    static clearMissing(bytes: Int32Array): Int32Array;
    /**
     * Clears the missing bit of an element based on its integer representation, and sets the screened bit.
     *
     * @param intQuality - The integer representation of the element whose missing bit is to be cleared.
     * @returns A new integer with the updated quality bits.
     */
    static clearMissing_int(intQuality: number): number;
    /**
     * Sets the missing bit of an element based on its integer array representation, and clears other quality bits except for screened bit.
     *
     * @param bytes - The integer array representation of the element whose missing bit is to be set.
     * @returns A new integer array with the updated quality bits.
     */
    static setMissing(bytes: Int32Array): Int32Array;
    /**
     * Sets the MISSING_BIT flag on an integer quality value and clears OKAY_BIT, QUESTION_BIT, and REJECT_BIT flags. Then, sets the SCREENED_BIT flag and returns the resulting integer quality value.
     * @param intQuality - An integer representing the quality value to modify.
     * @returns The modified integer quality value with the MISSING_BIT, SCREENED_BIT flags set and the OKAY_BIT, QUESTION_BIT, and REJECT_BIT flags cleared.
     */
    static setMissing_int(intQuality: number): number;
    /**
     * Determines if an element is protected by checking if the SCREENED_BIT and PROTECTED_BIT flags are set on an integer quality value.
     * @param elementIndex - An integer representing the index of the element to check.
     * @returns True if the element is protected (SCREENED_BIT and PROTECTED_BIT flags are set), false otherwise.
     */
    isProtected(elementIndex: number): boolean;
    /**
     * Determines if an element is not protected by checking if the SCREENED_BIT flag is set and the PROTECTED_BIT flag is not set on an integer quality value.
     * @param elementIndex - An integer representing the index of the element to check.
     * @returns True if the element is not protected (SCREENED_BIT flag is set and PROTECTED_BIT flag is not set), false otherwise.
     */
    isNotProtected(elementIndex: number): boolean;
    /**
     * Clears the PROTECTED_BIT flag and sets the SCREENED_BIT flag on an integer quality value for the specified element index.
     * @param elementIndex - An integer representing the index of the element to modify.
     */
    clearProtected(elementIndex: number): void;
    /**
     * Sets the PROTECTED_BIT flag and the SCREENED_BIT flag on an integer quality value for the specified element index.
     * @param elementIndex - An integer representing the index of the element to modify.
     */
    setProtected(elementIndex: number): void;
    /**
     * Determines if an element is protected by checking if the SCREENED_BIT and PROTECTED_BIT flags are set in an Int32Array.
     * @param bytes - An Int32Array containing the quality values to check.
     * @throws {DataSetTxQualityFlagException} If the SCREENED_BIT flag is not set in the Int32Array.
     * @returns True if the element is protected (SCREENED_BIT and PROTECTED_BIT flags are set), false otherwise.
     */
    static isProtected(bytes: Int32Array): boolean;
    /**
     * Determines if an integer quality value is protected by checking if the SCREENED_BIT and PROTECTED_BIT flags are set.
     * @param intQuality - An integer representing the quality value to check.
     * @throws {DataSetTxQualityFlagException} If the SCREENED_BIT flag is not set on the integer quality value.
     * @returns True if the integer quality value is protected (SCREENED_BIT and PROTECTED_BIT flags are set), false otherwise.
     */
    static isProtected_int(intQuality: number): boolean;
    /**
     * Determines if an element is not protected by checking if the SCREENED_BIT flag is set and the PROTECTED_BIT flag is not set in an Int32Array.
     * @param bytes - An Int32Array containing the quality values to check.
     * @throws {DataSetTxQualityFlagException} If the SCREENED_BIT flag is not set in the Int32Array.
     * @returns True if the element is not protected (SCREENED_BIT flag is set and PROTECTED_BIT flag is not set), false otherwise.
     */
    static isNotProtected(bytes: Int32Array): boolean;
    /**
     * Determines if an integer quality value is not protected by checking if the SCREENED_BIT flag is set and the PROTECTED_BIT flag is not set.
     * @param intQuality - An integer representing the quality value to check.
     * @throws {DataSetTxQualityFlagException} If the SCREENED_BIT flag is not set on the integer quality value.
     * @returns True if the integer quality value is not protected (SCREENED_BIT flag is set and PROTECTED_BIT flag is not set), false otherwise.
     */
    static isNotProtected_int(intQuality: number): boolean;
    /**
     * Clears the PROTECTED_BIT flag and sets the SCREENED_BIT flag on each integer quality value in an Int32Array.
     * @param bytes - An Int32Array containing the quality values to modify.
     * @returns A new Int32Array with the modified integer quality values.
     */
    static clearProtected(bytes: Int32Array): Int32Array;
    /**
      Sets the SCREENED and clears the PROTECTED bit in the input intQuality.
      @param intQuality - The input integer representing the quality.
      @returns The modified quality integer.
      */
    static clearProtected_int(intQuality: number): number;
    /**
      Sets the PROTECTED and SCREENED bits in the input bytes.
      @param bytes - The input Int32Array to modify.
      @returns A new Int32Array with the modified bits.
      */
    static setProtected(bytes: Int32Array): Int32Array;
    /**
      Sets the PROTECTED and SCREENED bits in the input intQuality.
      @param intQuality - The input integer representing the quality.
      @returns The modified quality integer.
      */
    static setProtected_int(intQuality: number): number;
    /**
    
    Checks whether the bit at the specified bitPosition is clear (not set) in the input bytes.
    @param bytes - The input Int32Array to check.
    @param bitPosition - The position of the bit to check (0-indexed).
    @returns true if the bit is not set, otherwise false.
    */
    static isBitClear(bytes: Int32Array, bitPosition: number): boolean;
    /**
  
  Checks whether all bits in the input bytes are clear (not set).
  @param bytes - The input Int32Array to check.
  @returns true if all bits are not set, otherwise false.
  */
    static isQualityClear(bytes: Int32Array): boolean;
    /**
  
  Checks whether the input intQuality is equal to 0.
  @param intQuality - The input integer representing the quality.
  @returns true if the input is 0, otherwise false.
  */
    static isQualityClear_int(intQuality: number): boolean;
    /**
  
  Checks whether the bit at the specified bitPosition is set in the input intQuality.
  @param intQuality - The input integer representing the quality.
  @param bitPosition - The position of the bit to check (1-indexed).
  @returns true if the bit is set, otherwise false.
  */
    static isBitSet_int(intQuality: number, bitPosition: number): boolean;
    /**
  
  Checks whether the bit at the specified bitPosition is clear (not set) in the input intQuality.
  @param intQuality - The input integer representing the quality.
  @param bitPosition - The position of the bit to check (1-indexed).
  @returns true if the bit is not set, otherwise false.
  */
    static isBitClear_int(intQuality: number, bitPosition: number): boolean;
    /**
    Sets the bit at the specified bitPosition in the input intQuality.
    @param intQuality - The input integer representing the quality.
    @param bitPosition - The position of the bit to set (1-indexed).
    @returns The modified quality integer.
    */
    static setBit_int(intQuality: number, bitPosition: number): number;
    /**
    Clears (resets) the bit at the specified bitPosition in the input intQuality.
    @param intQuality - The input integer representing the quality.
    @param bitPosition - The position of the bit to clear (1-indexed).
    @returns The modified quality integer.
    */
    static clearBit_int(intQuality: number, bitPosition: number): number;
    /**
       Checks whether the bit at the specified bitPosition is set in the element at the specified elementIndex.
      @param elementIndex - The index of the element to check.
      @param bitPosition - The position of the bit to check (1-indexed).
      @returns true if the bit is set, otherwise false.
      @throws {RangeError} If the elementIndex is out of range.
    */
    isBitSet(elementIndex: number, bitPosition: number): boolean;
    /**
   * Sets the specified bit position as 'screened' and clears the 'protected' bit
   * in the provided integer.
   *
   * @param intQuality The integer representing the quality with the bits to modify.
   * @returns The modified integer with the 'screened' bit set and 'protected' bit cleared.
   */
    static isBitSet(bytes: Int32Array, bitPosition: number): boolean;
    /**
   * Checks if a specific bit is clear or not.
   * @param elementIndex - The index of the element to check.
   * @param bitPosition - The bit position to check.
   * @returns A boolean indicating whether the bit is clear or not.
   */
    isBitClear(elementIndex: number, bitPosition: number): boolean;
    /**
   * Returns a boolean indicating whether all bits in the provided Int32Array are clear (0).
   *
   * @param bytes The Int32Array representing the quality to check.
   * @returns True if all bits are clear, false otherwise.
   */
    isQualityClear(elementIndex: number): boolean;
    /**
   * Sets a specific bit at the given position in an element.
   * @param elementIndex - The index of the element where the bit will be set.
   * @param bitPosition - The bit position to set.
   * @throws {RangeError} If the given element index is out of range.
   */
    setBit(elementIndex: number, bitPosition: number): void;
    /**
   * Sets a specific bit at the given position in a byte array.
   * @param bytes - The byte array to set the bit in.
   * @param bitPosition - The bit position to set.
   * @returns The modified byte array.
   */
    static setBit(bytes: Int32Array, bitPosition: number): Int32Array;
    /**
   * Clears a specific bit at the given position in an element.
   * @param elementIndex - The index of the element where the bit will be cleared.
   * @param bitPosition - The bit position to clear.
   * @throws {RangeError} If the given element index is out of range.
   */
    clearBit(elementIndex: number, bitPosition: number): void;
    /**
   * Clears a specific bit at the given position in a byte array.
   * @param bytes - The byte array to clear the bit in.
   * @param bitPosition - The bit position to clear.
   * @returns The modified byte array.
   */
    static clearBit(bytes: Int32Array, bitPosition: number): Int32Array;
    /**
    Checks if the element at the given index has been screened.
    @param elementIndex - Index of the element to check.
    @returns A boolean indicating whether the element has been screened.
    */
    isScreened(elementIndex: number): boolean;
    /**
  
  Checks if the element at the given index has not been screened.
  @param elementIndex - Index of the element to check.
  @returns A boolean indicating whether the element has not been screened.
  */
    isNotScreened(elementIndex: number): boolean;
    /**
  
  Clears all quality bits for the element at the given index.
  @param elementIndex - Index of the element to clear quality bits for.
  @returns void
  */
    clearQuality(elementIndex: number): void;
    /**
    Clears the screened bit for the element at the given index.
    @param elementIndex - Index of the element to clear the screened bit for.
    @returns void
    */
    clearScreened(elementIndex: number): void;
    /**
    Sets the screened bit for the element at the given index.
    @param elementIndex - Index of the element to set the screened bit for.
    @returns void
    */
    setScreened(elementIndex: number): void;
    static isScreened(bytes: Int32Array): boolean;
    static isScreened_int(intQuality: number): boolean;
    static isNotScreened(bytes: Int32Array): boolean;
    static isNotScreened_int(intQuality: number): boolean;
    static clearQuality(bytes: Int32Array): Int32Array | null;
    static clearQuality_int(qualityAsIntegers: number[] | number): number[] | number | null;
    static clearScreened(bytes: Int32Array): Int32Array;
    static clearScreened_int(intQuality: number): number;
    static setScreened(bytes: Int32Array): Int32Array;
    static setScreened_int(intQuality: number): number;
    isQuestion(elementIndex: number): boolean;
    isNotQuestion(elementIndex: number): boolean;
    clearQuestion(elementIndex: number): void;
    setQuestion(elementIndex: number): void;
    static isQuestion(bytes: Int32Array): boolean;
    static isQuestion_int(intQuality: number): boolean;
    static isNotQuestion(bytes: Int32Array): boolean;
    static isNotQuestion_int(intQuality: number): boolean;
    static clearQuestion(bytes: Int32Array): Int32Array;
    static clearQuestion_int(intQuality: number): number;
    static setQuestion(bytes: Int32Array): Int32Array;
    static setQuestion_int(intQuality: number): number;
    isReject(elementIndex: number): boolean;
    isNotReject(elementIndex: number): boolean;
    clearReject(elementIndex: number): void;
    setReject(elementIndex: number): void;
    clearRange(elementIndex: number): void;
    setRange0(elementIndex: number): void;
    setRange1(elementIndex: number): void;
    setRange2(elementIndex: number): void;
    setRange3(elementIndex: number): void;
    isDifferentValue(elementIndex: number): boolean;
    isNotDifferentValue(elementIndex: number): boolean;
    private clearDifferentValue;
    private setDifferentValue;
    isRevised(elementIndex: number): boolean;
    isNotRevised(elementIndex: number): boolean;
    clearHowRevised(elementIndex: number): void;
    clearReplaceMethod(elementIndex: number): void;
    setRevisedNoRevision(elementIndex: number): void;
    setReplaceNoRevision(elementIndex: number): void;
    setNoRevision(elementIndex: number): void;
    setRevisedAutomatically(elementIndex: number): void;
    static isRevisedInteractivelyCheckAllBits(bytes: Int32Array): boolean;
    static isRevisedInteractivelyCheckAllBits_int(intQuality: number): boolean;
    static isRevisedInteractively(bytes: Int32Array): boolean;
    static isRevisedInteractively_int(intQuality: number): boolean;
    setRevisedInteractively(elementIndex: number): void;
    setRevisedManually(elementIndex: number): void;
    /**
     * setRevisedToOriginalAccepted Function Sets Quality Bits to: Screened Bit
     * on Okay Bit on How Revised Bits to "Original Value Accepted in DATVUE or
     * Interactive Process Replace Bits to "No Revision" Does not change status
     * of other bits
     */
    setRevisedToOriginalAccepted(elementIndex: number): void;
    setReplaceLinearInterpolation(elementIndex: number): void;
    setReplaceManualChange(elementIndex: number): void;
    setReplaceGraphicalChange(elementIndex: number): void;
    setReplaceWithMissing(elementIndex: number): void;
    static isReject(bytes: Int32Array): boolean;
    static isReject_int(intQuality: number): boolean;
    static isNotReject(bytes: Int32Array): boolean;
    static isNotReject_int(intQuality: number): boolean;
    static clearReject(bytes: Int32Array): Int32Array;
    static clearReject_int(intQuality: number): number;
    static setReject(bytes: Int32Array): Int32Array;
    static setReject_int(intQuality: number): number;
    static clearRange(bytes: Int32Array): Int32Array;
    static clearRange_int(intQuality: number): number;
    static setRange0(bytes: Int32Array): Int32Array;
    static setRange0_int(intQuality: number): number;
    static isRange1(bytes: Int32Array): boolean;
    static isRange1_int(intQuality: number): boolean;
    static setRange1(bytes: Int32Array): Int32Array;
    static setRange1_int(intQuality: number): number;
    static isRange2(bytes: Int32Array): boolean;
    static isRange2_int(intQuality: number): boolean;
    static setRange2(bytes: Int32Array): Int32Array;
    static setRange2_int(intQuality: number): number;
    static isRange3(bytes: Int32Array): boolean;
    static isRange3_int(intQuality: number): boolean;
    static setRange3(bytes: Int32Array): Int32Array;
    static setRange3_int(intQuality: number): number;
    static isDifferentValue(bytes: Int32Array): boolean;
    static isDifferentValue_int(intQuality: number): boolean;
    static isNotDifferentValue(bytes: Int32Array): boolean;
    static isNotDifferentValue_int(intQuality: number): boolean;
    static clearDifferentValue(bytes: Int32Array): Int32Array;
    static clearDifferentValue_int(intQuality: number): number;
    private static setDifferentValue;
    private static setDifferentValue_int;
    static isRevised(bytes: Int32Array): boolean;
    static isRevised_int(intQuality: number): boolean;
    static isNotRevised(bytes: Int32Array): boolean;
    static isNotRevised_int(intQuality: number): boolean;
    static clearHowRevised(bytes: Int32Array): Int32Array;
    static clearHowRevised_int(intQuality: number): number;
    static clearReplaceMethod(bytes: Int32Array): Int32Array;
    static clearReplaceMethod_int(intQuality: number): number;
    static setReplaceNoRevision(bytes: Int32Array): Int32Array;
    static setReplaceNoRevision_int(intQuality: number): number;
    static setNoRevision(bytes: Int32Array): Int32Array;
    static setNoRevision_int(intQuality: number): number;
    static setRevisedAutomatically(bytes: Int32Array): Int32Array;
    static setRevisedAutomatically_int(intQuality: number): number;
    static isRevisedAutomaticallyCheckAllBits(bytes: Int32Array): boolean;
    static isRevisedAutomaticallyCheckAllBits_int(intQuality: number): boolean;
    static isRevisedAutomatically(bytes: Int32Array): boolean;
    static isRevisedAutomatically_int(intQuality: number): boolean;
    static setRevisedInteractively(bytes: Int32Array): Int32Array;
    static setRevisedInteractively_int(intQuality: number): number;
    static isRevisedManuallyCheckAllBits(bytes: Int32Array): boolean;
    static isRevisedManually(bytes: Int32Array): boolean;
    static isRevisedManuallyCheckAllBits_int(intQuality: number): boolean;
    static isRevisedManually_int(intQuality: number): boolean;
    static setRevisedManually(bytes: Int32Array): Int32Array;
    static setRevisedManually_int(intQuality: number): number;
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
    setUsingQualityFlags(originalBytes: Int32Array, elementIndex: number, qualFlag: string, isValueRevised: boolean): void;
    static getQualUsingFlags(originalBytes: Int32Array, qualFlag: string, isValueRevised: boolean): Int32Array;
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
    private setUsingReviseReplaceFlags;
    private static getQualUsingReviseReplaceFlags;
    /**
     * setRevisedToOriginalAccepted Function Sets Quality Bits to: Screened Bit
     * on Quality Bits to Okay How Revised Bits to "Original Value Accepted in
     * DATVUE or Interactive Process Replace Bits to "No Revision" Does not
     * change status of other bits
     */
    static setRevisedToOriginalAccepted(bytes: Int32Array): Int32Array;
    static setRevisedToOriginalAccepted_int(intQuality: number): number;
    static isRevisedToOriginalAccepted(bytes: Int32Array): boolean;
    static isRevisedToOriginalAccepted_int(intQuality: number): boolean;
    static isReplaceLinearInterpolation(bytes: Int32Array): boolean;
    static isReplaceLinearInterpolation_int(intQuality: number): boolean;
    static setReplaceLinearInterpolation(bytes: Int32Array): Int32Array;
    static setReplaceLinearInterpolation_int(intQuality: number): number;
    static isReplaceManualChange(bytes: Int32Array): boolean;
    static isReplaceManualChange_int(intQuality: number): boolean;
    static setReplaceManualChange(bytes: Int32Array): Int32Array;
    static setReplaceManualChange_int(intQuality: number): number;
    static isReplaceGraphicalChange(bytes: Int32Array): boolean;
    static isReplaceGraphicalChange_int(intQuality: number): boolean;
    static setReplaceGraphicalChange(bytes: Int32Array): Int32Array;
    static setReplaceGraphicalChange_int(intQuality: number): number;
    static isReplaceWithMissing(bytes: Int32Array): boolean;
    static isReplaceWithMissing_int(intQuality: number): boolean;
    static setReplaceWithMissing(bytes: Int32Array): Int32Array;
    static setReplaceWithMissing_int(intQuality: number): number;
    isOkay(elementIndex: number): boolean;
    isNotOkay(elementIndex: number): boolean;
    clearOkay(elementIndex: number): void;
    setOkay(elementIndex: number): void;
    static isOkay(bytes: Int32Array): boolean;
    static isOkay_int(intQuality: number): boolean;
    static isNotOkay(bytes: Int32Array): boolean;
    static isNotOkay_int(intQuality: number): boolean;
    static clearOkay(bytes: Int32Array): Int32Array;
    static clearOkay_int(intQuality: number): number;
    static setOkay(bytes: Int32Array): Int32Array;
    static setOkay_int(intQuality: number): number;
    static clearAllBits(bytes: Int32Array): Int32Array;
    isAbsoluteMagnitude(elementIndex: number): boolean;
    isNotAbsoluteMagnitude(elementIndex: number): boolean;
    clearAbsoluteMagnitude(elementIndex: number): void;
    setAbsoluteMagnitude(elementIndex: number): void;
    static isAbsoluteMagnitude(bytes: Int32Array): boolean;
    static isAbsoluteMagnitude_int(intQuality: number): boolean;
    static isNotAbsoluteMagnitude(bytes: Int32Array): boolean;
    static isNotAbsoluteMagnitude_int(intQuality: number): boolean;
    static clearAbsoluteMagnitude(bytes: Int32Array): Int32Array;
    static clearAbsoluteMagnitude_int(intQuality: number): number;
    static setAbsoluteMagnitude(bytes: Int32Array): Int32Array;
    static setAbsoluteMagnitude_int(intQuality: number): number;
    isConstantValue(elementIndex: number): boolean;
    isNotConstantValue(elementIndex: number): boolean;
    clearConstantValue(elementIndex: number): void;
    setConstantValue(elementIndex: number): void;
    static isConstantValue(bytes: Int32Array): boolean;
    static isConstantValue_int(intQuality: number): boolean;
    static isNotConstantValue(bytes: Int32Array): boolean;
    static isNotConstantValue_int(intQuality: number): boolean;
    static clearConstantValue(bytes: Int32Array): Int32Array;
    static clearConstantValue_int(intQuality: number): number;
    static setConstantValue(bytes: Int32Array): Int32Array;
    static setConstantValue_int(intQuality: number): number;
    isRateOfChange(elementIndex: number): boolean;
    isNotRateOfChange(elementIndex: number): boolean;
    clearRateOfChange(elementIndex: number): void;
    setRateOfChange(elementIndex: number): void;
    static isRateOfChange(bytes: Int32Array): boolean;
    static isRateOfChange_int(intQuality: number): boolean;
    static isNotRateOfChange(bytes: Int32Array): boolean;
    static isNotRateOfChange_int(intQuality: number): boolean;
    static clearRateOfChange(bytes: Int32Array): Int32Array;
    static clearRateOfChange_int(intQuality: number): number;
    static setRateOfChange(bytes: Int32Array): Int32Array;
    static setRateOfChange_int(intQuality: number): number;
    isRelativeMagnitude(elementIndex: number): boolean;
    isNotRelativeMagnitude(elementIndex: number): boolean;
    clearRelativeMagnitude(elementIndex: number): void;
    setRelativeMagnitude(elementIndex: number): void;
    static isRelativeMagnitude(bytes: Int32Array): boolean;
    static isRelativeMagnitude_int(intQuality: number): boolean;
    static isNotRelativeMagnitude(bytes: Int32Array): boolean;
    static isNotRelativeMagnitude_int(intQuality: number): boolean;
    static clearRelativeMagnitude(bytes: Int32Array): Int32Array;
    static clearRelativeMagnitude_int(intQuality: number): number;
    static setRelativeMagnitude(bytes: Int32Array): Int32Array;
    static setRelativeMagnitude_int(intQuality: number): number;
    isDurationMagnitude(elementIndex: number): boolean;
    isNotDurationMagnitude(elementIndex: number): boolean;
    clearDurationMagnitude(elementIndex: number): void;
    setDurationMagnitude(elementIndex: number): void;
    static isDurationMagnitude(bytes: Int32Array): boolean;
    static isDurationMagnitude_int(intQuality: number): boolean;
    static isNotDurationMagnitude(bytes: Int32Array): boolean;
    static isNotDurationMagnitude_int(intQuality: number): boolean;
    static clearDurationMagnitude(bytes: Int32Array): Int32Array;
    static clearDurationMagnitude_int(intQuality: number): number;
    static setDurationMagnitude(bytes: Int32Array): Int32Array;
    static setDurationMagnitude_int(intQuality: number): number;
    isNegativeIncremental(elementIndex: number): boolean;
    isNotNegativeIncremental(elementIndex: number): boolean;
    clearNegativeIncremental(elementIndex: number): void;
    setNegativeIncremental(elementIndex: number): void;
    static isNegativeIncremental(bytes: Int32Array): boolean;
    static isNegativeIncremental_int(intQuality: number): boolean;
    static isNotNegativeIncremental(bytes: Int32Array): boolean;
    static isNotNegativeIncremental_int(intQuality: number): boolean;
    static clearNegativeIncremental(bytes: Int32Array): Int32Array;
    static clearNegativeIncremental_int(intQuality: number): number;
    static setNegativeIncremental(bytes: Int32Array): Int32Array;
    static setNegativeIncremental_int(intQuality: number): number;
    isUserDefinedTest(elementIndex: number): boolean;
    isNotUserDefinedTest(elementIndex: number): boolean;
    clearUserDefinedTest(elementIndex: number): void;
    setUserDefinedTest(elementIndex: number): void;
    static isUserDefinedTest(bytes: Int32Array): boolean;
    static isUserDefinedTest_int(intQuality: number): boolean;
    static isNotUserDefinedTest(bytes: Int32Array): boolean;
    static isNotUserDefinedTest_int(intQuality: number): boolean;
    static clearUserDefinedTest(bytes: Int32Array): Int32Array;
    static clearUserDefinedTest_int(intQuality: number): number;
    static setUserDefinedTest(bytes: Int32Array): Int32Array;
    static setUserDefinedTest_int(intQuality: number): number;
    isDistributionTest(elementIndex: number): boolean;
    isNotDistributionTest(elementIndex: number): boolean;
    clearDistributionTest(elementIndex: number): void;
    setDistributionTest(elementIndex: number): void;
    static isDistributionTest(bytes: Int32Array): boolean;
    static isDistributionTest_int(intQuality: number): boolean;
    static isNotDistributionTest(bytes: Int32Array): boolean;
    static isNotDistributionTest_int(intQuality: number): boolean;
    static clearDistributionTest(bytes: Int32Array): Int32Array;
    static clearDistributionTest_int(intQuality: number): number;
    static setDistributionTest(bytes: Int32Array): Int32Array;
    static setDistributionTest_int(intQuality: number): number;
    isGageList(elementIndex: number): boolean;
    isNotGageList(elementIndex: number): boolean;
    clearGageList(elementIndex: number): void;
    setGageList(elementIndex: number): void;
    static isGageList(bytes: Int32Array): boolean;
    static isGageList_int(intQuality: number): boolean;
    static isNotGageList(bytes: Int32Array): boolean;
    static isNotGageList_int(intQuality: number): boolean;
    static clearGageList(bytes: Int32Array): Int32Array;
    static clearGageList_int(intQuality: number): number;
    static setGageList(bytes: Int32Array): Int32Array;
    static setGageList_int(intQuality: number): number;
    static PADDING: string[];
    getIntQuality(): number[];
    static isEmpty(bytes: Int32Array): boolean;
    /**
     * Method for transforming underlying QualityTx into an accessible Collections object. This method will perform the entire calculation for
     * the times array from the getTimes() method and uses the QualityTx methods to transform the symbolic String quality into integers.
     *
     * @return sorted map that is not thread safe of dates to quality. Values will not be null, but the collection will be empty if QualityTx is null.
     */
    getQualitySymbols(timesArray: number[]): Map<Date, String>;
    /**
     * Gets a sorted map of dates to quality values for the given times array, using the provided function to extract the quality values.
     * If a `zoneId` is provided, the map will use `ZonedDateTime` objects instead of `Date` objects.
     *
     * @param timesArray An array of timestamps in milliseconds since the Unix epoch.
     * @param zoneId Optional. A string representing the time zone to use for `ZonedDateTime` objects. If not provided, `Date` objects will be used instead.
     *
     * @returns A sorted map of dates or `ZonedDateTime` objects to quality values.
     */
    getQualityIntegers(timesArray: number[], zoneId?: string): Map<Date | ZonedDateTime, number>;
    private getZonedDateTimeQualityMap;
    getDateQualityMap<V>(qualityExtractor: (index: number) => V, timesArray: number[]): Map<Date, V>;
    private toStringElement;
    toBinaryString(): string;
    toOctalString(): string;
    toSymbolicString(): string;
    toSymbolicRevisedString(): string;
    toSymbolicTestsString(): string;
    toHexString(): string;
    toIntegerString(): string;
    toIntegerStringElementAt(elementIndex: number): string;
    toBinaryStringElementAt(elementIndex: number): string;
    toOctalStringElementAt(elementIndex: number): string;
    toSymbolicStringElementAt(elementIndex: number): string;
    toSymbolicTestsStringElementAt(elementIndex: number): string;
    toSymbolicRevisedStringElementAt(elementIndex: number): string;
    toHexStringElementAt(elementIndex: number): string;
    private toString;
}
export {};
//# sourceMappingURL=Quality.d.ts.map