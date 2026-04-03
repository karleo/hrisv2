import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\HardwareController::index
 * @see app/Http/Controllers/HardwareController.php:18
 * @route '/hardware'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/hardware',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\HardwareController::index
 * @see app/Http/Controllers/HardwareController.php:18
 * @route '/hardware'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\HardwareController::index
 * @see app/Http/Controllers/HardwareController.php:18
 * @route '/hardware'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\HardwareController::index
 * @see app/Http/Controllers/HardwareController.php:18
 * @route '/hardware'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\HardwareController::create
 * @see app/Http/Controllers/HardwareController.php:42
 * @route '/hardware/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/hardware/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\HardwareController::create
 * @see app/Http/Controllers/HardwareController.php:42
 * @route '/hardware/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\HardwareController::create
 * @see app/Http/Controllers/HardwareController.php:42
 * @route '/hardware/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\HardwareController::create
 * @see app/Http/Controllers/HardwareController.php:42
 * @route '/hardware/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\HardwareController::store
 * @see app/Http/Controllers/HardwareController.php:50
 * @route '/hardware'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/hardware',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\HardwareController::store
 * @see app/Http/Controllers/HardwareController.php:50
 * @route '/hardware'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\HardwareController::store
 * @see app/Http/Controllers/HardwareController.php:50
 * @route '/hardware'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\HardwareController::show
 * @see app/Http/Controllers/HardwareController.php:0
 * @route '/hardware/{hardware}'
 */
export const show = (args: { hardware: string | number } | [hardware: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/hardware/{hardware}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\HardwareController::show
 * @see app/Http/Controllers/HardwareController.php:0
 * @route '/hardware/{hardware}'
 */
show.url = (args: { hardware: string | number } | [hardware: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { hardware: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    hardware: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        hardware: args.hardware,
                }

    return show.definition.url
            .replace('{hardware}', parsedArgs.hardware.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\HardwareController::show
 * @see app/Http/Controllers/HardwareController.php:0
 * @route '/hardware/{hardware}'
 */
show.get = (args: { hardware: string | number } | [hardware: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\HardwareController::show
 * @see app/Http/Controllers/HardwareController.php:0
 * @route '/hardware/{hardware}'
 */
show.head = (args: { hardware: string | number } | [hardware: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\HardwareController::edit
 * @see app/Http/Controllers/HardwareController.php:60
 * @route '/hardware/{hardware}/edit'
 */
export const edit = (args: { hardware: number | { id: number } } | [hardware: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/hardware/{hardware}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\HardwareController::edit
 * @see app/Http/Controllers/HardwareController.php:60
 * @route '/hardware/{hardware}/edit'
 */
edit.url = (args: { hardware: number | { id: number } } | [hardware: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { hardware: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { hardware: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    hardware: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        hardware: typeof args.hardware === 'object'
                ? args.hardware.id
                : args.hardware,
                }

    return edit.definition.url
            .replace('{hardware}', parsedArgs.hardware.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\HardwareController::edit
 * @see app/Http/Controllers/HardwareController.php:60
 * @route '/hardware/{hardware}/edit'
 */
edit.get = (args: { hardware: number | { id: number } } | [hardware: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\HardwareController::edit
 * @see app/Http/Controllers/HardwareController.php:60
 * @route '/hardware/{hardware}/edit'
 */
edit.head = (args: { hardware: number | { id: number } } | [hardware: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\HardwareController::update
 * @see app/Http/Controllers/HardwareController.php:70
 * @route '/hardware/{hardware}'
 */
export const update = (args: { hardware: number | { id: number } } | [hardware: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/hardware/{hardware}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\HardwareController::update
 * @see app/Http/Controllers/HardwareController.php:70
 * @route '/hardware/{hardware}'
 */
update.url = (args: { hardware: number | { id: number } } | [hardware: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { hardware: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { hardware: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    hardware: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        hardware: typeof args.hardware === 'object'
                ? args.hardware.id
                : args.hardware,
                }

    return update.definition.url
            .replace('{hardware}', parsedArgs.hardware.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\HardwareController::update
 * @see app/Http/Controllers/HardwareController.php:70
 * @route '/hardware/{hardware}'
 */
update.put = (args: { hardware: number | { id: number } } | [hardware: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\HardwareController::update
 * @see app/Http/Controllers/HardwareController.php:70
 * @route '/hardware/{hardware}'
 */
update.patch = (args: { hardware: number | { id: number } } | [hardware: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\HardwareController::destroy
 * @see app/Http/Controllers/HardwareController.php:80
 * @route '/hardware/{hardware}'
 */
export const destroy = (args: { hardware: number | { id: number } } | [hardware: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/hardware/{hardware}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\HardwareController::destroy
 * @see app/Http/Controllers/HardwareController.php:80
 * @route '/hardware/{hardware}'
 */
destroy.url = (args: { hardware: number | { id: number } } | [hardware: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { hardware: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { hardware: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    hardware: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        hardware: typeof args.hardware === 'object'
                ? args.hardware.id
                : args.hardware,
                }

    return destroy.definition.url
            .replace('{hardware}', parsedArgs.hardware.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\HardwareController::destroy
 * @see app/Http/Controllers/HardwareController.php:80
 * @route '/hardware/{hardware}'
 */
destroy.delete = (args: { hardware: number | { id: number } } | [hardware: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})
const HardwareController = { index, create, store, show, edit, update, destroy }

export default HardwareController