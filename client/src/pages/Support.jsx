import DataPage from '../components/common/DataPage';

export default function Support() {
  return (
    <DataPage
      title="Customer Support"
      subtitle="Query resolution via phone, email, WhatsApp and in-app support"
      endpoint="/support"
      columns={[
        { key: 'ticketNumber', label: 'Ticket #', accessor: 'ticketNumber' },
        { key: 'subject', label: 'Subject', accessor: 'subject' },
        { key: 'category', label: 'Category', accessor: 'category', type: 'badge' },
        { key: 'priority', label: 'Priority', accessor: 'priority', type: 'badge' },
        { key: 'status', label: 'Status', accessor: 'status', type: 'badge' },
        { key: 'channel', label: 'Channel', accessor: 'channel', type: 'badge' },
        { key: 'createdBy', label: 'Created By', accessor: 'createdBy.name' },
      ]}
      formFields={[
        { name: 'subject', label: 'Subject', required: true, full: true },
        { name: 'description', label: 'Description', type: 'textarea', full: true },
        { name: 'category', label: 'Category', type: 'select', options: [
          { value: 'billing', label: 'Billing' }, { value: 'technical', label: 'Technical' },
          { value: 'feature', label: 'Feature Request' }, { value: 'integration', label: 'Integration' },
          { value: 'other', label: 'Other' },
        ]},
        { name: 'priority', label: 'Priority', type: 'select', options: [
          { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' },
        ]},
        { name: 'channel', label: 'Channel', type: 'select', options: [
          { value: 'in_app', label: 'In App' }, { value: 'phone', label: 'Phone' },
          { value: 'email', label: 'Email' }, { value: 'whatsapp', label: 'WhatsApp' },
        ]},
      ]}
      defaultForm={{ category: 'other', priority: 'medium', channel: 'in_app', status: 'open' }}
    />
  );
}
