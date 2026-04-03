import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
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
* @see \App\Http\Controllers\LeaveRequestController::create
 * @see app/Http/Controllers/LeaveRequestController.php:48
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
 * @see app/Http/Controllers/LeaveRequestController.php:48
 * @route '/leave-requests/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\LeaveRequestController::create
 * @see app/Http/Controllers/LeaveRequestController.php:48
 * @route '/leave-requests/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\LeaveRequestController::create
 * @see app/Http/Controllers/LeaveRequestController.php:48
 * @route '/leave-requests/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\LeaveRequestController::store
 * @see app/Http/Controllers/LeaveRequestController.php:65
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
 * @see app/Http/Controllers/LeaveRequestController.php:65
 * @route '/leave-requests'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\LeaveRequestController::store
 * @see app/Http/Controllers/LeaveRequestController.php:65
 * @route '/leave-requests'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\LeaveRequestController::show
 * @see app/Http/Controllers/LeaveRequestController.php:94
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
 * @see app/Http/Controllers/LeaveRequestController.php:94
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
 * @see app/Http/Controllers/LeaveRequestController.php:94
 * @route '/leave-requests/{leave_request}'
 */
show.get = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\LeaveRequestController::show
 * @see app/Http/Controllers/LeaveRequestController.php:94
 * @route '/leave-requests/{leave_request}'
 */
show.head = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\LeaveRequestController::edit
 * @see app/Http/Controllers/LeaveRequestController.php:132
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
 * @see app/Http/Controllers/LeaveRequestController.php:132
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
 * @see app/Http/Controllers/LeaveRequestController.php:132
 * @route '/leave-requests/{leave_request}/edit'
 */
edit.get = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\LeaveRequestController::edit
 * @see app/Http/Controllers/LeaveRequestController.php:132
 * @route '/leave-requests/{leave_request}/edit'
 */
edit.head = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\LeaveRequestController::update
 * @see app/Http/Controllers/LeaveRequestController.php:159
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
 * @see app/Http/Controllers/LeaveRequestController.php:159
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
 * @see app/Http/Controllers/LeaveRequestController.php:159
 * @route '/leave-requests/{leave_request}'
 */
update.put = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\LeaveRequestController::update
 * @see app/Http/Controllers/LeaveRequestController.php:159
 * @route '/leave-requests/{leave_request}'
 */
update.patch = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\LeaveRequestController::destroy
 * @see app/Http/Controllers/LeaveRequestController.php:189
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
 * @see app/Http/Controllers/LeaveRequestController.php:189
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
 * @see app/Http/Controllers/LeaveRequestController.php:189
 * @route '/leave-requests/{leave_request}'
 */
destroy.delete = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\LeaveRequestController::submit
 * @see app/Http/Controllers/LeaveRequestController.php:118
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
 * @see app/Http/Controllers/LeaveRequestController.php:118
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
 * @see app/Http/Controllers/LeaveRequestController.php:118
 * @route '/leave-requests/{leave_request}/submit'
 */
submit.post = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submit.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\LeaveRequestController::print
 * @see app/Http/Controllers/LeaveRequestController.php:206
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
 * @see app/Http/Controllers/LeaveRequestController.php:206
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
 * @see app/Http/Controllers/LeaveRequestController.php:206
 * @route '/leave-requests/{leave_request}/print'
 */
print.get = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: print.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\LeaveRequestController::print
 * @see app/Http/Controllers/LeaveRequestController.php:206
 * @route '/leave-requests/{leave_request}/print'
 */
print.head = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: print.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\LeaveRequestController::updateSignatures
 * @see app/Http/Controllers/LeaveRequestController.php:230
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
 * @see app/Http/Controllers/LeaveRequestController.php:230
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
 * @see app/Http/Controllers/LeaveRequestController.php:230
 * @route '/leave-requests/{leave_request}/signatures'
 */
updateSignatures.post = (args: { leave_request: number | { id: number } } | [leave_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateSignatures.url(args, options),
    method: 'post',
})
const LeaveRequestController = { index, create, store, show, edit, update, destroy, submit, print, updateSignatures }

export default LeaveRequestController