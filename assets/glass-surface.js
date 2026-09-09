/**
 * GlassSurface Component (React Bits Vanilla JS Integration)
 * High-performance SVG displacement map chromatic refraction glass effect.
 */

(function () {
    let idCounter = 0;

    function supportsSVGFilters(filterId) {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return false;
        }

        const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
        const isFirefox = /Firefox/.test(navigator.userAgent);

        if (isWebkit || isFirefox) {
            return false;
        }

        const div = document.createElement('div');
        div.style.backdropFilter = `url(#${filterId})`;

        return div.style.backdropFilter !== '';
    }

    class GlassSurface {
        constructor(container, options = {}) {
            this.container = container;
            if (!this.container) return;

            idCounter++;
            this.uniqueId = 'gs-' + idCounter + '-' + Math.random().toString(36).substr(2, 7);
            this.filterId = `glass-filter-${this.uniqueId}`;
            this.redGradId = `red-grad-${this.uniqueId}`;
            this.blueGradId = `blue-grad-${this.uniqueId}`;

            // Parse options / data-attributes
            this.borderRadius = options.borderRadius ?? parseFloat(container.dataset.borderRadius ?? 100);
            this.borderWidth = options.borderWidth ?? parseFloat(container.dataset.borderWidth ?? 0.12);
            this.brightness = options.brightness ?? parseFloat(container.dataset.brightness ?? 50);
            this.opacity = options.opacity ?? parseFloat(container.dataset.opacity ?? 0.93);
            this.blur = options.blur ?? parseFloat(container.dataset.blur ?? 12);
            this.displace = options.displace ?? parseFloat(container.dataset.displace ?? 0);
            this.backgroundOpacity = options.backgroundOpacity ?? parseFloat(container.dataset.backgroundOpacity ?? 0.08);
            this.saturation = options.saturation ?? parseFloat(container.dataset.saturation ?? 1.6);
            this.distortionScale = options.distortionScale ?? parseFloat(container.dataset.distortionScale ?? -220);
            this.redOffset = options.redOffset ?? parseFloat(container.dataset.redOffset ?? 0);
            this.greenOffset = options.greenOffset ?? parseFloat(container.dataset.greenOffset ?? 12);
            this.blueOffset = options.blueOffset ?? parseFloat(container.dataset.blueOffset ?? 24);
            this.xChannel = options.xChannel ?? container.dataset.xChannel ?? 'R';
            this.yChannel = options.yChannel ?? container.dataset.yChannel ?? 'G';
            this.mixBlendMode = options.mixBlendMode ?? container.dataset.mixBlendMode ?? 'difference';

            this.initFilter();
            this.setupSupport();
            this.setupObserver();
        }

        generateDisplacementMap() {
            const rect = this.container.getBoundingClientRect();
            const actualWidth = Math.max(Math.floor(rect.width), 300);
            const actualHeight = Math.max(Math.floor(rect.height), 40);
            const edgeSize = Math.min(actualWidth, actualHeight) * (this.borderWidth * 0.5);
            const blurStyle = this.blur > 0 ? ` style="filter:blur(${this.blur}px)"` : '';

            const svgContent = `
                <svg viewBox="0 0 ${actualWidth} ${actualHeight}" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="${this.redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
                            <stop offset="0%" stop-color="#0000"/>
                            <stop offset="100%" stop-color="red"/>
                        </linearGradient>
                        <linearGradient id="${this.blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stop-color="#0000"/>
                            <stop offset="100%" stop-color="blue"/>
                        </linearGradient>
                    </defs>
                    <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" fill="black"></rect>
                    <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${this.borderRadius}" fill="url(#${this.redGradId})" />
                    <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${this.borderRadius}" fill="url(#${this.blueGradId})" style="mix-blend-mode: ${this.mixBlendMode}" />
                    <rect x="${edgeSize}" y="${edgeSize}" width="${actualWidth - edgeSize * 2}" height="${actualHeight - edgeSize * 2}" rx="${this.borderRadius}" fill="hsl(0 0% ${this.brightness}% / ${this.opacity})"${blurStyle} />
                </svg>
            `;

            return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
        }

        initFilter() {
            let svgEl = this.container.querySelector('.glass-surface__filter');
            if (!svgEl) {
                svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svgEl.setAttribute('class', 'glass-surface__filter');
                this.container.prepend(svgEl);
            }
            this.svgEl = svgEl;

            svgEl.innerHTML = `
                <defs>
                    <filter id="${this.filterId}" color-interpolation-filters="sRGB" x="0%" y="0%" width="100%" height="100%">
                        <feImage id="fe-image-${this.uniqueId}" x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
                        <feDisplacementMap id="redchannel-${this.uniqueId}" in="SourceGraphic" in2="map" result="dispRed" />
                        <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
                        <feDisplacementMap id="greenchannel-${this.uniqueId}" in="SourceGraphic" in2="map" result="dispGreen" />
                        <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
                        <feDisplacementMap id="bluechannel-${this.uniqueId}" in="SourceGraphic" in2="map" result="dispBlue" />
                        <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
                        <feBlend in="red" in2="green" mode="screen" result="rg" />
                        <feBlend in="rg" in2="blue" mode="screen" result="output" />
                        <feGaussianBlur id="gaussian-${this.uniqueId}" in="output" stdDeviation="0" />
                    </filter>
                </defs>
            `;

            this.feImageRef = this.container.querySelector(`#fe-image-${this.uniqueId}`);
            this.redChannelRef = this.container.querySelector(`#redchannel-${this.uniqueId}`);
            this.greenChannelRef = this.container.querySelector(`#greenchannel-${this.uniqueId}`);
            this.blueChannelRef = this.container.querySelector(`#bluechannel-${this.uniqueId}`);
            this.gaussianBlurRef = this.container.querySelector(`#gaussian-${this.uniqueId}`);

            this.updateDisplacementMap();

            [
                { ref: this.redChannelRef, offset: this.redOffset },
                { ref: this.greenChannelRef, offset: this.greenOffset },
                { ref: this.blueChannelRef, offset: this.blueOffset }
            ].forEach(({ ref, offset }) => {
                if (ref) {
                    ref.setAttribute('scale', (this.distortionScale + offset).toString());
                    ref.setAttribute('xChannelSelector', this.xChannel);
                    ref.setAttribute('yChannelSelector', this.yChannel);
                }
            });

            if (this.gaussianBlurRef) {
                this.gaussianBlurRef.setAttribute('stdDeviation', this.displace.toString());
            }

            this.container.style.setProperty('--glass-frost', this.backgroundOpacity.toString());
            this.container.style.setProperty('--glass-saturation', this.saturation.toString());
            this.container.style.setProperty('--filter-id', `url(#${this.filterId})`);
        }

        updateDisplacementMap() {
            if (this.feImageRef) {
                this.feImageRef.setAttribute('href', this.generateDisplacementMap());
            }
        }

        setupSupport() {
            const isSupported = supportsSVGFilters(this.filterId);
            if (isSupported) {
                this.container.classList.add('glass-surface--svg');
                this.container.classList.remove('glass-surface--fallback');
            } else {
                this.container.classList.add('glass-surface--fallback');
                this.container.classList.remove('glass-surface--svg');
            }
        }

        setupObserver() {
            if (window.ResizeObserver) {
                this.resizeObserver = new ResizeObserver(() => {
                    this.updateDisplacementMap();
                });
                this.resizeObserver.observe(this.container);
            }
        }

        destroy() {
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
            }
            if (this.svgEl) {
                this.svgEl.remove();
            }
        }
    }

    function initAllGlassSurfaces() {
        const surfaces = document.querySelectorAll('.glass-surface');
        surfaces.forEach(el => {
            if (!el._glassSurfaceInstance) {
                el._glassSurfaceInstance = new GlassSurface(el);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllGlassSurfaces);
    } else {
        initAllGlassSurfaces();
    }

    window.GlassSurface = GlassSurface;
    window.initGlassSurfaces = initAllGlassSurfaces;
})();
