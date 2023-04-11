import pako from 'pako';
import TreeMap from 'ts-treemap'
import { ZonedDateTime, Instant, ZoneId } from 'js-joda';
import { QualityStringRenderer } from './QualityStringRenderer';


const BINARY_STRING = 0;
const OCTAL_STRING = 1;
const HEX_STRING = 2;
const INTEGER_STRING = 3;
const SYMBOLIC_STRING = 4;
const SYMBOLIC_REVISED_STRING = 5;
const SYMBOLIC_TESTS_STRING = 6;

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

  private _elementData: Uint32Array;
  private _elementDataCompressed: Uint32Array | null = null;
  private readonly _size: number;
  private readonly _sizeInBytes: number;
  private _isCompressed = false;

  constructor(size: number);
  constructor(elementData: Uint32Array);
  constructor(quality: Quality);
  constructor(intQuality: number[]);
  constructor(arg: number[] | Uint32Array | Quality | number) {
    if (arg instanceof Uint32Array) {
      const elementData = arg;
      this._size = elementData.length / Quality.ELEMENT_SIZE_IN_BYTES;
      this._sizeInBytes = this._size * Quality.ELEMENT_SIZE_IN_BYTES;
      this._elementData = new Uint32Array(this._sizeInBytes);
      this._elementData.set(elementData);
      // enforce valid quality data
      for (let i = 0; i < this._size; ++i) {
        this.setElementAt(this.getElementAt(i), i);
      }
    } else if (arg instanceof Quality) {
      const quality = arg;
      this._size = quality._size;
      this._sizeInBytes = quality._sizeInBytes;
      this._elementData = new Uint32Array(this._sizeInBytes);
      this._elementData.set(quality._elementData);
      // enforce valid quality data
      for (let i = 0; i < this._size; ++i) {
        this.setElementAt(this.getElementAt(i), i);
      }
    } else if (Array.isArray(arg)) {
      const intQuality = arg;
      this._size = intQuality.length;
      this._sizeInBytes = this._size * Quality.ELEMENT_SIZE_IN_BYTES;
      this._elementData = new Uint32Array(this._sizeInBytes);
      for (let i = 0; i < this._size; i++) {
        this.setIntegerAt(intQuality[i], i);
      }
    } else {
      const size = arg as number;
      this._size = size;
      this._sizeInBytes = size * Quality.ELEMENT_SIZE_IN_BYTES;
      this._elementData = new Uint32Array(this._sizeInBytes);
      for (let i = 0; i < this._sizeInBytes; i++) {
        this._elementData[i] = Quality.NULL_VALUE;
      }
    }
  }


  
	public static cleanQualityInteger(qualityInt: number): number
	{
		let tmp: number = qualityInt;
		// -------------------------------------------//
		// clear all bits if screened bit is not set //
		// -------------------------------------------//
		if((tmp & Quality.SCREENED_VALUE) == 0)
		{
			tmp = 0;
		}
		else
		{
			// -----------------------------------------------------------------//
			// ensure only used bits are set (also counteracts sign-extension)
			// -----------------------------------------------------------------//
			tmp &= Quality.USED_BITS_MASK;
			// -------------------------------------//
			// ensure only one validity bit is set //
			// -------------------------------------//
			if((tmp & Quality.MISSING_VALUE) != 0)
			{
				tmp &= Quality.MISSING_MASK;
			}
			else if((tmp & Quality.REJECTED_VALUE) != 0)
			{
				tmp &= Quality.REJECTED_MASK;
			}
			else if((tmp & Quality.QUESTIONED_VALUE) != 0)
			{
				tmp &= Quality.QUESTIONED_MASK;
			}
			else if((tmp & Quality.OK_VALUE) != 0)
			{
				tmp &= Quality.OK_MASK;
			}
			// ----------------------------------------------------//
			// ensure the replacement cause is not greater than 4 //
			// ----------------------------------------------------//
			let repl_cause: number = (tmp & Quality.REPL_CAUSE_MASK) >>> Quality.REPL_CAUSE_SHIFT;
			if(repl_cause > 4)
			{
				repl_cause = 4;
				tmp |= repl_cause << Quality.REPL_CAUSE_SHIFT;
			}
			// -----------------------------------------------------//
			// ensure the replacement method is not greater than 4 //
			// -----------------------------------------------------//
			let repl_method: number = (tmp & Quality.REPL_METHOD_MASK) >>> Quality.REPL_METHOD_SHIFT;
			if(repl_method > 4)
			{
				repl_method = 4;
				tmp |= repl_method << Quality.REPL_METHOD_SHIFT;
			}
			// ----------------------------------------------------------------------------------------------------------//
			// ensure that if 2 of replacement cause, replacement method, and
			// different are 0, the remaining one is too //
			// ----------------------------------------------------------------------------------------------------------//
			let different: boolean = (tmp & Quality.DIFFERENT_MASK) != 0;
			if(repl_cause == 0)
			{
				if(repl_method == 0 && different)
				{
					tmp &= Quality.NOT_DIFFERENT_MASK;
					different = false;
				}
				else if(repl_method != 0 && !different)
				{
					tmp &= Quality.NO_REPL_METHOD_MASK;
					repl_method = 0;
				}
			}
			else if(repl_method == 0 && !different)
			{
				tmp &= Quality.NO_REPL_CAUSE_MASK;
				repl_cause = 0;
			}
			// --------------------------------------------------------------------------------------------------------------------------//
			// ensure that if 2 of replacement cause, replacement method, and
			// different are NOT 0, the remaining one is set accordingly //
			// --------------------------------------------------------------------------------------------------------------------------//
			if(repl_cause != 0)
			{
				if(repl_method != 0 && !different)
				{
					tmp |= Quality.DIFFERENT_MASK;
					different = true;
				}
				else if(different && repl_method == 0)
				{
					repl_method = 2; // EXPLICIT
					tmp |= repl_method << Quality.REPL_METHOD_SHIFT;
				}
			}
			else if(different && repl_method != 0)
			{
				repl_cause = 3; // MANUAL
				tmp &= repl_cause << Quality.REPL_CAUSE_SHIFT;
			}
		}
		return tmp;
	}


	public static compressQuality(tmp: Quality): void 
    {
        if (tmp._isCompressed || tmp._size < 10) {
            return;
        }

        const tmpComp = new Uint32Array(tmp._elementData.length);
        const deflater = new pako.Deflate();
        deflater.push(tmp._elementData, true);
        const num = deflater.result.length;
        const numIn = deflater.strstart;

        tmp._elementDataCompressed = new Uint32Array(num);
        tmp._elementDataCompressed.set(deflater.result);
        tmp._elementData = null;
        tmp._isCompressed = true;
    }

    public static uncompressQuality(tmp: Quality): Quality 
    {
        if (tmp._isCompressed) {
            tmp._elementData = new Uint32Array(tmp._size * 4);
            const numSoFar = pako.inflate(tmp._elementDataCompressed, tmp._elementData);
            const num = numSoFar;
            tmp._elementDataCompressed = null;
            tmp._isCompressed = false;
        }
        return tmp;
    }

	public static emptyQualityValue(): number
	{
		return Quality.NULL_VALUE
	}

    public static emptyBytes(): Uint32Array {
        return new Uint32Array([Quality.NULL_VALUE, Quality.NULL_VALUE, Quality.NULL_VALUE, Quality.NULL_VALUE]);
    }

	public getQuality(): Uint32Array
	{
		return this._elementData;
	}

	public getSize(): number
	{
		return this._size;
	}

	public getSizeInBytes(): number
	{
		return this._sizeInBytes;
	}

	public hasQuality(): boolean
	{
		return this._size > 0;
	}

	getElementAt(elementIndex: number): Uint32Array 
    {
        if (elementIndex > this._size || elementIndex < 0) {
            throw new RangeError(`Index of: ${elementIndex} Out of range[0 - ${this._size}]`);
        }
        
        const byteIndex: number = elementIndex * Quality.ELEMENT_SIZE_IN_BYTES;

        const bytes: Uint32Array = new Uint32Array(Quality.ELEMENT_SIZE_IN_BYTES);
        bytes.set(this._elementData.subarray(byteIndex, byteIndex + Quality.ELEMENT_SIZE_IN_BYTES));
        
        return bytes;
    }

	getIntegerAt(elementIndex: number): number {
        const bytes: Uint32Array = this.getElementAt(elementIndex);
        const i0: number = bytes[0] & Quality.MASK_BYTE;
        const i1: number = bytes[1] & Quality.MASK_BYTE;
        const i2: number = bytes[2] & Quality.MASK_BYTE;
        const i3: number = bytes[3] & Quality.MASK_BYTE;
        const result: number = i3 | (i2 << 8) | (i1 << 16) | (i0 << 24);
        return result;
    }

	static getInteger(bytes: Uint32Array): number {
        const i0: number = bytes[0] & Quality.MASK_BYTE;
        const i1: number = bytes[1] & Quality.MASK_BYTE;
        const i2: number = bytes[2] & Quality.MASK_BYTE;
        const i3: number = bytes[3] & Quality.MASK_BYTE;
        const result: number = i3 | (i2 << 8) | (i1 << 16) | (i0 << 24);
        return result;
    }

    setIntegerAt(intQuality: number, elementIndex: number): void 
    {
        const bytes: Uint32Array = new Uint32Array(4);
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
    public static getBytes(intQuality: number, bytes: Uint32Array | undefined): Uint32Array | undefined 
    {
        if (!bytes) {
            let bytes: Uint32Array = new Uint32Array(4);
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
        return
    }
    
    public setElementAt(bytes: Uint32Array, elementIndex: number): void 
    {
        if (elementIndex > this._size || elementIndex < 0) {
            throw new Error(`Index of: ${elementIndex} Out of range[0 - ${this._size}]`);
        }

        const qualityInt: number = (bytes[0] & Quality.MASK_BYTE) << 24
            | (bytes[1] & Quality.MASK_BYTE) << 16
            | (bytes[2] & Quality.MASK_BYTE) << 8
            | (bytes[3] & Quality.MASK_BYTE);

        const cleanedInt: number = Quality.cleanQualityInteger(qualityInt);

        const cleanedBytes: Uint32Array = new Uint32Array([
            cleanedInt >>> 24 & Quality.MASK_BYTE,
            cleanedInt >>> 16 & Quality.MASK_BYTE,
            cleanedInt >>> 8 & Quality.MASK_BYTE,
            cleanedInt & Quality.MASK_BYTE,
        ]);

        const byteIndex = elementIndex * Quality.ELEMENT_SIZE_IN_BYTES;

        for (let i = 0; i < Quality.ELEMENT_SIZE_IN_BYTES; i++) {
            this._elementData[byteIndex + i] = cleanedBytes[i];
        }
    }

    public static isAccepted(bytes: Uint32Array): boolean {
        // No Revision Replacement Method set 0 = 0000
        // "A" for Original Value is Accepted
        return (Quality.isBitSet(bytes, Quality.SCREENED_BIT)
             && Quality.isBitSet(bytes,  Quality.OKAY_BIT)
             && Quality.isBitClear(bytes,  Quality.MISSING_BIT)
             && Quality.isBitClear(bytes,  Quality.QUESTION_BIT)
             && Quality.isBitClear(bytes,  Quality.REJECT_BIT)
             && Quality.isBitClear(bytes,  Quality.HOW_REVISED_BIT0)
             && Quality.isBitClear(bytes,  Quality.HOW_REVISED_BIT1)
             && Quality.isBitSet(bytes,  Quality.HOW_REVISED_BIT2)
             && Quality.isBitClear(bytes,  Quality.REPLACE_METHOD_BIT0)
             && Quality.isBitClear(bytes,  Quality.REPLACE_METHOD_BIT1)
             && Quality.isBitClear(bytes,  Quality.REPLACE_METHOD_BIT2)
             && Quality.isBitClear(bytes,  Quality.REPLACE_METHOD_BIT3));
    }

	public static isAccepted_int(intQuality: number): boolean
	{
		// No Revision Replacement Method set 0 = 0000
		// "A" for Original Value is Accepted
		return (Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)
				&& Quality.isBitSet_int(intQuality, Quality.OKAY_BIT)
				&& Quality.isBitClear_int(intQuality, Quality.MISSING_BIT)
				&& Quality.isBitClear_int(intQuality, Quality.QUESTION_BIT)
				&& Quality.isBitClear_int(intQuality, Quality.REJECT_BIT)
				&& Quality.isBitClear_int(intQuality, Quality.HOW_REVISED_BIT0)
				&& Quality.isBitClear_int(intQuality, Quality.HOW_REVISED_BIT1)
				&& Quality.isBitSet_int(intQuality, Quality.HOW_REVISED_BIT2)
				&& Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT0)
				&& Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT1)
				&& Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT2) 
                && Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT3));
	}

	public static isInterpolated(bytes: Uint32Array): boolean 
	{
		// Linear Interpolation Replacement Method set 1 = 0001
		// "I" for Interpolated Value
		return (Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT0)
				&& Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT1)
				&& Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT2) 
                && Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT3));
	}

	public static isInterpolated_int(intQuality: number): boolean 
	{
		// Linear Interpolation Replacement Method set 1 = 0001
		// "I" for Interpolated Value
		return (Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT0)
				&& Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT1)
				&& Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT2) 
                && Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT3));
	}

	public static isKeyboardInput(bytes: Uint32Array): boolean
	{
		// Manual Change Replacement Method set 2 = 0010
		// "K" for Keyboard Input
		return (Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT0)
				&& Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT1)
				&& Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT2) 
                && Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT3));
	}

	public static isKeyboardInput_int(intQuality: number): boolean 
	{
		// Manual Change Replacement Method set 2 = 0010
		// "K" for Keyboard Input
		return (Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT0)
				&& Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT1)
				&& Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT2) && Quality.isBitClear_int(
				intQuality, Quality.REPLACE_METHOD_BIT3));
	}

	public static isGraphicalEstimate(bytes: Uint32Array): boolean
	{
		// Manual Change Replacement Method set 4 = 0100
		// "E" for Graphical Estimate
		return (Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT0)
				&& Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT1)
				&& Quality.isBitSet(bytes, Quality.REPLACE_METHOD_BIT2) 
                && Quality.isBitClear(bytes, Quality.REPLACE_METHOD_BIT3));
	}

	public static isGraphicalEstimate_int(intQuality: number): boolean
	{
		// Manual Change Replacement Method set 4 = 0100
		// "E" for Graphical Estimate
		return (Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT0)
				&& Quality.isBitClear_int(intQuality, Quality.REPLACE_METHOD_BIT1)
				&& Quality.isBitSet_int(intQuality, Quality.REPLACE_METHOD_BIT2) && Quality.isBitClear_int(
				intQuality, Quality.REPLACE_METHOD_BIT3));
	}

	public isMissing(elementIndex: number): boolean
	// throws DataSetTxQualityFlagException
	{
		// if (!isBitSet(elementIndex, SCREENED_BIT))
		// {
		// throw new DataSetTxQualityFlagException(
		// "Method: <isMissing> Element not screened: " + elementIndex);
		// }
		return this.isBitSet(elementIndex, Quality.MISSING_BIT);
	}

	public isNotMissing(elementIndex: number): boolean
	{
		return Quality.isBitClear_int(elementIndex, Quality.MISSING_BIT);
	}

	public clearMissing(elementIndex: number): void
	{
		Quality.clearBit(elementIndex, Quality.MISSING_BIT);
		Quality.setBit(elementIndex, Quality.SCREENED_BIT);
	}

	public setMissing(elementIndex: number): void
	{
		Quality.setBit_int(elementIndex, Quality.MISSING_BIT);
		Quality.clearBit_int(elementIndex, Quality.OKAY_BIT);
		Quality.clearBit_int(elementIndex, Quality.QUESTION_BIT);
		Quality.clearBit_int(elementIndex, Quality.REJECT_BIT);
		Quality.setBit_int(elementIndex, Quality.SCREENED_BIT);
	}

	public static isMissing(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		// if (!isBitSet(bytes, SCREENED_BIT))
		// {
		// throw new DataSetTxQualityFlagException(
		// "Method: <isMissing> Element not screened: " + bytes);
		// }
		return Quality.isBitSet(bytes, Quality.MISSING_BIT);
	}

	public static isMissing_int(intQuality: number): boolean
	{
		return Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT)
				&& Quality.isBitSet_int(intQuality, Quality.MISSING_BIT);
	}

	public static isNotMissing(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		return !Quality.isMissing(bytes);
	}

	public static isNotMissing_int(intQuality: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return !Quality.isMissing_int(intQuality);
	}

	public static clearMissing(bytes: Uint32Array): Uint32Array
	{
		const tmp: Uint32Array = Quality.clearBit(bytes, Quality.MISSING_BIT);
		return Quality.setBit(tmp, Quality.SCREENED_BIT);
	}

	public static clearMissing_int(intQuality: number): int
	{
		return Quality.setBit_int(Quality.clearBit_int(intQuality, Quality.MISSING_BIT), Quality.SCREENED_BIT);
	}

	public static setMissing(bytes: Uint32Array): Uint32Array
	{
		let tmp: Uint32Array = Quality.setBit(bytes, Quality.MISSING_BIT);
		tmp = Quality.clearBit(tmp, Quality.OKAY_BIT);
		tmp = Quality.clearBit(tmp, Quality.QUESTION_BIT);
		tmp = Quality.clearBit(tmp, Quality.REJECT_BIT);
		return Quality.setBit(tmp, Quality.SCREENED_BIT);
	}

	public static setMissing_int(intQuality: number): int
	{
		let tmp: int = Quality.setBit_int(intQuality, Quality.MISSING_BIT);
		tmp = Quality.clearBit_int(tmp, Quality.OKAY_BIT);
		tmp = Quality.clearBit_int(tmp, Quality.QUESTION_BIT);
		tmp = Quality.clearBit_int(tmp, Quality.REJECT_BIT);
		return Quality.setBit_int(tmp, Quality.SCREENED_BIT);
	}

	public isProtected(elementIndex: number): boolean
	{
		return Quality.isScreened(elementIndex)
				&& Quality.isBitSet(elementIndex, Quality.PROTECTED_BIT);
	}

	public isNotProtected(elementIndex: number): boolean
	{
		return !Quality.isProtected(elementIndex);
	}

	public clearProtected(elementIndex: number): void
	{
		Quality.clearBit(elementIndex, Quality.PROTECTED_BIT);
		Quality.setBit(elementIndex, Quality.SCREENED_BIT);
	}

	public setProtected(elementIndex: number): void
	{
		Quality.setBit(elementIndex, Quality.PROTECTED_BIT);
		Quality.setBit(elementIndex, Quality.SCREENED_BIT);
	}

	public static isProtected(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		return Quality.isBitSet(bytes, Quality.PROTECTED_BIT);
	}

	public static isProtected_int(intQuality: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return Quality.isBitSet_int(intQuality, Quality.PROTECTED_BIT);
	}

	public static isNotProtected(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		return !Quality.isProtected(bytes);
	}

	public static isNotProtected_int(intQuality: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return !Quality.isProtected_int(intQuality);
	}

	public static clearProtected(bytes: Uint32Array): Uint32Array
	{
		const tmp: Uint32Array = Quality.clearBit(bytes, Quality.PROTECTED_BIT);
		return Quality.setBit(tmp, Quality.SCREENED_BIT);
	}

	public static clearProtected_int(intQuality: number): int
	{
		return Quality.setBit_int(Quality.clearBit_int(intQuality, Quality.PROTECTED_BIT), Quality.SCREENED_BIT);
	}

	public static setProtected(bytes: Uint32Array): Uint32Array
	{
		return Quality.setBit(Quality.setBit(bytes, Quality.PROTECTED_BIT), Quality.SCREENED_BIT);
	}

	public static setProtected_int(intQuality: number): int
	{
		return Quality.setBit_int(Quality.setBit_int(intQuality, Quality.PROTECTED_BIT), Quality.SCREENED_BIT);
	}

	public static isBitClear(bytes: Uint32Array, bitPosition: number): boolean 
	{
		return !Quality.isBitSet(bytes, bitPosition);
	}

	public static isQualityClear(bytes: Uint32Array): boolean
	{
		return Quality.getInteger(bytes) == 0;
	}

	public static isQualityClear_int(intQuality: number): boolean
	{
		return intQuality == 0;
	}

	public static isBitSet_int(intQuality: number, bitPosition: number): boolean
	{
		return (intQuality & (1 << (bitPosition - 1))) != 0;
	}

	public static isBitClear_int(intQuality: number, bitPosition: number): boolean
	{
		return (intQuality & (1 << (bitPosition - 1))) == 0;
	}

	public static setBit_int(intQuality: number, bitPosition: number): number
	{
		return intQuality | (1 << (bitPosition - 1));
	}

	public static clearBit_int(intQuality: number, bitPosition: number): number
	{
		return intQuality & ~(1 << (bitPosition - 1));
	}

	public isBitSet(elementIndex: number, bitPosition: number): boolean
	{
		if((elementIndex > this._size) || (elementIndex < 0))
		{
			throw new RangeError("Index of: "
					+ elementIndex + " Out of range[0 - " + this._size + "]");
		}
		const bytes: Uint32Array = this.getElementAt(elementIndex);
		return Quality.isBitSet(bytes, bitPosition);
	}
    public static isBitSet(bytes: Uint32Array, bitPosition: number): boolean
	{
		const targetByte = Math.floor((32 - bitPosition) / 8);
		const targetBit = (bitPosition - 1) % 8;
		const base = bytes[targetByte];
		return (base & Quality.MASK[targetBit]) != 0;
	}

	public isBitClear(elementIndex: number, bitPosition: number): boolean
	{
		return !this.isBitSet(elementIndex, bitPosition);
	}

	public isQualityClear(elementIndex: number): boolean
	{
		return this.getIntegerAt(elementIndex) == 0;
	}

	public static setBit(bytes: Uint32Array, bitPosition: number): Uint32Array
	{
		const targetByte = Math.floor((32 - bitPosition) / 8);
		const base = bytes[targetByte];
		const targetBit = (bitPosition - 1) % 8;
		bytes[targetByte] = base | Quality.MASK[targetBit];
		return bytes;
	}

    public clearBit(elementIndex: number, bitPosition: number): void
	{
		if((elementIndex > this._size) || (elementIndex < 0))
		{
			throw new RangeError("Index of: "
					+ elementIndex + " Out of range[0 - " + this._size);
		}
		let bytes: Uint32Array = this.getElementAt(elementIndex);
		bytes = Quality.clearBit(bytes, bitPosition);
		this.setElementAt(bytes, elementIndex);
		return;
	}

	public static clearBit(bytes: Uint32Array, bitPosition: number): Uint32Array
	{
		const targetByte: number = Math.floor((32 - bitPosition) / 8);
		const base: number = bytes[targetByte];
		const targetBit: number = (bitPosition - 1) % 8;
		let result: number = base & Quality.MASK[targetBit];
		if(result != 0)
		{
			bytes[targetByte] = base ^ Quality.MASK[targetBit];
		}
		return bytes;
	}

	public isScreened(elementIndex: number): boolean
	{
		return this.isBitSet(elementIndex, Quality.SCREENED_BIT);
	}

	public isNotScreened(elementIndex: number): boolean
	{
		return this.isBitClear(elementIndex, Quality.SCREENED_BIT);
	}

	public clearQuality(elementIndex: number): void
	{
		// Clear all quality bits
		let tmpBytes: Uint32Array = this.getElementAt(elementIndex);
		let sizeInBytes: number = tmpBytes.length;
		if(sizeInBytes > 0)
		{
			const tmpByte: number = 0 & Quality.MASK_BYTE;
			for(let i = 0; i < sizeInBytes; i++)
			{
				tmpBytes[i] = tmpByte;
			}
			this.setElementAt(tmpBytes, elementIndex);
		}
	}

	public clearScreened(elementIndex: number): void
	{
		this.clearBit(elementIndex, Quality.SCREENED_BIT);
	}

	public setScreened(elementIndex: number): void
	{
		this.setBit(elementIndex, Quality.SCREENED_BIT);
	}

	public static isScreened(bytes: Uint32Array): boolean
	{
		return Quality.isBitSet(bytes, Quality.SCREENED_BIT);
	}

	public static isScreened_int(intQuality: number): boolean
	{
		return Quality.isBitSet_int(intQuality, Quality.SCREENED_BIT);
	}

	public static isNotScreened(bytes: Uint32Array): boolean
	{
		return Quality.isBitClear(bytes, Quality.SCREENED_BIT);
	}

	public static isNotScreened_int(intQuality: number): boolean
	{
		return Quality.isBitClear_int(intQuality, Quality.SCREENED_BIT);
	}

	public static clearQuality(bytes: Uint32Array): Uint32Array | null {
        // Clear all quality bits
        if (bytes === null) {
            return null;
        }
        const sizeInBytes: number = bytes.length;
        const tmpBytes: Uint32Array = new Uint32Array(sizeInBytes);
        if (sizeInBytes > 0) {
            const tmpByte: number = 0 & Quality.MASK_BYTE;
            for (let i = 0; i < sizeInBytes; i++) {
                tmpBytes[i] = tmpByte;
            }
        }
        return tmpBytes;
    }

	public static clearQuality_int(qualityAsIntegers: number[] | number): number[] | number | null
    {
        if (typeof qualityAsIntegers === 'number') 
        {
            return 0
        }
		if(qualityAsIntegers === null)
		{
			return null;
		}
		for(let i = 0; i < qualityAsIntegers.length; ++i)
		{
			qualityAsIntegers[i] = 0;
		}
		return qualityAsIntegers;
	}

	public static clearScreened(bytes: Uint32Array): Uint32Array
	{
		return Quality.clearBit(bytes, Quality.SCREENED_BIT);
	}

	public static clearScreened_int(intQuality: number): number
	{
		return this.clearBit_int(intQuality, this.SCREENED_BIT);
	}

	public static setScreened(bytes: Uint32Array): Uint32Array
	{
		return this.setBit(bytes, this.SCREENED_BIT);
	}

	public static setScreened_int(intQuality: number): number
	{
		return this.setBit_int(intQuality, this.SCREENED_BIT);
	}

	public isQuestion(elementIndex: number): boolean
	{
		return this.isScreened(elementIndex)
				&& this.isBitSet(elementIndex, this.QUESTION_BIT);
	}

	public isNotQuestion(elementIndex: number): boolean
	{
		return !this.isQuestion(elementIndex);
	}

	public clearQuestion(elementIndex: number): void
	{
		this.clearBit(elementIndex, QUESTION_BIT);
		this.setBit(elementIndex, SCREENED_BIT);
	}

	public setQuestion(elementIndex: number): void
	{
		this.setBit(elementIndex,   this.QUESTION_BIT);
		this.clearBit(elementIndex, this.OKAY_BIT);
		this.clearBit(elementIndex, this.REJECT_BIT);
		this.clearBit(elementIndex, this.MISSING_BIT);
		this.setBit(elementIndex,   this.SCREENED_BIT);
	}

	public static isQuestion(bytes: Uint32Array): boolean
	{
		return this.isScreened(bytes)
				&& this.isBitSet(bytes, this.QUESTION_BIT);
	}

	public static isQuestion_int(intQuality: number): boolean
	{
		return isBitSet_int(intQuality, SCREENED_BIT)
				&& isBitSet_int(intQuality, QUESTION_BIT);
	}

	public static isNotQuestion(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isQuestion(bytes);
	}

	public static isNotQuestion_int(intQuality: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isQuestion_int(intQuality);
	}

	public static clearQuestion(bytes: Uint32Array): Uint32Array
	{
		let tmp: Uint32Array = clearBit(bytes, QUESTION_BIT);
		return setBit(tmp, SCREENED_BIT);
	}

	public static clearQuestion_int(intQuality: number): number
	{
		return this.setBit_int(this.clearBit_int(intQuality, this.QUESTION_BIT), this.SCREENED_BIT);
	}

	public static setQuestion(bytes: Uint32Array): Uint32Array
	{
		let tmp: Uint32Array = this.setBit(bytes, this.QUESTION_BIT);
		tmp = this.clearBit(tmp, this.OKAY_BIT);
		tmp = this.clearBit(tmp, this.MISSING_BIT);
		tmp = this.clearBit(tmp, this.REJECT_BIT);
		return this.setBit(tmp,  this.SCREENED_BIT);
	}

	public static setQuestion_int(intQuality: number): int
	{
		let tmp: number = this.setBit_int(intQuality, this.QUESTION_BIT);
		tmp = this.clearBit_int(tmp, this.OKAY_BIT);
		tmp = this.clearBit_int(tmp, this.MISSING_BIT);
		tmp = this.clearBit_int(tmp, this.REJECT_BIT);
		return this.setBit_int(tmp, this.SCREENED_BIT);
	}

	public isReject(elementIndex: number):  boolean
	{
		return this.isScreened(elementIndex)
				&& this.isBitSet(elementIndex, this.REJECT_BIT);
	}

	public isNotReject(elementIndex: number): boolean
	{
		return !this.isReject(elementIndex);
	}

	public clearReject(elementIndex: number): void
	{
		this.clearBit(elementIndex, this.REJECT_BIT);
		this.setBit(elementIndex, this.SCREENED_BIT);
	}

	public setReject(elementIndex: number): void
	{
		this.setBit(elementIndex, this.REJECT_BIT);
		this.clearBit(elementIndex, this.OKAY_BIT);
		this.clearBit(elementIndex, this.QUESTION_BIT);
		this.clearBit(elementIndex, this.MISSING_BIT);
		this.setBit(elementIndex, this.SCREENED_BIT);
	}

	public clearRange(elementIndex: number): void
	{
		this.clearBit(elementIndex, this.RANGE_OF_VALUE_BIT0);
		this.clearBit(elementIndex, this.RANGE_OF_VALUE_BIT1);
	}

	public setRange0(elementIndex: number): void
	{
		// Range of value is below first limit
		// Set value = 0 as bit pattern 00
		this.clearBit(elementIndex, this.RANGE_OF_VALUE_BIT0);
		this.clearBit(elementIndex, this.RANGE_OF_VALUE_BIT1);
	}

	public setRange1(elementIndex: number): void
	{
		// Range of value is between first and second limits
		// Set value = 1 as bit pattern 01
		this.setBit(elementIndex,   this.RANGE_OF_VALUE_BIT0);
		this.clearBit(elementIndex, this.RANGE_OF_VALUE_BIT1);
	}

	public setRange2(elementIndex: number): void
	{
		// Range of value is between second and third limits
		// Set value = 2 as bit pattern 10
		clearBit(elementIndex, RANGE_OF_VALUE_BIT0);
		setBit(elementIndex, RANGE_OF_VALUE_BIT1);
	}

	public setRange3(elementIndex: number): void
	{
		// Range of value is greater than the third limit
		// Set value = 3 as bit pattern 11
		setBit(elementIndex, RANGE_OF_VALUE_BIT0);
		setBit(elementIndex, RANGE_OF_VALUE_BIT1);
	}

	public isDifferentValue(elementIndex: number): boolean
	{
		return isBitSet(elementIndex, VALUE_DIFFERS_BIT);
	}

	public isNotDifferentValue(elementIndex: number): boolean
	{
		return !isDifferentValue(elementIndex);
	}

	private clearDifferentValue(elementIndex: number): void
	{
		// Value same as original value
		clearBit(elementIndex, VALUE_DIFFERS_BIT);
	}

	private setDifferentValue(elementIndex: number): void
	{
		// Value differs from original value
		// Once set cannot be cleared, except by clearQuality
		setBit(elementIndex, VALUE_DIFFERS_BIT);
	}

	public isRevised(elementIndex: number): boolean
	// throws DataSetTxQualityFlagException
	{
		// Is Revised if
		// differs from original value,
		// is manually entered, or
		// has a replacement method set
		return (isDifferentValue(elementIndex)
				|| (isBitSet(elementIndex, HOW_REVISED_BIT0)
				&& isBitSet(elementIndex, HOW_REVISED_BIT1) && !isBitSet(
				elementIndex, HOW_REVISED_BIT2))
				|| isBitSet(elementIndex, REPLACE_METHOD_BIT0)
				|| isBitSet(elementIndex, REPLACE_METHOD_BIT1)
				|| isBitSet(elementIndex, REPLACE_METHOD_BIT2) || isBitSet(
				elementIndex, REPLACE_METHOD_BIT3));
	}

	public isNotRevised(elementIndex: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isRevised(elementIndex);
	}

	public clearHowRevised(elementIndex: number): void
	{
		clearBit(elementIndex, HOW_REVISED_BIT0);
		clearBit(elementIndex, HOW_REVISED_BIT1);
		clearBit(elementIndex, HOW_REVISED_BIT2);
	}

	public clearReplaceMethod(elementIndex: number): void
	{
		clearBit(elementIndex, REPLACE_METHOD_BIT0);
		clearBit(elementIndex, REPLACE_METHOD_BIT1);
		clearBit(elementIndex, REPLACE_METHOD_BIT2);
		clearBit(elementIndex, REPLACE_METHOD_BIT3);
	}

	public setRevisedNoRevision(elementIndex: number): void
	{
		clearHowRevised(elementIndex);
	}

	public setReplaceNoRevision(elementIndex: number): void
	{
		clearReplaceMethod(elementIndex);
	}

	public setNoRevision(elementIndex: number): void
	{
		setRevisedNoRevision(elementIndex);
		setReplaceNoRevision(elementIndex);
	}

	public setRevisedAutomatically(elementIndex: number): void
	{
		// DATCHK or Automatic Process has performed revision
		// Set value = 1 as bit pattern 001
		setOkay(elementIndex);
		setDifferentValue(elementIndex);
		setBit(elementIndex, HOW_REVISED_BIT0);
		clearBit(elementIndex, HOW_REVISED_BIT1);
		clearBit(elementIndex, HOW_REVISED_BIT2);
	}

	public static isRevisedInteractivelyCheckAllBits(bytes: Uint32Array): boolean
	{
		return (isBitSet(bytes, SCREENED_BIT)
				&& isBitSet(bytes, OKAY_BIT)
				&& isBitClear(bytes, MISSING_BIT)
				&& isBitClear(bytes, QUESTION_BIT)
				&& isBitClear(bytes, REJECT_BIT)
				&& isBitSet(bytes, VALUE_DIFFERS_BIT)

				&& isRevisedInteractively(bytes)
		);
	}

	public static isRevisedInteractivelyCheckAllBits_int(intQuality: number): boolean
	{
		return (isBitSet_int(intQuality, SCREENED_BIT)
				&& isBitSet_int(intQuality, OKAY_BIT)
				&& Quality.isBitClear_int(intQuality, MISSING_BIT)
				&& Quality.isBitClear_int(intQuality, QUESTION_BIT)
				&& Quality.isBitClear_int(intQuality, REJECT_BIT)
				&& isBitSet_int(intQuality, VALUE_DIFFERS_BIT)

				&& isRevisedInteractively_int(intQuality)
		);
	}

	public static isRevisedInteractively(bytes: Uint32Array): boolean
	{
		// DATVUE or Interactive Process has performed revision
		// Value = 2 as bit pattern 010
		return isBitClear(bytes, HOW_REVISED_BIT0)
				&& isBitSet(bytes, HOW_REVISED_BIT1)
				&& isBitClear(bytes, HOW_REVISED_BIT2);
	}

	public static isRevisedInteractively_int(intQuality: number): boolean
	{
		// DATVUE or Interactive Process has performed revision
		// Value = 2 as bit pattern 010
		return Quality.isBitClear_int(intQuality, HOW_REVISED_BIT0)
				&& isBitSet_int(intQuality, HOW_REVISED_BIT1)
				&& Quality.isBitClear_int(intQuality, HOW_REVISED_BIT2);
	}

	public setRevisedInteractively(elementIndex: number): void
	{
		// DATVUE or Interactive Process has performed revision
		// Set value = 2 as bit pattern 010
		setOkay(elementIndex);
		setDifferentValue(elementIndex);
		clearBit(elementIndex, HOW_REVISED_BIT0);
		setBit(elementIndex, HOW_REVISED_BIT1);
		clearBit(elementIndex, HOW_REVISED_BIT2);
	}

	public setRevisedManually(elementIndex: number): void
	{
		// DATVUE or Interactive Process has performed manual revision
		// Set value = 3 as bit pattern 011
		setOkay(elementIndex);
		setDifferentValue(elementIndex);
		setBit(elementIndex, HOW_REVISED_BIT0);
		setBit(elementIndex, HOW_REVISED_BIT1);
		clearBit(elementIndex, HOW_REVISED_BIT2);
	}

	/**
	 * setRevisedToOriginalAccepted Function Sets Quality Bits to: Screened Bit
	 * on Okay Bit on How Revised Bits to "Original Value Accepted in DATVUE or
	 * Interactive Process Replace Bits to "No Revision" Does not change status
	 * of other bits
	 */
	public setRevisedToOriginalAccepted(elementIndex: number): void
	{
		// DATVUE or Interactive Process has accepted original value
		// Set value = 4 as bit pattern 100
		setOkay(elementIndex);
		clearBit(elementIndex, HOW_REVISED_BIT0);
		clearBit(elementIndex, HOW_REVISED_BIT1);
		setBit(elementIndex, HOW_REVISED_BIT2);
		clearReplaceMethod(elementIndex);
	}

	public setReplaceLinearInterpolation(elementIndex: number): void
	{
		// Replacement method is linear interpolation
		// Set value = 1 as bit pattern 0001
		setOkay(elementIndex);
		setDifferentValue(elementIndex);
		setBit(elementIndex, REPLACE_METHOD_BIT0);
		clearBit(elementIndex, REPLACE_METHOD_BIT1);
		clearBit(elementIndex, REPLACE_METHOD_BIT2);
		clearBit(elementIndex, REPLACE_METHOD_BIT3);
	}

	public setReplaceManualChange(elementIndex: number): void
	{
		// Replacement method is manual Change
		// Set value = 2 as bit pattern 0010
		setOkay(elementIndex);
		setDifferentValue(elementIndex);
		clearBit(elementIndex, REPLACE_METHOD_BIT0);
		setBit(elementIndex, REPLACE_METHOD_BIT1);
		clearBit(elementIndex, REPLACE_METHOD_BIT2);
		clearBit(elementIndex, REPLACE_METHOD_BIT3);
	}

	public setReplaceGraphicalChange(elementIndex: number): void
	{
		// Replacement method is graphical Change
		// Set value = 4 as bit pattern 0100
		setOkay(elementIndex);
		setDifferentValue(elementIndex);
		clearBit(elementIndex, REPLACE_METHOD_BIT0);
		clearBit(elementIndex, REPLACE_METHOD_BIT1);
		setBit(elementIndex, REPLACE_METHOD_BIT2);
		clearBit(elementIndex, REPLACE_METHOD_BIT3);
	}

	public setReplaceWithMissing(elementIndex: number): void
	{
		// Replacement method is replace with missing
		// Set value = 3 as bit pattern 0011
		setMissing(elementIndex);
		setDifferentValue(elementIndex);
		setBit(elementIndex, REPLACE_METHOD_BIT0);
		setBit(elementIndex, REPLACE_METHOD_BIT1);
		clearBit(elementIndex, REPLACE_METHOD_BIT2);
		clearBit(elementIndex, REPLACE_METHOD_BIT3);
	}

	public static isReject(bytes: Uint32Array): boolean
	{
		return isScreened(bytes)
				&& isBitSet(bytes, REJECT_BIT);
	}

	public static isReject_int(intQuality: number): boolean
	{
		return isBitSet_int(intQuality, SCREENED_BIT)
				&& isBitSet_int(intQuality, REJECT_BIT);
	}

	public static isNotReject(bytes: Uint32Array): boolean
	{
		return !isReject(bytes);
	}

	public static isNotReject_int(intQuality: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isReject_int(intQuality);
	}

	public static byte[] clearReject(bytes: Uint32Array)
	{
		byte[] tmp = clearBit(bytes, REJECT_BIT);
		return setBit(tmp, SCREENED_BIT);
	}

	public static clearReject_int(intQuality: number): number
	{
		return setBit_int(clearBit_int(intQuality, REJECT_BIT), SCREENED_BIT);
	}

	public static byte[] setReject(bytes: Uint32Array)
	{
		byte[] tmp = setBit(bytes, REJECT_BIT);
		tmp = clearBit(tmp, OKAY_BIT);
		tmp = clearBit(tmp, QUESTION_BIT);
		tmp = clearBit(tmp, MISSING_BIT);
		return setBit(tmp, SCREENED_BIT);
	}

	public static setReject_int(intQuality: number): number
	{
		let tmp: number = setBit_int(intQuality, REJECT_BIT);
		tmp = clearBit_int(tmp, OKAY_BIT);
		tmp = clearBit_int(tmp, QUESTION_BIT);
		tmp = clearBit_int(tmp, MISSING_BIT);
		return setBit_int(tmp, SCREENED_BIT);
	}

	public static byte[] clearRange(bytes: Uint32Array)
	{
		byte[] tmp = clearBit(bytes, RANGE_OF_VALUE_BIT0);
		return clearBit(tmp, RANGE_OF_VALUE_BIT1);
	}

	public static clearRange_int(intQuality: number): number
	{
		return clearBit_int(clearBit_int(intQuality, RANGE_OF_VALUE_BIT0),
				RANGE_OF_VALUE_BIT1);
	}

	public static byte[] setRange0(bytes: Uint32Array)
	{
		// Range of value is below first limit
		// Set value = 0 as bit pattern 00
		byte[] tmp = clearBit(bytes, RANGE_OF_VALUE_BIT0);
		return clearBit(tmp, RANGE_OF_VALUE_BIT1);
	}

	public static setRange0_int(intQuality: number): number
	{
		// Range of value is below first limit
		// Set value = 0 as bit pattern 00
		return clearBit_int(clearBit_int(intQuality, RANGE_OF_VALUE_BIT0),
				RANGE_OF_VALUE_BIT1);
	}

	public static isRange1(bytes: Uint32Array): boolean
	{
		// Range of value is between first and second limits
		// Value = 1 as bit pattern 01
		return isBitSet(bytes, RANGE_OF_VALUE_BIT0)
				&& isBitClear(bytes, RANGE_OF_VALUE_BIT1);
	}

	public static isRange1_int(intQuality: number): boolean
	{
		// Range of value is between first and second limits
		// Value = 1 as bit pattern 01
		return isBitSet_int(intQuality, RANGE_OF_VALUE_BIT0)
				&& Quality.isBitClear_int(intQuality, RANGE_OF_VALUE_BIT1);
	}

	public static byte[] setRange1(bytes: Uint32Array)
	{
		// Range of value is between first and second limits
		// Set value = 1 as bit pattern 01
		byte[] tmp = setBit(bytes, RANGE_OF_VALUE_BIT0);
		return clearBit(tmp, RANGE_OF_VALUE_BIT1);
	}

	public static setRange1_int(intQuality: number): number
	{
		// Range of value is between first and second limits
		// Set value = 1 as bit pattern 01
		return clearBit_int(setBit_int(intQuality, RANGE_OF_VALUE_BIT0),
				RANGE_OF_VALUE_BIT1);
	}

	public static isRange2(bytes: Uint32Array): boolean
	{
		// Range of value is between second and third limits
		// Value = 2 as bit pattern 10
		return isBitClear(bytes, RANGE_OF_VALUE_BIT0)
				&& isBitSet(bytes, RANGE_OF_VALUE_BIT1);
	}

	public static isRange2_int(intQuality: number): boolean
	{
		// Range of value is between second and third limits
		// Value = 2 as bit pattern 10
		return Quality.isBitClear_int(intQuality, RANGE_OF_VALUE_BIT0)
				&& isBitSet_int(intQuality, RANGE_OF_VALUE_BIT1);
	}

	public static byte[] setRange2(bytes: Uint32Array)
	{
		// Range of value is between second and third limits
		// Set value = 2 as bit pattern 10
		byte[] tmp = clearBit(bytes, RANGE_OF_VALUE_BIT0);
		return setBit(tmp, RANGE_OF_VALUE_BIT1);
	}

	public static setRange2_int(intQuality: number): number
	{
		// Range of value is between second and third limits
		// Set value = 2 as bit pattern 10
		return setBit_int(clearBit_int(intQuality, RANGE_OF_VALUE_BIT0),
				RANGE_OF_VALUE_BIT1);
	}

	public static isRange3(bytes: Uint32Array): boolean
	{
		// Range of value is between second and third limits
		// Value = 3 as bit pattern 11
		return isBitSet(bytes, RANGE_OF_VALUE_BIT0)
				&& isBitSet(bytes, RANGE_OF_VALUE_BIT1);
	}

	public static isRange3_int(intQuality: number): boolean
	{
		// Range of value is between second and third limits
		// Value = 3 as bit pattern 11
		return isBitSet_int(intQuality, RANGE_OF_VALUE_BIT0)
				&& isBitSet_int(intQuality, RANGE_OF_VALUE_BIT1);
	}

	public static byte[] setRange3(bytes: Uint32Array)
	{
		// Range of value is between second and third limits
		// Set value = 3 as bit pattern 11
		byte[] tmp = setBit(bytes, RANGE_OF_VALUE_BIT0);
		return setBit(tmp, RANGE_OF_VALUE_BIT1);
	}

	public static setRange3_int(intQuality: number): number
	{
		// Range of value is between second and third limits
		// Set value = 3 as bit pattern 11
		return setBit_int(setBit_int(intQuality, RANGE_OF_VALUE_BIT0),
				RANGE_OF_VALUE_BIT1);
	}

	public static isDifferentValue(bytes: Uint32Array): boolean
	{
		return isBitSet(bytes, VALUE_DIFFERS_BIT);
	}

	public static isDifferentValue_int(intQuality: number): boolean
	{
		return isBitSet_int(intQuality, VALUE_DIFFERS_BIT);
	}

	public static isNotDifferentValue(bytes: Uint32Array): boolean
	{
		return !isDifferentValue(bytes);
	}

	public static isNotDifferentValue_int(intQuality: number): boolean
	{
		return !isDifferentValue_int(intQuality);
	}

	public static byte[] clearDifferentValue(bytes: Uint32Array)
	{
		// Value same as original value
		return clearBit(bytes, VALUE_DIFFERS_BIT);
	}

	public static clearDifferentValue_int(intQuality: number): number
	{
		// Value same as original value
		return clearBit_int(intQuality, VALUE_DIFFERS_BIT);
	}

	private static byte[] setDifferentValue(bytes: Uint32Array)
	{
		// Value differs from original value
		// Once set cannot be cleared, except by clearQuality
		return setBit(bytes, VALUE_DIFFERS_BIT);
	}

	private static setDifferentValue_int(intQuality: number): number
	{
		// Value differs from original value
		// Once set cannot be cleared, except by clearQuality
		return setBit_int(intQuality, VALUE_DIFFERS_BIT);
	}

	public static isRevised(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		// Is Revised if
		// differs from original value,
		// is manually entered, or
		// has a replacement method set
		return (isDifferentValue(bytes)
				|| (isBitSet(bytes, HOW_REVISED_BIT0)
				&& isBitSet(bytes, HOW_REVISED_BIT1) && !isBitSet(bytes,
				HOW_REVISED_BIT2)) || isBitSet(bytes, REPLACE_METHOD_BIT0)
				|| isBitSet(bytes, REPLACE_METHOD_BIT1)
				|| isBitSet(bytes, REPLACE_METHOD_BIT2) || isBitSet(bytes,
				REPLACE_METHOD_BIT3));
	}

	public static isRevised_int(intQuality: number): boolean
	// throws DataSetTxQualityFlagException
	{
		// Is Revised if
		// differs from original value,
		// is manually entered, or
		// has a replacement method set
		return (isDifferentValue_int(intQuality)
				|| (isBitSet_int(intQuality, HOW_REVISED_BIT0)
				&& isBitSet_int(intQuality, HOW_REVISED_BIT1) && !isBitSet_int(
				intQuality, HOW_REVISED_BIT2))
				|| isBitSet_int(intQuality, REPLACE_METHOD_BIT0)
				|| isBitSet_int(intQuality, REPLACE_METHOD_BIT1)
				|| isBitSet_int(intQuality, REPLACE_METHOD_BIT2) || isBitSet_int(
				intQuality, REPLACE_METHOD_BIT3));
	}

	public isNotRevised(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isRevised(bytes);
	}

	public isNotRevised_int(intQuality: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isRevised_int(intQuality);
	}

	public static byte[] clearHowRevised(bytes: Uint32Array)
	{
		byte[] tmp = clearBit(bytes, HOW_REVISED_BIT0);
		tmp = clearBit(tmp, HOW_REVISED_BIT1);
		return clearBit(tmp, HOW_REVISED_BIT2);
	}

	public static clearHowRevised_int(intQuality: number): number
	{
		let tmp: number = clearBit_int(intQuality, HOW_REVISED_BIT0);
		tmp = clearBit_int(tmp, HOW_REVISED_BIT1);
		return clearBit_int(tmp, HOW_REVISED_BIT2);
	}

	public static byte[] clearReplaceMethod(bytes: Uint32Array)
	{
		byte[] tmp = clearBit(bytes, REPLACE_METHOD_BIT0);
		tmp = clearBit(tmp, REPLACE_METHOD_BIT1);
		tmp = clearBit(tmp, REPLACE_METHOD_BIT2);
		return clearBit(tmp, REPLACE_METHOD_BIT3);
	}

	public static clearReplaceMethod_int(intQuality: number): number
	{
		let tmp: number = clearBit_int(intQuality, REPLACE_METHOD_BIT0);
		tmp = clearBit_int(tmp, REPLACE_METHOD_BIT1);
		tmp = clearBit_int(tmp, REPLACE_METHOD_BIT2);
		return clearBit_int(tmp, REPLACE_METHOD_BIT3);
	}

	public static byte[] setReplaceNoRevision(bytes: Uint32Array)
	{
		return clearReplaceMethod(bytes);
	}

	public static setReplaceNoRevision_int(intQuality: number): number
	{
		return clearReplaceMethod_int(intQuality);
	}

	public static byte[] setNoRevision(bytes: Uint32Array)
	{
		byte[] tmp = clearHowRevised(bytes);
		return clearReplaceMethod(tmp);
	}

	public static setNoRevision_int(intQuality: number): number
	{
		int tmp = clearHowRevised_int(intQuality);
		return clearReplaceMethod_int(tmp);
	}

	public static byte[] setRevisedAutomatically(bytes: Uint32Array)
	{
		// DATCHK or Automatic Process has performed revision
		// Set value = 1 as bit pattern 001
		setOkay(bytes);
		setDifferentValue(bytes);
		byte[] tmp = setBit(bytes, HOW_REVISED_BIT0);
		tmp = clearBit(tmp, HOW_REVISED_BIT1);
		return clearBit(tmp, HOW_REVISED_BIT2);
	}

	public static setRevisedAutomatically_int(intQuality: number): number
	{
		// DATCHK or Automatic Process has performed revision
		// Set value = 1 as bit pattern 001
		int tmp = setOkay_int(intQuality);
		tmp = setDifferentValue_int(tmp);
		tmp = setBit_int(intQuality, HOW_REVISED_BIT0);
		tmp = clearBit_int(tmp, HOW_REVISED_BIT1);
		return clearBit_int(tmp, HOW_REVISED_BIT2);
	}

	public static isRevisedAutomaticallyCheckAllBits(bytes: Uint32Array): boolean
	{
		return (isBitSet(bytes, SCREENED_BIT)
				&& isBitSet(bytes, OKAY_BIT)
				&& isBitClear(bytes, MISSING_BIT)
				&& isBitClear(bytes, QUESTION_BIT)
				&& isBitClear(bytes, REJECT_BIT)
				&& isBitSet(bytes, VALUE_DIFFERS_BIT)

				&& isRevisedAutomatically(bytes)
		);

	}

	public static isRevisedAutomaticallyCheckAllBits_int(intQuality: number): boolean
	{
		return (isBitSet_int(intQuality, SCREENED_BIT)
				&& isBitSet_int(intQuality, OKAY_BIT)
				&& Quality.isBitClear_int(intQuality, MISSING_BIT)
				&& Quality.isBitClear_int(intQuality, QUESTION_BIT)
				&& Quality.isBitClear_int(intQuality, REJECT_BIT)
				&& isBitSet_int(intQuality, VALUE_DIFFERS_BIT)

				&& isRevisedAutomatically_int(intQuality)
		);

	}

	public static isRevisedAutomatically(bytes: Uint32Array): boolean
	{
		// DATCHK or Automatic Process has performed revision
		// value = 1 as bit pattern 001
		return isBitSet(bytes, HOW_REVISED_BIT0)
				&& isBitClear(bytes, HOW_REVISED_BIT1)
				&& isBitClear(bytes, HOW_REVISED_BIT2);
	}

	public static isRevisedAutomatically_int(intQuality: number): boolean
	{
		// DATCHK or Automatic Process has performed revision
		// value = 1 as bit pattern 001
		return isBitSet_int(intQuality, HOW_REVISED_BIT0)
				&& Quality.isBitClear_int(intQuality, HOW_REVISED_BIT1)
				&& Quality.isBitClear_int(intQuality, HOW_REVISED_BIT2);
	}

	public static byte[] setRevisedInteractively(bytes: Uint32Array)
	{
		// DATVUE or Interactive Process has performed revision
		// Set value = 2 as bit pattern 010
		setOkay(bytes);
		setDifferentValue(bytes);
		byte[] tmp = clearBit(bytes, HOW_REVISED_BIT0);
		tmp = setBit(tmp, HOW_REVISED_BIT1);
		return clearBit(tmp, HOW_REVISED_BIT2);
	}

	public static int setRevisedInteractively_int(intQuality: number)
	{
		// DATVUE or Interactive Process has performed revision
		// Set value = 2 as bit pattern 010
		int tmp = setOkay_int(intQuality);
		tmp = setDifferentValue_int(intQuality);
		tmp = clearBit_int(intQuality, HOW_REVISED_BIT0);
		tmp = setBit_int(tmp, HOW_REVISED_BIT1);
		return clearBit_int(tmp, HOW_REVISED_BIT2);
	}

	public static isRevisedManuallyCheckAllBits(bytes: Uint32Array): boolean
	{
		return (isBitSet(bytes, SCREENED_BIT)
				&& isBitSet(bytes, OKAY_BIT)
				&& isBitClear(bytes, MISSING_BIT)
				&& isBitClear(bytes, QUESTION_BIT)
				&& isBitClear(bytes, REJECT_BIT)
				&& isBitSet(bytes, VALUE_DIFFERS_BIT)

				&& isRevisedManually(bytes)
		);
	}

	public static isRevisedManually(bytes: Uint32Array): boolean
	{
		// DATVUE or Interactive Process has performed revision
		// Value = 3 as bit pattern 011
		return isBitSet(bytes, HOW_REVISED_BIT0)
				&& isBitSet(bytes, HOW_REVISED_BIT1)
				&& isBitClear(bytes, HOW_REVISED_BIT2);
	}

	public static isRevisedManuallyCheckAllBits_int(intQuality: number): boolean
	{
		return (isBitSet_int(intQuality, SCREENED_BIT)
				&& isBitSet_int(intQuality, OKAY_BIT)
				&& Quality.isBitClear_int(intQuality, MISSING_BIT)
				&& Quality.isBitClear_int(intQuality, QUESTION_BIT)
				&& Quality.isBitClear_int(intQuality, REJECT_BIT)
				&& isBitSet_int(intQuality, VALUE_DIFFERS_BIT)

				&& isRevisedManually_int(intQuality)
		);
	}

	public static isRevisedManually_int(intQuality: number): boolean
	{
		// DATVUE or Interactive Process has performed revision
		// Value = 3 as bit pattern 011
		return isBitSet_int(intQuality, HOW_REVISED_BIT0)
				&& isBitSet_int(intQuality, HOW_REVISED_BIT1)
				&& Quality.isBitClear_int(intQuality, HOW_REVISED_BIT2);
	}

	public static byte[] setRevisedManually(bytes: Uint32Array)
	{
		// DATVUE or Interactive Process has performed revision
		// Set value = 3 as bit pattern 011
		setOkay(bytes);
		setDifferentValue(bytes);
		byte[] tmp = setBit(bytes, HOW_REVISED_BIT0);
		tmp = setBit(tmp, HOW_REVISED_BIT1);
		return clearBit(tmp, HOW_REVISED_BIT2);
	}

	public static setRevisedManually_int(intQuality: number): number
	{
		// DATVUE or Interactive Process has performed revision
		// Set value = 3 as bit pattern 011
		let tmp: number = setOkay_int(intQuality);
		tmp = setDifferentValue_int(intQuality);
		tmp = setBit_int(intQuality, HOW_REVISED_BIT0);
		tmp = setBit_int(tmp, HOW_REVISED_BIT1);
		return clearBit_int(tmp, HOW_REVISED_BIT2);
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
	public setUsingQualityFlags(byte[] originalBytes, elementIndex: number, String qualFlag, boolean isValueRevised): void
	{
		byte[] qual = getQualUsingFlags(originalBytes, qualFlag, isValueRevised);
		this.setElementAt(qual, elementIndex);
	}

	public static byte[] getQualUsingFlags(byte[] originalBytes,
										   String qualFlag, boolean isValueRevised)
	{
		// Set Data Quality Bits
		byte[] newbytes = new byte[4];
		System.arraycopy(originalBytes, 0, newbytes, 0, 4);

		if(qualFlag.indexOf("A") > -1)
		{
			if(isValueRevised)
			{
				Quality.setRevisedManually(newbytes);
			}
			if(!Quality.isDifferentValue(newbytes))
			{
				Quality.setRevisedToOriginalAccepted(newbytes);
			}
			Quality.setOkay(newbytes);
		}
		else if(qualFlag.indexOf("M") > -1)
		{
			if(isValueRevised)
			{
				Quality.setRevisedManually(newbytes);
			}
			Quality.setMissing(newbytes);
			// QualityTx.setReplaceWithMissing(newbytes);

		}
		else if(qualFlag.indexOf("Q") > -1)
		{
			if(isValueRevised)
			{
				Quality.setRevisedManually(newbytes);
			}
			Quality.setQuestion(newbytes);
		}
		else if(qualFlag.indexOf("R") > -1)
		{
			if(isValueRevised)
			{
				Quality.setRevisedManually(newbytes);
			}
			Quality.setReject(newbytes);
		}
		// Set How Revised, Replacement Method, and Protection bits
		return Quality.getQualUsingReviseReplaceFlags(newbytes, qualFlag,
				isValueRevised);
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
	private setUsingReviseReplaceFlags(byte[] originalBytes, elementIndex: number, String qualFlag, boolean isValueRevised): void
	{
		byte[] newbytes = getQualUsingReviseReplaceFlags(originalBytes,
				qualFlag, isValueRevised);
		this.setElementAt(newbytes, elementIndex);

	}

	private static byte[] getQualUsingReviseReplaceFlags(byte[] originalBytes,
														 String qualFlag, boolean isValueRevised)
	{

		byte[] newBytes = new byte[4];
		System.arraycopy(originalBytes, 0, newBytes, 0, 4);
		// Set How Revised/Replacement Method Bits
		if(qualFlag.indexOf("E") > -1)
		{
			Quality.setRevisedManually(newBytes);
			Quality.setReplaceGraphicalChange(newBytes);
		}
		else if(qualFlag.indexOf("I") > -1)
		{
			Quality.setRevisedInteractively(newBytes);
			Quality.setReplaceLinearInterpolation(newBytes);
		}
		else if(qualFlag.indexOf("K") > -1)
		{
			Quality.setRevisedManually(newBytes);
			Quality.setReplaceManualChange(newBytes);
		}

		// Set Protection Bit
		if(qualFlag.indexOf("P") > -1)
		{
			Quality.setProtected(newBytes);
		}
		else if(qualFlag.indexOf("U") > -1)
		{
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
	public static byte[] setRevisedToOriginalAccepted(bytes: Uint32Array)
	{
		// DATVUE or Interactive Process has accepted original value
		// Set value = 4 as bit pattern 100
		setOkay(bytes);
		byte[] tmp = clearBit(bytes, HOW_REVISED_BIT0);
		tmp = clearBit(tmp, HOW_REVISED_BIT1);
		tmp = setBit(tmp, HOW_REVISED_BIT2);
		return setReplaceNoRevision(tmp);
	}

	public static int setRevisedToOriginalAccepted_int(intQuality: number)
	{
		// DATVUE or Interactive Process has accepted original value
		// Set value = 4 as bit pattern 100
		int tmp = setOkay_int(intQuality);
		tmp = clearBit_int(intQuality, HOW_REVISED_BIT0);
		tmp = clearBit_int(tmp, HOW_REVISED_BIT1);
		tmp = setBit_int(tmp, HOW_REVISED_BIT2);
		return setReplaceNoRevision_int(tmp);
	}

	public static isRevisedToOriginalAccepted(bytes: Uint32Array): boolean
	{
		// DATVUE or Interactive Process has accepted original value
		// Value = 4 as bit pattern 100
		return isBitClear(bytes, HOW_REVISED_BIT0)
				&& isBitClear(bytes, HOW_REVISED_BIT1)
				&& isBitSet(bytes, HOW_REVISED_BIT2);
	}


	public static isRevisedToOriginalAccepted_int(intQuality: number): boolean
	{
		// DATVUE or Interactive Process has accepted original value
		// Value = 4 as bit pattern 100
		return Quality.isBitClear_int(intQuality, HOW_REVISED_BIT0)
				&& Quality.isBitClear_int(intQuality, HOW_REVISED_BIT1)
				&& isBitSet_int(intQuality, HOW_REVISED_BIT2);
	}

	public static isReplaceLinearInterpolation(bytes: Uint32Array): boolean
	{
		// Replacement method is linear interpolation
		// Value = 1 as bit pattern 0001
		return isBitSet(bytes, REPLACE_METHOD_BIT0)
				&& isBitClear(bytes, REPLACE_METHOD_BIT1)
				&& isBitClear(bytes, REPLACE_METHOD_BIT2)
				&& isBitClear(bytes, REPLACE_METHOD_BIT3);
	}

	public static isReplaceLinearInterpolation_int(intQuality: number): boolean
	{
		// Replacement method is linear interpolation
		// Value = 1 as bit pattern 0001
		return isBitSet_int(intQuality, REPLACE_METHOD_BIT0)
				&& Quality.isBitClear_int(intQuality, REPLACE_METHOD_BIT1)
				&& Quality.isBitClear_int(intQuality, REPLACE_METHOD_BIT2)
				&& Quality.isBitClear_int(intQuality, REPLACE_METHOD_BIT3);
	}

	public static byte[] setReplaceLinearInterpolation(bytes: Uint32Array)
	{
		// Replacement method is linear interpolation
		// Set value = 1 as bit pattern 0001
		setOkay(bytes);
		setDifferentValue(bytes);
		byte[] tmp = setBit(bytes, REPLACE_METHOD_BIT0);
		tmp = clearBit(tmp, REPLACE_METHOD_BIT1);
		tmp = clearBit(tmp, REPLACE_METHOD_BIT2);
		return clearBit(tmp, REPLACE_METHOD_BIT3);
	}

	public static setReplaceLinearInterpolation_int(intQuality: number): number
	{
		// Replacement method is linear interpolation
		// Set value = 1 as bit pattern 0001
		int tmp = setOkay_int(intQuality);
		tmp = setDifferentValue_int(intQuality);
		tmp = setBit_int(intQuality, REPLACE_METHOD_BIT0);
		tmp = clearBit_int(tmp, REPLACE_METHOD_BIT1);
		tmp = clearBit_int(tmp, REPLACE_METHOD_BIT2);
		return clearBit_int(tmp, REPLACE_METHOD_BIT3);
	}

	public static isReplaceManualChange(bytes: Uint32Array): boolean
	{
		// Replacement method is manual Change
		// Value = 2 as bit pattern 0010
		return isBitClear(bytes, REPLACE_METHOD_BIT0)
				&& isBitSet(bytes, REPLACE_METHOD_BIT1)
				&& isBitClear(bytes, REPLACE_METHOD_BIT2)
				&& isBitClear(bytes, REPLACE_METHOD_BIT3);
	}

	public static isReplaceManualChange_int(intQuality: number): boolean
	{
		// Replacement method is manual Change
		// Value = 2 as bit pattern 0010
		return Quality.isBitClear_int(intQuality, REPLACE_METHOD_BIT0)
				&& isBitSet_int(intQuality, REPLACE_METHOD_BIT1)
				&& Quality.isBitClear_int(intQuality, REPLACE_METHOD_BIT2)
				&& Quality.isBitClear_int(intQuality, REPLACE_METHOD_BIT3);
	}

	public static byte[] setReplaceManualChange(bytes: Uint32Array)
	{
		// Replacement method is manual Change
		// Set value = 2 as bit pattern 0010
		setOkay(bytes);
		setDifferentValue(bytes);
		byte[] tmp = clearBit(bytes, REPLACE_METHOD_BIT0);
		tmp = setBit(tmp, REPLACE_METHOD_BIT1);
		tmp = clearBit(tmp, REPLACE_METHOD_BIT2);
		return clearBit(tmp, REPLACE_METHOD_BIT3);
	}

	public static setReplaceManualChange_int(intQuality: number): number
	{
		// Replacement method is manual Change
		// Set value = 2 as bit pattern 0010
		int tmp = setOkay_int(intQuality);
		tmp = setDifferentValue_int(intQuality);
		tmp = clearBit_int(intQuality, REPLACE_METHOD_BIT0);
		tmp = setBit_int(tmp, REPLACE_METHOD_BIT1);
		tmp = clearBit_int(tmp, REPLACE_METHOD_BIT2);
		return clearBit_int(tmp, REPLACE_METHOD_BIT3);
	}

	public static isReplaceGraphicalChange(bytes: Uint32Array): boolean
	{
		// Replacement method is graphical Change
		// Value = 4 as bit pattern 0100
		return isBitClear(bytes, REPLACE_METHOD_BIT0)
				&& isBitClear(bytes, REPLACE_METHOD_BIT1)
				&& isBitSet(bytes, REPLACE_METHOD_BIT2)
				&& isBitClear(bytes, REPLACE_METHOD_BIT3);
	}

	public static isReplaceGraphicalChange_int(intQuality: number): boolean
	{
		// Replacement method is graphical Change
		// Value = 4 as bit pattern 0100
		return Quality.isBitClear_int(intQuality, REPLACE_METHOD_BIT0)
				&& Quality.isBitClear_int(intQuality, REPLACE_METHOD_BIT1)
				&& isBitSet_int(intQuality, REPLACE_METHOD_BIT2)
				&& Quality.isBitClear_int(intQuality, REPLACE_METHOD_BIT3);
	}

	public static byte[] setReplaceGraphicalChange(bytes: Uint32Array)
	{
		// Replacement method is graphical Change
		// Set value = 4 as bit pattern 0100
		setOkay(bytes);
		setDifferentValue(bytes);
		byte[] tmp = clearBit(bytes, REPLACE_METHOD_BIT0);
		tmp = clearBit(tmp, REPLACE_METHOD_BIT1);
		tmp = setBit(tmp, REPLACE_METHOD_BIT2);
		return clearBit(tmp, REPLACE_METHOD_BIT3);
	}

	public static setReplaceGraphicalChange_int(intQuality: number): number
	{
		// Replacement method is graphical Change
		// Set value = 4 as bit pattern 0100
		let tmp: number = setOkay_int(intQuality);
		tmp = setDifferentValue_int(intQuality);
		tmp = clearBit_int(intQuality, REPLACE_METHOD_BIT0);
		tmp = clearBit_int(tmp, REPLACE_METHOD_BIT1);
		tmp = setBit_int(tmp, REPLACE_METHOD_BIT2);
		return clearBit_int(tmp, REPLACE_METHOD_BIT3);
	}

	public static isReplaceWithMissing(bytes: Uint32Array): boolean
	{
		// Replacement method is replace with missing
		// Value = 3 as bit pattern 0011
		return isBitSet(bytes, REPLACE_METHOD_BIT0)
				&& isBitSet(bytes, REPLACE_METHOD_BIT1)
				&& isBitClear(bytes, REPLACE_METHOD_BIT2)
				&& isBitClear(bytes, REPLACE_METHOD_BIT3);
	}

	public static isReplaceWithMissing_int(intQuality: number): boolean
	{
		// Replacement method is replace with missing
		// Value = 3 as bit pattern 0011
		return isBitSet_int(intQuality, REPLACE_METHOD_BIT0)
				&& isBitSet_int(intQuality, REPLACE_METHOD_BIT1)
				&& Quality.isBitClear_int(intQuality, REPLACE_METHOD_BIT2)
				&& Quality.isBitClear_int(intQuality, REPLACE_METHOD_BIT3);
	}

	public static byte[] setReplaceWithMissing(bytes: Uint32Array)
	{
		// Replacement method is replace with missing
		// Set value = 3 as bit pattern 0011
		setMissing(bytes);
		setDifferentValue(bytes);
		byte[] tmp = setBit(bytes, REPLACE_METHOD_BIT0);
		tmp = setBit(tmp, REPLACE_METHOD_BIT1);
		tmp = clearBit(tmp, REPLACE_METHOD_BIT2);
		return clearBit(tmp, REPLACE_METHOD_BIT3);
	}

	public static setReplaceWithMissing_int(intQuality: number): number
	{
		// Replacement method is replace with missing
		// Set value = 3 as bit pattern 0011
		let tmp: number = setMissing_int(intQuality);
		tmp = setDifferentValue_int(intQuality);
		tmp = setBit_int(intQuality, REPLACE_METHOD_BIT0);
		tmp = setBit_int(tmp, REPLACE_METHOD_BIT1);
		tmp = clearBit_int(tmp, REPLACE_METHOD_BIT2);
		return clearBit_int(tmp, REPLACE_METHOD_BIT3);
	}

	public isOkay(elementIndex: number): boolean
	// throws DataSetTxQualityFlagException
	{
		// if (!isBitSet(elementIndex, SCREENED_BIT))
		// {
		// throw new DataSetTxQualityFlagException(
		// "Method: <isOkay> Element not screened: " + elementIndex);
		// }
		return isBitSet(elementIndex, OKAY_BIT);
	}

	public isNotOkay(elementIndex: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isOkay(elementIndex);
	}

	public clearOkay(elementIndex: number): void
	{
		clearBit(elementIndex, OKAY_BIT);
		setBit(elementIndex, SCREENED_BIT);
	}

	public setOkay(elementIndex: number): void
	{
		setBit(elementIndex, OKAY_BIT);
		clearBit(elementIndex, REJECT_BIT);
		clearBit(elementIndex, QUESTION_BIT);
		clearBit(elementIndex, MISSING_BIT);
		setBit(elementIndex, SCREENED_BIT);
	}

	public static isOkay(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		// if (!isBitSet(bytes, SCREENED_BIT))
		// {
		// throw new DataSetTxQualityFlagException(
		// "Method: <isOkay> Element not screened: " + bytes);
		// }
		return isBitSet(bytes, OKAY_BIT);
	}

	public static isOkay_int(intQuality: number): boolean
	{
		return isBitSet_int(intQuality, SCREENED_BIT)
				&& isBitSet_int(intQuality, OKAY_BIT);
	}

	public static isNotOkay(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isOkay(bytes);
	}

	public static isNotOkay_int(intQuality: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isOkay_int(intQuality);
	}

	public static byte[] clearOkay(bytes: Uint32Array)
	{
		byte[] tmp = clearBit(bytes, OKAY_BIT);
		return setBit(tmp, SCREENED_BIT);
	}

	public static clearOkay_int(intQuality: number): number
	{
		return setBit_int(clearBit_int(intQuality, OKAY_BIT), SCREENED_BIT);
	}

	public static byte[] setOkay(bytes: Uint32Array)
	{
		byte[] tmp = setBit(bytes, OKAY_BIT);
		tmp = clearBit(tmp, MISSING_BIT);
		tmp = clearBit(tmp, QUESTION_BIT);
		tmp = clearBit(tmp, REJECT_BIT);
		return setBit(tmp, SCREENED_BIT);
	}

	public static setOkay_int(intQuality: number): number
	{
		int tmp = setBit_int(intQuality, OKAY_BIT);
		tmp = clearBit_int(tmp, MISSING_BIT);
		tmp = clearBit_int(tmp, QUESTION_BIT);
		tmp = clearBit_int(tmp, REJECT_BIT);
		return setBit_int(tmp, SCREENED_BIT);
	}

	public static clearAllBits(bytes: Uint32Array): Uint32Array
	{
		for(let i = 0; i < bytes.length; i++)
		{
			bytes[i] = NULL_VALUE;
		}
		return bytes;
	}

	public isAbsoluteMagnitude(elementIndex: number): boolean
	{
		return isBitSet(elementIndex, ABSOLUTEMAGNITUDE_BIT);
	}

	public isNotAbsoluteMagnitude(elementIndex: number): boolean
	{
		return !isAbsoluteMagnitude(elementIndex);
	}

	public clearAbsoluteMagnitude(elementIndex: number): void
	{
		clearBit(elementIndex, ABSOLUTEMAGNITUDE_BIT);
	}

	public setAbsoluteMagnitude(elementIndex: number): void
	{
		setBit(elementIndex, ABSOLUTEMAGNITUDE_BIT);
	}

	public static isAbsoluteMagnitude(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		return isBitSet(bytes, ABSOLUTEMAGNITUDE_BIT);
	}

	public static isAbsoluteMagnitude_int(intQuality: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return isBitSet_int(intQuality, ABSOLUTEMAGNITUDE_BIT);
	}

	public static isNotAbsoluteMagnitude(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isAbsoluteMagnitude(bytes);
	}

	public static isNotAbsoluteMagnitude_int(intQuality: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isAbsoluteMagnitude_int(intQuality);
	}

	public static clearAbsoluteMagnitude(bytes: Uint32Array): Uint32Array
	{
		return clearBit(bytes, ABSOLUTEMAGNITUDE_BIT);
	}

	public static clearAbsoluteMagnitude_int(intQuality: number): number
	{
		return clearBit_int(intQuality, ABSOLUTEMAGNITUDE_BIT);
	}

	public static setAbsoluteMagnitude(bytes: Uint32Array): Uint32Array
	{
		return setBit(bytes, ABSOLUTEMAGNITUDE_BIT);
	}

	public static setAbsoluteMagnitude_int(intQuality: number): number
	{
		return setBit_int(intQuality, ABSOLUTEMAGNITUDE_BIT);
	}

	public isConstantValue(elementIndex: number): boolean
	{
		return isBitSet(elementIndex, CONSTANTVALUE_BIT);
	}

	public isNotConstantValue(elementIndex: number): boolean
	{
		return !isConstantValue(elementIndex);
	}

	public clearConstantValue(elementIndex: number): void
	{
		clearBit(elementIndex, CONSTANTVALUE_BIT);
	}

	public setConstantValue(elementIndex: number): void
	{
		setBit(elementIndex, CONSTANTVALUE_BIT);
	}

	public static isConstantValue(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		return isBitSet(bytes, CONSTANTVALUE_BIT);
	}

	public static isConstantValue_int(intQuality: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return isBitSet_int(intQuality, CONSTANTVALUE_BIT);
	}

	public static isNotConstantValue(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isConstantValue(bytes);
	}

	public static isNotConstantValue_int(intQuality: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isConstantValue_int(intQuality);
	}

	public static clearConstantValue(bytes: Uint32Array): Uint32Array
	{
		return clearBit(bytes, CONSTANTVALUE_BIT);
	}

	public static clearConstantValue_int(intQuality: number): number
	{
		return clearBit_int(intQuality, CONSTANTVALUE_BIT);
	}

	public static setConstantValue(bytes: Uint32Array): Uint32Array
	{
		return setBit(bytes, CONSTANTVALUE_BIT);
	}

	public static setConstantValue_int(intQuality: number): number
	{
		return setBit_int(intQuality, CONSTANTVALUE_BIT);
	}

	public isRateOfChange(elementIndex: number): boolean
	{
		return isBitSet(elementIndex, RATEOFCHANGE_BIT);
	}

	public isNotRateOfChange(elementIndex: number): boolean
	{
		return !isRateOfChange(elementIndex);
	}

	public clearRateOfChange(elementIndex: number): void
	{
		clearBit(elementIndex, RATEOFCHANGE_BIT);
	}

	public setRateOfChange(elementIndex: number): void
	{
		setBit(elementIndex, RATEOFCHANGE_BIT);
	}

	public static isRateOfChange(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		return isBitSet(bytes, RATEOFCHANGE_BIT);
	}

	public static isRateOfChange_int(intQuality: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return isBitSet_int(intQuality, RATEOFCHANGE_BIT);
	}

	public static isNotRateOfChange(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isRateOfChange(bytes);
	}

	public static isNotRateOfChange_int(intQuality: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isRateOfChange_int(intQuality);
	}

	public static clearRateOfChange(bytes: Uint32Array): Uint32Array
	{
		return clearBit(bytes, RATEOFCHANGE_BIT);
	}

	public static clearRateOfChange_int(intQuality: number): number
	{
		return clearBit_int(intQuality, RATEOFCHANGE_BIT);
	}

	public static setRateOfChange(bytes: Uint32Array): Uint32Array
	{
		return setBit(bytes, RATEOFCHANGE_BIT);
	}

	public static setRateOfChange_int(intQuality: number): number
	{
		return setBit_int(intQuality, RATEOFCHANGE_BIT);
	}

	public isRelativeMagnitude(elementIndex: number): boolean
	{
		return isBitSet(elementIndex, RELATIVEMAGNITUDE_BIT);
	}

	public isNotRelativeMagnitude(elementIndex: number): boolean
	{
		return !isRelativeMagnitude(elementIndex);
	}

	public clearRelativeMagnitude(elementIndex: number): void
	{
		clearBit(elementIndex, RELATIVEMAGNITUDE_BIT);
	}

	public setRelativeMagnitude(elementIndex: number): void
	{
		setBit(elementIndex, RELATIVEMAGNITUDE_BIT);
	}

	public static isRelativeMagnitude(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		return isBitSet(bytes, RELATIVEMAGNITUDE_BIT);
	}

	public static isRelativeMagnitude_int(intQuality: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return isBitSet_int(intQuality, RELATIVEMAGNITUDE_BIT);
	}

	public static isNotRelativeMagnitude(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isRelativeMagnitude(bytes);
	}

	public static isNotRelativeMagnitude_int(intQuality: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isRelativeMagnitude_int(intQuality);
	}

	public static clearRelativeMagnitude(bytes: Uint32Array): Uint32Array
	{
		return clearBit(bytes, RELATIVEMAGNITUDE_BIT);
	}

	public static clearRelativeMagnitude_int(intQuality: number): number
	{
		return clearBit_int(intQuality, RELATIVEMAGNITUDE_BIT);
	}

	public static setRelativeMagnitude(bytes: Uint32Array): Uint32Array
	{
		return setBit(bytes, RELATIVEMAGNITUDE_BIT);
	}

	public static setRelativeMagnitude_int(intQuality: number): number
	{
		return setBit_int(intQuality, RELATIVEMAGNITUDE_BIT);
	}

	public isDurationMagnitude(elementIndex: number): boolean
	{
		return isBitSet(elementIndex, DURATIONMAGNITUDE_BIT);
	}

	public isNotDurationMagnitude(elementIndex: number): boolean
	{
		return !isDurationMagnitude(elementIndex);
	}

	public clearDurationMagnitude(elementIndex: number): void
	{
		clearBit(elementIndex, DURATIONMAGNITUDE_BIT);
	}

	public setDurationMagnitude(elementIndex: number): void
	{
		setBit(elementIndex, DURATIONMAGNITUDE_BIT);
	}

	public static isDurationMagnitude(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		return isBitSet(bytes, DURATIONMAGNITUDE_BIT);
	}

	public static isDurationMagnitude_int(intQuality: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return isBitSet_int(intQuality, DURATIONMAGNITUDE_BIT);
	}

	public static isNotDurationMagnitude(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isDurationMagnitude(bytes);
	}

	public static isNotDurationMagnitude_int(intQuality: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isDurationMagnitude_int(intQuality);
	}

	public static clearDurationMagnitude(bytes: Uint32Array): Uint32Array
	{
		return clearBit(bytes, DURATIONMAGNITUDE_BIT);
	}

	public static clearDurationMagnitude_int(intQuality: number): number
	{
		return clearBit_int(intQuality, DURATIONMAGNITUDE_BIT);
	}

	public static setDurationMagnitude(bytes: Uint32Array): Uint32Array
	{
		return setBit(bytes, DURATIONMAGNITUDE_BIT);
	}

	public static setDurationMagnitude_int(intQuality: number): number
	{
		return setBit_int(intQuality, DURATIONMAGNITUDE_BIT);
	}

	public isNegativeIncremental(elementIndex: number): boolean
	{
		return isBitSet(elementIndex, NEGATIVEINCREMENTAL_BIT);
	}

	public isNotNegativeIncremental(elementIndex: number): boolean
	{
		return !isNegativeIncremental(elementIndex);
	}

	public clearNegativeIncremental(elementIndex: number): void
	{
		clearBit(elementIndex, NEGATIVEINCREMENTAL_BIT);
	}

	public setNegativeIncremental(elementIndex: number): void
	{
		setBit(elementIndex, NEGATIVEINCREMENTAL_BIT);
	}

	public static isNegativeIncremental(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		return isBitSet(bytes, NEGATIVEINCREMENTAL_BIT);
	}

	public static isNegativeIncremental_int(intQuality: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return isBitSet_int(intQuality, NEGATIVEINCREMENTAL_BIT);
	}

	public static isNotNegativeIncremental(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isNegativeIncremental(bytes);
	}

	public static isNotNegativeIncremental_int(intQuality: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isNegativeIncremental_int(intQuality);
	}

	public static clearNegativeIncremental(bytes: Uint32Array): Uint32Array
	{
		return clearBit(bytes, NEGATIVEINCREMENTAL_BIT);
	}

	public static clearNegativeIncremental_int(intQuality: number): Uint32Array
	{
		return clearBit_int(intQuality, NEGATIVEINCREMENTAL_BIT);
	}

	public static setNegativeIncremental(bytes: Uint32Array): Uint32Array
	{
		return setBit(bytes, NEGATIVEINCREMENTAL_BIT);
	}

	public static setNegativeIncremental_int(intQuality: number): number
	{
		return setBit_int(intQuality, NEGATIVEINCREMENTAL_BIT);
	}

	public isUserDefinedTest(elementIndex: number): boolean
	{
		return isBitSet(elementIndex, USER_DEFINED_TEST_BIT);
	}

	public isNotUserDefinedTest(elementIndex: number): boolean
	{
		return !isUserDefinedTest(elementIndex);
	}

	public clearUserDefinedTest(elementIndex: number): void
	{
		clearBit(elementIndex, USER_DEFINED_TEST_BIT);
	}

	public setUserDefinedTest(elementIndex: number): void
	{
		setBit(elementIndex, USER_DEFINED_TEST_BIT);
	}

	public static isUserDefinedTest(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		return isBitSet(bytes, USER_DEFINED_TEST_BIT);
	}

	public static isUserDefinedTest_int(intQuality: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return isBitSet_int(intQuality, USER_DEFINED_TEST_BIT);
	}

	public static isNotUserDefinedTest(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isUserDefinedTest(bytes);
	}

	public static isNotUserDefinedTest_int(intQuality: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isUserDefinedTest_int(intQuality);
	}

	public static clearUserDefinedTest(bytes: Uint32Array): Uint32Array
	{
		return clearBit(bytes, USER_DEFINED_TEST_BIT);
	}

	public static clearUserDefinedTest_int(intQuality: number): number
	{
		return clearBit_int(intQuality, USER_DEFINED_TEST_BIT);
	}

	public static setUserDefinedTest(bytes: Uint32Array): Uint32Array
	{
		return setBit(bytes, USER_DEFINED_TEST_BIT);
	}

	public static setUserDefinedTest_int(intQuality: number): number
	{
		return setBit_int(intQuality, USER_DEFINED_TEST_BIT);
	}

	public isDistributionTest(elementIndex: number): boolean
	{
		return isBitSet(elementIndex, DISTRIBUTIONTEST_BIT);
	}

	public isNotDistributionTest(elementIndex: number): boolean
	{
		return !isDistributionTest(elementIndex);
	}

	public clearDistributionTest(elementIndex: number): void
	{
		clearBit(elementIndex, DISTRIBUTIONTEST_BIT);
	}

	public setDistributionTest(elementIndex: number): void
	{
		setBit(elementIndex, DISTRIBUTIONTEST_BIT);
	}

	public static isDistributionTest(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		return isBitSet(bytes, DISTRIBUTIONTEST_BIT);
	}

	public static isDistributionTest_int(intQuality: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return isBitSet_int(intQuality, DISTRIBUTIONTEST_BIT);
	}

	public static isNotDistributionTest(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isDistributionTest(bytes);
	}

	public static isNotDistributionTest_int(intQuality: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isDistributionTest_int(intQuality);
	}

	public static clearDistributionTest(bytes: Uint32Array): Uint32Array
	{
		return clearBit(bytes, DISTRIBUTIONTEST_BIT);
	}

	public static clearDistributionTest_int(intQuality: number): number
	{
		return clearBit_int(intQuality, DISTRIBUTIONTEST_BIT);
	}

	public static setDistributionTest(bytes: Uint32Array): Uint32Array
	{
		return setBit(bytes, DISTRIBUTIONTEST_BIT);
	}

	public static setDistributionTest_int(intQuality: number): number
	{
		return setBit_int(intQuality, DISTRIBUTIONTEST_BIT);
	}

	public isGageList(elementIndex: number): boolean
	{
		return isBitSet(elementIndex, GAGELIST_BIT);
	}

	public isNotGageList(elementIndex: number): boolean
	{
		return !isGageList(elementIndex);
	}

	public clearGageList(elementIndex: number): void
	{
		clearBit(elementIndex, GAGELIST_BIT);
	}

	public setGageList(elementIndex: number): void
	{
		setBit(elementIndex, GAGELIST_BIT);
	}

	public static isGageList(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		return isBitSet(bytes, GAGELIST_BIT);
	}

	public static isGageList_int(intQuality: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return isBitSet_int(intQuality, GAGELIST_BIT);
	}

	public static isNotGageList(bytes: Uint32Array): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isGageList(bytes);
	}

	public static isNotGageList_int(intQuality: number): boolean
	// throws DataSetTxQualityFlagException
	{
		return !isGageList_int(intQuality);
	}

	public static clearGageList(bytes: Uint32Array): Uint32Array
	{
		return clearBit(bytes, GAGELIST_BIT);
	}

	public static clearGageList_int(intQuality: number): number
	{
		return clearBit_int(intQuality, GAGELIST_BIT);
	}

	public static setGageList(bytes: Uint32Array): Uint32Array
	{
		return setBit(bytes, GAGELIST_BIT);
	}

	public static setGageList_int(intQuality: number): number
	{
		return setBit_int(intQuality, GAGELIST_BIT);
	}

	static PADDING: string[] = ["", "0", "00", "000", "0000", "00000",
			"000000", "0000000", "00000000", "000000000", "0000000000",
			"00000000000", "000000000000", "0000000000000", "00000000000000",
			"000000000000000", "0000000000000000", "00000000000000000",
			"000000000000000000", "0000000000000000000", "00000000000000000000",
			"000000000000000000000", "0000000000000000000000",
			"00000000000000000000000", "000000000000000000000000",
			"0000000000000000000000000", "00000000000000000000000000",
			"000000000000000000000000000", "0000000000000000000000000000",
			"00000000000000000000000000000", "000000000000000000000000000000",
			"0000000000000000000000000000000", "00000000000000000000000000000000"]

	public getIntQuality(): number
	{
		let iqual: number[] = new int[this._size];
		for(let i = 0; i < this._size; i++)
		{
			const byteIndex: number = i * Quality.ELEMENT_SIZE_IN_BYTES;
			const i0: number = this._elementData[byteIndex + 0] & Quality.MASK_BYTE;
			const i1: number = this._elementData[byteIndex + 1] & Quality.MASK_BYTE;
			const i2: number = this._elementData[byteIndex + 2] & Quality.MASK_BYTE;
			const i3: number = this._elementData[byteIndex + 3] & Quality.MASK_BYTE;
			iqual[ii] = i3 | (i2 << 8) | (i1 << 16) | (i0 << 24);
		}
		return iqual;
	}

	public static isEmpty(bytes: Uint32Array): boolean
	{
		const iqual: number = getInteger(bytes);
		return (iqual == 0);
	}

	/**
	 * Provides a uniform way of creating the Quality settings preferences
	 *
	 * @param rootNode
	 * @return
	 */
	private static Preferences getQualityPrefs(Preferences rootNode)
	{
		return rootNode.node(Quality.class.getSimpleName());
	}

	/**
	 * Provides a uniform way of creating the quality color preferences node.
	 * <p>
	 * Please keep this for use later, it will be used once we start updating
	 * the preferences for quality colors.
	 *
	 * @param rootNode
	 * @return
	 */
	private static Preferences getQualityColorPrefs(Preferences rootNode)
	{
		return rootNode.node(Quality.class.getSimpleName()).node("color");
	}

	/**
	 * Gets the application specific edit quality flag and returns that.  Make
	 * sure you're not using the Preferences.userRoot or Preferences.systemRoot
	 * because these are NOT application specific, this will be user or system
	 * specific preferences.
	 *
	 * @param appSpecificRootNode
	 * @return
	 */
	public static canEditQuality(Preferences appSpecificRootNode): boolean
	{
		Preferences qualNode = getQualityPrefs(appSpecificRootNode);
		return qualNode.getBoolean(QUALITY_FLAGS_EDITABLE, true);
	}

	/**
	 * Gets the application specific show quality flag and returns that.  Make
	 * sure you're not using the Preferences.userRoot or Preferences.systemRoot
	 * because these are NOT application specific, this will be user or system
	 * specific preferences.
	 *
	 * @param appSpecificRootNode
	 * @return
	 */
	public static canShowQuality(Preferences appSpecificRootNode): boolean
	{
		Preferences qualNode = getQualityPrefs(appSpecificRootNode);
		return qualNode.getBoolean(SHOW_QUALITY_FLAGS, true);
	}

	/**
	 * Sets the application specific show quality flag to the value provided.
	 *
	 * @param appSpecificRootNode
	 * @param showQuality
	 */
	public static setShowQuality(Preferences appSpecificRootNode, boolean showQuality): void
	{
		Preferences qualNode = getQualityPrefs(appSpecificRootNode);
		qualNode.putBoolean(SHOW_QUALITY_FLAGS, showQuality);
	}

	/**
	 * Sets the application specific show quality flag to the value provided.
	 *
	 * @param appSpecificRootNode
	 * @param editQuality
	 */
	public static setCanEditQuality(Preferences appSpecificRootNode, boolean editQuality): void
	{
		Preferences qualNode = getQualityPrefs(appSpecificRootNode);
		qualNode.putBoolean(QUALITY_FLAGS_EDITABLE, editQuality);
	}

	/**
	 * Adds a Preference change listener to the node that contains the quality
	 * settings.
	 *
	 * @param appSpecificRootNode
	 * @param listener
	 */
	public static addQualityPreferencesListener(Preferences appSpecificRootNode, PreferenceChangeListener listener): void
	{
		Preferences qualNode = getQualityPrefs(appSpecificRootNode);

		//Make sure we enforce a single preference change listener in the node.
		qualNode.removePreferenceChangeListener(listener);
		qualNode.addPreferenceChangeListener(listener);
	}

	/**
	 * Adds a Preference change listener to the node that contains the quality
	 * settings.
	 *
	 * @param appSpecificRootNode
	 * @param listener
	 */
	public static removeQualityPreferencesListener(Preferences appSpecificRootNode, PreferenceChangeListener listener): void
	{
		Preferences qualNode = getQualityPrefs(appSpecificRootNode);
		qualNode.removePreferenceChangeListener(listener);
	}

	/**
	 * Method for transforming underlying QualityTx into an accessible Collections object. This method will perform the entire calculation for
	 * the times array from the getTimes() method and uses the QualityTx methods to transform the symbolic String quality into integers.
	 *
	 * @return sorted map that is not thread safe of dates to quality. Values will not be null, but the collection will be empty if QualityTx is null.
	 */
	public readonly getQualitySymbols(timesArray: number[]): NavigableMap<Date, String> 
	{
		return getDateQualityMap(i -> QualityStringRenderer.getSymbolicString(getIntegerAt(i)), timesArray);
	}

	/**
	 * Method for transforming underlying QualityTx into an accessible Collections object. This method will perform the entire calculation for
	 * the times array from the getTimes() method and uses the QualityTx methods to transform the Integer quality into integers.
	 *
	 * @return sorted map that is not thread safe of dates to quality. Values will not be null, but the collection will be empty if QualityTx is null.
	 */
	public readonly NavigableMap<Date, Integer> getQualityIntegers(long[] timesArray)
	{
		return getDateQualityMap(this::getIntegerAt, timesArray);
	}

	/**
	 * Method for transforming underlying QualityTx into an accessible Collections object. This method will perform the entire calculation for
	 * the times array from the getTimes() method and uses the QualityTx methods to transform the Integer quality into integers.
	 *
	 * @return sorted map that is not thread safe of dates to quality. Values will not be null, but the collection will be empty if QualityTx is null.
	 */
	public readonly NavigableMap<ZonedDateTime, Integer> getQualityIntegers(long[] timesArray, ZoneId zonedId)
	{
		return getZonedDateTimeQualityMap(this::getIntegerAt, timesArray, zonedId);
	}

    private getZonedDateTimeQualityMap<V>(
        qualityExtractor: IntFunction<V>,
        timesArray: number[],
        zoneId: string
        ): Map<Date, V> {
        const retval = new Map<Date, V>();
        for (let i = 0; i < timesArray.length; i++) {
            const date = new Date(timesArray[i]);
            const zonedDateTime = new Date(date.toLocaleString("en-US", { timeZone: zoneId }));
            retval.set(zonedDateTime, qualityExtractor.apply(i));
        }
        return retval;
    }

	private getDateQualityMap(qualityExtractor: (index: number) => V, timesArray: number[]): Map<Date, V>
	{
        const retval: TreeMap<Date, V> = new TreeMap<Date, V>()
		for(let i = 0; i < timesArray.length; i++)
		{
			const date: Date = new Date(timesArray[i]);
			retval.set(date, qualityExtractor(i));
		}
		return retval;
	}

	private toStringElement(elementIndex: number, stringType: number): string
	{
		return getString(this.getIntegerAt(elementIndex), stringType);
	}

	public toBinaryString(): string
	{
		return this.toString(BINARY_STRING);
	}

	public toOctalString(): string
	{
		return this.toString(OCTAL_STRING);
	}

	public toSymbolicString(): string
	{
		return this.toString(SYMBOLIC_STRING);
	}

	public toSymbolicRevisedString(): string
	{
		return this.toString(SYMBOLIC_REVISED_STRING);
	}

	public toSymbolicTestsString(): string
	{
		return this.toString(SYMBOLIC_TESTS_STRING);
	}

	public toHexString(): string
	{
		return string.toString(HEX_STRING);
	}

	public toIntegerString(): string
	{
		return this.toString(INTEGER_STRING);
	}

	public toIntegerStringElementAt(elementIndex: number): string
	{
		return this.getIntegerAt(elementIndex).toString()
	}

    
	public toBinaryStringElementAt(elementIndex: number): string
	{
        
		return pad(Integer.toBinaryString(getIntegerAt(elementIndex)),
				BINARY_STRING);
	}

	public String toOctalStringElementAt(elementIndex: number)
	{
		return pad(Integer.toOctalString(getIntegerAt(elementIndex)),
				OCTAL_STRING);
	}

	public String toSymbolicStringElementAt(elementIndex: number)
	{
		return toStringElement(elementIndex, SYMBOLIC_STRING);
	}

	public String toSymbolicTestsStringElementAt(elementIndex: number)
	{
		return toStringElement(elementIndex, SYMBOLIC_TESTS_STRING);
	}

	public String toSymbolicRevisedStringElementAt(elementIndex: number)
	{
		return toStringElement(elementIndex, SYMBOLIC_REVISED_STRING);
	}

	public String toHexStringElementAt(elementIndex: number)
	{
		return pad(Integer.toHexString(getIntegerAt(elementIndex)), HEX_STRING);
	}

	private toString(stringType: number | undefined): string
	{   
        if (typeof stringType === 'undefined')  {
            return this.toString(this.HEX_STRING);
        }
        let result = "[";
		for(let i = 0; i < this._size; i++)
		{
			result += this.toStringElement(i, stringType);
			if(i < (_size - 1))
			{
				result += ", "
			}
		}
		result += "]"
		return result
	}
}