import { env } from '../helper';

/**
 *
 * @param {*} inst
 * @param {Object|null=} params
 * @param {string|null=} params.method - HTTP method (GET, POST, PUT, DELETE...)
 * @param {string|null=} params.url - API's URL
 * @param {Object|null=} params.headers - HTTP headers
 * @param {Object|null=} params.data - API data
 * @param {Function|null=} params.callBack - API success callback
 * @param {Function|null=} params.errorCallBack - API fail callback
 * @param {string|null=} params.responseType - XMLHttpRequest.responseType
 */
const ApiManager = function (inst, params) {
	this.editor = inst.editor;
	this.kind = inst.constructor.key;

	// members
	this._xhr = env.getXMLHttpRequest();
	// members - option
	this.method = params?.method;
	this.url = params?.url;
	this.headers = params?.headers;
	this.data = params?.data;
	this.callBack = params?.callBack;
	this.errorCallBack = params?.errorCallBack;
	this.responseType = params?.responseType;
};

ApiManager.prototype = {
	/**
	 * @description Call API
	 * @param {Object|null=} params
	 * @param {string|null=} params.method - HTTP method (GET, POST, PUT, DELETE...)
	 * @param {string|null=} params.url - API's URL
	 * @param {Object|null=} params.headers - HTTP headers
	 * @param {Object|null=} params.data - API data
	 * @param {Function|null=} params.callBack - API success callback
	 * @param {Function|null=} params.errorCallBack - API fail callback
	 * @param {string|null=} params.responseType - XMLHttpRequest.responseType
	 */
	call({ method, url, headers, data, callBack, errorCallBack, responseType }) {
		this.cancel();

		method = method || this.method;
		url = this._normalizeUrl(url || this.url);
		headers = headers || this.headers;
		data = data || this.data;
		callBack = callBack || this.callBack;
		errorCallBack = errorCallBack || this.errorCallBack;
		responseType = responseType || this.responseType;

		const xhr = this._xhr;
		if (responseType) xhr.responseType = responseType;
		xhr.onreadystatechange = CallBackApi.bind(this, xhr, callBack, errorCallBack);
		xhr.open(method, url, true);
		if (headers !== null && typeof headers === 'object' && Object.keys(headers).length > 0) {
			for (const key in headers) {
				xhr.setRequestHeader(key, headers[key]);
			}
		}

		xhr.send(data);
	},

	/**
	 * @description Call Async API
	 * @param {Object|null=} params
	 * @param {string|null=} params.method - HTTP method (GET, POST, PUT, DELETE...)
	 * @param {string|null=} params.url - API's URL
	 * @param {Object|null=} params.headers - HTTP headers
	 * @param {Object|null=} params.data - API data
	 * @param {string|null=} params.responseType - XMLHttpRequest.responseType
	 */
	asyncCall({ method, url, headers, data, responseType }) {
		this.cancel();

		method = method || this.method;
		url = this._normalizeUrl(url || this.url);
		headers = headers || this.headers;
		data = data || this.data;
		responseType = responseType || this.responseType;

		const xhr = this._xhr;
		if (responseType) xhr.responseType = responseType;
		return new Promise((resolve, reject) => {
			xhr.open(method, url, true);
			if (headers !== null && typeof headers === 'object' && Object.keys(headers).length > 0) {
				for (const key in headers) {
					xhr.setRequestHeader(key, headers[key]);
				}
			}
			xhr.onload = () => {
				if (xhr.status === 200) {
					try {
						resolve(xhr);
					} finally {
						this.editor.hideLoading();
					}
				} else {
					try {
						const res = !xhr.responseText ? xhr : JSON.parse(xhr.responseText);
						reject(res, xhr);
					} finally {
						this.editor.hideLoading();
					}
				}
			};

			xhr.onerror = () => {
				reject(new Error('Network error'));
			};

			xhr.send(data);
		});
	},

	/**
	 * @description Cancel API (xhr.abort())
	 */
	cancel() {
		if (this._xhr) this._xhr.abort();
	},

	/**
	 * @description Remove unnecessary slashes in API URL.
	 * @param {string} url url
	 * @returns
	 */
	_normalizeUrl(url) {
		return url.replace(/([^:])\/+/g, '$1/').replace(/\/(\?|#|$)/, '$1');
	},

	constructor: ApiManager
};

async function CallBackApi(xmlHttp, callBack, errorCallBack) {
	if (xmlHttp.readyState === 4) {
		if (xmlHttp.status === 200) {
			try {
				await callBack(xmlHttp);
			} catch (error) {
				throw Error(`[SUNEDITOR.ApiManager[${this.kind}].upload.callBack.fail] ${error.message}`);
			} finally {
				this.editor.hideLoading();
			}
		} else {
			// exception
			console.error(`[SUNEDITOR.ApiManager[${this.kind}].upload.serverException]`, xmlHttp);
			try {
				const res = !xmlHttp.responseText ? xmlHttp : JSON.parse(xmlHttp.responseText);
				let message = '';
				if (typeof errorCallBack === 'function') {
					message = await errorCallBack(res, xmlHttp);
				}
				const err = `[SUNEDITOR.ApiManager[${this.kind}].upload.serverException] status: ${xmlHttp.status}, response: ${message || res.errorMessage || xmlHttp.responseText}`;
				this.editor.notice.open(err);
			} catch (error) {
				throw Error(`[SUNEDITOR.ApiManager[${this.kind}].upload.errorCallBack.fail] ${error.message}`);
			} finally {
				this.editor.hideLoading();
			}
		}
	}
}

export default ApiManager;