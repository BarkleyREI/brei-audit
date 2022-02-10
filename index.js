'use strict';

const pa11y = require('pa11y');
const htmlReporter = require('pa11y/lib/reporters/html');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const Handlebars = require('handlebars');
const open = require('open');
const turndown = require('turndown');

const audit = module.exports = {

	convertHtmlToMarkdown: (html) => {

		const tds = new turndown();

		tds.remove(['head', 'style']);

		const md = tds.turndown(html);

		return md;

	},

	writeHtmlFile: (file, contents) => {
		return new Promise((resolve, reject) => {
			fs.writeFile(file, contents, {}, err => {
				if (err) {
					reject(err);
				} else {
					console.log('Audit created: ' + file);
					resolve();
				}
			});
		});
	},

	getAccessibilityData: async (component, url, opts) => {

		const result = await pa11y(url, opts);

		result.pageUrl = component.handle;

		return result;

	},

	getAccessibilityHtml: async (component, url, opts) => {

		const result = audit.getAccessibilityData(component, url, opts);

		return await htmlReporter.results(result);

	},

	getAccessibilityMarkdown: async (component, url, opts) => {

		const html = audit.getAccessibilityHtml(component, url, opts);

		let md = audit.convertHtmlToMarkdown(html);

		let intro = '---\n';
		intro += 'title: "Audit results for ' + component.handle + '"\n';
		intro += 'label: "' + component.label + '"\n';
		intro += '---\n\n';

		md = intro + md;

		return md;

	},

	writeAccessibilityFile: (component, scanDir, deployDir) => {

		return new Promise((resolve) => {
			audit.getAccessibilityMarkdown(component, path.join(scanDir, component.handle + '.html')).then(function (res) {

				// fs.writeFile('docs/audit/' + component.handle + '.html', res, () => {});
				fs.writeFile(deployDir + '/aa-' + component.handle + '.md', red, err => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			});
		});

	},

	buildAuditFile: async (component, url, dest, opts) => {

		let html = await audit.getAccessibilityMarkdown(component, url, opts);

		audit.writeHtmlFile(dest, html).then(function () {

		}, function (err) {
			console.log(err);
		});

	},

	getFractalComponents: (fractal) => {

		let comps = [];

		// console.log(fractal._items);

		for (let item of fractal._items) {

			let ccc = audit.getComponentsFromItem(item);

			comps = comps.concat(audit.getComponentsFromItem(item));

			// console.log(item);

		}

		return comps;

	},

	getComponentsFromItem: (item) => {

		// console.log(item);

		let ret = [];

		if (!item._isHidden) {

			if (item.isCollection) {

				for (let i of item._items) {
					ret = ret.concat(audit.getComponentsFromItem(i));
				}

			} else {
				ret.push(item);

				ret = ret.concat(audit.getVariantsFromItem(item));
			}

		}

		return ret;

	},

	getVariantsFromItem: (item) => {

		let ret = [];
		let variants = item._variants;

		// console.log(variants);

		if (variants._items.size > 1) {

			for (let i of variants._items) {
				// console.log(i);

				ret.push(i);
			}

		}

		// console.log(ret);

		return ret;

	}

};
