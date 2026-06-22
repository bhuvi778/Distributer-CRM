import SalesTransactionPage from './sales/SalesTransactionPage';

export default function Reports() {
  return (
    <SalesTransactionPage
      type="report"
      title="Reports"
      createLabel="Create report"
      emptyText="Sorry! No reports found."
      createEnabled={false}
    />
  );
}
