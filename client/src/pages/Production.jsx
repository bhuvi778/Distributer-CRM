import DataPage from '../components/common/DataPage';
import { useLocation } from 'react-router-dom';

const MODES = {
  grm: {
    type: 'grm',
    title: 'GRM',
    subtitle: 'Goods receipt and raw material movement for production',
  },
  bom: {
    type: 'bom',
    title: 'BOM',
    subtitle: 'Bill of materials, raw material quantities and expected cost',
  },
  'work-orders': {
    type: 'work_order',
    title: 'Work Orders',
    subtitle: 'Planned production jobs, material allocation and status tracking',
  },
  'production-orders': {
    type: 'production_order',
    title: 'Production Orders',
    subtitle: 'Finished goods production, quality status and actual cost tracking',
  },
};

export default function Production() {
  const { pathname } = useLocation();
  const key = pathname.split('/').filter(Boolean).pop();
  const mode = MODES[key] || MODES['production-orders'];

  return (
    <DataPage
      title={mode.title}
      subtitle={mode.subtitle}
      endpoint={`/production?productionType=${mode.type}`}
      columns={[
        { key: 'orderNumber', label: 'Order #', accessor: 'orderNumber' },
        { key: 'reference', label: 'Reference', accessor: 'referenceNumber' },
        { key: 'title', label: 'Title', accessor: 'title' },
        { key: 'material', label: 'Item / Material', accessor: 'materialName' },
        { key: 'qty', label: 'Quantity', accessor: 'quantity' },
        { key: 'cost', label: 'Actual Cost', accessor: 'actualCost', type: 'currency' },
        { key: 'status', label: 'Status', accessor: 'status', type: 'badge' },
      ]}
      formFields={[
        { name: 'referenceNumber', label: 'Reference No.', type: 'text' },
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'materialName', label: 'Item / Material Name', type: 'text' },
        { name: 'quantity', label: 'Quantity', type: 'number' },
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
      defaultForm={{
        productionType: mode.type,
        referenceNumber: '',
        title: '',
        materialName: '',
        status: 'planned',
        qualityStatus: 'pending',
        quantity: 0,
        otherCharges: 0,
        bom: [],
      }}
    />
  );
}
