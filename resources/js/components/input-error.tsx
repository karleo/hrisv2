import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export default function InputError({
    message,
    className = '',
    ...props
}: HTMLAttributes<HTMLParagraphElement> & {
    message?: string | string[];
}) {
    if (message === undefined || message === '') {
        return null;
    }

    const lines = Array.isArray(message) ? message : [message];

    return (
        <p
            {...props}
            className={cn('text-sm text-red-600 dark:text-red-400', className)}
        >
            {lines.join(' ')}
        </p>
    );
}
