import _icons from '../../assets/defaultIcons';
import _defaultLang from '../../langs/en';
import { CreateContext, CreateFrameContext } from './context';
import { domUtils, numbers, converter, env } from '../../helper';

const _d = env._d;
const _w = env._w;
const DEFAULT_BUTTON_LIST = [['undo', 'redo'], ['bold', 'underline', 'italic', 'strike', 'subscript', 'superscript'], ['removeFormat'], ['outdent', 'indent'], ['fullScreen', 'showBlocks', 'codeView'], ['preview', 'print']];

const REQUIRED_FORMAT_LINE = 'div';
const REQUIRED_ELEMENT_WHITELIST = 'br|div';
const DEFAULT_ELEMENT_WHITELIST = 'p|pre|blockquote|h1|h2|h3|h4|h5|h6|ol|ul|li|hr|figure|figcaption|img|iframe|audio|video|source|table|thead|tbody|tr|th|td|a|b|strong|var|i|em|u|ins|s|span|strike|del|sub|sup|code|svg|path|details|summary';
const DEFAULT_ATTRIBUTE_WHITELIST = 'contenteditable|colspan|rowspan|target|href|download|rel|src|alt|class|type|controls';
const DEFAULT_FORMAT_LINE = 'P|H[1-6]|LI|TH|TD|DETAILS';
const DEFAULT_FORMAT_BR_LINE = 'PRE';
const DEFAULT_FORMAT_CLOSURE_BR_LINE = '';
const DEFAULT_FORMAT_BLOCK = 'BLOCKQUOTE|OL|UL|FIGCAPTION|TABLE|THEAD|TBODY|TR|DETAILS';
const DEFAULT_FORMAT_CLOSURE_BLOCK = 'TH|TD';
const REQUIRED_DATA_ATTRS = 'data-se-index|data-se-key|data-se-value|data-se-type|data-se-size|data-se-file-name|data-se-file-size|data-origin|data-percentage|data-embed';

/**
 * @description document create
 * @param {Object} options Options
 * @param {Element|Array.<Element>} editorTargets Target textarea
 * @returns {Object}
 */
const Constructor = function (editorTargets, options) {
	if (typeof options !== 'object') options = {};

	/** --- Plugins ------------------------------------------------------------------------------------------ */
	const plugins = {};
	if (options.plugins) {
		const originPlugins = options.plugins;
		const pluginsValues = _w.Array.isArray(originPlugins.length)
			? originPlugins
			: _w.Object.keys(originPlugins).map(function (name) {
					return originPlugins[name];
			  });

		for (let i = 0, len = pluginsValues.length, p; i < len; i++) {
			p = pluginsValues[i].default || pluginsValues[i];
			plugins[p.key] = p;
		}
	}

	/** --- options --------------------------------------------------------------- */
	const optionMap = InitOptions(options, editorTargets);
	const o = optionMap.o;
	const icons = optionMap.i;
	const lang = optionMap.l;
	let exlib_katex = false;

	/** --- carrier wrapper --------------------------------------------------------------- */
	const editor_carrier_wrapper = domUtils.createElement('DIV', { class: 'sun-editor sun-editor-carrier-wrapper sun-editor-common' + (o.get('_rtl') ? ' se-rtl' : '') });
	// menuTray
	const menuTray = domUtils.createElement('DIV', { class: 'se-menu-tray' });
	editor_carrier_wrapper.appendChild(menuTray);

	// modal
	const modal = domUtils.createElement('DIV', { class: 'se-modal sun-editor-common' });
	const modal_back = domUtils.createElement('DIV', { class: 'se-modal-back', style: 'display: none;' });
	const modal_inner = domUtils.createElement('DIV', { class: 'se-modal-inner', style: 'display: none;' });
	modal.appendChild(modal_back);
	modal.appendChild(modal_inner);
	editor_carrier_wrapper.appendChild(modal);

	// loding box, resizing back
	editor_carrier_wrapper.appendChild(domUtils.createElement('DIV', { class: 'se-resizing-back' }));
	editor_carrier_wrapper.appendChild(domUtils.createElement('DIV', { class: 'se-loading-box sun-editor-common' }, '<div class="se-loading-effect"></div>'));
	_d.body.appendChild(editor_carrier_wrapper);

	/** --- toolbar --------------------------------------------------------------- */
	let subbar = null,
		sub_main = null;
	const tool_bar_main = CreateToolBar(o.get('buttonList'), plugins, o, icons, lang);
	const toolbar = tool_bar_main.element;
	toolbar.style.visibility = 'hidden';
	exlib_katex = tool_bar_main.pluginCallButtons.math;
	// toolbar mode
	if (/inline/i.test(o.get('mode'))) {
		toolbar.className += ' se-toolbar-inline';
		toolbar.style.width = o.get('toolbar_width');
	} else if (/balloon/i.test(o.get('mode'))) {
		toolbar.className += ' se-toolbar-balloon';
		toolbar.style.width = o.get('toolbar_width');
		toolbar.appendChild(domUtils.createElement('DIV', { class: 'se-arrow' }));
	}

	/** --- subToolbar --------------------------------------------------------------- */
	if (o.get('subButtonList')) {
		sub_main = CreateToolBar(o.get('subButtonList'), plugins, o, icons, lang);
		subbar = sub_main.element;
		subbar.style.visibility = 'hidden';
		if (!exlib_katex) exlib_katex = sub_main.pluginCallButtons.math;
		// subbar mode must be balloon-*
		subbar.className += ' se-toolbar-balloon se-toolbar-sub';
		subbar.style.width = o.get('toolbar.sub_width');
		subbar.appendChild(domUtils.createElement('DIV', { class: 'se-arrow' }));
	}

	/** --- external library --------------------------------------------------------------- */
	// katex
	if (exlib_katex) _checkKatexMath(o.get('katex'));

	/** frame - root set - start -------------------------------------------------------------- */
	const rootId = editorTargets[0].key || null;
	const rootKeys = [];
	const rootTargets = new _w.Map();
	const statusbarContainer = o.get('statusbar_container');
	let default_status_bar = null;
	for (let i = 0, len = editorTargets.length; i < len; i++) {
		const editTarget = editorTargets[i];
		const to = editTarget.options;
		const top_div = domUtils.createElement('DIV', { class: 'sun-editor' + (to.get('_rtl') ? ' se-rtl' : '') });
		const container = domUtils.createElement('DIV', { class: 'se-container' });
		const editor_div = domUtils.createElement('DIV', { class: 'se-wrapper' });

		container.appendChild(domUtils.createElement('DIV', { class: 'se-toolbar-shadow' }));

		// init element
		const initElements = _initTargetElements(editTarget.key, o, top_div, to);
		const bottomBar = initElements.bottomBar;
		const statusbar = bottomBar.statusbar;
		const wysiwyg_div = initElements.wysiwygFrame;
		const placeholder_span = initElements.placeholder;
		let textarea = initElements.codeView;

		// line breaker
		const line_breaker = domUtils.createElement('DIV', { class: 'se-line-breaker' }, '<button class="se-btn">' + icons.line_break + '</button>');
		const line_breaker_t = domUtils.createElement('DIV', { class: 'se-line-breaker-component se-line-breaker-component-t' }, '<button class="se-btn">' + icons.line_break + '</button>');
		const line_breaker_b = domUtils.createElement('DIV', { class: 'se-line-breaker-component se-line-breaker-component-b' }, '<button class="se-btn">' + icons.line_break + '</button>');
		line_breaker_t.innerHTML = line_breaker_b.innerHTML = icons.line_break;
		editor_div.appendChild(line_breaker);
		editor_div.appendChild(line_breaker_t);
		editor_div.appendChild(line_breaker_b);

		// append container
		editor_div.appendChild(textarea);
		if (placeholder_span) editor_div.appendChild(placeholder_span);
		container.appendChild(domUtils.createElement('DIV', { class: 'se-toolbar-sticky-dummy' }));
		container.appendChild(editor_div);

		// statusbar
		if (statusbar) {
			if (statusbarContainer) {
				if (!default_status_bar) {
					statusbarContainer.appendChild(domUtils.createElement('DIV', { class: 'sun-editor' }, statusbar));
					default_status_bar = statusbar;
				}
			} else {
				container.appendChild(statusbar);
			}
		}

		// root key
		const key = editTarget.key || null;
		textarea = _checkCodeMirror(o, to, textarea);
		top_div.appendChild(container);
		rootKeys.push(key);
		rootTargets.set(key, CreateFrameContext(editTarget, top_div, wysiwyg_div, textarea, default_status_bar || statusbar, key));
	}
	/** frame - root set - end -------------------------------------------------------------- */

	// toolbar container
	const toolbar_container = o.get('toolbar_container');
	if (toolbar_container) {
		const top_div = domUtils.createElement('DIV', { class: 'sun-editor' + (o.get('_rtl') ? ' se-rtl' : '') });
		const container = domUtils.createElement('DIV', { class: 'se-container' });
		container.appendChild(toolbar);
		if (subbar) container.appendChild(subbar);
		top_div.appendChild(container);
		toolbar_container.appendChild(top_div);
		toolbar_container.appendChild(domUtils.createElement('DIV', { class: 'se-toolbar-sticky-dummy' }));
	} else {
		const rootContainer = rootTargets.get(rootId).get('container');
		rootContainer.insertBefore(toolbar, rootContainer.firstElementChild);
		if (subbar) rootContainer.insertBefore(subbar, rootContainer.firstElementChild);
	}

	return {
		context: CreateContext(toolbar, toolbar_container, menuTray, subbar),
		carrierWrapper: editor_carrier_wrapper,
		options: o,
		plugins: plugins,
		icons: icons,
		lang: lang,
		value: optionMap.v,
		rootId: rootId,
		rootKeys: rootKeys,
		rootTargets: rootTargets,
		pluginCallButtons: tool_bar_main.pluginCallButtons,
		responsiveButtons: tool_bar_main.responsiveButtons,
		pluginCallButtons_sub: sub_main ? sub_main.pluginCallButtons : [],
		responsiveButtons_sub: sub_main ? sub_main.responsiveButtons : []
	};
};

/**
 * @description Reset the options
 * @returns {Object}
 */
export function ResetOptions() {}

/**
 * @description Create shortcuts desc span.
 * @param {string} command Command string
 * @param {Array.<string>} values options.shortcuts[command]
 * @param {Element} button Command button element
 * @param {Map} keyMap Map to store shortcut key info
 * @param {Array} rca "_reverseCommandArray" option
 * @param {Array} reverseKeys Reverse key array
 */
export function CreateShortcuts(command, button, values, keyMap, rca, reverseKeys) {
	if (!values || values.length < 2) return;
	const tooptip = button.querySelector('.se-tooltip-text');

	for (let i = 0, v, s, t, k, r; i < values.length; i += 2) {
		v = values[i];
		s = /^s/i.test(v);
		k = numbers.get(v) + (s ? 1000 : 0);
		if (!keyMap.has(k)) {
			r = rca.indexOf(command);
			r = r === -1 ? '' : numbers.isOdd(r) ? rca[r + 1] : rca[r - 1];
			if (r) reverseKeys.push(k);
			keyMap.set(k, { c: command, r: r, t: button.getAttribute('data-type'), e: button });
		}

		if (!(t = values[i + 1])) continue;
		if (tooptip) tooptip.appendChild(domUtils.createElement('SPAN', { class: 'se-shortcut' }, env.cmdIcon + (s ? env.shiftIcon : '') + '+<span class="se-shortcut-key">' + t + '</span>'));
	}
}

/**
 * @description Initialize options
 * @param {Object} options Options object
 * @param {Element|Array.<Element>} editorTargets Target textarea
 * @returns {o:Map, p:Map} {{o: options map, p: plugins map}}
 */
function InitOptions(options, editorTargets) {
	const buttonList = options.buttonList || DEFAULT_BUTTON_LIST;
	const o = new _w.Map();
	o.set('events', options.events || {});

	/** Multi root */
	if (options.multiRoot) {
		if (!options.toolbar_container && !/inline|balloon/i.test(options.mode)) throw Error('[SUNEDITOR.create.fail] In multi root, The "mode" option cannot be "classic" without using the "toolbar_container" option.');
	}

	/** Base */
	o.set('mode', options.mode || 'classic'); // classic, inline, balloon, balloon-always
	// text style tags
	const textTags = converter.mergeObject(
		{
			bold: 'strong',
			underline: 'u',
			italic: 'em',
			strike: 'del',
			subscript: 'sub',
			superscript: 'sup',
			indent: 'indent',
			outdent: 'outdent'
		},
		options.textTags || {}
	);
	o.set('textTags', textTags);
	o.set('_spanStylesRegExp', new _w.RegExp('\\s*[^-a-zA-Z](font-family|font-size|color|background-color' + (options.spanStyles ? '|' + options.spanStyles : '') + ')\\s*:[^;]+(?!;)*', 'gi'));
	o.set('_formatStylesRegExp', new _w.RegExp('\\s*[^-a-zA-Z](text-align|margin-left|margin-right' + (options.formatStyles ? '|' + options.formatStyles : '') + ')\\s*:[^;]+(?!;)*', 'gi'));
	o.set('_defaultStyleTagMap', {
		strong: textTags.bold,
		b: textTags.bold,
		u: textTags.underline,
		ins: textTags.underline,
		em: textTags.italic,
		i: textTags.italic,
		del: textTags.strike,
		strike: textTags.strike,
		s: textTags.strike,
		sub: textTags.subscript,
		sup: textTags.superscript
	});
	o.set(
		'_styleCommandMap',
		converter.mergeObject(converter.swapKeyValue(textTags), {
			strong: 'bold',
			b: 'bold',
			u: 'underline',
			ins: 'underline',
			em: 'italic',
			i: 'italic',
			del: 'strike',
			strike: 'strike',
			s: 'strike',
			sub: 'subscript',
			sup: 'superscript'
		})
	);
	o.set('_defaultTagCommand', {
		bold: textTags.bold,
		underline: textTags.underline,
		italic: textTags.italic,
		strike: textTags.strike,
		subscript: textTags.sub,
		superscript: textTags.sup
	});
	// text direction
	o.set('textDirection', typeof options.textDirection !== 'string' ? 'ltr' : options.textDirection);
	o.set('_rtl', o.get('textDirection') === 'rtl');
	o.set('reverseCommands', ['indent-outdent'].concat(options.reverseButtons || []));
	o.set('_reverseCommandArray', ('-' + o.get('reverseCommands').join('-')).split('-'));
	if (numbers.isEven(o.get('_reverseCommandArray').length)) {
		console.warn('[SUNEDITOR.create.warning] The "reverseCommands" option is invalid, Shortcuts key may not work properly.');
	}

	// etc
	o.set('historyStackDelayTime', typeof options.historyStackDelayTime === 'number' ? options.historyStackDelayTime : 400);
	o.set('frameAttrbutes', options.frameAttrbutes || {});
	o.set('_editableClass', 'sun-editor-editable' + (o.get('_rtl') ? ' se-rtl' : ''));
	o.set('callBackSave', options.callBackSave);
	o.set('lineAttrReset', ['id'].concat(options.lineAttrReset && typeof options.lineAttrReset === 'string' ? options.lineAttrReset.toLowerCase().split('|') : []));
	o.set('_printClass', typeof options._printClass === 'string' ? options._printClass : null);

	/** whitelist, blacklist */
	// default line
	o.set('defaultLine', typeof options.defaultLine === 'string' && options.defaultLine.length > 0 ? options.defaultLine : 'p');
	// element
	o.set('elementWhitelist', (typeof options.elementWhitelist === 'string' ? options.elementWhitelist : '').toLowerCase());
	o.set('elementBlacklist', _createBlacklist((typeof options.elementBlacklist === 'string' ? options.elementBlacklist : '').toLowerCase(), o.get('defaultLine')));
	// attribute
	o.set('attributeWhitelist', !options.attributeWhitelist || typeof options.attributeWhitelist !== 'object' ? null : options.attributeWhitelist);
	o.set('attributeBlacklist', !options.attributeBlacklist || typeof options.attributeBlacklist !== 'object' ? null : options.attributeBlacklist);
	// format tag
	o.set('formatClosureBrLine', _createFormatInfo(options.formatClosureBrLine, (options.__defaultFormatClosureBrLine = typeof options.__defaultFormatClosureBrLine === 'string' ? options.__defaultFormatClosureBrLine : DEFAULT_FORMAT_CLOSURE_BR_LINE).toLowerCase(), o.get('elementBlacklist')));
	o.set('formatBrLine', _createFormatInfo((options.formatBrLine || '') + '|' + o.get('formatClosureBrLine').str, (options.__defaultFormatBrLine = typeof options.__defaultFormatBrLine === 'string' ? options.__defaultFormatBrLine : DEFAULT_FORMAT_BR_LINE).toLowerCase(), o.get('elementBlacklist')));
	o.set('formatLine', _createFormatInfo(REQUIRED_FORMAT_LINE + '|' + (options.formatLine || '') + '|' + o.get('formatBrLine').str, (options.__defaultFormatLine = typeof options.__defaultFormatLine === 'string' ? (options.__defaultFormatLine) : DEFAULT_FORMAT_LINE).toLowerCase(), o.get('elementBlacklist')));
	o.set('formatClosureBlock', _createFormatInfo(options.formatClosureBlock, (options.__defaultFormatClosureBlock = typeof options.__defaultFormatClosureBlock === 'string' ? options.__defaultFormatClosureBlock : DEFAULT_FORMAT_CLOSURE_BLOCK).toLowerCase(), o.get('elementBlacklist')));
	o.set('formatBlock', _createFormatInfo((options.formatBlock || '') + '|' + o.get('formatClosureBlock').str, (options.__defaultFormatBlock = typeof options.__defaultFormatBlock === 'string' ? options.__defaultFormatBlock : DEFAULT_FORMAT_BLOCK).toLowerCase(), o.get('elementBlacklist')));

	/** __defaults */
	o.set('__defaultDataAttrs', REQUIRED_DATA_ATTRS);
	o.set('__defaultElementWhitelist', REQUIRED_ELEMENT_WHITELIST + '|' + (typeof options.__defaultElementWhitelist === 'string' ? options.__defaultElementWhitelist : DEFAULT_ELEMENT_WHITELIST).toLowerCase());
	o.set('__defaultAttributeWhitelist', (typeof options.__defaultAttributeWhitelist === 'string' ? options.__defaultAttributeWhitelist : DEFAULT_ATTRIBUTE_WHITELIST).toLowerCase());
	// --- create element whitelist (__defaultElementWhiteList + elementWhitelist + format[line, BrLine, Block, Closureblock, ClosureBrLine] - elementBlacklist)
	o.set('_editorElementWhitelist', o.get('elementWhitelist') === '*' ? '*' : _createWhitelist(o));

	/** Toolbar */
	o.set('toolbar_width', options.toolbar_width ? (numbers.is(options.toolbar_width) ? options.toolbar_width + 'px' : options.toolbar_width) : 'auto');
	o.set('toolbar_container', options.toolbar_container && !/inline/i.test(o.get('mode')) ? (typeof options.toolbar_container === 'string' ? _d.querySelector(options.toolbar_container) : options.toolbar_container) : null);
	o.set('toolbar_sticky', /balloon/i.test(o.get('mode')) ? -1 : options.toolbar_sticky === undefined ? 0 : /^\d+/.test(options.toolbar_sticky) ? numbers.get(options.toolbar_sticky, 0) : -1);
	o.set('toolbar_hide', !!options.toolbar_hide);
	o.set('buttonList', o.get('_rtl') ? buttonList.reverse() : buttonList);

	/** subToolbar */
	const subbar = options.subToolbar;
	if (subbar && subbar.buttonList && subbar.buttonList.length > 0) {
		if (/balloon/.test(o.get('mode'))) {
			console.warn('[SUNEDITOR.create.subToolbar.fail] When the "mode" option is "balloon-*", the "subToolbar" option is omitted.');
		} else {
			o.set('subMode', subbar.mode || 'balloon');
			o.set('subButtonList', o.get('_rtl') ? subbar.buttonList.reverse() : subbar.buttonList);
			o.set('toolbar.sub_width', subbar.width ? (numbers.is(subbar.width) ? subbar.width + 'px' : subbar.width) : 'auto');
		}
	}
	options.statusbar_container = typeof options.statusbar_container === 'string' ? _d.querySelector(options.statusbar_container) : options.statusbar_container;
	o.set('statusbar_container', options.statusbar_container);

	/** styles */
	InitRootOptions(editorTargets, options);

	/** IFrame */
	o.set('iframe', !!options.iframe_fullPage || !!options.iframe);
	o.set('iframe_fullPage', !!options.iframe_fullPage);
	o.set('iframe_attributes', options.iframe_attributes || {});
	o.set('iframe_cssFileName', options.iframe ? (typeof options.iframe_cssFileName === 'string' ? [options.iframe_cssFileName] : options.iframe_cssFileName || ['suneditor']) : null);

	/** Key actions */
	o.set('tabDisable', !!options.tabDisable);
	o.set('shortcutsHint', options.shortcutsHint === undefined ? true : !!options.shortcutsHint);
	o.set('shortcutsDisable', options.shortcutsDisable === undefined ? true : !!options.shortcutsDisable);
	const shortcuts = !o.get('shortcutsDisable')
		? {}
		: [
				{
					selectAll: ['65', 'A'],
					bold: ['66', 'B'],
					strike: ['s83', 'S'],
					underline: ['85', 'U'],
					italic: ['73', 'I'],
					redo: ['89', 'Y', 's90', 'Z'],
					undo: ['90', 'Z'],
					indent: ['221', ']'],
					outdent: ['219', '['],
					sup: ['187', '='],
					sub: ['s187', '='],
					save: ['83', 'S']
				},
				options.shortcuts || {}
		  ].reduce(function (_default, _new) {
				for (let key in _new) {
					_default[key] = _new[key];
				}
				return _default;
		  }, {});
	o.set('shortcuts', shortcuts);

	/** View */
	o.set('fullScreenOffset', options.fullScreenOffset === undefined ? 0 : /^\d+/.test(options.fullScreenOffset) ? numbers.get(options.fullScreenOffset, 0) : 0);
	o.set('previewTemplate', typeof options.previewTemplate === 'string' ? options.previewTemplate : null);
	o.set('printTemplate', typeof options.printTemplate === 'string' ? options.printTemplate : null);

	/** Defining menu items */
	o.set('hrItems', !options.hrItems ? null : options.hrItems);
	o.set('font', !options.font ? ['Arial', 'Comic Sans MS', 'Courier New', 'Impact', 'Georgia', 'tahoma', 'Trebuchet MS', 'Verdana'] : options.font);
	o.set('fontSize', !options.fontSize ? null : options.fontSize);
	o.set('formats', !options.formats ? null : options.formats);
	o.set('colorList_font', !options.colorList_font ? null : options.colorList_font);
	o.set('colorList_background', !options.colorList_background ? null : options.colorList_background);
	o.set('lineHeights', !options.lineHeights ? null : options.lineHeights);
	o.set('paragraphStyles', !options.paragraphStyles ? null : options.paragraphStyles);
	o.set('textStyles', !options.textStyles ? null : options.textStyles);
	o.set('fontSizeUnit', typeof options.fontSizeUnit === 'string' ? options.fontSizeUnit.trim().toLowerCase() || 'px' : 'px');
	o.set('alignItems', typeof options.alignItems === 'object' ? options.alignItems : o.get('_rtl') ? ['right', 'center', 'left', 'justify'] : ['left', 'center', 'right', 'justify']);
	o.set('templates', !options.templates ? null : options.templates);
	o.set(
		'mathFontSize',
		!!options.mathFontSize
			? options.mathFontSize
			: [
					{
						text: '1',
						value: '1em'
					},
					{
						text: '1.5',
						value: '1.5em'
					},
					{
						text: '2',
						value: '2em'
					},
					{
						text: '2.5',
						value: '2.5em'
					}
			  ]
	);

	/** --- Media */
	o.set('mediaAutoSelect', options.mediaAutoSelect === undefined ? true : !!options.mediaAutoSelect);

	/** Image */
	o.set('imageResizing', options.imageResizing === undefined ? true : options.imageResizing);
	o.set('imageWidth', !options.imageWidth ? 'auto' : numbers.is(options.imageWidth) ? options.imageWidth + 'px' : options.imageWidth);
	o.set('imageHeight', !options.imageHeight ? 'auto' : numbers.is(options.imageHeight) ? options.imageHeight + 'px' : options.imageHeight);
	o.set(
		'imageControls',
		options.imageControls || !o.get('imageResizing')
			? [['mirror_h', 'mirror_v', 'align', 'caption', 'revert', 'edit', 'remove']]
			: [
				['resize_auto,100,75,50', 'rotate_l', 'rotate_r', 'mirror_h', 'mirror_v'],
				['edit', 'align', 'caption', 'revert', 'remove']
			  ]
	);
	// @todo
	o.set('imageHeightShow', options.imageHeightShow === undefined ? true : !!options.imageHeightShow);
	o.set('imageAlignShow', options.imageAlignShow === undefined ? true : !!options.imageAlignShow);
	o.set('imageSizeOnlyPercentage', !!options.imageSizeOnlyPercentage);
	o.set('_imageSizeUnit', o.get('imageSizeOnlyPercentage') ? '%' : 'px');
	o.set('imageRotation', options.imageRotation !== undefined ? options.imageRotation : !(o.get('imageSizeOnlyPercentage') || !o.get('imageHeightShow')));
	o.set('imageFileInput', options.imageFileInput === undefined ? true : options.imageFileInput);
	o.set('imageUrlInput', options.imageUrlInput === undefined || !options.imageFileInput ? true : options.imageUrlInput);
	o.set('imageUploadHeader', options.imageUploadHeader || null);
	o.set('imageUploadUrl', typeof options.imageUploadUrl === 'string' ? options.imageUploadUrl : null);
	o.set('imageUploadSizeLimit', /\d+/.test(options.imageUploadSizeLimit) ? numbers.get(options.imageUploadSizeLimit, 0) : null);
	o.set('imageMultipleFile', !!options.imageMultipleFile);
	o.set('imageAccept', typeof options.imageAccept !== 'string' || options.imageAccept.trim() === '*' ? 'image/*' : options.imageAccept.trim() || 'image/*');

	/** Image - image gallery */
	o.set('imageGalleryUrl', typeof options.imageGalleryUrl === 'string' ? options.imageGalleryUrl : null);
	o.set('imageGalleryHeader', options.imageGalleryHeader || null);

	/** Video */
	o.set('videoResizing', options.videoResizing === undefined ? true : options.videoResizing);
	o.set('videoWidth', !options.videoWidth || !numbers.get(options.videoWidth, 0) ? '' : numbers.is(options.videoWidth) ? options.videoWidth + 'px' : options.videoWidth);
	o.set('videoHeight', !options.videoHeight || !numbers.get(options.videoHeight, 0) ? '' : numbers.is(options.videoHeight) ? options.videoHeight + 'px' : options.videoHeight);
	o.set(
		'videoControls',
		options.videoControls || !o.get('videoResizing')
			? [['mirror_h', 'mirror_v', 'align', 'revert', 'edit', 'remove']]
			: [
				['resize_auto,75,50', 'rotate_l', 'rotate_r', 'mirror_h', 'mirror_v'],
				['edit', 'align', 'revert', 'remove']
			  ]
	);
	// @todo
	o.set('videoRatioShow', options.videoRatioShow === undefined ? true : !!options.videoRatioShow);
	o.set('videoRatio', numbers.get(options.videoRatio, 4) || 0.5625);
	o.set('videoRatioList', !options.videoRatioList ? null : options.videoRatioList);
	// @todo
	o.set('videoHeightShow', options.videoHeightShow === undefined ? true : !!options.videoHeightShow);
	o.set('videoAlignShow', options.videoAlignShow === undefined ? true : !!options.videoAlignShow);
	o.set('videoSizeOnlyPercentage', !!options.videoSizeOnlyPercentage);
	o.set('_videoSizeUnit', o.get('videoSizeOnlyPercentage') ? '%' : 'px');
	o.set('videoRotation', options.videoRotation !== undefined ? options.videoRotation : !(o.get('videoSizeOnlyPercentage') || !o.get('videoHeightShow')));
	o.set('youtubeQuery', (options.youtubeQuery || '').replace('?', ''));
	o.set('videoFileInput', !!options.videoFileInput);
	o.set('videoUrlInput', options.videoUrlInput === undefined || !options.videoFileInput ? true : options.videoUrlInput);
	o.set('videoUploadHeader', options.videoUploadHeader || null);
	o.set('videoUploadUrl', typeof options.videoUploadUrl === 'string' ? options.videoUploadUrl : null);
	o.set('videoUploadSizeLimit', /\d+/.test(options.videoUploadSizeLimit) ? numbers.get(options.videoUploadSizeLimit, 0) : null);
	o.set('videoMultipleFile', !!options.videoMultipleFile);
	o.set('videoTagAttrs', options.videoTagAttrs || null);
	o.set('videoIframeAttrs', options.videoIframeAttrs || null);
	o.set('videoAccept', typeof options.videoAccept !== 'string' || options.videoAccept.trim() === '*' ? 'video/*' : options.videoAccept.trim() || 'video/*');

	/** Audio */
	o.set('audioWidth', !options.audioWidth ? '' : numbers.is(options.audioWidth) ? options.audioWidth + 'px' : options.audioWidth);
	o.set('audioHeight', !options.audioHeight ? '' : numbers.is(options.audioHeight) ? options.audioHeight + 'px' : options.audioHeight);
	o.set('audioFileInput', !!options.audioFileInput);
	o.set('audioUrlInput', options.audioUrlInput === undefined || !options.audioFileInput ? true : options.audioUrlInput);
	o.set('audioUploadHeader', options.audioUploadHeader || null);
	o.set('audioUploadUrl', typeof options.audioUploadUrl === 'string' ? options.audioUploadUrl : null);
	o.set('audioUploadSizeLimit', /\d+/.test(options.audioUploadSizeLimit) ? numbers.get(options.audioUploadSizeLimit, 0) : null);
	o.set('audioMultipleFile', !!options.audioMultipleFile);
	o.set('audioTagAttrs', options.audioTagAttrs || null);
	o.set('audioAccept', typeof options.audioAccept !== 'string' || options.audioAccept.trim() === '*' ? 'audio/*' : options.audioAccept.trim() || 'audio/*');

	/** Table */
	o.set('tableCellControllerPosition', typeof options.tableCellControllerPosition === 'string' ? options.tableCellControllerPosition.toLowerCase() : 'cell');

	/** Link */
	o.set('linkTargetNewWindow', !!options.linkTargetNewWindow);
	o.set('linkProtocol', typeof options.linkProtocol === 'string' ? options.linkProtocol : null);
	o.set('linkRel', _w.Array.isArray(options.linkRel) ? options.linkRel : []);
	o.set('linkRelDefault', options.linkRelDefault || {});

	/** External library */
	// CodeMirror
	if (options.codeMirror) {
		o.set('codeMirror', options.codeMirror);
		if (options.codeMirror.EditorView) {
			o.set('codeMirror6Editor', true);
		} else if (options.codeMirror.src) {
			o.set('codeMirror5Editor', true);
		} else {
			console.warn('[SUNEDITOR.options.codeMirror.fail] The codeMirror option is set incorrectly.');
			o.set('codeMirror', null);
		}
	}

	// katex (Math plugin)
	if (options.katex) {
		if (!options.katex.src) {
			console.warn('[SUNEDITOR.options.katex.fail] The katex option is set incorrectly.');
			o.set('katex', null);
		} else {
			o.set('katex', options.katex);
		}
	}

	/** Private options */
	o.set('__listCommonStyle', options.__listCommonStyle || ['fontSize', 'color', 'fontFamily', 'fontWeight', 'fontStyle']);

	/** --- Icons ------------------------------------------------------------------------------------------ */
	let icons =
		!options.icons || typeof options.icons !== 'object'
			? _icons
			: [_icons, options.icons].reduce(function (_default, _new) {
					for (let key in _new) {
						_default[key] = _new[key];
					}
					return _default;
			  }, {});
	// rtl
	if (o.get('_rtl')) {
		icons = [icons, icons.rtl].reduce(function (_default, _new) {
			for (let key in _new) {
				_default[key] = _new[key];
			}
			return _default;
		}, {});
	}
	o.set('icons', icons);

	return {
		o: o,
		i: icons,
		l: options.lang || _defaultLang,
		v: (options.value = typeof options.value === 'string' ? options.value : null)
	};
}

function InitRootOptions(editorTargets, options) {
	for (let i = 0, len = editorTargets.length; i < len; i++) {
		InitFrameOptions(editorTargets[i].options || {}, options, (editorTargets[i].options = new _w.Map()));
	}
}

function InitFrameOptions(o, origin, fo) {
	const barContainer = origin.statusbar_container;
	
	// members
	const value = o.value === undefined ? origin.value : o.value;
	const placeholder = o.placeholder === undefined ? origin.placeholder : o.placeholder;
	const width = o.width === undefined ? origin.width : o.width;
	const minWidth = o.minWidth === undefined ? origin.minWidth : o.minWidth;
	const maxWidth = o.maxWidth === undefined ? origin.maxWidth : o.maxWidth;
	const height = o.height === undefined ? origin.height : o.height;
	const minHeight = o.minHeight === undefined ? origin.minHeight : o.minHeight;
	const maxHeight = o.maxHeight === undefined ? origin.maxHeight : o.maxHeight;
	const editorStyle = o.editorStyle === undefined ? origin.editorStyle : o.editorStyle;
	const statusbar = (barContainer || o.statusbar === undefined) ? origin.statusbar : o.statusbar;
	const statusbar_showPathLabel = (barContainer || o.statusbar_showPathLabel === undefined) ? origin.statusbar_showPathLabel : o.statusbar_showPathLabel;
	const statusbar_resizeEnable = barContainer ? false : o.statusbar_resizeEnable === undefined ? origin.statusbar_resizeEnable : o.statusbar_resizeEnable;
	const charCounter = (barContainer || o.charCounter === undefined) ? origin.charCounter : o.charCounter;
	const charCounter_max = (barContainer || o.charCounter_max === undefined) ? origin.charCounter_max : o.charCounter_max;
	const charCounter_label = (barContainer || o.charCounter_label === undefined) ? origin.charCounter_label : o.charCounter_label;
	const charCounter_type = (barContainer || o.charCounter_type === undefined) ? origin.charCounter_type : o.charCounter_type;

	// value
	fo.set('value', value);
	fo.set('placeholder', placeholder);
	// styles
	fo.set('width', width ? (numbers.is(width) ? width + 'px' : width) : '100%');
	fo.set('minWidth', (numbers.is(minWidth) ? minWidth + 'px' : minWidth) || '');
	fo.set('maxWidth', (numbers.is(maxWidth) ? maxWidth + 'px' : maxWidth) || '');
	fo.set('height', height ? (numbers.is(height) ? height + 'px' : height) : 'auto');
	fo.set('minHeight', (numbers.is(minHeight) ? minHeight + 'px' : minHeight) || '');
	fo.set('maxHeight', (numbers.is(maxHeight) ? maxHeight + 'px' : maxHeight) || '');
	fo.set('_defaultStyles', converter._setDefaultOptionStyle(fo, typeof editorStyle === 'string' ? editorStyle : ''));
	// status bar
	const hasStatusbar = statusbar === undefined ? true : statusbar;
	fo.set('statusbar', hasStatusbar);
	fo.set('statusbar_showPathLabel', !hasStatusbar ? false : typeof statusbar_showPathLabel === 'boolean' ? statusbar_showPathLabel : true);
	fo.set('statusbar_resizeEnable', !hasStatusbar ? false : statusbar_resizeEnable === undefined ? true : !!statusbar_resizeEnable);
	// status bar - character count
	fo.set('charCounter', charCounter_max > 0 ? true : typeof charCounter === 'boolean' ? charCounter : false);
	fo.set('charCounter_max', numbers.is(charCounter_max) && charCounter_max > -1 ? charCounter_max * 1 : null);
	fo.set('charCounter_label', typeof charCounter_label === 'string' ? charCounter_label.trim() : null);
	fo.set('charCounter_type', typeof charCounter_type === 'string' ? charCounter_type : 'char');
}

/**
 * @description Initialize property of suneditor elements
 * @param {string} key Key
 * @param {Object} options Options
 * @param {Element} topDiv Suneditor top div
 * @returns {Object} Bottom bar elements (statusbar, navigation, charWrapper, charCounter)
 */
function _initTargetElements(key, options, topDiv, targetOptions) {
	const editorStyles = targetOptions.get('_defaultStyles');
	/** top div */
	topDiv.style.cssText = editorStyles.top;

	/** editor */
	// wysiwyg div or iframe
	const wysiwygDiv = domUtils.createElement(!options.get('iframe') ? 'DIV' : 'IFRAME', {
		class: 'se-wrapper-inner se-wrapper-wysiwyg',
		'data-root-key': key
	});

	if (!options.get('iframe')) {
		wysiwygDiv.setAttribute('contenteditable', true);
		wysiwygDiv.setAttribute('scrolling', 'auto');
		const frameAttrs = options.get('iframe_attributes');
		for (let key in frameAttrs) {
			wysiwygDiv.setAttribute(key, frameAttrs[key]);
		}
		wysiwygDiv.className += ' ' + options.get('_editableClass');
		wysiwygDiv.style.cssText = editorStyles.frame + editorStyles.editor;
	} else {
		wysiwygDiv.allowFullscreen = true;
		wysiwygDiv.frameBorder = 0;
		wysiwygDiv.style.cssText = editorStyles.frame;
	}

	// textarea for code view
	const textarea = domUtils.createElement('TEXTAREA', { class: 'se-wrapper-inner se-wrapper-code', style: editorStyles.frame });

	textarea.style.setProperty('display', 'none', 'important');
	if (targetOptions.get('height') === 'auto') textarea.style.overflow = 'hidden';

	/** status bar */
	let statusbar = null;
	let navigation = null;
	let charWrapper = null;
	let charCounter = null;
	if (targetOptions.get('statusbar')) {
		statusbar = domUtils.createElement('DIV', { class: 'se-status-bar sun-editor-common' });

		/** navigation */
		navigation = domUtils.createElement('DIV', { class: 'se-navigation sun-editor-common' });
		statusbar.appendChild(navigation);

		/** char counter */
		if (targetOptions.get('charCounter')) {
			charWrapper = domUtils.createElement('DIV', { class: 'se-char-counter-wrapper' });

			if (targetOptions.get('charCounter_label')) {
				const charLabel = domUtils.createElement('SPAN', { class: 'se-char-label' });
				charLabel.textContent = targetOptions.get('charCounter_label');
				charWrapper.appendChild(charLabel);
			}

			charCounter = domUtils.createElement('SPAN', { class: 'se-char-counter' });
			charCounter.textContent = '0';
			charWrapper.appendChild(charCounter);

			if (targetOptions.get('charCounter_max') > 0) {
				const char_max = domUtils.createElement('SPAN');
				char_max.textContent = ' / ' + targetOptions.get('charCounter_max');
				charWrapper.appendChild(char_max);
			}

			statusbar.appendChild(charWrapper);
		}
	}

	let placeholder = null;
	if (targetOptions.get('placeholder')) {
		placeholder = domUtils.createElement('SPAN', { class: 'se-placeholder' });
		placeholder.innerText = targetOptions.get('placeholder');
	}

	return {
		bottomBar: {
			statusbar: statusbar,
			navigation: navigation,
			charWrapper: charWrapper,
			charCounter: charCounter
		},
		wysiwygFrame: wysiwygDiv,
		codeView: textarea,
		placeholder: placeholder
	};
}

/**
 * @description Check the CodeMirror option to apply the CodeMirror and return the CodeMirror element.
 * @param {Object} options options
 * @param {Element} textarea textarea element
 */
function _checkCodeMirror(options, targetOptions, textarea) {
	let cmeditor = null;
	let hasCodeMirror = false;

	if (options.get('codeMirror6Editor')) {
		const codeMirror = options.get('codeMirror');
		const codeStyles = textarea.style.cssText;
		const cm = new codeMirror.EditorView({
			parent: textarea.parentElement,
			extensions: codeMirror.extensions,
			state: codeMirror.state
		});

		targetOptions.set('codeMirror6Editor', cm);
		cmeditor = cm.dom;
		cmeditor.style.cssText = codeStyles;
		hasCodeMirror = true;
	} else if (options.get('codeMirror5Editor')) {
		const codeMirror = options.get('codeMirror');
		const cmOptions = [
			{
				mode: 'htmlmixed',
				htmlMode: true,
				lineNumbers: true,
				lineWrapping: true
			},
			codeMirror.options || {}
		].reduce(function (init, option) {
			for (let key in option) {
				init[key] = option[key];
			}
			return init;
		}, {});

		if (targetOptions.get('height') === 'auto') {
			cmOptions.viewportMargin = Infinity;
			cmOptions.height = 'auto';
		}

		const codeStyles = textarea.style.cssText;
		const cm = codeMirror.src.fromTextArea(textarea, cmOptions);
		targetOptions.set('codeMirror5Editor', cm);
		cmeditor = cm.display.wrapper;
		cmeditor.style.cssText = codeStyles;
		hasCodeMirror = true;
	}

	options.set('hasCodeMirror', hasCodeMirror);
	if (cmeditor) {
		domUtils.removeItem(textarea);
		cmeditor.className += ' se-wrapper-code-mirror';
		cmeditor.style.setProperty('display', 'none', 'important');
		return cmeditor;
	}

	return textarea;
}

/**
 * @description Check for a katex object.
 * @param {Object} katex katex object
 */
function _checkKatexMath(katex) {
	if (!katex) {
		console.warn('[SUNEDITOR.create.fail] To use the math button you need to add a "katex" object to the options.');
		return;
	}

	const katexOptions = [
		{
			throwOnError: false
		},
		katex.options || {}
	].reduce(function (init, option) {
		for (let key in option) {
			init[key] = option[key];
		}
		return init;
	}, {});

	katex.options = katexOptions;
}

/**
 * @description create blacklist
 * @param {string} blacklist blacklist
 * @param {string} defaultLine options.get('defaultLine')
 * @returns {string}
 */
function _createBlacklist(blacklist, defaultLine) {
	defaultLine = defaultLine.toLowerCase();
	return blacklist
		.split('|')
		.filter(function (v) {
			if (v !== defaultLine) {
				return true;
			} else {
				console.warn('[SUNEDITOR.constructor.createBlacklist.warn] defaultLine("<' + defaultLine + '>") cannot be included in the blacklist and will be removed.');
				return false;
			}
		})
		.join('|');
}

/**
 * @description create formats regexp object.
 * @param {string} value value
 * @param {string} defaultValue default value
 * @param {string} blacklist blacklist
 * @returns {{reg: RegExp, str: string}}
 */
function _createFormatInfo(value, defaultValue, blacklist) {
	const str = (defaultValue + '|' + (typeof value === 'string' ? value.toLowerCase() : ''))
		.replace(/^\||\|$/g, '')
		.split('|')
		.filter(function (v) {
			return v && blacklist.indexOf(v) < 0;
		})
		.join('|');
	return {
		reg: new _w.RegExp('^(' + str + ')$', 'i'),
		str: str
	};
}

/**
 * @description create whitelist or blacklist.
 * @param {Object} o options
 * @returns {string} whitelist
 */
function _createWhitelist(o) {
	const blacklist = o.get('elementBlacklist').split('|');
	const whitelist = (o.get('__defaultElementWhitelist') + '|' + o.get('elementWhitelist') + '|' + o.get('formatLine').str + '|' + o.get('formatBrLine').str + '|' + o.get('formatClosureBlock').str + '|' + o.get('formatClosureBrLine').str)
		.replace(/(^\||\|$)/g, '')
		.split('|')
		.filter(function (v, i, a) {
			return v && a.indexOf(v) === i && blacklist.indexOf(v) < 0;
		});

	return whitelist.join('|');
}

/**
 * @description Suneditor's Default button list
 * @param {Object} options options
 */
function _defaultButtons(options, icons, lang) {
	const isRTL = options.get('_rtl');
	return {
		bold: ['', lang.bold, 'bold', '', icons.bold],
		underline: ['', lang.underline, 'underline', '', icons.underline],
		italic: ['', lang.italic, 'italic', '', icons.italic],
		strike: ['', lang.strike, 'strike', '', icons.strike],
		subscript: ['', lang.subscript, 'subscript', '', icons.subscript],
		superscript: ['', lang.superscript, 'superscript', '', icons.superscript],
		removeFormat: ['', lang.removeFormat, 'removeFormat', '', icons.erase],
		indent: ['', lang.indent, 'indent', '', isRTL ? icons.outdent : icons.indent],
		outdent: ['', lang.outdent, 'outdent', '', isRTL ? icons.indent : icons.outdent],
		fullScreen: ['se-code-view-enabled se-resizing-enabled', lang.fullScreen, 'fullScreen', '', icons.expansion],
		showBlocks: ['', lang.showBlocks, 'showBlocks', '', icons.show_blocks],
		codeView: ['se-code-view-enabled se-resizing-enabled', lang.codeView, 'codeView', '', icons.code_view],
		undo: ['se-resizing-enabled', lang.undo, 'undo', '', icons.undo],
		redo: ['se-resizing-enabled', lang.redo, 'redo', '', icons.redo],
		preview: ['se-resizing-enabled', lang.preview, 'preview', '', icons.preview],
		print: ['se-resizing-enabled', lang.print, 'print', '', icons.print],
		dir: ['', lang[isRTL ? 'dir_ltr' : 'dir_rtl'], 'dir', '', icons[isRTL ? 'dir_ltr' : 'dir_rtl']],
		dir_ltr: ['', lang.dir_ltr, 'dir_ltr', '', icons.dir_ltr],
		dir_rtl: ['', lang.dir_rtl, 'dir_rtl', '', icons.dir_rtl],
		save: ['se-resizing-enabled', lang.save, 'save', '', icons.save]
	};
}

/**
 * @description Create a group div containing each module
 * @returns {Object}
 */
function _createModuleGroup() {
	const oUl = domUtils.createElement('UL', { class: 'se-menu-list' });
	const oDiv = domUtils.createElement('DIV', { class: 'se-btn-module se-btn-module-border' }, oUl);

	return {
		div: oDiv,
		ul: oUl
	};
}

/**
 * @description Create a button element
 * @param {string} className className in button
 * @param {string} title Title in button
 * @param {string} dataCommand The data-command property of the button
 * @param {string} dataType The data-type property of the button ('modal', 'dropdown', 'command',  'container')
 * @param {string} innerHTML Html in button
 * @param {string} _disabled Button disabled
 * @param {Object} icons Icons
 * @returns {Object}
 */
function _createButton(className, title, dataCommand, dataType, innerHTML, _disabled, icons) {
	const oLi = domUtils.createElement('LI');
	const label = title || '';
	const oButton = domUtils.createElement('BUTTON', {
		type: 'button',
		class: 'se-btn se-tooltip' + (className ? ' ' + className : ''),
		'data-command': dataCommand,
		'data-type': dataType,
		'aria-label': label.replace(/<span .+<\/span>/, ''),
		tabindex: '-1'
	});

	if (/^default\./i.test(innerHTML)) {
		innerHTML = icons[innerHTML.replace(/^default\./i, '')];
	}
	if (/^text\./i.test(innerHTML)) {
		innerHTML = innerHTML.replace(/^text\./i, '');
		oButton.className += ' se-btn-more-text';
	}

	if (_disabled) oButton.setAttribute('disabled', true);

	if (label) innerHTML += '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + label + '</span></span>';
	if (innerHTML) oButton.innerHTML = innerHTML;

	oLi.appendChild(oButton);

	return {
		li: oLi,
		button: oButton
	};
}

export function UpdateButton(element, plugin, icons, lang) {
	if (!element) return;
	element.innerHTML = (icons[plugin.icon] || plugin.icon || '<span class="se-icon-text">!</span>') + '<span class="se-tooltip-inner"><span class="se-tooltip-text">' + (lang[plugin.title] || plugin.title) + '</span></span>';
	element.setAttribute('aria-label', plugin.title);
	if (plugin.type) element.setAttribute('data-type', plugin.type);
	if (plugin.className) element.className += ' ' + plugin.className;
}

/**
 * @description Create editor HTML
 * @param {Array} buttonList option.buttonList
 * @param {Object|null} plugins Plugins
 * @param {Array} options options
 * @param {Object} icons icons
 * @param {Object} lang lang
 * @returns {Object} { element: (Element) Toolbar element, plugins: (Array|null) Plugins Array, pluginCallButtons: (Object), responsiveButtons: (Array) }
 */
export function CreateToolBar(buttonList, plugins, options, icons, lang) {
	/** create button list */
	buttonList = _w.JSON.parse(_w.JSON.stringify(buttonList));
	const defaultButtonList = _defaultButtons(options, icons, lang);
	const pluginCallButtons = {};
	const responsiveButtons = [];

	let modules = null;
	let button = null;
	let plugin = null;
	let moduleElement = null;
	let buttonElement = null;
	let vertical = false;
	const moreLayer = domUtils.createElement('DIV', { class: 'se-toolbar-more-layer' });
	const buttonTray = domUtils.createElement('DIV', { class: 'se-btn-tray' });
	const separator_vertical = domUtils.createElement('DIV', { class: 'se-toolbar-separator-vertical' });

	buttonGroupLoop: for (let i = 0, more, moreContainer, moreCommand, buttonGroup, align; i < buttonList.length; i++) {
		more = false;
		align = '';
		buttonGroup = buttonList[i];
		moduleElement = _createModuleGroup();

		// button object
		if (typeof buttonGroup === 'object') {
			// buttons loop
			for (let j = 0, moreButton; j < buttonGroup.length; j++) {
				button = buttonGroup[j];
				moreButton = false;
				plugin = plugins[button];

				if (/^\%\d+/.test(button) && j === 0) {
					buttonGroup[0] = button.replace(/[^\d]/g, '');
					responsiveButtons.push(buttonGroup);
					buttonList.splice(i--, 1);
					continue buttonGroupLoop;
				}

				if (/function|object/.test(typeof plugin)) {
					modules = [plugin.className, plugin.title, button, plugin.type, plugin.innerHTML, plugin._disabled];
				} else {
					// align
					if (/^\-/.test(button)) {
						align = button.substr(1);
						moduleElement.div.className += ' module-float-' + align;
						continue;
					}

					// rtl fix
					if (/^\#/.test(button)) {
						const option = button.substr(1);
						if (option === 'fix') moduleElement.ul.className += ' se-menu-dir-fix';
						continue;
					}

					// more button
					if (/^\:/.test(button)) {
						moreButton = true;
						const matched = button.match(/^\:([^\-]+)\-([^\-]+)/);
						moreCommand = '__se__more_' + i;
						const title = matched[1].trim();
						const innerHTML = matched[2].trim();
						modules = ['se-btn-more', /^lang\./i.test(title) ? lang[title.replace(/^lang\./i, '')] : title, moreCommand, 'MORE', innerHTML];
					} else {
						// default command
						modules = defaultButtonList[button];
					}

					if (!modules) {
						if (!plugin) throw Error('[SUNEDITOR.create.toolbar.fail] The button name of a plugin that does not exist. [' + button + ']');
						modules = [plugin.className, plugin.title, plugin.key, plugin.type, plugin.innerHTML, plugin._disabled];
					}
				}

				buttonElement = _createButton(modules[0], modules[1], modules[2], modules[3], modules[4], modules[5], icons);
				(more ? moreContainer : moduleElement.ul).appendChild(buttonElement.li);

				if (plugin) {
					if (pluginCallButtons[button]) pluginCallButtons[button].push(buttonElement.button);
					else pluginCallButtons[button] = [buttonElement.button];
				}

				// more button
				if (moreButton) {
					more = true;
					moreContainer = domUtils.createElement('DIV');
					moreContainer.className = 'se-more-layer ' + moreCommand;
					moreContainer.setAttribute('data-ref', moreCommand);
					moreContainer.innerHTML = '<div class="se-more-form"><ul class="se-menu-list"' + (align ? ' style="float: ' + align + ';"' : '') + '></ul></div>';
					moreLayer.appendChild(moreContainer);
					moreContainer = moreContainer.firstElementChild.firstElementChild;
				}
			}

			if (vertical) {
				const sv = separator_vertical.cloneNode(false);
				buttonTray.appendChild(sv);
			}

			buttonTray.appendChild(moduleElement.div);
			vertical = true;
		} else if (/^\/$/.test(buttonGroup)) {
			/** line break  */
			const enterDiv = domUtils.createElement('DIV', { class: 'se-btn-module-enter' });
			buttonTray.appendChild(enterDiv);
			vertical = false;
		}
	}

	switch (buttonTray.children.length) {
		case 0:
			buttonTray.style.display = 'none';
			break;
		case 1:
			domUtils.removeClass(buttonTray.firstElementChild, 'se-btn-module-border');
			break;
		default:
			if (options.get('_rtl')) {
				const sv = separator_vertical.cloneNode(false);
				sv.style.float = buttonTray.lastElementChild.style.float;
				buttonTray.appendChild(sv);
			}
	}

	if (moreLayer.children.length > 0) buttonTray.appendChild(moreLayer);
	if (responsiveButtons.length > 0) responsiveButtons.unshift(buttonList);

	// rendering toolbar
	const tool_bar = domUtils.createElement('DIV', { class: 'se-toolbar sun-editor-common' + (!options.get('shortcutsHint') ? ' se-shortcut-hide' : '') }, buttonTray);

	if (options.get('toolbar_hide')) tool_bar.style.display = 'none';

	return {
		element: tool_bar,
		pluginCallButtons: pluginCallButtons,
		responsiveButtons: responsiveButtons,
		buttonTray: buttonTray
	};
}

export default Constructor;