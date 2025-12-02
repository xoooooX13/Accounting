import React, { useEffect, useState } from 'react';
import { GenericTable, Column } from '../components/GenericTable';
import { db } from '../services/mockDb';
import { Transaction, InventoryItem, EntityType } from '../types';

interface PageProps {
  type: EntityType | 'all_transactions';
  title: string;
}

const GenericEntityPage: React.FC<PageProps> = ({ type, title }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Simulate specialized fetching based on type
      if (type === 'inventory') {
        const res = await db.fetch(db.getInventory());
        setData(res);
      } else {
        const res = await db.fetch(db.getTransactions(type === 'all_transactions' ? undefined : type));
        setData(res);
      }
      setLoading(false);
    };

    fetchData();
  }, [type]);

  const transactionColumns: Column<Transaction>[] = [
    { header: 'Date', accessor: 'date' },
    { header: 'Reference', accessor: 'reference', className: 'font-mono text-xs text-accent' },
    { header: 'Party', accessor: 'partyName', className: 'font-medium text-white' },
    { 
      header: 'Amount', 
      accessor: (item: Transaction) => (
        <span className="font-semibold text-white">
          ${item.amount.toLocaleString()}
        </span>
      ) 
    },
    { 
      header: 'Status', 
      accessor: (item: Transaction) => (
        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
          item.status === 'paid' ? 'bg-success/20 text-success' :
          item.status === 'pending' ? 'bg-warning/20 text-warning' :
          'bg-danger/20 text-danger'
        }`}>
          {item.status}
        </span>
      ) 
    },
  ];

  const inventoryColumns: Column<InventoryItem>[] = [
    { header: 'SKU', accessor: 'sku', className: 'font-mono text-xs text-accent' },
    { header: 'Product Name', accessor: 'name', className: 'font-medium text-white' },
    { header: 'Quantity', accessor: 'quantity' },
    { 
        header: 'Unit Price', 
        accessor: (item: InventoryItem) => `$${item.unitPrice}` 
    },
    { 
      header: 'Status', 
      accessor: (item: InventoryItem) => (
        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
          item.status === 'in_stock' ? 'bg-success/20 text-success' :
          item.status === 'low_stock' ? 'bg-warning/20 text-warning' :
          'bg-danger/20 text-danger'
        }`}>
          {item.status.replace('_', ' ')}
        </span>
      ) 
    },
  ];

  const columns = type === 'inventory' ? inventoryColumns : transactionColumns;

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
            <p className="text-gray-400 text-sm">Manage your {title.toLowerCase()} records here.</p>
          </div>
       </div>

       <GenericTable
          title={`${title} List`}
          data={data}
          columns={columns as any}
          loading={loading}
          onAdd={() => alert('Feature coming in next update')}
       />
    </div>
  );
};

export default GenericEntityPage;