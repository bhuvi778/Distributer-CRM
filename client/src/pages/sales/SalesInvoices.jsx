import SalesTransactionPage from './SalesTransactionPage';

export default function SalesInvoices() {
  return (
    <SalesTransactionPage
      type="invoice"
      title="Sales Invoice"
      createLabel="Create sales invoice"
      endpoint="/invoices"
      endpointParams={{ type: 'sales' }}
      createEndpoint="/invoices"
    />
  );
}
