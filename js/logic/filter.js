export const FILTER_OPERATORS = Object.freeze({
  equals: 'is', notEquals: 'is not', contains: 'contains', notContains: 'does not contain',
  startsWith: 'starts with', endsWith: 'ends with', gt: 'is greater than',
  gte: 'is at least', lt: 'is less than', lte: 'is at most',
  isEmpty: 'is empty', isNotEmpty: 'is not empty',
});

const text = value => String(value ?? '').toLocaleLowerCase();
const empty = value => value == null || String(value).trim() === '';
const numeric = value => !empty(value) && Number.isFinite(Number(value));

function validate(conditions, match) {
  if (!Array.isArray(conditions)) throw new TypeError('Filters must be an array.');
  if (!['all', 'any'].includes(match)) throw new TypeError('Filter match must be all or any.');
  for (const condition of conditions) {
    if (!condition || typeof condition.field !== 'string' || !condition.field || !Object.hasOwn(FILTER_OPERATORS, condition.operator)) {
      throw new TypeError('Each filter requires a field and a supported operator.');
    }
  }
}

function matches(actual, { operator, value }) {
  switch (operator) {
    case 'isEmpty': return empty(actual);
    case 'isNotEmpty': return !empty(actual);
    case 'equals': return text(actual) === text(value);
    case 'notEquals': return text(actual) !== text(value);
    case 'contains': return text(actual).includes(text(value));
    case 'notContains': return !text(actual).includes(text(value));
    case 'startsWith': return text(actual).startsWith(text(value));
    case 'endsWith': return text(actual).endsWith(text(value));
    case 'gt': return numeric(actual) && numeric(value) && Number(actual) > Number(value);
    case 'gte': return numeric(actual) && numeric(value) && Number(actual) >= Number(value);
    case 'lt': return numeric(actual) && numeric(value) && Number(actual) < Number(value);
    case 'lte': return numeric(actual) && numeric(value) && Number(actual) <= Number(value);
    default: return false;
  }
}

export function createFilterPredicate(conditions = [], { match = 'all' } = {}) {
  validate(conditions, match);
  const filters = conditions.map(condition => ({ ...condition }));
  return row => filters.length === 0 || filters[match === 'all' ? 'every' : 'some'](condition => matches(row?.[condition.field], condition));
}

export function summarizeFilters(conditions = [], { match = 'all', fields = [] } = {}) {
  validate(conditions, match);
  if (!conditions.length) return 'All records';
  return conditions.map(condition => {
    const field = fields.find(item => (item.key ?? item.value ?? item.name) === condition.field);
    const label = field?.label ?? condition.field;
    const description = `${label} ${FILTER_OPERATORS[condition.operator]}`;
    return ['isEmpty', 'isNotEmpty'].includes(condition.operator) ? description : `${description} ${JSON.stringify(String(condition.value ?? ''))}`;
  }).join(match === 'all' ? ' AND ' : ' OR ');
}
