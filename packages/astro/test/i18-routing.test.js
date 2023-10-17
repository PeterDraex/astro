import { loadFixture } from './test-utils.js';
import { expect } from 'chai';
import * as cheerio from 'cheerio';

describe('[DEV] i18n routing', () => {
	describe('i18n routing', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;
		/** @type {import('./test-utils').DevServer} */
		let devServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/i18n-routing/',
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('should render the en locale', async () => {
			const response = await fixture.fetch('/en/start');
			expect(response.status).to.equal(200);
			expect(await response.text()).includes('Hello');

			const response2 = await fixture.fetch('/en/blog/1');
			expect(response2.status).to.equal(200);
			expect(await response2.text()).includes('Hello world');
		});

		it('should render localised page correctly', async () => {
			const response = await fixture.fetch('/pt/start');
			expect(response.status).to.equal(200);
			expect(await response.text()).includes('Hola');

			const response2 = await fixture.fetch('/pt/blog/1');
			expect(response2.status).to.equal(200);
			expect(await response2.text()).includes('Hola mundo');
		});

		it("should NOT render the default locale if there isn't a fallback and the route is missing", async () => {
			const response = await fixture.fetch('/it/start');
			expect(response.status).to.equal(404);
		});

		it("should render a 404 because the route `fr` isn't included in the list of locales of the configuration", async () => {
			const response = await fixture.fetch('/fr/start');
			expect(response.status).to.equal(404);
		});
	});

	describe('i18n routing, with base', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;
		/** @type {import('./test-utils').DevServer} */
		let devServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/i18n-routing-base/',
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('should render the en locale', async () => {
			const response = await fixture.fetch('/new-site/en/start');
			expect(response.status).to.equal(200);
			expect(await response.text()).includes('Hello');

			const response2 = await fixture.fetch('/new-site/en/blog/1');
			expect(response2.status).to.equal(200);
			expect(await response2.text()).includes('Hello world');
		});

		it('should render localised page correctly', async () => {
			const response = await fixture.fetch('/new-site/pt/start');
			expect(response.status).to.equal(200);
			expect(await response.text()).includes('Hola');

			const response2 = await fixture.fetch('/new-site/pt/blog/1');
			expect(response2.status).to.equal(200);
			expect(await response2.text()).includes('Hola mundo');
		});

		it("should NOT render the default locale if there isn't a fallback and the route is missing", async () => {
			const response = await fixture.fetch('/new-site/it/start');
			expect(response.status).to.equal(404);
		});

		it("should render a 404 because the route `fr` isn't included in the list of locales of the configuration", async () => {
			const response = await fixture.fetch('/new-site/fr/start');
			expect(response.status).to.equal(404);
		});
	});

	describe('i18n routing with fallback [redirect]', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;
		/** @type {import('./test-utils').DevServer} */
		let devServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/i18n-routing-fallback/',
				experimental: {
					i18n: {
						defaultLocale: 'en',
						locales: ['en', 'pt', 'it'],
						fallback: {
							it: ['en'],
						},
						fallbackControl: 'redirect',
					},
				},
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('should render the en locale', async () => {
			const response = await fixture.fetch('/new-site/en/start');
			expect(response.status).to.equal(200);
			expect(await response.text()).includes('Hello');

			const response2 = await fixture.fetch('/new-site/en/blog/1');
			expect(response2.status).to.equal(200);
			expect(await response2.text()).includes('Hello world');
		});

		it('should render localised page correctly', async () => {
			const response = await fixture.fetch('/new-site/pt/start');
			expect(response.status).to.equal(200);
			expect(await response.text()).includes('Hola');

			const response2 = await fixture.fetch('/new-site/pt/blog/1');
			expect(response2.status).to.equal(200);
			expect(await response2.text()).includes('Hola mundo');
		});

		it('should render the english locale, which is the first fallback', async () => {
			const response = await fixture.fetch('/new-site/it/start');
			expect(response.status).to.equal(200);
			expect(await response.text()).includes('Hello');
		});

		it("should render a 404 because the route `fr` isn't included in the list of locales of the configuration", async () => {
			const response = await fixture.fetch('/new-site/fr/start');
			expect(response.status).to.equal(404);
		});
	});
});

describe('[SSG] i18n routing', () => {
	describe('i18n routing', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/i18n-routing/',
			});
			await fixture.build();
		});

		it('should render the en locale', async () => {
			let html = await fixture.readFile('/en/start/index.html');
			let $ = cheerio.load(html);
			expect($('body').text()).includes('Hello');

			html = await fixture.readFile('/en/blog/1/index.html');
			$ = cheerio.load(html);
			expect($('body').text()).includes('Hello world');
		});

		it('should render localised page correctly', async () => {
			let html = await fixture.readFile('/pt/start/index.html');
			let $ = cheerio.load(html);
			expect($('body').text()).includes('Hola');

			html = await fixture.readFile('/pt/blog/1/index.html');
			$ = cheerio.load(html);
			expect($('body').text()).includes('Hola mundo');
		});

		it("should NOT render the default locale if there isn't a fallback and the route is missing", async () => {
			try {
				await fixture.readFile('/it/start/index.html');
				// failed
				return false;
			} catch {
				// success
				return true;
			}
		});

		it("should render a 404 because the route `fr` isn't included in the list of locales of the configuration", async () => {
			try {
				await fixture.readFile('/fr/start/index.html');
				// failed
				return false;
			} catch {
				// success
				return true;
			}
		});
	});

	describe('i18n routing, with base', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/i18n-routing-base/',
			});
			await fixture.build();
		});

		it('should render the en locale', async () => {
			let html = await fixture.readFile('/en/start/index.html');
			let $ = cheerio.load(html);
			expect($('body').text()).includes('Hello');

			html = await fixture.readFile('/en/blog/1/index.html');
			$ = cheerio.load(html);
			expect($('body').text()).includes('Hello world');
		});

		it('should render localised page correctly', async () => {
			let html = await fixture.readFile('/pt/start/index.html');
			let $ = cheerio.load(html);
			expect($('body').text()).includes('Hola');

			html = await fixture.readFile('/pt/blog/1/index.html');
			$ = cheerio.load(html);
			expect($('body').text()).includes('Hola mundo');
		});

		it("should NOT render the default locale if there isn't a fallback and the route is missing", async () => {
			try {
				await fixture.readFile('/it/start/index.html');
				// failed
				return false;
			} catch {
				// success
				return true;
			}
		});

		it("should render a 404 because the route `fr` isn't included in the list of locales of the configuration", async () => {
			try {
				await fixture.readFile('/fr/start/index.html');
				// failed
				return false;
			} catch {
				// success
				return true;
			}
		});
	});

	describe('i18n routing with fallback [redirect]', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/i18n-routing-fallback/',
				experimental: {
					i18n: {
						defaultLocale: 'en',
						locales: ['en', 'pt', 'it'],
						fallback: {
							it: ['en'],
						},
						fallbackControl: 'redirect',
					},
				},
			});
			await fixture.build();
		});

		it('should render the en locale', async () => {
			let html = await fixture.readFile('/en/start/index.html');
			let $ = cheerio.load(html);
			expect($('body').text()).includes('Hello');

			html = await fixture.readFile('/en/blog/1/index.html');
			$ = cheerio.load(html);
			expect($('body').text()).includes('Hello world');
		});

		it('should render localised page correctly', async () => {
			let html = await fixture.readFile('/pt/start/index.html');
			let $ = cheerio.load(html);
			expect($('body').text()).includes('Hola');

			html = await fixture.readFile('/pt/blog/1/index.html');
			$ = cheerio.load(html);
			expect($('body').text()).includes('Hola mundo');
		});

		it('should render the english locale, which is the first fallback', async () => {
			const html = await fixture.readFile('/it/start/index.html');
			expect(html).to.include('http-equiv="refresh');
			console.log(html);
			expect(html).to.include('url=/new-site/en/start');
		});

		it("should render a 404 because the route `fr` isn't included in the list of locales of the configuration", async () => {
			try {
				await fixture.readFile('/fr/start/index.html');
				// failed
				return false;
			} catch {
				// success
				return true;
			}
		});
	});
});