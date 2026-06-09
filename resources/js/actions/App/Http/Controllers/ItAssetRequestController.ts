import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ItAssetRequestController::index
 * @see app/Http/Controllers/ItAssetRequestController.php:41
 * @route '/it-asset-requests'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/it-asset-requests',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ItAssetRequestController::index
 * @see app/Http/Controllers/ItAssetRequestController.php:41
 * @route '/it-asset-requests'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ItAssetRequestController::index
 * @see app/Http/Controllers/ItAssetRequestController.php:41
 * @route '/it-asset-requests'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ItAssetRequestController::index
 * @see app/Http/Controllers/ItAssetRequestController.php:41
 * @route '/it-asset-requests'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ItAssetRequestController::index
 * @see app/Http/Controllers/ItAssetRequestController.php:41
 * @route '/it-asset-requests'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ItAssetRequestController::index
 * @see app/Http/Controllers/ItAssetRequestController.php:41
 * @route '/it-asset-requests'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ItAssetRequestController::index
 * @see app/Http/Controllers/ItAssetRequestController.php:41
 * @route '/it-asset-requests'
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
* @see \App\Http\Controllers\ItAssetRequestController::create
 * @see app/Http/Controllers/ItAssetRequestController.php:66
 * @route '/it-asset-requests/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/it-asset-requests/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ItAssetRequestController::create
 * @see app/Http/Controllers/ItAssetRequestController.php:66
 * @route '/it-asset-requests/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ItAssetRequestController::create
 * @see app/Http/Controllers/ItAssetRequestController.php:66
 * @route '/it-asset-requests/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ItAssetRequestController::create
 * @see app/Http/Controllers/ItAssetRequestController.php:66
 * @route '/it-asset-requests/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ItAssetRequestController::create
 * @see app/Http/Controllers/ItAssetRequestController.php:66
 * @route '/it-asset-requests/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ItAssetRequestController::create
 * @see app/Http/Controllers/ItAssetRequestController.php:66
 * @route '/it-asset-requests/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ItAssetRequestController::create
 * @see app/Http/Controllers/ItAssetRequestController.php:66
 * @route '/it-asset-requests/create'
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
* @see \App\Http\Controllers\ItAssetRequestController::store
 * @see app/Http/Controllers/ItAssetRequestController.php:87
 * @route '/it-asset-requests'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/it-asset-requests',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ItAssetRequestController::store
 * @see app/Http/Controllers/ItAssetRequestController.php:87
 * @route '/it-asset-requests'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ItAssetRequestController::store
 * @see app/Http/Controllers/ItAssetRequestController.php:87
 * @route '/it-asset-requests'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ItAssetRequestController::store
 * @see app/Http/Controllers/ItAssetRequestController.php:87
 * @route '/it-asset-requests'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ItAssetRequestController::store
 * @see app/Http/Controllers/ItAssetRequestController.php:87
 * @route '/it-asset-requests'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\ItAssetRequestController::show
 * @see app/Http/Controllers/ItAssetRequestController.php:128
 * @route '/it-asset-requests/{it_asset_request}'
 */
export const show = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/it-asset-requests/{it_asset_request}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ItAssetRequestController::show
 * @see app/Http/Controllers/ItAssetRequestController.php:128
 * @route '/it-asset-requests/{it_asset_request}'
 */
show.url = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { it_asset_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { it_asset_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    it_asset_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        it_asset_request: typeof args.it_asset_request === 'object'
                ? args.it_asset_request.id
                : args.it_asset_request,
                }

    return show.definition.url
            .replace('{it_asset_request}', parsedArgs.it_asset_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ItAssetRequestController::show
 * @see app/Http/Controllers/ItAssetRequestController.php:128
 * @route '/it-asset-requests/{it_asset_request}'
 */
show.get = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ItAssetRequestController::show
 * @see app/Http/Controllers/ItAssetRequestController.php:128
 * @route '/it-asset-requests/{it_asset_request}'
 */
show.head = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ItAssetRequestController::show
 * @see app/Http/Controllers/ItAssetRequestController.php:128
 * @route '/it-asset-requests/{it_asset_request}'
 */
    const showForm = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ItAssetRequestController::show
 * @see app/Http/Controllers/ItAssetRequestController.php:128
 * @route '/it-asset-requests/{it_asset_request}'
 */
        showForm.get = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ItAssetRequestController::show
 * @see app/Http/Controllers/ItAssetRequestController.php:128
 * @route '/it-asset-requests/{it_asset_request}'
 */
        showForm.head = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\ItAssetRequestController::edit
 * @see app/Http/Controllers/ItAssetRequestController.php:281
 * @route '/it-asset-requests/{it_asset_request}/edit'
 */
export const edit = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/it-asset-requests/{it_asset_request}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ItAssetRequestController::edit
 * @see app/Http/Controllers/ItAssetRequestController.php:281
 * @route '/it-asset-requests/{it_asset_request}/edit'
 */
edit.url = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { it_asset_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { it_asset_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    it_asset_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        it_asset_request: typeof args.it_asset_request === 'object'
                ? args.it_asset_request.id
                : args.it_asset_request,
                }

    return edit.definition.url
            .replace('{it_asset_request}', parsedArgs.it_asset_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ItAssetRequestController::edit
 * @see app/Http/Controllers/ItAssetRequestController.php:281
 * @route '/it-asset-requests/{it_asset_request}/edit'
 */
edit.get = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ItAssetRequestController::edit
 * @see app/Http/Controllers/ItAssetRequestController.php:281
 * @route '/it-asset-requests/{it_asset_request}/edit'
 */
edit.head = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ItAssetRequestController::edit
 * @see app/Http/Controllers/ItAssetRequestController.php:281
 * @route '/it-asset-requests/{it_asset_request}/edit'
 */
    const editForm = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ItAssetRequestController::edit
 * @see app/Http/Controllers/ItAssetRequestController.php:281
 * @route '/it-asset-requests/{it_asset_request}/edit'
 */
        editForm.get = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ItAssetRequestController::edit
 * @see app/Http/Controllers/ItAssetRequestController.php:281
 * @route '/it-asset-requests/{it_asset_request}/edit'
 */
        editForm.head = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\ItAssetRequestController::update
 * @see app/Http/Controllers/ItAssetRequestController.php:322
 * @route '/it-asset-requests/{it_asset_request}'
 */
export const update = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/it-asset-requests/{it_asset_request}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\ItAssetRequestController::update
 * @see app/Http/Controllers/ItAssetRequestController.php:322
 * @route '/it-asset-requests/{it_asset_request}'
 */
update.url = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { it_asset_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { it_asset_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    it_asset_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        it_asset_request: typeof args.it_asset_request === 'object'
                ? args.it_asset_request.id
                : args.it_asset_request,
                }

    return update.definition.url
            .replace('{it_asset_request}', parsedArgs.it_asset_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ItAssetRequestController::update
 * @see app/Http/Controllers/ItAssetRequestController.php:322
 * @route '/it-asset-requests/{it_asset_request}'
 */
update.put = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\ItAssetRequestController::update
 * @see app/Http/Controllers/ItAssetRequestController.php:322
 * @route '/it-asset-requests/{it_asset_request}'
 */
update.patch = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\ItAssetRequestController::update
 * @see app/Http/Controllers/ItAssetRequestController.php:322
 * @route '/it-asset-requests/{it_asset_request}'
 */
    const updateForm = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ItAssetRequestController::update
 * @see app/Http/Controllers/ItAssetRequestController.php:322
 * @route '/it-asset-requests/{it_asset_request}'
 */
        updateForm.put = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\ItAssetRequestController::update
 * @see app/Http/Controllers/ItAssetRequestController.php:322
 * @route '/it-asset-requests/{it_asset_request}'
 */
        updateForm.patch = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\ItAssetRequestController::destroy
 * @see app/Http/Controllers/ItAssetRequestController.php:431
 * @route '/it-asset-requests/{it_asset_request}'
 */
export const destroy = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/it-asset-requests/{it_asset_request}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ItAssetRequestController::destroy
 * @see app/Http/Controllers/ItAssetRequestController.php:431
 * @route '/it-asset-requests/{it_asset_request}'
 */
destroy.url = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { it_asset_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { it_asset_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    it_asset_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        it_asset_request: typeof args.it_asset_request === 'object'
                ? args.it_asset_request.id
                : args.it_asset_request,
                }

    return destroy.definition.url
            .replace('{it_asset_request}', parsedArgs.it_asset_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ItAssetRequestController::destroy
 * @see app/Http/Controllers/ItAssetRequestController.php:431
 * @route '/it-asset-requests/{it_asset_request}'
 */
destroy.delete = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\ItAssetRequestController::destroy
 * @see app/Http/Controllers/ItAssetRequestController.php:431
 * @route '/it-asset-requests/{it_asset_request}'
 */
    const destroyForm = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ItAssetRequestController::destroy
 * @see app/Http/Controllers/ItAssetRequestController.php:431
 * @route '/it-asset-requests/{it_asset_request}'
 */
        destroyForm.delete = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\ItAssetRequestController::submit
 * @see app/Http/Controllers/ItAssetRequestController.php:168
 * @route '/it-asset-requests/{it_asset_request}/submit'
 */
export const submit = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submit.url(args, options),
    method: 'post',
})

submit.definition = {
    methods: ["post"],
    url: '/it-asset-requests/{it_asset_request}/submit',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ItAssetRequestController::submit
 * @see app/Http/Controllers/ItAssetRequestController.php:168
 * @route '/it-asset-requests/{it_asset_request}/submit'
 */
submit.url = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { it_asset_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { it_asset_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    it_asset_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        it_asset_request: typeof args.it_asset_request === 'object'
                ? args.it_asset_request.id
                : args.it_asset_request,
                }

    return submit.definition.url
            .replace('{it_asset_request}', parsedArgs.it_asset_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ItAssetRequestController::submit
 * @see app/Http/Controllers/ItAssetRequestController.php:168
 * @route '/it-asset-requests/{it_asset_request}/submit'
 */
submit.post = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submit.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ItAssetRequestController::submit
 * @see app/Http/Controllers/ItAssetRequestController.php:168
 * @route '/it-asset-requests/{it_asset_request}/submit'
 */
    const submitForm = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: submit.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ItAssetRequestController::submit
 * @see app/Http/Controllers/ItAssetRequestController.php:168
 * @route '/it-asset-requests/{it_asset_request}/submit'
 */
        submitForm.post = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: submit.url(args, options),
            method: 'post',
        })
    
    submit.form = submitForm
/**
* @see \App\Http\Controllers\ItAssetRequestController::decide
 * @see app/Http/Controllers/ItAssetRequestController.php:198
 * @route '/it-asset-requests/{it_asset_request}/decide'
 */
export const decide = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: decide.url(args, options),
    method: 'post',
})

decide.definition = {
    methods: ["post"],
    url: '/it-asset-requests/{it_asset_request}/decide',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ItAssetRequestController::decide
 * @see app/Http/Controllers/ItAssetRequestController.php:198
 * @route '/it-asset-requests/{it_asset_request}/decide'
 */
decide.url = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { it_asset_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { it_asset_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    it_asset_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        it_asset_request: typeof args.it_asset_request === 'object'
                ? args.it_asset_request.id
                : args.it_asset_request,
                }

    return decide.definition.url
            .replace('{it_asset_request}', parsedArgs.it_asset_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ItAssetRequestController::decide
 * @see app/Http/Controllers/ItAssetRequestController.php:198
 * @route '/it-asset-requests/{it_asset_request}/decide'
 */
decide.post = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: decide.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ItAssetRequestController::decide
 * @see app/Http/Controllers/ItAssetRequestController.php:198
 * @route '/it-asset-requests/{it_asset_request}/decide'
 */
    const decideForm = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: decide.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ItAssetRequestController::decide
 * @see app/Http/Controllers/ItAssetRequestController.php:198
 * @route '/it-asset-requests/{it_asset_request}/decide'
 */
        decideForm.post = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: decide.url(args, options),
            method: 'post',
        })
    
    decide.form = decideForm
/**
* @see \App\Http\Controllers\ItAssetRequestController::print
 * @see app/Http/Controllers/ItAssetRequestController.php:255
 * @route '/it-asset-requests/{it_asset_request}/print'
 */
export const print = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: print.url(args, options),
    method: 'get',
})

print.definition = {
    methods: ["get","head"],
    url: '/it-asset-requests/{it_asset_request}/print',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ItAssetRequestController::print
 * @see app/Http/Controllers/ItAssetRequestController.php:255
 * @route '/it-asset-requests/{it_asset_request}/print'
 */
print.url = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { it_asset_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { it_asset_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    it_asset_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        it_asset_request: typeof args.it_asset_request === 'object'
                ? args.it_asset_request.id
                : args.it_asset_request,
                }

    return print.definition.url
            .replace('{it_asset_request}', parsedArgs.it_asset_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ItAssetRequestController::print
 * @see app/Http/Controllers/ItAssetRequestController.php:255
 * @route '/it-asset-requests/{it_asset_request}/print'
 */
print.get = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: print.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ItAssetRequestController::print
 * @see app/Http/Controllers/ItAssetRequestController.php:255
 * @route '/it-asset-requests/{it_asset_request}/print'
 */
print.head = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: print.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ItAssetRequestController::print
 * @see app/Http/Controllers/ItAssetRequestController.php:255
 * @route '/it-asset-requests/{it_asset_request}/print'
 */
    const printForm = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: print.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ItAssetRequestController::print
 * @see app/Http/Controllers/ItAssetRequestController.php:255
 * @route '/it-asset-requests/{it_asset_request}/print'
 */
        printForm.get = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: print.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ItAssetRequestController::print
 * @see app/Http/Controllers/ItAssetRequestController.php:255
 * @route '/it-asset-requests/{it_asset_request}/print'
 */
        printForm.head = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\ItAssetRequestController::updateSignatures
 * @see app/Http/Controllers/ItAssetRequestController.php:357
 * @route '/it-asset-requests/{it_asset_request}/signatures'
 */
export const updateSignatures = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateSignatures.url(args, options),
    method: 'post',
})

updateSignatures.definition = {
    methods: ["post"],
    url: '/it-asset-requests/{it_asset_request}/signatures',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ItAssetRequestController::updateSignatures
 * @see app/Http/Controllers/ItAssetRequestController.php:357
 * @route '/it-asset-requests/{it_asset_request}/signatures'
 */
updateSignatures.url = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { it_asset_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { it_asset_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    it_asset_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        it_asset_request: typeof args.it_asset_request === 'object'
                ? args.it_asset_request.id
                : args.it_asset_request,
                }

    return updateSignatures.definition.url
            .replace('{it_asset_request}', parsedArgs.it_asset_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ItAssetRequestController::updateSignatures
 * @see app/Http/Controllers/ItAssetRequestController.php:357
 * @route '/it-asset-requests/{it_asset_request}/signatures'
 */
updateSignatures.post = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateSignatures.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ItAssetRequestController::updateSignatures
 * @see app/Http/Controllers/ItAssetRequestController.php:357
 * @route '/it-asset-requests/{it_asset_request}/signatures'
 */
    const updateSignaturesForm = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateSignatures.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ItAssetRequestController::updateSignatures
 * @see app/Http/Controllers/ItAssetRequestController.php:357
 * @route '/it-asset-requests/{it_asset_request}/signatures'
 */
        updateSignaturesForm.post = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateSignatures.url(args, options),
            method: 'post',
        })
    
    updateSignatures.form = updateSignaturesForm
const ItAssetRequestController = { index, create, store, show, edit, update, destroy, submit, decide, print, updateSignatures }

export default ItAssetRequestController