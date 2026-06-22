import SalesTransactionPage from './sales/SalesTransactionPage';

export default function Purchases() {
  return (
    <SalesTransactionPage
      type="purchase_order"
      title="Purchase Order"
      createLabel="Create purchase order"
      endpoint="/purchases"
      createEndpoint="/purchases"
      emptyText="Sorry! No purchase orders found."
    />
  );
}
