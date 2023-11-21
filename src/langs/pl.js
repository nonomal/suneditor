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
		code: 'pl',
		align: 'Wyrównaj',
		alignCenter: 'Do środka',
		alignJustify: 'Wyjustuj',
		alignLeft: 'Do lewej',
		alignRight: 'Do prawej',
		audio: 'Audio',
		audio_modal_file: 'Wybierz plik',
		audio_modal_title: 'Wstaw audio',
		audio_modal_url: 'Adres URL audio',
		autoSize: 'Rozmiar automatyczny',
		backgroundColor: 'Kolor tła tekstu',
		basic: 'Bez wyrównania',
		bold: 'Pogrubienie',
		caption: 'Wstaw opis',
		center: 'Do środka',
		close: 'Zamknij',
		codeView: 'Widok kodu',
		default: 'Domyślne',
		deleteColumn: 'Usuń kolumnę',
		deleteRow: 'Usuń wiersz',
		dir_ltr: 'Od lewej do prawej',
		dir_rtl: 'Od prawej do lewej',
		edit: 'Edycja',
		fixedColumnWidth: 'Stała szerokość kolumny',
		font: 'Czcionka',
		fontColor: 'Kolor tekstu',
		fontSize: 'Rozmiar',
		formats: 'Formaty',
		fullScreen: 'Pełny ekran',
		height: 'Wysokość',
		horizontalLine: 'Pozioma linia',
		horizontalSplit: 'Podział poziomy',
		hr_dashed: 'Przerywana',
		hr_dotted: 'Kropkowana',
		hr_solid: 'Ciągła',
		image: 'Obraz',
		imageGallery: 'Galeria obrazów',
		image_modal_altText: 'Tekst alternatywny',
		image_modal_file: 'Wybierz plik',
		image_modal_title: 'Wstaw obraz',
		image_modal_url: 'Adres URL obrazka',
		indent: 'Zwiększ wcięcie',
		insertColumnAfter: 'Wstaw kolumnę z prawej',
		insertColumnBefore: 'Wstaw kolumnę z lewej',
		insertRowAbove: 'Wstaw wiersz powyżej',
		insertRowBelow: 'Wstaw wiersz poniżej',
		italic: 'Kursywa',
		layout: 'Layout',
		left: 'Do lewej',
		lineHeight: 'Odstęp między wierszami',
		link: 'Odnośnik',
		link_modal_bookmark: 'Zakładka',
		link_modal_downloadLinkCheck: 'Link do pobrania',
		link_modal_newWindowCheck: 'Otwórz w nowym oknie',
		link_modal_text: 'Tekst do wyświetlenia',
		link_modal_title: 'Wstaw odnośnik',
		link_modal_url: 'Adres URL',
		list: 'Lista',
		math: 'Matematyczne',
		math_modal_fontSizeLabel: 'Rozmiar czcionki',
		math_modal_inputLabel: 'Zapis matematyczny',
		math_modal_previewLabel: 'Podgląd',
		math_modal_title: 'Matematyczne',
		maxSize: 'Maksymalny rozmiar',
		mention: 'Wzmianka',
		menu_bordered: 'Z obwódką',
		menu_code: 'Kod',
		menu_neon: 'Neon',
		menu_shadow: 'Cień',
		menu_spaced: 'Rozstawiony',
		menu_translucent: 'Półprzezroczysty',
		mergeCells: 'Scal komórki',
		minSize: 'Minimalny rozmiar',
		mirrorHorizontal: 'Odbicie lustrzane w poziomie',
		mirrorVertical: 'Odbicie lustrzane w pionie',
		orderList: 'Lista numerowana',
		outdent: 'Zmniejsz wcięcie',
		paragraphStyle: 'Styl akapitu',
		preview: 'Podgląd',
		print: 'Drukuj',
		proportion: 'Ogranicz proporcje',
		ratio: 'Proporcje',
		redo: 'Ponów',
		remove: 'Usuń',
		removeFormat: 'Wyczyść formatowanie',
		resize100: 'Zmień rozmiar - 100%',
		resize25: 'Zmień rozmiar - 25%',
		resize50: 'Zmień rozmiar - 50%',
		resize75: 'Zmień rozmiar - 75%',
		resize: 'Resize',
		revert: 'Cofnij zmiany',
		right: 'Do prawej',
		rotateLeft: 'Obróć w lewo',
		rotateRight: 'Obróć w prawo',
		save: 'Zapisz',
		search: 'Szukaj',
		showBlocks: 'Pokaż bloki',
		size: 'Rozmiar',
		splitCells: 'Podziel komórki',
		strike: 'Przekreślenie',
		submitButton: 'Zatwierdź',
		subscript: 'Indeks dolny',
		superscript: 'Indeks górny',
		table: 'Tabela',
		tableHeader: 'Nagłówek tabeli',
		tags: 'Tagi',
		tag_blockquote: 'Cytat',
		tag_div: 'Blok (DIV)',
		tag_h: 'Nagłówek H',
		tag_p: 'Akapit',
		tag_pre: 'Kod',
		template: 'Szablon',
		textStyle: 'Styl tekstu',
		title: 'Title',
		underline: 'Podkreślenie',
		undo: 'Cofnij',
		unlink: 'Usuń odnośnik',
		unorderList: 'Lista wypunktowana',
		verticalSplit: 'Podział pionowy',
		video: 'Wideo',
		video_modal_file: 'Wybierz plik',
		video_modal_title: 'Wstaw wideo',
		video_modal_url: 'Adres URL video, np. YouTube/Vimeo',
		width: 'Szerokość',
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

		Object.defineProperty(window.SUNEDITOR_LANG, 'pl', {
			enumerable: true,
			writable: true,
			configurable: true,
			value: lang
		});
	}

	return lang;
});
