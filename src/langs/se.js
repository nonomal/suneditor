(function (global, factory) {
	if (typeof module === 'object' && typeof module.exports === 'object') {
		module.exports = global.document
			? factory(global, true)
			: function (w) {
				if (!w.document) {
					throw new Error('SUNEDITOR_LANG a window with a document');
				}
				return factory(w);
			};
	} else {
		factory(global);
	}
})(typeof window !== 'undefined' ? window : this, function (window, noGlobal) {
	const lang = {
		code: 'se',
		align: 'Justering',
		alignCenter: 'Mittenjusteirng',
		alignJustify: 'Justera indrag',
		alignLeft: 'Vänsterjustering',
		alignRight: 'Högerjustering',
		audio: 'Ljud',
		audio_modal_file: 'Lägg till från fil',
		audio_modal_title: 'Lägg till ljud',
		audio_modal_url: 'Lägg till från URL',
		autoSize: 'Autostorlek',
		backgroundColor: 'Bakgrundsfärg',
		basic: 'Basic',
		bold: 'Fet',
		caption: 'Lägg till beskrivning',
		center: 'Center',
		close: 'Stäng',
		codeView: 'Visa koder',
		default: 'Default',
		deleteColumn: 'Ta bort kolumner',
		deleteRow: 'Ta bort rad',
		dir_ltr: 'Vänster till höger',
		dir_rtl: 'Höger till vänster',
		edit: 'Redigera',
		fixedColumnWidth: 'Fast kolumnbredd',
		font: 'Typsnitt',
		fontColor: 'Textfärg',
		fontSize: 'Textstorlek',
		formats: 'Format',
		fullScreen: 'Helskärm',
		height: 'Höjd',
		horizontalLine: 'Horisontell linje',
		horizontalSplit: 'Separera horisontalt',
		hr_dashed: 'Prickad',
		hr_dotted: 'Punkter',
		hr_solid: 'Solid',
		image: 'Bild',
		imageGallery: 'Bildgalleri',
		image_modal_altText: 'Alternativ text',
		image_modal_file: 'Lägg till från fil',
		image_modal_title: 'Lägg till bild',
		image_modal_url: 'Lägg till från URL',
		indent: 'Minska indrag',
		insertColumnAfter: 'Lägg till kolumn efter',
		insertColumnBefore: 'Lägg till kolumn före',
		insertRowAbove: 'Lägg till rad över',
		insertRowBelow: 'Lägg till rad under',
		italic: 'Kursiv',
		layout: 'Layout',
		left: 'Vänster',
		lineHeight: 'Linjehöjd',
		link: 'Länk',
		link_modal_bookmark: 'Bokmärke',
		link_modal_downloadLinkCheck: 'Nedladdningslänk',
		link_modal_newWindowCheck: 'Öppna i nytt fönster',
		link_modal_text: 'Länktext',
		link_modal_title: 'Lägg till länk',
		link_modal_url: 'URL till länk',
		list: 'Listor',
		math: 'Math',
		math_modal_fontSizeLabel: 'Textstorlek',
		math_modal_inputLabel: 'Matematisk notation',
		math_modal_previewLabel: 'Preview',
		math_modal_title: 'Math',
		maxSize: 'Maxstorlek',
		mention: 'Namn',
		menu_bordered: 'Avgränsningslinje',
		menu_code: 'Kod',
		menu_neon: 'Neon',
		menu_shadow: 'Skugga',
		menu_spaced: 'Avstånd',
		menu_translucent: 'Genomskinlig',
		mergeCells: 'Sammanfoga celler (merge)',
		minSize: 'Minsta storlek',
		mirrorHorizontal: 'Spegling, horisontell',
		mirrorVertical: 'Spegling, vertikal',
		orderList: 'Numrerad lista',
		outdent: 'Öka indrag',
		paragraphStyle: 'Stil på stycke',
		preview: 'Preview',
		print: 'Print',
		proportion: 'Spara proportioner',
		ratio: 'Förhållande',
		redo: 'Gör om',
		remove: 'Ta bort',
		removeFormat: 'Ta bort formattering',
		resize100: 'Förstora 100%',
		resize25: 'Förstora 25%',
		resize50: 'Förstora 50%',
		resize75: 'Förstora 75%',
		resize: 'Resize',
		revert: 'Återgå',
		right: 'Höger',
		rotateLeft: 'Rotera till vänster',
		rotateRight: 'Rotera till höger',
		save: 'Spara',
		search: 'Sök',
		showBlocks: 'Visa block',
		size: 'Storlek',
		splitCells: 'Separera celler',
		strike: 'Överstruket',
		submitButton: 'Skicka',
		subscript: 'Sänkt skrift',
		superscript: 'Höjd skrift',
		table: 'Tabell',
		tableHeader: 'Rubrik tabell',
		tags: 'Tags',
		tag_blockquote: 'Citer',
		tag_div: 'Normal (DIV)',
		tag_h: 'Rubrik',
		tag_p: 'Paragraf',
		tag_pre: 'Kod',
		template: 'Mall',
		textStyle: 'Textstil',
		title: 'Title',
		underline: 'Understruket',
		undo: 'Ångra',
		unlink: 'Ta bort länk',
		unorderList: 'Oordnad lista',
		verticalSplit: 'Separera vertikalt',
		video: 'Video',
		video_modal_file: 'Lägg till från fil',
		video_modal_title: 'Lägg till video',
		video_modal_url: 'Bädda in video / YouTube,Vimeo',
		width: 'Bredd',
	};

	if (typeof noGlobal === typeof undefined) {
		if (!window.SUNEDITOR_LANG) {
			Object.defineProperty(window, 'SUNEDITOR_LANG', {
				enumerable: true,
				writable: false,
				configurable: false,
				value: {}
			});
		}

		Object.defineProperty(window.SUNEDITOR_LANG, 'se', {
			enumerable: true,
			writable: true,
			configurable: true,
			value: lang
		});
	}

	return lang;
});
