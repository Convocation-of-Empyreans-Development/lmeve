import {device} from '../global/Tw2Device';
import {resMan} from '../global/Tw2ResMan';
import {logger} from '../global/Tw2Logger';
import {Tw2Resource} from './Tw2Resource';

/**
 * Tw2VideoRes
 *
 * @property {?WebGLTexture} texture   - The video's webgl texture
 * @property {?HTMLVideoElement} video - The video
 * @property {number} width            - The texture's width
 * @property {number} height           - The texture's height
 * @property {boolean} cycle           - Enables video looping
 * @property {boolean} playOnLoad      - Plays the video as soon as it is able to
 * @property {number} _currentSampler  - The current sampler's hash
 * @property {number} _currentTime     - The video's current time
 * @property {boolean} _playable       - Identifies if the video is playable
 * @property {boolean} _isPlaying      - Identifies if the video is playing
 * @property {?Function} _onPlaying    - An optional callback which is fired when the video is playing
 * @property {?Function} _onPause      - An optional callback which is fired when the video is paused
 * @property {?Function} _onEnded      - An optional callback which is fired when the video has ended
 * @class
 */
export class Tw2VideoRes extends Tw2Resource
{
    constructor()
    {
        super();
        this.texture = null;
        this.video = null;
        this.width = 0;
        this.height = 0;
        this.cycle = true;
        this.playOnLoad = true;

        this._currentSampler = 0;
        this._currentTime = -1;
        this._playable = false;
        this._isPlaying = false;

        this._onPlaying = null;
        this._onPause = null;
        this._onEnded = null;
    }

    /**
     * Checks if the resource is good
     * @returns {boolean}
     */
    IsGood()
    {
        this.KeepAlive();
        return this._isGood && this.video && this._playable;
    }

    /**
     * Keeps the resource alive
     */
    KeepAlive()
    {
        this.activeFrame = resMan.activeFrame;
    }

    /**
     * Plays the animation
     * @param {boolean} [cycle] Sets playing to loop
     * @param {Function|null} [onFinished=null] Optional callback to fire when the video has finished
     */
    Play(cycle = false, onFinished = null)
    {
        this.cycle = cycle;
        this._onEnded = onFinished;

        if (this.video && this._playable)
        {
            this.video.loop = this.cycle;
            this.video.play();
        }
        else
        {
            this.playOnLoad = true;
        }
    }

    /**
     * Pauses the video
     */
    Pause()
    {
        if (this.video)
        {
            this.video.pause();
        }
        else
        {
            this.playOnLoad = false;
        }
    }

    /**
     * Prepares the resource
     * @param {string} text
     */
    Prepare(text)
    {
        const gl = device.gl;

        switch(text)
        {
            case 'mp4':
            case 'webm':
            case 'ogg':
                this.texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, this.texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.video);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.bindTexture(gl.TEXTURE_2D, null);
                this.width = this.video.width;
                this.height = this.video.height;
                this.video.loop = this.cycle;
                if (this.playOnLoad) this.video.play();
                this.PrepareFinished(true);
        }
    }

    /**
     * Loads the resource from a path
     *
     * @param {string} path
     * @returns {boolean} returns true to tell the resMan not to handle http requests
     */
    DoCustomLoad(path)
    {
        const ext = resMan.constructor.GetPathExt(path);
        this.LoadStarted();
        resMan._pendingLoads++;

        this.video = document.createElement('video');
        this.video.crossOrigin = 'anonymous';
        this.video.muted = true;

        /**
         * Fires on errors
         */
        this.video.onerror = () =>
        {
            resMan._pendingLoads--;
            logger.log('res.error', {
                log: 'error',
                src: ['Tw2TextureRes', 'DoCustomLoad'],
                msg: 'Error loading resource',
                type: 'http.error',
                path: path
            });
            this.LoadFinished(false);
            this.PrepareFinished(false);
            this.video = null;
        };

        /**
         * Fires when the video is playable
         */
        this.video.oncanplay = () =>
        {
            this._playable = true;
            this.video.oncanplay = null;
            resMan._pendingLoads--;
            resMan._prepareQueue.push([this, ext, null]);
            this.LoadFinished(true);
        };

        /**
         * Fires when the video has ended
         */
        this.video.onended = () =>
        {
            this._isPlaying = false;
            if (this._onEnded) this._onEnded(this);
        };

        /**
         * Fires when the video is paused
         */
        this.video.onpause = () =>
        {
            this._isPlaying = false;
            if (this._onPause) this._onPause(this);
        };

        /**
         * Fires when the video is playing
         */
        this.video.onplaying = () =>
        {
            this._isPlaying = true;
            if (this._onPlaying) this._onPlaying(this);
        };

        this.video.src = path;
        return true;
    }

    /**
     * Unloads the video and texture from memory
     */
    Unload()
    {
        if (this.texture)
        {
            device.gl.deleteTexture(this.texture);
            this.texture = null;
        }

        this._isPlaying = false;
        this._playable = false;
        this.playOnLoad = true;
        this.video = null;
        return true;
    }

    /**
     * Bind
     * @param {Tw2SamplerState} sampler
     */
    Bind(sampler)
    {
        const d = device;

        this.KeepAlive();
        const targetType = sampler.samplerType;
        if (targetType !== d.gl.TEXTURE_2D) return;

        if (!this.texture)
        {
            d.gl.bindTexture(d.gl.TEXTURE_2D, d.GetFallbackTexture());
            return;
        }

        this._currentTime = this.video.currentTime;
        d.gl.bindTexture(d.gl.TEXTURE_2D, this.texture);
        d.gl.texImage2D(d.gl.TEXTURE_2D, 0, d.gl.RGBA, d.gl.RGBA, d.gl.UNSIGNED_BYTE, this.video);
        d.gl.bindTexture(d.gl.TEXTURE_2D, null);

        d.gl.bindTexture(targetType, this.texture);
        if (sampler.hash !== this._currentSampler)
        {
            sampler.Apply(false);
            this._currentSampler = sampler.hash;
        }
    }
}
