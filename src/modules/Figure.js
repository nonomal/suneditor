import EditorInjector from '../injector';
import { Controller, SelectMenu } from '../modules';
import { domUtils, numbers } from '../helper';

const Figure = function (inst, controls, params) {
	EditorInjector.call(this, inst.editor);

	// modules
	const controllerEl = CreateHTML_controller(inst.editor, controls || []);
	const alignMenus = CreateAlign(this);
	this.alignButton = controllerEl.querySelector('[data-command="onalign"]');
	this.controller = new Controller(this, controllerEl, { position: 'bottom', disabled: true }, inst.constructor.key);
	this.selectMenu_align = new SelectMenu(this, false, 'bottom-center');
	this.selectMenu_align.on(this.alignButton, SetMenuAlign.bind(this), { class: 'se-resizing-align-list' });
	this.selectMenu_align.create(alignMenus.items, alignMenus.html);

	// members
	this.kind = inst.constructor.key;
	this.inst = inst;
	this.sizeUnit = params.sizeUnit || 'px';
	this.autoRatio = params.autoRatio;
	this.isVertical = false;
	this.percentageButtons = controllerEl.querySelectorAll('[data-command="resize_percent"]');
	this.captionButton = controllerEl.querySelector('[data-command="caption"]');
	this._element = null;
	this._cover = null;
	this._container = null;
	this._caption = null;
	this.align = 'none';
	this._width = 0;
	this._height = 0;
	this._element_w = 0;
	this._element_h = 0;
	this._element_l = 0;
	this._element_t = 0;
	this._resize_w = 0;
	this._resize_h = 0;
	this._resizeClientX = 0;
	this._resizeClientY = 0;
	this._resize_direction = '';
	this._floatClassRegExp = '__se__float\\-[a-z]+';
	this._alignIcons = {
		none: this.icons.align_justify,
		left: this.icons.align_left,
		right: this.icons.align_right,
		center: this.icons.align_center
	};
	this.__offset = {};
	this.__offContainer = OffFigureContainer.bind(this);
	this.__containerResizing = ContainerResizing.bind(this);
	this.__containerResizingOff = ContainerResizingOff.bind(this);
	this.__containerResizingESC = ContainerResizingESC.bind(this);
	this.__onContainerEvent = null;
	this.__offContainerEvent = null;
	this.__onResizeESCEvent = null;
	this.__fileManagerInfo = false;

	// init
	this.eventManager.addEvent(this.alignButton, 'click', OnClick_alignButton.bind(this));
	this.editor.rootTargets.forEach(
		function (e) {
			if (!e.get('editorArea').querySelector('.se-controller.se-resizing-container')) {
				const main = CreateHTML_resizeDot();
				const handles = main.querySelectorAll('.se-resize-dot > span');
				e.set('_figure', {
					main: main,
					border: main.querySelector('.se-resize-dot'),
					display: main.querySelector('.se-resize-display'),
					handles: handles
				});
				e.get('editorArea').appendChild(main);
				this.eventManager.addEvent(handles, 'mousedown', OnResizeContainer.bind(this));
			}
		}.bind(this)
	);
};

Figure.__figureControllerInst = null;

/**
 * @description Create a container for the resizing component and insert the element.
 * @param {Element} element Target element
 * @param {string} className Class name of container (fixed: se-component)
 * @returns {object} {container, cover, caption}
 */
Figure.CreateContainer = function (element, className) {
	domUtils.createElement('DIV', { class: 'se-component' + (className ? ' ' + className : ''), contenteditable: false }, domUtils.createElement('FIGURE', null, element));
	return Figure.GetContainer(element);
};

/**
 * @description Return HTML string of caption(FIGCAPTION) element
 * @param {Element} cover Cover element(FIGURE). "CreateContainer().cover"
 * @returns {Element} caption element
 */
Figure.CreateCaption = function (cover, text) {
	const caption = domUtils.createElement('FIGCAPTION', { contenteditable: true }, '<div>' + text + '</div>');
	cover.appendChild(caption);
	return caption;
};

/**
 * @description Get the element's container(.se-component) info.
 * @param {Element} element Target element
 * @returns {object} {container, cover, caption}
 */
Figure.GetContainer = function (element) {
	return {
		target: element,
		container: domUtils.getParentElement(element, Figure.__isComponent),
		cover: domUtils.getParentElement(element, 'FIGURE'),
		caption: domUtils.getEdgeChild(element.parentElement, 'FIGCAPTION')
	};
};

/**
 * @description Ratio calculation
 * @param {string|number} w Width size
 * @param {string|number} h Height size
 * @param {defaultSizeUnit|undefined|null} defaultSizeUnit Default size unit (default: "px")
 * @return {{w: number, h: number}}
 */
Figure.GetRatio = function (w, h, defaultSizeUnit) {
	let rw = 1,
		rh = 1;
	if (/\d+/.test(w) && /\d+/.test(h)) {
		const xUnit = (!numbers.is(w) && w.replace(/\d+|\./g, '')) || defaultSizeUnit || 'px';
		const yUnit = (!numbers.is(h) && h.replace(/\d+|\./g, '')) || defaultSizeUnit || 'px';
		if (xUnit === yUnit) {
			const w_number = numbers.get(w, 4);
			const h_number = numbers.get(h, 4);
			rw = w_number / h_number;
			rh = h_number / w_number;
		}
	}

	return {
		w: numbers.get(rw, 4),
		h: numbers.get(rh, 4)
	};
};

/**
 * @description Ratio calculation
 * @param {string|number} w Width size
 * @param {string|number} h Height size
 * @param {defaultSizeUnit|undefined|null} defaultSizeUnit Default size unit (default: "px")
 * @param {{w: number, h: number}} ratio Ratio size (Figure.GetRatio)
 * @return {{w: string|number, h: string|number}}
 */
Figure.CalcRatio = function (w, h, defaultSizeUnit, ratio) {
	if (/\d+/.test(w) && /\d+/.test(h)) {
		const xUnit = (!numbers.is(w) && w.replace(/\d+|\./g, '')) || defaultSizeUnit || 'px';
		const yUnit = (!numbers.is(h) && h.replace(/\d+|\./g, '')) || defaultSizeUnit || 'px';
		if (xUnit === yUnit) {
			const dec = xUnit === '%' ? 2 : 0;
			const ow = w;
			const oh = h;
			h = numbers.get(ratio.h * numbers.get(ow, dec), dec) + yUnit;
			w = numbers.get(ratio.w * numbers.get(oh, dec), dec) + xUnit;
		}
	}

	return {
		w: w,
		h: h
	};
};

/**
 * @description It is judged whether it is the component[img, iframe, video, audio, table] cover(class="se-component") and table, hr
 * @param {Node} element Target element
 * @returns {boolean}
 * @private
 */
Figure.__isComponent = function (element) {
	return element && (/se-component/.test(element.className) || /^(TABLE|HR)$/.test(element.nodeName));
};

Figure.prototype = {
	/**
	 * @override controller
	 */
	reset: function () {
		this.editor._antiBlur = false;
		domUtils.removeClass(this._cover, 'se-figure-selected');
	},

	open: function (target, nonResizing, __fileManagerInfo) {
		this.editor._offCurrentController();
		const figureInfo = Figure.GetContainer(target);
		if (!figureInfo.container) return { container: null, cover: null };

		Figure.__figureControllerInst = this;
		const figure = (this._cover = figureInfo.cover);
		this._container = figureInfo.container;
		this._caption = figureInfo.caption;
		this._element = target;
		this.align = (this._container.className.match(/(?:^|\s)__se__float-(none|left|center|right)(?:$|\s)/) || [])[1] || target.style.float || 'none';
		this.isVertical = /^(90|270)$/.test(Math.abs(GetRotateValue(target).r).toString());

		const eventWysiwyg = this.editor.frameContext.get('eventWysiwyg');
		const offset = this.offset.get(target);
		const frameOffset = this.offset.get(this.editor.frameContext.get('wysiwygFrame'));
		const w = figure.offsetWidth - 1;
		const h = figure.offsetHeight - 1;
		const t = offset.top - (this.options.get('iframe') ? frameOffset.top : 0);
		const l = offset.left - (this.options.get('iframe') ? frameOffset.left + (eventWysiwyg.scrollX || eventWysiwyg.scrollLeft || 0) : 0) - this.editor.frameContext.get('wysiwygFrame').scrollLeft;
		const originSize = (target.getAttribute('data-origin') || '').split(',');
		const dataSize = (target.getAttribute('data-size') || '').split(',');
		const ratio = Figure.GetRatio(dataSize[0] || numbers.get(target.style.width, 2) || w, dataSize[1] || numbers.get(target.style.height, 2) || h, this.sizeUnit);
		const targetInfo = {
			container: figureInfo.container,
			cover: figureInfo.cover,
			caption: figureInfo.caption,
			align: this.align,
			ratio: ratio,
			w: w,
			h: h,
			t: t,
			l: l,
			width: dataSize[0] || 'auto',
			height: dataSize[1] || 'auto',
			originWidth: originSize[0] || target.naturalWidth || target.offsetWidth,
			originHeight: originSize[1] || target.naturalHeight || target.offsetHeight
		};

		this._width = targetInfo.width;
		this._height = targetInfo.height;
		if (__fileManagerInfo || this.__fileManagerInfo) return targetInfo;

		const _figure = this.editor.frameContext.get('_figure');
		this.editor._figureContainer = _figure.main;
		_figure.main.style.top = t + 'px';
		_figure.main.style.left = l + 'px';
		_figure.main.style.width = w + 'px';
		_figure.main.style.height = h + 'px';
		_figure.border.style.top = '0px';
		_figure.border.style.left = '0px';
		_figure.border.style.width = w + 'px';
		_figure.border.style.height = h + 'px';

		this.__offset = { left: l + (eventWysiwyg.scrollX || eventWysiwyg.scrollLeft || 0), top: t + (eventWysiwyg.scrollY || eventWysiwyg.scrollTop || 0) };
		this.editor.opendControllers.push({
			position: 'none',
			form: _figure.main,
			target: target,
			inst: this,
			notInCarrier: true
		});

		const size = this.getSize(target);
		domUtils.changeTxt(_figure.display, this.lang[this.align === 'none' ? 'basic' : this.align] + ' (' + (size.w || 'auto') + ', ' + (size.h || 'auto') + ')');
		this._displayResizeHandles(!nonResizing);

		// percentage active
		const value = /%$/.test(target.style.width) && /%$/.test(figureInfo.container.style.width) ? numbers.get(figureInfo.container.style.width, 0) / 100 + '' : '';
		for (let i = 0, len = this.percentageButtons.length; i < len; i++) {
			if (this.percentageButtons[i].getAttribute('data-value') === value) {
				domUtils.addClass(this.percentageButtons[i], 'active');
			} else {
				domUtils.removeClass(this.percentageButtons[i], 'active');
			}
		}

		// caption active
		if (this.captionButton) {
			if (figureInfo.caption) {
				domUtils.addClass(this.captionButton, 'active');
			} else {
				domUtils.removeClass(this.captionButton, 'active');
			}
		}

		_figure.main.style.display = 'block';
		this.controller.open(_figure.main, null, this.__offContainer);

		// set members
		this._w.setTimeout(domUtils.addClass.bind(null, this._cover, 'se-figure-selected'));
		this._element_w = this._resize_w = w;
		this._element_h = this._resize_h = h;
		this._element_l = l;
		this._element_t = t;

		// align button
		this._setAlignIcon();

		return targetInfo;
	},

	setSize: function (w, h) {
		if (/%$/.test(w)) {
			this._setPercentSize(w, h);
		} else if ((!w || w === 'auto') && (!h || h === 'auto')) {
			if (this.autoRatio) this._setPercentSize(100, this.autoRatio.default || this.autoRatio.current);
			else this._setAutoSize();
		} else {
			this._applySize(w, h, false, '');
		}
	},

	/**
	 * @description Gets the Figure size
	 * @param {Element|null} target
	 * @returns {{w: string, h: string}}
	 */
	getSize: function (target) {
		if (!target) target = this._element;
		if (!target) return { w: '', h: '' };

		const figure = Figure.GetContainer(target);
		if (!figure.container || !figure.cover)
			return {
				w: '',
				h: target.style.height
			};
		return {
			w: !/%$/.test(target.style.width) ? target.style.width : ((figure.container && numbers.get(figure.container.style.width, 2)) || 100) + '%',
			h: numbers.get(figure.cover.style.paddingBottom, 0) > 0 && !this.isVertical ? figure.cover.style.height : !/%$/.test(target.style.height) || !/%$/.test(target.style.width) ? target.style.height : ((figure.container && numbers.get(figure.container.style.height, 2)) || 100) + '%'
		};
	},

	/**
	 * @description Align the container.
	 * @param {Element|null} target Target element
	 * @param {"none"|"left"|"center"|"right"} align
	 */
	setAlign: function (target, align) {
		if (!target) target = this._element;

		const figure = Figure.GetContainer(target);
		const cover = figure.cover;
		const container = figure.container;

		if (align && align !== 'none') {
			cover.style.margin = 'auto';
		} else {
			cover.style.margin = '0';
		}

		if (/%$/.test(target.style.width) && align === 'center') {
			container.style.minWidth = '100%';
			cover.style.width = container.style.width;
		} else {
			container.style.minWidth = '';
			cover.style.width = this.isVertical ? target.style.height || target.offsetHeight : !target.style.width || target.style.width === 'auto' ? '' : target.style.width || '100%';
		}

		if (!domUtils.hasClass(container, '__se__float-' + align)) {
			domUtils.removeClass(container, this._floatClassRegExp);
			domUtils.addClass(container, '__se__float-' + align);
		}

		this._setAlignIcon();
	},

	/**
	 * @override controller
	 * @param {Element} target Target button element
	 * @returns
	 */
	controllerAction: function (target) {
		const command = target.getAttribute('data-command');
		const value = target.getAttribute('data-value');
		const element = this._element;
		if (command === 'onalign') return;

		switch (command) {
			case 'auto':
				this.deleteTransform();
				this._setAutoSize();
				break;
			case 'resize_percent':
				let percentY = this.getSize(element);
				if (this.isVertical) {
					const percentage = element.getAttribute('data-percentage');
					if (percentage) percentY = percentage.split(',')[1];
				}

				this.deleteTransform();
				this._setPercentSize(value * 100, numbers.get(percentY, 0) === null || !/%$/.test(percentY) ? '' : percentY);
				break;
			case 'mirror':
				const info = GetRotateValue(element);
				let x = info.x;
				let y = info.y;

				if ((value === 'h' && !this.isVertical) || (value === 'v' && this.isVertical)) {
					y = y ? '' : '180';
				} else {
					x = x ? '' : '180';
				}

				this._setRotate(element, info.r, x, y);
				break;
			case 'rotate':
				this.setTransform(element, null, null, value);
				break;
			case 'caption':
				if (!this._caption) {
					const caption = Figure.CreateCaption(this._cover, this.lang.caption);
					const captionText = domUtils.getEdgeChild(caption, function (current) {
						return current.nodeType === 3;
					});

					if (!captionText) {
						caption.focus();
					} else {
						this.selection.setRange(captionText, 0, captionText, captionText.textContent.length);
					}

					this.controller.close();
				} else {
					domUtils.removeItem(this._caption);
					this._w.setTimeout(this.component.select.bind(this.component, element, this.kind));
				}

				this._caption = !this._caption;
				if (/\d+/.test(element.style.height) || (this.isVertical && this._caption)) {
					if (/%$/.test(element.style.width) || /auto/.test(element.style.height)) {
						this.deleteTransform();
					} else {
						this.setTransform(element, element.style.width, element.style.height, 0);
					}
				}
				break;
			case 'revert':
				this._setOriginSize();
				break;
			case 'edit':
				this.inst.open();
				break;
			case 'remove':
				this.inst.destroy();
				this.controller.close();
				break;
		}

		if (/^edit$/.test(command)) return;

		this.history.push(false);
		if (!/^remove|caption$/.test(command)) {
			this.component.select(element, this.kind);
		}
	},

	/**
	 * @description Initialize the transform style (rotation) of the element.
	 * @param {Element|null} element Target element
	 */
	deleteTransform: function (element) {
		if (!element) element = this._element;

		const size = (element.getAttribute('data-size') || element.getAttribute('data-origin') || '').split(',');
		this.isVertical = false;

		element.style.maxWidth = '';
		element.style.transform = '';
		element.style.transformOrigin = '';

		this._deleteCaptionPosition(element);
		this._applySize(numbers.get(size[0]) || 'auto', numbers.get(size[1]) || '', true, '');
	},

	/**
	 * @description Set the transform style (rotation) of the element.
	 * @param {Element} element Target element
	 * @param {Number|null} width Element's width size
	 * @param {Number|null} height Element's height size
	 */
	setTransform: function (element, width, height, deg) {
		const info = GetRotateValue(element);
		const slope = info.r + (deg || 0) * 1;
		deg = this._w.Math.abs(slope) >= 360 ? 0 : slope;
		const isVertical = (this.isVertical = /^(90|270)$/.test(this._w.Math.abs(deg).toString()));

		width = numbers.get(width, 0);
		height = numbers.get(height, 0);
		let percentage = element.getAttribute('data-percentage');
		let transOrigin = '';

		if (percentage && !isVertical) {
			percentage = percentage.split(',');
			if (percentage[0] === 'auto' && percentage[1] === 'auto') {
				this._setAutoSize();
			} else {
				this._setPercentSize(percentage[0], percentage[1]);
			}
		} else {
			const figureInfo = Figure.GetContainer(element);
			const offsetW = width || element.offsetWidth;
			const offsetH = height || element.offsetHeight;
			const w = (isVertical ? offsetH : offsetW) + 'px';
			const h = (isVertical ? offsetW : offsetH) + 'px';

			this._deletePercentSize();
			this._applySize(offsetW + 'px', offsetH + 'px', true, '');

			figureInfo.cover.style.width = w;
			figureInfo.cover.style.height = figureInfo.caption ? '' : h;

			if (isVertical) {
				let transW = offsetW / 2 + 'px ' + offsetW / 2 + 'px 0';
				let transH = offsetH / 2 + 'px ' + offsetH / 2 + 'px 0';
				transOrigin = deg === 90 || deg === -270 ? transH : transW;
			}
		}

		element.style.transformOrigin = transOrigin;
		this._setRotate(element, deg, info.x, info.y);

		if (isVertical) element.style.maxWidth = 'none';
		else element.style.maxWidth = '';

		this._setCaptionPosition(element);
	},

	_setRotate: function (element, r, x, y) {
		let width = (element.offsetWidth - element.offsetHeight) * (/^-/.test(r) ? 1 : -1);
		let translate = '';

		if (/[1-9]/.test(r) && (x || y)) {
			translate = x ? 'Y' : 'X';

			switch (r + '') {
				case '90':
					translate = x && y ? 'X' : y ? translate : '';
					break;
				case '270':
					width *= -1;
					translate = x && y ? 'Y' : x ? translate : '';
					break;
				case '-90':
					translate = x && y ? 'Y' : x ? translate : '';
					break;
				case '-270':
					width *= -1;
					translate = x && y ? 'X' : y ? translate : '';
					break;
				default:
					translate = '';
			}
		}

		if (r % 180 === 0) {
			element.style.maxWidth = '';
		}

		element.style.transform = 'rotate(' + r + 'deg)' + (x ? ' rotateX(' + x + 'deg)' : '') + (y ? ' rotateY(' + y + 'deg)' : '') + (translate ? ' translate' + translate + '(' + width + 'px)' : '');
	},

	_applySize: function (w, h, notResetPercentage, direction) {
		const onlyW = /^(rw|lw)$/.test(direction) && /\d+/.test(this._element.style.height);
		const onlyH = /^(th|bh)$/.test(direction) && /\d+/.test(this._element.style.width);
		h = h || (this.autoRatio ? this.autoRatio.current || this.autoRatio.default : h);
		w = numbers.is(w) ? w + this.sizeUnit : w;

		if (!/%$/.test(w) && !/%$/.test(h) && !onlyW && !onlyH) this._deletePercentSize();

		if (this.autoRatio) this._cover.style.width = w;
		if (!onlyH) {
			this._element.style.width = w;
		}
		if (!onlyW) {
			h = numbers.is(h) ? h + this.sizeUnit : h;
			this._element.style.height = this.autoRatio ? '100%' : h;
			if (this.autoRatio) {
				this._cover.style.paddingBottom = h;
				this._cover.style.height = h;
			}
		}

		if (this.align === 'center') this.setAlign(this._element, this.align);
		if (!notResetPercentage) this._element.removeAttribute('data-percentage');

		// save current size
		this._saveCurrentSize();
	},

	_setAutoSize: function () {
		if (this._caption) this._caption.style.marginTop = '';
		this.deleteTransform();
		this._deletePercentSize();

		if (this.autoRatio) {
			this._setPercentSize('100%', this.autoRatio.default);
		} else {
			this._element.style.maxWidth = '';
			this._element.style.width = '';
			this._element.style.height = '';
			this._cover.style.width = '';
			this._cover.style.height = '';
			this._element.setAttribute('data-percentage', 'auto,auto');
		}

		this.setAlign(this._element, this.align);

		// save current size
		this._saveCurrentSize();
	},

	_setPercentSize: function (w, h) {
		if (!h) h = this.autoRatio ? (/%$/.test(this.autoRatio.current) ? this.autoRatio.current : this.autoRatio.default) : h;
		h = h && !/%$/.test(h) && !numbers.get(h, 0) ? (numbers.is(h) ? h + '%' : h) : numbers.is(h) ? h + this.sizeUnit : h || (this.autoRatio ? this.autoRatio.default : '');

		const heightPercentage = /%$/.test(h);
		this._container.style.width = numbers.is(w) ? w + '%' : w;
		this._container.style.height = '';
		this._cover.style.width = '100%';
		this._cover.style.height = h;
		this._element.style.width = '100%';
		this._element.style.maxWidth = '';
		this._element.style.height = this.autoRatio ? '100%' : heightPercentage ? '' : h;

		if (this.autoRatio) this._cover.style.paddingBottom = h;
		if (this.align === 'center') this.setAlign(this._element, this.align);

		this._element.setAttribute('data-percentage', w + ',' + h);
		this._setCaptionPosition(this._element);

		// save current size
		this._saveCurrentSize();
	},

	_deletePercentSize: function () {
		this._cover.style.width = '';
		this._cover.style.height = '';
		this._container.style.width = '';
		this._container.style.height = '';

		domUtils.removeClass(this._container, this._floatClassRegExp);
		domUtils.addClass(this._container, '__se__float-' + this.align);

		if (this.align === 'center') this.setAlign(this._element, this.align);
	},

	_setOriginSize: function () {
		this._element.removeAttribute('data-percentage');

		this.deleteTransform();
		this._deletePercentSize();

		const originSize = (this._element.getAttribute('data-origin') || '').split(',');
		const w = originSize[0];
		const h = originSize[1];

		if (originSize) {
			if (/%$/.test(w) && (/%$/.test(h) || !/\d/.test(h))) {
				this._setPercentSize(w, h);
			} else {
				this._applySize(w, h, false, '');
			}

			// save current size
			this._saveCurrentSize();
		}
	},

	_setAlignIcon: function () {
		if (!this.alignButton) return;
		domUtils.changeElement(this.alignButton.firstElementChild, this._alignIcons[this.align]);
	},

	_saveCurrentSize: function () {
		const size = this.getSize(this._element);
		this._element.setAttribute('data-size', (size.w || 'auto') + ',' + (size.h || 'auto'));
		// if (contextPlugin._videoRatio) contextPlugin._videoRatio = size.y; @todo
	},

	_setCaptionPosition: function (element) {
		const figcaption = domUtils.getEdgeChild(domUtils.getParentElement(element, 'FIGURE'), 'FIGCAPTION');
		if (figcaption) {
			figcaption.style.marginTop = (this.isVertical ? element.offsetWidth - element.offsetHeight : 0) + 'px';
		}
	},

	_deleteCaptionPosition: function (element) {
		const figcaption = domUtils.getEdgeChild(domUtils.getParentElement(element, 'FIGURE'), 'FIGCAPTION');
		if (figcaption) {
			figcaption.style.marginTop = '';
		}
	},

	_displayResizeHandles: function (display) {
		display = !display ? 'none' : 'flex';
		this.controller.form.style.display = display;

		const _figure = this.editor.frameContext.get('_figure');
		const resizeHandles = _figure.handles;
		for (let i = 0, len = resizeHandles.length; i < len; i++) {
			resizeHandles[i].style.display = display;
		}

		if (display === 'none') {
			domUtils.addClass(_figure.main, 'se-resize-ing');
			this.__onResizeESCEvent = this.eventManager.addGlobalEvent('keydown', this.__containerResizingESC);
		} else {
			domUtils.removeClass(_figure.main, 'se-resize-ing');
		}
	},

	_offResizeEvent: function () {
		this.eventManager.removeGlobalEvent(this.__onContainerEvent);
		this.eventManager.removeGlobalEvent(this.__offContainerEvent);
		this.eventManager.removeGlobalEvent(this.__onResizeESCEvent);

		this._displayResizeHandles(true);
		this.editor._offCurrentController();
		this.editor._resizeBackground.style.display = 'none';
		this.editor._resizeBackground.style.cursor = 'default';
	},

	constructor: Figure
};

function GetRotateValue(element) {
	const transform = element.style.transform;
	if (!transform) return { r: 0, x: '', y: '' };
	return {
		r: ((transform.match(/rotate\(([-0-9]+)deg\)/) || [])[1] || 0) * 1,
		x: (transform.match(/rotateX\(([-0-9]+)deg\)/) || [])[1] || '',
		y: (transform.match(/rotateY\(([-0-9]+)deg\)/) || [])[1] || ''
	};
}

const DIRECTION_CURSOR_MAP = { tl: 'nw-resize', tr: 'ne-resize', bl: 'sw-resize', br: 'se-resize', lw: 'w-resize', th: 'n-resize', rw: 'e-resize', bh: 's-resize' };
function OnResizeContainer(e) {
	e.stopPropagation();
	e.preventDefault();

	const inst = Figure.__figureControllerInst;
	const direction = (inst._resize_direction = e.target.classList[0]);
	inst._resizeClientX = e.clientX;
	inst._resizeClientY = e.clientY;
	inst.editor.frameContext.get('_figure').main.style.float = /l/.test(direction) ? 'right' : /r/.test(direction) ? 'left' : 'none';
	inst.editor._resizeBackground.style.cursor = DIRECTION_CURSOR_MAP[direction];
	inst.editor._resizeBackground.style.display = 'block';

	inst.__onContainerEvent = inst.eventManager.addGlobalEvent('mousemove', inst.__containerResizing);
	inst.__offContainerEvent = inst.eventManager.addGlobalEvent('mouseup', inst.__containerResizingOff);
	inst._displayResizeHandles(false);
}

function ContainerResizing(e) {
	const direction = this._resize_direction;
	const clientX = e.clientX;
	const clientY = e.clientY;

	let resultW = this._element_w;
	let resultH = this._element_h;

	let w = resultW + (/r/.test(direction) ? clientX - this._resizeClientX : this._resizeClientX - clientX);
	let h = resultH + (/b/.test(direction) ? clientY - this._resizeClientY : this._resizeClientY - clientY);
	const wh = (resultH / resultW) * w;
	const resizeBorder = this.editor.frameContext.get('_figure').border;

	if (/t/.test(direction)) resizeBorder.style.top = resultH - (/h/.test(direction) ? h : wh) + 'px';
	if (/l/.test(direction)) resizeBorder.style.left = resultW - w + 'px';

	if (/r|l/.test(direction)) {
		resizeBorder.style.width = w + 'px';
		resultW = w;
	}

	if (/^(t|b)[^h]$/.test(direction)) {
		resizeBorder.style.height = wh + 'px';
		resultH = wh;
	} else if (/^(t|b)h$/.test(direction)) {
		resizeBorder.style.height = h + 'px';
		resultH = h;
	}

	this._resize_w = /h$/.test(direction) ? this._width : this._w.Math.round(resultW);
	this._resize_h = /w$/.test(direction) ? this._height : this._w.Math.round(resultH);
	domUtils.changeTxt(this.editor.frameContext.get('_figure').display, this._resize_w + ' x ' + this._resize_h);
}

function ContainerResizingOff() {
	this._offResizeEvent();

	// set size
	let w = this.isVertical ? this._resize_h : this._resize_w;
	let h = this.isVertical ? this._resize_w : this._resize_h;
	w = this._w.Math.round(w) || w;
	h = this._w.Math.round(h) || h;

	if (!this.isVertical && !/%$/.test(w)) {
		const limit = this.editor.frameContext.get('wysiwygFrame').clientWidth - numbers.get(this.editor.frameContext.get('wwComputedStyle').getPropertyValue('padding-left')) + numbers.get(this.editor.frameContext.get('wwComputedStyle').getPropertyValue('padding-right')) - 2;
		if (numbers.get(w, 0) > limit) {
			h = this._w.Math.round((h / w) * limit);
			w = limit;
		}
	}

	this._applySize(w, h, false, this._resize_direction);
	if (this.isVertical) this.setTransform(this._element, w, h, 0);

	this.history.push(false);
	this.component.select(this._element, this.kind);
}

function ContainerResizingESC(e) {
	if (!/^27$/.test(e.keyCode)) return;
	this._offResizeEvent();
	this.component.select(this._element, this.kind);
}

function SetMenuAlign(item) {
	this.setAlign(this._element, item);
	this.selectMenu_align.close();
	this.component.select(this._element, this.kind);
}

function CreateAlign(editor) {
	const icons = [editor.icons.align_justify, editor.icons.align_left, editor.icons.align_center, editor.icons.align_right];
	const langs = [editor.lang.basic, editor.lang.left, editor.lang.center, editor.lang.right];
	const commands = ['none', 'left', 'center', 'right'];
	const html = [];
	const items = [];
	for (let i = 0; i < commands.length; i++) {
		html.push('<button type="button" class="se-btn-list se-tooltip" data-command="' + commands[i] + '">' + icons[i] + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + langs[i] + '</span></span>' + '</button>');
		items.push(commands[i]);
	}

	return { html: html, items: items };
}

function OffFigureContainer() {
	this.editor.frameContext.get('_figure').main.style.display = 'none';
	this.editor._figureContainer = null;
	this.inst.init();
	Figure.__figureControllerInst = null;
}

function OnClick_alignButton() {
	this.selectMenu_align.open('', '[data-command="' + this.align + '"]');
}

function CreateHTML_resizeDot() {
	const html = '<div class="se-resize-dot"><span class="tl"></span><span class="tr"></span><span class="bl"></span><span class="br"></span><span class="lw"></span><span class="th"></span><span class="rw"></span><span class="bh"></span><div class="se-resize-display"></div></div>';
	return domUtils.createElement('DIV', { class: 'se-controller se-resizing-container', style: 'display: none;' }, html);
}

function GET_CONTROLLER_BUTTONS(group) {
	const g = group.split('_');
	const command = g[0];
	const value = g[1];
	let c, v, l, t, i;

	switch (command) {
		case 'percent':
			c = 'resize_percent';
			v = value / 100;
			l = 'resize' + value;
			t = '<span>' + value + '%</span>';
			break;
		case 'auto':
			c = 'auto';
			l = 'autoSize';
			i = 'auto_size';
			break;
		case 'rotate':
			c = 'rotate';
			v = numbers.get(value);
			l = v < 0 ? 'rotateLeft' : 'rotateRight';
			i = v < 0 ? 'rotate_left' : 'rotate_right';
			break;
		case 'mirror':
			c = 'mirror';
			v = value;
			l = value === 'h' ? 'mirrorHorizontal' : 'mirrorVertical';
			i = value === 'h' ? 'mirror_horizontal' : 'mirror_vertical';
			break;
		case 'align':
			c = 'onalign';
			l = 'align';
			i = 'align_justify';
			break;
		case 'caption':
			c = 'caption';
			l = 'caption';
			i = 'caption';
			break;
		case 'revert':
			c = 'revert';
			l = 'revertButton';
			i = 'revert';
			break;
		case 'edit':
			c = 'edit';
			l = 'edit';
			i = 'modify';
			break;
		case 'remove':
			c = 'remove';
			l = 'remove';
			i = 'delete';
			break;
	}

	if (!c) return null;

	return {
		c: c,
		v: v,
		l: l,
		t: t,
		i: i
	};
}

function CreateHTML_controller(editor, controls) {
	const lang = editor.lang;
	const icons = editor.icons;
	let html = '<div class="se-arrow se-arrow-up"></div>';
	for (let i = 0, group; i < controls.length; i++) {
		group = controls[i];
		html += '<div class="se-btn-group">';
		for (let j = 0, len = group.length, m; j < len; j++) {
			m = GET_CONTROLLER_BUTTONS(group[j]);
			if (!m) continue;
			html +=
				'<button type="button" data-command="' + m.c + '" data-value="' + m.v + '" class="' + (m.t ? 'se-btn-w-auto ' : '') + 'se-btn se-tooltip">' + (icons[m.i] || m.t || '!') + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + (lang[m.l] || m.l) + '</span></span></button>';
		}
		html += '</div>';
	}

	return domUtils.createElement('DIV', { class: 'se-controller se-controller-resizing' }, html);
}

export default Figure;
