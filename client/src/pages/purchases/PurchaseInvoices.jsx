import SalesTransactionPage from '../sales/SalesTransactionPage';

export default function PurchaseInvoices() {
  return (
    <SalesTransactionPage
      type="purchase_invoice"
      title="Purchase Invoice"
      createLabel="Create purchase invoice"
      endpoint="/invoices"
      endpointParams={{ type: 'purchase' }}
      createEndpoint="/invoices"
      emptyText="Sorry! No purchase invoices found."
    />
  );
}
