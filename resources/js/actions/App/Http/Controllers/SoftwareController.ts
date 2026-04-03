import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\SoftwareController::index
 * @see app/Http/Controllers/SoftwareController.php:18
 * @route '/software'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/software',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SoftwareController::index
 * @see app/Http/Controllers/SoftwareController.php:18
 * @route '/software'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SoftwareController::index
 * @see app/Http/Controllers/SoftwareController.php:18
 * @route '/software'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SoftwareController::index
 * @see app/Http/Controllers/SoftwareController.php:18
 * @route '/software'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SoftwareController::index
 * @see app/Http/Controllers/SoftwareController.php:18
 * @route '/software'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SoftwareController::index
 * @see app/Http/Controllers/SoftwareController.php:18
 * @route '/software'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SoftwareController::index
 * @see app/Http/Controllers/SoftwareController.php:18
 * @route '/software'
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
* @see \App\Http\Controllers\SoftwareController::create
 * @see app/Http/Controllers/SoftwareController.php:42
 * @route '/software/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/software/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SoftwareController::create
 * @see app/Http/Controllers/SoftwareController.php:42
 * @route '/software/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SoftwareController::create
 * @see app/Http/Controllers/SoftwareController.php:42
 * @route '/software/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SoftwareController::create
 * @see app/Http/Controllers/SoftwareController.php:42
 * @route '/software/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SoftwareController::create
 * @see app/Http/Controllers/SoftwareController.php:42
 * @route '/software/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SoftwareController::create
 * @see app/Http/Controllers/SoftwareController.php:42
 * @route '/software/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SoftwareController::create
 * @see app/Http/Controllers/SoftwareController.php:42
 * @route '/software/create'
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
* @see \App\Http\Controllers\SoftwareController::store
 * @see app/Http/Controllers/SoftwareController.php:50
 * @route '/software'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/software',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SoftwareController::store
 * @see app/Http/Controllers/SoftwareController.php:50
 * @route '/software'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SoftwareController::store
 * @see app/Http/Controllers/SoftwareController.php:50
 * @route '/software'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\SoftwareController::store
 * @see app/Http/Controllers/SoftwareController.php:50
 * @route '/software'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\SoftwareController::store
 * @see app/Http/Controllers/SoftwareController.php:50
 * @route '/software'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\SoftwareController::show
 * @see app/Http/Controllers/SoftwareController.php:0
 * @route '/software/{software}'
 */
export const show = (args: { software: string | number } | [software: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/software/{software}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SoftwareController::show
 * @see app/Http/Controllers/SoftwareController.php:0
 * @route '/software/{software}'
 */
show.url = (args: { software: string | number } | [software: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { software: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    software: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        software: args.software,
                }

    return show.definition.url
            .replace('{software}', parsedArgs.software.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SoftwareController::show
 * @see app/Http/Controllers/SoftwareController.php:0
 * @route '/software/{software}'
 */
show.get = (args: { software: string | number } | [software: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SoftwareController::show
 * @see app/Http/Controllers/SoftwareController.php:0
 * @route '/software/{software}'
 */
show.head = (args: { software: string | number } | [software: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SoftwareController::show
 * @see app/Http/Controllers/SoftwareController.php:0
 * @route '/software/{software}'
 */
    const showForm = (args: { software: string | number } | [software: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SoftwareController::show
 * @see app/Http/Controllers/SoftwareController.php:0
 * @route '/software/{software}'
 */
        showForm.get = (args: { software: string | number } | [software: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SoftwareController::show
 * @see app/Http/Controllers/SoftwareController.php:0
 * @route '/software/{software}'
 */
        showForm.head = (args: { software: string | number } | [software: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\SoftwareController::edit
 * @see app/Http/Controllers/SoftwareController.php:60
 * @route '/software/{software}/edit'
 */
export const edit = (args: { software: number | { id: number } } | [software: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/software/{software}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SoftwareController::edit
 * @see app/Http/Controllers/SoftwareController.php:60
 * @route '/software/{software}/edit'
 */
edit.url = (args: { software: number | { id: number } } | [software: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { software: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { software: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    software: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        software: typeof args.software === 'object'
                ? args.software.id
                : args.software,
                }

    return edit.definition.url
            .replace('{software}', parsedArgs.software.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SoftwareController::edit
 * @see app/Http/Controllers/SoftwareController.php:60
 * @route '/software/{software}/edit'
 */
edit.get = (args: { software: number | { id: number } } | [software: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SoftwareController::edit
 * @see app/Http/Controllers/SoftwareController.php:60
 * @route '/software/{software}/edit'
 */
edit.head = (args: { software: number | { id: number } } | [software: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SoftwareController::edit
 * @see app/Http/Controllers/SoftwareController.php:60
 * @route '/software/{software}/edit'
 */
    const editForm = (args: { software: number | { id: number } } | [software: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SoftwareController::edit
 * @see app/Http/Controllers/SoftwareController.php:60
 * @route '/software/{software}/edit'
 */
        editForm.get = (args: { software: number | { id: number } } | [software: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SoftwareController::edit
 * @see app/Http/Controllers/SoftwareController.php:60
 * @route '/software/{software}/edit'
 */
        editForm.head = (args: { software: number | { id: number } } | [software: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\SoftwareController::update
 * @see app/Http/Controllers/SoftwareController.php:70
 * @route '/software/{software}'
 */
export const update = (args: { software: number | { id: number } } | [software: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/software/{software}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\SoftwareController::update
 * @see app/Http/Controllers/SoftwareController.php:70
 * @route '/software/{software}'
 */
update.url = (args: { software: number | { id: number } } | [software: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { software: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { software: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    software: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        software: typeof args.software === 'object'
                ? args.software.id
                : args.software,
                }

    return update.definition.url
            .replace('{software}', parsedArgs.software.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SoftwareController::update
 * @see app/Http/Controllers/SoftwareController.php:70
 * @route '/software/{software}'
 */
update.put = (args: { software: number | { id: number } } | [software: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\SoftwareController::update
 * @see app/Http/Controllers/SoftwareController.php:70
 * @route '/software/{software}'
 */
update.patch = (args: { software: number | { id: number } } | [software: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\SoftwareController::update
 * @see app/Http/Controllers/SoftwareController.php:70
 * @route '/software/{software}'
 */
    const updateForm = (args: { software: number | { id: number } } | [software: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\SoftwareController::update
 * @see app/Http/Controllers/SoftwareController.php:70
 * @route '/software/{software}'
 */
        updateForm.put = (args: { software: number | { id: number } } | [software: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\SoftwareController::update
 * @see app/Http/Controllers/SoftwareController.php:70
 * @route '/software/{software}'
 */
        updateForm.patch = (args: { software: number | { id: number } } | [software: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\SoftwareController::destroy
 * @see app/Http/Controllers/SoftwareController.php:80
 * @route '/software/{software}'
 */
export const destroy = (args: { software: number | { id: number } } | [software: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/software/{software}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\SoftwareController::destroy
 * @see app/Http/Controllers/SoftwareController.php:80
 * @route '/software/{software}'
 */
destroy.url = (args: { software: number | { id: number } } | [software: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { software: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { software: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    software: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        software: typeof args.software === 'object'
                ? args.software.id
                : args.software,
                }

    return destroy.definition.url
            .replace('{software}', parsedArgs.software.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SoftwareController::destroy
 * @see app/Http/Controllers/SoftwareController.php:80
 * @route '/software/{software}'
 */
destroy.delete = (args: { software: number | { id: number } } | [software: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\SoftwareController::destroy
 * @see app/Http/Controllers/SoftwareController.php:80
 * @route '/software/{software}'
 */
    const destroyForm = (args: { software: number | { id: number } } | [software: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\SoftwareController::destroy
 * @see app/Http/Controllers/SoftwareController.php:80
 * @route '/software/{software}'
 */
        destroyForm.delete = (args: { software: number | { id: number } } | [software: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const SoftwareController = { index, create, store, show, edit, update, destroy }

export default SoftwareController