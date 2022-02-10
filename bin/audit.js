#!/usr/bin/env node

// An example of running Pa11y on multiple URLS
'use strict';

const pa11y = require('pa11y');
const htmlReporter = require('pa11y/lib/reporters/html');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const Handlebars = require('handlebars');
const open = require('open');

const indexTemplateStr = fs.readFileSync(path.resolve(__dirname, 'templates/index.hbs')).toString('utf8');
const indexTemplate = Handlebars.compile(indexTemplateStr);

const theCwd = process.cwd();

const breiConfig = require(theCwd + '/_config/_brei.json');

const projectType = breiConfig['type'];
let deployDir = breiConfig['deploy'];

const auditPath = 'audit';
let componentPath = 'pages';
let rootPath = path.join(auditPath, componentPath);

if (projectType === 'pattern') {
	componentPath = 'components';

	deployDir = path.join(deployDir, 'components/preview');
	rootPath = path.join(auditPath, componentPath);
}

const templatesThatPassed = [];

if (!fs.existsSync(path.join(theCwd, rootPath))){
	fs.mkdirSync(path.join(theCwd, rootPath), { recursive: true });
}

glob('*.html', {
	cwd: deployDir
}, (err, files) => {

	if (!err) {
		buildHtmlFiles(files);
	}

});

function writeHtmlFile(file, contents) {
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
}

async function buildHtmlFiles(files) {

	try {

		const options = {
			reporter: 'html',
			runners: [
				'axe',
				'htmlcs'
			],
			standard: 'WCAG2AA',
			includeWarnings: true,
			threshold: 20
		};

		let promises = [];

		for (const i in files) {

			const result = await pa11y(path.join(deployDir, files[i]), options);

			if (result.issues.length === 0) {
				templatesThatPassed[files[i]] = true;
			}

			result.pageUrl = files[i];

			let html = await htmlReporter.results(result);

			promises.push(writeHtmlFile(path.join(rootPath, files[i]), html));

		}

		Promise.all(promises).catch(err => {
			console.log(err);
		}).finally(_ => {

			let auditResults = [];

			glob('*.html', {
				cwd: rootPath
			}, (err, files) => {

				if (!err) {

					for (const i in files) {

						auditResults.push({
							'label': files[i],
							'url': path.join(componentPath, files[i]),
							'passed': (typeof templatesThatPassed[files[i]] !== 'undefined')
						});

					}

					console.log(auditResults);

					console.log(path.join(theCwd, auditPath, 'index.html'));

					fs.writeFile(path.join(auditPath, 'index.html'), indexTemplate({ results: auditResults }), {}, err => {
						if (err) {
							console.log(err);
						} else {
							console.log('Index written');

							open(path.join(theCwd, auditPath, 'index.html'));

						}
					});

				}

			});

			console.log('done');
		});

	} catch (error) {
		console.error(error.message);
	}

}

//
// runExample();
//
// // Async function required for us to use await
// async function runExample() {
// 	try {
//
// 		// Put together some options to use in each test
// 		const options = {
// 			reporter: 'html',
// 			log: {
// 				debug: console.log,
// 				error: console.error,
// 				info: console.log
// 			},
// 			runners: [
// 				'axe',
// 				'htmlcs'
// 			],
// 			standard: 'WCAG2A',
// 			includeWarnings: true
// 		};
//
// 		// Run tests against multiple URLs
// 		const results = await Promise.all([
// 			pa11y('web/components/preview/sidebar.html', options)
// 		]);
//
// 		let fileName = 'sidebar.html';
// 		let stream = fs.createWriteStream(fileName);
//
// 		results[0].pageUrl = 'sidebar.html';
//
//
// 		// Output the raw result objects
// 		let html = await htmlReporter.results(results[0]);
//
//
// 		fs.writeFileSync('sidebar.html', html, err => {
// 			if (err) {
// 				console.error(err);
// 				return;
// 			}
// 		});
//
// 		console.log(results[0]); // Results for the first URL
//
// 	} catch (error) {
//
// 		// Output an error if it occurred
// 		console.error(error.message);
//
// 	}
// }
