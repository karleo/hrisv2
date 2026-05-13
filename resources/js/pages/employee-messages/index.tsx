import { Head, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCheck,
    Circle,
    MessageCircle,
    Search,
    Send,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { getEcho } from '@/lib/echo';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

type EmployeeProfile = {
    id: number;
    employee_code: string;
    first_name: string;
    last_name: string;
    full_name: string;
    department: string | null;
    job_position: string | null;
    photo_url: string | null;
};

type Message = {
    id: number;
    conversation_id: number;
    sender_employee_id: number;
    recipient_employee_id: number;
    body: string;
    read_at: string | null;
    created_at: string;
    pending?: boolean;
    client_message_id?: string;
};

type Conversation = {
    id: number | null;
    employee: EmployeeProfile;
    last_message: Message | null;
    last_message_at: string | null;
    unread_count: number;
};

type MessageSentPayload = {
    message: Message;
    conversation: Conversation;
};

type MessageReadPayload = {
    conversation_id: number;
    reader_employee_id: number;
    message_ids: number[];
    read_at: string;
};

type TypingPayload = {
    conversation_id: number;
    employee: { id: number; full_name: string };
    is_typing: boolean;
};

type PresenceEmployee = EmployeeProfile;

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Messages', href: '/employee-messages' },
];

function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

function formatMessageTime(value: string | null): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    return isToday
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString([], { day: '2-digit', month: 'short' });
}

function sameDay(a: string, b: string): boolean {
    return new Date(a).toDateString() === new Date(b).toDateString();
}

function upsertConversation(
    list: Conversation[],
    conversation: Conversation,
): Conversation[] {
    const without = list.filter((item) => item.id !== conversation.id);

    return [conversation, ...without].sort((a, b) => {
        const aTime = a.last_message_at
            ? new Date(a.last_message_at).getTime()
            : 0;
        const bTime = b.last_message_at
            ? new Date(b.last_message_at).getTime()
            : 0;

        return bTime - aTime;
    });
}

export default function Index({
    currentEmployee,
    conversations: initialConversations,
    selectedConversation: initialSelectedConversation,
    messages: initialMessages,
}: {
    currentEmployee: EmployeeProfile;
    conversations: Conversation[];
    selectedConversation: Conversation | null;
    messages: Message[];
}) {
    const { csrf_token: csrfToken } = usePage().props as {
        csrf_token?: string;
    };
    const [conversations, setConversations] =
        useState<Conversation[]>(initialConversations);
    const [selectedConversation, setSelectedConversation] =
        useState<Conversation | null>(initialSelectedConversation);
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [body, setBody] = useState('');
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<EmployeeProfile[]>([]);
    const [onlineEmployeeIds, setOnlineEmployeeIds] = useState<Set<number>>(
        new Set(),
    );
    const [onlineEmployees, setOnlineEmployees] = useState<EmployeeProfile[]>(
        [],
    );
    const [typingEmployeeId, setTypingEmployeeId] = useState<number | null>(
        null,
    );
    const [toast, setToast] = useState<string | null>(null);
    const [mobileListOpen, setMobileListOpen] = useState(
        initialSelectedConversation === null,
    );
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<number | null>(null);
    const typingSentAtRef = useRef<number>(0);
    const typingActiveRef = useRef<boolean>(false);
    const employeeMessagesReloadedAtRef = useRef<number>(0);

    const refreshEmployeeMessagesSharedProp = () => {
        const now = Date.now();
        if (now - employeeMessagesReloadedAtRef.current < 800) {
            return;
        }

        employeeMessagesReloadedAtRef.current = now;
        router.reload({
            only: ['employeeMessages'],
            preserveScroll: true,
            preserveState: true,
        });
    };

    const selectedEmployee = selectedConversation?.employee ?? null;
    const onlineEmployeesWithoutSelf = onlineEmployees.filter(
        (employee) => employee.id !== currentEmployee.id,
    );
    const selectedMessages = selectedConversation?.id
        ? messages.filter(
              (message) => message.conversation_id === selectedConversation.id,
          )
        : [];

    const headers = useMemo(
        () => ({
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        }),
        [csrfToken],
    );

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedMessages.length]);

    useEffect(() => {
        const query = search.trim();
        if (query.length < 2) {
            return;
        }

        const controller = new AbortController();

        fetch(`/employee-messages/search?q=${encodeURIComponent(query)}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        })
            .then((response) => response.json())
            .then((payload: { employees: EmployeeProfile[] }) =>
                setSearchResults(payload.employees),
            )
            .catch(() => undefined);

        return () => controller.abort();
    }, [search]);

    useEffect(() => {
        const echo = getEcho();
        if (!echo) {
            return;
        }

        const employeeChannel = echo.private(`employee.${currentEmployee.id}`);
        const presenceChannel = echo.join('employees.online');

        employeeChannel
            .listen('.employee.message.sent', (payload: MessageSentPayload) => {
                setConversations((current) =>
                    upsertConversation(current, payload.conversation),
                );
                setMessages((current) =>
                    current.some((message) => message.id === payload.message.id)
                        ? current
                        : [...current, payload.message],
                );

                if (selectedConversation?.id !== payload.conversation.id) {
                    setToast(
                        `New message from ${payload.conversation.employee.full_name}`,
                    );
                }

                refreshEmployeeMessagesSharedProp();
            })
            .listen('.employee.message.read', (payload: MessageReadPayload) => {
                setMessages((current) =>
                    current.map((message) =>
                        payload.message_ids.includes(message.id)
                            ? { ...message, read_at: payload.read_at }
                            : message,
                    ),
                );
            })
            .listen('.employee.message.typing', (payload: TypingPayload) => {
                if (!payload.is_typing) {
                    setTypingEmployeeId(null);
                    return;
                }

                setTypingEmployeeId(payload.employee.id);
                window.setTimeout(() => setTypingEmployeeId(null), 2500);
            });

        presenceChannel
            .here((employees: PresenceEmployee[]) => {
                setOnlineEmployeeIds(
                    new Set(employees.map((employee) => employee.id)),
                );
                setOnlineEmployees(
                    employees.filter(
                        (employee) => employee.id !== currentEmployee.id,
                    ),
                );
            })
            .joining((employee: PresenceEmployee) => {
                setOnlineEmployeeIds(
                    (current) => new Set([...current, employee.id]),
                );
                if (employee.id !== currentEmployee.id) {
                    setOnlineEmployees((current) => [
                        employee,
                        ...current.filter((item) => item.id !== employee.id),
                    ]);
                }
            })
            .leaving((employee: PresenceEmployee) => {
                setOnlineEmployeeIds((current) => {
                    const next = new Set(current);
                    next.delete(employee.id);
                    return next;
                });
                setOnlineEmployees((current) =>
                    current.filter((item) => item.id !== employee.id),
                );
            });

        return () => {
            echo.leave(`employee.${currentEmployee.id}`);
            echo.leave('employees.online');
        };
    }, [currentEmployee.id, selectedConversation?.id]);

    useEffect(() => {
        if (!selectedConversation?.id) {
            return;
        }

        fetch(
            `/employee-messages/conversations/${selectedConversation.id}/read`,
            {
                method: 'POST',
                headers,
                body: JSON.stringify({}),
            },
        ).then(() => {
            setConversations((current) =>
                current.map((conversation) =>
                    conversation.id === selectedConversation.id
                        ? { ...conversation, unread_count: 0 }
                        : conversation,
                ),
            );
        });
    }, [headers, selectedConversation?.id]);

    const openConversation = (conversation: Conversation) => {
        setSelectedConversation(conversation);
        setMobileListOpen(false);

        if (!conversation.id) {
            setMessages([]);
            return;
        }

        fetch(`/employee-messages/conversations/${conversation.id}`, {
            headers: { Accept: 'application/json' },
        })
            .then((response) => response.json())
            .then(
                (payload: {
                    conversation: Conversation;
                    messages: Message[];
                }) => {
                    setSelectedConversation(payload.conversation);
                    setMessages((current) => [
                        ...current.filter(
                            (message) =>
                                message.conversation_id !==
                                payload.conversation.id,
                        ),
                        ...payload.messages,
                    ]);
                    setConversations((current) =>
                        upsertConversation(current, payload.conversation),
                    );
                },
            );
    };

    const openEmployee = (employee: EmployeeProfile) => {
        fetch(`/employee-messages/employees/${employee.id}`, {
            headers: { Accept: 'application/json' },
        })
            .then((response) => response.json())
            .then(
                (payload: {
                    conversation: Conversation;
                    messages: Message[];
                }) => {
                    setSelectedConversation(payload.conversation);
                    setMessages((current) => [
                        ...current.filter(
                            (message) =>
                                message.conversation_id !==
                                payload.conversation.id,
                        ),
                        ...payload.messages,
                    ]);
                    if (payload.conversation.id) {
                        setConversations((current) =>
                            upsertConversation(current, payload.conversation),
                        );
                    }
                    setSearch('');
                    setSearchResults([]);
                    setMobileListOpen(false);
                },
            );
    };

    const sendTyping = (isTyping: boolean) => {
        if (!selectedConversation?.id) {
            return;
        }

        fetch('/employee-messages/typing', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                conversation_id: selectedConversation.id,
                is_typing: isTyping,
            }),
        });
    };

    const handleBodyChange = (value: string) => {
        setBody(value);
        const now = Date.now();
        const shouldSendTyping =
            !typingActiveRef.current || now - typingSentAtRef.current > 1200;

        if (shouldSendTyping) {
            typingActiveRef.current = true;
            typingSentAtRef.current = now;
            sendTyping(true);
        }

        if (typingTimeoutRef.current) {
            window.clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = window.setTimeout(
            () => {
                typingActiveRef.current = false;
                sendTyping(false);
            },
            1200,
        );
    };

    const sendMessage = (event: FormEvent) => {
        event.preventDefault();

        const text = body.trim();
        if (!text || !selectedEmployee) {
            return;
        }

        const clientMessageId = crypto.randomUUID();

        setBody('');

        if (selectedConversation?.id) {
            const pendingMessage: Message = {
                id: -Date.now(),
                conversation_id: selectedConversation.id,
                sender_employee_id: currentEmployee.id,
                recipient_employee_id: selectedEmployee.id,
                body: text,
                read_at: null,
                created_at: new Date().toISOString(),
                pending: true,
                client_message_id: clientMessageId,
            };

            setMessages((current) => [...current, pendingMessage]);
        }

        fetch('/employee-messages', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                recipient_employee_id: selectedEmployee.id,
                body: text,
                client_message_id: clientMessageId,
            }),
        })
            .then((response) => response.json())
            .then(
                (payload: {
                    message: Message;
                    conversation: Conversation;
                    client_message_id?: string;
                }) => {
                    setSelectedConversation(payload.conversation);
                    setMessages((current) => {
                        const withoutPending = current.filter(
                            (message) =>
                                message.client_message_id !==
                                payload.client_message_id,
                        );

                        if (
                            withoutPending.some(
                                (message) => message.id === payload.message.id,
                            )
                        ) {
                            return withoutPending;
                        }

                        return [...withoutPending, payload.message];
                    });
                    setConversations((current) =>
                        upsertConversation(current, payload.conversation),
                    );

                    refreshEmployeeMessagesSharedProp();
                },
            );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee Messages" />

            <div className="flex min-h-[calc(100vh-8rem)] flex-col bg-muted/30 p-4 md:p-6">
                {toast ? (
                    <button
                        type="button"
                        onClick={() => setToast(null)}
                        className="fixed top-4 right-4 z-50 rounded-lg border bg-background px-4 py-3 text-left text-sm shadow-lg"
                    >
                        {toast}
                    </button>
                ) : null}

                <div className="mx-auto grid h-[calc(100vh-10rem)] w-full max-w-7xl overflow-hidden rounded-2xl border bg-background shadow-sm lg:grid-cols-[360px_1fr]">
                    <aside
                        className={cn(
                            'border-r bg-card/60',
                            !mobileListOpen && 'hidden lg:block',
                        )}
                    >
                        <div className="border-b p-4">
                            <div className="flex items-center gap-2">
                                <MessageCircle className="size-5 text-primary" />
                                <h1 className="text-lg font-semibold">
                                    Messages
                                </h1>
                            </div>
                            <div className="relative mt-4">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setSearch(value);
                                        if (value.trim().length < 2) {
                                            setSearchResults([]);
                                        }
                                    }}
                                    placeholder="Search employees..."
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="h-[calc(100%-5.75rem)] overflow-y-auto">
                            {search.trim().length >= 2 ? (
                                <div className="p-2">
                                    {searchResults.length === 0 ? (
                                        <p className="px-3 py-4 text-sm text-muted-foreground">
                                            No employees found.
                                        </p>
                                    ) : (
                                        searchResults.map((employee) => (
                                            <EmployeeRow
                                                key={employee.id}
                                                employee={employee}
                                                isOnline={onlineEmployeeIds.has(
                                                    employee.id,
                                                )}
                                                onClick={() =>
                                                    openEmployee(employee)
                                                }
                                            />
                                        ))
                                    )}
                                </div>
                            ) : conversations.length === 0 &&
                              onlineEmployeesWithoutSelf.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center px-6 text-center text-sm text-muted-foreground">
                                    <MessageCircle className="mb-3 size-10 opacity-50" />
                                    No employees are online right now. Search
                                    for an employee to start a conversation.
                                </div>
                            ) : (
                                <div className="space-y-4 p-2">
                                    {onlineEmployeesWithoutSelf.length > 0 ? (
                                        <div>
                                            <div className="px-3 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                Online now
                                            </div>
                                            {onlineEmployeesWithoutSelf.map(
                                                (employee) => (
                                                    <EmployeeRow
                                                        key={employee.id}
                                                        employee={employee}
                                                        isOnline
                                                        onClick={() =>
                                                            openEmployee(
                                                                employee,
                                                            )
                                                        }
                                                    />
                                                ),
                                            )}
                                        </div>
                                    ) : null}

                                    {conversations.length > 0 ? (
                                        <div>
                                            <div className="px-3 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                Conversations
                                            </div>
                                            {conversations.map(
                                                (conversation) => (
                                                    <ConversationRow
                                                        key={
                                                            conversation.id ??
                                                            conversation
                                                                .employee.id
                                                        }
                                                        conversation={
                                                            conversation
                                                        }
                                                        active={
                                                            selectedConversation
                                                                ?.employee
                                                                .id ===
                                                            conversation
                                                                .employee.id
                                                        }
                                                        isOnline={onlineEmployeeIds.has(
                                                            conversation
                                                                .employee.id,
                                                        )}
                                                        onClick={() =>
                                                            openConversation(
                                                                conversation,
                                                            )
                                                        }
                                                    />
                                                ),
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </aside>

                    <main
                        className={cn(
                            'flex min-w-0 flex-col',
                            mobileListOpen && 'hidden lg:flex',
                        )}
                    >
                        {selectedEmployee ? (
                            <>
                                <div className="flex items-center gap-3 border-b bg-card/60 p-4">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="lg:hidden"
                                        onClick={() => setMobileListOpen(true)}
                                    >
                                        <ArrowLeft className="size-5" />
                                    </Button>
                                    <EmployeeAvatar
                                        employee={selectedEmployee}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate font-semibold">
                                            {selectedEmployee.full_name}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Circle
                                                className={cn(
                                                    'size-2 fill-current',
                                                    onlineEmployeeIds.has(
                                                        selectedEmployee.id,
                                                    )
                                                        ? 'text-green-500'
                                                        : 'text-muted-foreground',
                                                )}
                                            />
                                            {onlineEmployeeIds.has(
                                                selectedEmployee.id,
                                            )
                                                ? 'Online'
                                                : 'Offline'}
                                            {selectedEmployee.department
                                                ? ` · ${selectedEmployee.department}`
                                                : ''}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto bg-muted/20 p-4">
                                    <div className="mx-auto flex max-w-3xl flex-col gap-2">
                                        {selectedMessages.length === 0 ? (
                                            <div className="my-12 rounded-xl border bg-background p-6 text-center text-sm text-muted-foreground">
                                                No messages yet. Send the first
                                                message to{' '}
                                                {selectedEmployee.full_name}.
                                            </div>
                                        ) : (
                                            selectedMessages.map(
                                                (message, index) => (
                                                    <div key={message.id}>
                                                        {index === 0 ||
                                                        !sameDay(
                                                            selectedMessages[
                                                                index - 1
                                                            ].created_at,
                                                            message.created_at,
                                                        ) ? (
                                                            <div className="my-4 text-center text-xs text-muted-foreground">
                                                                {new Date(
                                                                    message.created_at,
                                                                ).toLocaleDateString(
                                                                    [],
                                                                    {
                                                                        day: '2-digit',
                                                                        month: 'short',
                                                                        year: 'numeric',
                                                                    },
                                                                )}
                                                            </div>
                                                        ) : null}
                                                        <MessageBubble
                                                            message={message}
                                                            isMine={
                                                                message.sender_employee_id ===
                                                                currentEmployee.id
                                                            }
                                                        />
                                                    </div>
                                                ),
                                            )
                                        )}
                                        {typingEmployeeId ===
                                        selectedEmployee.id ? (
                                            <div className="text-xs text-muted-foreground">
                                                {selectedEmployee.full_name} is
                                                typing...
                                            </div>
                                        ) : null}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </div>

                                <form
                                    onSubmit={sendMessage}
                                    className="border-t bg-card/60 p-4"
                                >
                                    <div className="mx-auto flex max-w-3xl gap-2">
                                        <Input
                                            value={body}
                                            onChange={(event) =>
                                                handleBodyChange(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Type a message..."
                                            autoComplete="off"
                                        />
                                        <Button
                                            type="submit"
                                            disabled={body.trim() === ''}
                                        >
                                            <Send className="mr-2 size-4" />
                                            Send
                                        </Button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-muted-foreground">
                                <MessageCircle className="mb-4 size-12 opacity-50" />
                                Select a conversation or search for an employee.
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </AppLayout>
    );
}

function EmployeeAvatar({ employee }: { employee: EmployeeProfile }) {
    return (
        <Avatar>
            <AvatarImage
                src={employee.photo_url ?? undefined}
                alt={employee.full_name}
            />
            <AvatarFallback>{initials(employee.full_name)}</AvatarFallback>
        </Avatar>
    );
}

function EmployeeRow({
    employee,
    isOnline,
    onClick,
}: {
    employee: EmployeeProfile;
    isOnline: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-muted"
        >
            <EmployeeAvatar employee={employee} />
            <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                    {employee.full_name}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                    {employee.employee_code}
                    {employee.department ? ` · ${employee.department}` : ''}
                </div>
            </div>
            <Circle
                className={cn(
                    'size-2 fill-current',
                    isOnline ? 'text-green-500' : 'text-muted-foreground',
                )}
            />
        </button>
    );
}

function ConversationRow({
    conversation,
    active,
    isOnline,
    onClick,
}: {
    conversation: Conversation;
    active: boolean;
    isOnline: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-muted',
                active && 'bg-primary/10',
            )}
        >
            <EmployeeAvatar employee={conversation.employee} />
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-semibold">
                        {conversation.employee.full_name}
                    </div>
                    <div className="shrink-0 text-[11px] text-muted-foreground">
                        {formatMessageTime(conversation.last_message_at)}
                    </div>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                    <Circle
                        className={cn(
                            'size-2 fill-current',
                            isOnline
                                ? 'text-green-500'
                                : 'text-muted-foreground',
                        )}
                    />
                    <div className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                        {conversation.last_message?.body ?? 'No messages yet'}
                    </div>
                    {conversation.unread_count > 0 ? (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                            {conversation.unread_count}
                        </span>
                    ) : null}
                </div>
            </div>
        </button>
    );
}

function MessageBubble({
    message,
    isMine,
}: {
    message: Message;
    isMine: boolean;
}) {
    return (
        <div className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
            <div
                className={cn(
                    'max-w-[78%] rounded-2xl px-4 py-2 text-sm shadow-sm',
                    isMine
                        ? 'rounded-br-md bg-primary text-primary-foreground'
                        : 'rounded-bl-md border bg-background',
                )}
            >
                <div className="break-words whitespace-pre-wrap">
                    {message.body}
                </div>
                <div
                    className={cn(
                        'mt-1 flex items-center justify-end gap-1 text-[10px]',
                        isMine
                            ? 'text-primary-foreground/75'
                            : 'text-muted-foreground',
                    )}
                >
                    {formatMessageTime(message.created_at)}
                    {isMine ? (
                        <CheckCheck
                            className={cn(
                                'size-3',
                                message.read_at && 'text-blue-200',
                            )}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
}
