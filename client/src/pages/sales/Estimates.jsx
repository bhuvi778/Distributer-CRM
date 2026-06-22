import SalesTransactionPage from './SalesTransactionPage';

export default function Estimates() {
  return (
    <SalesTransactionPage
      type="estimate"
      title="Estimate"
      createLabel="Create estimate"
      endpoint="/sales/estimates"
      createEndpoint="/sales/estimates"
      settingsMode="estimate"
    />
  );
}
