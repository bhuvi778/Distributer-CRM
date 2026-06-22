import SalesTransactionPage from './SalesTransactionPage';

export default function DeliveryChallans() {
  return (
    <SalesTransactionPage
      type="challan"
      title="Delivery Challan"
      createLabel="Create delivery challan"
      endpoint="/sales/delivery-challans"
      createEndpoint="/sales/delivery-challans"
    />
  );
}
