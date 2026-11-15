const { httpError } = require('./httpError');
const venueFields = { layout: 100, floor_area: 100, facilities: 1500, accessibility: 1000, usage_notes: 2000 };
const equipmentFields = { booking_mode: 100, brand_model: 200, asset_tag: 100, condition: 100, specifications: 2000, accessories: 1500, collection_point: 300, return_instructions: 2000, usage_notes: 2000 };
function normalizeDetails(type, value) {
  if (value == null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) throw httpError(400, 'Resource details must be an object');
  const fields = type === 'equipment' ? equipmentFields : venueFields;
  const result = {};
  for (const [key, input] of Object.entries(value)) {
    if (!Object.hasOwn(fields,key)) throw httpError(400, 'Detail field is not supported for this resource type: ' + key);
    if (typeof input !== 'string' || input.length > fields[key]) throw httpError(400, key + ' must be text of at most ' + fields[key] + ' characters');
    if (input.trim()) result[key] = input.trim();
  }
  if (result.layout && !['theatre','classroom','boardroom','u_shape','flexible','fixed_workstations','other'].includes(result.layout)) throw httpError(400, 'Invalid room layout');
  if (result.booking_mode && !['on_site','collection'].includes(result.booking_mode)) throw httpError(400, 'Invalid equipment usage arrangement');
  if (result.condition && !['new','good','fair','needs_inspection'].includes(result.condition)) throw httpError(400, 'Invalid equipment condition');
  return result;
}
function parseDetails(value) {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  try { const parsed=JSON.parse(value); return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}; } catch { return {}; }
}
function attendeeCount(resource, value) {
  if (resource.type === 'equipment') return null;
  if (value == null) return null; // I allow older bookings that do not have an attendee count.
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) throw httpError(400, 'Attendees must be a positive whole number');
  if (resource.capacity && Number(value) > resource.capacity) throw httpError(400, 'Attendees exceed the seating capacity of ' + resource.capacity);
  return Number(value);
}
module.exports = { normalizeDetails, parseDetails, attendeeCount };
