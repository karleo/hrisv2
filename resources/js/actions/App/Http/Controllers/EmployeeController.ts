import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\EmployeeController::businessCard
 * @see app/Http/Controllers/EmployeeController.php:97
 * @route '/employees/{employee}/business-card'
 */
export const businessCard = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: businessCard.url(args, options),
    method: 'get',
})

businessCard.definition = {
    methods: ["get","head"],
    url: '/employees/{employee}/business-card',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeController::businessCard
 * @see app/Http/Controllers/EmployeeController.php:97
 * @route '/employees/{employee}/business-card'
 */
businessCard.url = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { employee: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee: typeof args.employee === 'object'
                ? args.employee.id
                : args.employee,
                }

    return businessCard.definition.url
            .replace('{employee}', parsedArgs.employee.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::businessCard
 * @see app/Http/Controllers/EmployeeController.php:97
 * @route '/employees/{employee}/business-card'
 */
businessCard.get = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: businessCard.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeController::businessCard
 * @see app/Http/Controllers/EmployeeController.php:97
 * @route '/employees/{employee}/business-card'
 */
businessCard.head = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: businessCard.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EmployeeController::index
 * @see app/Http/Controllers/EmployeeController.php:24
 * @route '/employees'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/employees',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeController::index
 * @see app/Http/Controllers/EmployeeController.php:24
 * @route '/employees'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::index
 * @see app/Http/Controllers/EmployeeController.php:24
 * @route '/employees'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeController::index
 * @see app/Http/Controllers/EmployeeController.php:24
 * @route '/employees'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EmployeeController::create
 * @see app/Http/Controllers/EmployeeController.php:51
 * @route '/employees/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/employees/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeController::create
 * @see app/Http/Controllers/EmployeeController.php:51
 * @route '/employees/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::create
 * @see app/Http/Controllers/EmployeeController.php:51
 * @route '/employees/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeController::create
 * @see app/Http/Controllers/EmployeeController.php:51
 * @route '/employees/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EmployeeController::store
 * @see app/Http/Controllers/EmployeeController.php:64
 * @route '/employees'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/employees',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EmployeeController::store
 * @see app/Http/Controllers/EmployeeController.php:64
 * @route '/employees'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::store
 * @see app/Http/Controllers/EmployeeController.php:64
 * @route '/employees'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\EmployeeController::show
 * @see app/Http/Controllers/EmployeeController.php:0
 * @route '/employees/{employee}'
 */
export const show = (args: { employee: string | number } | [employee: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/employees/{employee}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeController::show
 * @see app/Http/Controllers/EmployeeController.php:0
 * @route '/employees/{employee}'
 */
show.url = (args: { employee: string | number } | [employee: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    employee: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee: args.employee,
                }

    return show.definition.url
            .replace('{employee}', parsedArgs.employee.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::show
 * @see app/Http/Controllers/EmployeeController.php:0
 * @route '/employees/{employee}'
 */
show.get = (args: { employee: string | number } | [employee: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeController::show
 * @see app/Http/Controllers/EmployeeController.php:0
 * @route '/employees/{employee}'
 */
show.head = (args: { employee: string | number } | [employee: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EmployeeController::edit
 * @see app/Http/Controllers/EmployeeController.php:118
 * @route '/employees/{employee}/edit'
 */
export const edit = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/employees/{employee}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmployeeController::edit
 * @see app/Http/Controllers/EmployeeController.php:118
 * @route '/employees/{employee}/edit'
 */
edit.url = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { employee: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee: typeof args.employee === 'object'
                ? args.employee.id
                : args.employee,
                }

    return edit.definition.url
            .replace('{employee}', parsedArgs.employee.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::edit
 * @see app/Http/Controllers/EmployeeController.php:118
 * @route '/employees/{employee}/edit'
 */
edit.get = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmployeeController::edit
 * @see app/Http/Controllers/EmployeeController.php:118
 * @route '/employees/{employee}/edit'
 */
edit.head = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\EmployeeController::update
 * @see app/Http/Controllers/EmployeeController.php:137
 * @route '/employees/{employee}'
 */
export const update = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/employees/{employee}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\EmployeeController::update
 * @see app/Http/Controllers/EmployeeController.php:137
 * @route '/employees/{employee}'
 */
update.url = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { employee: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee: typeof args.employee === 'object'
                ? args.employee.id
                : args.employee,
                }

    return update.definition.url
            .replace('{employee}', parsedArgs.employee.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::update
 * @see app/Http/Controllers/EmployeeController.php:137
 * @route '/employees/{employee}'
 */
update.put = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\EmployeeController::update
 * @see app/Http/Controllers/EmployeeController.php:137
 * @route '/employees/{employee}'
 */
update.patch = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\EmployeeController::destroy
 * @see app/Http/Controllers/EmployeeController.php:171
 * @route '/employees/{employee}'
 */
export const destroy = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/employees/{employee}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\EmployeeController::destroy
 * @see app/Http/Controllers/EmployeeController.php:171
 * @route '/employees/{employee}'
 */
destroy.url = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { employee: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { employee: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    employee: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee: typeof args.employee === 'object'
                ? args.employee.id
                : args.employee,
                }

    return destroy.definition.url
            .replace('{employee}', parsedArgs.employee.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::destroy
 * @see app/Http/Controllers/EmployeeController.php:171
 * @route '/employees/{employee}'
 */
destroy.delete = (args: { employee: number | { id: number } } | [employee: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\EmployeeController::destroyDocument
 * @see app/Http/Controllers/EmployeeController.php:187
 * @route '/employees/{employee}/documents/{employee_document}'
 */
export const destroyDocument = (args: { employee: number | { id: number }, employee_document: string | number } | [employee: number | { id: number }, employee_document: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyDocument.url(args, options),
    method: 'delete',
})

destroyDocument.definition = {
    methods: ["delete"],
    url: '/employees/{employee}/documents/{employee_document}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\EmployeeController::destroyDocument
 * @see app/Http/Controllers/EmployeeController.php:187
 * @route '/employees/{employee}/documents/{employee_document}'
 */
destroyDocument.url = (args: { employee: number | { id: number }, employee_document: string | number } | [employee: number | { id: number }, employee_document: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    employee: args[0],
                    employee_document: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        employee: typeof args.employee === 'object'
                ? args.employee.id
                : args.employee,
                                employee_document: args.employee_document,
                }

    return destroyDocument.definition.url
            .replace('{employee}', parsedArgs.employee.toString())
            .replace('{employee_document}', parsedArgs.employee_document.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EmployeeController::destroyDocument
 * @see app/Http/Controllers/EmployeeController.php:187
 * @route '/employees/{employee}/documents/{employee_document}'
 */
destroyDocument.delete = (args: { employee: number | { id: number }, employee_document: string | number } | [employee: number | { id: number }, employee_document: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyDocument.url(args, options),
    method: 'delete',
})
const EmployeeController = { businessCard, index, create, store, show, edit, update, destroy, destroyDocument }

export default EmployeeController