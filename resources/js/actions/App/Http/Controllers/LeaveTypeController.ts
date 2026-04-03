import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\LeaveTypeController::index
 * @see app/Http/Controllers/LeaveTypeController.php:18
 * @route '/leave-types'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/leave-types',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\LeaveTypeController::index
 * @see app/Http/Controllers/LeaveTypeController.php:18
 * @route '/leave-types'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\LeaveTypeController::index
 * @see app/Http/Controllers/LeaveTypeController.php:18
 * @route '/leave-types'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\LeaveTypeController::index
 * @see app/Http/Controllers/LeaveTypeController.php:18
 * @route '/leave-types'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\LeaveTypeController::create
 * @see app/Http/Controllers/LeaveTypeController.php:42
 * @route '/leave-types/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/leave-types/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\LeaveTypeController::create
 * @see app/Http/Controllers/LeaveTypeController.php:42
 * @route '/leave-types/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\LeaveTypeController::create
 * @see app/Http/Controllers/LeaveTypeController.php:42
 * @route '/leave-types/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\LeaveTypeController::create
 * @see app/Http/Controllers/LeaveTypeController.php:42
 * @route '/leave-types/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\LeaveTypeController::store
 * @see app/Http/Controllers/LeaveTypeController.php:50
 * @route '/leave-types'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/leave-types',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\LeaveTypeController::store
 * @see app/Http/Controllers/LeaveTypeController.php:50
 * @route '/leave-types'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\LeaveTypeController::store
 * @see app/Http/Controllers/LeaveTypeController.php:50
 * @route '/leave-types'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\LeaveTypeController::show
 * @see app/Http/Controllers/LeaveTypeController.php:0
 * @route '/leave-types/{leave_type}'
 */
export const show = (args: { leave_type: string | number } | [leave_type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/leave-types/{leave_type}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\LeaveTypeController::show
 * @see app/Http/Controllers/LeaveTypeController.php:0
 * @route '/leave-types/{leave_type}'
 */
show.url = (args: { leave_type: string | number } | [leave_type: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { leave_type: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    leave_type: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        leave_type: args.leave_type,
                }

    return show.definition.url
            .replace('{leave_type}', parsedArgs.leave_type.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\LeaveTypeController::show
 * @see app/Http/Controllers/LeaveTypeController.php:0
 * @route '/leave-types/{leave_type}'
 */
show.get = (args: { leave_type: string | number } | [leave_type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\LeaveTypeController::show
 * @see app/Http/Controllers/LeaveTypeController.php:0
 * @route '/leave-types/{leave_type}'
 */
show.head = (args: { leave_type: string | number } | [leave_type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\LeaveTypeController::edit
 * @see app/Http/Controllers/LeaveTypeController.php:60
 * @route '/leave-types/{leave_type}/edit'
 */
export const edit = (args: { leave_type: number | { id: number } } | [leave_type: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/leave-types/{leave_type}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\LeaveTypeController::edit
 * @see app/Http/Controllers/LeaveTypeController.php:60
 * @route '/leave-types/{leave_type}/edit'
 */
edit.url = (args: { leave_type: number | { id: number } } | [leave_type: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { leave_type: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { leave_type: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    leave_type: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        leave_type: typeof args.leave_type === 'object'
                ? args.leave_type.id
                : args.leave_type,
                }

    return edit.definition.url
            .replace('{leave_type}', parsedArgs.leave_type.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\LeaveTypeController::edit
 * @see app/Http/Controllers/LeaveTypeController.php:60
 * @route '/leave-types/{leave_type}/edit'
 */
edit.get = (args: { leave_type: number | { id: number } } | [leave_type: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\LeaveTypeController::edit
 * @see app/Http/Controllers/LeaveTypeController.php:60
 * @route '/leave-types/{leave_type}/edit'
 */
edit.head = (args: { leave_type: number | { id: number } } | [leave_type: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\LeaveTypeController::update
 * @see app/Http/Controllers/LeaveTypeController.php:70
 * @route '/leave-types/{leave_type}'
 */
export const update = (args: { leave_type: number | { id: number } } | [leave_type: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/leave-types/{leave_type}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\LeaveTypeController::update
 * @see app/Http/Controllers/LeaveTypeController.php:70
 * @route '/leave-types/{leave_type}'
 */
update.url = (args: { leave_type: number | { id: number } } | [leave_type: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { leave_type: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { leave_type: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    leave_type: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        leave_type: typeof args.leave_type === 'object'
                ? args.leave_type.id
                : args.leave_type,
                }

    return update.definition.url
            .replace('{leave_type}', parsedArgs.leave_type.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\LeaveTypeController::update
 * @see app/Http/Controllers/LeaveTypeController.php:70
 * @route '/leave-types/{leave_type}'
 */
update.put = (args: { leave_type: number | { id: number } } | [leave_type: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\LeaveTypeController::update
 * @see app/Http/Controllers/LeaveTypeController.php:70
 * @route '/leave-types/{leave_type}'
 */
update.patch = (args: { leave_type: number | { id: number } } | [leave_type: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\LeaveTypeController::destroy
 * @see app/Http/Controllers/LeaveTypeController.php:80
 * @route '/leave-types/{leave_type}'
 */
export const destroy = (args: { leave_type: number | { id: number } } | [leave_type: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/leave-types/{leave_type}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\LeaveTypeController::destroy
 * @see app/Http/Controllers/LeaveTypeController.php:80
 * @route '/leave-types/{leave_type}'
 */
destroy.url = (args: { leave_type: number | { id: number } } | [leave_type: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { leave_type: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { leave_type: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    leave_type: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        leave_type: typeof args.leave_type === 'object'
                ? args.leave_type.id
                : args.leave_type,
                }

    return destroy.definition.url
            .replace('{leave_type}', parsedArgs.leave_type.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\LeaveTypeController::destroy
 * @see app/Http/Controllers/LeaveTypeController.php:80
 * @route '/leave-types/{leave_type}'
 */
destroy.delete = (args: { leave_type: number | { id: number } } | [leave_type: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})
const LeaveTypeController = { index, create, store, show, edit, update, destroy }

export default LeaveTypeController