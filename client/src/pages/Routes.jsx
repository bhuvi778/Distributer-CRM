import DataPage from '../components/common/DataPage';

export default function Routes() {
  return (
    <DataPage
      title="Route Planner"
      subtitle="Create and manage routes with route-based access control"
      endpoint="/routes"
      columns={[
        { key: 'name', label: 'Route Name', accessor: 'name' },
        { key: 'code', label: 'Code', accessor: 'code' },
        { key: 'area', label: 'Area', accessor: 'area' },
        { key: 'city', label: 'City', accessor: 'city' },
        { key: 'reps', label: 'Sales Reps', accessor: 'assignedReps', render: (v) => v?.length || 0 },
        { key: 'outlets', label: 'Outlets', accessor: 'outlets', render: (v) => v?.length || 0 },
        { key: 'distance', label: 'Distance (km)', accessor: 'estimatedDistance' },
      ]}
      formFields={[
        { name: 'name', label: 'Route Name', required: true },
        { name: 'code', label: 'Route Code' },
        { name: 'area', label: 'Area' },
        { name: 'city', label: 'City' },
        { name: 'state', label: 'State' },
        { name: 'estimatedDistance', label: 'Est. Distance (km)', type: 'number' },
        { name: 'description', label: 'Description', type: 'textarea', full: true },
      ]}
      defaultForm={{ isActive: true }}
    />
  );
}
