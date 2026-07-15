export const STATUS_LABELS: Record<string, string> = {
    SUBMITTED: 'Under Review',
    APPROVED: 'Approved',
    WAITLISTED: 'Waitlisted',
    REJECTED: 'Rejected',
    INFO_REQUIRED: 'Additional Information Required',
    PAID: 'Payment Complete',
};

export const STATUS_COLORS: Record<string, string> = {
    SUBMITTED: 'bg-gray-100 text-gray-600 border-gray-200',
    APPROVED: 'bg-green-50 text-green-700 border-green-200',
    WAITLISTED: 'bg-amber-50 text-amber-700 border-amber-200',
    REJECTED: 'bg-red-50 text-brand-red border-red-200',
    INFO_REQUIRED: 'bg-blue-50 text-brand-blue border-blue-200',
    PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function StatusBadge({ status }: { status: string }) {
    const label = STATUS_LABELS[status] || status;
    const color = STATUS_COLORS[status] || 'bg-gray-100 text-gray-600 border-gray-200';
    return (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${color}`}>
            {label}
        </span>
    );
}
