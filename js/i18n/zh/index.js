import shell, * as shellModule from './shell.js';
import kits, * as kitsModule from './kits.js';
import learn, * as learnModule from './learn.js';
import componentsA, * as componentsAModule from './components-a.js';
import componentsB, * as componentsBModule from './components-b.js';
import componentsC, * as componentsCModule from './components-c.js';
import erp, * as erpModule from './erp.js';
import crm, * as crmModule from './crm.js';
import school, * as schoolModule from './school.js';
import dates, * as datesModule from './dates.js';
import fill, * as fillModule from './fill.js';
import fill2, * as fill2Module from './fill-2.js';
import fill3, * as fill3Module from './fill-3.js';
import fill4, * as fill4Module from './fill-4.js';
import fill5, * as fill5Module from './fill-5.js';
import charts, * as chartsModule from './charts.js';
import patterns, * as patternsModule from './patterns.js';

export const zhSources = { shell, kits, learn, 'components-a': componentsA, 'components-b': componentsB, 'components-c': componentsC, erp, crm, school, dates, fill, 'fill-2': fill2, 'fill-3': fill3, 'fill-4': fill4, 'fill-5': fill5, charts, patterns };
export const zhMessages = Object.assign({}, ...Object.values(zhSources));
// Text that is deliberately identical in both languages; the i18n scan treats it as translated.
export const zhKeepEnglish = [shellModule, kitsModule, learnModule, componentsAModule, componentsBModule, componentsCModule, erpModule, crmModule, schoolModule, datesModule, fillModule, fill2Module, fill3Module, fill4Module, fill5Module, chartsModule, patternsModule].flatMap(module => module.keepEnglish);
