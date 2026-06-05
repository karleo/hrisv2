import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\EmployeeRequestController::index
 * @see app/Http/Controllers/EmployeeRequestController.php:41
 * @route '/employee-requests'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/employee-requests',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeRequestController::index
 * @see app/Http/Controllers/EmployeeRequestController.php:41
 * @route '/employee-requests'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeRequestController::index
 * @see app/Http/Controllers/EmployeeRequestController.php:41
 * @route '/employee-requests'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeRequestController::index
 * @see app/Http/Controllers/EmployeeRequestController.php:41
 * @route '/employee-requests'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EmployeeRequestController::index
 * @see app/Http/Controllers/EmployeeRequestController.php:41
 * @route '/employee-requests'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EmployeeRequestController::index
 * @see app/Http/Controllers/EmployeeRequestController.php:41
 * @route '/employee-requests'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EmployeeRequestController::index
 * @see app/Http/Controllers/EmployeeRequestController.php:41
 * @route '/employee-requests'
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
* @see \App\Http\Controllers\EmployeeRequestController::create
 * @see app/Http/Controllers/EmployeeRequestController.php:175
 * @route '/employee-requests/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/employee-requests/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeRequestController::create
 * @see app/Http/Controllers/EmployeeRequestController.php:175
 * @route '/employee-requests/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeRequestController::create
 * @see app/Http/Controllers/EmployeeRequestController.php:175
 * @route '/employee-requests/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeRequestController::create
 * @see app/Http/Controllers/EmployeeRequestController.php:175
 * @route '/employee-requests/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EmployeeRequestController::create
 * @see app/Http/Controllers/EmployeeRequestController.php:175
 * @route '/employee-requests/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EmployeeRequestController::create
 * @see app/Http/Controllers/EmployeeRequestController.php:175
 * @route '/employee-requests/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EmployeeRequestController::create
 * @see app/Http/Controllers/EmployeeRequestController.php:175
 * @route '/employee-requests/create'
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
* @see \App\Http\Controllers\EmployeeRequestController::store
 * @see app/Http/Controllers/EmployeeRequestController.php:195
 * @route '/employee-requests'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/employee-requests',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EmployeeRequestController::store
 * @see app/Http/Controllers/EmployeeRequestController.php:195
 * @route '/employee-requests'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeRequestController::store
 * @see app/Http/Controllers/EmployeeRequestController.php:195
 * @route '/employee-requests'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EmployeeRequestController::store
 * @see app/Http/Controllers/EmployeeRequestController.php:195
 * @route '/employee-requests'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EmployeeRequestController::store
 * @see app/Http/Controllers/EmployeeRequestController.php:195
 * @route '/employee-requests'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\EmployeeRequestController::show
 * @see app/Http/Controllers/EmployeeRequestController.php:237
 * @route '/employee-requests/{employee_request}'
 */
export const show = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/employee-requests/{employee_request}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeRequestController::show
 * @see app/Http/Controllers/EmployeeRequestController.php:237
 * @route '/employee-requests/{employee_request}'
 */
show.url = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { employee_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee_request: typeof args.employee_request === 'object'
                ? args.employee_request.id
                : args.employee_request,
                }

    return show.definition.url
            .replace('{employee_request}', parsedArgs.employee_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeRequestController::show
 * @see app/Http/Controllers/EmployeeRequestController.php:237
 * @route '/employee-requests/{employee_request}'
 */
show.get = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeRequestController::show
 * @see app/Http/Controllers/EmployeeRequestController.php:237
 * @route '/employee-requests/{employee_request}'
 */
show.head = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EmployeeRequestController::show
 * @see app/Http/Controllers/EmployeeRequestController.php:237
 * @route '/employee-requests/{employee_request}'
 */
    const showForm = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EmployeeRequestController::show
 * @see app/Http/Controllers/EmployeeRequestController.php:237
 * @route '/employee-requests/{employee_request}'
 */
        showForm.get = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EmployeeRequestController::show
 * @see app/Http/Controllers/EmployeeRequestController.php:237
 * @route '/employee-requests/{employee_request}'
 */
        showForm.head = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\EmployeeRequestController::edit
 * @see app/Http/Controllers/EmployeeRequestController.php:358
 * @route '/employee-requests/{employee_request}/edit'
 */
export const edit = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/employee-requests/{employee_request}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeRequestController::edit
 * @see app/Http/Controllers/EmployeeRequestController.php:358
 * @route '/employee-requests/{employee_request}/edit'
 */
edit.url = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { employee_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee_request: typeof args.employee_request === 'object'
                ? args.employee_request.id
                : args.employee_request,
                }

    return edit.definition.url
            .replace('{employee_request}', parsedArgs.employee_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeRequestController::edit
 * @see app/Http/Controllers/EmployeeRequestController.php:358
 * @route '/employee-requests/{employee_request}/edit'
 */
edit.get = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeRequestController::edit
 * @see app/Http/Controllers/EmployeeRequestController.php:358
 * @route '/employee-requests/{employee_request}/edit'
 */
edit.head = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EmployeeRequestController::edit
 * @see app/Http/Controllers/EmployeeRequestController.php:358
 * @route '/employee-requests/{employee_request}/edit'
 */
    const editForm = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EmployeeRequestController::edit
 * @see app/Http/Controllers/EmployeeRequestController.php:358
 * @route '/employee-requests/{employee_request}/edit'
 */
        editForm.get = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EmployeeRequestController::edit
 * @see app/Http/Controllers/EmployeeRequestController.php:358
 * @route '/employee-requests/{employee_request}/edit'
 */
        editForm.head = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\EmployeeRequestController::update
 * @see app/Http/Controllers/EmployeeRequestController.php:405
 * @route '/employee-requests/{employee_request}'
 */
export const update = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/employee-requests/{employee_request}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\EmployeeRequestController::update
 * @see app/Http/Controllers/EmployeeRequestController.php:405
 * @route '/employee-requests/{employee_request}'
 */
update.url = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { employee_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee_request: typeof args.employee_request === 'object'
                ? args.employee_request.id
                : args.employee_request,
                }

    return update.definition.url
            .replace('{employee_request}', parsedArgs.employee_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeRequestController::update
 * @see app/Http/Controllers/EmployeeRequestController.php:405
 * @route '/employee-requests/{employee_request}'
 */
update.put = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\EmployeeRequestController::update
 * @see app/Http/Controllers/EmployeeRequestController.php:405
 * @route '/employee-requests/{employee_request}'
 */
update.patch = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\EmployeeRequestController::update
 * @see app/Http/Controllers/EmployeeRequestController.php:405
 * @route '/employee-requests/{employee_request}'
 */
    const updateForm = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EmployeeRequestController::update
 * @see app/Http/Controllers/EmployeeRequestController.php:405
 * @route '/employee-requests/{employee_request}'
 */
        updateForm.put = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\EmployeeRequestController::update
 * @see app/Http/Controllers/EmployeeRequestController.php:405
 * @route '/employee-requests/{employee_request}'
 */
        updateForm.patch = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\EmployeeRequestController::destroy
 * @see app/Http/Controllers/EmployeeRequestController.php:474
 * @route '/employee-requests/{employee_request}'
 */
export const destroy = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/employee-requests/{employee_request}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\EmployeeRequestController::destroy
 * @see app/Http/Controllers/EmployeeRequestController.php:474
 * @route '/employee-requests/{employee_request}'
 */
destroy.url = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { employee_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee_request: typeof args.employee_request === 'object'
                ? args.employee_request.id
                : args.employee_request,
                }

    return destroy.definition.url
            .replace('{employee_request}', parsedArgs.employee_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeRequestController::destroy
 * @see app/Http/Controllers/EmployeeRequestController.php:474
 * @route '/employee-requests/{employee_request}'
 */
destroy.delete = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\EmployeeRequestController::destroy
 * @see app/Http/Controllers/EmployeeRequestController.php:474
 * @route '/employee-requests/{employee_request}'
 */
    const destroyForm = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EmployeeRequestController::destroy
 * @see app/Http/Controllers/EmployeeRequestController.php:474
 * @route '/employee-requests/{employee_request}'
 */
        destroyForm.delete = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\EmployeeRequestController::print
 * @see app/Http/Controllers/EmployeeRequestController.php:443
 * @route '/employee-requests/{employee_request}/print'
 */
export const print = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: print.url(args, options),
    method: 'get',
})

print.definition = {
    methods: ["get","head"],
    url: '/employee-requests/{employee_request}/print',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeRequestController::print
 * @see app/Http/Controllers/EmployeeRequestController.php:443
 * @route '/employee-requests/{employee_request}/print'
 */
print.url = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { employee_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee_request: typeof args.employee_request === 'object'
                ? args.employee_request.id
                : args.employee_request,
                }

    return print.definition.url
            .replace('{employee_request}', parsedArgs.employee_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeRequestController::print
 * @see app/Http/Controllers/EmployeeRequestController.php:443
 * @route '/employee-requests/{employee_request}/print'
 */
print.get = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: print.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeRequestController::print
 * @see app/Http/Controllers/EmployeeRequestController.php:443
 * @route '/employee-requests/{employee_request}/print'
 */
print.head = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: print.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EmployeeRequestController::print
 * @see app/Http/Controllers/EmployeeRequestController.php:443
 * @route '/employee-requests/{employee_request}/print'
 */
    const printForm = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: print.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EmployeeRequestController::print
 * @see app/Http/Controllers/EmployeeRequestController.php:443
 * @route '/employee-requests/{employee_request}/print'
 */
        printForm.get = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: print.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EmployeeRequestController::print
 * @see app/Http/Controllers/EmployeeRequestController.php:443
 * @route '/employee-requests/{employee_request}/print'
 */
        printForm.head = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\EmployeeRequestController::submit
 * @see app/Http/Controllers/EmployeeRequestController.php:280
 * @route '/employee-requests/{employee_request}/submit'
 */
export const submit = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submit.url(args, options),
    method: 'post',
})

submit.definition = {
    methods: ["post"],
    url: '/employee-requests/{employee_request}/submit',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EmployeeRequestController::submit
 * @see app/Http/Controllers/EmployeeRequestController.php:280
 * @route '/employee-requests/{employee_request}/submit'
 */
submit.url = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { employee_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee_request: typeof args.employee_request === 'object'
                ? args.employee_request.id
                : args.employee_request,
                }

    return submit.definition.url
            .replace('{employee_request}', parsedArgs.employee_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeRequestController::submit
 * @see app/Http/Controllers/EmployeeRequestController.php:280
 * @route '/employee-requests/{employee_request}/submit'
 */
submit.post = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submit.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EmployeeRequestController::submit
 * @see app/Http/Controllers/EmployeeRequestController.php:280
 * @route '/employee-requests/{employee_request}/submit'
 */
    const submitForm = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: submit.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EmployeeRequestController::submit
 * @see app/Http/Controllers/EmployeeRequestController.php:280
 * @route '/employee-requests/{employee_request}/submit'
 */
        submitForm.post = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: submit.url(args, options),
            method: 'post',
        })
    
    submit.form = submitForm
/**
* @see \App\Http\Controllers\EmployeeRequestController::decide
 * @see app/Http/Controllers/EmployeeRequestController.php:310
 * @route '/employee-requests/{employee_request}/decide'
 */
export const decide = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: decide.url(args, options),
    method: 'post',
})

decide.definition = {
    methods: ["post"],
    url: '/employee-requests/{employee_request}/decide',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EmployeeRequestController::decide
 * @see app/Http/Controllers/EmployeeRequestController.php:310
 * @route '/employee-requests/{employee_request}/decide'
 */
decide.url = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { employee_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee_request: typeof args.employee_request === 'object'
                ? args.employee_request.id
                : args.employee_request,
                }

    return decide.definition.url
            .replace('{employee_request}', parsedArgs.employee_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeRequestController::decide
 * @see app/Http/Controllers/EmployeeRequestController.php:310
 * @route '/employee-requests/{employee_request}/decide'
 */
decide.post = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: decide.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EmployeeRequestController::decide
 * @see app/Http/Controllers/EmployeeRequestController.php:310
 * @route '/employee-requests/{employee_request}/decide'
 */
    const decideForm = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: decide.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EmployeeRequestController::decide
 * @see app/Http/Controllers/EmployeeRequestController.php:310
 * @route '/employee-requests/{employee_request}/decide'
 */
        decideForm.post = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: decide.url(args, options),
            method: 'post',
        })
    
    decide.form = decideForm
/**
* @see \App\Http\Controllers\EmployeeRequestController::updateSignatures
 * @see app/Http/Controllers/EmployeeRequestController.php:504
 * @route '/employee-requests/{employee_request}/signatures'
 */
export const updateSignatures = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateSignatures.url(args, options),
    method: 'post',
})

updateSignatures.definition = {
    methods: ["post"],
    url: '/employee-requests/{employee_request}/signatures',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EmployeeRequestController::updateSignatures
 * @see app/Http/Controllers/EmployeeRequestController.php:504
 * @route '/employee-requests/{employee_request}/signatures'
 */
updateSignatures.url = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee_request: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { employee_request: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee_request: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee_request: typeof args.employee_request === 'object'
                ? args.employee_request.id
                : args.employee_request,
                }

    return updateSignatures.definition.url
            .replace('{employee_request}', parsedArgs.employee_request.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeRequestController::updateSignatures
 * @see app/Http/Controllers/EmployeeRequestController.php:504
 * @route '/employee-requests/{employee_request}/signatures'
 */
updateSignatures.post = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateSignatures.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EmployeeRequestController::updateSignatures
 * @see app/Http/Controllers/EmployeeRequestController.php:504
 * @route '/employee-requests/{employee_request}/signatures'
 */
    const updateSignaturesForm = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateSignatures.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EmployeeRequestController::updateSignatures
 * @see app/Http/Controllers/EmployeeRequestController.php:504
 * @route '/employee-requests/{employee_request}/signatures'
 */
        updateSignaturesForm.post = (args: { employee_request: number | { id: number } } | [employee_request: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateSignatures.url(args, options),
            method: 'post',
        })
    
    updateSignatures.form = updateSignaturesForm
const EmployeeRequestController = { index, create, store, show, edit, update, destroy, print, submit, decide, updateSignatures }

export default EmployeeRequestController