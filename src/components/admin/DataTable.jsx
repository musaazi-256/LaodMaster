import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../ui/table';
import SkeletonLoader from '../feedback/SkeletonLoader';
import EmptyState from '../feedback/EmptyState';
import { cn } from '../../lib/utils';

export default function DataTable({ columns = [], rows = [], loading = false, onRowClick, emptyTitle = 'No records', emptyDescription, className }) {
  return (
    <div className={cn('rounded-card border border-neutral-200 bg-white overflow-hidden shadow-1', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className="text-small text-neutral-500 uppercase tracking-wide">
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading &&
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    <SkeletonLoader width="80%" />
                  </TableCell>
                ))}
              </TableRow>
            ))}

          {!loading &&
            rows.map((row, i) => (
              <TableRow
                key={row.id ?? i}
                onClick={() => onRowClick?.(row)}
                className={cn(onRowClick && 'cursor-pointer hover:bg-neutral-50')}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className="text-neutral-900">
                    {col.render ? col.render(row) : row[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>

      {!loading && rows.length === 0 && (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}
    </div>
  );
}
