import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ItRequestController::index
 * @see app/Http/Controllers/ItRequestController.php:38
 * @route '/it-requests'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/it-requests',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ItRequestController::index
 * @see app/Http/Controllers/ItRequestController.php:38
 * @route '/it-requests'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ItRequestController::index
 * @see app/Http/Controllers/ItRequestController.php:38
 * @route '/it-requests'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ItRequestController::index
 * @see app/Http/Controllers/ItRequestController.php:38
 * @route '/it-requests'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ItRequestController::index
 * @see app/Http/Controllers/ItRequestController.php:38
 * @route '/it-requests'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ItRequestController::index
 * @see app/Http/Controllers/ItRequestController.php:38
 * @route '/it-requests'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ItRequestController::index
 * @see app/Http/Controllers/ItRequestController.php:38
 * @route '/it-requests'
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
* @see \App\Http\Controllers\ItRequestController::create
 * @see app/Http/Controllers/ItRequestController.php:63
 * @route '/it-requests/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/it-requests/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ItRequestController::create
 * @see app/Http/Controllers/ItRequestController.php:63
 * @route '/it-requests/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ItRequestController::create
 * @see app/Http/Controllers/ItRequestController.php:63
 * @route '/it-requests/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ItRequestController::create
 * @see app/Http/Controllers/ItRequestController.php:63
 * @route '/it-requests/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ItRequestController::create
 * @see app/Http/Controllers/ItRequestController.php:63
 * @route '/it-requests/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ItRequestController::create
 * @see app/Http/Controllers/ItRequestController.php:63
 * @route '/it-requests/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ItRequestController::create
 * @see app/Http/Controllers/ItRequestController.php:63
 * @route '/it-requests/create'
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
* @see \App\Http\Controllers\ItRequestController::store
 * @see app/Http/Controllers/ItRequestController.php:85
 * @route '/it-requests'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/it-requests',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ItRequestController::store
 * @see app/Http/Controllers/ItRequestController.php:85
 * @route '/it-requests'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ItRequestController::store
 * @see app/Http/Controllers/ItRequestController.php:85
 * @route '/it-requests'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ItRequestController::store
 * @see app/Http/Controllers/ItRequestController.php:85
 * @route '/it-requests'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ItRequestController::store
 * @see app/Http/Controllers/ItRequestController.php:85
 * @route '/it-requests'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\ItRequestController::show
 * @see app/Http/Controllers/ItRequestController.php:106
 * @route '/it-requests/{it_request}'
 */
export const show = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/it-requests/{it_request}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ItRequestController::show
 * @see app/Http/Controllers/ItRequestController.php:106
 * @route '/it-requests/{it_request}'
 */
show.url = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { it_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { it_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    it_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        it_request: typeof args.it_request === 'object'
                ? args.it_request.id
                : args.it_request,
                }

    return show.definition.url
            .replace('{it_request}', parsedArgs.it_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ItRequestController::show
 * @see app/Http/Controllers/ItRequestController.php:106
 * @route '/it-requests/{it_request}'
 */
show.get = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ItRequestController::show
 * @see app/Http/Controllers/ItRequestController.php:106
 * @route '/it-requests/{it_request}'
 */
show.head = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ItRequestController::show
 * @see app/Http/Controllers/ItRequestController.php:106
 * @route '/it-requests/{it_request}'
 */
    const showForm = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ItRequestController::show
 * @see app/Http/Controllers/ItRequestController.php:106
 * @route '/it-requests/{it_request}'
 */
        showForm.get = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ItRequestController::show
 * @see app/Http/Controllers/ItRequestController.php:106
 * @route '/it-requests/{it_request}'
 */
        showForm.head = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\ItRequestController::edit
 * @see app/Http/Controllers/ItRequestController.php:248
 * @route '/it-requests/{it_request}/edit'
 */
export const edit = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/it-requests/{it_request}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ItRequestController::edit
 * @see app/Http/Controllers/ItRequestController.php:248
 * @route '/it-requests/{it_request}/edit'
 */
edit.url = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { it_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { it_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    it_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        it_request: typeof args.it_request === 'object'
                ? args.it_request.id
                : args.it_request,
                }

    return edit.definition.url
            .replace('{it_request}', parsedArgs.it_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ItRequestController::edit
 * @see app/Http/Controllers/ItRequestController.php:248
 * @route '/it-requests/{it_request}/edit'
 */
edit.get = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ItRequestController::edit
 * @see app/Http/Controllers/ItRequestController.php:248
 * @route '/it-requests/{it_request}/edit'
 */
edit.head = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ItRequestController::edit
 * @see app/Http/Controllers/ItRequestController.php:248
 * @route '/it-requests/{it_request}/edit'
 */
    const editForm = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ItRequestController::edit
 * @see app/Http/Controllers/ItRequestController.php:248
 * @route '/it-requests/{it_request}/edit'
 */
        editForm.get = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ItRequestController::edit
 * @see app/Http/Controllers/ItRequestController.php:248
 * @route '/it-requests/{it_request}/edit'
 */
        editForm.head = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\ItRequestController::update
 * @see app/Http/Controllers/ItRequestController.php:289
 * @route '/it-requests/{it_request}'
 */
export const update = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/it-requests/{it_request}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\ItRequestController::update
 * @see app/Http/Controllers/ItRequestController.php:289
 * @route '/it-requests/{it_request}'
 */
update.url = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { it_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { it_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    it_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        it_request: typeof args.it_request === 'object'
                ? args.it_request.id
                : args.it_request,
                }

    return update.definition.url
            .replace('{it_request}', parsedArgs.it_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ItRequestController::update
 * @see app/Http/Controllers/ItRequestController.php:289
 * @route '/it-requests/{it_request}'
 */
update.put = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\ItRequestController::update
 * @see app/Http/Controllers/ItRequestController.php:289
 * @route '/it-requests/{it_request}'
 */
update.patch = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\ItRequestController::update
 * @see app/Http/Controllers/ItRequestController.php:289
 * @route '/it-requests/{it_request}'
 */
    const updateForm = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ItRequestController::update
 * @see app/Http/Controllers/ItRequestController.php:289
 * @route '/it-requests/{it_request}'
 */
        updateForm.put = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\ItRequestController::update
 * @see app/Http/Controllers/ItRequestController.php:289
 * @route '/it-requests/{it_request}'
 */
        updateForm.patch = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\ItRequestController::destroy
 * @see app/Http/Controllers/ItRequestController.php:313
 * @route '/it-requests/{it_request}'
 */
export const destroy = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/it-requests/{it_request}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ItRequestController::destroy
 * @see app/Http/Controllers/ItRequestController.php:313
 * @route '/it-requests/{it_request}'
 */
destroy.url = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { it_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { it_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    it_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        it_request: typeof args.it_request === 'object'
                ? args.it_request.id
                : args.it_request,
                }

    return destroy.definition.url
            .replace('{it_request}', parsedArgs.it_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ItRequestController::destroy
 * @see app/Http/Controllers/ItRequestController.php:313
 * @route '/it-requests/{it_request}'
 */
destroy.delete = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\ItRequestController::destroy
 * @see app/Http/Controllers/ItRequestController.php:313
 * @route '/it-requests/{it_request}'
 */
    const destroyForm = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ItRequestController::destroy
 * @see app/Http/Controllers/ItRequestController.php:313
 * @route '/it-requests/{it_request}'
 */
        destroyForm.delete = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\ItRequestController::submit
 * @see app/Http/Controllers/ItRequestController.php:142
 * @route '/it-requests/{it_request}/submit'
 */
export const submit = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submit.url(args, options),
    method: 'post',
})

submit.definition = {
    methods: ["post"],
    url: '/it-requests/{it_request}/submit',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ItRequestController::submit
 * @see app/Http/Controllers/ItRequestController.php:142
 * @route '/it-requests/{it_request}/submit'
 */
submit.url = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { it_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { it_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    it_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        it_request: typeof args.it_request === 'object'
                ? args.it_request.id
                : args.it_request,
                }

    return submit.definition.url
            .replace('{it_request}', parsedArgs.it_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ItRequestController::submit
 * @see app/Http/Controllers/ItRequestController.php:142
 * @route '/it-requests/{it_request}/submit'
 */
submit.post = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submit.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ItRequestController::submit
 * @see app/Http/Controllers/ItRequestController.php:142
 * @route '/it-requests/{it_request}/submit'
 */
    const submitForm = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: submit.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ItRequestController::submit
 * @see app/Http/Controllers/ItRequestController.php:142
 * @route '/it-requests/{it_request}/submit'
 */
        submitForm.post = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: submit.url(args, options),
            method: 'post',
        })
    
    submit.form = submitForm
/**
* @see \App\Http\Controllers\ItRequestController::decide
 * @see app/Http/Controllers/ItRequestController.php:172
 * @route '/it-requests/{it_request}/decide'
 */
export const decide = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: decide.url(args, options),
    method: 'post',
})

decide.definition = {
    methods: ["post"],
    url: '/it-requests/{it_request}/decide',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ItRequestController::decide
 * @see app/Http/Controllers/ItRequestController.php:172
 * @route '/it-requests/{it_request}/decide'
 */
decide.url = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { it_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { it_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    it_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        it_request: typeof args.it_request === 'object'
                ? args.it_request.id
                : args.it_request,
                }

    return decide.definition.url
            .replace('{it_request}', parsedArgs.it_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ItRequestController::decide
 * @see app/Http/Controllers/ItRequestController.php:172
 * @route '/it-requests/{it_request}/decide'
 */
decide.post = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: decide.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ItRequestController::decide
 * @see app/Http/Controllers/ItRequestController.php:172
 * @route '/it-requests/{it_request}/decide'
 */
    const decideForm = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: decide.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ItRequestController::decide
 * @see app/Http/Controllers/ItRequestController.php:172
 * @route '/it-requests/{it_request}/decide'
 */
        decideForm.post = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: decide.url(args, options),
            method: 'post',
        })
    
    decide.form = decideForm
/**
* @see \App\Http\Controllers\ItRequestController::print
 * @see app/Http/Controllers/ItRequestController.php:220
 * @route '/it-requests/{it_request}/print'
 */
export const print = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: print.url(args, options),
    method: 'get',
})

print.definition = {
    methods: ["get","head"],
    url: '/it-requests/{it_request}/print',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ItRequestController::print
 * @see app/Http/Controllers/ItRequestController.php:220
 * @route '/it-requests/{it_request}/print'
 */
print.url = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { it_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { it_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    it_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        it_request: typeof args.it_request === 'object'
                ? args.it_request.id
                : args.it_request,
                }

    return print.definition.url
            .replace('{it_request}', parsedArgs.it_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ItRequestController::print
 * @see app/Http/Controllers/ItRequestController.php:220
 * @route '/it-requests/{it_request}/print'
 */
print.get = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: print.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ItRequestController::print
 * @see app/Http/Controllers/ItRequestController.php:220
 * @route '/it-requests/{it_request}/print'
 */
print.head = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: print.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ItRequestController::print
 * @see app/Http/Controllers/ItRequestController.php:220
 * @route '/it-requests/{it_request}/print'
 */
    const printForm = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: print.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ItRequestController::print
 * @see app/Http/Controllers/ItRequestController.php:220
 * @route '/it-requests/{it_request}/print'
 */
        printForm.get = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: print.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ItRequestController::print
 * @see app/Http/Controllers/ItRequestController.php:220
 * @route '/it-requests/{it_request}/print'
 */
        printForm.head = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\ItRequestController::updateSignatures
 * @see app/Http/Controllers/ItRequestController.php:343
 * @route '/it-requests/{it_request}/signatures'
 */
export const updateSignatures = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateSignatures.url(args, options),
    method: 'post',
})

updateSignatures.definition = {
    methods: ["post"],
    url: '/it-requests/{it_request}/signatures',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ItRequestController::updateSignatures
 * @see app/Http/Controllers/ItRequestController.php:343
 * @route '/it-requests/{it_request}/signatures'
 */
updateSignatures.url = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { it_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { it_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    it_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        it_request: typeof args.it_request === 'object'
                ? args.it_request.id
                : args.it_request,
                }

    return updateSignatures.definition.url
            .replace('{it_request}', parsedArgs.it_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ItRequestController::updateSignatures
 * @see app/Http/Controllers/ItRequestController.php:343
 * @route '/it-requests/{it_request}/signatures'
 */
updateSignatures.post = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateSignatures.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ItRequestController::updateSignatures
 * @see app/Http/Controllers/ItRequestController.php:343
 * @route '/it-requests/{it_request}/signatures'
 */
    const updateSignaturesForm = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateSignatures.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ItRequestController::updateSignatures
 * @see app/Http/Controllers/ItRequestController.php:343
 * @route '/it-requests/{it_request}/signatures'
 */
        updateSignaturesForm.post = (args: { it_request: number | { id: number } } | [it_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateSignatures.url(args, options),
            method: 'post',
        })
    
    updateSignatures.form = updateSignaturesForm
const ItRequestController = { index, create, store, show, edit, update, destroy, submit, decide, print, updateSignatures }

export default ItRequestController