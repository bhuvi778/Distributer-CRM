import SalesTransactionPage from './sales/SalesTransactionPage';

export default function Orders() {
  return (
    <SalesTransactionPage
      type="order"
      title="Sales Order"
      createLabel="Create sales order"
      endpoint="/orders"
      createEndpoint="/orders"
    />
  );
}
