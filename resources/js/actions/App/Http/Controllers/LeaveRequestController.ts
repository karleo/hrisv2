import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\LeaveRequestController::index
 * @see app/Http/Controllers/LeaveRequestController.php:24
 * @route '/leave-requests'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/leave-requests',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\LeaveRequestController::index
 * @see app/Http/Controllers/LeaveRequestController.php:24
 * @route '/leave-requests'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\LeaveRequestController::index
 * @see app/Http/Controllers/LeaveRequestController.php:24
 * @route '/leave-requests'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\LeaveRequestController::index
 * @see app/Http/Controllers/LeaveRequestController.php:24
 * @route '/leave-requests'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\LeaveRequestController::index
 * @see app/Http/Controllers/LeaveRequestController.php:24
 * @route '/leave-requests'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\LeaveRequestController::index
 * @see app/Http/Controllers/LeaveRequestController.php:24
 * @route '/leave-requests'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\LeaveRequestController::index
 * @see app/Http/Controllers/LeaveRequestController.php:24
 * @route '/leave-requests'
 */
        indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\LeaveRequestController::create
 * @see app/Http/Controllers/LeaveRequestController.php:96
 * @route '/leave-requests/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/leave-requests/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\LeaveRequestController::create
 * @see app/Http/Controllers/LeaveRequestController.php:96
 * @route '/leave-requests/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\LeaveRequestController::create
 * @see app/Http/Controllers/LeaveRequestController.php:96
 * @route '/leave-requests/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\LeaveRequestController::create
 * @see app/Http/Controllers/LeaveRequestController.php:96
 * @route '/leave-requests/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\LeaveRequestController::create
 * @see app/Http/Controllers/LeaveRequestController.php:96
 * @route '/leave-requests/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\LeaveRequestController::create
 * @see app/Http/Controllers/LeaveRequestController.php:96
 * @route '/leave-requests/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\LeaveRequestController::create
 * @see app/Http/Controllers/LeaveRequestController.php:96
 * @route '/leave-requests/create'
 */
        createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    create.form = createForm
/**
* @see \App\Http\Controllers\LeaveRequestController::store
 * @see app/Http/Controllers/LeaveRequestController.php:113
 * @route '/leave-requests'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/leave-requests',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\LeaveRequestController::store
 * @see app/Http/Controllers/LeaveRequestController.php:113
 * @route '/leave-requests'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\LeaveRequestController::store
 * @see app/Http/Controllers/LeaveRequestController.php:113
 * @route '/leave-requests'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\LeaveRequestController::store
 * @see app/Http/Controllers/LeaveRequestController.php:113
 * @route '/leave-requests'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\LeaveRequestController::store
 * @see app/Http/Controllers/LeaveRequestController.php:113
 * @route '/leave-requests'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\LeaveRequestController::show
 * @see app/Http/Controllers/LeaveRequestController.php:142
 * @route '/leave-requests/{leave_request}'
 */
export const show = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/leave-requests/{leave_request}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\LeaveRequestController::show
 * @see app/Http/Controllers/LeaveRequestController.php:142
 * @route '/leave-requests/{leave_request}'
 */
show.url = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { leave_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { leave_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    leave_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        leave_request: typeof args.leave_request === 'object'
                ? args.leave_request.id
                : args.leave_request,
                }

    return show.definition.url
            .replace('{leave_request}', parsedArgs.leave_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\LeaveRequestController::show
 * @see app/Http/Controllers/LeaveRequestController.php:142
 * @route '/leave-requests/{leave_request}'
 */
show.get = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\LeaveRequestController::show
 * @see app/Http/Controllers/LeaveRequestController.php:142
 * @route '/leave-requests/{leave_request}'
 */
show.head = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\LeaveRequestController::show
 * @see app/Http/Controllers/LeaveRequestController.php:142
 * @route '/leave-requests/{leave_request}'
 */
    const showForm = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\LeaveRequestController::show
 * @see app/Http/Controllers/LeaveRequestController.php:142
 * @route '/leave-requests/{leave_request}'
 */
        showForm.get = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\LeaveRequestController::show
 * @see app/Http/Controllers/LeaveRequestController.php:142
 * @route '/leave-requests/{leave_request}'
 */
        showForm.head = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\LeaveRequestController::edit
 * @see app/Http/Controllers/LeaveRequestController.php:182
 * @route '/leave-requests/{leave_request}/edit'
 */
export const edit = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/leave-requests/{leave_request}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\LeaveRequestController::edit
 * @see app/Http/Controllers/LeaveRequestController.php:182
 * @route '/leave-requests/{leave_request}/edit'
 */
edit.url = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { leave_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { leave_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    leave_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        leave_request: typeof args.leave_request === 'object'
                ? args.leave_request.id
                : args.leave_request,
                }

    return edit.definition.url
            .replace('{leave_request}', parsedArgs.leave_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\LeaveRequestController::edit
 * @see app/Http/Controllers/LeaveRequestController.php:182
 * @route '/leave-requests/{leave_request}/edit'
 */
edit.get = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\LeaveRequestController::edit
 * @see app/Http/Controllers/LeaveRequestController.php:182
 * @route '/leave-requests/{leave_request}/edit'
 */
edit.head = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\LeaveRequestController::edit
 * @see app/Http/Controllers/LeaveRequestController.php:182
 * @route '/leave-requests/{leave_request}/edit'
 */
    const editForm = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\LeaveRequestController::edit
 * @see app/Http/Controllers/LeaveRequestController.php:182
 * @route '/leave-requests/{leave_request}/edit'
 */
        editForm.get = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\LeaveRequestController::edit
 * @see app/Http/Controllers/LeaveRequestController.php:182
 * @route '/leave-requests/{leave_request}/edit'
 */
        editForm.head = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    edit.form = editForm
/**
* @see \App\Http\Controllers\LeaveRequestController::update
 * @see app/Http/Controllers/LeaveRequestController.php:209
 * @route '/leave-requests/{leave_request}'
 */
export const update = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/leave-requests/{leave_request}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\LeaveRequestController::update
 * @see app/Http/Controllers/LeaveRequestController.php:209
 * @route '/leave-requests/{leave_request}'
 */
update.url = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { leave_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { leave_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    leave_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        leave_request: typeof args.leave_request === 'object'
                ? args.leave_request.id
                : args.leave_request,
                }

    return update.definition.url
            .replace('{leave_request}', parsedArgs.leave_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\LeaveRequestController::update
 * @see app/Http/Controllers/LeaveRequestController.php:209
 * @route '/leave-requests/{leave_request}'
 */
update.put = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\LeaveRequestController::update
 * @see app/Http/Controllers/LeaveRequestController.php:209
 * @route '/leave-requests/{leave_request}'
 */
update.patch = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\LeaveRequestController::update
 * @see app/Http/Controllers/LeaveRequestController.php:209
 * @route '/leave-requests/{leave_request}'
 */
    const updateForm = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\LeaveRequestController::update
 * @see app/Http/Controllers/LeaveRequestController.php:209
 * @route '/leave-requests/{leave_request}'
 */
        updateForm.put = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\LeaveRequestController::update
 * @see app/Http/Controllers/LeaveRequestController.php:209
 * @route '/leave-requests/{leave_request}'
 */
        updateForm.patch = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\LeaveRequestController::destroy
 * @see app/Http/Controllers/LeaveRequestController.php:239
 * @route '/leave-requests/{leave_request}'
 */
export const destroy = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/leave-requests/{leave_request}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\LeaveRequestController::destroy
 * @see app/Http/Controllers/LeaveRequestController.php:239
 * @route '/leave-requests/{leave_request}'
 */
destroy.url = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { leave_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { leave_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    leave_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        leave_request: typeof args.leave_request === 'object'
                ? args.leave_request.id
                : args.leave_request,
                }

    return destroy.definition.url
            .replace('{leave_request}', parsedArgs.leave_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\LeaveRequestController::destroy
 * @see app/Http/Controllers/LeaveRequestController.php:239
 * @route '/leave-requests/{leave_request}'
 */
destroy.delete = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\LeaveRequestController::destroy
 * @see app/Http/Controllers/LeaveRequestController.php:239
 * @route '/leave-requests/{leave_request}'
 */
    const destroyForm = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\LeaveRequestController::destroy
 * @see app/Http/Controllers/LeaveRequestController.php:239
 * @route '/leave-requests/{leave_request}'
 */
        destroyForm.delete = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
/**
* @see \App\Http\Controllers\LeaveRequestController::submit
 * @see app/Http/Controllers/LeaveRequestController.php:166
 * @route '/leave-requests/{leave_request}/submit'
 */
export const submit = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submit.url(args, options),
    method: 'post',
})

submit.definition = {
    methods: ["post"],
    url: '/leave-requests/{leave_request}/submit',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\LeaveRequestController::submit
 * @see app/Http/Controllers/LeaveRequestController.php:166
 * @route '/leave-requests/{leave_request}/submit'
 */
submit.url = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { leave_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { leave_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    leave_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        leave_request: typeof args.leave_request === 'object'
                ? args.leave_request.id
                : args.leave_request,
                }

    return submit.definition.url
            .replace('{leave_request}', parsedArgs.leave_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\LeaveRequestController::submit
 * @see app/Http/Controllers/LeaveRequestController.php:166
 * @route '/leave-requests/{leave_request}/submit'
 */
submit.post = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submit.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\LeaveRequestController::submit
 * @see app/Http/Controllers/LeaveRequestController.php:166
 * @route '/leave-requests/{leave_request}/submit'
 */
    const submitForm = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: submit.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\LeaveRequestController::submit
 * @see app/Http/Controllers/LeaveRequestController.php:166
 * @route '/leave-requests/{leave_request}/submit'
 */
        submitForm.post = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: submit.url(args, options),
            method: 'post',
        })
    
    submit.form = submitForm
/**
* @see \App\Http\Controllers\LeaveRequestController::print
 * @see app/Http/Controllers/LeaveRequestController.php:256
 * @route '/leave-requests/{leave_request}/print'
 */
export const print = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: print.url(args, options),
    method: 'get',
})

print.definition = {
    methods: ["get","head"],
    url: '/leave-requests/{leave_request}/print',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\LeaveRequestController::print
 * @see app/Http/Controllers/LeaveRequestController.php:256
 * @route '/leave-requests/{leave_request}/print'
 */
print.url = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { leave_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { leave_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    leave_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        leave_request: typeof args.leave_request === 'object'
                ? args.leave_request.id
                : args.leave_request,
                }

    return print.definition.url
            .replace('{leave_request}', parsedArgs.leave_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\LeaveRequestController::print
 * @see app/Http/Controllers/LeaveRequestController.php:256
 * @route '/leave-requests/{leave_request}/print'
 */
print.get = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: print.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\LeaveRequestController::print
 * @see app/Http/Controllers/LeaveRequestController.php:256
 * @route '/leave-requests/{leave_request}/print'
 */
print.head = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: print.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\LeaveRequestController::print
 * @see app/Http/Controllers/LeaveRequestController.php:256
 * @route '/leave-requests/{leave_request}/print'
 */
    const printForm = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: print.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\LeaveRequestController::print
 * @see app/Http/Controllers/LeaveRequestController.php:256
 * @route '/leave-requests/{leave_request}/print'
 */
        printForm.get = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: print.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\LeaveRequestController::print
 * @see app/Http/Controllers/LeaveRequestController.php:256
 * @route '/leave-requests/{leave_request}/print'
 */
        printForm.head = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: print.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    print.form = printForm
/**
* @see \App\Http\Controllers\LeaveRequestController::updateSignatures
 * @see app/Http/Controllers/LeaveRequestController.php:278
 * @route '/leave-requests/{leave_request}/signatures'
 */
export const updateSignatures = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateSignatures.url(args, options),
    method: 'post',
})

updateSignatures.definition = {
    methods: ["post"],
    url: '/leave-requests/{leave_request}/signatures',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\LeaveRequestController::updateSignatures
 * @see app/Http/Controllers/LeaveRequestController.php:278
 * @route '/leave-requests/{leave_request}/signatures'
 */
updateSignatures.url = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { leave_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { leave_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    leave_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        leave_request: typeof args.leave_request === 'object'
                ? args.leave_request.id
                : args.leave_request,
                }

    return updateSignatures.definition.url
            .replace('{leave_request}', parsedArgs.leave_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\LeaveRequestController::updateSignatures
 * @see app/Http/Controllers/LeaveRequestController.php:278
 * @route '/leave-requests/{leave_request}/signatures'
 */
updateSignatures.post = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateSignatures.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\LeaveRequestController::updateSignatures
 * @see app/Http/Controllers/LeaveRequestController.php:278
 * @route '/leave-requests/{leave_request}/signatures'
 */
    const updateSignaturesForm = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateSignatures.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\LeaveRequestController::updateSignatures
 * @see app/Http/Controllers/LeaveRequestController.php:278
 * @route '/leave-requests/{leave_request}/signatures'
 */
        updateSignaturesForm.post = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateSignatures.url(args, options),
            method: 'post',
        })
    
    updateSignatures.form = updateSignaturesForm
const LeaveRequestController = { index, create, store, show, edit, update, destroy, submit, print, updateSignatures }

export default LeaveRequestController