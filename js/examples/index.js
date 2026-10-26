import { element } from '../../components/playground.js';
import { createCard } from '../../components/card.js';
import { createDashboardLayout } from '../../components/dashboard-layout.js';
import { createAlert } from '../../components/alert.js';

export function render(container) {
  container.replaceChildren(createDashboardLayout({
    header: element('div', { className: 'page-heading' }, element('div', {}, element('h1', {}, 'Product examples'), element('p', {}, 'One design system. Three browser-local workspaces.'))),
    metrics: [createAlert({ title: 'Mock data', message: 'These examples use local demonstration records. No server writes or real transactions.', tone: 'info' })],
    content: [
      ['erp', 'ERP', 'Review orders, track stock and prepare invoices.'],
      ['crm', 'CRM', 'Manage customer relationships, pipeline and activities.'],
      ['school', 'School', 'Manage students, attendance, grades and lessons.']
    ].map(([domain, title, description]) => ({ span: 4, element: createCard({ title, content: element('div', {}, element('p', {}, description), element('a', { className: 'ds-button ds-button-primary', href: `#/examples/${domain}` }, `Explore ${title}`)) }) }))
  }));
}
