import * as React from 'react'
import { cn } from '@/utils/cn'

export const Table = ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
  <div className="w-full overflow-auto">
    <table {...props} className={cn('w-full caption-bottom text-sm', className)} />
  </div>
)

export const TableHeader   = (p: React.HTMLAttributes<HTMLTableSectionElement>) => <thead  {...p} />
export const TableBody     = (p: React.HTMLAttributes<HTMLTableSectionElement>) => <tbody  {...p} />
export const TableFooter   = (p: React.HTMLAttributes<HTMLTableSectionElement>) => <tfoot  {...p} />
export const TableRow      = (p: React.HTMLAttributes<HTMLTableRowElement>)     => <tr     {...p} />
export const TableHead     = (p: React.ThHTMLAttributes<HTMLTableCellElement>)  => <th     {...p} className={cn('px-4 py-2 text-left font-medium', p.className)} />
export const TableCell     = (p: React.TdHTMLAttributes<HTMLTableCellElement>)  => <td     {...p} className={cn('px-4 py-2',                           p.className)} />

// keep default export so old `import Table from` still works
export default Table 