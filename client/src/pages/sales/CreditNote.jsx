import SalesTransactionPage from './SalesTransactionPage';

export default function CreditNote() {
  return (
    <SalesTransactionPage
      type="credit_note"
      title="Credit Note"
      createLabel="Create credit note"
      endpoint="/sales/credit-notes"
      createEndpoint="/sales/credit-notes"
    />
  );
}
