import {vec3} from '../../math';
import {Tw2CurveSequencer } from './Tw2CurveSequencer';

/**
 * Tw2XYZScalarSequencer
 *
 * @property {string} name
 * @property {vec3} value
 * @property {Tw2CurveSequencer} XCurve
 * @property {Tw2CurveSequencer} YCurve
 * @property {Tw2CurveSequencer} ZCurve
 * @class
 */
export class Tw2XYZScalarSequencer extends Tw2CurveSequencer
{
    constructor()
    {
        super();
        this.value = vec3.create();
        this.XCurve = null;
        this.YCurve = null;
        this.ZCurve = null;
    }

    /**
     * Sorts the sequencer
     */
    Sort()
    {
        Tw2CurveSequencer.Sort2(this);
    }

    /**
     * Gets sequencer length
     * @returns {number}
     */
    GetLength()
    {
        let len = 0;
        if (this.XCurve && ('GetLength' in this.XCurve)) len = this.XCurve.GetLength();
        if (this.YCurve && ('GetLength' in this.YCurve)) len = Math.max(len, this.YCurve.GetLength());
        if (this.ZCurve && ('GetLength' in this.ZCurve)) len = Math.max(len, this.ZCurve.GetLength());
        return len;
    }

    /**
     * Updates a value at a specific time
     * @param {number} time
     */
    UpdateValue(time)
    {
        this.GetValueAt(time, this.value);
    }

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @param {vec3} value
     * @returns {vec3}
     */
    GetValueAt(time, value)
    {
        value[0] = this.XCurve ? this.XCurve.GetValueAt(time) : 0;
        value[1] = this.YCurve ? this.YCurve.GetValueAt(time) : 0;
        value[2] = this.ZCurve ? this.ZCurve.GetValueAt(time) : 0;
        return value;
    }
}

/**
 * The sequencer's curve dimension
 * @type {number}
 */
Tw2XYZScalarSequencer.inputDimension = 1;

/**
 * The sequencer's dimension
 * @type {number}
 */
Tw2XYZScalarSequencer.outputDimension = 3;

/**
 * The sequencer's current value property
 * @type {string}
 */
Tw2XYZScalarSequencer.valueProperty = 'value';

/**
 * The sequencer's type
 * @type {number}
 */
Tw2XYZScalarSequencer.curveType = Tw2CurveSequencer.Type.SEQUENCER2;

/**
 * The sequencer's curve property names
 * @type {string[]}
 */
Tw2XYZScalarSequencer.childProperties = [ 'XCurve', 'YCurve', 'ZCurve' ];