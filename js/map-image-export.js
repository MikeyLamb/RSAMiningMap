/**
 * Map image export for Leaflet (PNG / JPEG). Requires global htmlToImage (html-to-image).
 */
(function (global) {
    'use strict';

    var JPEG_QUALITY = 0.92;
    var OSM_FOOTER_PX = 32;

    function injectStyles() {
        if (document.getElementById('map-image-export-styles')) return;
        var css =
            '.map-image-export-control.leaflet-bar{display:flex;flex-direction:column;align-items:stretch;box-shadow:0 4px 14px rgba(15,23,42,.1),0 0 0 1px rgba(15,23,42,.07);background:linear-gradient(180deg,#fff 0%,#f8fafc 100%);border-radius:12px;overflow:visible;}' +
            '.map-image-export-toolbar{display:flex;flex-direction:row;align-items:center;justify-content:space-between;gap:6px;flex-shrink:0;padding:2px 4px 2px 2px;min-width:0;}' +
            '.map-image-export-toolbar .map-image-export-btn{flex:1;min-width:0;justify-content:flex-start;text-align:left;}' +
            '.map-image-export-toolbar .map-image-export-close{display:none;}' +
            '.map-image-export-toolbar--expanded .map-image-export-close{display:flex;}' +
            '.map-image-export-close--toolbar{margin:0;width:38px;height:38px;}' +
            '.map-image-export-btn{display:flex;align-items:center;gap:10px;padding:11px 16px;border:0;background:transparent;cursor:pointer;font:600 13px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;border-radius:12px;white-space:nowrap;transition:background .18s ease,box-shadow .18s ease;}' +
            '.map-image-export-btn:hover{background:rgba(15,92,92,.09);box-shadow:inset 0 0 0 1px rgba(15,92,92,.18);}' +
            '.map-image-export-btn:focus-visible{outline:2px solid #0f5c5c;outline-offset:2px;}' +
            '.map-image-export-btn:focus:not(:focus-visible){outline:none;}' +
            '.map-image-export-btn .fas{color:#115e59;font-size:15px;}' +
            '.map-image-export-panel.map-image-export-dialog{min-width:300px;max-width:min(400px,96vw);max-height:min(70vh,calc(100vh - 120px));padding:0;box-sizing:border-box;overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;touch-action:pan-y;font:14px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#334155;background:linear-gradient(165deg,#fff 0%,#f8fafc 45%,#f1f5f9 100%) !important;box-shadow:0 18px 50px rgba(15,23,42,.16),0 0 0 1px rgba(15,23,42,.07),inset 0 1px 0 rgba(255,255,255,.9);border-radius:14px;margin-top:10px;border:1px solid rgba(226,232,240,.9);position:relative;z-index:10002;align-self:flex-start;scrollbar-width:thin;scrollbar-color:#cbd5e1 #f1f5f9;}' +
            '.map-image-export-panel.map-image-export-dialog::-webkit-scrollbar{width:8px;}' +
            '.map-image-export-panel.map-image-export-dialog::-webkit-scrollbar-track{background:#f1f5f9;border-radius:0 14px 14px 0;margin:6px 0;}' +
            '.map-image-export-panel.map-image-export-dialog::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:999px;border:2px solid #f1f5f9;}' +
            '.map-image-export-panel.map-image-export-dialog::-webkit-scrollbar-thumb:hover{background:#94a3b8;}' +
            '.map-image-export-panel-inner{padding:18px 20px 20px;touch-action:pan-y;}' +
            '.map-image-export-panel-header{margin:0 0 4px;padding-bottom:14px;border-bottom:1px solid rgba(226,232,240,.95);}' +
            '.map-image-export-panel-header h3{margin:0;font-size:17px;font-weight:600;line-height:1.25;letter-spacing:-.025em;color:#0f172a;}' +
            '.map-image-export-close{flex-shrink:0;width:38px;height:38px;border:0;background:rgba(241,245,249,.9);cursor:pointer;padding:0;margin:-4px -6px 0 0;line-height:1;color:#475569;border-radius:10px;font-size:15px;display:flex;align-items:center;justify-content:center;transition:background .15s ease,color .15s ease,transform .12s ease;box-shadow:0 1px 2px rgba(15,23,42,.06);}' +
            '.map-image-export-close:hover{background:#e2e8f0;color:#0f172a;}' +
            '.map-image-export-close:active{transform:scale(.96);}' +
            '.map-image-export-close:focus-visible{outline:2px solid #0f5c5c;outline-offset:2px;}' +
            '.map-image-export-close:focus:not(:focus-visible){outline:none;}' +
            '.map-image-export-intro{margin:14px 0 18px;color:#64748b;font-size:13px;line-height:1.6;}' +
            '.map-image-export-section{border:1px solid #e2e8f0;border-radius:12px;background:rgba(255,255,255,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding:14px 16px;margin:0 0 14px;min-width:0;box-shadow:0 1px 3px rgba(15,23,42,.04);}' +
            '.map-image-export-section legend{padding:0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:12px;}' +
            '.map-image-export-section label{display:flex;align-items:flex-start;gap:11px;margin:0 0 8px;padding:10px 12px;border-radius:10px;cursor:pointer;border:1px solid transparent;transition:background .15s ease,border-color .15s ease,box-shadow .15s ease;font-size:13px;color:#334155;line-height:1.45;}' +
            '.map-image-export-section label:last-of-type{margin-bottom:0;}' +
            '.map-image-export-section label:hover{background:rgba(248,250,252,.95);border-color:#cbd5e1;}' +
            '.map-image-export-section label:has(input:checked){background:linear-gradient(135deg,rgba(204,251,241,.75) 0%,rgba(236,253,245,.95) 100%);border-color:#5eead4;box-shadow:0 0 0 1px rgba(15,92,92,.14);}' +
            '.map-image-export-section input[type=radio]{margin:4px 0 0;flex-shrink:0;width:16px;height:16px;accent-color:#0f7669;}' +
            '.map-image-export-section .hint{margin:12px 0 2px;font-size:11px;line-height:1.5;color:#94a3b8;padding-left:2px;}' +
            '.map-image-export-block{background:linear-gradient(145deg,#fffbeb 0%,#fef9c3 50%,#fde68a22 100%);border:1px solid #fcd34d;border-left:4px solid #d97706;border-radius:12px;padding:16px 16px 16px 18px;margin:0 0 18px;font-size:13px;color:#78350f;line-height:1.55;box-shadow:0 2px 8px rgba(217,119,6,.08);}' +
            '.map-image-export-block-lead{font-weight:600;margin:0 0 12px;color:#92400e;font-size:14px;line-height:1.35;}' +
            '.map-image-export-block p{margin:12px 0 0;padding:0;}' +
            '.map-image-export-block ul{margin:14px 0 0;padding:0 0 0 1.2em;}' +
            '.map-image-export-block li{margin:8px 0;}' +
            '.map-image-export-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:6px;padding-top:18px;border-top:1px solid rgba(226,232,240,.95);}' +
            '.map-image-export-actions button{font:inherit;font-weight:600;font-size:13px;padding:11px 18px;border-radius:10px;cursor:pointer;transition:background .16s ease,box-shadow .16s ease,border-color .16s ease,transform .1s ease;}' +
            '.map-image-export-actions button:active:not(:disabled){transform:translateY(1px);}' +
            '.map-image-export-actions button:focus-visible{outline:2px solid #0f5c5c;outline-offset:2px;}' +
            '.map-image-export-actions button:focus:not(:focus-visible){outline:none;}' +
            '.map-image-export-actions button.primary{flex:1;min-width:132px;border:1px solid #0a4547;background:linear-gradient(180deg,#168080 0%,#0f5c5c 100%);color:#f8fafc;box-shadow:0 2px 8px rgba(15,92,92,.32),inset 0 1px 0 rgba(255,255,255,.18);}' +
            '.map-image-export-actions button.primary:hover:not(:disabled){background:linear-gradient(180deg,#147a7a 0%,#0c4e50 100%);box-shadow:0 4px 16px rgba(15,92,92,.38),inset 0 1px 0 rgba(255,255,255,.2);}' +
            '.map-image-export-actions button.primary:disabled{opacity:.52;cursor:not-allowed;box-shadow:none;background:#94a3b8;border-color:#94a3b8;}' +
            '.map-image-export-actions button.secondary{flex:1;min-width:112px;border:1px solid #cbd5e1;background:rgba(255,255,255,.85);color:#334155;box-shadow:0 1px 2px rgba(15,23,42,.05);}' +
            '.map-image-export-actions button.secondary:hover:not(:disabled){background:#fff;border-color:#94a3b8;box-shadow:0 2px 6px rgba(15,23,42,.08);}' +
            '.map-image-export-actions button.secondary:disabled{opacity:.48;cursor:not-allowed;}' +
            '.map-image-export-status{font-size:12px;line-height:1.5;color:#475569;margin:16px 0 0;min-height:0;padding:0;border-radius:10px;}' +
            '.map-image-export-status:not(:empty){min-height:1.4em;padding:10px 12px;background:rgba(241,245,249,.85);border:1px solid #e2e8f0;color:#334155;}' +
            '.map-image-export-file-preview{position:fixed;inset:0;z-index:200000;background:rgba(15,23,42,.75);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;overflow:auto;-webkit-overflow-scrolling:touch;}' +
            '.map-image-export-file-preview-sheet{max-width:min(1200px,96vw);width:100%;max-height:min(92vh,920px);background:#fff;border-radius:14px;box-shadow:0 24px 64px rgba(0,0,0,.4);display:flex;flex-direction:column;min-height:0;margin:auto;}' +
            '.map-image-export-file-preview-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:16px 16px 12px;border-bottom:1px solid #e2e8f0;flex-shrink:0;}' +
            '.map-image-export-file-preview-head h3{margin:0;font:600 16px/1.35 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;}' +
            '.map-image-export-file-preview-close{flex-shrink:0;width:38px;height:38px;border:0;background:rgba(241,245,249,.95);border-radius:10px;cursor:pointer;font:600 18px/1 system-ui,sans-serif;color:#475569;}' +
            '.map-image-export-file-preview-close:hover{background:#e2e8f0;color:#0f172a;}' +
            '.map-image-export-file-preview-hint{margin:14px 16px 0;font:13px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#475569;flex-shrink:0;}' +
            '.map-image-export-file-preview-name{margin:8px 16px 0;font:12px/1.45 system-ui,sans-serif;color:#64748b;word-break:break-all;flex-shrink:0;}' +
            '.map-image-export-file-preview-imgwrap{flex:1;min-height:120px;overflow:auto;padding:14px 16px 18px;text-align:center;background:#f1f5f9;border-radius:0 0 14px 14px;}' +
            '.map-image-export-file-preview-imgwrap img{max-width:100%;height:auto;vertical-align:middle;border-radius:8px;box-shadow:0 4px 24px rgba(0,0,0,.15);}' +
            '.map-image-export-capture .leaflet-control-zoom,' +
            '.map-image-export-capture .leaflet-control-locate,' +
            '.map-image-export-capture .leaflet-control-measure,' +
            '.map-image-export-capture .map-image-export-control,' +
            '.map-image-export-capture #abstract{display:none !important;}' +
            '.map-image-export-capture .leaflet-control-layers-toggle{display:none !important;}' +
            '.map-image-export-capture .leaflet-layerstree-expand-collapse{display:none !important;}' +
            '.map-image-export-capture .leaflet-layerstree-header-pointer{display:none !important;}' +
            '.map-image-export-capture .leaflet-layerstree-header input[type=checkbox],' +
            '.map-image-export-capture .leaflet-layerstree-header input[type=radio]{position:absolute;opacity:0;width:0;height:0;margin:0;pointer-events:none;}' +
            '@media (prefers-reduced-motion:reduce){.map-image-export-actions button:active:not(:disabled){transform:none;}}';

        var style = document.createElement('style');
        style.id = 'map-image-export-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    function pad(n) {
        return n < 10 ? '0' + n : String(n);
    }

    function datedFilename(ext) {
        var d = new Date();
        return (
            'RSAMiningMap_' +
            d.getFullYear() +
            '-' +
            pad(d.getMonth() + 1) +
            '-' +
            pad(d.getDate()) +
            '.' +
            ext
        );
    }

    function isGoogleBasemapActive(map, googleLayers) {
        for (var i = 0; i < googleLayers.length; i++) {
            if (map.hasLayer(googleLayers[i])) return true;
        }
        return false;
    }

    /**
     * For export: hide chrome widgets, expand legend, hide unchecked layer rows.
     * Returns a function that restores the previous DOM state.
     */
    function beginMapExportLayout(mapEl) {
        var undo = [];

        mapEl.classList.add('map-image-export-capture');
        undo.push(function () {
            mapEl.classList.remove('map-image-export-capture');
        });

        var layersEl = mapEl.querySelector('.leaflet-control-layers');
        var forcedExpand = false;
        if (layersEl && !layersEl.classList.contains('leaflet-control-layers-expanded')) {
            layersEl.classList.add('leaflet-control-layers-expanded');
            forcedExpand = true;
        }
        if (forcedExpand && layersEl) {
            undo.push(function () {
                layersEl.classList.remove('leaflet-control-layers-expanded');
            });
        }

        var hidden = [];
        mapEl.querySelectorAll('.leaflet-layerstree-header').forEach(function (header) {
            var inp = header.querySelector('input[type="checkbox"], input[type="radio"]');
            if (!inp || inp.disabled) return;
            if (inp.checked) return;
            var node = header.closest('.leaflet-layerstree-node');
            var el = node || header;
            hidden.push({ el: el, display: el.style.display });
            el.style.display = 'none';
        });
        undo.push(function () {
            hidden.forEach(function (h) {
                h.el.style.display = h.display;
            });
        });

        return function endMapExportLayout() {
            for (var i = undo.length - 1; i >= 0; i--) {
                undo[i]();
            }
        };
    }

    function redrawTileLayersAndWait(map, timeoutMs) {
        timeoutMs = timeoutMs || 8000;
        var tileLayers = [];
        map.eachLayer(function (layer) {
            if (layer instanceof L.TileLayer && map.hasLayer(layer)) {
                tileLayers.push(layer);
            }
        });

        return new Promise(function (resolve) {
            var settled = false;
            function finish() {
                if (settled) return;
                settled = true;
                resolve();
            }

            var t = setTimeout(finish, timeoutMs);

            if (tileLayers.length === 0) {
                clearTimeout(t);
                setTimeout(finish, 200);
                return;
            }

            var remaining = tileLayers.length;
            function one() {
                remaining--;
                if (remaining <= 0) {
                    clearTimeout(t);
                    setTimeout(finish, 400);
                }
            }

            tileLayers.forEach(function (layer) {
                layer.once('load', one);
            });

            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    tileLayers.forEach(function (layer) {
                        if (typeof layer.redraw === 'function') {
                            layer.redraw();
                        }
                    });
                });
            });
        });
    }

    function blobToImage(blob) {
        return new Promise(function (resolve, reject) {
            var url = URL.createObjectURL(blob);
            var img = new Image();
            img.onload = function () {
                URL.revokeObjectURL(url);
                resolve(img);
            };
            img.onerror = function (e) {
                URL.revokeObjectURL(url);
                reject(e);
            };
            img.src = url;
        });
    }

    function addOsmFooterBlob(blob, mime, quality) {
        return blobToImage(blob).then(function (img) {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            var footer = OSM_FOOTER_PX;
            canvas.width = img.width;
            canvas.height = img.height + footer;
            ctx.fillStyle = '#e8eaed';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            ctx.fillStyle = '#333';
            var fontSize = Math.max(12, Math.round(canvas.width / 85));
            ctx.font = fontSize + 'px system-ui,-apple-system,sans-serif';
            ctx.fillText('© OpenStreetMap contributors', 10, img.height + footer - 10);

            return new Promise(function (resolve, reject) {
                function onBlob(out) {
                    if (out) resolve(out);
                    else reject(new Error('Could not encode image'));
                }
                if (mime === 'image/jpeg') {
                    canvas.toBlob(onBlob, mime, quality != null ? quality : JPEG_QUALITY);
                } else {
                    canvas.toBlob(onBlob, mime);
                }
            });
        });
    }

    function openFileSchemeImagePreview(objectUrl, filename) {
        var old = document.querySelector('.map-image-export-file-preview');
        if (old && old.parentNode) {
            var oldImg = old.querySelector('img');
            if (oldImg && oldImg.src && oldImg.src.indexOf('blob:') === 0) {
                URL.revokeObjectURL(oldImg.src);
            }
            old.parentNode.removeChild(old);
        }

        var backdrop = document.createElement('div');
        backdrop.className = 'map-image-export-file-preview';
        backdrop.setAttribute('role', 'dialog');
        backdrop.setAttribute('aria-modal', 'true');
        backdrop.setAttribute('aria-label', 'Save exported map image');

        var sheet = document.createElement('div');
        sheet.className = 'map-image-export-file-preview-sheet';

        var head = document.createElement('div');
        head.className = 'map-image-export-file-preview-head';

        var h = document.createElement('h3');
        h.textContent = 'Save this image';

        var closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'map-image-export-file-preview-close';
        closeBtn.setAttribute('aria-label', 'Close');
        closeBtn.textContent = '\u00d7';

        var hint = document.createElement('p');
        hint.className = 'map-image-export-file-preview-hint';
        hint.textContent =
            'Chrome and other browsers block automatic downloads when the page is opened as a local file (file://). Right-click the image below and choose Save image as…';

        var nameLine = document.createElement('p');
        nameLine.className = 'map-image-export-file-preview-name';
        nameLine.textContent = 'Suggested file name: ' + filename;

        var wrap = document.createElement('div');
        wrap.className = 'map-image-export-file-preview-imgwrap';
        var img = document.createElement('img');
        img.src = objectUrl;
        img.alt = 'Exported map';
        wrap.appendChild(img);

        function teardown() {
            img.removeAttribute('src');
            if (backdrop.parentNode) {
                backdrop.parentNode.removeChild(backdrop);
            }
            URL.revokeObjectURL(objectUrl);
        }

        closeBtn.addEventListener('click', teardown);
        backdrop.addEventListener('click', function (e) {
            if (e.target === backdrop) {
                teardown();
            }
        });

        head.appendChild(h);
        head.appendChild(closeBtn);
        sheet.appendChild(head);
        sheet.appendChild(hint);
        sheet.appendChild(nameLine);
        sheet.appendChild(wrap);
        backdrop.appendChild(sheet);
        document.body.appendChild(backdrop);
        closeBtn.focus();
    }

    function downloadBlob(blob, filename) {
        var url = URL.createObjectURL(blob);
        var revokeLater = function () {
            setTimeout(function () {
                URL.revokeObjectURL(url);
            }, 120000);
        };

        if (global.location.protocol === 'file:') {
            openFileSchemeImagePreview(url, filename);
            return;
        }

        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.rel = 'noopener';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        revokeLater();
    }

    var MapImageExport = {
        init: function (options) {
            injectStyles();
            this.map = options.map;
            this.mapEl = options.mapEl || document.getElementById('map');
            this.googleLayers = options.googleLayers || [];
            this.osmLayer = options.osmLayer;
            this._addControl();
        },

        _addControl: function () {
            var self = this;
            var Control = L.Control.extend({
                options: { position: 'topleft' },

                onAdd: function () {
                    var root = L.DomUtil.create('div', 'leaflet-bar map-image-export-control');
                    var toolbar = L.DomUtil.create('div', 'map-image-export-toolbar', root);
                    var btn = L.DomUtil.create('button', 'map-image-export-btn', toolbar);
                    btn.type = 'button';
                    btn.setAttribute('aria-expanded', 'false');
                    btn.setAttribute('aria-haspopup', 'true');
                    btn.setAttribute('aria-label', 'Download map image');
                    btn.title = 'Download map image';
                    btn.innerHTML =
                        '<span class="fas fa-download" aria-hidden="true"></span><span>Download map image</span>';

                    var closeToolbar = L.DomUtil.create(
                        'button',
                        'map-image-export-close map-image-export-close--toolbar',
                        toolbar
                    );
                    closeToolbar.type = 'button';
                    closeToolbar.setAttribute('aria-label', 'Close export panel');
                    closeToolbar.title = 'Close';
                    closeToolbar.innerHTML =
                        '<span class="fas fa-times" aria-hidden="true"></span>';

                    var panel = L.DomUtil.create(
                        'div',
                        'map-image-export-panel map-image-export-dialog',
                        root
                    );
                    panel.style.display = 'none';
                    panel.setAttribute('role', 'dialog');
                    panel.setAttribute('aria-label', 'Export map image');

                    function closePanel() {
                        panel.style.display = 'none';
                        toolbar.classList.remove('map-image-export-toolbar--expanded');
                        btn.setAttribute('aria-expanded', 'false');
                    }

                    function buildPanel() {
                        panel.innerHTML = '';
                        var inner = document.createElement('div');
                        inner.className = 'map-image-export-panel-inner';
                        panel.appendChild(inner);
                        var googleOn = isGoogleBasemapActive(self.map, self.googleLayers);

                        var header = document.createElement('div');
                        header.className = 'map-image-export-panel-header';
                        var title = document.createElement('h3');
                        title.textContent = 'Save map as image';
                        header.appendChild(title);
                        inner.appendChild(header);

                        var intro = document.createElement('p');
                        intro.className = 'map-image-export-intro';
                        intro.textContent =
                            'Saves the current map view with the legend (only layers you have switched on), and the attribution references along the bottom. Other controls are hidden in the image.';
                        inner.appendChild(intro);

                        if (googleOn) {
                            var block = document.createElement('div');
                            block.className = 'map-image-export-block';
                            block.innerHTML =
                                '<p class="map-image-export-block-lead">This basemap cannot be included in a download.</p>' +
                                '<p><strong>Legal:</strong> Map imagery from major providers is usually covered by terms that limit storing, reproducing, or redistributing tiles outside the interactive map, unless you use a product explicitly licensed for static export.</p>' +
                                '<p><strong>Technical:</strong> Tiles are not set up for reliable programmatic capture; your browser may block reading pixels (cross-origin rules), so we do not offer an export that includes this basemap.</p>' +
                                '<ul><li>Turn off all Google basemap layers in Map Layers.</li>' +
                                '<li>Turn on <strong>OpenStreetMap</strong> or leave the basemap off (blank background).</li>' +
                                '<li>Try again.</li></ul>';
                            inner.appendChild(block);
                        }

                        var fmtFs = document.createElement('fieldset');
                        fmtFs.className = 'map-image-export-section';
                        var fmtLeg = document.createElement('legend');
                        fmtLeg.textContent = 'File format';
                        fmtFs.appendChild(fmtLeg);
                        var fmtPng = document.createElement('label');
                        fmtPng.innerHTML =
                            '<input type="radio" name="map-export-fmt" value="png" checked> PNG — sharpest lines (larger file)';
                        var fmtJpg = document.createElement('label');
                        fmtJpg.innerHTML =
                            '<input type="radio" name="map-export-fmt" value="jpeg"> JPEG (.jpg) — smaller file';
                        fmtFs.appendChild(fmtPng);
                        fmtFs.appendChild(fmtJpg);
                        var fmtHint = document.createElement('div');
                        fmtHint.className = 'hint';
                        fmtHint.textContent =
                            'JPEG can show slight compression on sharp polygon edges; PNG is lossless.';
                        fmtFs.appendChild(fmtHint);
                        inner.appendChild(fmtFs);

                        var qFs = document.createElement('fieldset');
                        qFs.className = 'map-image-export-section';
                        var qLeg = document.createElement('legend');
                        qLeg.textContent = 'Resolution';
                        qFs.appendChild(qLeg);
                        var qStd = document.createElement('label');
                        qStd.innerHTML =
                            '<input type="radio" name="map-export-q" value="1" checked> Standard (same as screen density)';
                        var qHi = document.createElement('label');
                        qHi.innerHTML =
                            '<input type="radio" name="map-export-q" value="2"> High (larger file, sharper)';
                        var qMax = document.createElement('label');
                        var prMax = global.innerWidth < 650 ? '2' : '3';
                        qMax.innerHTML =
                            '<input type="radio" name="map-export-q" value="' +
                            prMax +
                            '"> Maximum (very large on big screens)';
                        qFs.appendChild(qStd);
                        qFs.appendChild(qHi);
                        qFs.appendChild(qMax);
                        var qHint = document.createElement('div');
                        qHint.className = 'hint';
                        qHint.textContent =
                            'Higher resolution uses more memory; on phones we cap “Maximum” to 2×.';
                        qFs.appendChild(qHint);
                        inner.appendChild(qFs);

                        var status = document.createElement('div');
                        status.className = 'map-image-export-status';
                        status.setAttribute('aria-live', 'polite');
                        inner.appendChild(status);

                        var actions = document.createElement('div');
                        actions.className = 'map-image-export-actions';
                        var prepareBtn = document.createElement('button');
                        prepareBtn.type = 'button';
                        prepareBtn.className = 'primary';
                        prepareBtn.textContent = 'Prepare download';
                        prepareBtn.disabled = !!googleOn;
                        var saveBtn = document.createElement('button');
                        saveBtn.type = 'button';
                        saveBtn.className = 'secondary';
                        saveBtn.textContent = 'Save image';
                        saveBtn.style.display = 'none';
                        saveBtn.disabled = true;
                        actions.appendChild(prepareBtn);
                        actions.appendChild(saveBtn);
                        inner.appendChild(actions);

                        var lastBlob = null;
                        var lastExt = 'png';
                        var isPreparing = false;

                        function syncActionButtons() {
                            var googleBlock = isGoogleBasemapActive(
                                self.map,
                                self.googleLayers
                            );
                            if (googleBlock) {
                                prepareBtn.style.display = '';
                                prepareBtn.disabled = true;
                                saveBtn.style.display = 'none';
                                saveBtn.disabled = true;
                                return;
                            }
                            if (isPreparing) {
                                prepareBtn.style.display = '';
                                prepareBtn.disabled = true;
                                saveBtn.style.display = 'none';
                                saveBtn.disabled = true;
                                return;
                            }
                            if (lastBlob) {
                                prepareBtn.style.display = 'none';
                                prepareBtn.disabled = true;
                                saveBtn.style.display = '';
                                saveBtn.disabled = false;
                                return;
                            }
                            prepareBtn.style.display = '';
                            prepareBtn.disabled = false;
                            saveBtn.style.display = 'none';
                            saveBtn.disabled = true;
                        }

                        function onExportConfigChange() {
                            if (!lastBlob) {
                                return;
                            }
                            lastBlob = null;
                            status.textContent =
                                'Options changed. Prepare download again to update the image.';
                            syncActionButtons();
                        }

                        inner
                            .querySelectorAll('input[name="map-export-fmt"], input[name="map-export-q"]')
                            .forEach(function (input) {
                                input.addEventListener('change', onExportConfigChange);
                            });

                        function getPixelRatio() {
                            var r = inner.querySelector('input[name="map-export-q"]:checked');
                            return r ? Math.min(3, Math.max(1, parseFloat(r.value) || 1)) : 1;
                        }

                        function getFormat() {
                            var r = inner.querySelector('input[name="map-export-fmt"]:checked');
                            return r && r.value === 'jpeg' ? 'jpeg' : 'png';
                        }

                        prepareBtn.addEventListener('click', function () {
                            if (isGoogleBasemapActive(self.map, self.googleLayers)) {
                                status.textContent = 'Turn off Google basemap layers first.';
                                return;
                            }
                            if (!window.htmlToImage || !window.htmlToImage.toBlob) {
                                status.textContent = 'Image export library failed to load. Please refresh the page.';
                                return;
                            }

                            var exportFormat = getFormat();
                            var exportMime =
                                exportFormat === 'jpeg' ? 'image/jpeg' : 'image/png';

                            isPreparing = true;
                            lastBlob = null;
                            syncActionButtons();
                            status.textContent = 'Loading tiles…';

                            self.map.closePopup();
                            var endMapExportLayout = beginMapExportLayout(self.mapEl);

                            redrawTileLayersAndWait(self.map, 9000)
                                .then(function () {
                                    status.textContent = 'Creating image…';
                                    var pixelRatio = getPixelRatio();
                                    var opts = {
                                        pixelRatio: pixelRatio,
                                        cacheBust: true,
                                        backgroundColor: '#e8eaed',
                                        skipFonts: true,
                                        type: exportMime,
                                        quality: exportFormat === 'jpeg' ? JPEG_QUALITY : 1
                                    };
                                    return window.htmlToImage.toBlob(self.mapEl, opts);
                                })
                                .then(function (blob) {
                                    var osmFooter =
                                        self.osmLayer && self.map.hasLayer(self.osmLayer);
                                    if (osmFooter) {
                                        status.textContent = 'Adding map attribution…';
                                        return addOsmFooterBlob(
                                            blob,
                                            exportMime,
                                            exportFormat === 'jpeg' ? JPEG_QUALITY : undefined
                                        );
                                    }
                                    return blob;
                                })
                                .then(function (blob) {
                                    lastBlob = blob;
                                    lastExt = exportFormat === 'jpeg' ? 'jpg' : 'png';
                                    status.textContent = 'Ready. Use Save image to download.';
                                })
                                .catch(function (err) {
                                    console.error(err);
                                    status.textContent =
                                        'Export failed. Try a smaller resolution, refresh, or toggle layers.';
                                })
                                .finally(function () {
                                    isPreparing = false;
                                    endMapExportLayout();
                                    syncActionButtons();
                                });
                        });

                        saveBtn.addEventListener('click', function () {
                            if (!lastBlob) return;
                            downloadBlob(lastBlob, datedFilename(lastExt));
                            status.textContent =
                                global.location.protocol === 'file:'
                                    ? 'Preview opened — right-click the image and choose Save image as…'
                                    : 'Download started.';
                        });

                        syncActionButtons();
                    }

                    buildPanel();

                    L.DomEvent.disableClickPropagation(root);
                    L.DomEvent.disableScrollPropagation(panel);
                    L.DomEvent.on(btn, 'click', L.DomEvent.stopPropagation);
                    L.DomEvent.on(btn, 'mousedown', L.DomEvent.stopPropagation);
                    L.DomEvent.on(closeToolbar, 'click', L.DomEvent.stopPropagation);
                    L.DomEvent.on(closeToolbar, 'mousedown', L.DomEvent.stopPropagation);
                    closeToolbar.addEventListener('click', function (e) {
                        L.DomEvent.stop(e);
                        closePanel();
                    });
                    L.DomEvent.on(panel, 'click', L.DomEvent.stopPropagation);
                    L.DomEvent.on(panel, 'mousedown', L.DomEvent.stopPropagation);

                    btn.addEventListener('click', function (e) {
                        L.DomEvent.stop(e);
                        var wasOpen = panel.style.display !== 'none';
                        if (wasOpen) {
                            closePanel();
                            return;
                        }
                        btn.setAttribute('aria-expanded', 'true');
                        toolbar.classList.add('map-image-export-toolbar--expanded');
                        panel.style.display = 'block';
                        buildPanel();
                    });

                    self.map.on('click', function (ev) {
                        if (!ev || !ev.originalEvent) return;
                        var t = ev.originalEvent.target;
                        if (root.contains(t)) return;
                        closePanel();
                    });

                    return root;
                }
            });

            var exportControl = new Control();
            exportControl.addTo(this.map);
            var exportEl = exportControl.getContainer();
            var topLeft = exportEl && exportEl.parentElement;
            if (topLeft && topLeft.firstChild !== exportEl) {
                topLeft.insertBefore(exportEl, topLeft.firstChild);
            }
        }
    };

    global.MapImageExport = MapImageExport;
})(typeof window !== 'undefined' ? window : this);
