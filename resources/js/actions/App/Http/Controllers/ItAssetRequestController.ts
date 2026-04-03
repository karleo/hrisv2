import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ItAssetRequestController::index
 * @see app/Http/Controllers/ItAssetRequestController.php:23
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
 * @see app/Http/Controllers/ItAssetRequestController.php:23
 * @route '/it-asset-requests'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ItAssetRequestController::index
 * @see app/Http/Controllers/ItAssetRequestController.php:23
 * @route '/it-asset-requests'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ItAssetRequestController::index
 * @see app/Http/Controllers/ItAssetRequestController.php:23
 * @route '/it-asset-requests'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ItAssetRequestController::create
 * @see app/Http/Controllers/ItAssetRequestController.php:47
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
 * @see app/Http/Controllers/ItAssetRequestController.php:47
 * @route '/it-asset-requests/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ItAssetRequestController::create
 * @see app/Http/Controllers/ItAssetRequestController.php:47
 * @route '/it-asset-requests/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ItAssetRequestController::create
 * @see app/Http/Controllers/ItAssetRequestController.php:47
 * @route '/it-asset-requests/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ItAssetRequestController::store
 * @see app/Http/Controllers/ItAssetRequestController.php:66
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
 * @see app/Http/Controllers/ItAssetRequestController.php:66
 * @route '/it-asset-requests'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ItAssetRequestController::store
 * @see app/Http/Controllers/ItAssetRequestController.php:66
 * @route '/it-asset-requests'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ItAssetRequestController::show
 * @see app/Http/Controllers/ItAssetRequestController.php:87
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
 * @see app/Http/Controllers/ItAssetRequestController.php:87
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
 * @see app/Http/Controllers/ItAssetRequestController.php:87
 * @route '/it-asset-requests/{it_asset_request}'
 */
show.get = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ItAssetRequestController::show
 * @see app/Http/Controllers/ItAssetRequestController.php:87
 * @route '/it-asset-requests/{it_asset_request}'
 */
show.head = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ItAssetRequestController::edit
 * @see app/Http/Controllers/ItAssetRequestController.php:166
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
 * @see app/Http/Controllers/ItAssetRequestController.php:166
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
 * @see app/Http/Controllers/ItAssetRequestController.php:166
 * @route '/it-asset-requests/{it_asset_request}/edit'
 */
edit.get = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ItAssetRequestController::edit
 * @see app/Http/Controllers/ItAssetRequestController.php:166
 * @route '/it-asset-requests/{it_asset_request}/edit'
 */
edit.head = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ItAssetRequestController::update
 * @see app/Http/Controllers/ItAssetRequestController.php:196
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
 * @see app/Http/Controllers/ItAssetRequestController.php:196
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
 * @see app/Http/Controllers/ItAssetRequestController.php:196
 * @route '/it-asset-requests/{it_asset_request}'
 */
update.put = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\ItAssetRequestController::update
 * @see app/Http/Controllers/ItAssetRequestController.php:196
 * @route '/it-asset-requests/{it_asset_request}'
 */
update.patch = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\ItAssetRequestController::destroy
 * @see app/Http/Controllers/ItAssetRequestController.php:265
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
 * @see app/Http/Controllers/ItAssetRequestController.php:265
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
 * @see app/Http/Controllers/ItAssetRequestController.php:265
 * @route '/it-asset-requests/{it_asset_request}'
 */
destroy.delete = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\ItAssetRequestController::submit
 * @see app/Http/Controllers/ItAssetRequestController.php:122
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
 * @see app/Http/Controllers/ItAssetRequestController.php:122
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
 * @see app/Http/Controllers/ItAssetRequestController.php:122
 * @route '/it-asset-requests/{it_asset_request}/submit'
 */
submit.post = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submit.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ItAssetRequestController::print
 * @see app/Http/Controllers/ItAssetRequestController.php:136
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
 * @see app/Http/Controllers/ItAssetRequestController.php:136
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
 * @see app/Http/Controllers/ItAssetRequestController.php:136
 * @route '/it-asset-requests/{it_asset_request}/print'
 */
print.get = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: print.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ItAssetRequestController::print
 * @see app/Http/Controllers/ItAssetRequestController.php:136
 * @route '/it-asset-requests/{it_asset_request}/print'
 */
print.head = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: print.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ItAssetRequestController::updateSignatures
 * @see app/Http/Controllers/ItAssetRequestController.php:219
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
 * @see app/Http/Controllers/ItAssetRequestController.php:219
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
 * @see app/Http/Controllers/ItAssetRequestController.php:219
 * @route '/it-asset-requests/{it_asset_request}/signatures'
 */
updateSignatures.post = (args: { it_asset_request: number | { id: number } } | [it_asset_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateSignatures.url(args, options),
    method: 'post',
})
const ItAssetRequestController = { index, create, store, show, edit, update, destroy, submit, print, updateSignatures }

export default ItAssetRequestController