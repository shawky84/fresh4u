/* Run: node test/enquiry.test.js */
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const F = require(path.join(__dirname, '..', 'js', 'site.js'));

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log('ok ' + passed + ' - ' + name);
}

const sample = {
  product: 'Sweet potatoes Beauregard',
  size: 'L1',
  packaging: 'Carton boxes',
  volume: '1 x 40 ft reefer per week',
  destination: 'Rotterdam, Netherlands',
  terms: 'CIF',
  contact: 'Acme Produce, Jane Smith'
};

const expected = [
  'Hello Fresh 4 U, please send us an offer.',
  '',
  'Product: Sweet potatoes Beauregard',
  'Size: L1',
  'Packaging: Carton boxes',
  'Volume: 1 x 40 ft reefer per week',
  'Destination: Rotterdam, Netherlands',
  'Terms: CIF',
  'From: Acme Produce, Jane Smith'
].join('\n');

check('message for the sample input', () => {
  assert.equal(F.buildMessage(sample), expected);
});

check('message leaves out empty fields and the size of other produce', () => {
  const message = F.buildMessage({ product: 'Grapes', size: 'L1', destination: ' Hamburg ' });
  assert.equal(message, 'Hello Fresh 4 U, please send us an offer.\n\nProduct: Grapes\nDestination: Hamburg');
});

check('WhatsApp link for the sample input', () => {
  const url = F.whatsappUrl(expected);
  assert.equal(url, 'https://wa.me/201127222204?text=' + encodeURIComponent(expected));
  assert.ok(url.startsWith('https://wa.me/201127222204?text=Hello%20Fresh%204%20U%2C%20please%20send%20us%20an%20offer.%0A%0AProduct%3A%20Sweet%20potatoes%20Beauregard%0ASize%3A%20L1'));
  assert.equal(decodeURIComponent(url.split('?text=')[1]), expected);
});

check('mailto link for the sample input', () => {
  const url = F.mailtoUrl(sample.product, expected);
  assert.ok(url.startsWith('mailto:FarahShawki@fresh4ueg.com?subject=Enquiry%3A%20Sweet%20potatoes%20Beauregard&body='));
  assert.equal(decodeURIComponent(url.split('&body=')[1]), expected.replace(/\n/g, '\r\n'));
});

check('required fields: product and destination', () => {
  assert.deepEqual(F.validate(sample), {});
  assert.deepEqual(Object.keys(F.validate({})), ['product', 'destination']);
  assert.deepEqual(Object.keys(F.validate({ product: 'Garlic', destination: '  ' })), ['destination']);
});

check('season in January: both varieties', () => {
  const s = F.seasonStatus(0);
  assert.deepEqual(s.inSeason, ['Beauregard', 'Bellevue']);
  assert.equal(s.text, 'In season now: Beauregard and Bellevue');
});

check('season in June: no harvest', () => {
  const s = F.seasonStatus(5);
  assert.deepEqual(s.inSeason, []);
  assert.equal(s.text, 'Next harvest starts in July');
});

check('season in August: both varieties', () => {
  assert.equal(F.seasonStatus(7).text, 'In season now: Beauregard and Bellevue');
});

check('season at the edges: February, May and July', () => {
  assert.equal(F.seasonStatus(1).text, 'In season now: Beauregard');
  assert.equal(F.seasonStatus(4).text, 'In season now: Beauregard');
  assert.equal(F.seasonStatus(6).text, 'In season now: Bellevue');
});

console.log('\n' + passed + ' checks passed');
