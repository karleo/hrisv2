import { Head, router, usePage, usePoll } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCheck,
    Circle,
    MessageCircle,
    Paperclip,
    Search,
    Send,
    Smile,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useEmployeePresence } from '@/contexts/employee-presence-context';
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
    attachment_url?: string | null;
    attachment_original_name?: string | null;
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

type EmployeeMessagesPageProps = {
    currentEmployee: EmployeeProfile;
    conversations: Conversation[];
    selectedConversation: Conversation | null;
    messages: Message[];
};

function mergeServerMessagesWithPending(
    server: Message[],
    local: Message[],
): Message[] {
    const serverIds = new Set(server.map((m) => m.id));
    const pendingKept = local.filter(
        (m) =>
            m.pending === true &&
            m.id < 0 &&
            !serverIds.has(m.id),
    );

    return [...server, ...pendingKept].sort(
        (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime(),
    );
}

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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Messages', href: '/employee-messages' },
];

/** Common quick-pick emojis for the message composer (no extra dependency). */
const CHAT_EMOJI_PICKER: string[] = [
    '😀',
    '😃',
    '😄',
    '😁',
    '😅',
    '😂',
    '🤣',
    '😊',
    '😇',
    '🙂',
    '😉',
    '😍',
    '🥰',
    '😘',
    '😗',
    '😋',
    '😛',
    '😜',
    '🤪',
    '😎',
    '🤩',
    '🥳',
    '😏',
    '😒',
    '😞',
    '😔',
    '😟',
    '😕',
    '🙁',
    '😣',
    '😖',
    '😫',
    '😩',
    '🥺',
    '😢',
    '😭',
    '😤',
    '😠',
    '😡',
    '🤬',
    '🤯',
    '😳',
    '🥵',
    '🥶',
    '😱',
    '😨',
    '😰',
    '😥',
    '🤗',
    '🤔',
    '🤫',
    '🤭',
    '🫡',
    '🫶',
    '👍',
    '👎',
    '👌',
    '🤌',
    '✌️',
    '🤞',
    '🫰',
    '🙏',
    '👏',
    '🙌',
    '💪',
    '❤️',
    '🧡',
    '💛',
    '💚',
    '💙',
    '💜',
    '🖤',
    '💔',
    '❣️',
    '💕',
    '💯',
    '🔥',
    '✨',
    '⭐',
    '🎉',
    '🎊',
    '✅',
    '❌',
    '⚠️',
    '💬',
    '👀',
    '🙈',
    '🙉',
    '🙊',
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

function presenceStatusDotClass(
    presenceSyncState: 'pending' | 'synced' | 'unavailable',
    isOnline: boolean,
): string {
    if (presenceSyncState !== 'synced') {
        return 'text-amber-500/85';
    }

    return isOnline ? 'text-green-500' : 'text-muted-foreground';
}

function peerPresenceStatusText(
    presenceSyncState: 'pending' | 'synced' | 'unavailable',
    isOnline: boolean,
): string {
    if (presenceSyncState === 'synced') {
        return isOnline ? 'Online' : 'Offline';
    }

    if (presenceSyncState === 'pending') {
        return 'Checking…';
    }

    return 'Live status unavailable';
}

function upsertConversation(
    list: Conversation[],
    conversation: Conversation | null | undefined,
): Conversation[] {
    if (
        conversation === null ||
        conversation === undefined ||
        conversation.id === null ||
        conversation.id === undefined
    ) {
        return list;
    }

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

function EmployeeMessagesIndexPage({
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
    const page = usePage<EmployeeMessagesPageProps & { csrf_token?: string }>();
    const csrfToken = page.props.csrf_token;

    const [conversations, setConversations] =
        useState<Conversation[]>(initialConversations);
    const [selectedConversation, setSelectedConversation] =
        useState<Conversation | null>(initialSelectedConversation);
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [body, setBody] = useState('');
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<EmployeeProfile[]>([]);
    const { onlineEmployeeIds, onlineEmployees, presenceSyncState } =
        useEmployeePresence();
    const [typingEmployeeId, setTypingEmployeeId] = useState<number | null>(
        null,
    );
    const [toast, setToast] = useState<string | null>(null);
    const [mobileListOpen, setMobileListOpen] = useState(
        initialSelectedConversation === null,
    );

    usePoll(
        5000,
        {
            only: [
                'conversations',
                'employeePresence',
                'viewerEmployeeId',
            ],
        },
        { keepAlive: true },
    );

    useEffect(() => {
        setConversations(page.props.conversations);
    }, [page.props.conversations]);

    useEffect(() => {
        const hasConversationQuery = /[?&]conversation=\d+/.test(page.url);
        if (!hasConversationQuery && page.props.messages.length === 0) {
            return;
        }

        setMessages((previous) =>
            mergeServerMessagesWithPending(page.props.messages, previous),
        );
    }, [page.props.messages, page.url]);

    useEffect(() => {
        const hasConversationQuery = /[?&]conversation=\d+/.test(page.url);
        if (!hasConversationQuery) {
            return;
        }

        if (page.props.selectedConversation !== null) {
            setSelectedConversation(page.props.selectedConversation);
        }
    }, [page.props.selectedConversation, page.url]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<number | null>(null);
    const typingSentAtRef = useRef<number>(0);
    const typingActiveRef = useRef<boolean>(false);
    const employeeMessagesReloadedAtRef = useRef<number>(0);
    const selectedConversationIdRef = useRef<number | null>(null);

    useEffect(() => {
        selectedConversationIdRef.current = selectedConversation?.id ?? null;
    }, [selectedConversation?.id]);

    const refreshEmployeeMessagesSharedProp = () => {
        const now = Date.now();
        if (now - employeeMessagesReloadedAtRef.current < 800) {
            return;
        }

        employeeMessagesReloadedAtRef.current = now;
        router.reload({
            only: ['employeeMessages'],
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

    const multipartHeaders = useMemo(
        () => ({
            Accept: 'application/json',
            ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
            'X-Requested-With': 'XMLHttpRequest',
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

        employeeChannel
            .listen('.employee.message.sent', (payload: MessageSentPayload) => {
                if (!payload?.conversation?.id || !payload?.message?.id) {
                    return;
                }

                setConversations((current) =>
                    upsertConversation(current, payload.conversation),
                );
                setMessages((current) =>
                    current.some((message) => message.id === payload.message.id)
                        ? current
                        : [...current, payload.message],
                );

                if (
                    selectedConversationIdRef.current !==
                    payload.conversation.id
                ) {
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

                if (payload.employee?.id === undefined) {
                    return;
                }

                setTypingEmployeeId(payload.employee.id);
                window.setTimeout(() => setTypingEmployeeId(null), 2500);
            });

        return () => {
            echo.leave(`employee.${currentEmployee.id}`);
        };
    }, [currentEmployee.id]);

    useEffect(() => {
        const conversationId = selectedConversation?.id;
        if (!conversationId) {
            return;
        }

        const fetchThread = (): void => {
            void fetch(
                `/employee-messages/conversations/${conversationId}`,
                {
                    headers: { Accept: 'application/json' },
                },
            )
                .then((response) => {
                    if (!response.ok) {
                        return undefined;
                    }

                    return response.json() as Promise<{
                        conversation: Conversation;
                        messages: Message[];
                    }>;
                })
                .then((payload) => {
                    if (!payload) {
                        return;
                    }

                    setSelectedConversation((current) =>
                        current?.id === conversationId
                            ? payload.conversation
                            : current,
                    );
                    setMessages((previous) =>
                        mergeServerMessagesWithPending(
                            payload.messages,
                            previous,
                        ),
                    );
                    setConversations((current) =>
                        upsertConversation(current, payload.conversation),
                    );
                    refreshEmployeeMessagesSharedProp();
                });
        };

        const intervalId = window.setInterval(fetchThread, 5000);
        fetchThread();

        return () => {
            window.clearInterval(intervalId);
        };
    }, [selectedConversation?.id]);

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
                    if (!payload?.conversation?.id) {
                        return;
                    }

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
                    if (!payload?.conversation) {
                        return;
                    }

                    setSelectedConversation(payload.conversation);
                    const conversationId = payload.conversation.id;
                    setMessages((current) => [
                        ...current.filter(
                            (message) =>
                                conversationId === null ||
                                message.conversation_id !== conversationId,
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

    const scheduleTypingSignals = (): void => {
        // Throttle typing broadcasts (only from input/emoji handlers).
        // eslint-disable-next-line react-hooks/purity -- Date.now is intentional for throttle window
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

    const handleBodyChange = (value: string) => {
        setBody(value);
        scheduleTypingSignals();
    };

    const insertEmoji = (emoji: string) => {
        setBody((previous) => previous + emoji);
        scheduleTypingSignals();
    };

    const sendMessage = (event: FormEvent) => {
        event.preventDefault();

        const text = body.trim();
        if ((!text && !attachmentFile) || !selectedEmployee) {
            return;
        }

        const clientMessageId = crypto.randomUUID();
        const fileSnapshot = attachmentFile;
        const bodySnapshot = body;

        setBody('');
        setAttachmentFile(null);
        if (attachmentInputRef.current) {
            attachmentInputRef.current.value = '';
        }

        if (selectedConversation?.id) {
            const pendingMessage: Message = {
                id: -Date.now(),
                conversation_id: selectedConversation.id,
                sender_employee_id: currentEmployee.id,
                recipient_employee_id: selectedEmployee.id,
                body:
                    text !== ''
                        ? text
                        : fileSnapshot
                          ? 'Sent an attachment.'
                          : '',
                read_at: null,
                created_at: new Date().toISOString(),
                pending: true,
                client_message_id: clientMessageId,
                attachment_url: null,
                attachment_original_name: fileSnapshot?.name ?? null,
            };

            setMessages((current) => [...current, pendingMessage]);
        }

        const useMultipart = fileSnapshot instanceof File;

        const requestBody = useMultipart
            ? (() => {
                  const formData = new FormData();
                  formData.append(
                      'recipient_employee_id',
                      String(selectedEmployee.id),
                  );
                  formData.append('body', text);
                  formData.append('client_message_id', clientMessageId);
                  formData.append('attachment', fileSnapshot);

                  return formData;
              })()
            : JSON.stringify({
                  recipient_employee_id: selectedEmployee.id,
                  body: text,
                  client_message_id: clientMessageId,
              });

        const rollbackSend = (toastMessage: string): void => {
            setToast(toastMessage);
            setBody(bodySnapshot);
            setAttachmentFile(fileSnapshot);
            setMessages((current) =>
                current.filter(
                    (message) =>
                        !(
                            message.pending === true &&
                            message.client_message_id === clientMessageId
                        ),
                ),
            );
        };

        void fetch('/employee-messages', {
            method: 'POST',
            headers: useMultipart ? multipartHeaders : headers,
            body: requestBody,
        })
            .then(async (response) => {
                const raw = await response.text();
                let data: unknown = null;
                if (raw !== '') {
                    try {
                        data = JSON.parse(raw) as unknown;
                    } catch {
                        data = null;
                    }
                }

                if (!response.ok) {
                    const fromLaravel =
                        data !== null &&
                        typeof data === 'object' &&
                        'message' in data &&
                        typeof (data as { message: unknown }).message ===
                            'string'
                            ? (data as { message: string }).message
                            : null;
                    const fromErrors =
                        data !== null &&
                        typeof data === 'object' &&
                        'errors' in data &&
                        (data as { errors: Record<string, string[]> }).errors;
                    const firstValidation =
                        fromErrors &&
                        typeof fromErrors === 'object' &&
                        Object.keys(fromErrors).length > 0
                            ? Object.values(fromErrors)[0]?.[0]
                            : null;

                    rollbackSend(
                        firstValidation ??
                            fromLaravel ??
                            `Could not send message (${response.status}).`,
                    );
                    return;
                }

                const payload = data as {
                    message?: Message;
                    conversation?: Conversation;
                    client_message_id?: string;
                };

                if (
                    payload?.message === undefined ||
                    payload?.conversation === undefined ||
                    payload.conversation.id === null ||
                    payload.conversation.id === undefined
                ) {
                    rollbackSend('Unexpected response from server.');
                    return;
                }

                setSelectedConversation(payload.conversation);
                setMessages((current) => {
                    const withoutPending = current.filter(
                        (message) =>
                            !(
                                message.pending === true &&
                                message.client_message_id === clientMessageId
                            ),
                    );

                    if (
                        withoutPending.some(
                            (message) => message.id === payload.message?.id,
                        )
                    ) {
                        return withoutPending;
                    }

                    return [...withoutPending, payload.message as Message];
                });
                setConversations((current) =>
                    upsertConversation(current, payload.conversation),
                );

                refreshEmployeeMessagesSharedProp();
            })
            .catch(() => {
                rollbackSend('Network error while sending message.');
            });
    };

    return (
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
                            'flex h-full min-h-0 flex-col border-r bg-card/60',
                            !mobileListOpen && 'hidden lg:block',
                        )}
                    >
                        <div className="flex h-16 shrink-0 items-center gap-3 border-b bg-card/60 px-4 md:px-5">
                            <MessageCircle className="size-5 shrink-0 text-primary" />
                            <h1 className="text-lg font-semibold tracking-tight">
                                Messages
                            </h1>
                        </div>
                        <div className="shrink-0 border-b bg-card/60 px-4 py-3 md:px-5">
                            <div className="relative">
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

                        <div className="min-h-0 flex-1 overflow-y-auto">
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
                                                presenceKnown={
                                                    presenceSyncState ===
                                                    'synced'
                                                }
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
                                    {presenceSyncState === 'synced' ? (
                                        <>
                                            No employees are online right now.
                                            Search for an employee to start a
                                            conversation.
                                        </>
                                    ) : presenceSyncState === 'pending' ? (
                                        <>
                                            Checking who is online… Search for
                                            an employee to start a conversation.
                                        </>
                                    ) : (
                                        <>
                                            Live online status is not
                                            connected (Reverb /{' '}
                                            <span className="font-mono">
                                                VITE_REVERB_*
                                            </span>
                                            ). Search for an employee to start a
                                            conversation.
                                        </>
                                    )}
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
                                                        presenceKnown
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
                                                        presenceKnown={
                                                            presenceSyncState ===
                                                            'synced'
                                                        }
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
                            'flex h-full min-h-0 min-w-0 flex-col',
                            mobileListOpen && 'hidden lg:flex',
                        )}
                    >
                        {selectedEmployee ? (
                            <>
                                <div className="flex h-16 shrink-0 items-center gap-3 border-b bg-card/60 px-4 md:px-5">
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
                                                    presenceStatusDotClass(
                                                        presenceSyncState,
                                                        onlineEmployeeIds.has(
                                                            selectedEmployee.id,
                                                        ),
                                                    ),
                                                )}
                                            />
                                            {peerPresenceStatusText(
                                                presenceSyncState,
                                                onlineEmployeeIds.has(
                                                    selectedEmployee.id,
                                                ),
                                            )}
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
                                    <div className="mx-auto flex max-w-3xl flex-col gap-2">
                                        {attachmentFile ? (
                                            <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs">
                                                <span className="min-w-0 truncate">
                                                    <span className="text-muted-foreground">
                                                        Attachment:{' '}
                                                    </span>
                                                    {attachmentFile.name}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 shrink-0 px-2"
                                                    onClick={() => {
                                                        setAttachmentFile(null);
                                                        if (attachmentInputRef.current) {
                                                            attachmentInputRef.current.value =
                                                                '';
                                                        }
                                                    }}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        ) : null}
                                        <div className="flex gap-2">
                                            <div className="relative min-w-0 flex-1">
                                                <input
                                                    ref={attachmentInputRef}
                                                    type="file"
                                                    className="sr-only"
                                                    accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
                                                    onChange={(event) => {
                                                        const file =
                                                            event.target
                                                                .files?.[0] ??
                                                            null;
                                                        setAttachmentFile(file);
                                                    }}
                                                />
                                                <Input
                                                    value={body}
                                                    onChange={(event) =>
                                                        handleBodyChange(
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Type a message..."
                                                    autoComplete="off"
                                                    className="pr-20"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-1/2 right-10 size-9 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                    aria-label="Attach file"
                                                    onClick={() =>
                                                        attachmentInputRef.current?.click()
                                                    }
                                                >
                                                    <Paperclip className="size-4" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute top-1/2 right-1 size-9 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                            aria-label="Insert emoji"
                                                        >
                                                            <Smile className="size-5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                        align="end"
                                                        className="max-h-64 w-[min(20rem,calc(100vw-2rem))] overflow-y-auto p-2"
                                                        onCloseAutoFocus={(e) =>
                                                            e.preventDefault()
                                                        }
                                                    >
                                                        <div className="grid grid-cols-8 gap-0.5">
                                                            {CHAT_EMOJI_PICKER.map(
                                                                (emoji) => (
                                                                    <button
                                                                        key={
                                                                            emoji
                                                                        }
                                                                        type="button"
                                                                        className="flex size-9 items-center justify-center rounded-md text-lg hover:bg-muted"
                                                                        onClick={() =>
                                                                            insertEmoji(
                                                                                emoji,
                                                                            )
                                                                        }
                                                                    >
                                                                        {
                                                                            emoji
                                                                        }
                                                                    </button>
                                                                ),
                                                            )}
                                                        </div>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            <Button
                                                type="submit"
                                                disabled={
                                                    body.trim() === '' &&
                                                    !attachmentFile
                                                }
                                            >
                                                <Send className="mr-2 size-4" />
                                                Send
                                            </Button>
                                        </div>
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
    );
}

export default function Index({
    currentEmployee,
    conversations,
    selectedConversation,
    messages,
}: {
    currentEmployee: EmployeeProfile;
    conversations: Conversation[];
    selectedConversation: Conversation | null;
    messages: Message[];
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee Messages" />
            <EmployeeMessagesIndexPage
                currentEmployee={currentEmployee}
                conversations={conversations}
                selectedConversation={selectedConversation}
                messages={messages}
            />
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
    presenceKnown = true,
    onClick,
}: {
    employee: EmployeeProfile;
    isOnline: boolean;
    presenceKnown?: boolean;
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
                    presenceKnown
                        ? isOnline
                            ? 'text-green-500'
                            : 'text-muted-foreground'
                        : 'text-amber-500/85',
                )}
            />
        </button>
    );
}

function ConversationRow({
    conversation,
    active,
    isOnline,
    presenceKnown = true,
    onClick,
}: {
    conversation: Conversation;
    active: boolean;
    isOnline: boolean;
    presenceKnown?: boolean;
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
                            'size-2 shrink-0 fill-current',
                            presenceKnown
                                ? isOnline
                                    ? 'text-green-500'
                                    : 'text-muted-foreground'
                                : 'text-amber-500/85',
                        )}
                    />
                    <div className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                        {conversation.last_message?.attachment_original_name
                            ? `Attachment: ${conversation.last_message.attachment_original_name}`
                            : (conversation.last_message?.body ??
                              'No messages yet')}
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
    const hasAttachment =
        typeof message.attachment_url === 'string' &&
        message.attachment_url.length > 0;

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
                {hasAttachment ? (
                    <a
                        href={message.attachment_url ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={message.attachment_original_name ?? true}
                        className={cn(
                            'mb-2 flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs font-medium underline-offset-2 hover:underline',
                            isMine
                                ? 'border-primary-foreground/30 bg-primary-foreground/10'
                                : 'border-border bg-muted/50',
                        )}
                    >
                        <Paperclip className="size-3.5 shrink-0" />
                        <span className="min-w-0 truncate">
                            {message.attachment_original_name ??
                                'Download attachment'}
                        </span>
                    </a>
                ) : null}
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
