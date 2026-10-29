const test = require('node:test');
const assert = require('node:assert/strict');
const { validateInternship } = require('../src/validation');

const valid = {
  title: 'Data Analyst Intern', company: 'Example Co',
  description: 'Analyze data and prepare reports for the team.',
  location: 'Remote', mode: 'Remote', type: 'Internship',
  skills: ['SQL', 'Python'], apply_url: 'https://example.com/apply', status: 'open'
};

test('accepts a valid internship record', () => {
  const result = validateInternship(valid);
  assert.equal(result.valid, true);
  assert.deepEqual(result.data.skills, ['SQL', 'Python']);
});
test('rejects missing required fields', () => {
  const result = validateInternship({ title: 'x' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.company);
  assert.ok(result.errors.description);
});
test('rejects invalid mode', () => {
  const result = validateInternship({ ...valid, mode: 'Moon' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.mode);
});
test('rejects invalid apply URL', () => {
  const result = validateInternship({ ...valid, apply_url: 'javascript:alert(1)' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.apply_url);
});
test('deduplicates skills', () => {
  const result = validateInternship({ ...valid, skills: ['SQL', 'SQL'] });
  assert.deepEqual(result.data.skills, ['SQL']);
});