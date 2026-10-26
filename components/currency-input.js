import { element, playground, toggleControl, choiceControl, statusMessage } from './playground.js';
import { createFormField } from './form-field.js';
import { formatCurrency, parseCurrency } from '../js/logic/currency.js';

export function createCurrencyInput({ label = 'Amount', value = null, locale = 'en-US', currency = 'USD', disabled = false, required = false, onChange = () => {}, ...formatOptions } = {}) {
  const options = { locale, currency, ...formatOptions };
  const input = element('input', { type: 'text', inputmode: 'decimal', className: 'ds-input ds-currency-input', disabled, required });
  const field = createFormField({label, control: input, required, hint: `${currency} · ${locale}. Enter a localized amount; formatting applies on blur.`});
  input.required = required;
  function setValue(next) { input.value = formatCurrency(next, options); field.setError(''); }
  function commit() {
    if (!input.value.trim() && !required) { field.setError(''); onChange(null); return true; }
    const number = parseCurrency(input.value, options);
    if (number === null) { field.setError(`Enter a valid ${currency} amount for ${locale}.`); return false; }
    input.value = formatCurrency(number, options);
    field.setError(''); onChange(parseCurrency(input.value, options)); return true;
  }
  input.addEventListener('input', () => { field.setError(''); onChange(parseCurrency(input.value, options)); });
  input.addEventListener('blur', commit);
  input.addEventListener('keydown', event => { if (event.key === 'Enter') commit(); });
  setValue(value);
  return { element: field.element, input, get value() { return parseCurrency(input.value, options); }, setValue, validate: commit, setError: field.setError, setDisabled(next) { input.disabled = next; } };
}
export const guide = {
  purpose: 'Edit a localized monetary amount with Intl currency parsing and formatting.',
  props: ['createCurrencyInput({label,value,locale="en-US",currency="USD",disabled,required,onChange,...IntlOptions}) returns element,input,value,setValue,validate,setError,setDisabled. Values are numbers or null.'],
  variants: ['Locale-specific separators, currency symbols and currency fraction digits.'], states: ['Empty, editing, formatted, invalid, disabled.'],
  keyboard: ['Native text editing; blur or Enter validates and formats.'],
  accessibility: ['Persistent label and visible currency/locale instructions; invalid text is preserved with an associated error.'],
  tokens: ['--text, --muted, --border, --surface'], responsive: ['Full width with tabular numerals and 16px text on phones.'],
  do: ['Choose the correct locale/currency and review financial values before submitting.'], dont: ['Do not use display strings as canonical financial data or imply backend processing.'],
  example: 'createCurrencyInput({label: "Mock amount", locale: "de-DE", currency: "EUR", value: 1234.56})'
};
export function render(container) {
  const page = playground(container, {title: 'CurrencyInput', description: 'Locale-aware mock money; no transaction occurs.'});
  let locale = 'en-US'; let currency = 'USD'; let value = 1234.56; let disabled = false;
  const status = statusMessage('Mock amount: 1234.56');
  let control;
  function update() { control = createCurrencyInput({label: 'Mock amount', locale, currency, value, disabled, onChange: next => { value = next; status.textContent = `Mock amount: ${next ?? 'empty or invalid'}`; }}); page.preview.replaceChildren(control.element, status); }
  page.controls.append(choiceControl('Locale and currency', 'en-US', [{value: 'en-US', label: 'English · USD'}, {value: 'de-DE', label: 'German · EUR'}, {value: 'ja-JP', label: 'Japanese · JPY'}, {value: 'ar-EG', label: 'Arabic · EGP'}], next => { locale = next; currency = {'en-US':'USD','de-DE':'EUR','ja-JP':'JPY','ar-EG':'EGP'}[next]; update(); }), toggleControl('Disabled', false, next => { disabled = next; control.setDisabled(next); }));
  page.states.append(createCurrencyInput({label: 'Mock euro amount', locale: 'de-DE', currency: 'EUR', value: 1234.56}).element);
  update(); page.setSnippet(guide.example);
}
