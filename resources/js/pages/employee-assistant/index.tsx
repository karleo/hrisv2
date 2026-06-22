import { Head, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Bot,
    Loader2,
    MessageSquarePlus,
    Send,
    Sparkles,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { useI18n } from '@/lib/i18n';
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
};

type AssistantMessage = {
    id: number;
    role: 'user' | 'assistant' | string;
    content: string;
    created_at: string;
    pending?: boolean;
};

type AssistantConversation = {
    id: number;
    title: string | null;
    updated_at: string;
};

type EmployeeAssistantPageProps = {
    assistantEnabled: boolean;
    assistantConfigured: boolean;
    currentEmployee: EmployeeProfile;
    conversations: AssistantConversation[];
    selectedConversation: AssistantConversation | null;
    messages: AssistantMessage[];
};

const SUGGESTED_PROMPTS = [
    'What is my leave balance?',
    'How do I submit a leave request?',
    'Show my pending requests.',
];

function formatMessageTime(value: string): string {
    return new Date(value).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export default function EmployeeAssistantIndex({
    assistantEnabled,
    assistantConfigured,
    currentEmployee,
    conversations: initialConversations,
    selectedConversation: initialSelectedConversation,
    messages: initialMessages,
}: EmployeeAssistantPageProps) {
    const { t } = useI18n();
    const page = usePage<EmployeeAssistantPageProps & { csrf_token?: string }>();
    const csrfToken = page.props.csrf_token;

    const [conversations, setConversations] = useState(initialConversations);
    const [selectedConversation, setSelectedConversation] =
        useState<AssistantConversation | null>(initialSelectedConversation);
    const [messages, setMessages] = useState(initialMessages);
    const [draft, setDraft] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mobileListOpen, setMobileListOpen] = useState(
        initialSelectedConversation === null,
    );

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const headers = useMemo(
        () => ({
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        }),
        [csrfToken],
    );

    const canChat = assistantEnabled;
    const showSetupWarning = assistantEnabled && !assistantConfigured;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('sidebar.employeeAssistant', 'Employee assistant'),
            href: '/employee-assistant',
        },
    ];

    useEffect(() => {
        setConversations(initialConversations);
        setSelectedConversation(initialSelectedConversation);
        setMessages(initialMessages);
    }, [
        initialConversations,
        initialSelectedConversation,
        initialMessages,
    ]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isSending]);

    const openConversation = (conversation: AssistantConversation) => {
        router.get(
            `/employee-assistant?conversation=${conversation.id}`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setMobileListOpen(false),
            },
        );
    };

    const startNewConversation = () => {
        router.get('/employee-assistant', {}, { preserveScroll: true });
        setSelectedConversation(null);
        setMessages([]);
        setMobileListOpen(false);
        setError(null);
        inputRef.current?.focus();
    };

    const sendMessage = async (content: string) => {
        const text = content.trim();
        if (!text || isSending) {
            return;
        }

        setError(null);
        setIsSending(true);

        const pendingMessage: AssistantMessage = {
            id: -Date.now(),
            role: 'user',
            content: text,
            created_at: new Date().toISOString(),
            pending: true,
        };

        setMessages((current) => [...current, pendingMessage]);
        setDraft('');

        try {
            const response = await fetch('/employee-assistant/messages', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    content: text,
                    conversation_id: selectedConversation?.id ?? null,
                }),
            });

            const payload = await response.json();

            if (!response.ok) {
                setMessages((current) =>
                    current.filter((message) => message.id !== pendingMessage.id),
                );
                setDraft(text);
                setError(
                    typeof payload?.message === 'string'
                        ? payload.message
                        : 'Unable to send your message. Please try again.',
                );
                return;
            }

            const nextConversation = payload.conversation as AssistantConversation;
            const userMessage = payload.user_message as AssistantMessage;
            const assistantMessage = payload.assistant_message as AssistantMessage;

            setSelectedConversation(nextConversation);
            setConversations((current) => {
                const filtered = current.filter(
                    (conversation) => conversation.id !== nextConversation.id,
                );
                return [nextConversation, ...filtered];
            });
            setMessages((current) => [
                ...current.filter((message) => message.id !== pendingMessage.id),
                userMessage,
                assistantMessage,
            ]);
            setMobileListOpen(false);

            if (!selectedConversation?.id) {
                window.history.replaceState(
                    {},
                    '',
                    `/employee-assistant?conversation=${nextConversation.id}`,
                );
            }
        } catch {
            setMessages((current) =>
                current.filter((message) => message.id !== pendingMessage.id),
            );
            setDraft(text);
            setError('Unable to reach the assistant. Please try again.');
        } finally {
            setIsSending(false);
            inputRef.current?.focus();
        }
    };

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        void sendMessage(draft);
    };

    const deleteConversation = async (
        conversation: AssistantConversation,
        event: React.MouseEvent,
    ) => {
        event.stopPropagation();

        if (
            !window.confirm(
                t(
                    'employeeAssistant.deleteConfirm',
                    'Delete this conversation?',
                ),
            )
        ) {
            return;
        }

        const response = await fetch(
            `/employee-assistant/conversations/${conversation.id}`,
            {
                method: 'DELETE',
                headers,
            },
        );

        if (!response.ok) {
            setError('Unable to delete the conversation.');
            return;
        }

        setConversations((current) =>
            current.filter((item) => item.id !== conversation.id),
        );

        if (selectedConversation?.id === conversation.id) {
            startNewConversation();
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('employeeAssistant.title', 'Employee assistant')} />

            <div className="flex h-[calc(100vh-4rem)] min-h-[32rem] flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
                <div className="flex min-h-0 flex-1">
                    <aside
                        className={cn(
                            'flex w-full flex-col border-r bg-card/40 lg:w-80',
                            !mobileListOpen && 'hidden lg:flex',
                        )}
                    >
                        <div className="flex items-center justify-between border-b px-4 py-4">
                            <div>
                                <div className="font-semibold">
                                    {t(
                                        'employeeAssistant.conversations',
                                        'Conversations',
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {currentEmployee.full_name}
                                </div>
                            </div>
                            <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={startNewConversation}
                                title={t(
                                    'employeeAssistant.newChat',
                                    'New chat',
                                )}
                            >
                                <MessageSquarePlus className="size-4" />
                            </Button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-2">
                            {conversations.length === 0 ? (
                                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                                    {t(
                                        'employeeAssistant.noConversations',
                                        'No conversations yet. Start a new chat to ask about leave, requests, or how to use the app.',
                                    )}
                                </div>
                            ) : (
                                conversations.map((conversation) => (
                                    <button
                                        key={conversation.id}
                                        type="button"
                                        onClick={() =>
                                            openConversation(conversation)
                                        }
                                        className={cn(
                                            'mb-1 flex w-full items-start gap-2 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted/70',
                                            selectedConversation?.id ===
                                                conversation.id &&
                                                'bg-muted',
                                        )}
                                    >
                                        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-medium">
                                                {conversation.title ||
                                                    t(
                                                        'employeeAssistant.untitled',
                                                        'New conversation',
                                                    )}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {formatMessageTime(
                                                    conversation.updated_at,
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="size-7 shrink-0"
                                            onClick={(event) =>
                                                deleteConversation(
                                                    conversation,
                                                    event,
                                                )
                                            }
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    </button>
                                ))
                            )}
                        </div>
                    </aside>

                    <main
                        className={cn(
                            'flex min-h-0 min-w-0 flex-1 flex-col',
                            mobileListOpen && 'hidden lg:flex',
                        )}
                    >
                        <div className="flex h-16 shrink-0 items-center gap-3 border-b bg-card/60 px-4">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="lg:hidden"
                                onClick={() => setMobileListOpen(true)}
                            >
                                <ArrowLeft className="size-5" />
                            </Button>
                            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Bot className="size-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="font-semibold">
                                    {t(
                                        'employeeAssistant.title',
                                        'Employee assistant',
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {!assistantEnabled
                                        ? t(
                                              'employeeAssistant.disabled',
                                              'Assistant is currently disabled.',
                                          )
                                        : !assistantConfigured
                                          ? t(
                                                'employeeAssistant.notConfigured',
                                                'Waiting for OpenAI setup. Contact HR or IT if this persists.',
                                            )
                                          : t(
                                                'employeeAssistant.subtitle',
                                                'Ask about your leave, requests, attendance, or how to use HRIS.',
                                            )}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-muted/20 p-4">
                            <div className="mx-auto flex max-w-3xl flex-col gap-3">
                                {messages.length === 0 ? (
                                    <div className="my-8 rounded-xl border bg-background p-6 text-center">
                                        <Sparkles className="mx-auto mb-3 size-8 text-primary" />
                                        <h2 className="text-lg font-semibold">
                                            {t(
                                                'employeeAssistant.welcomeTitle',
                                                'How can I help you today?',
                                            )}
                                        </h2>
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            {t(
                                                'employeeAssistant.welcomeBody',
                                                'I can answer questions about your leave balance, recent requests, attendance summary, and how to use this HRIS app.',
                                            )}
                                        </p>
                                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                                            {SUGGESTED_PROMPTS.map((prompt) => (
                                                <Button
                                                    key={prompt}
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={
                                                        !canChat || isSending
                                                    }
                                                    onClick={() =>
                                                        void sendMessage(prompt)
                                                    }
                                                >
                                                    {prompt}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    messages.map((message) => {
                                        const isUser = message.role === 'user';

                                        return (
                                            <div
                                                key={message.id}
                                                className={cn(
                                                    'flex',
                                                    isUser
                                                        ? 'justify-end'
                                                        : 'justify-start',
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        'max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm',
                                                        isUser
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'border bg-background',
                                                        message.pending &&
                                                            'opacity-70',
                                                    )}
                                                >
                                                    <div className="whitespace-pre-wrap">
                                                        {message.content}
                                                    </div>
                                                    <div
                                                        className={cn(
                                                            'mt-2 text-[11px]',
                                                            isUser
                                                                ? 'text-primary-foreground/70'
                                                                : 'text-muted-foreground',
                                                        )}
                                                    >
                                                        {formatMessageTime(
                                                            message.created_at,
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}

                                {isSending ? (
                                    <div className="flex justify-start">
                                        <div className="inline-flex items-center gap-2 rounded-2xl border bg-background px-4 py-3 text-sm text-muted-foreground">
                                            <Loader2 className="size-4 animate-spin" />
                                            {t(
                                                'employeeAssistant.thinking',
                                                'Assistant is thinking…',
                                            )}
                                        </div>
                                    </div>
                                ) : null}

                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        <div className="border-t bg-background p-4">
                            {showSetupWarning ? (
                                <div className="mx-auto mb-3 max-w-3xl rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
                                    {t(
                                        'employeeAssistant.setupWarning',
                                        'The assistant cannot reply until OpenAI is configured. Administrators can set this up under Settings → Employee assistant.',
                                    )}
                                </div>
                            ) : null}
                            {error ? (
                                <div className="mx-auto mb-3 max-w-3xl rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                                    {error}
                                </div>
                            ) : null}

                            <form
                                onSubmit={handleSubmit}
                                className="mx-auto flex max-w-3xl gap-2"
                            >
                                <Input
                                    ref={inputRef}
                                    value={draft}
                                    onChange={(event) =>
                                        setDraft(event.target.value)
                                    }
                                    placeholder={t(
                                        'employeeAssistant.inputPlaceholder',
                                        'Ask about leave, requests, attendance, or app help…',
                                    )}
                                    disabled={!canChat || isSending}
                                    maxLength={2000}
                                />
                                <Button
                                    type="submit"
                                    disabled={
                                        !canChat ||
                                        isSending ||
                                        draft.trim() === ''
                                    }
                                >
                                    <Send className="size-4" />
                                </Button>
                            </form>
                        </div>
                    </main>
                </div>
            </div>
        </AppLayout>
    );
}
