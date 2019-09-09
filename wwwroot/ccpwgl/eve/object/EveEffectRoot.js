import {vec3, quat, mat4} from '../../math/index';
import {Tw2PerObjectData, Tw2RawData} from '../../core/index';
import {EveObject} from './EveObject';

/**
 * EveEffectRoot root objects for FX, can be put into scene's objects array
 *
 * @property {string} name
 * @property {boolean} display
 * @property {[{}]} curveSets
 * @property {[{}]} effectChildren
 * @property {vec3} scaling
 * @property {quat} rotation
 * @property {vec3} translation
 * @property {mat4} localTransform
 * @property {mat4} rotationTransform
 * @property {vec3} boundingSphereCenter
 * @property {number} boundingSphereRadius
 * @property {number} duration
 * @property {Tw2PerObjectData} _perObjectData
 * @class
 */
export class EveEffectRoot extends EveObject
{
    constructor()
    {
        super();
        this.curveSets = [];
        this.effectChildren = [];
        this.duration = 0;
        this.scaling = vec3.fromValues(1, 1, 1);
        this.rotation = quat.create();
        this.translation = vec3.create();
        this.localTransform = mat4.create();
        this.rotationTransform = mat4.create();
        this.boundingSphereCenter = vec3.create();
        this.boundingSphereRadius = 0;

        this._perObjectData = new Tw2PerObjectData();
        this._perObjectData.perObjectVSData = new Tw2RawData();
        this._perObjectData.perObjectVSData.Declare('WorldMat', 16);
        this._perObjectData.perObjectVSData.Declare('WorldMatLast', 16);
        this._perObjectData.perObjectVSData.Declare('Shipdata', 4);
        this._perObjectData.perObjectVSData.Declare('Clipdata1', 4);
        this._perObjectData.perObjectVSData.Declare('EllipsoidRadii', 4);
        this._perObjectData.perObjectVSData.Declare('EllipsoidCenter', 4);
        this._perObjectData.perObjectVSData.Declare('CustomMaskMatrix0', 16);
        this._perObjectData.perObjectVSData.Declare('CustomMaskMatrix1', 16);
        this._perObjectData.perObjectVSData.Declare('CustomMaskData0', 4);
        this._perObjectData.perObjectVSData.Declare('CustomMaskData1', 4);
        this._perObjectData.perObjectVSData.Declare('JointMat', 696);
        this._perObjectData.perObjectVSData.Create();

        this._perObjectData.perObjectPSData = new Tw2RawData();
        this._perObjectData.perObjectPSData.Declare('Shipdata', 4);
        this._perObjectData.perObjectPSData.Declare('Clipdata1', 4);
        this._perObjectData.perObjectPSData.Declare('Clipdata2', 4);
        this._perObjectData.perObjectPSData.Declare('ShLighting', 4 * 7);
        this._perObjectData.perObjectPSData.Declare('CustomMaskMaterialID0', 4);
        this._perObjectData.perObjectPSData.Declare('CustomMaskMaterialID1', 4);
        this._perObjectData.perObjectPSData.Declare('CustomMaskTarget0', 4);
        this._perObjectData.perObjectPSData.Declare('CustomMaskTarget1', 4);
        this._perObjectData.perObjectPSData.Create();
    }

    /**
     * Starts playing the effectRoot's curveSets if they exist
     */
    Start()
    {
        for (let i = 0; i < this.curveSets.length; ++i)
        {
            this.curveSets[i].Play();
        }
    }

    /**
     * Stops the effectRoot's curveSets from playing
     */
    Stop()
    {
        for (let i = 0; i < this.curveSets.length; ++i)
        {
            this.curveSets[i].Stop();
        }
    }

    /**
     * Gets effect root res objects
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2EffectRes|Tw2TextureRes>} [out]
     */
    GetResources(out = [])
    {
        for (let i = 0; i < this.effectChildren.length; ++i)
        {
            this.effectChildren[i].GetResources(out);
        }
        return out;
    }

    /**
     * Internal per frame update
     * @param {number} dt - Delta Time
     */
    Update(dt)
    {
        quat.normalize(this.rotation, this.rotation); // Don't really need to normalize...
        mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);

        for (let i = 0; i < this.curveSets.length; ++i)
        {
            this.curveSets[i].Update(dt);
        }

        for (let i = 0; i < this.effectChildren.length; ++i)
        {
            this.effectChildren[i].Update(dt, this.localTransform);
        }
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    GetBatches(mode, accumulator)
    {
        if (!this.display) return;

        for (let i = 0; i < this.effectChildren.length; ++i)
        {
            this.effectChildren[i].GetBatches(mode, accumulator, this._perObjectData);
        }
    }
}
