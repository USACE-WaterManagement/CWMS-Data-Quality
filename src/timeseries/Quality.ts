import * as pako from 'pako';
import TreeMap from 'ts-treemap'
import { QualityStringRenderer } from './QualityStringRenderer';

interface ZonedDateTime {
  date: Date;
  timeZone: string;
}
export class Quality {
  static readonly serialVersionUID = 5287976742565108510n;
  public static QUALITY_FLAGS_EDITABLE = "quality_flags_editable";
  public static SHOW_QUALITY_FLAGS = "show_quality_flags";

  private static readonly ELEMENT_SIZE_IN_BYTES = 4;
  private static readonly NULL_VALUE = 0x00;
  // * For you internal birds after the correct byte is found
  // * we will subtract one (1) from the bit position
  // * because real programmers do it differently!
  // * Actual byte order is: 0[31-24] 1[23-16] 2[15-8] 3[7-0]

  private static readonly SCREENED_BIT = 1;
  private static readonly OKAY_BIT = 2;
  private static readonly MISSING_BIT = 3;
  private static readonly QUESTION_BIT = 4;
  private static readonly REJECT_BIT = 5;
  private static readonly RANGE_OF_VALUE_BIT0 = 6;
  private static readonly RANGE_OF_VALUE_BIT1 = 7;
  private static readonly VALUE_DIFFERS_BIT = 8;
  private static readonly HOW_REVISED_BIT0 = 9;
  private static readonly HOW_REVISED_BIT1 = 10;
  private static readonly HOW_REVISED_BIT2 = 11;
  private static readonly REPLACE_METHOD_BIT0 = 12;
  private static readonly REPLACE_METHOD_BIT1 = 13;
  private static readonly REPLACE_METHOD_BIT2 = 14;
  private static readonly REPLACE_METHOD_BIT3 = 15;
  private static readonly ABSOLUTEMAGNITUDE_BIT = 16;
  private static readonly CONSTANTVALUE_BIT = 17;
  private static readonly RATEOFCHANGE_BIT = 18;
  private static readonly RELATIVEMAGNITUDE_BIT = 19;
  private static readonly DURATIONMAGNITUDE_BIT = 20;
  private static readonly NEGATIVEINCREMENTAL_BIT = 21;
  private static readonly NOT_DEFINED_BIT0 = 22;
  private static readonly GAGELIST_BIT = 23;
  private static readonly NOT_DEFINED_BIT1 = 24;
  private static readonly USER_DEFINED_TEST_BIT = 25;
  private static readonly DISTRIBUTIONTEST_BIT = 26;
  private static readonly RESERVED_BIT0 = 27;
  private static readonly RESERVED_BIT1 = 28;
  private static readonly RESERVED_BIT2 = 29;
  private static readonly RESERVED_BIT3 = 30;
  private static readonly RESERVED_BIT4 = 31;
  private static readonly PROTECTED_BIT = 32;

  private static MASK: number[] = [1, 2, 4, 8, 16, 32, 64, 128];
  static readonly MASK_BYTE: number = 0xff;

  private static readonly USED_BITS_MASK: number = -2090860545; // 1000 0011 0101
  // 1111 1111 1111
  // 1111 1111
  private static readonly SCREENED_VALUE: number = 1; // 0000 0000 0000 0000 0000
  // 0000 0000 0001
  private static readonly OK_VALUE: number = 2; // 0000 0000 0000 0000 0000 0000 0000
  // 0010
  private static readonly OK_MASK: number = -29; // 1111 1111 1111 1111 1111 1111
  // 1110 0011
  private static readonly MISSING_VALUE: number = 4; // 0000 0000 0000 0000 0000 0000
  // 0000 0100
  private static readonly MISSING_MASK: number = -27; // 1111 1111 1111 1111 1111
  // 1111 1110 0101
  private static readonly QUESTIONED_VALUE: number = 8; // 0000 0000 0000 0000 0000
  // 0000 0000 1000
  private static readonly QUESTIONED_MASK: number = -23; // 1111 1111 1111 1111 1111
  // 1111 1110 1001
  private static readonly REJECTED_VALUE: number = 16; // 0000 0000 0000 0000 0000
  // 0000 0001 0000
  private static readonly REJECTED_MASK: number = -15; // 1111 1111 1111 1111 1111
  // 1111 1111 0001
  private static readonly DIFFERENT_MASK: number = 128; // 0000 0000 0000 0000 0000
  // 0000 1000 0000
  private static readonly NOT_DIFFERENT_MASK: number = -129; // 1111 1111 1111 1111
  // 1111 1111 0111 1111
  private static readonly REPL_CAUSE_MASK: number = 1792; // 0000 0000 0000 0000 0000
  // 0111 0000 0000
  private static readonly NO_REPL_CAUSE_MASK: number = -1793; // 1111 1111 1111 1111
  // 1111 1000 1111 1111
  private static readonly REPL_METHOD_MASK: number = 30720; // 0000 0000 0000 0000
  // 0111 1000 0000 0000
  private static readonly NO_REPL_METHOD_MASK: number = -30721; // 1111 1111 1111
  // 1111 1000 0111
  // 1111 1111
  private static readonly REPL_METHOD_SHIFT: number = 11;

  private static readonly REPL_CAUSE_SHIFT = 8;

  private _elementData: Int32Array;
  private _elementDataCompressed: Int32Array | null = null;
  private readonly _size: number;
  private readonly _sizeInBytes: number;
  private _isCompressed = false;

  constructor(size: number);
  constructor(elementData: Int32Array);
  constructor(quality: Quality);
  constructor(intQuality: number[]);
  constructor(arg: number[] | Int32Array | Quality | number) {
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
    } else if (arg instanceof Quality) {
      const quality = arg;
      this._size = quality._size;
      this._sizeInBytes = quality._sizeInBytes;
      this._elementData = new Int32Array(this._sizeInBytes);
      this._elementData.set(quality._elementData);
      // enforce valid quality data
      for (let i = 0; i < this._size; ++i) {
        this.setElementAt(this.getElementAt(i), i);
      }
    } else if (Array.isArray(arg)) {
      const intQuality = arg;
      this._size = intQuality.length;
      this._sizeInBytes = this._size * Quality.ELEMENT_SIZE_IN_BYTES;
      this._elementData = new Int32Array(this._sizeInBytes);
      for (let i = 0; i < this._size; i++) {
        this.setIntegerAt(intQuality[i], i);
      }
    } else {
      const size = arg as number;
      this._size = size;
      this._sizeInBytes = size * Quality.ELEMENT_SIZE_IN_BYTES;
      this._elementData = new Int32Array(this._sizeInBytes);
      for (let i = 0; i < this._sizeInBytes; i++) {
        this._elementData[i] = Quality.NULL_VALUE;
      }
    }
  }

  public static cleanQualityInteger(qualityInt: number): number {
    let tmp: number = qualityInt;
    // -------------------------------------------//
    // clear all bits if screened bit is not set //
    // -------------------------------------------//
    if ((tmp & Quality.SCREENED_VALUE) == 0) {
      tmp = 0;
    } else {
      // -----------------------------------------------------------------//
      // ensure only used bits are set (also counteracts sign-extension)
      // -----------------------------------------------------------------//
      tmp &= Quality.USED_BITS_MASK;
      // -------------------------------------//
      // ensure only one validity bit is set //
      // -------------------------------------//
      if ((tmp & Quality.MISSING_VALUE) != 0) {
        tmp &= Quality.MISSING_MASK;
      } else if ((tmp & Quality.REJECTED_VALUE) != 0) {
        tmp &= Quality.REJECTED_MASK;
      } else if ((tmp & Quality.QUESTIONED_VALUE) != 0) {
        tmp &= Quality.QUESTIONED_MASK;
      } else if ((tmp & Quality.OK_VALUE) != 0) {
        tmp &= Quality.OK_MASK;
      }
      // ----------------------------------------------------//
      // ensure the replacement cause is not greater than 4 //
      // ----------------------------------------------------//
      let repl_cause: number =
        (tmp & Quality.REPL_CAUSE_MASK) >>> Quality.REPL_CAUSE_SHIFT;
      if (repl_cause > 4) {
        repl_cause = 4;
        tmp |= repl_cause << Quality.REPL_CAUSE_SHIFT;
      }
      // -----------------------------------------------------//
      // ensure the replacement method is not greater than 4 //
      // -----------------------------------------------------//
      let repl_method: number =
        (tmp & Quality.REPL_METHOD_MASK) >>> Quality.REPL_METHOD_SHIFT;
      if (repl_method > 4) {
        repl_method = 4;
        tmp |= repl_method << Quality.REPL_METHOD_SHIFT;
      }
      // ----------------------------------------------------------------------------------------------------------//
      // ensure that if 2 of replacement cause, replacement method, and
      // different are 0, the remaining one is too //
      // ----------------------------------------------------------------------------------------------------------//
      let different: boolean = (tmp & Quality.DIFFERENT_MASK) != 0;
      if (repl_cause == 0) {
        if (repl_method == 0 && different) {
          tmp &= Quality.NOT_DIFFERENT_MASK;
          different = false;
        } else if (repl_method != 0 && !different) {
          tmp &= Quality.NO_REPL_METHOD_MASK;
          repl_method = 0;
        }
      } else if (repl_method == 0 && !different) {
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
        } else if (different && repl_method == 0) {
          repl_method = 2; // EXPLICIT
          tmp |= repl_method << Quality.REPL_METHOD_SHIFT;
        }
      } else if (different && repl_method != 0) {
        repl_cause = 3; // MANUAL
        tmp &= repl_cause << Quality.REPL_CAUSE_SHIFT;
      }
    }
    return tmp;
  }

  public static compressQuality(tmp: Quality): void {
    if (tmp._isCompressed || tmp._size < 10) {
      return;
    }
    const output = new Int32Array(pako.deflate(tmp._elementData.buffer));
    tmp._elementDataCompressed = output;
    tmp._isCompressed = true;
  }

  public static uncompressQuality(tmp: Quality): Quality {
    if (tmp._isCompressed) {
      tmp._elementData = new Int32Array(tmp._size * 4);
      const numSoFar = pako.inflate(
        new Int32Array(tmp._elementDataCompressed.buffer),
        tmp._elementData
      );
      const num = numSoFar;
      tmp._elementDataCompressed = null;
      tmp._isCompressed = false;
    }
    return tmp;
  }

  public static emptyQualityValue(): number {
    return Quality.NULL_VALUE;
  }

  public static emptyBytes(): Int32Array {
    return new Int32Array([
      Quality.NULL_VALUE,
      Quality.NULL_VALUE,
      Quality.NULL_VALUE,
      Quality.NULL_VALUE,
    ]);
  }

  public getQuality(): Int32Array {
    return this._elementData;
  }

  public getSize(): number {
    return this._size;
  }

  public getSizeInBytes(): number {
    return this._sizeInBytes;
  }

  public hasQuality(): boolean {
    return this._size > 0;
  }

  getElementAt(elementIndex: number): Int32Array {
    if (elementIndex > this._size || elementIndex < 0) {
      throw new RangeError(
        `Index of: ${elementIndex} Out of range[0 - ${this._size}]`
      );
    }

    const byteIndex: number = elementIndex * Quality.ELEMENT_SIZE_IN_BYTES;

    const bytes: Int32Array = new Int32Array(Quality.ELEMENT_SIZE_IN_BYTES);
    bytes.set(
      this._elementData.subarray(
        byteIndex,
        byteIndex + Quality.ELEMENT_SIZE_IN_BYTES
      )
    );

    return bytes;
  }

  getIntegerAt(elementIndex: number): number {
    const bytes: Int32Array = this.getElementAt(elementIndex);
    const i0: number = bytes[0] & Quality.MASK_BYTE;
    const i1: number = bytes[1] & Quality.MASK_BYTE;
    const i2: number = bytes[2] & Quality.MASK_BYTE;
    const i3: number = bytes[3] & Quality.MASK_BYTE;
    const result: number = i3 | (i2 << 8) | (i1 << 16) | (i0 << 24);
    return result;
  }

  static getInteger(bytes: Int32Array): number {
    const i0: number = bytes[0] & Quality.MASK_BYTE;
    const i1: number = bytes[1] & Quality.MASK_BYTE;
    const i2: number = bytes[2] & Quality.MASK_BYTE;
    const i3: number = bytes[3] & Quality.MASK_BYTE;
    const result: number = i3 | (i2 << 8) | (i1 << 16) | (i0 << 24);
    return result;
  }

  setIntegerAt(intQuality: number, elementIndex: number): void {
    const bytes: Int32Array = new Int32Array(4);
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
  public static getBytes(
    intQuality: number,
    bytes: Int32Array | undefined
  ): Int32Array | undefined {
    if (!bytes) {
      let bytes: Int32Array = new Int32Array(4);
      Quality.getBytes(intQuality, bytes);
      return bytes;
    }
    if (bytes.length !== 4) {
      throw new Error(
        "<ERROR> QualityTx.getBytes(int,byte[]) : Byte array must be of size 4 before passed to this method"
      );
    }
    bytes[3] = intQuality & Quality.MASK_BYTE;
    bytes[2] = (intQuality >> 8) & Quality.MASK_BYTE;
    bytes[1] = (intQuality >> 16) & Quality.MASK_BYTE;
    bytes[0] = (intQuality >> 24) & Quality.MASK_BYTE;
    return;
  }

  public setElementAt(bytes: Int32Array, elementIndex: number): void {
    if (elementIndex > this._size || elementIndex < 0) {
      throw new Error(
        `Index of: ${elementIndex} Out of range[0 - ${this._size}]`
      );
    }

    const qualityInt: number =
      ((bytes[0] & Quality.MASK_BYTE) << 24) |
      ((bytes[1] & Quality.MASK_BYTE) << 16) |
      ((bytes[2] & Quality.MASK_BYTE) << 8) |
      (bytes[3] & Quality.MASK_BYTE);

    const cleanedInt: number = Quality.cleanQualityInteger(qualityInt);

    const cleanedBytes: Int32Array = new Int32Array([
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

  public static isAccepted(bytes: Int32Array): boolean {
    // No Revision Replacement Method set 0 = 0000
    // "A" for Original Value is Accepted
    return (
      Quality.isBitSet(bytes, Quality.SCREENED_BIT) &&
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
      Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT3)
    );
  }

  public static isAccepted_int(intQuality: number): boolean {
    // No Revision Replacement Method set 0 = 0000
    // "A" for Original Value is Accepted
    return (
      Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT) &&
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
      Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT3)
    );
  }

  public static isInterpolated(bytes: Int32Array): boolean {
    // Linear Interpolation Replacement Method set 1 = 0001
    // "I" for Interpolated Value
    return (
      Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT0) &&
      Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT1) &&
      Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT2) &&
      Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT3)
    );
  }

  public static isInterpolated_int(intQuality: number): boolean {
    // Linear Interpolation Replacement Method set 1 = 0001
    // "I" for Interpolated Value
    return (
      Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT0) &&
      Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT1) &&
      Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT2) &&
      Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT3)
    );
  }

  public static isKeyboardInput(bytes: Int32Array): boolean {
    // Manual Change Replacement Method set 2 = 0010
    // "K" for Keyboard Input
    return (
      Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT0) &&
      Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT1) &&
      Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT2) &&
      Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT3)
    );
  }

  public static isKeyboardInput_int(intQuality: number): boolean {
    // Manual Change Replacement Method set 2 = 0010
    // "K" for Keyboard Input
    return (
      Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT0) &&
      Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT1) &&
      Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT2) &&
      Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT3)
    );
  }

  public static isGraphicalEstimate(bytes: Int32Array): boolean {
    // Manual Change Replacement Method set 4 = 0100
    // "E" for Graphical Estimate
    return (
      Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT0) &&
      Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT1) &&
      Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT2) &&
      Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT3)
    );
  }

  public static isGraphicalEstimate_int(intQuality: number): boolean {
    // Manual Change Replacement Method set 4 = 0100
    // "E" for Graphical Estimate
    return (
      Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT0) &&
      Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT1) &&
      Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT2) &&
      Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT3)
    );
  }

  public isMissing(
    elementIndex: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    // if (!isBitSet(elementIndex, SCREENED_BIT))
    // {
    // throw new DataSetTxQualityFlagException(
    // "Method: <isMissing> Element not screened: " + elementIndex);
    // }
    return this.isBitSet(elementIndex, Quality.MISSING_BIT);
  }

  public isNotMissing(elementIndex: number): boolean {
    return Quality.isBitClear_int(elementIndex, Quality.MISSING_BIT);
  }

  public clearMissing(elementIndex: number): void {
    Quality.clearBit_int(elementIndex, Quality.MISSING_BIT);
    Quality.setBit_int(elementIndex, Quality.SCREENED_BIT);
  }

  public setMissing(elementIndex: number): void {
    Quality.setBit_int(elementIndex, Quality.MISSING_BIT);
    Quality.clearBit_int(elementIndex, Quality.OKAY_BIT);
    Quality.clearBit_int(elementIndex, Quality.QUESTION_BIT);
    Quality.clearBit_int(elementIndex, Quality.REJECT_BIT);
    Quality.setBit_int(elementIndex, Quality.SCREENED_BIT);
  }

  public static isMissing(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    // if (!isBitSet(bytes, SCREENED_BIT))
    // {
    // throw new DataSetTxQualityFlagException(
    // "Method: <isMissing> Element not screened: " + bytes);
    // }
    return Quality.isBitSet(bytes, Quality.MISSING_BIT);
  }

  public static isMissing_int(intQuality: number): boolean {
    return (
      Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT) &&
      Quality.isBitSet_int(intQuality, Quality.MISSING_BIT)
    );
  }

  public static isNotMissing(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isMissing(bytes);
  }

  public static isNotMissing_int(
    intQuality: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isMissing_int(intQuality);
  }

  public static clearMissing(bytes: Int32Array): Int32Array {
    const tmp: Int32Array = Quality.clearBit(bytes, Quality.MISSING_BIT);
    return Quality.setBit(tmp, Quality.SCREENED_BIT);
  }

  public static clearMissing_int(intQuality: number): number {
    return Quality.setBit_int(
      Quality.clearBit_int(intQuality, Quality.MISSING_BIT),
      Quality.SCREENED_BIT
    );
  }

  public static setMissing(bytes: Int32Array): Int32Array {
    let tmp: Int32Array = Quality.setBit(bytes, Quality.MISSING_BIT);
    tmp = Quality.clearBit(tmp, Quality.OKAY_BIT);
    tmp = Quality.clearBit(tmp, Quality.QUESTION_BIT);
    tmp = Quality.clearBit(tmp, Quality.REJECT_BIT);
    return Quality.setBit(tmp, Quality.SCREENED_BIT);
  }

  public static setMissing_int(intQuality: number): number {
    let tmp: number = Quality.setBit_int(intQuality, Quality.MISSING_BIT);
    tmp = Quality.clearBit_int(tmp, Quality.OKAY_BIT);
    tmp = Quality.clearBit_int(tmp, Quality.QUESTION_BIT);
    tmp = Quality.clearBit_int(tmp, Quality.REJECT_BIT);
    return Quality.setBit_int(tmp, Quality.SCREENED_BIT);
  }

  public isProtected(elementIndex: number): boolean {
    return (
      Quality.isScreened_int(elementIndex) &&
      Quality.isBitSet_int(elementIndex, Quality.PROTECTED_BIT)
    );
  }

  public isNotProtected(elementIndex: number): boolean {
    return !Quality.isProtected_int(elementIndex);
  }

  public clearProtected(elementIndex: number): void {
    Quality.clearBit_int(elementIndex, Quality.PROTECTED_BIT);
    Quality.setBit_int(elementIndex, Quality.SCREENED_BIT);
  }

  public setProtected(elementIndex: number): void {
    Quality.setBit_int(elementIndex, Quality.PROTECTED_BIT);
    Quality.setBit_int(elementIndex, Quality.SCREENED_BIT);
  }

  public static isProtected(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    return Quality.isBitSet(bytes, Quality.PROTECTED_BIT);
  }

  public static isProtected_int(
    intQuality: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    return Quality.isBitSet_int(intQuality, Quality.PROTECTED_BIT);
  }

  public static isNotProtected(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isProtected(bytes);
  }

  public static isNotProtected_int(
    intQuality: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isProtected_int(intQuality);
  }

  public static clearProtected(bytes: Int32Array): Int32Array {
    const tmp: Int32Array = Quality.clearBit(bytes, Quality.PROTECTED_BIT);
    return Quality.setBit(tmp, Quality.SCREENED_BIT);
  }

  public static clearProtected_int(intQuality: number): number {
    return Quality.setBit_int(
      Quality.clearBit_int(intQuality, Quality.PROTECTED_BIT),
      Quality.SCREENED_BIT
    );
  }

  public static setProtected(bytes: Int32Array): Int32Array {
    return Quality.setBit(
      Quality.setBit(bytes, Quality.PROTECTED_BIT),
      Quality.SCREENED_BIT
    );
  }

  public static setProtected_int(intQuality: number): number {
    return Quality.setBit_int(
      Quality.setBit_int(intQuality, Quality.PROTECTED_BIT),
      Quality.SCREENED_BIT
    );
  }

  public static isBitClear(bytes: Int32Array, bitPosition: number): boolean {
    return !Quality.isBitSet(bytes, bitPosition);
  }

  public static isQualityClear(bytes: Int32Array): boolean {
    return Quality.getInteger(bytes) == 0;
  }

  public static isQualityClear_int(intQuality: number): boolean {
    return intQuality == 0;
  }

  public static isBitSet_int(intQuality: number, bitPosition: number): boolean {
    return (intQuality & (1 << (bitPosition - 1))) != 0;
  }

  public static isBitClear_int(
    intQuality: number,
    bitPosition: number
  ): boolean {
    return (intQuality & (1 << (bitPosition - 1))) == 0;
  }

  public static setBit_int(intQuality: number, bitPosition: number): number {
    return intQuality | (1 << (bitPosition - 1));
  }

  public static clearBit_int(intQuality: number, bitPosition: number): number {
    return intQuality & ~(1 << (bitPosition - 1));
  }

  public isBitSet(elementIndex: number, bitPosition: number): boolean {
    if (elementIndex > this._size || elementIndex < 0) {
      throw new RangeError(
        "Index of: " + elementIndex + " Out of range[0 - " + this._size + "]"
      );
    }
    const bytes: Int32Array = this.getElementAt(elementIndex);
    return Quality.isBitSet(bytes, bitPosition);
  }
  public static isBitSet(bytes: Int32Array, bitPosition: number): boolean {
    const targetByte = Math.floor((32 - bitPosition) / 8);
    const targetBit = (bitPosition - 1) % 8;
    const base = bytes[targetByte];
    return (base & Quality.MASK[targetBit]) != 0;
  }

  public isBitClear(elementIndex: number, bitPosition: number): boolean {
    return !this.isBitSet(elementIndex, bitPosition);
  }

  public isQualityClear(elementIndex: number): boolean {
    return this.getIntegerAt(elementIndex) == 0;
  }

  public setBit(elementIndex: number, bitPosition: number): void {
    if (elementIndex > this._size || elementIndex < 0) {
      throw new RangeError(
        "Index of: " + elementIndex + " Out of range[0 - " + this._size
      );
    }
    let bytes: Int32Array = this.getElementAt(elementIndex);
    bytes = Quality.setBit(bytes, bitPosition);
    this.setElementAt(bytes, elementIndex);
    return;
  }

  public static setBit(bytes: Int32Array, bitPosition: number): Int32Array {
    const targetByte = Math.floor((32 - bitPosition) / 8);
    const base = bytes[targetByte];
    const targetBit = (bitPosition - 1) % 8;
    bytes[targetByte] = base | Quality.MASK[targetBit];
    return bytes;
  }

  public clearBit(elementIndex: number, bitPosition: number): void {
    if (elementIndex > this._size || elementIndex < 0) {
      throw new RangeError(
        "Index of: " + elementIndex + " Out of range[0 - " + this._size
      );
    }
    let bytes: Int32Array = this.getElementAt(elementIndex);
    bytes = Quality.clearBit(bytes, bitPosition);
    this.setElementAt(bytes, elementIndex);
    return;
  }

  public static clearBit(bytes: Int32Array, bitPosition: number): Int32Array {
    const targetByte: number = Math.floor((32 - bitPosition) / 8);
    const base: number = bytes[targetByte];
    const targetBit: number = (bitPosition - 1) % 8;
    let result: number = base & Quality.MASK[targetBit];
    if (result != 0) {
      bytes[targetByte] = base ^ Quality.MASK[targetBit];
    }
    return bytes;
  }

  public isScreened(elementIndex: number): boolean {
    return this.isBitSet(elementIndex, Quality.SCREENED_BIT);
  }

  public isNotScreened(elementIndex: number): boolean {
    return this.isBitClear(elementIndex, Quality.SCREENED_BIT);
  }

  public clearQuality(elementIndex: number): void {
    // Clear all quality bits
    let tmpBytes: Int32Array = this.getElementAt(elementIndex);
    let sizeInBytes: number = tmpBytes.length;
    if (sizeInBytes > 0) {
      const tmpByte: number = 0 & Quality.MASK_BYTE;
      for (let i = 0; i < sizeInBytes; i++) {
        tmpBytes[i] = tmpByte;
      }
      this.setElementAt(tmpBytes, elementIndex);
    }
  }

  public clearScreened(elementIndex: number): void {
    this.clearBit(elementIndex, Quality.SCREENED_BIT);
  }

  public setScreened(elementIndex: number): void {
    this.setBit(elementIndex, Quality.SCREENED_BIT);
  }

  public static isScreened(bytes: Int32Array): boolean {
    return Quality.isBitSet(bytes, Quality.SCREENED_BIT);
  }

  public static isScreened_int(intQuality: number): boolean {
    return Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT);
  }

  public static isNotScreened(bytes: Int32Array): boolean {
    return Quality.isBitClear(bytes, Quality.SCREENED_BIT);
  }

  public static isNotScreened_int(intQuality: number): boolean {
    return Quality.isBitClear_int(intQuality, Quality.SCREENED_BIT);
  }

  public static clearQuality(bytes: Int32Array): Int32Array | null {
    // Clear all quality bits
    if (bytes === null) {
      return null;
    }
    const sizeInBytes: number = bytes.length;
    const tmpBytes: Int32Array = new Int32Array(sizeInBytes);
    if (sizeInBytes > 0) {
      const tmpByte: number = 0 & Quality.MASK_BYTE;
      for (let i = 0; i < sizeInBytes; i++) {
        tmpBytes[i] = tmpByte;
      }
    }
    return tmpBytes;
  }

  public static clearQuality_int(
    qualityAsIntegers: number[] | number
  ): number[] | number | null {
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

  public static clearScreened(bytes: Int32Array): Int32Array {
    return Quality.clearBit(bytes, Quality.SCREENED_BIT);
  }

  public static clearScreened_int(intQuality: number): number {
    return this.clearBit_int(intQuality, Quality.SCREENED_BIT);
  }

  public static setScreened(bytes: Int32Array): Int32Array {
    return Quality.setBit(bytes, Quality.SCREENED_BIT);
  }

  public static setScreened_int(intQuality: number): number {
    return Quality.setBit_int(intQuality, Quality.SCREENED_BIT);
  }

  public isQuestion(elementIndex: number): boolean {
    return (
      this.isScreened(elementIndex) &&
      this.isBitSet(elementIndex, Quality.QUESTION_BIT)
    );
  }

  public isNotQuestion(elementIndex: number): boolean {
    return !this.isQuestion(elementIndex);
  }

  public clearQuestion(elementIndex: number): void {
    this.clearBit(elementIndex, Quality.QUESTION_BIT);
    this.setBit(elementIndex, Quality.SCREENED_BIT);
  }

  public setQuestion(elementIndex: number): void {
    this.setBit(elementIndex, Quality.QUESTION_BIT);
    this.clearBit(elementIndex, Quality.OKAY_BIT);
    this.clearBit(elementIndex, Quality.REJECT_BIT);
    this.clearBit(elementIndex, Quality.MISSING_BIT);
    this.setBit(elementIndex, Quality.SCREENED_BIT);
  }

  public static isQuestion(bytes: Int32Array): boolean {
    return this.isScreened(bytes) && this.isBitSet(bytes, Quality.QUESTION_BIT);
  }

  public static isQuestion_int(intQuality: number): boolean {
    return (
      Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT) &&
      Quality.isBitSet_int(intQuality, Quality.QUESTION_BIT)
    );
  }

  public static isNotQuestion(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isQuestion(bytes);
  }

  public static isNotQuestion_int(
    intQuality: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isQuestion_int(intQuality);
  }

  public static clearQuestion(bytes: Int32Array): Int32Array {
    let tmp: Int32Array = Quality.clearBit(bytes, Quality.QUESTION_BIT);
    return Quality.setBit(tmp, Quality.SCREENED_BIT);
  }

  public static clearQuestion_int(intQuality: number): number {
    return this.setBit_int(
      this.clearBit_int(intQuality, Quality.QUESTION_BIT),
      Quality.SCREENED_BIT
    );
  }

  public static setQuestion(bytes: Int32Array): Int32Array {
    let tmp: Int32Array = this.setBit(bytes, Quality.QUESTION_BIT);
    tmp = this.clearBit(tmp, Quality.OKAY_BIT);
    tmp = this.clearBit(tmp, Quality.MISSING_BIT);
    tmp = this.clearBit(tmp, Quality.REJECT_BIT);
    return this.setBit(tmp, Quality.SCREENED_BIT);
  }

  public static setQuestion_int(intQuality: number): number {
    let tmp: number = this.setBit_int(intQuality, Quality.QUESTION_BIT);
    tmp = this.clearBit_int(tmp, Quality.OKAY_BIT);
    tmp = this.clearBit_int(tmp, Quality.MISSING_BIT);
    tmp = this.clearBit_int(tmp, Quality.REJECT_BIT);
    return this.setBit_int(tmp, Quality.SCREENED_BIT);
  }

  public isReject(elementIndex: number): boolean {
    return (
      this.isScreened(elementIndex) &&
      this.isBitSet(elementIndex, Quality.REJECT_BIT)
    );
  }

  public isNotReject(elementIndex: number): boolean {
    return !this.isReject(elementIndex);
  }

  public clearReject(elementIndex: number): void {
    this.clearBit(elementIndex, Quality.REJECT_BIT);
    this.setBit(elementIndex, Quality.SCREENED_BIT);
  }

  public setReject(elementIndex: number): void {
    this.setBit(elementIndex, Quality.REJECT_BIT);
    this.clearBit(elementIndex, Quality.OKAY_BIT);
    this.clearBit(elementIndex, Quality.QUESTION_BIT);
    this.clearBit(elementIndex, Quality.MISSING_BIT);
    this.setBit(elementIndex, Quality.SCREENED_BIT);
  }

  public clearRange(elementIndex: number): void {
    this.clearBit(elementIndex, Quality.RANGE_OF_VALUE_BIT0);
    this.clearBit(elementIndex, Quality.RANGE_OF_VALUE_BIT1);
  }

  public setRange0(elementIndex: number): void {
    // Range of value is below first limit
    // Set value = 0 as bit pattern 00
    this.clearBit(elementIndex, Quality.RANGE_OF_VALUE_BIT0);
    this.clearBit(elementIndex, Quality.RANGE_OF_VALUE_BIT1);
  }

  public setRange1(elementIndex: number): void {
    // Range of value is between first and second limits
    // Set value = 1 as bit pattern 01
    this.setBit(elementIndex, Quality.RANGE_OF_VALUE_BIT0);
    this.clearBit(elementIndex, Quality.RANGE_OF_VALUE_BIT1);
  }

  public setRange2(elementIndex: number): void {
    // Range of value is between second and third limits
    // Set value = 2 as bit pattern 10
    this.clearBit(elementIndex, Quality.RANGE_OF_VALUE_BIT0);
    this.setBit(elementIndex, Quality.RANGE_OF_VALUE_BIT1);
  }

  public setRange3(elementIndex: number): void {
    // Range of value is greater than the third limit
    // Set value = 3 as bit pattern 11
    this.setBit(elementIndex, Quality.RANGE_OF_VALUE_BIT0);
    this.setBit(elementIndex, Quality.RANGE_OF_VALUE_BIT1);
  }

  public isDifferentValue(elementIndex: number): boolean {
    return this.isBitSet(elementIndex, Quality.VALUE_DIFFERS_BIT);
  }

  public isNotDifferentValue(elementIndex: number): boolean {
    return !this.isDifferentValue(elementIndex);
  }

  private clearDifferentValue(elementIndex: number): void {
    // Value same as original value
    this.clearBit(elementIndex, Quality.VALUE_DIFFERS_BIT);
  }

  private setDifferentValue(elementIndex: number): void {
    // Value differs from original value
    // Once set cannot be cleared, except by clearQuality
    this.setBit(elementIndex, Quality.VALUE_DIFFERS_BIT);
  }

  public isRevised(
    elementIndex: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    // Is Revised if
    // differs from original value,
    // is manually entered, or
    // has a replacement method set
    return (
      this.isDifferentValue(elementIndex) ||
      (this.isBitSet(elementIndex, Quality.HOW_REVISED_BIT0) &&
        this.isBitSet(elementIndex, Quality.HOW_REVISED_BIT1) &&
        !this.isBitSet(elementIndex, Quality.HOW_REVISED_BIT2)) ||
      this.isBitSet(elementIndex, Quality.REPLACE_METHOD_BIT0) ||
      this.isBitSet(elementIndex, Quality.REPLACE_METHOD_BIT1) ||
      this.isBitSet(elementIndex, Quality.REPLACE_METHOD_BIT2) ||
      this.isBitSet(elementIndex, Quality.REPLACE_METHOD_BIT3)
    );
  }

  public isNotRevised(elementIndex: number): boolean {
    return !this.isRevised(elementIndex);
  }

  public clearHowRevised(elementIndex: number): void {
    this.clearBit(elementIndex, Quality.HOW_REVISED_BIT0);
    this.clearBit(elementIndex, Quality.HOW_REVISED_BIT1);
    this.clearBit(elementIndex, Quality.HOW_REVISED_BIT2);
  }

  public clearReplaceMethod(elementIndex: number): void {
    this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT0);
    this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT1);
    this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT2);
    this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT3);
  }

  public setRevisedNoRevision(elementIndex: number): void {
    this.clearHowRevised(elementIndex);
  }

  public setReplaceNoRevision(elementIndex: number): void {
    this.clearReplaceMethod(elementIndex);
  }

  public setNoRevision(elementIndex: number): void {
    this.setRevisedNoRevision(elementIndex);
    this.setReplaceNoRevision(elementIndex);
  }

  public setRevisedAutomatically(elementIndex: number): void {
    // DATCHK or Automatic Process has performed revision
    // Set value = 1 as bit pattern 001
    this.setOkay(elementIndex);
    this.setDifferentValue(elementIndex);
    this.setBit(elementIndex, Quality.HOW_REVISED_BIT0);
    this.clearBit(elementIndex, Quality.HOW_REVISED_BIT1);
    this.clearBit(elementIndex, Quality.HOW_REVISED_BIT2);
  }

  public static isRevisedInteractivelyCheckAllBits(bytes: Int32Array): boolean {
    return (
      Quality.isBitSet(bytes, Quality.SCREENED_BIT) &&
      Quality.isBitSet(bytes, Quality.OKAY_BIT) &&
      Quality.isBitClear(bytes, Quality.MISSING_BIT) &&
      Quality.isBitClear(bytes, Quality.QUESTION_BIT) &&
      Quality.isBitClear(bytes, Quality.REJECT_BIT) &&
      Quality.isBitSet(bytes, Quality.VALUE_DIFFERS_BIT) &&
      Quality.isRevisedInteractively(bytes)
    );
  }

  public static isRevisedInteractivelyCheckAllBits_int(
    intQuality: number
  ): boolean {
    return (
      Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT) &&
      Quality.isBitSet_int(intQuality, Quality.OKAY_BIT) &&
      Quality.isBitClear_int(intQuality, Quality.MISSING_BIT) &&
      Quality.isBitClear_int(intQuality, Quality.QUESTION_BIT) &&
      Quality.isBitClear_int(intQuality, Quality.REJECT_BIT) &&
      Quality.isBitSet_int(intQuality, Quality.VALUE_DIFFERS_BIT) &&
      Quality.isRevisedInteractively_int(intQuality)
    );
  }

  public static isRevisedInteractively(bytes: Int32Array): boolean {
    // DATVUE or Interactive Process has performed revision
    // Value = 2 as bit pattern 010
    return (
      Quality.isBitClear(bytes, Quality.HOW_REVISED_BIT0) &&
      Quality.isBitSet(bytes, Quality.HOW_REVISED_BIT1) &&
      Quality.isBitClear(bytes, Quality.HOW_REVISED_BIT2)
    );
  }

  public static isRevisedInteractively_int(intQuality: number): boolean {
    // DATVUE or Interactive Process has performed revision
    // Value = 2 as bit pattern 010
    return (
      Quality.isBitClear_int(intQuality, Quality.HOW_REVISED_BIT0) &&
      Quality.isBitSet_int(intQuality, Quality.HOW_REVISED_BIT1) &&
      Quality.isBitClear_int(intQuality, Quality.HOW_REVISED_BIT2)
    );
  }

  public setRevisedInteractively(elementIndex: number): void {
    // DATVUE or Interactive Process has performed revision
    // Set value = 2 as bit pattern 010
    this.setOkay(elementIndex);
    this.setDifferentValue(elementIndex);
    this.clearBit(elementIndex, Quality.HOW_REVISED_BIT0);
    this.setBit(elementIndex, Quality.HOW_REVISED_BIT1);
    this.clearBit(elementIndex, Quality.HOW_REVISED_BIT2);
  }

  public setRevisedManually(elementIndex: number): void {
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
  public setRevisedToOriginalAccepted(elementIndex: number): void {
    // DATVUE or Interactive Process has accepted original value
    // Set value = 4 as bit pattern 100
    this.setOkay(elementIndex);
    this.clearBit(elementIndex, Quality.HOW_REVISED_BIT0);
    this.clearBit(elementIndex, Quality.HOW_REVISED_BIT1);
    this.setBit(elementIndex, Quality.HOW_REVISED_BIT2);
    this.clearReplaceMethod(elementIndex);
  }

  public setReplaceLinearInterpolation(elementIndex: number): void {
    // Replacement method is linear interpolation
    // Set value = 1 as bit pattern 0001
    this.setOkay(elementIndex);
    this.setDifferentValue(elementIndex);
    this.setBit(elementIndex, Quality.REPLACE_METHOD_BIT0);
    this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT1);
    this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT2);
    this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT3);
  }

  public setReplaceManualChange(elementIndex: number): void {
    // Replacement method is manual Change
    // Set value = 2 as bit pattern 0010
    this.setOkay(elementIndex);
    this.setDifferentValue(elementIndex);
    this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT0);
    this.setBit(elementIndex, Quality.REPLACE_METHOD_BIT1);
    this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT2);
    this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT3);
  }

  public setReplaceGraphicalChange(elementIndex: number): void {
    // Replacement method is graphical Change
    // Set value = 4 as bit pattern 0100
    this.setOkay(elementIndex);
    this.setDifferentValue(elementIndex);
    this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT0);
    this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT1);
    this.setBit(elementIndex, Quality.REPLACE_METHOD_BIT2);
    this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT3);
  }

  public setReplaceWithMissing(elementIndex: number): void {
    // Replacement method is replace with missing
    // Set value = 3 as bit pattern 0011
    this.setMissing(elementIndex);
    this.setDifferentValue(elementIndex);
    this.setBit(elementIndex, Quality.REPLACE_METHOD_BIT0);
    this.setBit(elementIndex, Quality.REPLACE_METHOD_BIT1);
    this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT2);
    this.clearBit(elementIndex, Quality.REPLACE_METHOD_BIT3);
  }

  public static isReject(bytes: Int32Array): boolean {
    return (
      Quality.isScreened(bytes) && Quality.isBitSet(bytes, Quality.REJECT_BIT)
    );
  }

  public static isReject_int(intQuality: number): boolean {
    return (
      Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT) &&
      Quality.isBitSet_int(intQuality, Quality.REJECT_BIT)
    );
  }

  public static isNotReject(bytes: Int32Array): boolean {
    return !Quality.isReject(bytes);
  }

  public static isNotReject_int(
    intQuality: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isReject_int(intQuality);
  }

  public static clearReject(bytes: Int32Array): Int32Array {
    let tmp: Int32Array = Quality.clearBit(bytes, Quality.REJECT_BIT);
    return Quality.setBit(tmp, Quality.SCREENED_BIT);
  }

  public static clearReject_int(intQuality: number): number {
    return Quality.setBit_int(
      Quality.clearBit_int(intQuality, Quality.REJECT_BIT),
      Quality.SCREENED_BIT
    );
  }

  public static setReject(bytes: Int32Array): Int32Array {
    let tmp: Int32Array = Quality.setBit(bytes, Quality.REJECT_BIT);
    tmp = Quality.clearBit(tmp, Quality.OKAY_BIT);
    tmp = Quality.clearBit(tmp, Quality.QUESTION_BIT);
    tmp = Quality.clearBit(tmp, Quality.MISSING_BIT);
    return Quality.setBit(tmp, Quality.SCREENED_BIT);
  }

  public static setReject_int(intQuality: number): number {
    let tmp: number = Quality.setBit_int(intQuality, Quality.REJECT_BIT);
    tmp = Quality.clearBit_int(tmp, Quality.OKAY_BIT);
    tmp = Quality.clearBit_int(tmp, Quality.QUESTION_BIT);
    tmp = Quality.clearBit_int(tmp, Quality.MISSING_BIT);
    return Quality.setBit_int(tmp, Quality.SCREENED_BIT);
  }

  public static clearRange(bytes: Int32Array): Int32Array {
    const tmp: Int32Array = Quality.clearBit(
      bytes,
      Quality.RANGE_OF_VALUE_BIT0
    );
    return Quality.clearBit(tmp, Quality.RANGE_OF_VALUE_BIT1);
  }

  public static clearRange_int(intQuality: number): number {
    return Quality.clearBit_int(
      Quality.clearBit_int(intQuality, Quality.RANGE_OF_VALUE_BIT0),
      Quality.RANGE_OF_VALUE_BIT1
    );
  }

  public static setRange0(bytes: Int32Array): Int32Array {
    // Range of value is below first limit
    // Set value = 0 as bit pattern 00
    const tmp: Int32Array = Quality.clearBit(
      bytes,
      Quality.RANGE_OF_VALUE_BIT0
    );
    return Quality.clearBit(tmp, Quality.RANGE_OF_VALUE_BIT1);
  }

  public static setRange0_int(intQuality: number): number {
    // Range of value is below first limit
    // Set value = 0 as bit pattern 00
    return Quality.clearBit_int(
      Quality.clearBit_int(intQuality, Quality.RANGE_OF_VALUE_BIT0),
      Quality.RANGE_OF_VALUE_BIT1
    );
  }

  public static isRange1(bytes: Int32Array): boolean {
    // Range of value is between first and second limits
    // Value = 1 as bit pattern 01
    return (
      Quality.isBitSet(bytes, Quality.RANGE_OF_VALUE_BIT0) &&
      Quality.isBitClear(bytes, Quality.RANGE_OF_VALUE_BIT1)
    );
  }

  public static isRange1_int(intQuality: number): boolean {
    // Range of value is between first and second limits
    // Value = 1 as bit pattern 01
    return (
      Quality.isBitSet_int(intQuality, Quality.RANGE_OF_VALUE_BIT0) &&
      Quality.isBitClear_int(intQuality, Quality.RANGE_OF_VALUE_BIT1)
    );
  }

  public static setRange1(bytes: Int32Array): Int32Array {
    // Range of value is between first and second limits
    // Set value = 1 as bit pattern 01
    const tmp: Int32Array = Quality.setBit(bytes, Quality.RANGE_OF_VALUE_BIT0);
    return Quality.clearBit(tmp, Quality.RANGE_OF_VALUE_BIT1);
  }

  public static setRange1_int(intQuality: number): number {
    // Range of value is between first and second limits
    // Set value = 1 as bit pattern 01
    return Quality.clearBit_int(
      Quality.setBit_int(intQuality, Quality.RANGE_OF_VALUE_BIT0),
      Quality.RANGE_OF_VALUE_BIT1
    );
  }

  public static isRange2(bytes: Int32Array): boolean {
    // Range of value is between second and third limits
    // Value = 2 as bit pattern 10
    return (
      Quality.isBitClear(bytes, Quality.RANGE_OF_VALUE_BIT0) &&
      Quality.isBitSet(bytes, Quality.RANGE_OF_VALUE_BIT1)
    );
  }

  public static isRange2_int(intQuality: number): boolean {
    // Range of value is between second and third limits
    // Value = 2 as bit pattern 10
    return (
      Quality.isBitClear_int(intQuality, Quality.RANGE_OF_VALUE_BIT0) &&
      Quality.isBitSet_int(intQuality, Quality.RANGE_OF_VALUE_BIT1)
    );
  }

  public static setRange2(bytes: Int32Array): Int32Array {
    // Range of value is between second and third limits
    // Set value = 2 as bit pattern 10
    const tmp: Int32Array = Quality.clearBit(
      bytes,
      Quality.RANGE_OF_VALUE_BIT0
    );
    return Quality.setBit(tmp, Quality.RANGE_OF_VALUE_BIT1);
  }

  public static setRange2_int(intQuality: number): number {
    // Range of value is between second and third limits
    // Set value = 2 as bit pattern 10
    return Quality.setBit_int(
      Quality.clearBit_int(intQuality, Quality.RANGE_OF_VALUE_BIT0),
      Quality.RANGE_OF_VALUE_BIT1
    );
  }

  public static isRange3(bytes: Int32Array): boolean {
    // Range of value is between second and third limits
    // Value = 3 as bit pattern 11
    return (
      Quality.isBitSet(bytes, Quality.RANGE_OF_VALUE_BIT0) &&
      Quality.isBitSet(bytes, Quality.RANGE_OF_VALUE_BIT1)
    );
  }

  public static isRange3_int(intQuality: number): boolean {
    // Range of value is between second and third limits
    // Value = 3 as bit pattern 11
    return (
      Quality.isBitSet_int(intQuality, Quality.RANGE_OF_VALUE_BIT0) &&
      Quality.isBitSet_int(intQuality, Quality.RANGE_OF_VALUE_BIT1)
    );
  }

  public static setRange3(bytes: Int32Array): Int32Array {
    // Range of value is between second and third limits
    // Set value = 3 as bit pattern 11
    const tmp = Quality.setBit(bytes, Quality.RANGE_OF_VALUE_BIT0);
    return Quality.setBit(tmp, Quality.RANGE_OF_VALUE_BIT1);
  }

  public static setRange3_int(intQuality: number): number {
    // Range of value is between second and third limits
    // Set value = 3 as bit pattern 11
    return Quality.setBit_int(
      Quality.setBit_int(intQuality, Quality.RANGE_OF_VALUE_BIT0),
      Quality.RANGE_OF_VALUE_BIT1
    );
  }

  public static isDifferentValue(bytes: Int32Array): boolean {
    return Quality.isBitSet(bytes, Quality.VALUE_DIFFERS_BIT);
  }

  public static isDifferentValue_int(intQuality: number): boolean {
    return Quality.isBitSet_int(intQuality, Quality.VALUE_DIFFERS_BIT);
  }

  public static isNotDifferentValue(bytes: Int32Array): boolean {
    return !Quality.isDifferentValue(bytes);
  }

  public static isNotDifferentValue_int(intQuality: number): boolean {
    return !Quality.isDifferentValue_int(intQuality);
  }

  public static clearDifferentValue(bytes: Int32Array): Int32Array {
    // Value same as original value
    return Quality.clearBit(bytes, Quality.VALUE_DIFFERS_BIT);
  }

  public static clearDifferentValue_int(intQuality: number): number {
    // Value same as original value
    return Quality.clearBit_int(intQuality, Quality.VALUE_DIFFERS_BIT);
  }

  private static setDifferentValue(bytes: Int32Array): Int32Array {
    // Value differs from original value
    // Once set cannot be cleared, except by clearQuality
    return Quality.setBit(bytes, Quality.VALUE_DIFFERS_BIT);
  }

  private static setDifferentValue_int(intQuality: number): number {
    // Value differs from original value
    // Once set cannot be cleared, except by clearQuality
    return Quality.setBit_int(intQuality, Quality.VALUE_DIFFERS_BIT);
  }

  public static isRevised(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    // Is Revised if
    // differs from original value,
    // is manually entered, or
    // has a replacement method set
    return (
      Quality.isDifferentValue(bytes) ||
      (Quality.isBitSet(bytes, Quality.HOW_REVISED_BIT0) &&
        Quality.isBitSet(bytes, Quality.HOW_REVISED_BIT1) &&
        !Quality.isBitSet(bytes, Quality.HOW_REVISED_BIT2)) ||
      Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT0) ||
      Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT1) ||
      Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT2) ||
      Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT3)
    );
  }

  public static isRevised_int(
    intQuality: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    // Is Revised if
    // differs from original value,
    // is manually entered, or
    // has a replacement method set
    return (
      Quality.isDifferentValue_int(intQuality) ||
      (Quality.isBitSet_int(intQuality, Quality.HOW_REVISED_BIT0) &&
        Quality.isBitSet_int(intQuality, Quality.HOW_REVISED_BIT1) &&
        !Quality.isBitSet_int(intQuality, Quality.HOW_REVISED_BIT2)) ||
      Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT0) ||
      Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT1) ||
      Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT2) ||
      Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT3)
    );
  }

  public static isNotRevised(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isRevised(bytes);
  }

  public isNotRevised_int(
    intQuality: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isRevised_int(intQuality);
  }

  public static clearHowRevised(bytes: Int32Array): Int32Array {
    let tmp: Int32Array = Quality.clearBit(bytes, Quality.HOW_REVISED_BIT0);
    tmp = Quality.clearBit(tmp, Quality.HOW_REVISED_BIT1);
    return Quality.clearBit(tmp, Quality.HOW_REVISED_BIT2);
  }

  public static clearHowRevised_int(intQuality: number): number {
    let tmp: number = Quality.clearBit_int(
      intQuality,
      Quality.HOW_REVISED_BIT0
    );
    tmp = Quality.clearBit_int(tmp, Quality.HOW_REVISED_BIT1);
    return Quality.clearBit_int(tmp, Quality.HOW_REVISED_BIT2);
  }

  public static clearReplaceMethod(bytes: Int32Array): Int32Array {
    let tmp: Int32Array = Quality.clearBit(bytes, Quality.REPLACE_METHOD_BIT0);
    tmp = Quality.clearBit(tmp, Quality.REPLACE_METHOD_BIT1);
    tmp = Quality.clearBit(tmp, Quality.REPLACE_METHOD_BIT2);
    return Quality.clearBit(tmp, Quality.REPLACE_METHOD_BIT3);
  }

  public static clearReplaceMethod_int(intQuality: number): number {
    let tmp: number = Quality.clearBit_int(
      intQuality,
      Quality.REPLACE_METHOD_BIT0
    );
    tmp = Quality.clearBit_int(tmp, Quality.REPLACE_METHOD_BIT1);
    tmp = Quality.clearBit_int(tmp, Quality.REPLACE_METHOD_BIT2);
    return Quality.clearBit_int(tmp, Quality.REPLACE_METHOD_BIT3);
  }

  public static setReplaceNoRevision(bytes: Int32Array): Int32Array {
    return Quality.clearReplaceMethod(bytes);
  }

  public static setReplaceNoRevision_int(intQuality: number): number {
    return Quality.clearReplaceMethod_int(intQuality);
  }

  public static setNoRevision(bytes: Int32Array): Int32Array {
    const tmp: Int32Array = Quality.clearHowRevised(bytes);
    return Quality.clearReplaceMethod(tmp);
  }

  public static setNoRevision_int(intQuality: number): number {
    const tmp: number = Quality.clearHowRevised_int(intQuality);
    return Quality.clearReplaceMethod_int(tmp);
  }

  public static setRevisedAutomatically(bytes: Int32Array): Int32Array {
    // DATCHK or Automatic Process has performed revision
    // Set value = 1 as bit pattern 001
    Quality.setOkay(bytes);
    Quality.setDifferentValue(bytes);
    let tmp: Int32Array = Quality.setBit(bytes, Quality.HOW_REVISED_BIT0);
    tmp = Quality.clearBit(tmp, Quality.HOW_REVISED_BIT1);
    return Quality.clearBit(tmp, Quality.HOW_REVISED_BIT2);
  }

  public static setRevisedAutomatically_int(intQuality: number): number {
    // DATCHK or Automatic Process has performed revision
    // Set value = 1 as bit pattern 001
    let tmp: number = Quality.setOkay_int(intQuality);
    tmp = Quality.setDifferentValue_int(tmp);
    tmp = Quality.setBit_int(intQuality, Quality.HOW_REVISED_BIT0);
    tmp = Quality.clearBit_int(tmp, Quality.HOW_REVISED_BIT1);
    return Quality.clearBit_int(tmp, Quality.HOW_REVISED_BIT2);
  }

  public static isRevisedAutomaticallyCheckAllBits(bytes: Int32Array): boolean {
    return (
      Quality.isBitSet(bytes, Quality.SCREENED_BIT) &&
      Quality.isBitSet(bytes, Quality.OKAY_BIT) &&
      Quality.isBitClear(bytes, Quality.MISSING_BIT) &&
      Quality.isBitClear(bytes, Quality.QUESTION_BIT) &&
      Quality.isBitClear(bytes, Quality.REJECT_BIT) &&
      Quality.isBitSet(bytes, Quality.VALUE_DIFFERS_BIT) &&
      Quality.isRevisedAutomatically(bytes)
    );
  }

  public static isRevisedAutomaticallyCheckAllBits_int(
    intQuality: number
  ): boolean {
    return (
      Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT) &&
      Quality.isBitSet_int(intQuality, Quality.OKAY_BIT) &&
      Quality.isBitClear_int(intQuality, Quality.MISSING_BIT) &&
      Quality.isBitClear_int(intQuality, Quality.QUESTION_BIT) &&
      Quality.isBitClear_int(intQuality, Quality.REJECT_BIT) &&
      Quality.isBitSet_int(intQuality, Quality.VALUE_DIFFERS_BIT) &&
      Quality.isRevisedAutomatically_int(intQuality)
    );
  }

  public static isRevisedAutomatically(bytes: Int32Array): boolean {
    // DATCHK or Automatic Process has performed revision
    // value = 1 as bit pattern 001
    return (
      Quality.isBitSet(bytes, Quality.HOW_REVISED_BIT0) &&
      Quality.isBitClear(bytes, Quality.HOW_REVISED_BIT1) &&
      Quality.isBitClear(bytes, Quality.HOW_REVISED_BIT2)
    );
  }

  public static isRevisedAutomatically_int(intQuality: number): boolean {
    // DATCHK or Automatic Process has performed revision
    // value = 1 as bit pattern 001
    return (
      Quality.isBitSet_int(intQuality, Quality.HOW_REVISED_BIT0) &&
      Quality.isBitClear_int(intQuality, Quality.HOW_REVISED_BIT1) &&
      Quality.isBitClear_int(intQuality, Quality.HOW_REVISED_BIT2)
    );
  }

  public static setRevisedInteractively(bytes: Int32Array): Int32Array {
    // DATVUE or Interactive Process has performed revision
    // Set value = 2 as bit pattern 010
    Quality.setOkay(bytes);
    Quality.setDifferentValue(bytes);
    let tmp: Int32Array = Quality.clearBit(bytes, Quality.HOW_REVISED_BIT0);
    tmp = Quality.setBit(tmp, Quality.HOW_REVISED_BIT1);
    return Quality.clearBit(tmp, Quality.HOW_REVISED_BIT2);
  }

  public static setRevisedInteractively_int(intQuality: number): number {
    // DATVUE or Interactive Process has performed revision
    // Set value = 2 as bit pattern 010
    let tmp: number = Quality.setOkay_int(intQuality);
    tmp = Quality.setDifferentValue_int(intQuality);
    tmp = Quality.clearBit_int(intQuality, Quality.HOW_REVISED_BIT0);
    tmp = Quality.setBit_int(tmp, Quality.HOW_REVISED_BIT1);
    return Quality.clearBit_int(tmp, Quality.HOW_REVISED_BIT2);
  }

  public static isRevisedManuallyCheckAllBits(bytes: Int32Array): boolean {
    return (
      Quality.isBitSet(bytes, Quality.SCREENED_BIT) &&
      Quality.isBitSet(bytes, Quality.OKAY_BIT) &&
      Quality.isBitClear(bytes, Quality.MISSING_BIT) &&
      Quality.isBitClear(bytes, Quality.QUESTION_BIT) &&
      Quality.isBitClear(bytes, Quality.REJECT_BIT) &&
      Quality.isBitSet(bytes, Quality.VALUE_DIFFERS_BIT) &&
      Quality.isRevisedManually(bytes)
    );
  }

  public static isRevisedManually(bytes: Int32Array): boolean {
    // DATVUE or Interactive Process has performed revision
    // Value = 3 as bit pattern 011
    return (
      Quality.isBitSet(bytes, Quality.HOW_REVISED_BIT0) &&
      Quality.isBitSet(bytes, Quality.HOW_REVISED_BIT1) &&
      Quality.isBitClear(bytes, Quality.HOW_REVISED_BIT2)
    );
  }

  public static isRevisedManuallyCheckAllBits_int(intQuality: number): boolean {
    return (
      Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT) &&
      Quality.isBitSet_int(intQuality, Quality.OKAY_BIT) &&
      Quality.isBitClear_int(intQuality, Quality.MISSING_BIT) &&
      Quality.isBitClear_int(intQuality, Quality.QUESTION_BIT) &&
      Quality.isBitClear_int(intQuality, Quality.REJECT_BIT) &&
      Quality.isBitSet_int(intQuality, Quality.VALUE_DIFFERS_BIT) &&
      Quality.isRevisedManually_int(intQuality)
    );
  }

  public static isRevisedManually_int(intQuality: number): boolean {
    // DATVUE or Interactive Process has performed revision
    // Value = 3 as bit pattern 011
    return (
      Quality.isBitSet_int(intQuality, Quality.HOW_REVISED_BIT0) &&
      Quality.isBitSet_int(intQuality, Quality.HOW_REVISED_BIT1) &&
      Quality.isBitClear_int(intQuality, Quality.HOW_REVISED_BIT2)
    );
  }

  public static setRevisedManually(bytes: Int32Array): Int32Array {
    // DATVUE or Interactive Process has performed revision
    // Set value = 3 as bit pattern 011
    Quality.setOkay(bytes);
    Quality.setDifferentValue(bytes);
    let tmp = Quality.setBit(bytes, Quality.HOW_REVISED_BIT0);
    tmp = Quality.setBit(tmp, Quality.HOW_REVISED_BIT1);
    return Quality.clearBit(tmp, Quality.HOW_REVISED_BIT2);
  }

  public static setRevisedManually_int(intQuality: number): number {
    // DATVUE or Interactive Process has performed revision
    // Set value = 3 as bit pattern 011
    let tmp: number = Quality.setOkay_int(intQuality);
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
  public setUsingQualityFlags(
    originalBytes: Int32Array,
    elementIndex: number,
    qualFlag: string,
    isValueRevised: boolean
  ): void {
    const qual: Int32Array = Quality.getQualUsingFlags(
      originalBytes,
      qualFlag,
      isValueRevised
    );
    this.setElementAt(qual, elementIndex);
  }

  public static getQualUsingFlags(
    originalBytes: Int32Array,
    qualFlag: string,
    isValueRevised: boolean
  ): Int32Array {
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
    } else if (qualFlag.indexOf("M") > -1) {
      if (isValueRevised) {
        Quality.setRevisedManually(newbytes);
      }
      Quality.setMissing(newbytes);
      // QualityTx.setReplaceWithMissing(newbytes);
    } else if (qualFlag.indexOf("Q") > -1) {
      if (isValueRevised) {
        Quality.setRevisedManually(newbytes);
      }
      Quality.setQuestion(newbytes);
    } else if (qualFlag.indexOf("R") > -1) {
      if (isValueRevised) {
        Quality.setRevisedManually(newbytes);
      }
      Quality.setReject(newbytes);
    }
    // Set How Revised, Replacement Method, and Protection bits
    return Quality.getQualUsingReviseReplaceFlags(
      newbytes,
      qualFlag,
      isValueRevised
    );
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
  private setUsingReviseReplaceFlags(
    originalBytes: Int32Array,
    elementIndex: number,
    qualFlag: string,
    isValueRevised: boolean
  ): void {
    const newbytes: Int32Array = Quality.getQualUsingReviseReplaceFlags(
      originalBytes,
      qualFlag,
      isValueRevised
    );
    this.setElementAt(newbytes, elementIndex);
  }

  private static getQualUsingReviseReplaceFlags(
    originalBytes: Int32Array,
    qualFlag: string,
    isValueRevised: boolean
  ): Int32Array {
    const newBytes = new Int32Array(4);
    newBytes.set(originalBytes.slice(0, 4));
    // Set How Revised/Replacement Method Bits
    if (qualFlag.indexOf("E") > -1) {
      Quality.setRevisedManually(newBytes);
      Quality.setReplaceGraphicalChange(newBytes);
    } else if (qualFlag.indexOf("I") > -1) {
      Quality.setRevisedInteractively(newBytes);
      Quality.setReplaceLinearInterpolation(newBytes);
    } else if (qualFlag.indexOf("K") > -1) {
      Quality.setRevisedManually(newBytes);
      Quality.setReplaceManualChange(newBytes);
    }

    // Set Protection Bit
    if (qualFlag.indexOf("P") > -1) {
      Quality.setProtected(newBytes);
    } else if (qualFlag.indexOf("U") > -1) {
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
  public static setRevisedToOriginalAccepted(bytes: Int32Array): Int32Array {
    // DATVUE or Interactive Process has accepted original value
    // Set value = 4 as bit pattern 100
    Quality.setOkay(bytes);
    let tmp: Int32Array = Quality.clearBit(bytes, Quality.HOW_REVISED_BIT0);
    tmp = Quality.clearBit(tmp, Quality.HOW_REVISED_BIT1);
    tmp = Quality.setBit(tmp, Quality.HOW_REVISED_BIT2);
    return Quality.setReplaceNoRevision(tmp);
  }

  public static setRevisedToOriginalAccepted_int(intQuality: number): number {
    // DATVUE or Interactive Process has accepted original value
    // Set value = 4 as bit pattern 100
    let tmp: number = Quality.setOkay_int(intQuality);
    tmp = Quality.clearBit_int(intQuality, Quality.HOW_REVISED_BIT0);
    tmp = Quality.clearBit_int(tmp, Quality.HOW_REVISED_BIT1);
    tmp = Quality.setBit_int(tmp, Quality.HOW_REVISED_BIT2);
    return Quality.setReplaceNoRevision_int(tmp);
  }

  public static isRevisedToOriginalAccepted(bytes: Int32Array): boolean {
    // DATVUE or Interactive Process has accepted original value
    // Value = 4 as bit pattern 100
    return (
      Quality.isBitClear(bytes, Quality.HOW_REVISED_BIT0) &&
      Quality.isBitClear(bytes, Quality.HOW_REVISED_BIT1) &&
      Quality.isBitSet(bytes, Quality.HOW_REVISED_BIT2)
    );
  }

  public static isRevisedToOriginalAccepted_int(intQuality: number): boolean {
    // DATVUE or Interactive Process has accepted original value
    // Value = 4 as bit pattern 100
    return (
      Quality.isBitClear_int(intQuality, Quality.HOW_REVISED_BIT0) &&
      Quality.isBitClear_int(intQuality, Quality.HOW_REVISED_BIT1) &&
      Quality.isBitSet_int(intQuality, Quality.HOW_REVISED_BIT2)
    );
  }

  public static isReplaceLinearInterpolation(bytes: Int32Array): boolean {
    // Replacement method is linear interpolation
    // Value = 1 as bit pattern 0001
    return (
      Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT0) &&
      Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT1) &&
      Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT2) &&
      Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT3)
    );
  }

  public static isReplaceLinearInterpolation_int(intQuality: number): boolean {
    // Replacement method is linear interpolation
    // Value = 1 as bit pattern 0001
    return (
      Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT0) &&
      Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT1) &&
      Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT2) &&
      Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT3)
    );
  }

  public static setReplaceLinearInterpolation(bytes: Int32Array): Int32Array {
    // Replacement method is linear interpolation
    // Set value = 1 as bit pattern 0001
    Quality.setOkay(bytes);
    Quality.setDifferentValue(bytes);
    let tmp: Int32Array = Quality.setBit(bytes, Quality.REPLACE_METHOD_BIT0);
    tmp = Quality.clearBit(tmp, Quality.REPLACE_METHOD_BIT1);
    tmp = Quality.clearBit(tmp, Quality.REPLACE_METHOD_BIT2);
    return Quality.clearBit(tmp, Quality.REPLACE_METHOD_BIT3);
  }

  public static setReplaceLinearInterpolation_int(intQuality: number): number {
    // Replacement method is linear interpolation
    // Set value = 1 as bit pattern 0001
    let tmp: number = Quality.setOkay_int(intQuality);
    tmp = Quality.setDifferentValue_int(intQuality);
    tmp = Quality.setBit_int(intQuality, Quality.REPLACE_METHOD_BIT0);
    tmp = Quality.clearBit_int(tmp, Quality.REPLACE_METHOD_BIT1);
    tmp = Quality.clearBit_int(tmp, Quality.REPLACE_METHOD_BIT2);
    return Quality.clearBit_int(tmp, Quality.REPLACE_METHOD_BIT3);
  }

  public static isReplaceManualChange(bytes: Int32Array): boolean {
    // Replacement method is manual Change
    // Value = 2 as bit pattern 0010
    return (
      Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT0) &&
      Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT1) &&
      Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT2) &&
      Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT3)
    );
  }

  public static isReplaceManualChange_int(intQuality: number): boolean {
    // Replacement method is manual Change
    // Value = 2 as bit pattern 0010
    return (
      Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT0) &&
      Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT1) &&
      Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT2) &&
      Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT3)
    );
  }

  public static setReplaceManualChange(bytes: Int32Array): Int32Array {
    // Replacement method is manual Change
    // Set value = 2 as bit pattern 0010
    Quality.setOkay(bytes);
    Quality.setDifferentValue(bytes);
    let tmp: Int32Array = Quality.clearBit(bytes, Quality.REPLACE_METHOD_BIT0);
    tmp = Quality.setBit(tmp, Quality.REPLACE_METHOD_BIT1);
    tmp = Quality.clearBit(tmp, Quality.REPLACE_METHOD_BIT2);
    return Quality.clearBit(tmp, Quality.REPLACE_METHOD_BIT3);
  }

  public static setReplaceManualChange_int(intQuality: number): number {
    // Replacement method is manual Change
    // Set value = 2 as bit pattern 0010
    let tmp: number = Quality.setOkay_int(intQuality);
    tmp = Quality.setDifferentValue_int(intQuality);
    tmp = Quality.clearBit_int(intQuality, Quality.REPLACE_METHOD_BIT0);
    tmp = Quality.setBit_int(tmp, Quality.REPLACE_METHOD_BIT1);
    tmp = Quality.clearBit_int(tmp, Quality.REPLACE_METHOD_BIT2);
    return Quality.clearBit_int(tmp, Quality.REPLACE_METHOD_BIT3);
  }

  public static isReplaceGraphicalChange(bytes: Int32Array): boolean {
    // Replacement method is graphical Change
    // Value = 4 as bit pattern 0100
    return (
      Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT0) &&
      Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT1) &&
      Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT2) &&
      Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT3)
    );
  }

  public static isReplaceGraphicalChange_int(intQuality: number): boolean {
    // Replacement method is graphical Change
    // Value = 4 as bit pattern 0100
    return (
      Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT0) &&
      Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT1) &&
      Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT2) &&
      Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT3)
    );
  }

  public static setReplaceGraphicalChange(bytes: Int32Array): Int32Array {
    // Replacement method is graphical Change
    // Set value = 4 as bit pattern 0100
    Quality.setOkay(bytes);
    Quality.setDifferentValue(bytes);
    let tmp: Int32Array = Quality.clearBit(bytes, Quality.REPLACE_METHOD_BIT0);
    tmp = Quality.clearBit(tmp, Quality.REPLACE_METHOD_BIT1);
    tmp = Quality.setBit(tmp, Quality.REPLACE_METHOD_BIT2);
    return Quality.clearBit(tmp, Quality.REPLACE_METHOD_BIT3);
  }

  public static setReplaceGraphicalChange_int(intQuality: number): number {
    // Replacement method is graphical Change
    // Set value = 4 as bit pattern 0100
    let tmp: number = Quality.setOkay_int(intQuality);
    tmp = Quality.setDifferentValue_int(intQuality);
    tmp = Quality.clearBit_int(intQuality, Quality.REPLACE_METHOD_BIT0);
    tmp = Quality.clearBit_int(tmp, Quality.REPLACE_METHOD_BIT1);
    tmp = Quality.setBit_int(tmp, Quality.REPLACE_METHOD_BIT2);
    return Quality.clearBit_int(tmp, Quality.REPLACE_METHOD_BIT3);
  }

  public static isReplaceWithMissing(bytes: Int32Array): boolean {
    // Replacement method is replace with missing
    // Value = 3 as bit pattern 0011
    return (
      Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT0) &&
      Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT1) &&
      Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT2) &&
      Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT3)
    );
  }

  public static isReplaceWithMissing_int(intQuality: number): boolean {
    // Replacement method is replace with missing
    // Value = 3 as bit pattern 0011
    return (
      Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT0) &&
      Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT1) &&
      Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT2) &&
      Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT3)
    );
  }

  public static setReplaceWithMissing(bytes: Int32Array): Int32Array {
    // Replacement method is replace with missing
    // Set value = 3 as bit pattern 0011
    Quality.setMissing(bytes);
    Quality.setDifferentValue(bytes);
    let tmp: Int32Array = Quality.setBit(bytes, Quality.REPLACE_METHOD_BIT0);
    tmp = Quality.setBit(tmp, Quality.REPLACE_METHOD_BIT1);
    tmp = Quality.clearBit(tmp, Quality.REPLACE_METHOD_BIT2);
    return Quality.clearBit(tmp, Quality.REPLACE_METHOD_BIT3);
  }

  public static setReplaceWithMissing_int(intQuality: number): number {
    // Replacement method is replace with missing
    // Set value = 3 as bit pattern 0011
    let tmp: number = Quality.setMissing_int(intQuality);
    tmp = Quality.setDifferentValue_int(intQuality);
    tmp = Quality.setBit_int(intQuality, Quality.REPLACE_METHOD_BIT0);
    tmp = Quality.setBit_int(tmp, Quality.REPLACE_METHOD_BIT1);
    tmp = Quality.clearBit_int(tmp, Quality.REPLACE_METHOD_BIT2);
    return Quality.clearBit_int(tmp, Quality.REPLACE_METHOD_BIT3);
  }

  public isOkay(
    elementIndex: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    // if (!isBitSet(elementIndex, SCREENED_BIT))
    // {
    // throw new DataSetTxQualityFlagException(
    // "Method: <isOkay> Element not screened: " + elementIndex);
    // }
    return this.isBitSet(elementIndex, Quality.OKAY_BIT);
  }

  public isNotOkay(
    elementIndex: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !this.isOkay(elementIndex);
  }

  public clearOkay(elementIndex: number): void {
    this.clearBit(elementIndex, Quality.OKAY_BIT);
    this.setBit(elementIndex, Quality.SCREENED_BIT);
  }

  public setOkay(elementIndex: number): void {
    this.setBit(elementIndex, Quality.OKAY_BIT);
    this.clearBit(elementIndex, Quality.REJECT_BIT);
    this.clearBit(elementIndex, Quality.QUESTION_BIT);
    this.clearBit(elementIndex, Quality.MISSING_BIT);
    this.setBit(elementIndex, Quality.SCREENED_BIT);
  }

  public static isOkay(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    // if (!isBitSet(bytes, SCREENED_BIT))
    // {
    // throw new DataSetTxQualityFlagException(
    // "Method: <isOkay> Element not screened: " + bytes);
    // }
    return Quality.isBitSet(bytes, Quality.OKAY_BIT);
  }

  public static isOkay_int(intQuality: number): boolean {
    return (
      Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT) &&
      Quality.isBitSet_int(intQuality, Quality.OKAY_BIT)
    );
  }

  public static isNotOkay(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isOkay(bytes);
  }

  public static isNotOkay_int(
    intQuality: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isOkay_int(intQuality);
  }

  public static clearOkay(bytes: Int32Array): Int32Array {
    const tmp: Int32Array = Quality.clearBit(bytes, Quality.OKAY_BIT);
    return Quality.setBit(tmp, Quality.SCREENED_BIT);
  }

  public static clearOkay_int(intQuality: number): number {
    return Quality.setBit_int(
      Quality.clearBit_int(intQuality, Quality.OKAY_BIT),
      Quality.SCREENED_BIT
    );
  }

  public static setOkay(bytes: Int32Array): Int32Array {
    let tmp: Int32Array = Quality.setBit(bytes, Quality.OKAY_BIT);
    tmp = Quality.clearBit(tmp, Quality.MISSING_BIT);
    tmp = Quality.clearBit(tmp, Quality.QUESTION_BIT);
    tmp = Quality.clearBit(tmp, Quality.REJECT_BIT);
    return Quality.setBit(tmp, Quality.SCREENED_BIT);
  }

  public static setOkay_int(intQuality: number): number {
    let tmp: number = Quality.setBit_int(intQuality, Quality.OKAY_BIT);
    tmp = Quality.clearBit_int(tmp, Quality.MISSING_BIT);
    tmp = Quality.clearBit_int(tmp, Quality.QUESTION_BIT);
    tmp = Quality.clearBit_int(tmp, Quality.REJECT_BIT);
    return Quality.setBit_int(tmp, Quality.SCREENED_BIT);
  }

  public static clearAllBits(bytes: Int32Array): Int32Array {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Quality.NULL_VALUE;
    }
    return bytes;
  }

  public isAbsoluteMagnitude(elementIndex: number): boolean {
    return this.isBitSet(elementIndex, Quality.ABSOLUTEMAGNITUDE_BIT);
  }

  public isNotAbsoluteMagnitude(elementIndex: number): boolean {
    return !this.isAbsoluteMagnitude(elementIndex);
  }

  public clearAbsoluteMagnitude(elementIndex: number): void {
    this.clearBit(elementIndex, Quality.ABSOLUTEMAGNITUDE_BIT);
  }

  public setAbsoluteMagnitude(elementIndex: number): void {
    this.setBit(elementIndex, Quality.ABSOLUTEMAGNITUDE_BIT);
  }

  public static isAbsoluteMagnitude(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    return Quality.isBitSet(bytes, Quality.ABSOLUTEMAGNITUDE_BIT);
  }

  public static isAbsoluteMagnitude_int(
    intQuality: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    return Quality.isBitSet_int(intQuality, Quality.ABSOLUTEMAGNITUDE_BIT);
  }

  public static isNotAbsoluteMagnitude(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isAbsoluteMagnitude(bytes);
  }

  public static isNotAbsoluteMagnitude_int(
    intQuality: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isAbsoluteMagnitude_int(intQuality);
  }

  public static clearAbsoluteMagnitude(bytes: Int32Array): Int32Array {
    return Quality.clearBit(bytes, Quality.ABSOLUTEMAGNITUDE_BIT);
  }

  public static clearAbsoluteMagnitude_int(intQuality: number): number {
    return Quality.clearBit_int(intQuality, Quality.ABSOLUTEMAGNITUDE_BIT);
  }

  public static setAbsoluteMagnitude(bytes: Int32Array): Int32Array {
    return Quality.setBit(bytes, Quality.ABSOLUTEMAGNITUDE_BIT);
  }

  public static setAbsoluteMagnitude_int(intQuality: number): number {
    return Quality.setBit_int(intQuality, Quality.ABSOLUTEMAGNITUDE_BIT);
  }

  public isConstantValue(elementIndex: number): boolean {
    return this.isBitSet(elementIndex, Quality.CONSTANTVALUE_BIT);
  }

  public isNotConstantValue(elementIndex: number): boolean {
    return !this.isConstantValue(elementIndex);
  }

  public clearConstantValue(elementIndex: number): void {
    this.clearBit(elementIndex, Quality.CONSTANTVALUE_BIT);
  }

  public setConstantValue(elementIndex: number): void {
    this.setBit(elementIndex, Quality.CONSTANTVALUE_BIT);
  }

  public static isConstantValue(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    return Quality.isBitSet(bytes, Quality.CONSTANTVALUE_BIT);
  }

  public static isConstantValue_int(
    intQuality: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    return Quality.isBitSet_int(intQuality, Quality.CONSTANTVALUE_BIT);
  }

  public static isNotConstantValue(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isConstantValue(bytes);
  }

  public static isNotConstantValue_int(
    intQuality: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isConstantValue_int(intQuality);
  }

  public static clearConstantValue(bytes: Int32Array): Int32Array {
    return Quality.clearBit(bytes, Quality.CONSTANTVALUE_BIT);
  }

  public static clearConstantValue_int(intQuality: number): number {
    return Quality.clearBit_int(intQuality, Quality.CONSTANTVALUE_BIT);
  }

  public static setConstantValue(bytes: Int32Array): Int32Array {
    return Quality.setBit(bytes, Quality.CONSTANTVALUE_BIT);
  }

  public static setConstantValue_int(intQuality: number): number {
    return Quality.setBit_int(intQuality, Quality.CONSTANTVALUE_BIT);
  }

  public isRateOfChange(elementIndex: number): boolean {
    return this.isBitSet(elementIndex, Quality.RATEOFCHANGE_BIT);
  }

  public isNotRateOfChange(elementIndex: number): boolean {
    return !this.isRateOfChange(elementIndex);
  }

  public clearRateOfChange(elementIndex: number): void {
    this.clearBit(elementIndex, Quality.RATEOFCHANGE_BIT);
  }

  public setRateOfChange(elementIndex: number): void {
    this.setBit(elementIndex, Quality.RATEOFCHANGE_BIT);
  }

  public static isRateOfChange(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    return Quality.isBitSet(bytes, Quality.RATEOFCHANGE_BIT);
  }

  public static isRateOfChange_int(
    intQuality: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    return Quality.isBitSet_int(intQuality, Quality.RATEOFCHANGE_BIT);
  }

  public static isNotRateOfChange(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isRateOfChange(bytes);
  }

  public static isNotRateOfChange_int(
    intQuality: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isRateOfChange_int(intQuality);
  }

  public static clearRateOfChange(bytes: Int32Array): Int32Array {
    return Quality.clearBit(bytes, Quality.RATEOFCHANGE_BIT);
  }

  public static clearRateOfChange_int(intQuality: number): number {
    return Quality.clearBit_int(intQuality, Quality.RATEOFCHANGE_BIT);
  }

  public static setRateOfChange(bytes: Int32Array): Int32Array {
    return Quality.setBit(bytes, Quality.RATEOFCHANGE_BIT);
  }

  public static setRateOfChange_int(intQuality: number): number {
    return Quality.setBit_int(intQuality, Quality.RATEOFCHANGE_BIT);
  }

  public isRelativeMagnitude(elementIndex: number): boolean {
    return this.isBitSet(elementIndex, Quality.RELATIVEMAGNITUDE_BIT);
  }

  public isNotRelativeMagnitude(elementIndex: number): boolean {
    return !this.isRelativeMagnitude(elementIndex);
  }

  public clearRelativeMagnitude(elementIndex: number): void {
    this.clearBit(elementIndex, Quality.RELATIVEMAGNITUDE_BIT);
  }

  public setRelativeMagnitude(elementIndex: number): void {
    this.setBit(elementIndex, Quality.RELATIVEMAGNITUDE_BIT);
  }

  public static isRelativeMagnitude(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    return Quality.isBitSet(bytes, Quality.RELATIVEMAGNITUDE_BIT);
  }

  public static isRelativeMagnitude_int(
    intQuality: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    return Quality.isBitSet_int(intQuality, Quality.RELATIVEMAGNITUDE_BIT);
  }

  public static isNotRelativeMagnitude(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isRelativeMagnitude(bytes);
  }

  public static isNotRelativeMagnitude_int(
    intQuality: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isRelativeMagnitude_int(intQuality);
  }

  public static clearRelativeMagnitude(bytes: Int32Array): Int32Array {
    return Quality.clearBit(bytes, Quality.RELATIVEMAGNITUDE_BIT);
  }

  public static clearRelativeMagnitude_int(intQuality: number): number {
    return Quality.clearBit_int(intQuality, Quality.RELATIVEMAGNITUDE_BIT);
  }

  public static setRelativeMagnitude(bytes: Int32Array): Int32Array {
    return Quality.setBit(bytes, Quality.RELATIVEMAGNITUDE_BIT);
  }

  public static setRelativeMagnitude_int(intQuality: number): number {
    return Quality.setBit_int(intQuality, Quality.RELATIVEMAGNITUDE_BIT);
  }

  public isDurationMagnitude(elementIndex: number): boolean {
    return this.isBitSet(elementIndex, Quality.DURATIONMAGNITUDE_BIT);
  }

  public isNotDurationMagnitude(elementIndex: number): boolean {
    return !this.isDurationMagnitude(elementIndex);
  }

  public clearDurationMagnitude(elementIndex: number): void {
    this.clearBit(elementIndex, Quality.DURATIONMAGNITUDE_BIT);
  }

  public setDurationMagnitude(elementIndex: number): void {
    this.setBit(elementIndex, Quality.DURATIONMAGNITUDE_BIT);
  }

  public static isDurationMagnitude(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    return Quality.isBitSet(bytes, Quality.DURATIONMAGNITUDE_BIT);
  }

  public static isDurationMagnitude_int(
    intQuality: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    return Quality.isBitSet_int(intQuality, Quality.DURATIONMAGNITUDE_BIT);
  }

  public static isNotDurationMagnitude(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isDurationMagnitude(bytes);
  }

  public static isNotDurationMagnitude_int(
    intQuality: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isDurationMagnitude_int(intQuality);
  }

  public static clearDurationMagnitude(bytes: Int32Array): Int32Array {
    return Quality.clearBit(bytes, Quality.DURATIONMAGNITUDE_BIT);
  }

  public static clearDurationMagnitude_int(intQuality: number): number {
    return Quality.clearBit_int(intQuality, Quality.DURATIONMAGNITUDE_BIT);
  }

  public static setDurationMagnitude(bytes: Int32Array): Int32Array {
    return Quality.setBit(bytes, Quality.DURATIONMAGNITUDE_BIT);
  }

  public static setDurationMagnitude_int(intQuality: number): number {
    return Quality.setBit_int(intQuality, Quality.DURATIONMAGNITUDE_BIT);
  }

  public isNegativeIncremental(elementIndex: number): boolean {
    return this.isBitSet(elementIndex, Quality.NEGATIVEINCREMENTAL_BIT);
  }

  public isNotNegativeIncremental(elementIndex: number): boolean {
    return !this.isNegativeIncremental(elementIndex);
  }

  public clearNegativeIncremental(elementIndex: number): void {
    this.clearBit(elementIndex, Quality.NEGATIVEINCREMENTAL_BIT);
  }

  public setNegativeIncremental(elementIndex: number): void {
    this.setBit(elementIndex, Quality.NEGATIVEINCREMENTAL_BIT);
  }

  public static isNegativeIncremental(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    return Quality.isBitSet(bytes, Quality.NEGATIVEINCREMENTAL_BIT);
  }

  public static isNegativeIncremental_int(
    intQuality: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    return Quality.isBitSet_int(intQuality, Quality.NEGATIVEINCREMENTAL_BIT);
  }

  public static isNotNegativeIncremental(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isNegativeIncremental(bytes);
  }

  public static isNotNegativeIncremental_int(
    intQuality: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isNegativeIncremental_int(intQuality);
  }

  public static clearNegativeIncremental(bytes: Int32Array): Int32Array {
    return Quality.clearBit(bytes, Quality.NEGATIVEINCREMENTAL_BIT);
  }

  public static clearNegativeIncremental_int(intQuality: number): number {
    return Quality.clearBit_int(intQuality, Quality.NEGATIVEINCREMENTAL_BIT);
  }

  public static setNegativeIncremental(bytes: Int32Array): Int32Array {
    return Quality.setBit(bytes, Quality.NEGATIVEINCREMENTAL_BIT);
  }

  public static setNegativeIncremental_int(intQuality: number): number {
    return Quality.setBit_int(intQuality, Quality.NEGATIVEINCREMENTAL_BIT);
  }

  public isUserDefinedTest(elementIndex: number): boolean {
    return this.isBitSet(elementIndex, Quality.USER_DEFINED_TEST_BIT);
  }

  public isNotUserDefinedTest(elementIndex: number): boolean {
    return !this.isUserDefinedTest(elementIndex);
  }

  public clearUserDefinedTest(elementIndex: number): void {
    this.clearBit(elementIndex, Quality.USER_DEFINED_TEST_BIT);
  }

  public setUserDefinedTest(elementIndex: number): void {
    this.setBit(elementIndex, Quality.USER_DEFINED_TEST_BIT);
  }

  public static isUserDefinedTest(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    return Quality.isBitSet(bytes, Quality.USER_DEFINED_TEST_BIT);
  }

  public static isUserDefinedTest_int(
    intQuality: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    return Quality.isBitSet_int(intQuality, Quality.USER_DEFINED_TEST_BIT);
  }

  public static isNotUserDefinedTest(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isUserDefinedTest(bytes);
  }

  public static isNotUserDefinedTest_int(
    intQuality: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isUserDefinedTest_int(intQuality);
  }

  public static clearUserDefinedTest(bytes: Int32Array): Int32Array {
    return Quality.clearBit(bytes, Quality.USER_DEFINED_TEST_BIT);
  }

  public static clearUserDefinedTest_int(intQuality: number): number {
    return Quality.clearBit_int(intQuality, Quality.USER_DEFINED_TEST_BIT);
  }

  public static setUserDefinedTest(bytes: Int32Array): Int32Array {
    return Quality.setBit(bytes, Quality.USER_DEFINED_TEST_BIT);
  }

  public static setUserDefinedTest_int(intQuality: number): number {
    return Quality.setBit_int(intQuality, Quality.USER_DEFINED_TEST_BIT);
  }

  public isDistributionTest(elementIndex: number): boolean {
    return this.isBitSet(elementIndex, Quality.DISTRIBUTIONTEST_BIT);
  }

  public isNotDistributionTest(elementIndex: number): boolean {
    return !this.isDistributionTest(elementIndex);
  }

  public clearDistributionTest(elementIndex: number): void {
    this.clearBit(elementIndex, Quality.DISTRIBUTIONTEST_BIT);
  }

  public setDistributionTest(elementIndex: number): void {
    this.setBit(elementIndex, Quality.DISTRIBUTIONTEST_BIT);
  }

  public static isDistributionTest(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    return Quality.isBitSet(bytes, Quality.DISTRIBUTIONTEST_BIT);
  }

  public static isDistributionTest_int(
    intQuality: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    return Quality.isBitSet_int(intQuality, Quality.DISTRIBUTIONTEST_BIT);
  }

  public static isNotDistributionTest(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isDistributionTest(bytes);
  }

  public static isNotDistributionTest_int(
    intQuality: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isDistributionTest_int(intQuality);
  }

  public static clearDistributionTest(bytes: Int32Array): Int32Array {
    return Quality.clearBit(bytes, Quality.DISTRIBUTIONTEST_BIT);
  }

  public static clearDistributionTest_int(intQuality: number): number {
    return Quality.clearBit_int(intQuality, Quality.DISTRIBUTIONTEST_BIT);
  }

  public static setDistributionTest(bytes: Int32Array): Int32Array {
    return Quality.setBit(bytes, Quality.DISTRIBUTIONTEST_BIT);
  }

  public static setDistributionTest_int(intQuality: number): number {
    return Quality.setBit_int(intQuality, Quality.DISTRIBUTIONTEST_BIT);
  }

  public isGageList(elementIndex: number): boolean {
    return this.isBitSet(elementIndex, Quality.GAGELIST_BIT);
  }

  public isNotGageList(elementIndex: number): boolean {
    return !this.isGageList(elementIndex);
  }

  public clearGageList(elementIndex: number): void {
    this.clearBit(elementIndex, Quality.GAGELIST_BIT);
  }

  public setGageList(elementIndex: number): void {
    this.setBit(elementIndex, Quality.GAGELIST_BIT);
  }

  public static isGageList(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    return this.isBitSet(bytes, Quality.GAGELIST_BIT);
  }

  public static isGageList_int(
    intQuality: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    return Quality.isBitSet_int(intQuality, Quality.GAGELIST_BIT);
  }

  public static isNotGageList(
    bytes: Int32Array
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isGageList(bytes);
  }

  public static isNotGageList_int(
    intQuality: number
  ): boolean // throws DataSetTxQualityFlagException
  {
    return !Quality.isGageList_int(intQuality);
  }

  public static clearGageList(bytes: Int32Array): Int32Array {
    return Quality.clearBit(bytes, Quality.GAGELIST_BIT);
  }

  public static clearGageList_int(intQuality: number): number {
    return Quality.clearBit_int(intQuality, Quality.GAGELIST_BIT);
  }

  public static setGageList(bytes: Int32Array): Int32Array {
    return Quality.setBit(bytes, Quality.GAGELIST_BIT);
  }

  public static setGageList_int(intQuality: number): number {
    return Quality.setBit_int(intQuality, Quality.GAGELIST_BIT);
  }

  static PADDING: string[] = [
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

  public getIntQuality(): number[] {
    let iqual: number[] = [];
    for (let i = 0; i < this._size; i++) {
      const byteIndex: number = i * Quality.ELEMENT_SIZE_IN_BYTES;
      const i0: number = this._elementData[byteIndex + 0] & Quality.MASK_BYTE;
      const i1: number = this._elementData[byteIndex + 1] & Quality.MASK_BYTE;
      const i2: number = this._elementData[byteIndex + 2] & Quality.MASK_BYTE;
      const i3: number = this._elementData[byteIndex + 3] & Quality.MASK_BYTE;
      iqual.push(i3 | (i2 << 8) | (i1 << 16) | (i0 << 24));
    }
    return iqual;
  }

  public static isEmpty(bytes: Int32Array): boolean {
    const iqual: number = Quality.getInteger(bytes);
    return iqual == 0;
  }

  /**
   * Method for transforming underlying QualityTx into an accessible Collections object. This method will perform the entire calculation for
   * the times array from the getTimes() method and uses the QualityTx methods to transform the symbolic String quality into integers.
   *
   * @return sorted map that is not thread safe of dates to quality. Values will not be null, but the collection will be empty if QualityTx is null.
   */
  public getQualitySymbols(timesArray: number[]): Map<Date, String> {
    return this.getDateQualityMap(
      (i: number) =>
        QualityStringRenderer.getSymbolicString(this.getIntegerAt(i)),
      timesArray
    );
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
  getQualityIntegers(
    timesArray: number[],
    zoneId?: string
  ): Map<Date | ZonedDateTime, number> {
    if (zoneId) {
      const zonedDateTimeMap = this.getZonedDateTimeQualityMap(
        this.getIntegerAt.bind(this),
        timesArray,
        zoneId
      );
      const dateMap = new Map<Date, number>();
      for (const [date, value] of zonedDateTimeMap.entries()) {
        dateMap.set(date, value);
      }
      return dateMap;
    } else {
      return this.getDateQualityMap(this.getIntegerAt.bind(this), timesArray);
    }
  }

  private getZonedDateTimeQualityMap<V>(
    qualityExtractor: (i: number) => V,
    timesArray: number[],
    zoneId: string
  ): Map<Date, V> {
    const retval = new Map<Date, V>();
    for (let i = 0; i < timesArray.length; i++) {
      const date = new Date(timesArray[i]);
      const zonedDateTime = new Date(
        date.toLocaleString("en-US", { timeZone: zoneId })
      );
      retval.set(zonedDateTime, qualityExtractor(i));
    }
    return retval;
  }

  private getDateQualityMap(
    qualityExtractor: (index: number) => V,
    timesArray: number[]
  ): Map<Date, V> {
    const retval: TreeMap<Date, V> = new TreeMap<Date, V>();
    for (let i = 0; i < timesArray.length; i++) {
      const date: Date = new Date(timesArray[i]);
      retval.set(date, qualityExtractor(i));
    }
    return retval;
  }

  private toStringElement(elementIndex: number, stringType: number): string {
    return QualityStringRenderer.getString(
      this.getIntegerAt(elementIndex),
      stringType
    );
  }

  public toBinaryString(): string {
    return this.toString(QualityStringRenderer.BINARY_STRING);
  }

  public toOctalString(): string {
    return this.toString(QualityStringRenderer.OCTAL_STRING);
  }

  public toSymbolicString(): string {
    return this.toString(QualityStringRenderer.SYMBOLIC_STRING);
  }

  public toSymbolicRevisedString(): string {
    return this.toString(QualityStringRenderer.SYMBOLIC_REVISED_STRING);
  }

  public toSymbolicTestsString(): string {
    return this.toString(QualityStringRenderer.SYMBOLIC_TESTS_STRING);
  }

  public toHexString(): string {
    return QualityStringRenderer.HEX_STRING.toString();
  }

  public toIntegerString(): string {
    return QualityStringRenderer.INTEGER_STRING.toString();
  }

  public toIntegerStringElementAt(elementIndex: number): string {
    return this.getIntegerAt(elementIndex).toString();
  }

  public toBinaryStringElementAt(elementIndex: number): string {
    return QualityStringRenderer.pad(
      this.getIntegerAt(elementIndex).toString(2),
      QualityStringRenderer.BINARY_STRING
    );
  }

  public toOctalStringElementAt(elementIndex: number): string {
    return QualityStringRenderer.pad(
      this.getIntegerAt(elementIndex).toString(8),
      QualityStringRenderer.OCTAL_STRING
    );
  }

  public toSymbolicStringElementAt(elementIndex: number): string {
    return this.toStringElement(
      elementIndex,
      QualityStringRenderer.SYMBOLIC_STRING
    );
  }

  public toSymbolicTestsStringElementAt(elementIndex: number): string {
    return this.toStringElement(
      elementIndex,
      QualityStringRenderer.SYMBOLIC_TESTS_STRING
    );
  }

  public toSymbolicRevisedStringElementAt(elementIndex: number): string {
    return this.toStringElement(
      elementIndex,
      QualityStringRenderer.SYMBOLIC_REVISED_STRING
    );
  }

  public toHexStringElementAt(elementIndex: number): string {
    return QualityStringRenderer.pad(
      this.getIntegerAt(elementIndex).toString(16),
      QualityStringRenderer.HEX_STRING
    );
  }

  private toString(stringType: number | undefined): string {
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