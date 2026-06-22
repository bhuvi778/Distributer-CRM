import SalesTransactionPage from './SalesTransactionPage';

export default function SalesReturns() {
  return (
    <SalesTransactionPage
      type="return"
      title="Sales Return"
      createLabel="Create sales return"
      endpoint="/sales/returns"
      createEndpoint="/sales/returns"
    />
  );
}
