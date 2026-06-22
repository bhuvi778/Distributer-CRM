import SalesTransactionPage from '../sales/SalesTransactionPage';

export default function PurchaseReturns() {
  return (
    <SalesTransactionPage
      type="purchase_return"
      title="Purchase Return"
      createLabel="Create purchase return"
      endpoint="/purchase-returns"
      createEndpoint="/purchase-returns"
      emptyText="Sorry! No purchase returns found."
    />
  );
}
