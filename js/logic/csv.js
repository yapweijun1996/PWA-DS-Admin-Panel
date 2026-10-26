export class CSVParseError extends SyntaxError {
  constructor(message, line, column) {
    super(`${message} (line ${line}, column ${column}).`);
    this.name = 'CSVParseError';
    this.line = line;
    this.column = column;
  }
}

export function parseCSV(input) {
  if (typeof input !== 'string') throw new TypeError('CSV input must be text.');
  const source = input.replace(/^\uFEFF/, '');
  if (!source) return [];
  const rows = [];
  let row = [], field = '', state = 'start', line = 1, column = 1;
  let endedRow = false;
  for (let index = 0; index < source.length; index++) {
    const character = source[index];
    const newline = character === '\r' || character === '\n';
    const crlf = character === '\r' && source[index + 1] === '\n';
    endedRow = false;
    if (state === 'quoted') {
      if (character === '"') {
        if (source[index + 1] === '"') { field += '"'; index++; column++; }
        else state = 'closed';
      } else if (newline) {
        field += crlf ? '\r\n' : character;
        if (crlf) index++;
      } else field += character;
    } else if (character === ',') {
      row.push(field); field = ''; state = 'start';
    } else if (newline) {
      row.push(field); rows.push(row); row = []; field = ''; state = 'start'; endedRow = true;
      if (crlf) index++;
    } else if (character === '"' && state === 'start') {
      state = 'quoted';
    } else if (character === '"') {
      throw new CSVParseError('Unexpected quote in an unquoted field', line, column);
    } else if (state === 'closed') {
      throw new CSVParseError('Expected a comma or line break after a closing quote', line, column);
    } else {
      field += character; state = 'plain';
    }
    if (newline) { line++; column = 1; } else column++;
  }
  if (state === 'quoted') throw new CSVParseError('Unclosed quoted field', line, column);
  if (!endedRow) { row.push(field); rows.push(row); }
  return rows;
}

function encodeCell(value) {
  let cell = String(value ?? '');
  // Prefix text that spreadsheet applications might execute, including hidden whitespace.
  if (typeof value === 'string' && (/^[\s]*[=+\-@]/u.test(cell) || /^[\t\r\n]/u.test(cell))) cell = `'${cell}`;
  return cell === '' || /[",\r\n]/u.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell;
}

export function exportCSV(rows, { columns } = {}) {
  if (!Array.isArray(rows)) throw new TypeError('CSV rows must be an array.');
  const objectRows = rows.length > 0 && !Array.isArray(rows[0]);
  const headings = columns ?? (objectRows ? Object.keys(rows[0]) : null);
  const output = [];
  if (headings) output.push(headings.map(column => encodeCell(typeof column === 'string' ? column : column.label ?? column.key)).join(','));
  for (const row of rows) {
    const values = Array.isArray(row) ? row : (headings ?? []).map(column => row?.[typeof column === 'string' ? column : column.key]);
    output.push(values.map(encodeCell).join(','));
  }
  return output.join('\r\n');
}
