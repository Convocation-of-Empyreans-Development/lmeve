import {vec3, vec4, util} from '../../math';
import {device, Tw2VertexDeclaration, Tw2VertexElement, Tw2RenderBatch} from '../../core';
import {EveObjectSet, EveObjectSetItem} from './EveObjectSet';

/**
 * Sprite set render batch
 *
 * @property {boolean} boosterGlow
 * @property {EveSpriteSet} spriteSet
 * @property {mat4} world
 * @property {number}
 * @property {number}
 * @class
 */
export class EveSpriteSetBatch extends Tw2RenderBatch
{
    constructor()
    {
        super();
        this.boosterGlow = false;
        this.spriteSet = null;
        this.world = null;
        this.boosterGain = 0;
        this.warpIntensity = 0;
    }

    /**
     * Commits the sprite set
     * @param {string} technique - technique name
     */
    Commit(technique)
    {
        if (this.boosterGlow)
        {
            this.spriteSet.RenderBoosterGlow(technique, this.world, this.boosterGain, this.warpIntensity);
        }
        else
        {
            this.spriteSet.Render(technique, this.world, this.perObjectData);
        }
    }
}


/**
 * EveSpriteSetItem
 *
 * @property {vec3} position
 * @property {number} blinkRate
 * @property {number} blinkPhase
 * @property {number} minScale
 * @property {number} maxScale
 * @property {number} falloff
 * @property {vec4} color
 * @property {vec4} warpColor
 * @property {number} boneIndex
 * @property {number} groupIndex
 * @class
 */
export class EveSpriteSetItem extends EveObjectSetItem
{
    constructor()
    {
        super();
        this.position = vec3.create();
        this.blinkRate = 0;
        this.blinkPhase = 0;
        this.minScale = 1;
        this.maxScale = 1;
        this.falloff = 0;
        this.color = vec4.create();
        this.warpColor = vec4.create();
        this.boneIndex = 0;
        this.groupIndex = -1;
    }

    /**
     * Creates a sprite set item from an object
     * @param {*} [opt={}]
     * @returns {EveSpriteSetItem}
     */
    static create(opt = {})
    {
        const item = new this();
        util.assignIfExists(item, opt, [
            'name', 'display', 'blinkRate', 'blinkPhase', 'minScale', 'maxScale',
            'falloff', 'boneIndex', 'groupIndex', 'position', 'color', 'warpColor'
        ]);
        return item;
    }
}


/**
 * EveSpriteSet
 *
 * @param {boolean} [useQuads] - Use quad rendering (CPU transform)
 * @param {boolean} [isSkinned] - Use bone transforms (when useQuads is true)
 * @property {Tw2Effect} effect
 * @property {?boolean} useQuads - Use quad rendering (CPU transform)
 * @property {?boolean} isSkinned - Use bone transforms (when useQuads is true)
 * @property {number} _time
 * @property {WebGLBuffer} _vertexBuffer
 * @property {WebGLBuffer} _indexBuffer
 * @property {Tw2VertexDeclaration} _decl
 */
export class EveSpriteSet extends EveObjectSet
{
    constructor(useQuads = false, isSkinned = false)
    {
        super();
        this.effect = null;
        this.useQuads = null;
        this.isSkinned = null;
        this._time = 0;
        this._vertexBuffer = null;
        this._indexBuffer = null;
        this._instanceBuffer = null;
        this._decl = this._decl = new Tw2VertexDeclaration();
        this._vdecl = new Tw2VertexDeclaration();
        this._vdecl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.TEXCOORD, 5, device.gl.FLOAT, 1, 0));
        this._vdecl.RebuildHash();

        this.UseQuads(useQuads, isSkinned);
    }

    /**
     * Alias for this.items
     * @returns {Array}
     */
    get sprites()
    {
        return this.items;
    }

    /**
     * Alias for this.items
     * @param {Array} arr
     */
    set sprites(arr)
    {
        this.items = arr;
    }

    /**
     * Use instanced rendering or 'quad' rendering
     * @param {boolean} useQuads      - Use quad rendering (CPU transform)
     * @param {boolean} isSkinned     - Use bone transforms (when useQuads is true)
     */
    UseQuads(useQuads, isSkinned)
    {
        if (this.useQuads === useQuads) return;

        this.useQuads = useQuads;
        this.isSkinned = isSkinned;

        this._decl.elements.splice(0, this._decl.elements.length);
        if (!useQuads)
        {
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.TEXCOORD, 5, device.gl.FLOAT, 2, 0));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.POSITION, 0, device.gl.FLOAT, 3, 8));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.COLOR, 0, device.gl.FLOAT, 3, 20));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.TEXCOORD, 0, device.gl.FLOAT, 1, 32));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.TEXCOORD, 1, device.gl.FLOAT, 1, 36));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.TEXCOORD, 2, device.gl.FLOAT, 1, 40));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.TEXCOORD, 3, device.gl.FLOAT, 1, 44));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.TEXCOORD, 4, device.gl.FLOAT, 1, 48));
        }
        else
        {
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.POSITION, 0, device.gl.FLOAT, 3, 0));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.TEXCOORD, 0, device.gl.FLOAT, 4, 12));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.TEXCOORD, 1, device.gl.FLOAT, 2, 28));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.COLOR, 0, device.gl.FLOAT, 4, 36));
            this._decl.elements.push(new Tw2VertexElement(Tw2VertexDeclaration.Type.COLOR, 1, device.gl.FLOAT, 4, 52));
        }

        this._decl.RebuildHash();
        this._rebuildPending = true;
    }

    /**
     * Gets Sprite Set Resource Objects
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.effect)
        {
            this.effect.GetResources(out);
        }
        return out;
    }

    /**
     * Per frame update
     * @param {number} dt - Delta time
     */
    Update(dt)
    {
        this._time += dt;

        if (this._rebuildPending)
        {
            this.Rebuild();
        }
    }

    /**
     * Unloads the sprite set's buffers
     */
    Unload()
    {
        if (this._vertexBuffer)
        {
            device.gl.deleteBuffer(this._vertexBuffer);
            this._vertexBuffer = null;
        }

        // Standard
        if (this._indexBuffer)
        {
            device.gl.deleteBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }

        // Quad
        if (this._instanceBuffer)
        {
            device.gl.deleteBuffer(this._instanceBuffer);
            this._instanceBuffer = null;
        }
    }

    /**
     * Rebuilds the sprite set's buffers
     */
    Rebuild()
    {
        this.constructor.RebuildItems(this);
        this._rebuildPending = false;
        const itemCount = this._visibleItems.length;
        if (!itemCount) return;

        const d = device;

        if (this.useQuads)
        {
            this._vertexBuffer = d.gl.createBuffer();
            d.gl.bindBuffer(d.gl.ARRAY_BUFFER, this._vertexBuffer);
            d.gl.bufferData(d.gl.ARRAY_BUFFER, new Float32Array([0, 1, 2, 2, 3, 0]), d.gl.STATIC_DRAW);
            d.gl.bindBuffer(d.gl.ARRAY_BUFFER, null);
            this._instanceBuffer = d.gl.createBuffer();
            return;
        }

        const
            vertexSize = 13,
            array = new Float32Array(itemCount * 4 * vertexSize);

        for (let i = 0; i < itemCount; ++i)
        {
            const
                item = this._visibleItems[i],
                offset = i * 4 * vertexSize;

            array[offset] = 0;
            array[offset + vertexSize] = 1;
            array[offset + 2 * vertexSize] = 2;
            array[offset + 3 * vertexSize] = 3;

            for (let j = 0; j < 4; ++j)
            {
                const vtxOffset = offset + j * vertexSize;
                array[vtxOffset + 1] = item.boneIndex;
                array[vtxOffset + 2] = item.position[0];
                array[vtxOffset + 3] = item.position[1];
                array[vtxOffset + 4] = item.position[2];
                array[vtxOffset + 5] = item.color[0];
                array[vtxOffset + 6] = item.color[1];
                array[vtxOffset + 7] = item.color[2];
                array[vtxOffset + 8] = item.blinkPhase;
                array[vtxOffset + 9] = item.blinkRate;
                array[vtxOffset + 10] = item.minScale;
                array[vtxOffset + 11] = item.maxScale;
                array[vtxOffset + 12] = item.falloff;
            }
        }

        this._vertexBuffer = d.gl.createBuffer();
        d.gl.bindBuffer(d.gl.ARRAY_BUFFER, this._vertexBuffer);
        d.gl.bufferData(d.gl.ARRAY_BUFFER, array, d.gl.STATIC_DRAW);
        d.gl.bindBuffer(d.gl.ARRAY_BUFFER, null);

        const indexes = new Uint16Array(itemCount * 6);
        for (let i = 0; i < itemCount; ++i)
        {
            const
                offset = i * 6,
                vtxOffset = i * 4;

            indexes[offset] = vtxOffset;
            indexes[offset + 1] = vtxOffset + 2;
            indexes[offset + 2] = vtxOffset + 1;
            indexes[offset + 3] = vtxOffset;
            indexes[offset + 4] = vtxOffset + 3;
            indexes[offset + 5] = vtxOffset + 2;
        }

        this._indexBuffer = d.gl.createBuffer();
        d.gl.bindBuffer(d.gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        d.gl.bufferData(d.gl.ELEMENT_ARRAY_BUFFER, indexes, d.gl.STATIC_DRAW);
        d.gl.bindBuffer(d.gl.ELEMENT_ARRAY_BUFFER, null);
        this._indexBuffer.count = itemCount * 6;
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {mat4} world
     */
    GetBatches(mode, accumulator, perObjectData, world)
    {
        if (this.display && mode === device.RM_ADDITIVE && this._vertexBuffer && this._visibleItems.length)
        {
            const batch = new EveSpriteSetBatch();
            batch.world = world;
            batch.renderMode = device.RM_ADDITIVE;
            batch.spriteSet = this;
            batch.perObjectData = perObjectData;
            accumulator.Commit(batch);
        }
    }

    /**
     * Gets render batches for booster glows
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {mat4} world
     * @param {Number} boosterGain
     * @param {Number} warpIntensity
     */
    GetBoosterGlowBatches(mode, accumulator, perObjectData, world, boosterGain, warpIntensity)
    {
        if (this.display && mode === device.RM_ADDITIVE && this._vertexBuffer && this._visibleItems.length)
        {
            const batch = new EveSpriteSetBatch();
            batch.boosterGlow = true;
            batch.world = world;
            batch.boosterGain = boosterGain;
            batch.warpIntensity = warpIntensity;
            batch.renderMode = device.RM_ADDITIVE;
            batch.spriteSet = this;
            batch.perObjectData = perObjectData;
            accumulator.Commit(batch);
        }
    }

    /**
     * Renders the sprite set
     * @param {string} technique - technique name
     * @param {mat4} world
     * @param {Tw2PerObjectData} perObjectData
     * @returns {boolean}
     */
    Render(technique, world, perObjectData)
    {
        if (this.useQuads)
        {
            return this.RenderQuads(technique, world, perObjectData);
        }

        if (!this.effect || !this.effect.IsGood() || !this._indexBuffer) return false;

        device.SetStandardStates(device.RM_ADDITIVE);
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._vertexBuffer);
        device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

        for (let pass = 0; pass < this.effect.GetPassCount(technique); ++pass)
        {
            this.effect.ApplyPass(technique, pass);
            if (!this._decl.SetDeclaration(this.effect.GetPassInput(technique, pass), 52)) return false;
            device.ApplyShadowState();
            device.gl.drawElements(device.gl.TRIANGLES, this._indexBuffer.count, device.gl.UNSIGNED_SHORT, 0);
        }
        return true;
    }

    /**
     * Renders the sprite set as booster glow
     * @param {string} technique - technique name
     * @param {mat4} world
     * @param {Number} boosterGain
     * @param {Number} warpIntensity
     * @returns {boolean}
     */
    RenderBoosterGlow(technique, world, boosterGain, warpIntensity)
    {
        if (!this.effect || !this.effect.IsGood() || !this._instanceBuffer) return false;

        const
            d = device,
            pos = EveObjectSet.global.vec3_0,
            itemCount = this._visibleItems.length,
            array = new Float32Array(17 * itemCount);

        d.SetStandardStates(d.RM_ADDITIVE);

        let index = 0;
        for (let i = 0; i < itemCount; ++i)
        {
            const item = this._visibleItems[i];
            vec3.transformMat4(pos, item.position, world);
            array[index++] = pos[0];
            array[index++] = pos[1];
            array[index++] = pos[2];
            array[index++] = world[8];
            array[index++] = item.blinkPhase;
            array[index++] = world[9];
            array[index++] = item.minScale;
            array[index++] = item.maxScale;
            array[index++] = world[10];
            array[index++] = item.color[0];
            array[index++] = item.color[1];
            array[index++] = item.color[2];
            array[index++] = boosterGain;
            array[index++] = item.warpColor[0];
            array[index++] = item.warpColor[1];
            array[index++] = item.warpColor[2];
            array[index++] = warpIntensity;
        }

        d.gl.bindBuffer(d.gl.ARRAY_BUFFER, this._instanceBuffer);
        d.gl.bufferData(d.gl.ARRAY_BUFFER, array, d.gl.DYNAMIC_DRAW);

        for (let pass = 0; pass < this.effect.GetPassCount(technique); ++pass)
        {
            this.effect.ApplyPass(technique, pass);
            const passInput = this.effect.GetPassInput(technique, pass);
            d.gl.bindBuffer(d.gl.ARRAY_BUFFER, this._vertexBuffer);
            this._vdecl.SetPartialDeclaration(passInput, 4);
            d.gl.bindBuffer(d.gl.ARRAY_BUFFER, this._instanceBuffer);
            const resetData = this._decl.SetPartialDeclaration(passInput, 17 * 4, 0, 1);
            d.ApplyShadowState();
            d.ext.drawArraysInstanced(d.gl.TRIANGLES, 0, 6, itemCount);
            this._decl.ResetInstanceDivisors(resetData);
        }

        return true;
    }

    /**
     * Renders the sprite set with pre-transformed quads
     * @param {string} technique - technique name
     * @param {mat4} world
     * @param {Tw2PerObjectData} perObjectData
     * @returns {boolean}
     */
    RenderQuads(technique, world, perObjectData)
    {
        if (!this.effect || !this.effect.IsGood() || !this._instanceBuffer) return false;

        const
            d = device,
            itemCount = this._visibleItems.length,
            array = new Float32Array(17 * itemCount),
            pos = EveObjectSet.global.vec3_0,
            bones = perObjectData.perObjectVSData.Get('JointMat');

        d.SetStandardStates(d.RM_ADDITIVE);

        let index = 0;
        for (let i = 0; i < itemCount; ++i)
        {
            const item = this._visibleItems[i];
            if (this.isSkinned)
            {
                const offset = item.boneIndex * 12;
                pos[0] = bones[offset] * item.position[0] + bones[offset + 1] * item.position[1] + bones[offset + 2] * item.position[2] + bones[offset + 3];
                pos[1] = bones[offset + 4] * item.position[0] + bones[offset + 5] * item.position[1] + bones[offset + 6] * item.position[2] + bones[offset + 7];
                pos[2] = bones[offset + 8] * item.position[0] + bones[offset + 9] * item.position[1] + bones[offset + 10] * item.position[2] + bones[offset + 11];
                vec3.transformMat4(pos, pos, world);
            }
            else
            {
                vec3.transformMat4(pos, item.position, world);
            }

            array[index++] = pos[0];
            array[index++] = pos[1];
            array[index++] = pos[2];
            array[index++] = 1;
            array[index++] = item.blinkPhase;
            array[index++] = item.blinkRate;
            array[index++] = item.minScale;
            array[index++] = item.maxScale;
            array[index++] = item.falloff;
            array[index++] = item.color[0];
            array[index++] = item.color[1];
            array[index++] = item.color[2];
            array[index++] = 1;
            array[index++] = item.warpColor[0];
            array[index++] = item.warpColor[1];
            array[index++] = item.warpColor[2];
            array[index++] = 1;
        }

        d.gl.bindBuffer(d.gl.ARRAY_BUFFER, this._instanceBuffer);
        d.gl.bufferData(d.gl.ARRAY_BUFFER, array, d.gl.DYNAMIC_DRAW);

        for (let pass = 0; pass < this.effect.GetPassCount(technique); ++pass)
        {
            this.effect.ApplyPass(technique, pass);
            const passInput = this.effect.GetPassInput(technique, pass);
            d.gl.bindBuffer(d.gl.ARRAY_BUFFER, this._vertexBuffer);
            this._vdecl.SetPartialDeclaration(passInput, 4);
            d.gl.bindBuffer(d.gl.ARRAY_BUFFER, this._instanceBuffer);
            const resetData = this._decl.SetPartialDeclaration(passInput, 17 * 4, 0, 1);
            d.ApplyShadowState();
            d.ext.drawArraysInstanced(d.gl.TRIANGLES, 0, 6, itemCount);
            this._decl.ResetInstanceDivisors(resetData);
        }

        return true;
    }
}

/**
 * The sprite set's item constructor
 * @type {EveSpriteSetItem}
 */
EveSpriteSet.Item = EveSpriteSetItem;

