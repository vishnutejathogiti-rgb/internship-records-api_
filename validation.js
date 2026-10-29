const allowedModes = ['Remote', 'Hybrid', 'On-site'];
const allowedTypes = ['Internship', 'Full-time', 'Part-time', 'Contract'];
const allowedStatuses = ['open', 'closed', 'draft'];
function validateInternship(body, partial = false) {
  const errors = {};
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, errors: { body: 'A JSON object is required' } };
  }
  const fields = ['title','company','location','mode','type','description','skills','apply_url','status'];
  if (partial) {
    for (const key of Object.keys(body)) if (!fields.includes(key)) errors[key] = 'Unknown field';
  }
  const data = {};
  const required = ['title','company','description'];
  for (const key of required) {
    if (body[key] === undefined || body[key] === null || String(body[key]).trim() === '')
      errors[key] = 'This field is required';
  }
  const stringRules = {
    title: [3,120], company: [2,100], location: [2,120], description: [10,2000]
  };
  for (const [key, [min,max]] of Object.entries(stringRules)) {
    if (body[key] !== undefined) {
      if (typeof body[key] !== 'string') errors[key] = 'Must be a string';
      else {
        data[key] = body[key].trim();
        if (data[key].length < min || data[key].length > max)
          errors[key] = `Must contain ${min}–${max} characters`;
      }
    }
  }
  if (body.mode !== undefined) {
    if (!allowedModes.includes(body.mode)) errors.mode = `Must be one of: ${allowedModes.join(', ')}`;
    else data.mode = body.mode;
  }
  if (body.type !== undefined) {
    if (!allowedTypes.includes(body.type)) errors.type = `Must be one of: ${allowedTypes.join(', ')}`;
    else data.type = body.type;
  }
  if (body.status !== undefined) {
    if (!allowedStatuses.includes(body.status)) errors.status = `Must be one of: ${allowedStatuses.join(', ')}`;
    else data.status = body.status;
  }
  if (body.skills !== undefined) {
    if (!Array.isArray(body.skills) || body.skills.length > 30 ||
      body.skills.some(s => typeof s !== 'string' || !s.trim() || s.trim().length > 40)) {
      errors.skills = 'Must be an array of up to 30 non-empty strings (max 40 characters each)';
    } else data.skills = [...new Set(body.skills.map(s => s.trim()))];
  }
  if (body.apply_url !== undefined) {
    if (typeof body.apply_url !== 'string' || (body.apply_url && !/^https?:\/\/\S+$/i.test(body.apply_url)))
      errors.apply_url = 'Must be a valid http or https URL';
    else data.apply_url = body.apply_url.trim();
  }
  if (partial) {
    for (const key of fields) if (body[key] === undefined) delete data[key];
  } else {
    data.location ??= 'Remote'; data.mode ??= 'Remote'; data.type ??= 'Internship';
    data.skills ??= []; data.apply_url ??= ''; data.status ??= 'open';
  }
  return { valid: Object.keys(errors).length === 0, errors, data };
}
module.exports = { validateInternship };