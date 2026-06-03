import DataPage from '../components/common/DataPage';
import { formatCurrency } from '../utils/helpers';

export default function Production() {
  return (
    <DataPage
      title="Production"
      subtitle="Multilevel BOM, work orders, finished goods testing and cost tracking"
      endpoint="/production"
      columns={[
        { key: 'orderNumber', label: 'Order #', accessor: 'orderNumber' },
        { key: 'product', label: 'Finished Good', accessor: 'finishedGood.name' },
        { key: 'qty', label: 'Quantity', accessor: 'quantity' },
        { key: 'cost', label: 'Actual Cost', accessor: 'actualCost', type: 'currency' },
        { key: 'quality', label: 'Quality', accessor: 'qualityStatus', type: 'badge' },
        { key: 'status', label: 'Status', accessor: 'status', type: 'badge' },
      ]}
      formFields={[
        { name: 'quantity', label: 'Quantity', type: 'number', required: true },
        { name: 'status', label: 'Status', type: 'select', options: [
          { value: 'planned', label: 'Planned' }, { value: 'in_progress', label: 'In Progress' },
          { value: 'quality_check', label: 'Quality Check' }, { value: 'completed', label: 'Completed' },
        ]},
        { name: 'qualityStatus', label: 'Quality Status', type: 'select', options: [
          { value: 'pending', label: 'Pending' }, { value: 'passed', label: 'Passed' }, { value: 'failed', label: 'Failed' },
        ]},
        { name: 'otherCharges', label: 'Other Charges', type: 'number' },
        { name: 'notes', label: 'Notes', type: 'textarea', full: true },
      ]}
      defaultForm={{ status: 'planned', qualityStatus: 'pending', quantity: 0, otherCharges: 0, bom: [] }}
    />
  );
}
