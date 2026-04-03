import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\JobPositionController::index
 * @see app/Http/Controllers/JobPositionController.php:18
 * @route '/job-positions'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/job-positions',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\JobPositionController::index
 * @see app/Http/Controllers/JobPositionController.php:18
 * @route '/job-positions'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\JobPositionController::index
 * @see app/Http/Controllers/JobPositionController.php:18
 * @route '/job-positions'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\JobPositionController::index
 * @see app/Http/Controllers/JobPositionController.php:18
 * @route '/job-positions'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\JobPositionController::create
 * @see app/Http/Controllers/JobPositionController.php:42
 * @route '/job-positions/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/job-positions/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\JobPositionController::create
 * @see app/Http/Controllers/JobPositionController.php:42
 * @route '/job-positions/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\JobPositionController::create
 * @see app/Http/Controllers/JobPositionController.php:42
 * @route '/job-positions/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\JobPositionController::create
 * @see app/Http/Controllers/JobPositionController.php:42
 * @route '/job-positions/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\JobPositionController::store
 * @see app/Http/Controllers/JobPositionController.php:50
 * @route '/job-positions'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/job-positions',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\JobPositionController::store
 * @see app/Http/Controllers/JobPositionController.php:50
 * @route '/job-positions'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\JobPositionController::store
 * @see app/Http/Controllers/JobPositionController.php:50
 * @route '/job-positions'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\JobPositionController::show
 * @see app/Http/Controllers/JobPositionController.php:0
 * @route '/job-positions/{job_position}'
 */
export const show = (args: { job_position: string | number } | [job_position: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/job-positions/{job_position}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\JobPositionController::show
 * @see app/Http/Controllers/JobPositionController.php:0
 * @route '/job-positions/{job_position}'
 */
show.url = (args: { job_position: string | number } | [job_position: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { job_position: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    job_position: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        job_position: args.job_position,
                }

    return show.definition.url
            .replace('{job_position}', parsedArgs.job_position.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\JobPositionController::show
 * @see app/Http/Controllers/JobPositionController.php:0
 * @route '/job-positions/{job_position}'
 */
show.get = (args: { job_position: string | number } | [job_position: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\JobPositionController::show
 * @see app/Http/Controllers/JobPositionController.php:0
 * @route '/job-positions/{job_position}'
 */
show.head = (args: { job_position: string | number } | [job_position: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\JobPositionController::edit
 * @see app/Http/Controllers/JobPositionController.php:60
 * @route '/job-positions/{job_position}/edit'
 */
export const edit = (args: { job_position: number | { id: number } } | [job_position: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/job-positions/{job_position}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\JobPositionController::edit
 * @see app/Http/Controllers/JobPositionController.php:60
 * @route '/job-positions/{job_position}/edit'
 */
edit.url = (args: { job_position: number | { id: number } } | [job_position: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { job_position: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { job_position: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    job_position: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        job_position: typeof args.job_position === 'object'
                ? args.job_position.id
                : args.job_position,
                }

    return edit.definition.url
            .replace('{job_position}', parsedArgs.job_position.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\JobPositionController::edit
 * @see app/Http/Controllers/JobPositionController.php:60
 * @route '/job-positions/{job_position}/edit'
 */
edit.get = (args: { job_position: number | { id: number } } | [job_position: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\JobPositionController::edit
 * @see app/Http/Controllers/JobPositionController.php:60
 * @route '/job-positions/{job_position}/edit'
 */
edit.head = (args: { job_position: number | { id: number } } | [job_position: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\JobPositionController::update
 * @see app/Http/Controllers/JobPositionController.php:70
 * @route '/job-positions/{job_position}'
 */
export const update = (args: { job_position: number | { id: number } } | [job_position: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/job-positions/{job_position}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\JobPositionController::update
 * @see app/Http/Controllers/JobPositionController.php:70
 * @route '/job-positions/{job_position}'
 */
update.url = (args: { job_position: number | { id: number } } | [job_position: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { job_position: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { job_position: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    job_position: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        job_position: typeof args.job_position === 'object'
                ? args.job_position.id
                : args.job_position,
                }

    return update.definition.url
            .replace('{job_position}', parsedArgs.job_position.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\JobPositionController::update
 * @see app/Http/Controllers/JobPositionController.php:70
 * @route '/job-positions/{job_position}'
 */
update.put = (args: { job_position: number | { id: number } } | [job_position: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\JobPositionController::update
 * @see app/Http/Controllers/JobPositionController.php:70
 * @route '/job-positions/{job_position}'
 */
update.patch = (args: { job_position: number | { id: number } } | [job_position: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\JobPositionController::destroy
 * @see app/Http/Controllers/JobPositionController.php:80
 * @route '/job-positions/{job_position}'
 */
export const destroy = (args: { job_position: number | { id: number } } | [job_position: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/job-positions/{job_position}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\JobPositionController::destroy
 * @see app/Http/Controllers/JobPositionController.php:80
 * @route '/job-positions/{job_position}'
 */
destroy.url = (args: { job_position: number | { id: number } } | [job_position: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { job_position: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { job_position: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    job_position: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        job_position: typeof args.job_position === 'object'
                ? args.job_position.id
                : args.job_position,
                }

    return destroy.definition.url
            .replace('{job_position}', parsedArgs.job_position.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\JobPositionController::destroy
 * @see app/Http/Controllers/JobPositionController.php:80
 * @route '/job-positions/{job_position}'
 */
destroy.delete = (args: { job_position: number | { id: number } } | [job_position: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})
const JobPositionController = { index, create, store, show, edit, update, destroy }

export default JobPositionController